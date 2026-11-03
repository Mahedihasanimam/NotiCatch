package expo.modules.keepsake

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Icon
import android.net.Uri
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

object MediaSaver {
  private const val TAG = "KeepsakeMediaSaver"

  fun saveBitmap(context: Context, bitmap: Bitmap, prefix: String = "img"): String? {
    return try {
      val dir = File(context.filesDir, "saved_media").apply { if (!exists()) mkdirs() }
      val filename = "${prefix}_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(6)}.jpg"
      val file = File(dir, filename)
      FileOutputStream(file).use { out ->
        bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
      }
      file.absolutePath
    } catch (e: Exception) {
      Log.w(TAG, "Failed to save bitmap", e)
      null
    }
  }

  fun saveIcon(context: Context, icon: Icon?, prefix: String = "img"): String? {
    if (icon == null) return null
    return try {
      val drawable = icon.loadDrawable(context) ?: return null
      if (drawable is BitmapDrawable && drawable.bitmap != null) {
        saveBitmap(context, drawable.bitmap, prefix)
      } else {
        val w = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 240
        val h = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 240
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        saveBitmap(context, bmp, prefix)
      }
    } catch (e: Exception) {
      Log.w(TAG, "Failed to load/save icon", e)
      null
    }
  }

  fun saveUri(context: Context, uri: Uri?, prefix: String = "img"): String? {
    if (uri == null) return null
    return try {
      context.contentResolver.openInputStream(uri)?.use { stream ->
        val bmp = BitmapFactory.decodeStream(stream)
        if (bmp != null) {
          saveBitmap(context, bmp, prefix)
        } else null
      }
    } catch (e: Exception) {
      Log.w(TAG, "Failed to load/save uri: $uri", e)
      null
    }
  }

  fun saveAudioUri(context: Context, uri: Uri?, prefix: String = "audio", ext: String = "m4a"): String? {
    if (uri == null) return null
    return try {
      val dir = File(context.filesDir, "saved_media").apply { if (!exists()) mkdirs() }
      val filename = "${prefix}_${System.currentTimeMillis()}_${UUID.randomUUID().toString().take(6)}.$ext"
      val file = File(dir, filename)
      context.contentResolver.openInputStream(uri)?.use { input ->
        FileOutputStream(file).use { output ->
          input.copyTo(output)
        }
      }
      if (file.exists() && file.length() > 0) {
        file.absolutePath
      } else {
        file.delete()
        null
      }
    } catch (e: Exception) {
      Log.w(TAG, "Failed to load/save audio uri: $uri", e)
      null
    }
  }
}
