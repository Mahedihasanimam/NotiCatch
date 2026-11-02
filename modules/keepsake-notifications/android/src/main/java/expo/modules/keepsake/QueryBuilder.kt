package expo.modules.keepsake

/** How archived rows participate in a query. */
enum class ArchiveMode { EXCLUDE, ONLY, INCLUDE;
  companion object {
    fun parse(value: String?): ArchiveMode = when (value?.lowercase()) {
      "only" -> ONLY
      "include" -> INCLUDE
      else -> EXCLUDE
    }
  }
}

data class QueryOptions(
  val search: String? = null,
  val packages: List<String> = emptyList(),
  val from: Long? = null,
  val to: Long? = null,
  val favoritesOnly: Boolean = false,
  val deletedOnly: Boolean = false,
  val archived: ArchiveMode = ArchiveMode.EXCLUDE,
  val limit: Int = 100,
  val offset: Int = 0,
)

data class SqlClause(val where: String, val args: Array<String>)

/** Pure (Android-free) SQL fragment builder so it can be unit tested on the JVM. */
object QueryBuilder {
  const val MAX_LIMIT = 1000

  fun escapeLike(value: String): String =
    value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

  fun clause(o: QueryOptions): SqlClause {
    val parts = ArrayList<String>()
    val args = ArrayList<String>()

    val term = o.search?.trim().orEmpty()
    if (term.isNotEmpty()) {
      val like = "%" + escapeLike(term) + "%"
      parts += "(title LIKE ? ESCAPE '\\' OR text LIKE ? ESCAPE '\\' OR big_text LIKE ? ESCAPE '\\' OR app_name LIKE ? ESCAPE '\\')"
      repeat(4) { args += like }
    }
    if (o.packages.isNotEmpty()) {
      parts += "package_name IN (" + o.packages.joinToString(",") { "?" } + ")"
      args += o.packages
    }
    o.from?.let { parts += "posted_at >= ?"; args += it.toString() }
    o.to?.let { parts += "posted_at < ?"; args += it.toString() }
    if (o.favoritesOnly) parts += "is_favorite = 1"
    if (o.deletedOnly) parts += "is_deleted = 1"
    when (o.archived) {
      ArchiveMode.EXCLUDE -> parts += "is_archived = 0"
      ArchiveMode.ONLY -> parts += "is_archived = 1"
      ArchiveMode.INCLUDE -> Unit
    }
    return SqlClause(parts.joinToString(" AND "), args.toTypedArray())
  }

  fun clampLimit(limit: Int): Int = limit.coerceIn(1, MAX_LIMIT)
}
