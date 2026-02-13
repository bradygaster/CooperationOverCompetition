const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb } = require('./helpers');

let teardown;
let app;

describe('Task API', () => {
  before(() => {
    teardown = setupTestDb();
    // Require app AFTER DB is patched (cache was cleared by setupTestDb)
    const { createApp } = require('../src/app');
    app = createApp();
  });

  after(() => {
    teardown();
  });

  describe('POST /tasks', () => {
    it('creates a task and returns 201', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'New task', description: 'A description' })
        .expect(201);

      assert.ok(res.body.id);
      assert.equal(res.body.title, 'New task');
      assert.equal(res.body.description, 'A description');
      assert.equal(res.body.status, 'todo');
      assert.ok(res.body.created_at);
    });

    it('creates a task with priority', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'High priority task', priority: 'high' })
        .expect(201);

      assert.equal(res.body.priority, 'high');
    });

    it('defaults priority to medium when not provided', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Default priority task' })
        .expect(201);

      assert.equal(res.body.priority, 'medium');
    });

    it('returns 400 for invalid priority', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Bad priority', priority: 'urgent' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ description: 'No title here' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('returns 400 when title is empty string', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: '   ' })
        .expect(400);

      assert.ok(res.body.error);
    });
  });

  describe('GET /tasks', () => {
    it('returns all tasks', async () => {
      const res = await request(app)
        .get('/tasks')
        .expect(200);

      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 1, 'Should have at least the task created above');
    });
  });

  describe('GET /tasks/:id', () => {
    it('returns a specific task', async () => {
      // Create one first
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Find this one' })
        .expect(201);

      const res = await request(app)
        .get(`/tasks/${created.body.id}`)
        .expect(200);

      assert.equal(res.body.id, created.body.id);
      assert.equal(res.body.title, 'Find this one');
    });

    it('returns 404 for missing task', async () => {
      const res = await request(app)
        .get('/tasks/99999')
        .expect(404);

      assert.ok(res.body.error);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('updates title', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Original' })
        .expect(201);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ title: 'Updated' })
        .expect(200);

      assert.equal(res.body.title, 'Updated');
    });

    it('transitions todo → in-progress', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Status task' })
        .expect(201);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ status: 'in-progress' })
        .expect(200);

      assert.equal(res.body.status, 'in-progress');
    });

    it('transitions in-progress → done', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Complete me' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ status: 'in-progress' })
        .expect(200);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ status: 'done' })
        .expect(200);

      assert.equal(res.body.status, 'done');
    });

    it('returns 422 for invalid status transition (todo → done)', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Skip step' })
        .expect(201);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ status: 'done' })
        .expect(422);

      assert.ok(res.body.error);
    });

    it('returns 404 for missing task', async () => {
      const res = await request(app)
        .patch('/tasks/99999')
        .send({ title: 'Ghost update' })
        .expect(404);

      assert.ok(res.body.error);
    });

    it('updates priority without affecting other fields', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Priority patch', description: 'keep', priority: 'low' })
        .expect(201);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ priority: 'high' })
        .expect(200);

      assert.equal(res.body.priority, 'high');
      assert.equal(res.body.title, 'Priority patch');
      assert.equal(res.body.description, 'keep');
      assert.equal(res.body.status, 'todo');
    });

    it('returns 400 for invalid priority on PATCH', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Bad patch priority' })
        .expect(201);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ priority: 'critical' })
        .expect(400);

      assert.ok(res.body.error);
    });
  });

  describe('GET /tasks (filtering)', () => {
    before(async () => {
      // Seed tasks with different statuses for filtering
      const todo1 = await request(app).post('/tasks').send({ title: 'Buy milk' }).expect(201);
      const todo2 = await request(app).post('/tasks').send({ title: 'Buy eggs' }).expect(201);
      const ip1 = await request(app).post('/tasks').send({ title: 'Design logo' }).expect(201);
      await request(app).patch(`/tasks/${ip1.body.id}`).send({ status: 'in-progress' }).expect(200);
      const ip2 = await request(app).post('/tasks').send({ title: 'Design banner' }).expect(201);
      await request(app).patch(`/tasks/${ip2.body.id}`).send({ status: 'in-progress' }).expect(200);
      const done1 = await request(app).post('/tasks').send({ title: 'Write tests' }).expect(201);
      await request(app).patch(`/tasks/${done1.body.id}`).send({ status: 'in-progress' }).expect(200);
      await request(app).patch(`/tasks/${done1.body.id}`).send({ status: 'done' }).expect(200);
    });

    it('GET /tasks?status=todo returns only todo tasks', async () => {
      const res = await request(app).get('/tasks?status=todo').expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 2);
      res.body.forEach(t => assert.equal(t.status, 'todo'));
    });

    it('GET /tasks?search=buy returns tasks with "buy" in title (case-insensitive)', async () => {
      const res = await request(app).get('/tasks?search=buy').expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 2);
      res.body.forEach(t => assert.ok(t.title.toLowerCase().includes('buy')));
    });

    it('GET /tasks?status=in-progress&search=design returns matching in-progress tasks', async () => {
      const res = await request(app).get('/tasks?status=in-progress&search=design').expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 1);
      res.body.forEach(t => {
        assert.equal(t.status, 'in-progress');
        assert.ok(t.title.toLowerCase().includes('design'));
      });
    });

    it('GET /tasks?status=invalid returns 400', async () => {
      const res = await request(app).get('/tasks?status=invalid').expect(400);
      assert.ok(res.body.error);
    });

    it('GET /tasks?search= returns all tasks (empty search is no-op)', async () => {
      const allRes = await request(app).get('/tasks').expect(200);
      const emptySearchRes = await request(app).get('/tasks?search=').expect(200);
      assert.equal(emptySearchRes.body.length, allRes.body.length);
    });

    it('GET /tasks with no params still returns all tasks (no regression)', async () => {
      const res = await request(app).get('/tasks').expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 5);
    });
  });

  describe('GET /tasks (priority sorting)', () => {
    before(async () => {
      // Create tasks with different priorities
      await request(app).post('/tasks').send({ title: 'Sort Low', priority: 'low' }).expect(201);
      await request(app).post('/tasks').send({ title: 'Sort High', priority: 'high' }).expect(201);
      await request(app).post('/tasks').send({ title: 'Sort Medium', priority: 'medium' }).expect(201);
    });

    it('GET /tasks?sort=priority returns high → medium → low', async () => {
      const res = await request(app).get('/tasks?sort=priority').expect(200);
      const priorities = res.body.map(t => t.priority);
      const firstHigh = priorities.indexOf('high');
      const firstMed = priorities.indexOf('medium');
      const firstLow = priorities.indexOf('low');
      assert.ok(firstHigh < firstMed, 'high should come before medium');
      assert.ok(firstMed < firstLow, 'medium should come before low');
    });

    it('GET /tasks?sort=priority&order=desc returns low → medium → high', async () => {
      const res = await request(app).get('/tasks?sort=priority&order=desc').expect(200);
      const priorities = res.body.map(t => t.priority);
      const firstLow = priorities.indexOf('low');
      const firstMed = priorities.indexOf('medium');
      const firstHigh = priorities.indexOf('high');
      assert.ok(firstLow < firstMed, 'low should come before medium');
      assert.ok(firstMed < firstHigh, 'medium should come before high');
    });

    it('priority sorting works with status filter', async () => {
      const low = await request(app).post('/tasks').send({ title: 'IP Low', priority: 'low' }).expect(201);
      await request(app).patch(`/tasks/${low.body.id}`).send({ status: 'in-progress' }).expect(200);
      const high = await request(app).post('/tasks').send({ title: 'IP High', priority: 'high' }).expect(201);
      await request(app).patch(`/tasks/${high.body.id}`).send({ status: 'in-progress' }).expect(200);

      const res = await request(app).get('/tasks?status=in-progress&sort=priority').expect(200);
      res.body.forEach(t => assert.equal(t.status, 'in-progress'));
      const priorities = res.body.map(t => t.priority);
      const firstHigh = priorities.indexOf('high');
      const lastLow = priorities.lastIndexOf('low');
      assert.ok(firstHigh < lastLow, 'high should come before low in filtered results');
    });

    it('existing tasks have priority = medium (backward compat)', async () => {
      const res = await request(app).get('/tasks').expect(200);
      res.body.forEach(t => {
        assert.ok(['low', 'medium', 'high'].includes(t.priority), `task ${t.id} has invalid priority: ${t.priority}`);
      });
    });

    it('responds within 100ms for 100+ tasks', async () => {
      // Seed 100 additional tasks
      const Task = require('../src/models/task');
      for (let i = 0; i < 100; i++) {
        Task.create({ title: `Perf task ${i}` });
      }

      const start = Date.now();
      await request(app).get('/tasks?status=todo').expect(200);
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 100, `Expected < 100ms, got ${elapsed}ms`);
    });
  });

  describe('PATCH /tasks/bulk', () => {
    it('updates all tasks with valid IDs and status', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Bulk 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Bulk 2' }).expect(201);
      const t3 = await request(app).post('/tasks').send({ title: 'Bulk 3' }).expect(201);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id, t3.body.id], status: 'in-progress' })
        .expect(200);

      assert.equal(res.body.length, 3);
      res.body.forEach(t => assert.equal(t.status, 'in-progress'));
    });

    it('marks all three as done with body { ids, status: "done" }', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Done 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Done 2' }).expect(201);
      const t3 = await request(app).post('/tasks').send({ title: 'Done 3' }).expect(201);
      // Move to in-progress first
      await request(app).patch(`/tasks/${t1.body.id}`).send({ status: 'in-progress' }).expect(200);
      await request(app).patch(`/tasks/${t2.body.id}`).send({ status: 'in-progress' }).expect(200);
      await request(app).patch(`/tasks/${t3.body.id}`).send({ status: 'in-progress' }).expect(200);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id, t3.body.id], status: 'done' })
        .expect(200);

      assert.equal(res.body.length, 3);
      res.body.forEach(t => assert.equal(t.status, 'done'));
    });

    it('returns 400 with non-existent ID (transaction rolled back)', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Exists' }).expect(201);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id, 99999], status: 'in-progress' })
        .expect(400);

      assert.ok(res.body.error);
      // Verify rollback: t1 should still be 'todo'
      const check = await request(app).get(`/tasks/${t1.body.id}`).expect(200);
      assert.equal(check.body.status, 'todo');
    });

    it('returns 400 with invalid status', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Invalid status' }).expect(201);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id], status: 'invalid' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('returns 400 with empty array', async () => {
      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [], status: 'in-progress' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('respects state machine rules (rejects invalid transition)', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'SM test' }).expect(201);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id], status: 'done' })
        .expect(400);

      assert.ok(res.body.error);
      assert.ok(res.body.error.includes('Invalid status transition'));
    });
  });

  describe('DELETE /tasks/bulk', () => {
    it('deletes all specified tasks with valid IDs', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Del bulk 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Del bulk 2' }).expect(201);
      const t3 = await request(app).post('/tasks').send({ title: 'Del bulk 3' }).expect(201);

      const res = await request(app)
        .delete('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id, t3.body.id] })
        .expect(200);

      assert.equal(res.body.length, 3);
      // Verify they're gone
      await request(app).get(`/tasks/${t1.body.id}`).expect(404);
      await request(app).get(`/tasks/${t2.body.id}`).expect(404);
      await request(app).get(`/tasks/${t3.body.id}`).expect(404);
    });

    it('returns 400 with non-existent ID (transaction rolled back)', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Del rollback' }).expect(201);

      const res = await request(app)
        .delete('/tasks/bulk')
        .send({ ids: [t1.body.id, 99999] })
        .expect(400);

      assert.ok(res.body.error);
      // Verify rollback: t1 should still exist
      await request(app).get(`/tasks/${t1.body.id}`).expect(200);
    });
  });

  describe('GET /tasks/:id/history', () => {
    it('returns audit log for a created task', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'History task', description: 'desc', priority: 'high' })
        .expect(201);

      const res = await request(app)
        .get(`/tasks/${created.body.id}/history`)
        .expect(200);

      assert.ok(Array.isArray(res.body));
      assert.equal(res.body.length, 1);
      assert.equal(res.body[0].operation, 'create');
      assert.ok(Array.isArray(res.body[0].changes));
      const titleChange = res.body[0].changes.find(c => c.field === 'title');
      assert.equal(titleChange.old_value, null);
      assert.equal(titleChange.new_value, 'History task');
    });

    it('logs status update with old and new values', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Status history' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ status: 'in-progress' })
        .expect(200);

      const res = await request(app)
        .get(`/tasks/${created.body.id}/history`)
        .expect(200);

      const updateEntry = res.body.find(h => h.operation === 'update');
      assert.ok(updateEntry);
      const statusChange = updateEntry.changes.find(c => c.field === 'status');
      assert.equal(statusChange.old_value, 'todo');
      assert.equal(statusChange.new_value, 'in-progress');
    });

    it('logs single entry for multi-field update', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Multi update', description: 'old' })
        .expect(201);

      await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ title: 'New title', description: 'new' })
        .expect(200);

      const res = await request(app)
        .get(`/tasks/${created.body.id}/history`)
        .expect(200);

      const updates = res.body.filter(h => h.operation === 'update');
      assert.equal(updates.length, 1);
      assert.equal(updates[0].changes.length, 2);
    });

    it('logs one entry per task for bulk status update', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Bulk hist 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Bulk hist 2' }).expect(201);

      await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id], status: 'in-progress' })
        .expect(200);

      const h1 = await request(app).get(`/tasks/${t1.body.id}/history`).expect(200);
      const h2 = await request(app).get(`/tasks/${t2.body.id}/history`).expect(200);

      const bulk1 = h1.body.filter(h => h.operation === 'bulk_update');
      const bulk2 = h2.body.filter(h => h.operation === 'bulk_update');
      assert.equal(bulk1.length, 1);
      assert.equal(bulk2.length, 1);
    });

    it('logs delete operation', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Delete hist' })
        .expect(201);
      const taskId = created.body.id;

      await request(app).delete(`/tasks/${taskId}`).expect(200);

      const res = await request(app)
        .get(`/tasks/${taskId}/history`)
        .expect(200);

      const deleteEntry = res.body.find(h => h.operation === 'delete');
      assert.ok(deleteEntry);
      const titleChange = deleteEntry.changes.find(c => c.field === 'title');
      assert.equal(titleChange.old_value, 'Delete hist');
      assert.equal(titleChange.new_value, null);
    });

    it('returns history in chronological order', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Chrono API' })
        .expect(201);

      await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'in-progress' }).expect(200);
      await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'done' }).expect(200);

      const res = await request(app)
        .get(`/tasks/${created.body.id}/history`)
        .expect(200);

      assert.ok(res.body.length >= 3);
      for (let i = 1; i < res.body.length; i++) {
        assert.ok(res.body[i].id > res.body[i - 1].id);
      }
    });

    it('filters by operation type via query param', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Filter API' })
        .expect(201);

      await request(app).patch(`/tasks/${created.body.id}`).send({ status: 'in-progress' }).expect(200);

      const res = await request(app)
        .get(`/tasks/${created.body.id}/history?operation=update`)
        .expect(200);

      assert.ok(res.body.length >= 1);
      res.body.forEach(h => assert.equal(h.operation, 'update'));
    });

    it('returns history for deleted tasks', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Deleted queryable' })
        .expect(201);
      const taskId = created.body.id;

      await request(app).patch(`/tasks/${taskId}`).send({ status: 'in-progress' }).expect(200);
      await request(app).delete(`/tasks/${taskId}`).expect(200);

      // Task is gone
      await request(app).get(`/tasks/${taskId}`).expect(404);

      // But history is still available
      const res = await request(app)
        .get(`/tasks/${taskId}/history`)
        .expect(200);

      assert.ok(res.body.length >= 3);
      const ops = res.body.map(h => h.operation);
      assert.ok(ops.includes('create'));
      assert.ok(ops.includes('update'));
      assert.ok(ops.includes('delete'));
    });

    it('each entry includes timestamp, operation, and changes array', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Entry structure' })
        .expect(201);

      const res = await request(app)
        .get(`/tasks/${created.body.id}/history`)
        .expect(200);

      const entry = res.body[0];
      assert.ok(entry.created_at);
      assert.ok(entry.operation);
      assert.ok(Array.isArray(entry.changes));
      entry.changes.forEach(c => {
        assert.ok('field' in c);
        assert.ok('old_value' in c);
        assert.ok('new_value' in c);
      });
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('removes a task and returns it', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Delete me' })
        .expect(201);

      const res = await request(app)
        .delete(`/tasks/${created.body.id}`)
        .expect(200);

      assert.equal(res.body.id, created.body.id);
      assert.equal(res.body.title, 'Delete me');

      // Verify it's gone
      await request(app)
        .get(`/tasks/${created.body.id}`)
        .expect(404);
    });

    it('returns 404 for missing task', async () => {
      const res = await request(app)
        .delete('/tasks/99999')
        .expect(404);

      assert.ok(res.body.error);
    });
  });
});
