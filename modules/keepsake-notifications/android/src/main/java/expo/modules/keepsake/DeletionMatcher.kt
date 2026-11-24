package expo.modules.keepsake

/**
 * Decides which stored message a "This message was deleted" notification refers to.
 *
 * Pure (no Android / DB types) so it can be unit-tested.
 *
 * Group chats are the risky case: the deletion notification carries the GROUP name as title and
 * the SENDER as a "Sender: …" prefix (or "Group: Sender" title on older Android). Matching on the
 * group title alone would flag the newest message from *anyone* in the group, so whenever the
 * deletion names a sender we also require the candidate's sender to be that same person.
 */
object DeletionMatcher {

  data class Target(
    /** Conversation (contact or group) name, normalized. Empty when the title is generic. */
    val conversation: String,
    /** Sender inside a group, normalized; null for 1:1 chats or when unknown. */
    val sender: String?,
    val isGeneric: Boolean,
  )

  private val GENERIC_TITLES = setOf(
    "", "whatsapp", "whatsapp business", "হোয়াটসঅ্যাপ", "telegram", "messenger", "messages", "signal", "viber", "imo",
  )

  private val COUNT_SUFFIX = Regex("""\s*\(\d+\s*[^)]*\)""")

  // "Arif: hi" — a sender prefix is short and does not look like a URL or time ("http:", "5:30").
  private val SENDER_PREFIX = Regex("""^([^:\n]{1,40}):\s""")

  fun normalize(raw: String?): String =
    raw.orEmpty().replace(COUNT_SUFFIX, "").trim().lowercase()

  /** "Group: Sender" / "Sender @ Group" → ("group", "sender"); "Contact" → ("contact", null). */
  fun splitTitle(raw: String?): Pair<String, String?> {
    val t = normalize(raw)
    val at = t.indexOf(" @ ")
    if (at > 0) {
      val sender = t.substring(0, at).trim().ifEmpty { null }
      return t.substring(at + 3).trim() to sender
    }
    val idx = t.indexOf(':')
    if (idx <= 0) return t to null
    val conv = t.substring(0, idx).trim()
    val sender = t.substring(idx + 1).trim().ifEmpty { null }
    return conv to sender
  }

  /** Sender named at the start of a message body ("Arif: …"), or null. */
  fun senderPrefix(text: String?): String? {
    val m = SENDER_PREFIX.find(text.orEmpty().trim()) ?: return null
    val s = m.groupValues[1].trim().lowercase()
    if (s.isEmpty() || s.startsWith("http") || s.all { it.isDigit() }) return null
    return s
  }

  fun target(title: String?, deletionText: String?): Target {
    val (conv, titleSender) = splitTitle(title)
    return Target(
      conversation = conv,
      sender = senderPrefix(deletionText) ?: titleSender,
      isGeneric = conv in GENERIC_TITLES,
    )
  }

  /**
   * @param candTitle/candText/candSub fields of a stored notification (newest first is the caller's job)
   * @param ageMs how long before the deletion the candidate was posted
   */
  fun matches(t: Target, candTitle: String?, candText: String?, candSub: String?, ageMs: Long): Boolean {
    val (candConv, candTitleSender) = splitTitle(candTitle)

    val sameConversation = if (t.isGeneric) {
      // Nothing to compare: only accept very recent messages.
      ageMs in 0 until GENERIC_WINDOW_MS
    } else {
      candConv.isNotEmpty() && candConv == t.conversation
    }
    if (!sameConversation) return false

    val wanted = t.sender ?: return true // 1:1 chat: conversation match is enough
    val candSender = candTitleSender ?: senderPrefix(candText) ?: normalize(candSub).ifEmpty { null }
    return candSender == wanted
  }

  const val GENERIC_WINDOW_MS = 15 * 60 * 1000L

  /**
   * Exact placeholder texts chat apps show in place of a message that was deleted for everyone.
   * Matching is on the WHOLE text (after removing an optional "Sender: " prefix, emoji and
   * punctuation) — never "contains" — so a normal message such as "I deleted that message"
   * is not mistaken for a deletion.
   */
  private val DELETION_PHRASES = setOf(
    "this message was deleted",
    "this message was deleted by sender",
    "message was deleted",
    "message deleted",
    "this message has been deleted",
    "এই মেসেজটি মুছে ফেলা হয়েছে",
    "এই বার্তাটি মুছে ফেলা হয়েছে",
    "এই মেসেজটি মুছে দেওয়া হয়েছে",
    "এই বার্তাটি মুছে দেওয়া হয়েছে",
    "মেসেজ মুছে ফেলা হয়েছে",
    "বার্তা মুছে ফেলা হয়েছে",
    "यह संदेश हटा दिया गया था",
    "यह संदेश हटा दिया गया है",
    "este mensaje fue eliminado",
    "ce message a été supprimé",
    "diese nachricht wurde gelöscht",
    "تم حذف هذه الرسالة",
    "esta mensagem foi apagada",
    "pesan ini telah dihapus",
    "bu mesaj silindi",
    "сообщение удалено",
    "questo messaggio è stato eliminato",
  )

  // Leading/trailing emoji (🚫), variation selectors, punctuation (incl. Bengali "।") and spaces.
  private val EDGE_JUNK = Regex("""^[\s\p{P}\p{S}\x{FE0F}\x{200D}]+|[\s\p{P}\p{S}\x{FE0F}\x{200D}]+$""")

  // Messenger / Instagram: "Arif unsent a message".
  private val UNSENT = Regex("""^.{1,40} unsent a message$""")

  fun isDeletionText(raw: String?): Boolean {
    var s = raw?.trim()?.lowercase() ?: return false
    if (s.isEmpty() || s.length > 120) return false
    if (senderPrefix(s) != null) s = s.substring(s.indexOf(':') + 1)
    s = s.replace(EDGE_JUNK, "").replace(Regex("""\s+"""), " ")
    if (s.isEmpty()) return false
    return s in DELETION_PHRASES ||
      s.startsWith("this message was deleted by ") || // "...by admin Arif"
      UNSENT.matches(s)
  }
}
