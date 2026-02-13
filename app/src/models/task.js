const { getConnection } = require('../db/connection');

// Valid status transitions: forward only, no skipping
const VALID_TRANSITIONS = {
  'todo': ['in-progress'],
  'in-progress': ['done'],
  'done': [],
};

const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_ORDER = { high: 1, medium: 2, low: 3 };

function getAll() {
  const db = getConnection();
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}

function getFiltered({ status, search, sort, order } = {}) {
  const db = getConnection();
  const conditions = [];
  const params = [];

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
      err.code = 'INVALID_STATUS';
      throw err;
    }
    conditions.push('status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('title LIKE ?');
    params.push(`%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderClause = 'ORDER BY created_at DESC';
  if (sort === 'priority') {
    // desc order means low→medium→high (reverse of default high→medium→low)
    const dir = order === 'desc' ? 'DESC' : 'ASC';
    orderClause = `ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ${dir}, created_at DESC`;
  }

  return db.prepare(`SELECT * FROM tasks ${where} ${orderClause}`).all(...params);
}

function getById(id) {
  const db = getConnection();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function create({ title, description = '', priority = 'medium' }) {
  const db = getConnection();
  if (!VALID_PRIORITIES.includes(priority)) {
    const err = new Error(`Invalid priority: ${priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    err.code = 'INVALID_PRIORITY';
    throw err;
  }
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

  // Validate priority if provided
  if (fields.priority !== undefined && !VALID_PRIORITIES.includes(fields.priority)) {
    const err = new Error(`Invalid priority: ${fields.priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    err.code = 'INVALID_PRIORITY';
    throw err;
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

function bulkUpdateStatus(ids, status) {
  const db = getConnection();

  if (!Array.isArray(ids) || ids.length === 0) {
    const err = new Error('ids must be a non-empty array');
    err.code = 'INVALID_INPUT';
    throw err;
  }
  if (ids.length > 100) {
    const err = new Error('Cannot bulk update more than 100 tasks');
    err.code = 'INVALID_INPUT';
    throw err;
  }
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
    err.code = 'INVALID_STATUS';
    throw err;
  }

  const txn = db.transaction(() => {
    const updated = [];
    for (const id of ids) {
      const existing = getById(id);
      if (!existing) {
        const err = new Error(`Task with id ${id} not found`);
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (existing.status !== status) {
        const allowed = VALID_TRANSITIONS[existing.status] || [];
        if (!allowed.includes(status)) {
          const err = new Error(
            `Invalid status transition for task ${id}: ${existing.status} → ${status}`
          );
          err.code = 'INVALID_TRANSITION';
          throw err;
        }
      }
      db.prepare(
        `UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(status, id);
      updated.push(getById(id));
    }
    return updated;
  });

  return txn();
}

function bulkDelete(ids) {
  const db = getConnection();

  if (!Array.isArray(ids) || ids.length === 0) {
    const err = new Error('ids must be a non-empty array');
    err.code = 'INVALID_INPUT';
    throw err;
  }
  if (ids.length > 100) {
    const err = new Error('Cannot bulk delete more than 100 tasks');
    err.code = 'INVALID_INPUT';
    throw err;
  }

  const txn = db.transaction(() => {
    const deleted = [];
    for (const id of ids) {
      const existing = getById(id);
      if (!existing) {
        const err = new Error(`Task with id ${id} not found`);
        err.code = 'NOT_FOUND';
        throw err;
      }
      db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      deleted.push(existing);
    }
    return deleted;
  });

  return txn();
}

module.exports = { getAll, getFiltered, getById, create, update, remove, bulkUpdateStatus, bulkDelete, VALID_TRANSITIONS, VALID_STATUSES, VALID_PRIORITIES };
