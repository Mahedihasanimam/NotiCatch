package expo.modules.keepsake

import java.security.MessageDigest

object Hashing {
  /** Stable fingerprint of the visible content of a notification. */
  fun contentHash(vararg fields: String?): String {
    val md = MessageDigest.getInstance("SHA-1")
    fields.forEach { f ->
      md.update((f ?: "").toByteArray(Charsets.UTF_8))
      md.update(0x1f.toByte()) // unit separator so ("ab","c") != ("a","bc")
    }
    return md.digest().joinToString("") { "%02x".format(it) }
  }
}
