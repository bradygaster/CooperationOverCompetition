const { getConnection } = require('../db/connection');

// Valid status transitions: forward only, no skipping
const VALID_TRANSITIONS = {
  'todo': ['in-progress'],
  'in-progress': ['done'],
  'done': [],
};

const PRIORITY_ORDER_SQL = "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END";

function getAll({ sort, order } = {}) {
  const db = getConnection();
  let sql = 'SELECT * FROM tasks';
  if (sort === 'priority') {
    const dir = order === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${PRIORITY_ORDER_SQL} ${dir}`;
  } else {
    sql += ' ORDER BY created_at DESC';
  }
  return db.prepare(sql).all();
}

function getById(id) {
  const db = getConnection();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function create({ title, description = '', priority = 'medium' }) {
  const db = getConnection();
  const result = db.prepare(
    `INSERT INTO tasks (title, description, priority) VALUES (?, ?, ?)`
  ).run(title, description, priority);
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
  const priority = fields.priority !== undefined ? fields.priority : existing.priority;

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(title, description, status, priority, id);

  return getById(id);
}

function remove(id) {
  const db = getConnection();
  const existing = getById(id);
  if (!existing) return null;
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return existing;
}

function getFiltered({ status, search, sort, order } = {}) {
  const db = getConnection();
  let sql = 'SELECT * FROM tasks';
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('title LIKE ?');
    params.push(`%${search}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  if (sort === 'priority') {
    const dir = order === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${PRIORITY_ORDER_SQL} ${dir}`;
  } else {
    sql += ' ORDER BY created_at DESC';
  }
  return db.prepare(sql).all(...params);
}

function bulkUpdateStatus(ids, status) {
  const db = getConnection();
  const txn = db.transaction(() => {
    const updated = [];
    for (const id of ids) {
      const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      if (!existing) {
        const err = new Error(`Bulk operation failed: Task ${id} not found`);
        err.code = 'BULK_FAILED';
        throw err;
      }
      if (existing.status !== status) {
        const allowed = VALID_TRANSITIONS[existing.status] || [];
        if (!allowed.includes(status)) {
          const err = new Error(
            `Bulk operation failed: Invalid status transition: ${existing.status} → ${status} for task ${id}`
          );
          err.code = 'BULK_FAILED';
          throw err;
        }
      }
      db.prepare(
        `UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(status, id);
      updated.push(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
    }
    return updated;
  });
  return txn();
}

function bulkRemove(ids) {
  const db = getConnection();
  const txn = db.transaction(() => {
    const removed = [];
    for (const id of ids) {
      const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      if (!existing) {
        const err = new Error(`Bulk operation failed: Task ${id} not found`);
        err.code = 'BULK_FAILED';
        throw err;
      }
      db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      removed.push(existing);
    }
    return removed;
  });
  return txn();
}

module.exports = { getAll, getById, getFiltered, create, update, remove, bulkUpdateStatus, bulkRemove, VALID_TRANSITIONS };
