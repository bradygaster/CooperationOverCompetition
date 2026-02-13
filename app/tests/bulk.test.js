const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb } = require('./helpers');

let teardown;
let app;

describe('Bulk Operations API', () => {
  before(() => {
    teardown = setupTestDb();
    const { createApp } = require('../src/app');
    app = createApp();
  });

  after(() => {
    teardown();
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
      assert.ok(res.body.every(t => t.status === 'in-progress'));
    });

    it('marks all three tasks as done with body { ids: [1,2,3], status: "done" }', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Done 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Done 2' }).expect(201);
      const t3 = await request(app).post('/tasks').send({ title: 'Done 3' }).expect(201);

      // Move to in-progress first
      await request(app).patch('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id, t3.body.id], status: 'in-progress' })
        .expect(200);

      // Now move to done
      const res = await request(app).patch('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id, t3.body.id], status: 'done' })
        .expect(200);

      assert.equal(res.body.length, 3);
      assert.ok(res.body.every(t => t.status === 'done'));
    });

    it('returns 400 with non-existent ID (transaction rolled back)', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Exists' }).expect(201);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id, 99999], status: 'in-progress' })
        .expect(400);

      assert.ok(res.body.error);

      // Verify rollback: the existing task should NOT have been updated
      const check = await request(app).get(`/tasks/${t1.body.id}`).expect(200);
      assert.equal(check.body.status, 'todo');
    });

    it('returns 400 with invalid status', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Bad status' }).expect(201);

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

    it('respects state machine rules (no backward moves)', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'SM test' }).expect(201);
      await request(app).patch(`/tasks/${t1.body.id}`).send({ status: 'in-progress' }).expect(200);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id], status: 'todo' })
        .expect(400);

      assert.ok(res.body.error);
      assert.ok(res.body.error.includes('Invalid status transition'));
    });

    it('respects state machine rules (no skipping steps)', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Skip test' }).expect(201);

      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id], status: 'done' })
        .expect(400);

      assert.ok(res.body.error);
      assert.ok(res.body.error.includes('Invalid status transition'));
    });

    it('rolls back when one task has invalid transition in batch', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Batch OK' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Batch Fail' }).expect(201);
      await request(app).patch(`/tasks/${t2.body.id}`).send({ status: 'in-progress' }).expect(200);
      await request(app).patch(`/tasks/${t2.body.id}`).send({ status: 'done' }).expect(200);

      // t1 is todo, t2 is done - trying to move both to in-progress should fail on t2
      const res = await request(app)
        .patch('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id], status: 'in-progress' })
        .expect(400);

      assert.ok(res.body.error);

      // t1 should still be todo (rolled back)
      const check = await request(app).get(`/tasks/${t1.body.id}`).expect(200);
      assert.equal(check.body.status, 'todo');
    });
  });

  describe('DELETE /tasks/bulk', () => {
    it('deletes all specified tasks with valid IDs', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Del 1' }).expect(201);
      const t2 = await request(app).post('/tasks').send({ title: 'Del 2' }).expect(201);
      const t3 = await request(app).post('/tasks').send({ title: 'Del 3' }).expect(201);

      const res = await request(app)
        .delete('/tasks/bulk')
        .send({ ids: [t1.body.id, t2.body.id, t3.body.id] })
        .expect(200);

      assert.equal(res.body.length, 3);

      // Verify all are gone
      await request(app).get(`/tasks/${t1.body.id}`).expect(404);
      await request(app).get(`/tasks/${t2.body.id}`).expect(404);
      await request(app).get(`/tasks/${t3.body.id}`).expect(404);
    });

    it('returns 400 with non-existent ID (transaction rolled back)', async () => {
      const t1 = await request(app).post('/tasks').send({ title: 'Del Exists' }).expect(201);

      const res = await request(app)
        .delete('/tasks/bulk')
        .send({ ids: [t1.body.id, 99999] })
        .expect(400);

      assert.ok(res.body.error);

      // Verify rollback: task should still exist
      const check = await request(app).get(`/tasks/${t1.body.id}`).expect(200);
      assert.equal(check.body.title, 'Del Exists');
    });

    it('returns 400 with empty array', async () => {
      const res = await request(app)
        .delete('/tasks/bulk')
        .send({ ids: [] })
        .expect(400);

      assert.ok(res.body.error);
    });
  });
});
