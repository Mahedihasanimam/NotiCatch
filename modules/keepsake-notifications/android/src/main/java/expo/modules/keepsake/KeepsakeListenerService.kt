package expo.modules.keepsake

import android.app.Notification
import android.content.ComponentName
import android.graphics.Bitmap
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import java.util.concurrent.Executors

/**
 * Receives notifications while the user has granted notification access. The system binds this
 * service (also after reboot), independent of whether the React Native UI is running.
 *
 * Only data that Android exposes to listeners is stored. Notifications with redacted content,
 * or content that the posting app never supplied, cannot be recovered.
 */
class KeepsakeListenerService : NotificationListenerService() {

  // Single thread => captures are processed in order and never block the binder thread.
  private val worker = Executors.newSingleThreadExecutor()

  private fun runOnWorker(action: () -> Unit) {
    if (!worker.isShutdown && !worker.isTerminated) {
      try {
        worker.execute {
          try {
            action()
          } catch (e: Exception) {
            Log.w(TAG, "Worker task failed", e)
          }
        }
      } catch (e: Exception) {
        Log.w(TAG, "Failed to submit worker task", e)
      }
    }
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    ReplyManager.serviceInstance = this
    runOnWorker {
      try {
        // Recover anything posted while we were disconnected (reboot, rebind, revoked-then-granted).
        activeNotifications?.forEach { capture(it) }
        maybeCleanup(force = true)
      } catch (e: Exception) {
        Log.w(TAG, "Initial sync failed", e)
      }
      ChangeBus.emit("connected")
      NotificationStatusManager.updateStatus(this@KeepsakeListenerService)
    }
  }

  override fun onListenerDisconnected() {
    super.onListenerDisconnected()
    ChangeBus.emit("disconnected")
    // NOTE: NEVER call requestRebind here!
    // Calling requestRebind inside onListenerDisconnected causes an infinite connect-disconnect loop,
    // which drains battery rapidly and heats up physical devices.
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    runOnWorker {
      try {
        if (capture(sbn)) {
          ChangeBus.emit("posted")
          NotificationStatusManager.updateStatus(this@KeepsakeListenerService)
          maybeCleanup(force = false)
        }
      } catch (e: Exception) {
        Log.w(TAG, "Capture failed", e)
      }
    }
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?, rankingMap: RankingMap?, reason: Int) {
    if (sbn == null) return
    runOnWorker {
      try {
        NotificationDb.get(this).markRemoved(sbn.key, reason, System.currentTimeMillis())
        ChangeBus.emit("removed")
        NotificationStatusManager.updateStatus(this@KeepsakeListenerService)
      } catch (e: Exception) {
        Log.w(TAG, "Remove tracking failed", e)
      }
    }
  }

  override fun onDestroy() {
    if (ReplyManager.serviceInstance == this) {
      ReplyManager.serviceInstance = null
    }
    try {
      worker.shutdown()
    } catch (_: Exception) {}
    super.onDestroy()
  }

