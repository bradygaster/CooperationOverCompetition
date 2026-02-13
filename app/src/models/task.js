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

function logAudit(db, taskId, operation, changes) {
  db.prepare(
    `INSERT INTO audit_log (task_id, operation, changes) VALUES (?, ?, ?)`
  ).run(taskId, operation, JSON.stringify(changes));
}

function create({ title, description = '', priority = 'medium' }) {
  const db = getConnection();
  const result = db.prepare(
    `INSERT INTO tasks (title, description, priority) VALUES (?, ?, ?)`
  ).run(title, description, priority);
  const task = getById(result.lastInsertRowid);
  logAudit(db, task.id, 'create', [
    { field: 'title', old_value: null, new_value: task.title },
    { field: 'description', old_value: null, new_value: task.description },
    { field: 'status', old_value: null, new_value: task.status },
    { field: 'priority', old_value: null, new_value: task.priority },
  ]);
  return task;
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

  const changes = [];
  if (title !== existing.title) changes.push({ field: 'title', old_value: existing.title, new_value: title });
  if (description !== existing.description) changes.push({ field: 'description', old_value: existing.description, new_value: description });
  if (status !== existing.status) changes.push({ field: 'status', old_value: existing.status, new_value: status });
  if (priority !== existing.priority) changes.push({ field: 'priority', old_value: existing.priority, new_value: priority });
  if (changes.length > 0) {
    logAudit(db, id, 'update', changes);
  }

  return getById(id);
}

function remove(id) {
  const db = getConnection();
  const existing = getById(id);
  if (!existing) return null;
  logAudit(db, id, 'delete', [
    { field: 'title', old_value: existing.title, new_value: null },
    { field: 'description', old_value: existing.description, new_value: null },
    { field: 'status', old_value: existing.status, new_value: null },
    { field: 'priority', old_value: existing.priority, new_value: null },
  ]);
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
      if (existing.status !== status) {
        logAudit(db, id, 'bulk_update', [
          { field: 'status', old_value: existing.status, new_value: status },
        ]);
      }
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
      logAudit(db, id, 'bulk_delete', [
        { field: 'title', old_value: existing.title, new_value: null },
        { field: 'description', old_value: existing.description, new_value: null },
        { field: 'status', old_value: existing.status, new_value: null },
        { field: 'priority', old_value: existing.priority, new_value: null },
      ]);
      db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      removed.push(existing);
    }
    return removed;
  });
  return txn();
}

function getHistory(taskId, { operation } = {}) {
  const db = getConnection();
  let sql = 'SELECT * FROM audit_log WHERE task_id = ?';
  const params = [taskId];
  if (operation) {
    sql += ' AND operation = ?';
    params.push(operation);
  }
  sql += ' ORDER BY created_at ASC, id ASC';
  const rows = db.prepare(sql).all(...params);
  return rows.map(row => ({
    ...row,
    changes: row.changes ? JSON.parse(row.changes) : null,
  }));
}

function exportAll() {
  const db = getConnection();
  return db.prepare('SELECT * FROM tasks').all();
}

function importTasks(tasks) {
  const db = getConnection();
  const VALID_STATUSES = ['todo', 'in-progress', 'done'];
  const VALID_PRIORITIES = ['low', 'medium', 'high'];

  const txn = db.transaction(() => {
    for (const task of tasks) {
      if (!task.title || typeof task.title !== 'string' || !task.title.trim()) {
        const err = new Error('Import failed: each task must have a non-empty title');
        err.code = 'IMPORT_FAILED';
        throw err;
      }
      if (!task.status || !VALID_STATUSES.includes(task.status)) {
        const err = new Error('Import failed: each task must have a valid status (todo, in-progress, done)');
        err.code = 'IMPORT_FAILED';
        throw err;
      }
      if (task.priority !== undefined && task.priority !== null && !VALID_PRIORITIES.includes(task.priority)) {
        const err = new Error('Import failed: priority must be one of: low, medium, high');
        err.code = 'IMPORT_FAILED';
        throw err;
      }

      const description = task.description || '';
      const priority = task.priority || 'medium';

      if (task.id) {
        const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
        if (existing) {
          db.prepare(
            `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, updated_at = datetime('now') WHERE id = ?`
          ).run(task.title, description, task.status, priority, task.id);
        } else {
          db.prepare(
            `INSERT INTO tasks (id, title, description, status, priority, created_at, updated_at) VALUES (?, ?, ?, ?, ?, COALESCE(?, datetime('now')), datetime('now'))`
          ).run(task.id, task.title, description, task.status, priority, task.created_at || null);
        }
      } else {
        db.prepare(
          `INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)`
        ).run(task.title, description, task.status, priority);
      }
    }

    // Log a single audit entry for the entire import
    logAudit(db, 0, 'import', {
      task_count: tasks.length,
      file_size: JSON.stringify({ tasks }).length,
      outcome: 'success',
    });

    return tasks.length;
  });

  return txn();
}

module.exports = { getAll, getById, getFiltered, create, update, remove, bulkUpdateStatus, bulkRemove, getHistory, exportAll, importTasks, VALID_TRANSITIONS };
