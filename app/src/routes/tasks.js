const { Router } = require('express');
const Task = require('../models/task');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

const router = Router();

// GET /tasks — list all tasks (with optional filtering and sorting)
router.get('/', (req, res) => {
  const { status, search, sort, order } = req.query;

  // Validate status if provided
  if (status !== undefined && !['todo', 'in-progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be one of: todo, in-progress, done' });
  }

  // Treat empty search as no-op
  const effectiveSearch = search && search.trim() ? search.trim() : undefined;

  if (status || effectiveSearch) {
    const tasks = Task.getFiltered({ status, search: effectiveSearch, sort, order });
    return res.json(tasks);
  }

  const tasks = Task.getAll({ sort, order });
  res.json(tasks);
});

// PATCH /tasks/bulk — bulk status update
router.patch('/bulk', (req, res) => {
  const { ids, status } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  if (ids.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 tasks per bulk operation' });
  }
  if (!status || !['todo', 'in-progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: todo, in-progress, done' });
  }

  try {
    const updated = Task.bulkUpdateStatus(ids, status);
    res.json(updated);
  } catch (err) {
    if (err.code === 'BULK_FAILED') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

// DELETE /tasks/bulk — bulk delete
router.delete('/bulk', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  if (ids.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 tasks per bulk operation' });
  }

  try {
    const removed = Task.bulkRemove(ids);
    res.json(removed);
  } catch (err) {
    if (err.code === 'BULK_FAILED') {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

// GET /tasks/:id/history — get audit log for a task
router.get('/:id/history', (req, res) => {
  const { operation } = req.query;
  const history = Task.getHistory(req.params.id, { operation });
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
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
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
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
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
