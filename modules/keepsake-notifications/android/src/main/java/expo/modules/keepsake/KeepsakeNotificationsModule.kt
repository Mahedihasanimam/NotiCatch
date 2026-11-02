package expo.modules.keepsake

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.service.notification.NotificationListenerService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class KeepsakeNotificationsModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  private val db get() = NotificationDb.get(context)

  override fun definition() = ModuleDefinition {
    Name("KeepsakeNotifications")
    Events("onChange")

    OnCreate { ChangeBus.listener = { type -> sendEvent("onChange", mapOf("type" to type)) } }
    OnDestroy { ChangeBus.listener = null }

    // ---- access ---------------------------------------------------------------------------
    AsyncFunction("isAccessGranted") {
      val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners").orEmpty()
      enabled.split(":").any { ComponentName.unflattenFromString(it)?.packageName == context.packageName }
    }

    AsyncFunction("openAccessSettings") {
      val detail = Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
        .putExtra(
          Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME,
          ComponentName(context, KeepsakeListenerService::class.java).flattenToString(),
        )
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        context.startActivity(detail)
      } catch (_: Exception) {
        context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }

    // Android 13+ blocks notification access for sideloaded apps until "Allow restricted settings".
    AsyncFunction("openAppSettings") {
      context.startActivity(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
    }

    AsyncFunction("requestRebind") {
      NotificationListenerService.requestRebind(ComponentName(context, KeepsakeListenerService::class.java))
    }

    AsyncFunction("configure") { json: String -> CapturePrefs(context).apply(json) }

    // ---- reads ----------------------------------------------------------------------------
    AsyncFunction("query") { json: String -> db.query(parseQuery(json)).toString() }
    AsyncFunction("count") { json: String -> db.count(parseQuery(json)) }
    AsyncFunction("getByIds") { json: String -> db.getByIds(parseIds(json)).toString() }
    AsyncFunction("getAppSummaries") { db.appSummaries().toString() }
    AsyncFunction("getConversations") { db.conversations().toString() }
    AsyncFunction("getConversationMessages") { pkg: String, title: String ->
      db.conversationMessages(pkg, title).toString()
    }
    AsyncFunction("getStats") { dayStartsJson: String, dayEnd: Double ->
      db.stats(parseIds(dayStartsJson), dayEnd.toLong()).toString()
    }

    // ---- direct reply ---------------------------------------------------------------------
    AsyncFunction("canReply") { sbnKey: String?, chatKey: String? ->
      ReplyManager.canReply(sbnKey, chatKey)
    }
    AsyncFunction("sendReply") { sbnKey: String?, chatKey: String?, text: String ->
      ReplyManager.sendReply(context, sbnKey, chatKey, text)
    }

    // ---- writes ---------------------------------------------------------------------------
    AsyncFunction("setFavorite") { idsJson: String, value: Boolean ->
      db.setFlag("is_favorite", parseIds(idsJson), value).also { ChangeBus.emit("updated") }
    }
    AsyncFunction("setArchived") { idsJson: String, value: Boolean ->
      db.setFlag("is_archived", parseIds(idsJson), value).also { ChangeBus.emit("updated") }
    }
    AsyncFunction("deleteByIds") { idsJson: String ->
      db.deleteByIds(parseIds(idsJson)).also { ChangeBus.emit("updated") }
    }
    AsyncFunction("clearAll") { keepFavorites: Boolean ->
      db.clearAll(keepFavorites).also { ChangeBus.emit("updated") }
    }
    AsyncFunction("runCleanup") { days: Int, keepFavorites: Boolean, keepArchived: Boolean ->
      if (days <= 0) 0
      else db.cleanup(System.currentTimeMillis() - days * 86_400_000L, keepFavorites, keepArchived).also { ChangeBus.emit("updated") }
    }
    AsyncFunction("importRecords") { json: String ->
      val (inserted, skipped) = db.importRecords(JSONArray(json))
      ChangeBus.emit("updated")
      JSONObject().put("inserted", inserted).put("skipped", skipped).toString()
    }

    // ---- installed apps -------------------------------------------------------------------
    AsyncFunction("getInstalledApps") { AppCatalog.launcherApps(context).toString() }
    AsyncFunction("getAppIcon") { pkg: String -> AppCatalog.iconBase64(context, pkg) }
  }

  private fun parseIds(json: String): List<Long> {
    val a = JSONArray(json)
    return List(a.length()) { a.getLong(it) }
  }

  private fun parseQuery(json: String): QueryOptions {
    val o = JSONObject(json)
    val pk = o.optJSONArray("packages") ?: JSONArray()
    return QueryOptions(
      search = o.optStringOrNull("search"),
      packages = List(pk.length()) { pk.getString(it) },
      from = if (o.has("from") && !o.isNull("from")) o.getLong("from") else null,
      to = if (o.has("to") && !o.isNull("to")) o.getLong("to") else null,
      favoritesOnly = o.optBoolean("favoritesOnly", false),
      deletedOnly = o.optBoolean("deletedOnly", false),
      archived = ArchiveMode.parse(o.optStringOrNull("archived")),
      limit = o.optInt("limit", 100),
      offset = o.optInt("offset", 0),
    )
  }
}
