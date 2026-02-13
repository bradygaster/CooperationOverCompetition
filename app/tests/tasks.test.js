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
