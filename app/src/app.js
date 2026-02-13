const express = require('express');
const { migrate } = require('./db/migrate');
const taskRoutes = require('./routes/tasks');

function createApp() {
  migrate();

  const app = express();
  app.use(express.json());
  app.use('/tasks', taskRoutes);

  return app;
}

module.exports = { createApp };