  /** @return true if a new row was stored. */
  private fun capture(sbn: StatusBarNotification): Boolean {
    val prefs = CapturePrefs(this)
    if (!prefs.captureEnabled) return false
    val pkg = sbn.packageName ?: return false
    val n = sbn.notification ?: return false
    val x: Bundle = n.extras ?: Bundle()

    val isTestNotif = x.getBoolean("expo.modules.keepsake.IS_TEST", false)
    if (!isTestNotif && (pkg == packageName || prefs.excluded.contains(pkg))) return false

    val ongoing = n.flags and (Notification.FLAG_ONGOING_EVENT or Notification.FLAG_FOREGROUND_SERVICE) != 0
    if (ongoing && !prefs.captureOngoing && !isTestNotif) return false

    var title = (x.getCharSequence(Notification.EXTRA_TITLE) ?: x.getCharSequence(Notification.EXTRA_TITLE_BIG))?.toString()?.trim()
    var text = x.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()
    val big = x.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim()
    val sub = x.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim()

    // 1. If text is empty, check text lines
    if (text.isNullOrEmpty()) {
      text = x.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.joinToString("\n") { it.toString() }?.trim()
    }

    // 2. MessagingStyle extraction (WhatsApp, Telegram, Google Messages, Signal)
    if (text.isNullOrEmpty()) {
      try {
        val messages = x.getParcelableArray(Notification.EXTRA_MESSAGES)
        if (messages != null && messages.isNotEmpty()) {
          val lastMsg = messages.lastOrNull()
          if (lastMsg is Bundle) {
            val msgText = lastMsg.getCharSequence("text")?.toString()?.trim()
            if (!msgText.isNullOrEmpty()) {
              text = msgText
            }
            if (title.isNullOrEmpty()) {
              val sender = lastMsg.getCharSequence("sender")?.toString()?.trim()
              if (!sender.isNullOrEmpty()) {
                title = sender
              }
            }
          }
        }
      } catch (e: Exception) {
        Log.w(TAG, "EXTRA_MESSAGES extraction failed", e)
      }
    }

    // 3. Fallback to conversation title or ticker text
    if (title.isNullOrEmpty()) {
      title = x.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()?.trim()
    }
    if (text.isNullOrEmpty()) {
      text = x.getCharSequence(Notification.EXTRA_INFO_TEXT)?.toString()?.trim()
    }
    if (text.isNullOrEmpty() && n.tickerText != null) {
      text = n.tickerText.toString().trim()
    }

    // If still missing title, use the app label
    if (title.isNullOrEmpty()) {
      title = AppCatalog.label(packageManager, pkg)
    }

    // Skip empty group summary headers only if they carry no actual message content
    val summary = n.flags and Notification.FLAG_GROUP_SUMMARY != 0
    if (summary && prefs.skipGroupSummary && !isTestNotif && text.isNullOrEmpty() && big.isNullOrEmpty()) {
      return false
    }

    // Nothing readable at all: nothing to save
    if (title.isNullOrEmpty() && text.isNullOrEmpty() && big.isNullOrEmpty()) return false

    // Cache direct reply action for inline replying from the app
    ReplyManager.registerAction(sbn, title)

    // Check for message deletion (e.g. WhatsApp "This message was deleted")
    val isDel = isDeletedMessage(text) || isDeletedMessage(big)
    if (isDel) {
      NotificationDb.get(this).markLastMessageDeleted(pkg, title, sbn.postTime)
    }

    // Try extracting genuine media picture from the notification
    val mediaPath = extractNotificationImage(n, x, pkg)
    val mediaType = if (mediaPath != null) "image" else null

    val record = NotificationDb.Captured(
      sbnKey = sbn.key,
      packageName = pkg,
      appName = AppCatalog.label(packageManager, pkg),
      title = title?.ifEmpty { null },
      text = text?.ifEmpty { null },
      bigText = big?.takeIf { it.isNotEmpty() && it != text },
      subText = sub?.ifEmpty { null },
      category = n.category,
      channelId = n.channelId,
      groupKey = sbn.groupKey,
      isGroupSummary = summary,
      isOngoing = ongoing,
      postedAt = sbn.postTime,
      contentHash = Hashing.contentHash(pkg, title, text, big, sub),
      mediaPath = mediaPath,
      mediaType = mediaType,
      isDeleted = isDel,
      deletedAt = if (isDel) sbn.postTime else null,
    )
    return NotificationDb.get(this).insertCaptured(record)
  }

  private fun isDeletedMessage(text: String?): Boolean {
    if (text.isNullOrEmpty()) return false
    val lower = text.trim().lowercase()
    return DELETION_PHRASES.any { lower.contains(it) } ||
      (lower.contains("message") && lower.contains("deleted")) ||
      (lower.contains("মুছে") && (lower.contains("মেসেজ") || lower.contains("বার্তা")))
  }

  private fun maybeCleanup(force: Boolean) {
    val prefs = CapturePrefs(this)
    val days = prefs.retentionDays
    if (days <= 0) return
    val now = System.currentTimeMillis()
    if (!force && now - lastCleanup < CLEANUP_INTERVAL_MS) return
    lastCleanup = now
    val deleted = NotificationDb.get(this).cleanup(now - days * DAY_MS, prefs.keepFavorites, prefs.keepArchived)
    if (deleted > 0) ChangeBus.emit("cleanup")
  }

