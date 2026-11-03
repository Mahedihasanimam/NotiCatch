package expo.modules.keepsake

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Manages the ongoing status notification in Android's notification shade/tray (like Notisave).
 * Displays live count of saved notifications, NotiCatch's logo, the last captured app's icon, and time.
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

      val text = if (count == 1) {
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

      val smallIconRes = try {
        val resId = context.resources.getIdentifier("ic_stat_noticatch", "drawable", context.packageName)
        if (resId != 0) resId else expo.modules.keepsake.R.drawable.ic_stat_noticatch
      } catch (_: Exception) {
        val resId = context.resources.getIdentifier("ic_stat_noticatch", "drawable", context.packageName)
        if (resId != 0) resId else (if (context.applicationInfo.icon != 0) context.applicationInfo.icon else android.R.drawable.ic_dialog_info)
      }

      val appLabel = try {
        context.packageManager.getApplicationLabel(context.applicationInfo).toString()
      } catch (_: Exception) {
        "NotiCatch"
      }

      val builder = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(smallIconRes)
        .setColor(0xFF0A6C74.toInt())
        .setContentTitle(appLabel)
        .setContentText(text)
        .setSubText(timeStr)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setCategory(NotificationCompat.CATEGORY_STATUS)
        .setContentIntent(pendingIntent)
        .setShowWhen(false)

      // Right side large icon: show captured app's icon, or NotiCatch's colorful logo
      if (latest != null && latest.first != context.packageName) {
        val capturedAppIcon = getAppIconBitmap(context, latest.first, 96)
        if (capturedAppIcon != null) {
          builder.setLargeIcon(capturedAppIcon)
        }
      } else {
        val noticatchIcon = getAppIconBitmap(context, context.packageName, 96)
        if (noticatchIcon != null) {
          builder.setLargeIcon(noticatchIcon)
        }
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

  private fun getAppIconBitmap(context: Context, packageName: String, size: Int = 128): Bitmap? {
    return try {
      val pm = context.packageManager
      val drawable = pm.getApplicationIcon(packageName)
      drawableToBitmap(drawable, size, size)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to get icon for $packageName", e)
      null
    }
  }

  private fun drawableToBitmap(drawable: Drawable, width: Int, height: Int): Bitmap {
    if (drawable is BitmapDrawable && drawable.bitmap != null) {
      return Bitmap.createScaledBitmap(drawable.bitmap, width, height, true)
    }
    val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    drawable.setBounds(0, 0, width, height)
    drawable.draw(canvas)
    return bmp
  }

  private fun drawRoundedIcon(canvas: Canvas, icon: Bitmap, rect: RectF, cornerRadius: Float) {
    try {
      val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
      val scaled = Bitmap.createScaledBitmap(icon, rect.width().toInt().coerceAtLeast(1), rect.height().toInt().coerceAtLeast(1), true)
      val shader = BitmapShader(scaled, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
      val matrix = Matrix()
      matrix.setTranslate(rect.left, rect.top)
      shader.setLocalMatrix(matrix)
      paint.shader = shader
      canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint)
    } catch (e: Exception) {
      Log.w(TAG, "Failed to draw rounded icon", e)
    }
  }

  private fun createStatusLargeIcon(context: Context, latestPackage: String?): Bitmap? {
    try {
      val noticatchLogo = getAppIconBitmap(context, context.packageName, 128) ?: return null
      val capturedAppIcon = if (latestPackage != null && latestPackage != context.packageName) {
        getAppIconBitmap(context, latestPackage, 128)
      } else {
        null
      }

      val canvasSize = 128
      val outBmp = Bitmap.createBitmap(canvasSize, canvasSize, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(outBmp)

      if (capturedAppIcon != null) {
        // Two icons side-by-side matching Notisave (both inside circular/squircle mask)
        // Left: NotiCatch logo
        val leftRect = RectF(10f, 38f, 62f, 90f)
        drawRoundedIcon(canvas, noticatchLogo, leftRect, 12f)

        // Right: Captured app logo
        val rightRect = RectF(66f, 38f, 118f, 90f)
        drawRoundedIcon(canvas, capturedAppIcon, rightRect, 12f)
      } else {
        // Single NotiCatch logo centered
        val fullRect = RectF(14f, 14f, 114f, 114f)
        drawRoundedIcon(canvas, noticatchLogo, fullRect, 22f)
      }

      return outBmp
    } catch (e: Exception) {
      Log.w(TAG, "Failed to create status large icon", e)
      return null
    }
  }
}

