const { getConnection } = require('./connection');

function migrate() {
  const db = getConnection();
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Add priority column to existing tables that lack it
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high'))`);
  } catch (err) {
    // Column already exists — ignore
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete', 'bulk_update', 'bulk_delete', 'import')),
      changes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

module.exports = { migrate };
