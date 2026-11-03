package expo.modules.keepsake

import android.os.Handler
import android.os.Looper
import android.util.Log

/** Bridges the service (always alive) to the JS module (alive only while the app is running). */
object ChangeBus {
  @Volatile var listener: ((String) -> Unit)? = null
  private val mainHandler = Handler(Looper.getMainLooper())

  fun emit(type: String) {
    val l = listener ?: return
    mainHandler.post {
      try {
        l(type)
      } catch (e: Exception) {
        Log.w("ChangeBus", "Listener notification failed", e)
      }
    }
  }
}
