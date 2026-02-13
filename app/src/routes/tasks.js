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
