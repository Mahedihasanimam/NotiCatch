package expo.modules.keepsake

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DeletionMatcherTest {
  private val min = 60_000L

  @Test fun oneToOneMatchesSameContact() {
    val t = DeletionMatcher.target("Arif", "This message was deleted")
    assertNull(t.sender)
    assertTrue(DeletionMatcher.matches(t, "Arif (2 messages)", "hello", null, min))
    assertFalse(DeletionMatcher.matches(t, "Arifa", "hello", null, min))
  }

  @Test fun emptyCandidateTitleNeverMatchesNamedChat() {
    val t = DeletionMatcher.target("Arif", "This message was deleted")
    assertFalse(DeletionMatcher.matches(t, "", "hello", null, min))
  }

  @Test fun groupRequiresSameSender() {
    val t = DeletionMatcher.target("Family Group", "Arif: This message was deleted")
    assertEquals("arif", t.sender)
    assertFalse(DeletionMatcher.matches(t, "Family Group", "Rina: dinner at 8", null, min))
    assertTrue(DeletionMatcher.matches(t, "Family Group", "Arif: dinner at 8", null, min))
  }

  @Test fun groupSenderInTitleFormats() {
    val t = DeletionMatcher.target("Family Group: Arif", "This message was deleted")
    assertEquals("family group", t.conversation)
    assertEquals("arif", t.sender)
    assertTrue(DeletionMatcher.matches(t, "Family Group (3 messages): Arif", "hi", null, min))
    assertTrue(DeletionMatcher.matches(t, "Arif @ Family Group", "hi", null, min))
    assertFalse(DeletionMatcher.matches(t, "Family Group: Rina", "hi", null, min))
  }

  @Test fun genericTitleOnlyMatchesRecent() {
    val t = DeletionMatcher.target("WhatsApp", "This message was deleted")
    assertTrue(t.isGeneric)
    assertTrue(DeletionMatcher.matches(t, "Anyone", "x", null, 5 * min))
    assertFalse(DeletionMatcher.matches(t, "Anyone", "x", null, 20 * min))
  }

  @Test fun senderPrefixIgnoresUrlsAndTimes() {
    assertNull(DeletionMatcher.senderPrefix("https: //x"))
    assertNull(DeletionMatcher.senderPrefix("This message was deleted"))
    assertEquals("arif", DeletionMatcher.senderPrefix("Arif: hi"))
  }
}
