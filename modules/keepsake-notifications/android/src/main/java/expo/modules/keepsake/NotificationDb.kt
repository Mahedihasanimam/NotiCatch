package expo.modules.keepsake

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

/**
 * Single owner of the notification database. One helper instance per process; all writes are
 * serialised through [lock] and wrapped in transactions, so the listener service and the JS
 * module can never interleave partial writes.
 */
class NotificationDb private constructor(context: Context) :
  SQLiteOpenHelper(context.applicationContext, DB_NAME, null, DB_VERSION) {

  private val lock = Any()

  override fun onConfigure(db: SQLiteDatabase) {
    db.enableWriteAheadLogging()
  }

  override fun onCreate(db: SQLiteDatabase) = migrate(db, 0, DB_VERSION)

  override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) =
    migrate(db, oldVersion, newVersion)

  private fun migrate(db: SQLiteDatabase, from: Int, to: Int) {
    for (v in (from + 1)..to) {
      MIGRATIONS.getValue(v).forEach { db.execSQL(it) }
    }
  }

  // ---------------------------------------------------------------- writes

  /** Inserts a captured notification unless an identical, still-active one already exists. */
  fun insertCaptured(r: Captured): Boolean = synchronized(lock) {
    val db = writableDatabase
    db.beginTransaction()
    try {
      val dup = db.rawQuery(
        "SELECT 1 FROM notifications WHERE sbn_key = ? AND content_hash = ? AND removed_at IS NULL LIMIT 1",
        arrayOf(r.sbnKey, r.contentHash),
      ).use { it.moveToFirst() }
      if (dup) return false
      val v = ContentValues().apply {
        put("sbn_key", r.sbnKey); put("package_name", r.packageName); put("app_name", r.appName)
        put("title", r.title); put("text", r.text); put("big_text", r.bigText); put("sub_text", r.subText)
        put("category", r.category); put("channel_id", r.channelId); put("group_key", r.groupKey)
        put("is_group_summary", if (r.isGroupSummary) 1 else 0)
        put("is_ongoing", if (r.isOngoing) 1 else 0)
        put("posted_at", r.postedAt); put("content_hash", r.contentHash)
        put("is_deleted", if (r.isDeleted) 1 else 0)
        if (r.deletedAt != null) put("deleted_at", r.deletedAt)
        if (r.mediaPath != null) put("media_path", r.mediaPath)
        if (r.mediaType != null) put("media_type", r.mediaType)
        put("created_at", System.currentTimeMillis())
      }
      db.insertOrThrow("notifications", null, v)
      db.setTransactionSuccessful()
      true
    } finally {
      db.endTransaction()
    }
  }

  /** The record is kept; only the removal timestamp/reason is stored. */
  fun markRemoved(sbnKey: String, reason: Int, at: Long) = synchronized(lock) {
    val v = ContentValues().apply { put("removed_at", at); put("removal_reason", reason) }
    writableDatabase.update("notifications", v, "sbn_key = ? AND removed_at IS NULL", arrayOf(sbnKey))
  }

  /** Marks the most recent message from contact/package as deleted. Returns the id if found. */
  fun markLastMessageDeleted(packageName: String, title: String?, deletedAt: Long): Long? = synchronized(lock) {
    val db = writableDatabase
    val cutoff = deletedAt - 86_400_000L // within 24 hours
    val cursor = if (title.isNullOrEmpty()) {
      db.rawQuery(
        "SELECT id FROM notifications WHERE package_name = ? AND is_deleted = 0 AND posted_at >= ? ORDER BY posted_at DESC LIMIT 1",
        arrayOf(packageName, cutoff.toString()),
      )
    } else {
      db.rawQuery(
        "SELECT id FROM notifications WHERE package_name = ? AND title = ? AND is_deleted = 0 AND posted_at >= ? ORDER BY posted_at DESC LIMIT 1",
        arrayOf(packageName, title, cutoff.toString()),
      )
    }
    cursor.use {
      if (it.moveToFirst()) {
        val id = it.getLong(0)
        val cv = ContentValues().apply {
          put("is_deleted", 1)
          put("deleted_at", deletedAt)
        }
        db.update("notifications", cv, "id = ?", arrayOf(id.toString()))
        return id
      }
    }
    return null
  }

  fun setFlag(column: String, ids: List<Long>, value: Boolean): Int {
    require(column == "is_favorite" || column == "is_archived")
    if (ids.isEmpty()) return 0
    return synchronized(lock) {
      val db = writableDatabase
      var n = 0
      db.beginTransaction()
      try {
        ids.chunked(500).forEach { chunk ->
          val v = ContentValues().apply { put(column, if (value) 1 else 0) }
          n += db.update("notifications", v, "id IN (${chunk.joinToString(",") { "?" }})", chunk.map { it.toString() }.toTypedArray())
        }
        db.setTransactionSuccessful()
      } finally { db.endTransaction() }
      n
    }
  }

  fun deleteByIds(ids: List<Long>): Int {
    if (ids.isEmpty()) return 0
    return synchronized(lock) {
      val db = writableDatabase
      var n = 0
      db.beginTransaction()
      try {
        ids.chunked(500).forEach { chunk ->
          n += db.delete("notifications", "id IN (${chunk.joinToString(",") { "?" }})", chunk.map { it.toString() }.toTypedArray())
        }
        db.setTransactionSuccessful()
      } finally { db.endTransaction() }
      n
    }
  }

  fun clearAll(keepFavorites: Boolean): Int = synchronized(lock) {
    if (keepFavorites) writableDatabase.delete("notifications", "is_favorite = 0", null)
    else writableDatabase.delete("notifications", null, null)
  }

  fun cleanup(cutoff: Long, keepFavorites: Boolean, keepArchived: Boolean): Int = synchronized(lock) {
    writableDatabase.delete(
      "notifications",
      "posted_at < ? AND NOT (is_favorite = 1 AND ? = 1) AND NOT (is_archived = 1 AND ? = 1)",
      arrayOf(cutoff.toString(), if (keepFavorites) "1" else "0", if (keepArchived) "1" else "0"),
    )
  }

  /** Returns (inserted, skipped). Rows are matched on package + timestamp + content hash. */
  fun importRecords(records: JSONArray): Pair<Int, Int> = synchronized(lock) {
    val db = writableDatabase
    var inserted = 0
    var skipped = 0
    db.beginTransaction()
    try {
      for (i in 0 until records.length()) {
        val o = records.optJSONObject(i)
        if (o == null) { skipped++; continue }
        val pkg = o.optString("packageName")
        val posted = o.optLong("postedAt", -1)
        if (pkg.isEmpty() || posted <= 0) { skipped++; continue }
        val title = o.optStringOrNull("title"); val text = o.optStringOrNull("text")
        val big = o.optStringOrNull("bigText"); val sub = o.optStringOrNull("subText")
        val hash = Hashing.contentHash(pkg, title, text, big, sub)
        val exists = db.rawQuery(
          "SELECT 1 FROM notifications WHERE package_name = ? AND posted_at = ? AND content_hash = ? LIMIT 1",
          arrayOf(pkg, posted.toString(), hash),
        ).use { it.moveToFirst() }
        if (exists) { skipped++; continue }
        val v = ContentValues().apply {
          put("sbn_key", o.optString("sbnKey", "import:$pkg:$posted"))
          put("package_name", pkg); put("app_name", o.optString("appName", pkg))
          put("title", title); put("text", text); put("big_text", big); put("sub_text", sub)
          put("category", o.optStringOrNull("category")); put("channel_id", o.optStringOrNull("channelId"))
          put("group_key", o.optStringOrNull("groupKey"))
          put("is_group_summary", if (o.optBoolean("isGroupSummary")) 1 else 0)
          put("is_ongoing", if (o.optBoolean("isOngoing")) 1 else 0)
          put("posted_at", posted)
          if (o.has("removedAt") && !o.isNull("removedAt")) put("removed_at", o.optLong("removedAt"))
          if (o.has("removalReason") && !o.isNull("removalReason")) put("removal_reason", o.optInt("removalReason"))
          put("is_favorite", if (o.optBoolean("isFavorite")) 1 else 0)
          put("is_archived", if (o.optBoolean("isArchived")) 1 else 0)
          put("is_deleted", if (o.optBoolean("isDeleted")) 1 else 0)
          if (o.has("deletedAt") && !o.isNull("deletedAt")) put("deleted_at", o.optLong("deletedAt"))
          put("media_path", o.optStringOrNull("mediaPath"))
          put("media_type", o.optStringOrNull("mediaType"))
          put("content_hash", hash); put("created_at", System.currentTimeMillis())
        }
        db.insertOrThrow("notifications", null, v)
        inserted++
      }
      db.setTransactionSuccessful()
    } finally { db.endTransaction() }
    inserted to skipped
  }

  // ---------------------------------------------------------------- reads

  fun query(o: QueryOptions): JSONArray {
    val c = QueryBuilder.clause(o)
    val where = if (c.where.isEmpty()) "" else "WHERE ${c.where}"
    val sql = "SELECT * FROM notifications $where ORDER BY posted_at DESC, id DESC LIMIT ${QueryBuilder.clampLimit(o.limit)} OFFSET ${o.offset.coerceAtLeast(0)}"
    return readableDatabase.rawQuery(sql, c.args).use(::rows)
  }

  fun count(o: QueryOptions): Int {
    val c = QueryBuilder.clause(o)
    val where = if (c.where.isEmpty()) "" else "WHERE ${c.where}"
    return readableDatabase.rawQuery("SELECT COUNT(*) FROM notifications $where", c.args).use { if (it.moveToFirst()) it.getInt(0) else 0 }
  }

  fun getByIds(ids: List<Long>): JSONArray {
    val out = JSONArray()
    ids.chunked(500).forEach { chunk ->
      readableDatabase.rawQuery(
        "SELECT * FROM notifications WHERE id IN (${chunk.joinToString(",") { "?" }}) ORDER BY posted_at DESC",
        chunk.map { it.toString() }.toTypedArray(),
      ).use { cur -> val a = rows(cur); for (i in 0 until a.length()) out.put(a.get(i)) }
    }
    return out
  }

  fun appSummaries(): JSONArray = readableDatabase.rawQuery(
    "SELECT package_name, MAX(app_name) AS app_name, COUNT(*) AS cnt, MAX(posted_at) AS last_at FROM notifications WHERE is_archived = 0 GROUP BY package_name ORDER BY cnt DESC",
    null,
  ).use { c ->
    val a = JSONArray()
    while (c.moveToNext()) a.put(JSONObject().put("packageName", c.getString(0)).put("appName", c.getString(1)).put("count", c.getInt(2)).put("lastPostedAt", c.getLong(3)))
    a
  }

  fun conversations(): JSONArray = readableDatabase.rawQuery(
    """
    SELECT package_name,
           MAX(app_name) AS app_name,
           COALESCE(title, app_name) AS contact_title,
           COALESCE(text, big_text) AS last_msg,
           MAX(posted_at) AS last_posted_at,
           COUNT(*) AS total_count,
           SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deleted_count,
           MAX(media_path) AS sample_media,
           sbn_key
    FROM notifications
    WHERE is_archived = 0 AND (title IS NOT NULL OR text IS NOT NULL)
    GROUP BY package_name, COALESCE(title, app_name)
    ORDER BY last_posted_at DESC
    """,
    null,
  ).use { c ->
    val a = JSONArray()
    while (c.moveToNext()) {
      a.put(
        JSONObject()
          .put("packageName", c.getString(0))
          .put("appName", c.getString(1))
          .put("title", c.getString(2))
          .put("lastMessage", if (c.isNull(3)) JSONObject.NULL else c.getString(3))
          .put("lastPostedAt", c.getLong(4))
          .put("count", c.getInt(5))
          .put("deletedCount", c.getInt(6))
          .put("mediaPath", if (c.isNull(7)) JSONObject.NULL else c.getString(7))
          .put("sbnKey", if (c.isNull(8)) JSONObject.NULL else c.getString(8)),
      )
    }
    a
  }

  fun conversationMessages(packageName: String, title: String): JSONArray = readableDatabase.rawQuery(
    """
    SELECT * FROM notifications
    WHERE package_name = ? AND (title = ? OR (title IS NULL AND app_name = ?))
    ORDER BY posted_at ASC, id ASC
    LIMIT 500
    """,
    arrayOf(packageName, title, title),
  ).use(::rows)

  fun stats(dayStarts: List<Long>, dayEnd: Long): JSONObject {
    val db = readableDatabase
    fun scalar(sql: String, args: Array<String>? = null) =
      db.rawQuery(sql, args).use { if (it.moveToFirst()) it.getInt(0) else 0 }
    val daily = JSONArray()
    dayStarts.forEachIndexed { i, start ->
      val end = if (i + 1 < dayStarts.size) dayStarts[i + 1] else dayEnd
      daily.put(scalar("SELECT COUNT(*) FROM notifications WHERE posted_at >= ? AND posted_at < ? AND is_archived = 0", arrayOf(start.toString(), end.toString())))
    }
    val todayStart = dayStarts.lastOrNull() ?: 0L
    return JSONObject()
      .put("total", scalar("SELECT COUNT(*) FROM notifications WHERE is_archived = 0"))
      .put("today", scalar("SELECT COUNT(*) FROM notifications WHERE posted_at >= ? AND is_archived = 0", arrayOf(todayStart.toString())))
      .put("favorites", scalar("SELECT COUNT(*) FROM notifications WHERE is_favorite = 1"))
      .put("archived", scalar("SELECT COUNT(*) FROM notifications WHERE is_archived = 1"))
      .put("deleted", scalar("SELECT COUNT(*) FROM notifications WHERE is_deleted = 1"))
      .put("daily", daily)
  }

  private fun rows(c: Cursor): JSONArray {
    val a = JSONArray()
    while (c.moveToNext()) a.put(row(c))
    return a
  }

  private fun row(c: Cursor): JSONObject {
    fun s(n: String): Any = c.getColumnIndexOrThrow(n).let { if (c.isNull(it)) JSONObject.NULL else c.getString(it) }
    fun l(n: String): Any = c.getColumnIndexOrThrow(n).let { if (c.isNull(it)) JSONObject.NULL else c.getLong(it) }
    fun b(n: String): Boolean = c.getInt(c.getColumnIndexOrThrow(n)) == 1
    return JSONObject()
      .put("id", c.getLong(c.getColumnIndexOrThrow("id")))
      .put("sbnKey", s("sbn_key")).put("packageName", s("package_name")).put("appName", s("app_name"))
      .put("title", s("title")).put("text", s("text")).put("bigText", s("big_text")).put("subText", s("sub_text"))
      .put("category", s("category")).put("channelId", s("channel_id")).put("groupKey", s("group_key"))
      .put("isGroupSummary", b("is_group_summary")).put("isOngoing", b("is_ongoing"))
      .put("postedAt", l("posted_at")).put("removedAt", l("removed_at")).put("removalReason", l("removal_reason"))
      .put("isFavorite", b("is_favorite")).put("isArchived", b("is_archived"))
      .put("isDeleted", b("is_deleted")).put("deletedAt", l("deleted_at"))
      .put("mediaPath", s("media_path")).put("mediaType", s("media_type"))
  }

  data class Captured(
    val sbnKey: String, val packageName: String, val appName: String,
    val title: String?, val text: String?, val bigText: String?, val subText: String?,
    val category: String?, val channelId: String?, val groupKey: String?,
    val isGroupSummary: Boolean, val isOngoing: Boolean, val postedAt: Long, val contentHash: String,
    val mediaPath: String? = null,
    val mediaType: String? = null,
    val isDeleted: Boolean = false,
    val deletedAt: Long? = null,
  )

  companion object {
    const val DB_NAME = "keepsake_notifications.db"
    const val DB_VERSION = 3

    /** Version -> statements. Never edit a released entry; append a new version instead. */
    val MIGRATIONS: Map<Int, List<String>> = mapOf(
      1 to listOf(
        """CREATE TABLE notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sbn_key TEXT NOT NULL,
          package_name TEXT NOT NULL,
          app_name TEXT NOT NULL,
          title TEXT, text TEXT, big_text TEXT, sub_text TEXT,
          category TEXT, channel_id TEXT, group_key TEXT,
          is_group_summary INTEGER NOT NULL DEFAULT 0,
          is_ongoing INTEGER NOT NULL DEFAULT 0,
          posted_at INTEGER NOT NULL,
          removed_at INTEGER,
          is_favorite INTEGER NOT NULL DEFAULT 0,
          is_archived INTEGER NOT NULL DEFAULT 0,
          content_hash TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )""",
        "CREATE INDEX idx_notif_posted ON notifications(posted_at DESC)",
        "CREATE INDEX idx_notif_pkg ON notifications(package_name, posted_at DESC)",
        "CREATE INDEX idx_notif_key ON notifications(sbn_key, content_hash)",
      ),
      2 to listOf(
        "ALTER TABLE notifications ADD COLUMN removal_reason INTEGER",
        "CREATE INDEX idx_notif_flags ON notifications(is_favorite, is_archived)",
      ),
      3 to listOf(
        "ALTER TABLE notifications ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE notifications ADD COLUMN deleted_at INTEGER",
        "ALTER TABLE notifications ADD COLUMN media_path TEXT",
        "ALTER TABLE notifications ADD COLUMN media_type TEXT",
        "CREATE INDEX idx_notif_deleted ON notifications(is_deleted, posted_at DESC)",
      ),
    )

    @Volatile private var instance: NotificationDb? = null
    fun get(context: Context): NotificationDb =
      instance ?: synchronized(this) { instance ?: NotificationDb(context).also { instance = it } }
  }
}

internal fun JSONObject.optStringOrNull(name: String): String? =
  if (!has(name) || isNull(name)) null else optString(name).ifEmpty { null }
