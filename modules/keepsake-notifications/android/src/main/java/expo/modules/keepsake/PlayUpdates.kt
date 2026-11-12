package expo.modules.keepsake

import android.app.Activity
import android.content.Context
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import org.json.JSONObject

/**
 * Google Play In-App Updates. Play is the source of truth for whether a newer build exists,
 * and the update is downloaded / installed by Play itself (no browser hop, no sideloading).
 *
 * Only works for installs that came from Google Play; for dev / sideloaded builds the check
 * fails and the JS side falls back to its remote version file.
 */
object PlayUpdates {
  @Volatile private var manager: AppUpdateManager? = null
  @Volatile private var listener: InstallStateUpdatedListener? = null

  private fun manager(context: Context): AppUpdateManager =
    manager ?: AppUpdateManagerFactory.create(context.applicationContext).also { manager = it }

  fun check(context: Context, onResult: (JSONObject) -> Unit, onError: (String) -> Unit) {
    manager(context).appUpdateInfo
      .addOnSuccessListener { info ->
        val availability = info.updateAvailability()
        onResult(
          JSONObject().apply {
            put(
              "available",
              availability == UpdateAvailability.UPDATE_AVAILABLE ||
                availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS,
            )
            put("availableVersionCode", info.availableVersionCode())
            put("immediateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE))
            put("flexibleAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE))
            put("stalenessDays", info.clientVersionStalenessDays() ?: JSONObject.NULL)
            put("priority", info.updatePriority())
            put("downloaded", info.installStatus() == InstallStatus.DOWNLOADED)
          },
        )
      }
      .addOnFailureListener { e -> onError(e.message ?: "Play update check failed") }
  }

  /**
   * Starts the Play update flow. IMMEDIATE = full-screen Play UI (used for forced updates);
   * FLEXIBLE = background download, then we restart into the new version once it's downloaded.
   */
  fun start(activity: Activity, immediate: Boolean, onResult: (Boolean) -> Unit) {
    val mgr = manager(activity)
    mgr.appUpdateInfo
      .addOnSuccessListener { info ->
        if (info.installStatus() == InstallStatus.DOWNLOADED) {
          mgr.completeUpdate()
          onResult(true)
          return@addOnSuccessListener
        }
        val wantImmediate = immediate || !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
        val type = if (wantImmediate) AppUpdateType.IMMEDIATE else AppUpdateType.FLEXIBLE
        val available = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE ||
          info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
        if (!available || !info.isUpdateTypeAllowed(type)) {
          onResult(false)
          return@addOnSuccessListener
        }
        if (type == AppUpdateType.FLEXIBLE) watchFlexibleDownload(mgr)
        try {
          mgr.startUpdateFlow(info, activity, AppUpdateOptions.defaultOptions(type))
            .addOnSuccessListener { code -> onResult(code == Activity.RESULT_OK) }
            .addOnFailureListener { onResult(false) }
        } catch (_: Exception) {
          onResult(false)
        }
      }
      .addOnFailureListener { onResult(false) }
  }

  private fun watchFlexibleDownload(mgr: AppUpdateManager) {
    if (listener != null) return
    val l = InstallStateUpdatedListener { state ->
      when (state.installStatus()) {
        InstallStatus.DOWNLOADED -> mgr.completeUpdate()
        InstallStatus.INSTALLED, InstallStatus.FAILED, InstallStatus.CANCELED -> {
          listener?.let { mgr.unregisterListener(it) }
          listener = null
        }
        else -> Unit
      }
    }
    listener = l
    mgr.registerListener(l)
  }
}
