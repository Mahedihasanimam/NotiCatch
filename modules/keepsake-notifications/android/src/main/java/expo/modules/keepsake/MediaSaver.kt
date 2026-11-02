package expo.modules.keepsake

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Icon
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
      val drawable = icon.loadDrawable(context)
      if (drawable is BitmapDrawable && drawable.bitmap != null) {
        saveBitmap(context, drawable.bitmap, prefix)
      } else {
        null
      }
    } catch (e: Exception) {
      Log.w(TAG, "Failed to load/save icon", e)
      null
    }
  }
}