  private fun extractNotificationImage(n: Notification, extras: Bundle, pkg: String): String? {
    val prefix = pkg.substringAfterLast('.')

    // 1. Android 31+ BigPictureStyle (EXTRA_PICTURE_ICON = "android.pictureIcon")
    try {
      val picIcon = extras.get("android.pictureIcon")
      if (picIcon is Icon) {
        val path = MediaSaver.saveIcon(this, picIcon, prefix)
        if (path != null) return path
      }
    } catch (e: Exception) {
      Log.d(TAG, "EXTRA_PICTURE_ICON check failed", e)
    }

    // 2. EXTRA_PICTURE ("android.picture") - can be Bitmap or Icon
    try {
      val picObj = extras.get(Notification.EXTRA_PICTURE)
      if (picObj is Bitmap && picObj.width > 24 && picObj.height > 24) {
        val path = MediaSaver.saveBitmap(this, picObj, prefix)
        if (path != null) return path
      } else if (picObj is Icon) {
        val path = MediaSaver.saveIcon(this, picObj, prefix)
        if (path != null) return path
      }
    } catch (e: Exception) {
      Log.d(TAG, "EXTRA_PICTURE check failed", e)
    }

    // 3. EXTRA_LARGE_ICON_BIG ("android.largeIcon.big")
    try {
      val bigIconObj = extras.get("android.largeIcon.big")
      if (bigIconObj is Bitmap && bigIconObj.width > 24 && bigIconObj.height > 24) {
        val path = MediaSaver.saveBitmap(this, bigIconObj, prefix)
        if (path != null) return path
      } else if (bigIconObj is Icon) {
        val path = MediaSaver.saveIcon(this, bigIconObj, prefix)
        if (path != null) return path
      }
    } catch (e: Exception) {
      Log.d(TAG, "android.largeIcon.big check failed", e)
    }

    // 4. EXTRA_MESSAGES ("android.messages") for messaging apps (WhatsApp, Messenger, Telegram)
    try {
      val msgs = extras.getParcelableArray(Notification.EXTRA_MESSAGES)
      if (msgs != null) {
        for (i in msgs.indices.reversed()) {
          val b = msgs[i] as? Bundle ?: continue
          val type = b.getString("type")
          val uri = if (Build.VERSION.SDK_INT >= 33) {
            b.getParcelable("uri", Uri::class.java)
          } else {
            @Suppress("DEPRECATION")
            b.getParcelable("uri") as? Uri
          }
          if (uri != null && (type?.startsWith("image/") == true || type == null)) {
            val path = MediaSaver.saveUri(this, uri, prefix)
            if (path != null) return path
          }
        }
      }
    } catch (e: Exception) {
      Log.d(TAG, "EXTRA_MESSAGES uri check failed", e)
    }

    // 5. Check if text or ticker indicates an image message (e.g. contains 📷 or "Image" or "Photo")
    val textStr = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
    val bigTextStr = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
    val tickerStr = n.tickerText?.toString() ?: ""
    val isImageNotification = textStr.contains("📷") || textStr.contains("Photo", ignoreCase = true) ||
                              textStr.contains("Image", ignoreCase = true) ||
                              bigTextStr.contains("📷") || bigTextStr.contains("Photo", ignoreCase = true) ||
                              bigTextStr.contains("Image", ignoreCase = true) ||
                              tickerStr.contains("📷")

    if (isImageNotification) {
      try {
        val largeObj = extras.get(Notification.EXTRA_LARGE_ICON)
        if (largeObj is Bitmap && largeObj.width > 24 && largeObj.height > 24) {
          val path = MediaSaver.saveBitmap(this, largeObj, prefix)
          if (path != null) return path
        } else if (largeObj is Icon) {
          val path = MediaSaver.saveIcon(this, largeObj, prefix)
          if (path != null) return path
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          val icon = n.getLargeIcon()
          if (icon != null) {
            val path = MediaSaver.saveIcon(this, icon, prefix)
            if (path != null) return path
          }
        }
      } catch (e: Exception) {
        Log.d(TAG, "largeIcon for image check failed", e)
      }
    }

    return null
  }

  companion object {
    private const val TAG = "KeepsakeListener"
    private const val DAY_MS = 24L * 60 * 60 * 1000
    private const val CLEANUP_INTERVAL_MS = 6L * 60 * 60 * 1000
    @Volatile private var lastCleanup = 0L

    val DELETION_PHRASES = setOf(
      "this message was deleted",
      "this message was deleted by sender",
      "you deleted this message",
      "message was deleted",
      "message deleted",
      "এই মেসেজটি মুছে ফেলা হয়েছে",
      "এই বার্তাটি মুছে ফেলা হয়েছে",
      "মেসেজ মুছে ফেলা হয়েছে",
      "বার্তা মুছে ফেলা হয়েছে",
      "यह संदेश हटा दिया गया था",
      "यह संदेश हटा दिया गया है",
      "este mensaje fue eliminado",
      "ce message a été supprimé",
      "diese nachricht wurde gelöscht",
      "تم حذف هذه الرسالة",
      "esta mensagem foi apagada",
      "pesan ini telah dihapus",
      "bu mesaj silindi",
      "сообщение удалено",
      "questo messaggio è stato eliminato",
    )
  }
}
