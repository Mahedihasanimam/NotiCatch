package expo.modules.keepsake

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.util.Base64
import android.util.LruCache
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

object AppCatalog {
  private const val ICON_SIZE = 96
  private val iconCache = LruCache<String, String>(256)
  private val labelCache = LruCache<String, String>(512)

  fun label(pm: PackageManager, pkg: String): String {
    labelCache.get(pkg)?.let { return it }
    val label = try {
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (_: Exception) {
      pkg // package not visible or uninstalled: fall back to the package name
    }
    labelCache.put(pkg, label)
    return label
  }

  fun launcherApps(context: Context): JSONArray {
    val pm = context.packageManager
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val seen = HashSet<String>()
    val list = pm.queryIntentActivities(intent, 0)
      .mapNotNull { ri ->
        val pkg = ri.activityInfo.packageName
        if (pkg == context.packageName || !seen.add(pkg)) null
        else pkg to ri.loadLabel(pm).toString()
      }
      .sortedBy { it.second.lowercase() }
    val out = JSONArray()
    list.forEach { (pkg, label) -> out.put(JSONObject().put("packageName", pkg).put("label", label)) }
    return out
  }

  /** PNG (base64, no wrapping) or null when the package has no resolvable icon. */
  fun iconBase64(context: Context, pkg: String): String? {
    iconCache.get(pkg)?.let { return it }
    return try {
      val drawable = context.packageManager.getApplicationIcon(pkg)
      val bmp = if (drawable is BitmapDrawable && drawable.bitmap != null) {
        Bitmap.createScaledBitmap(drawable.bitmap, ICON_SIZE, ICON_SIZE, true)
      } else {
        Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888).also {
          val canvas = Canvas(it)
          drawable.setBounds(0, 0, ICON_SIZE, ICON_SIZE)
          drawable.draw(canvas)
        }
      }
      val bos = ByteArrayOutputStream()
      bmp.compress(Bitmap.CompressFormat.PNG, 100, bos)
      Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP).also { iconCache.put(pkg, it) }
    } catch (_: Exception) {
      null
    }
  }
}
