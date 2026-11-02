package expo.modules.keepsake

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class QueryBuilderTest {
  @Test fun defaultExcludesArchived() {
    val c = QueryBuilder.clause(QueryOptions())
    assertEquals("is_archived = 0", c.where)
    assertEquals(0, c.args.size)
  }

  @Test fun searchEscapesWildcards() {
    val c = QueryBuilder.clause(QueryOptions(search = "50%_off"))
    assertTrue(c.where.contains("title LIKE ?"))
    assertArrayEquals(Array(4) { "%50\\%\\_off%" }, c.args)
  }

  @Test fun combinesFilters() {
    val c = QueryBuilder.clause(
      QueryOptions(packages = listOf("a", "b"), from = 10, to = 20, favoritesOnly = true, deletedOnly = true, archived = ArchiveMode.ONLY),
    )
    assertEquals("package_name IN (?,?) AND posted_at >= ? AND posted_at < ? AND is_favorite = 1 AND is_deleted = 1 AND is_archived = 1", c.where)
    assertArrayEquals(arrayOf("a", "b", "10", "20"), c.args)
  }

  @Test fun clampsLimit() {
    assertEquals(1, QueryBuilder.clampLimit(-5))
    assertEquals(QueryBuilder.MAX_LIMIT, QueryBuilder.clampLimit(1_000_000))
  }

  @Test fun contentHashSeparatesFields() {
    assertNotEquals(Hashing.contentHash("ab", "c"), Hashing.contentHash("a", "bc"))
    assertEquals(Hashing.contentHash("x", null), Hashing.contentHash("x", null))
  }
}
