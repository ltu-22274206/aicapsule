const path = require("path");
const Database = require("better-sqlite3");

// on render's free tier the filesystem is ephemeral, so this file (and any
// data in it) can be wiped on redeploy/restart. that's explained in the README.
const dbPath = path.join(__dirname, "capsule.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS capsules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    prompt_title TEXT NOT NULL,
    prompt_version TEXT,
    prompt_text TEXT NOT NULL,
    response_summary TEXT,
    category TEXT,
    usefulness TEXT,
    reviewed INTEGER DEFAULT 0,
    improved INTEGER DEFAULT 0,
    screenshot_url TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
