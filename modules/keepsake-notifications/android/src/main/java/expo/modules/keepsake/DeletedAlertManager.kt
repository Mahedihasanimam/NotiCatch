package expo.modules.keepsake

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Sends a high-priority system notification to the user whenever NotiCatch
 * detects that a sender has deleted a message in WhatsApp, Messenger, etc.
 */
object DeletedAlertManager {
  private const val TAG = "DeletedAlertManager"
  private const val CHANNEL_ID = "noticatch_deleted_channel"

  fun notifyDeleted(context: Context, info: NotificationDb.DeletedMessageInfo) {
    try {
      val prefs = CapturePrefs(context)
      if (!prefs.notifyOnDeleted) return

      val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

      // Create high-importance alert channel on Android 8.0+
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val existing = nm.getNotificationChannel(CHANNEL_ID)
        if (existing == null) {
          val channel = NotificationChannel(
            CHANNEL_ID,
            "Deleted Message Alerts",
            NotificationManager.IMPORTANCE_HIGH,
          ).apply {
            description = "Instant alerts when someone deletes a message in WhatsApp, Messenger, etc."
            enableLights(true)
            enableVibration(true)
            setShowBadge(true)
          }
          nm.createNotificationChannel(channel)
        }
      }

      val sender = info.senderName?.ifEmpty { null } ?: info.appName
      val appName = info.appName.ifEmpty { "Messaging" }
      val title = "⚠️ $sender deleted a message ($appName)"

      val contentText = when {
        !info.originalText.isNullOrBlank() -> "NotiCatch saved: \"${info.originalText}\""
        info.mediaType == "image" -> "NotiCatch saved a deleted photo 📷"
        info.mediaType == "audio" -> "NotiCatch saved a deleted voice note 🎤"
        else -> "Recovered and saved by NotiCatch"
      }

      val expandedText = when {
        !info.originalText.isNullOrBlank() -> "NotiCatch recovered this deleted message:\n\n\"${info.originalText}\"\n\nFrom: $sender ($appName)"
        info.mediaType == "image" -> "NotiCatch safely recovered a deleted photo from $sender ($appName) 📷"
        info.mediaType == "audio" -> "NotiCatch safely recovered a deleted voice note from $sender ($appName) 🎤"
        else -> "A deleted message was recovered and preserved by NotiCatch."
      }

      // Launch MainActivity when tapped
      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent()
      launchIntent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      launchIntent.putExtra("target_screen", "chat_thread")
      launchIntent.putExtra("package_name", info.packageName)
      launchIntent.putExtra("title", info.senderName ?: "")
      launchIntent.putExtra("notification_id", info.id)

      val requestCode = (System.currentTimeMillis() % 10000).toInt()
      val pendingIntent = PendingIntent.getActivity(
        context,
        requestCode,
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0),
      )

      val smallIconRes = try {
        val resId = context.resources.getIdentifier("ic_stat_noticatch", "drawable", context.packageName)
        if (resId != 0) resId else (if (context.applicationInfo.icon != 0) context.applicationInfo.icon else android.R.drawable.ic_dialog_alert)
      } catch (_: Exception) {
        if (context.applicationInfo.icon != 0) context.applicationInfo.icon else android.R.drawable.ic_dialog_alert
      }

      val notif = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(smallIconRes)
        .setContentTitle(title)
        .setContentText(contentText)
        .setStyle(NotificationCompat.BigTextStyle().bigText(expandedText))
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setDefaults(NotificationCompat.DEFAULT_ALL)
        .build()

      val notifId = (4000 + (info.id % 2000)).toInt()
      nm.notify(notifId, notif)
      Log.d(TAG, "Sent deleted message notification for $sender: $contentText")
    } catch (e: Exception) {
      Log.e(TAG, "Failed to send deleted message alert", e)
    }
  }
}

