const { Router } = require('express');
const Task = require('../models/task');

const router = Router();

// GET /tasks — list all tasks
router.get('/', (req, res) => {
  const tasks = Task.getAll();
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
  const { title, description } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }
  const task = Task.create({ title: title.trim(), description: description || '' });
  res.status(201).json(task);
});

// PATCH /tasks/:id — update a task
router.patch('/:id', (req, res) => {
  const { title, description, status } = req.body;

  // Validate title if provided
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }

  // Validate status value if provided
  if (status !== undefined && !['todo', 'in-progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: todo, in-progress, done' });
  }

  try {
    const fields = {};
    if (title !== undefined) fields.title = title.trim();
    if (description !== undefined) fields.description = description;
    if (status !== undefined) fields.status = status;

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
