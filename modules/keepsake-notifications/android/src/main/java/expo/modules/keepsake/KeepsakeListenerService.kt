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
    connected = true
    ReplyManager.serviceInstance = this
    // Make sure the watchdog exists even if the user never opens the app after a reboot/update.
    ListenerKeeper.scheduleWatchdog(this)
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
    connected = false
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

  /** One entry of a MessagingStyle notification (WhatsApp, Telegram, Messenger, Signal, SMS…). */
  private data class ChatMsg(val text: String?, val time: Long?, val sender: String?, val type: String?, val hasUri: Boolean)

  private fun readMessages(x: Bundle): List<ChatMsg> {
    val arr = try { x.getParcelableArray(Notification.EXTRA_MESSAGES) } catch (_: Exception) { null } ?: return emptyList()
    val now = System.currentTimeMillis()
    return arr.mapNotNull { p ->
      val b = p as? Bundle ?: return@mapNotNull null
      val time = b.getLong("time", 0L).takeIf { it > MIN_PLAUSIBLE_TIME && it < now + DAY_MS }
      var sender = b.getCharSequence("sender")?.toString()?.trim()
      if (sender.isNullOrEmpty() && Build.VERSION.SDK_INT >= 28) {
        sender = try {
          @Suppress("DEPRECATION")
          (b.getParcelable("sender_person") as? android.app.Person)?.name?.toString()?.trim()
        } catch (_: Exception) { null }
      }
      ChatMsg(
        text = b.getCharSequence("text")?.toString()?.trim(),
        time = time,
        sender = sender?.ifEmpty { null },
        type = b.getString("type"),
        hasUri = b.containsKey("uri"),
      )
    }
  }

  private fun displayText(m: ChatMsg): String? = when {
    !m.text.isNullOrEmpty() -> m.text
    m.type?.startsWith("audio/") == true -> "🎤 Voice note"
    m.type?.startsWith("image/") == true || m.hasUri -> "📷 Photo"
    else -> null
  }

  /** @return true if anything was stored or changed. */
  private fun capture(sbn: StatusBarNotification): Boolean {
    val prefs = CapturePrefs(this)
    if (!prefs.captureEnabled) return false
    val pkg = sbn.packageName ?: return false
    val n = sbn.notification ?: return false
    val x: Bundle = n.extras ?: Bundle()

    if (pkg == packageName || prefs.excluded.contains(pkg)) return false

    val ongoing = n.flags and (Notification.FLAG_ONGOING_EVENT or Notification.FLAG_FOREGROUND_SERVICE) != 0
    if (ongoing && !prefs.captureOngoing) return false

    var title = (x.getCharSequence(Notification.EXTRA_TITLE) ?: x.getCharSequence(Notification.EXTRA_TITLE_BIG))?.toString()?.trim()
    var text = x.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim()
    val big = x.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim()
    val sub = x.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()?.trim()

    // 1. If text is empty, check text lines
    if (text.isNullOrEmpty()) {
      text = x.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.joinToString("\n") { it.toString() }?.trim()
    }

    // 2. MessagingStyle: read every message in the stack, not just the newest one.
    val messages = readMessages(x)
    val convTitle = x.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()?.trim()
    val isGroup = x.getBoolean("android.isGroupConversation", false) ||
      (!convTitle.isNullOrEmpty() && messages.mapNotNull { it.sender }.distinct().size > 1)
    val last = messages.lastOrNull()
    if (last != null) {
      if (title.isNullOrEmpty()) title = last.sender
      if (text.isNullOrEmpty()) text = displayText(last)
    }

    // Check if notification carries a picture but text is still empty (common in WhatsApp, Telegram, etc.)
    if (text.isNullOrEmpty()) {
      val hasPic = x.containsKey(Notification.EXTRA_PICTURE) ||
                   x.containsKey("android.picture") ||
                   x.containsKey("android.pictureIcon") ||
                   x.containsKey("android.largeIcon.big")
      if (hasPic) {
        text = "📷 Photo"
      }
    }

    // 3. Fallback to conversation title or ticker text
    if (title.isNullOrEmpty()) title = convTitle
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

    // Normalize repeated titles like "Name: Name" (common in Teams)
    if (title != null && title.contains(":")) {
      val colonParts = title.split(":")
      if (colonParts.size == 2 && colonParts[0].trim() == colonParts[1].trim()) {
        title = colonParts[0].trim()
      }
    }

    // Skip empty group summary headers only if they carry no actual message content
    val summary = n.flags and Notification.FLAG_GROUP_SUMMARY != 0
    if (summary && prefs.skipGroupSummary && text.isNullOrEmpty() && big.isNullOrEmpty()) {
      return false
    }

    // Nothing readable at all: nothing to save
    if (title.isNullOrEmpty() && text.isNullOrEmpty() && big.isNullOrEmpty()) return false

    // Cache direct reply action for inline replying from the app
    ReplyManager.registerAction(sbn, title)

    val db = NotificationDb.get(this)
    val appName = AppCatalog.label(packageManager, pkg)
    val baseTitle = title
    var changed = false

    // Group chats titled "Group: Sender" carry the NEWEST sender; older messages need their own.
    val titleSenderIdx = baseTitle?.indexOf(':') ?: -1
    val titleHasSender = isGroup && titleSenderIdx > 0
    fun titleFor(m: ChatMsg): String? =
      if (titleHasSender && m.sender != null) "${baseTitle!!.substring(0, titleSenderIdx).trim()}: ${m.sender}" else baseTitle
    fun textFor(m: ChatMsg): String? {
      val body = displayText(m) ?: return null
      return if (isGroup && !titleHasSender && m.sender != null) "${m.sender}: $body" else body
    }

    // ---- Deleted messages ("This message was deleted"), each handled exactly once, so a
    // re-posted or re-synced notification never marks another (innocent) message as deleted.
    fun handleDeletion(eventKey: String, delTitle: String?, delText: String, msgTime: Long?) {
      if (!db.recordDeletionEvent("$pkg|${sbn.key}|$eventKey", System.currentTimeMillis())) return
      changed = true
      val info = db.markLastMessageDeleted(pkg, delTitle, sbn.postTime, delText, msgTime)
      if (info != null) {
        DeletedAlertManager.notifyDeleted(this, info)
        return
      }
      // Original was never captured: keep a visible "deleted" marker in the chat.
      db.insertCaptured(
        NotificationDb.Captured(
          sbnKey = sbn.key, packageName = pkg, appName = appName,
          title = delTitle, text = delText, bigText = null, subText = sub?.ifEmpty { null },
          category = n.category, channelId = n.channelId, groupKey = sbn.groupKey,
          isGroupSummary = summary, isOngoing = ongoing, postedAt = msgTime ?: sbn.postTime,
          contentHash = Hashing.contentHash(pkg, delTitle, delText, eventKey, null),
          isDeleted = true, deletedAt = sbn.postTime,
        ),
      )
    }

    val newestIsDeletion: Boolean
    if (messages.isNotEmpty()) {
      messages.forEach { m ->
        if (DeletionMatcher.isDeletionText(m.text)) {
          handleDeletion("${m.time ?: n.`when`}|${m.sender.orEmpty()}", titleFor(m), textFor(m) ?: m.text.orEmpty(), m.time)
        }
      }
      newestIsDeletion = DeletionMatcher.isDeletionText(last?.text)
    } else {
      val delText = listOf(text, big).firstOrNull { DeletionMatcher.isDeletionText(it) }
      if (delText != null) handleDeletion("${n.`when`}|${DeletionMatcher.normalize(delText)}", baseTitle, delText, null)
      newestIsDeletion = delText != null
    }

    // ---- Older messages of the stack (a burst of messages arrives in ONE notification update;
    // only the newest one is in EXTRA_TEXT, the rest were previously lost).
    messages.dropLast(1).forEach { m ->
      val t = m.time ?: return@forEach
      if (DeletionMatcher.isDeletionText(m.text)) return@forEach
      val mText = textFor(m) ?: return@forEach
      val mTitle = titleFor(m)
      val stored = db.insertCaptured(
        NotificationDb.Captured(
          sbnKey = sbn.key, packageName = pkg, appName = appName,
          title = mTitle, text = mText, bigText = null, subText = sub?.ifEmpty { null },
          category = n.category, channelId = n.channelId, groupKey = sbn.groupKey,
          isGroupSummary = false, isOngoing = ongoing, postedAt = t,
          contentHash = Hashing.contentHash(pkg, mTitle, mText, null, sub),
          mediaType = when {
            m.type?.startsWith("audio/") == true -> "audio"
            m.type?.startsWith("image/") == true || m.hasUri -> "image"
            else -> null
          },
          msgTime = t,
        ),
      )
      if (stored) changed = true
    }

    if (newestIsDeletion) return changed

    // ---- Newest message / ordinary notification.
    val lastTime = last?.time
    if (last != null && lastTime != null) {
      // Same shape as the older messages so later re-posts de-duplicate exactly.
      textFor(last)?.let { text = it }
      title = titleFor(last)
    }

    // Try extracting genuine media (photo or audio) from the notification
    val media = extractNotificationMedia(n, x, pkg)

    // Extract sender avatar / profile picture (EXTRA_LARGE_ICON)
    val avatarPath = extractNotificationAvatar(n, x, pkg)

    val record = NotificationDb.Captured(
      sbnKey = sbn.key,
      packageName = pkg,
      appName = appName,
      title = title?.ifEmpty { null },
      text = text?.ifEmpty { null },
      bigText = big?.takeIf { it.isNotEmpty() && it != text },
      subText = sub?.ifEmpty { null },
      category = n.category,
      channelId = n.channelId,
      groupKey = sbn.groupKey,
      isGroupSummary = summary,
      isOngoing = ongoing,
      postedAt = lastTime ?: sbn.postTime,
      contentHash = Hashing.contentHash(pkg, title, text, big, sub),
      mediaPath = media?.path,
      mediaType = media?.type,
      avatarPath = avatarPath,
      msgTime = lastTime,
    )
    return db.insertCaptured(record) || changed
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

  data class ExtractedMedia(val path: String?, val type: String?)

  private fun extractNotificationMedia(n: Notification, extras: Bundle, pkg: String): ExtractedMedia? {
    val prefix = pkg.substringAfterLast('.')

    // 1. EXTRA_MESSAGES ("android.messages") for messaging apps (WhatsApp, Messenger, Telegram)
    try {
      val msgs = extras.getParcelableArray(Notification.EXTRA_MESSAGES)
      if (msgs != null) {
        for (i in msgs.indices.reversed()) {
          val b = msgs[i] as? Bundle ?: continue
          val type = b.getString("type")
          val rawUri = b.get("uri")
          val uri: Uri? = when (rawUri) {
            is Uri -> rawUri
            is String -> try { Uri.parse(rawUri) } catch (_: Exception) { null }
            else -> if (Build.VERSION.SDK_INT >= 33) {
              b.getParcelable("uri", Uri::class.java)
            } else {
              @Suppress("DEPRECATION")
              b.getParcelable("uri") as? Uri
            }
          }
          if (uri != null || type != null) {
            if (type?.startsWith("audio/") == true) {
              val ext = when {
                type.contains("ogg") -> "ogg"
                type.contains("mp3") -> "mp3"
                type.contains("amr") -> "amr"
                type.contains("aac") -> "aac"
                else -> "m4a"
              }
              val path = MediaSaver.saveAudioUri(this, uri, prefix, ext)
              return ExtractedMedia(path, "audio")
            } else if (type?.startsWith("image/") == true || uri != null) {
              val path = MediaSaver.saveUri(this, uri, prefix)
              return ExtractedMedia(path, "image")
            }
          }
        }
      }
    } catch (e: Exception) {
      Log.d(TAG, "EXTRA_MESSAGES media check failed", e)
    }

    // 2. Android 31+ BigPictureStyle (EXTRA_PICTURE_ICON = "android.pictureIcon")
    try {
      val picIcon = extras.get("android.pictureIcon")
      if (picIcon is Icon) {
        val path = MediaSaver.saveIcon(this, picIcon, prefix)
        if (path != null) return ExtractedMedia(path, "image")
      }
    } catch (e: Exception) {
      Log.d(TAG, "EXTRA_PICTURE_ICON check failed", e)
    }

    // 3. EXTRA_PICTURE ("android.picture") - can be Bitmap or Icon or Uri
    try {
      val picObj = extras.get(Notification.EXTRA_PICTURE)
      if (picObj is Bitmap && picObj.width > 24 && picObj.height > 24) {
        val path = MediaSaver.saveBitmap(this, picObj, prefix)
        if (path != null) return ExtractedMedia(path, "image")
      } else if (picObj is Icon) {
        val path = MediaSaver.saveIcon(this, picObj, prefix)
        if (path != null) return ExtractedMedia(path, "image")
      } else if (picObj is Uri) {
        val path = MediaSaver.saveUri(this, picObj, prefix)
        if (path != null) return ExtractedMedia(path, "image")
      } else if (picObj is String && (picObj.startsWith("content://") || picObj.startsWith("file://"))) {
        val path = MediaSaver.saveUri(this, Uri.parse(picObj), prefix)
        if (path != null) return ExtractedMedia(path, "image")
      }
    } catch (e: Exception) {
      Log.d(TAG, "EXTRA_PICTURE check failed", e)
    }

    // 4. EXTRA_LARGE_ICON_BIG ("android.largeIcon.big") - BigPictureStyle expanded large icon
    try {
      val bigLarge = extras.get("android.largeIcon.big")
      if (bigLarge is Bitmap && bigLarge.width > 24 && bigLarge.height > 24) {
        val path = MediaSaver.saveBitmap(this, bigLarge, prefix)
        if (path != null) return ExtractedMedia(path, "image")
      } else if (bigLarge is Icon) {
        val path = MediaSaver.saveIcon(this, bigLarge, prefix)
        if (path != null) return ExtractedMedia(path, "image")
      }
    } catch (e: Exception) {
      Log.d(TAG, "EXTRA_LARGE_ICON_BIG check failed", e)
    }

    // 5. Fallback: Determine mediaType from text or ticker when the sending app
    // only sends the push preview without embedding the media bytes in the notification payload.
    val textStr = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
    val bigTextStr = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
    val tickerStr = n.tickerText?.toString() ?: ""
    val combined = "$textStr $bigTextStr $tickerStr".lowercase()

    val isAudio = combined.contains("🎤") || combined.contains("audio message") ||
                  combined.contains("voice message") || combined.contains("voice note") ||
                  combined.contains("ভয়েস") || combined.contains("অডিও")
    if (isAudio) {
      return ExtractedMedia(null, "audio")
    }

    val isImage = combined.contains("📷") || combined.contains("sent a photo") ||
                  combined.contains("photo") || combined.contains("image") ||
                  combined.contains("ছবি")
    if (isImage) {
      // If a photo was received and no BigPicture was found, try EXTRA_LARGE_ICON as photo thumbnail
      try {
        val largeIconObj = extras.get(Notification.EXTRA_LARGE_ICON) ?: extras.get("android.largeIcon")
        if (largeIconObj is Bitmap && largeIconObj.width > 48 && largeIconObj.height > 48) {
          val path = MediaSaver.saveBitmap(this, largeIconObj, prefix)
          if (path != null) return ExtractedMedia(path, "image")
        } else if (largeIconObj is Icon) {
          val path = MediaSaver.saveIcon(this, largeIconObj, prefix)
          if (path != null) return ExtractedMedia(path, "image")
        }
      } catch (e: Exception) {
        Log.d(TAG, "EXTRA_LARGE_ICON photo check failed", e)
      }
      return ExtractedMedia(null, "image")
    }

    return null
  }

  private fun extractNotificationAvatar(n: Notification, extras: Bundle, pkg: String): String? {
    val prefix = pkg.substringAfterLast('.')
    try {
      val largeIconObj = extras.get(Notification.EXTRA_LARGE_ICON) ?: extras.get("android.largeIcon")
      if (largeIconObj is Bitmap && largeIconObj.width > 24 && largeIconObj.height > 24) {
        return MediaSaver.saveBitmap(this, largeIconObj, "${prefix}_avatar")
      } else if (largeIconObj is Icon) {
        return MediaSaver.saveIcon(this, largeIconObj, "${prefix}_avatar")
      }
    } catch (e: Exception) {
      Log.d(TAG, "extractNotificationAvatar failed", e)
    }
    return null
  }

  companion object {
    private const val TAG = "KeepsakeListener"
    private const val DAY_MS = 24L * 60 * 60 * 1000
    private const val CLEANUP_INTERVAL_MS = 6L * 60 * 60 * 1000
    @Volatile private var lastCleanup = 0L

    /** True while the system has this listener bound (read by DeviceHealth). */
    @Volatile var connected = false
      private set

    /** Message times before 2010 are bogus (some apps send 0 or seconds). */
    private const val MIN_PLAUSIBLE_TIME = 1_262_304_000_000L
  }
}
