const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create (or open) the database file
const db = new sqlite3.Database(
  path.join(__dirname, "emr.db"),
  (err) => {
    if (err) {
      console.error("Database connection error:", err.message);
    } else {
      console.log("Connected to EMR SQLite database");
    }
  }
);

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      phone TEXT
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      datetime TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'scheduled',
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('staff','doctor','patient')),
    patient_id INTEGER,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  )
`);

db.run(`CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)`);

});

module.exports = db;

