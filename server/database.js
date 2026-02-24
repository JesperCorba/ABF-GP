const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'f1predictions.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Races table
  db.run(`CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    race_date DATE NOT NULL,
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Predictions table
  db.run(`CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    driver1 TEXT NOT NULL,
    driver2 TEXT NOT NULL,
    driver3 TEXT NOT NULL,
    position1 TEXT NOT NULL,
    position2 TEXT NOT NULL,
    position3 TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (race_id) REFERENCES races(id),
    UNIQUE(user_id, race_id)
  )`);

  // Results table
  db.run(`CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    position1 TEXT NOT NULL,
    position2 TEXT NOT NULL,
    position3 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id),
    UNIQUE(race_id)
  )`);

  // Create default admin user (username: admin, password: admin123)
  const bcrypt = require('bcryptjs');
  const defaultPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(`INSERT OR IGNORE INTO users (username, password, is_admin) 
          VALUES ('admin', ?, 1)`, [defaultPassword]);
  
  console.log('Database initialized');
});

module.exports = db;
