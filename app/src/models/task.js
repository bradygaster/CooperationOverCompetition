const { getConnection } = require('../db/connection');

// Valid status transitions: forward only, no skipping
const VALID_TRANSITIONS = {
  'todo': ['in-progress'],
  'in-progress': ['done'],
  'done': [],
};

function getAll() {
  const db = getConnection();
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}

function getById(id) {
  const db = getConnection();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function create({ title, description = '' }) {
  const db = getConnection();
  const result = db.prepare(
    `INSERT INTO tasks (title, description) VALUES (?, ?)`
  ).run(title, description);
  return getById(result.lastInsertRowid);
}

function update(id, fields) {
  const db = getConnection();
  const existing = getById(id);
  if (!existing) return null;

  // Validate status transition if status is being changed
  if (fields.status && fields.status !== existing.status) {
    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(fields.status)) {
      const err = new Error(
        `Invalid status transition: ${existing.status} → ${fields.status}`
      );
      err.code = 'INVALID_TRANSITION';
      throw err;
    }
  }

  const title = fields.title !== undefined ? fields.title : existing.title;
  const description = fields.description !== undefined ? fields.description : existing.description;
  const status = fields.status !== undefined ? fields.status : existing.status;

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(title, description, status, id);

  return getById(id);
}

function remove(id) {
  const db = getConnection();
  const existing = getById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return existing;
}

module.exports = { getAll, getById, create, update, remove, VALID_TRANSITIONS };
