package expo.modules.keepsake

import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.service.notification.NotificationListenerService
import android.util.Log
import androidx.core.app.NotificationManagerCompat

/**
 * Keeps the notification listener bound on phones whose battery managers kill it
 * (Xiaomi/Redmi/POCO, OPPO/Realme, vivo, Samsung, Transsion…). After such a kill Android does not
 * always bind the listener again, so capture silently stops until the user opens the app.
 *
 * Three triggers call [ensureBound]: opening the app, a periodic [WatchdogJob] (every ~15 min,
 * survives reboot), and [BootReceiver] (boot + app update, after which some ROMs never rebind).
 */
object ListenerKeeper {
  private const val TAG = "ListenerKeeper"
  private const val WATCHDOG_JOB_ID = 74_201
  private const val WATCHDOG_PERIOD_MS = 15L * 60 * 1000

  private fun component(context: Context) = ComponentName(context, KeepsakeListenerService::class.java)

  fun isAccessGranted(context: Context): Boolean = try {
    NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
  } catch (_: Exception) {
    false
  }

  /** Re-binds the listener if access is granted but the system is not running it. */
  fun ensureBound(context: Context) {
    if (!isAccessGranted(context)) return
    val cn = component(context)
    if (!KeepsakeListenerService.connected) {
      // Re-enabling the component makes the system bind it again even when requestRebind alone
      // is ignored (common on MIUI / ColorOS). Never done while connected: that would only
      // cause a needless reconnect.
      try {
        val pm = context.packageManager
        pm.setComponentEnabledSetting(cn, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP)
        pm.setComponentEnabledSetting(cn, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP)
      } catch (e: Exception) {
        Log.w(TAG, "Component toggle failed", e)
      }
    }
    try {
      NotificationListenerService.requestRebind(cn)
    } catch (e: Exception) {
      Log.w(TAG, "requestRebind failed", e)
    }
  }

  /** Idempotent: an already scheduled watchdog is left untouched. */
  fun scheduleWatchdog(context: Context) {
    try {
      val js = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as? JobScheduler ?: return
      if (js.getPendingJob(WATCHDOG_JOB_ID) != null) return
      val job = JobInfo.Builder(WATCHDOG_JOB_ID, ComponentName(context, WatchdogJob::class.java))
        .setPeriodic(WATCHDOG_PERIOD_MS)
        .setPersisted(true) // survives reboot (needs RECEIVE_BOOT_COMPLETED)
        .build()
      js.schedule(job)
    } catch (e: Exception) {
      Log.w(TAG, "Scheduling watchdog failed", e)
    }
  }

  class WatchdogJob : JobService() {
    override fun onStartJob(params: JobParameters?): Boolean {
      try {
        ensureBound(this)
      } catch (e: Exception) {
        Log.w(TAG, "Watchdog run failed", e)
      }
      return false // work is synchronous and finished
    }

    override fun onStopJob(params: JobParameters?): Boolean = true
  }

  class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
      when (intent?.action) {
        Intent.ACTION_BOOT_COMPLETED,
        Intent.ACTION_MY_PACKAGE_REPLACED,
        "android.intent.action.QUICKBOOT_POWERON",
        "com.htc.intent.action.QUICKBOOT_POWERON" -> {
          scheduleWatchdog(context)
          ensureBound(context)
        }
      }
    }
  }
}
