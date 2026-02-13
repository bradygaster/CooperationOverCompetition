const { getConnection } = require('../db/connection');

function insertLog(taskId, operation, fieldName, oldValue, newValue) {
  const db = getConnection();
  db.prepare(
    `INSERT INTO audit_log (task_id, operation, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)`
  ).run(taskId, operation, fieldName, oldValue, newValue);
}

function getHistory(taskId, { operation } = {}) {
  const db = getConnection();
  const conditions = ['task_id = ?'];
  const params = [taskId];

  if (operation) {
    conditions.push('operation = ?');
    params.push(operation);
  }

  const where = conditions.join(' AND ');
  return db.prepare(`SELECT * FROM audit_log WHERE ${where} ORDER BY timestamp ASC, id ASC`).all(...params);
}

module.exports = { insertLog, getHistory };
