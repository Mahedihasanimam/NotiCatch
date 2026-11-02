package expo.modules.keepsake

import android.app.Notification
import android.content.ComponentName
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

  override fun onListenerConnected() {
    super.onListenerConnected()
    ReplyManager.serviceInstance = this
    worker.execute {
      try {
        // Recover anything posted while we were disconnected (reboot, rebind, revoked-then-granted).
        activeNotifications?.forEach { capture(it) }
        maybeCleanup(force = true)
      } catch (e: Exception) {
        Log.w(TAG, "Initial sync failed", e)
      }
      ChangeBus.emit("connected")
    }
  }

  override fun onListenerDisconnected() {
    super.onListenerDisconnected()
    ChangeBus.emit("disconnected")
    // Ask the system to bind us again (no-op if access was revoked).
    try {
      requestRebind(ComponentName(this, KeepsakeListenerService::class.java))
    } catch (e: Exception) {
      Log.w(TAG, "Rebind request failed", e)
    }
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    worker.execute {
      try {
        if (capture(sbn)) {
          ChangeBus.emit("posted")
          maybeCleanup(force = false)
        }
      } catch (e: Exception) {
        Log.w(TAG, "Capture failed", e)
      }
    }
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?, rankingMap: RankingMap?, reason: Int) {
    if (sbn == null) return
    worker.execute {
      try {
        NotificationDb.get(this).markRemoved(sbn.key, reason, System.currentTimeMillis())
        ChangeBus.emit("removed")
      } catch (e: Exception) {
        Log.w(TAG, "Remove tracking failed", e)
      }
    }
  }

  override fun onDestroy() {
    if (ReplyManager.serviceInstance == this) {
      ReplyManager.serviceInstance = null
    }
    worker.shutdown()
    super.onDestroy()
  }

  /** @return true if a new row was stored. */
  private fun capture(sbn: StatusBarNotification): Boolean {
    val prefs = CapturePrefs(this)
    if (!prefs.captureEnabled) return false
    val pkg = sbn.packageName ?: return false
    if (pkg == packageName || prefs.excluded.contains(pkg)) return false

    val n = sbn.notification ?: return false
    val ongoing = n.flags and (Notification.FLAG_ONGOING_EVENT or Notification.FLAG_FOREGROUND_SERVICE) != 0
    if (ongoing && !prefs.captureOngoing) return false
    val summary = n.flags and Notification.FLAG_GROUP_SUMMARY != 0
    if (summary && prefs.skipGroupSummary) return false

    val x: Bundle = n.extras ?: return false
    val title = (x.getCharSequence(Notification.EXTRA_TITLE) ?: x.getCharSequence(Notification.EXTRA_TITLE_BIG))?.toString()?.trim()
    var text = x.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()
    val big = x.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim()
    val sub = x.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim()
    if (text.isNullOrEmpty()) {
      text = x.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.joinToString("\n") { it.toString() }?.trim()
    }
    // Nothing readable (content hidden/redacted by the system or never provided): nothing to save.
    if (title.isNullOrEmpty() && text.isNullOrEmpty() && big.isNullOrEmpty()) return false

    // Cache direct reply action for inline replying from the app
    ReplyManager.registerAction(sbn, title)

    // Check for message deletion (e.g. WhatsApp "This message was deleted")
    val isDel = isDeletedMessage(text) || isDeletedMessage(big)
    if (isDel) {
      NotificationDb.get(this).markLastMessageDeleted(pkg, title, sbn.postTime)
    }

    // Try extracting media picture from the notification
    var mediaPath: String? = null
    var mediaType: String? = null
    try {
      val bmp = if (android.os.Build.VERSION.SDK_INT >= 33) {
        x.getParcelable(Notification.EXTRA_PICTURE, android.graphics.Bitmap::class.java)
      } else {
        @Suppress("DEPRECATION")
        x.getParcelable(Notification.EXTRA_PICTURE) as? android.graphics.Bitmap
      }
      if (bmp != null) {
        mediaPath = MediaSaver.saveBitmap(this, bmp, pkg.substringAfterLast('.'))
        mediaType = "image"
      } else if (android.os.Build.VERSION.SDK_INT >= 31) {
        val icon = x.getParcelable(Notification.EXTRA_PICTURE_ICON, android.graphics.drawable.Icon::class.java)
        if (icon != null) {
          mediaPath = MediaSaver.saveIcon(this, icon, pkg.substringAfterLast('.'))
          if (mediaPath != null) mediaType = "image"
        }
      }
    } catch (e: Exception) {
      Log.w(TAG, "Media extraction failed", e)
    }

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
