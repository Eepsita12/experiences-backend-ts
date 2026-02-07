import sqlite3 from 'sqlite3'
import path from 'path'

console.log('Initializing database...')

const dbPath = path.join(__dirname, '../../database.sqlite')
console.log('🧠 SQLite DB PATH:', dbPath)


export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log("Failed to connect to DB", err);
    } else {
        console.log("Connected to SQLite databse");

    }
})

db.serialize(() => {
    //users
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'host', 'user')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`)

    //experiences
    db.run(`
    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      price INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      created_by INTEGER NOT NULL,
      status TEXT CHECK(status IN ('draft', 'published', 'blocked')) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
`)

    //bookings
    db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experience_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      seats INTEGER CHECK(seats >= 1) NOT NULL,
      status TEXT CHECK(status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (experience_id) REFERENCES experiences(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE (experience_id, user_id)
    )
`)

    //indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_experiences_location_time ON experiences(location, start_time)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_user_exp ON bookings(user_id, experience_id)`)

})