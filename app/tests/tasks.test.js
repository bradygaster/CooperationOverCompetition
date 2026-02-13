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

    it('filters tasks by status', async () => {
      // Create tasks with known statuses
      const t1 = await request(app).post('/tasks').send({ title: 'Filter todo' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Filter progress' }).expect(201);
      await request(app).patch(`/tasks/${t2.body.id}`).send({ status: 'in-progress' }).expect(200);

      const res = await request(app).get('/tasks?status=todo').expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.every(t => t.status === 'todo'), 'All returned tasks should have status todo');
      assert.ok(res.body.some(t => t.title === 'Filter todo'));
    });

    it('filters tasks by search (case-insensitive)', async () => {
      await request(app).post('/tasks').send({ title: 'Buy groceries' }).expect(201);
      await request(app).post('/tasks').send({ title: 'BUYING supplies' }).expect(201);

      const res = await request(app).get('/tasks?search=buy').expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length >= 2);
      assert.ok(res.body.every(t => t.title.toLowerCase().includes('buy')));
    });

    it('combines status and search filters', async () => {
      await request(app).post('/tasks').send({ title: 'Design homepage' }).expect(201);
      const t = await request(app).post('/tasks').send({ title: 'Design API' }).expect(201);
      await request(app).patch(`/tasks/${t.body.id}`).send({ status: 'in-progress' }).expect(200);

      const res = await request(app).get('/tasks?status=in-progress&search=design').expect(200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.every(t => t.status === 'in-progress'));
      assert.ok(res.body.every(t => t.title.toLowerCase().includes('design')));
      assert.ok(res.body.some(t => t.title === 'Design API'));
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app).get('/tasks?status=invalid').expect(400);
      assert.ok(res.body.error);
    });

    it('returns all tasks when search is empty', async () => {
      const all = await request(app).get('/tasks').expect(200);
      const filtered = await request(app).get('/tasks?search=').expect(200);
      assert.equal(all.body.length, filtered.body.length);
    });

    it('does not return deleted tasks in filtered results', async () => {
      const created = await request(app).post('/tasks').send({ title: 'DeleteFilterTest' }).expect(201);
      await request(app).delete(`/tasks/${created.body.id}`).expect(200);

      const res = await request(app).get('/tasks?search=DeleteFilterTest').expect(200);
      assert.equal(res.body.length, 0);
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

  describe('Priority', () => {
    it('creates a task with default priority medium', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Default prio task' })
        .expect(201);

      assert.equal(res.body.priority, 'medium');
    });

    it('creates a task with explicit priority', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'High prio', priority: 'high' })
        .expect(201);

      assert.equal(res.body.priority, 'high');
    });

    it('returns 400 for invalid priority on create', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Bad prio', priority: 'urgent' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('updates priority via PATCH without affecting other fields', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Patch prio', description: 'keep me', priority: 'low' })
        .expect(201);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ priority: 'high' })
        .expect(200);

      assert.equal(res.body.priority, 'high');
      assert.equal(res.body.title, 'Patch prio');
      assert.equal(res.body.description, 'keep me');
      assert.equal(res.body.status, 'todo');
    });

    it('returns 400 for invalid priority on PATCH', async () => {
      const created = await request(app)
        .post('/tasks')
        .send({ title: 'Bad patch prio' })
        .expect(201);

      const res = await request(app)
        .patch(`/tasks/${created.body.id}`)
        .send({ priority: 'critical' })
        .expect(400);

      assert.ok(res.body.error);
    });

    it('sorts by priority high → medium → low', async () => {
      await request(app).post('/tasks').send({ title: 'API-Sort-Low', priority: 'low' }).expect(201);
      await request(app).post('/tasks').send({ title: 'API-Sort-High', priority: 'high' }).expect(201);
      await request(app).post('/tasks').send({ title: 'API-Sort-Med', priority: 'medium' }).expect(201);

      const res = await request(app).get('/tasks?sort=priority&search=API-Sort').expect(200);
      const priorities = res.body.map(t => t.priority);
      const highIdx = priorities.indexOf('high');
      const medIdx = priorities.indexOf('medium');
      const lowIdx = priorities.indexOf('low');
      assert.ok(highIdx < medIdx, 'high before medium');
      assert.ok(medIdx < lowIdx, 'medium before low');
    });

    it('sorts by priority low → medium → high with order=desc', async () => {
      const res = await request(app).get('/tasks?sort=priority&order=desc&search=API-Sort').expect(200);
      const priorities = res.body.map(t => t.priority);
      const lowIdx = priorities.indexOf('low');
      const medIdx = priorities.indexOf('medium');
      const highIdx = priorities.indexOf('high');
      assert.ok(lowIdx < medIdx, 'low before medium in desc');
      assert.ok(medIdx < highIdx, 'medium before high in desc');
    });

    it('priority sort works with status filter', async () => {
      await request(app).post('/tasks').send({ title: 'API-PS-Low', priority: 'low' }).expect(201);
      await request(app).post('/tasks').send({ title: 'API-PS-High', priority: 'high' }).expect(201);

      const res = await request(app).get('/tasks?status=todo&sort=priority&search=API-PS').expect(200);
      assert.ok(res.body.length >= 2);
      const titles = res.body.map(t => t.title);
      const highIdx = titles.indexOf('API-PS-High');
      const lowIdx = titles.indexOf('API-PS-Low');
      assert.ok(highIdx < lowIdx, 'high priority should come first');
    });
  });
});
