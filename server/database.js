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
    has_sprint INTEGER DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    quali_completed INTEGER DEFAULT 0,
    sprint_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Predictions table - team selection (4 drivers, 1 per team)
  db.run(`CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    driver1 TEXT NOT NULL,
    driver2 TEXT NOT NULL,
    driver3 TEXT NOT NULL,
    driver4 TEXT NOT NULL,
    quali_pos1 TEXT,
    quali_pos2 TEXT,
    quali_pos3 TEXT,
    race_points INTEGER DEFAULT 0,
    quali_points INTEGER DEFAULT 0,
    sprint_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (race_id) REFERENCES races(id),
    UNIQUE(user_id, race_id)
  )`);

  // Race results table - top 10 finishers
  db.run(`CREATE TABLE IF NOT EXISTS race_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    position1 TEXT NOT NULL,
    position2 TEXT NOT NULL,
    position3 TEXT NOT NULL,
    position4 TEXT NOT NULL,
    position5 TEXT NOT NULL,
    position6 TEXT NOT NULL,
    position7 TEXT NOT NULL,
    position8 TEXT NOT NULL,
    position9 TEXT NOT NULL,
    position10 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id),
    UNIQUE(race_id)
  )`);

  // Qualifying results table - top 3
  db.run(`CREATE TABLE IF NOT EXISTS quali_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    position1 TEXT NOT NULL,
    position2 TEXT NOT NULL,
    position3 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id),
    UNIQUE(race_id)
  )`);

  // Sprint results table - top 8 get points
  db.run(`CREATE TABLE IF NOT EXISTS sprint_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER NOT NULL,
    position1 TEXT NOT NULL,
    position2 TEXT NOT NULL,
    position3 TEXT NOT NULL,
    position4 TEXT NOT NULL,
    position5 TEXT NOT NULL,
    position6 TEXT NOT NULL,
    position7 TEXT NOT NULL,
    position8 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id),
    UNIQUE(race_id)
  )`);

  // Create default admin user (username: admin, password: admin123)
  const bcrypt = require('bcryptjs');
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const defaultPassword = bcrypt.hashSync(adminPassword, 10);
  
  db.run(`INSERT OR IGNORE INTO users (username, password, is_admin) 
          VALUES (?, ?, 1)`, [adminUsername, defaultPassword], function(err) {
    if (!err && this.changes > 0) {
      console.log('\n✅ Default admin account created:');
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('⚠️  Please change the password after first login!\n');
    }
  });
  
  console.log('Database initialized');
});

module.exports = db;
