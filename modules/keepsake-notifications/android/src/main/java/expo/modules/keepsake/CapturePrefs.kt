package expo.modules.keepsake

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** Capture configuration mirrored from JS so the service works while the app UI is not running. */
class CapturePrefs(context: Context) {
  private val prefs = context.applicationContext.getSharedPreferences("keepsake_capture", Context.MODE_PRIVATE)

  val captureEnabled: Boolean get() = prefs.getBoolean("captureEnabled", true)
  val captureOngoing: Boolean get() = prefs.getBoolean("captureOngoing", false)
  val skipGroupSummary: Boolean get() = prefs.getBoolean("skipGroupSummary", true)
  val retentionDays: Int get() = prefs.getInt("retentionDays", 0) // 0 = never
  val keepFavorites: Boolean get() = prefs.getBoolean("keepFavorites", true)
  val keepArchived: Boolean get() = prefs.getBoolean("keepArchived", true)
  val statusBarNotification: Boolean get() = prefs.getBoolean("statusBarNotification", true)
  val excluded: Set<String> get() = prefs.getStringSet("excluded", emptySet()) ?: emptySet()

  fun apply(json: String) {
    val o = JSONObject(json)
    val excludedSet = HashSet<String>()
    val arr: JSONArray = o.optJSONArray("excludedPackages") ?: JSONArray()
    for (i in 0 until arr.length()) excludedSet.add(arr.getString(i))
    prefs.edit()
      .putBoolean("captureEnabled", o.optBoolean("captureEnabled", true))
      .putBoolean("captureOngoing", o.optBoolean("captureOngoing", false))
      .putBoolean("skipGroupSummary", o.optBoolean("skipGroupSummary", true))
      .putInt("retentionDays", o.optInt("retentionDays", 0))
      .putBoolean("keepFavorites", o.optBoolean("keepFavorites", true))
      .putBoolean("keepArchived", o.optBoolean("keepArchived", true))
      .putBoolean("statusBarNotification", o.optBoolean("statusBarNotification", true))
      .putStringSet("excluded", excludedSet)
      .apply()
  }
}
