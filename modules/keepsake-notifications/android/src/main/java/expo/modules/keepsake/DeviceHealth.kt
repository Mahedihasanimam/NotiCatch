package expo.modules.keepsake

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import org.json.JSONObject

/**
 * Helps users keep the listener alive on OEM skins (MIUI/HyperOS, ColorOS, Funtouch, One UI,
 * Transsion HiOS/XOS …) that kill background services. Nothing here needs extra permissions:
 * we only open settings screens, we never request REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
 * (that permission is restricted by Google Play policy).
 */
object DeviceHealth {

  /** Normalized OEM family, used by the JS side to pick instructions. */
  fun brand(): String {
    val m = (Build.MANUFACTURER ?: "").lowercase()
    return when {
      m.contains("xiaomi") || m.contains("redmi") || m.contains("poco") -> "xiaomi"
      m.contains("samsung") -> "samsung"
      m.contains("oppo") || m.contains("realme") || m.contains("oneplus") -> "oppo"
      m.contains("vivo") || m.contains("iqoo") -> "vivo"
      m.contains("huawei") || m.contains("honor") -> "huawei"
      m.contains("infinix") || m.contains("tecno") || m.contains("itel") -> "transsion"
      else -> "other"
    }
  }

  fun isIgnoringBatteryOptimizations(context: Context): Boolean {
    val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return true
    return pm.isIgnoringBatteryOptimizations(context.packageName)
  }

  fun status(context: Context): JSONObject {
    val latest = try { NotificationDb.get(context).getLatestCapturedApp() } catch (_: Exception) { null }
    return JSONObject().apply {
      put("brand", brand())
      put("manufacturer", Build.MANUFACTURER ?: "")
      put("sdk", Build.VERSION.SDK_INT)
      put("batteryUnrestricted", isIgnoringBatteryOptimizations(context))
      put("listenerConnected", KeepsakeListenerService.connected)
      put("lastCapturedAt", latest?.second ?: JSONObject.NULL)
      put("hasAutostartScreen", autostartIntents().any { canResolve(context, it) })
    }
  }

  /** Opens the system battery optimization list (user picks "Don't optimize" / "Unrestricted"). */
  fun openBatterySettings(context: Context): Boolean {
    val candidates = listOf(
      Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS),
      appDetails(context),
    )
    return startFirst(context, candidates)
  }

  /** Opens the OEM "autostart / background launch" screen, falling back to App info. */
  fun openAutostartSettings(context: Context): Boolean =
    startFirst(context, autostartIntents() + appDetails(context))

  private fun autostartIntents(): List<Intent> = listOf(
    // Xiaomi / Redmi / POCO (MIUI, HyperOS)
    cmp("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"),
    // OPPO / Realme / OnePlus (ColorOS)
    cmp("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"),
    cmp("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"),
    cmp("com.oplus.safecenter", "com.oplus.safecenter.permission.startup.StartupAppListActivity"),
    cmp("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"),
    // vivo / iQOO
    cmp("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"),
    cmp("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"),
    // Huawei / Honor
    cmp("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"),
    // Samsung (Device care → Battery)
    cmp("com.samsung.android.lool", "com.samsung.android.sm.battery.ui.BatteryActivity"),
    // Infinix / TECNO / itel (Phone Master)
    cmp("com.transsion.phonemaster", "com.cyin.himgr.autostart.AutoStartActivity"),
  )

  private fun cmp(pkg: String, cls: String) =
    Intent().setComponent(ComponentName(pkg, cls)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

  private fun appDetails(context: Context) =
    Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

  @Suppress("DEPRECATION")
  private fun canResolve(context: Context, intent: Intent): Boolean = try {
    context.packageManager.resolveActivity(intent, 0) != null
  } catch (_: Exception) {
    false
  }

  private fun startFirst(context: Context, intents: List<Intent>): Boolean {
    for (i in intents) {
      try {
        context.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        return true
      } catch (_: Exception) {
        // Not present on this ROM / not exported: try the next one.
      }
    }
    return false
  }
}
