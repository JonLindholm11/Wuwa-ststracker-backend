// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in project root
const dbPath = path.join(__dirname, 'wuwa_stats.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database:', dbPath);
  }
});

// Create tables if they don't exist
const initializeDatabase = () => {
  // User character stats table
  const createStatsTable = `
    CREATE TABLE IF NOT EXISTS user_character_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      character_id TEXT NOT NULL,
      character_name TEXT NOT NULL,
      hp INTEGER,
      attack INTEGER,
      defense INTEGER,
      dmg_bonus REAL,
      crit_rate REAL,
      crit_damage REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, character_id)
    )
  `;

  db.run(createStatsTable, (err) => {
    if (err) {
      console.error('Error creating user_character_stats table:', err.message);
    } else {
      console.log('user_character_stats table ready');
    }
  });

  // Optional: Create users table for future expansion
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('users table ready');
    }
  });
};

// Database operations for user character stats
const statsOperations = {
  // Get stats for a specific user and character
  getStats: (userId, characterId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM user_character_stats 
        WHERE user_id = ? AND character_id = ?
      `;
      
      db.get(query, [userId, characterId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Save or update stats
  saveStats: (statsData) => {
    return new Promise((resolve, reject) => {
      const {
        userId,
        username,
        characterId,
        characterName,
        stats
      } = statsData;

      const query = `
        INSERT OR REPLACE INTO user_character_stats 
        (user_id, username, character_id, character_name, hp, attack, defense, dmg_bonus, crit_rate, crit_damage, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const values = [
        userId,
        username,
        characterId,
        characterName,
        stats.hp || null,
        stats.attack || null,
        stats.defense || null,
        stats.dmgBonus || null,
        stats.critRate || null,
        stats.critDamage || null
      ];

      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  },

  // Delete stats for a user and character
  deleteStats: (userId, characterId) => {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM user_character_stats 
        WHERE user_id = ? AND character_id = ?
      `;
      
      db.run(query, [userId, characterId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            changes: this.changes
          });
        }
      });
    });
  },

  // Get all characters for a user
  getUserCharacters: (userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT character_id, character_name, hp, attack, defense, dmg_bonus, crit_rate, crit_damage, updated_at
        FROM user_character_stats 
        WHERE user_id = ?
        ORDER BY character_name
      `;
      
      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
};

// User operations
const userOperations = {
  // Create or update user
  saveUser: (userId, username) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO users 
        (id, username, last_active)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [userId, username], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: userId,
            username: username
          });
        }
      });
    });
  },

  // Get user by ID
  getUser: (userId) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE id = ?`;
      
      db.get(query, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
};

module.exports = {
  db,
  initializeDatabase,
  statsOperations,
  userOperations
};