const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'taskboard.db');

let db;

function getConnection() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// For testing — close and reset the singleton
function closeConnection() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getConnection, closeConnection };
