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

  // Migration: add priority column to existing tables that lack it
  const columns = db.prepare("PRAGMA table_info(tasks)").all();
  const hasPriority = columns.some(c => c.name === 'priority');
  if (!hasPriority) {
    db.exec(`ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high'))`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete', 'import')),
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migration: add 'import' to audit_log operation CHECK constraint
  const auditColumns = db.prepare("PRAGMA table_info(audit_log)").all();
  const opCol = auditColumns.find(c => c.name === 'operation');
  if (opCol && !String(opCol.dflt_value || '').includes('import')) {
    // Check if the existing constraint allows 'import' by attempting an insert
    try {
      db.exec(`INSERT INTO audit_log (task_id, operation) VALUES (-1, 'import')`);
      db.exec(`DELETE FROM audit_log WHERE task_id = -1`);
    } catch (_) {
      // Constraint doesn't allow 'import', recreate the table
      db.exec(`ALTER TABLE audit_log RENAME TO audit_log_old`);
      db.exec(`
        CREATE TABLE audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete', 'import')),
          field_name TEXT,
          old_value TEXT,
          new_value TEXT,
          timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      db.exec(`INSERT INTO audit_log SELECT * FROM audit_log_old`);
      db.exec(`DROP TABLE audit_log_old`);
    }
  }
}

module.exports = { migrate };
