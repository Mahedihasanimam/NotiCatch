package expo.modules.keepsake

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Manages the ongoing status notification in Android's notification shade/tray (like Notisave).
 * Displays live count of saved notifications, the last captured app's icon, and time.
 */
object NotificationStatusManager {
  private const val TAG = "NotificationStatus"
  private const val CHANNEL_ID = "noticatch_status_channel"
  private const val NOTIFICATION_ID = 2001
  private val timeFormat = SimpleDateFormat("a h:mm", Locale.getDefault())

  fun updateStatus(context: Context) {
    try {
      val prefs = CapturePrefs(context)
      val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

      if (!prefs.statusBarNotification) {
        nm.cancel(NOTIFICATION_ID)
        return
      }

      // Check if notification channel needs creation (Android 8.0+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val existing = nm.getNotificationChannel(CHANNEL_ID)
        if (existing == null) {
          val channel = NotificationChannel(
            CHANNEL_ID,
            "Service Status",
            NotificationManager.IMPORTANCE_LOW,
          ).apply {
            description = "Shows live count of saved notifications in the status bar (Silent)"
            setShowBadge(false)
            enableLights(false)
            enableVibration(false)
            setSound(null, null)
          }
          nm.createNotificationChannel(channel)
        }
      }

      val db = NotificationDb.get(context)
      val count = db.totalUnarchivedCount()
      val latest = db.getLatestCapturedApp()

      val text = if (count == 0) {
        "Listening for notifications"
      } else if (count == 1) {
        "1 notification saved"
      } else {
        "$count notifications saved"
      }

      val timeStr = if (latest != null && latest.second > 0) {
        timeFormat.format(Date(latest.second)).lowercase()
      } else {
        timeFormat.format(Date()).lowercase()
      }

      // Launch MainActivity when tapped
      val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent()
      launchIntent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      val pendingIntent = PendingIntent.getActivity(
        context,
        0,
        launchIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) PendingIntent.FLAG_IMMUTABLE else 0),
      )

      val iconRes = if (context.applicationInfo.icon != 0) context.applicationInfo.icon else android.R.drawable.ic_dialog_info

      val appLabel = try {
        context.packageManager.getApplicationLabel(context.applicationInfo).toString()
      } catch (_: Exception) {
        "NotiCatch"
      }

      val builder = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(iconRes)
        .setContentTitle(appLabel)
        .setContentText(text)
        .setSubText(timeStr)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setCategory(NotificationCompat.CATEGORY_STATUS)
        .setContentIntent(pendingIntent)
        .setShowWhen(false)

      // Try setting latest captured app's icon as large icon (matching Notisave screenshot)
      if (latest != null) {
        try {
          val drawable = context.packageManager.getApplicationIcon(latest.first)
          if (drawable is BitmapDrawable && drawable.bitmap != null) {
            builder.setLargeIcon(drawable.bitmap)
          } else {
            val bmp = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bmp)
            drawable.setBounds(0, 0, 96, 96)
            drawable.draw(canvas)
            builder.setLargeIcon(bmp)
          }
        } catch (_: Exception) {}
      }

      nm.notify(NOTIFICATION_ID, builder.build())
    } catch (e: Exception) {
      Log.w(TAG, "Failed to update status notification", e)
    }
  }

  fun cancel(context: Context) {
    try {
      val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      nm?.cancel(NOTIFICATION_ID)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to cancel status notification", e)
    }
  }
}

