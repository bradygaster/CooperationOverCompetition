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
});
