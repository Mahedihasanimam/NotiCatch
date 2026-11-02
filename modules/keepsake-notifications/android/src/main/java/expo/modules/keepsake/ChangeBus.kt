package expo.modules.keepsake

/** Bridges the service (always alive) to the JS module (alive only while the app is running). */
object ChangeBus {
  @Volatile var listener: ((String) -> Unit)? = null
  fun emit(type: String) { listener?.invoke(type) }
}
