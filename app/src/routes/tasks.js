const express = require('express');
const { Router } = require('express');
const Task = require('../models/task');
const AuditLog = require('../models/auditLog');

const router = Router();

const MAX_IMPORT_SIZE = 10 * 1024 * 1024; // 10MB

// GET /tasks/export — export all tasks
router.get('/export', (req, res) => {
  const data = Task.exportAll();
  res.json(data);
});

// POST /tasks/import — import tasks from JSON
router.post('/import', express.json({ limit: '10mb' }), (req, res) => {
  const body = req.body;

  if (!body || !Array.isArray(body.tasks)) {
    return res.status(400).json({ error: 'Request body must contain a "tasks" array' });
  }

  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > MAX_IMPORT_SIZE) {
    return res.status(400).json({ error: 'Import file exceeds maximum size of 10MB' });
  }

  try {
    const imported = Task.importTasks(body.tasks);

    // Log a single audit event for the import
    const fileSize = contentLength ? parseInt(contentLength, 10) : JSON.stringify(body).length;
    AuditLog.insertLog(0, 'import', null,
      JSON.stringify({ file_size: fileSize, task_count: imported.length }),
      JSON.stringify({ outcome: 'success' })
    );

    res.json({
      imported: imported.length,
      tasks: imported,
    });
  } catch (err) {
    if (err.code === 'INVALID_IMPORT') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

// GET /tasks — list tasks with optional filtering
router.get('/', (req, res) => {
  const { status, search, sort, order } = req.query;
  try {
    const tasks = Task.getFiltered({ status, search, sort, order });
    res.json(tasks);
  } catch (err) {
    if (err.code === 'INVALID_STATUS') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

// PATCH /tasks/bulk — bulk status update
router.patch('/bulk', (req, res) => {
  const { ids, status } = req.body;
  try {
    const updated = Task.bulkUpdateStatus(ids, status);
    res.json(updated);
  } catch (err) {
    if (err.code === 'INVALID_INPUT' || err.code === 'INVALID_STATUS' || err.code === 'NOT_FOUND' || err.code === 'INVALID_TRANSITION') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

// DELETE /tasks/bulk — bulk delete
router.delete('/bulk', (req, res) => {
  const { ids } = req.body;
  try {
    const deleted = Task.bulkDelete(ids);
    res.json(deleted);
  } catch (err) {
    if (err.code === 'INVALID_INPUT' || err.code === 'NOT_FOUND') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

// GET /tasks/:id/history — get audit log for a task
router.get('/:id/history', (req, res) => {
  const { operation } = req.query;
  if (operation && !['create', 'update', 'delete', 'import'].includes(operation)) {
    return res.status(400).json({ error: 'operation must be one of: create, update, delete, import' });
  }
  const history = AuditLog.getHistory(req.params.id, { operation });
  res.json(history);
});

// GET /tasks/:id — get one task
router.get('/:id', (req, res) => {
  const task = Task.getById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// POST /tasks — create a task
router.post('/', (req, res) => {
  const { title, description, priority } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'priority must be one of: low, medium, high' });
  }
  const task = Task.create({ title: title.trim(), description: description || '', priority });
  res.status(201).json(task);
});

// PATCH /tasks/:id — update a task
router.patch('/:id', (req, res) => {
  const { title, description, status, priority } = req.body;

  // Validate title if provided
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }

  // Validate status value if provided
  if (status !== undefined && !['todo', 'in-progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: todo, in-progress, done' });
  }

  // Validate priority if provided
  if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'priority must be one of: low, medium, high' });
  }

  try {
    const fields = {};
    if (title !== undefined) fields.title = title.trim();
    if (description !== undefined) fields.description = description;
    if (status !== undefined) fields.status = status;
    if (priority !== undefined) fields.priority = priority;

    const task = Task.update(req.params.id, fields);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    if (err.code === 'INVALID_TRANSITION') {
      return res.status(422).json({ error: err.message });
    }
    throw err;
  }
});

// DELETE /tasks/:id — delete a task
router.delete('/:id', (req, res) => {
  const task = Task.remove(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.status(200).json(task);
});

module.exports = router;
