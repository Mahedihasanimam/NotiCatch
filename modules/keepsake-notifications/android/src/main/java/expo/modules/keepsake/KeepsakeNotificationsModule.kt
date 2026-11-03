package expo.modules.keepsake

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.ToneGenerator
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.service.notification.NotificationListenerService
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class KeepsakeNotificationsModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  private val db get() = NotificationDb.get(context)
  private var mediaPlayer: MediaPlayer? = null

  override fun definition() = ModuleDefinition {
    Name("KeepsakeNotifications")
    Events("onChange")

    OnCreate {
      ChangeBus.listener = { type ->
        try {
          sendEvent("onChange", mapOf("type" to type))
        } catch (_: Exception) {}
      }
    }
    OnDestroy {
      ChangeBus.listener = null
      try {
        mediaPlayer?.let {
          if (it.isPlaying) it.stop()
          it.release()
        }
        mediaPlayer = null
      } catch (_: Exception) {}
    }

    // ---- access ---------------------------------------------------------------------------
    AsyncFunction("isAccessGranted") {
      try {
        val cn = ComponentName(context, KeepsakeListenerService::class.java)
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        val nmGranted = if (Build.VERSION.SDK_INT >= 27) {
          nm?.isNotificationListenerAccessGranted(cn) ?: false
        } else false
        val compatGranted = NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
        val enabledSetting = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners").orEmpty()
        val settingGranted = enabledSetting.split(":").any {
          ComponentName.unflattenFromString(it)?.packageName == context.packageName
        }
        nmGranted || compatGranted || settingGranted
      } catch (_: Exception) {
        false
      }
    }

    AsyncFunction("postTestNotification") {
      try {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
          ?: return@AsyncFunction false
        val channelId = "noticatch_test_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          val channel = NotificationChannel(
            channelId,
            "NotiCatch Self-Test",
            NotificationManager.IMPORTANCE_DEFAULT,
          ).apply {
            description = "Notification to test NotiCatch capture functionality"
          }
          nm.createNotificationChannel(channel)
        }
        val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val builder = NotificationCompat.Builder(context, channelId)
          .setSmallIcon(android.R.drawable.ic_dialog_info)
          .setContentTitle("NotiCatch Active")
          .setContentText("Notification capture is working! Received at $timeStr")
          .setPriority(NotificationCompat.PRIORITY_DEFAULT)
          .setAutoCancel(true)

        val extras = Bundle()
        extras.putBoolean("expo.modules.keepsake.IS_TEST", true)
        builder.addExtras(extras)

        nm.notify(1001, builder.build())
        true
      } catch (e: Exception) {
        false
      }
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
      NotificationStatusManager.updateStatus(context)
    }

    AsyncFunction("updateStatusNotification") {
      NotificationStatusManager.updateStatus(context)
    }

    AsyncFunction("requestNotificationPermission") {
      if (Build.VERSION.SDK_INT >= 33) {
        val activity = appContext.currentActivity
        if (activity != null) {
          val granted = androidx.core.content.ContextCompat.checkSelfPermission(
            activity,
            android.Manifest.permission.POST_NOTIFICATIONS,
          ) == android.content.pm.PackageManager.PERMISSION_GRANTED
          if (!granted) {
            androidx.core.app.ActivityCompat.requestPermissions(
              activity,
              arrayOf(android.Manifest.permission.POST_NOTIFICATIONS),
              1001,
            )
          }
        }
      }
      NotificationStatusManager.updateStatus(context)
    }

    AsyncFunction("configure") { json: String ->
      CapturePrefs(context).apply(json)
      NotificationStatusManager.updateStatus(context)
    }

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
      db.setFlag("is_favorite", parseIds(idsJson), value).also {
        ChangeBus.emit("updated")
        NotificationStatusManager.updateStatus(context)
      }
    }
    AsyncFunction("setArchived") { idsJson: String, value: Boolean ->
      db.setFlag("is_archived", parseIds(idsJson), value).also {
        ChangeBus.emit("updated")
        NotificationStatusManager.updateStatus(context)
      }
    }
    AsyncFunction("deleteByIds") { idsJson: String ->
      db.deleteByIds(parseIds(idsJson)).also {
        ChangeBus.emit("updated")
        NotificationStatusManager.updateStatus(context)
      }
    }
    AsyncFunction("clearAll") { keepFavorites: Boolean ->
      db.clearAll(keepFavorites).also {
        ChangeBus.emit("updated")
        NotificationStatusManager.updateStatus(context)
      }
    }
    AsyncFunction("runCleanup") { days: Int, keepFavorites: Boolean, keepArchived: Boolean ->
      if (days <= 0) 0
      else db.cleanup(System.currentTimeMillis() - days * 86_400_000L, keepFavorites, keepArchived).also {
        ChangeBus.emit("updated")
        NotificationStatusManager.updateStatus(context)
      }
    }
    AsyncFunction("importRecords") { json: String ->
      val (inserted, skipped) = db.importRecords(JSONArray(json))
      ChangeBus.emit("updated")
      NotificationStatusManager.updateStatus(context)
      JSONObject().put("inserted", inserted).put("skipped", skipped).toString()
    }

    // ---- installed apps -------------------------------------------------------------------
    AsyncFunction("getInstalledApps") { AppCatalog.launcherApps(context).toString() }
    AsyncFunction("getAppIcon") { pkg: String -> AppCatalog.iconBase64(context, pkg) }

    // ---- audio playback --------------------------------------------------------------------
    AsyncFunction("playAudio") { filePath: String ->
      try {
        mediaPlayer?.let {
          if (it.isPlaying) it.stop()
          it.release()
        }
        val mp = MediaPlayer()
        mp.setDataSource(filePath)
        mp.prepare()
        mp.start()
        mp.setOnCompletionListener {
          try {
            it.release()
          } catch (_: Exception) {}
          mediaPlayer = null
          ChangeBus.emit("audio_done")
        }
        mediaPlayer = mp
        true
      } catch (e: Exception) {
        android.util.Log.w("KeepsakeAudio", "Failed to play audio: $filePath", e)
        false
      }
    }

    AsyncFunction("stopAudio") {
      try {
        mediaPlayer?.let {
          if (it.isPlaying) it.stop()
          it.release()
        }
        mediaPlayer = null
        true
      } catch (_: Exception) {
        false
      }
    }

    AsyncFunction("playPreviewTone") {
      try {
        val tg = ToneGenerator(AudioManager.STREAM_MUSIC, 60)
        tg.startTone(ToneGenerator.TONE_PROP_BEEP, 120)
        true
      } catch (_: Exception) {
        false
      }
    }
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
