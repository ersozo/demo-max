import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database connection
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table if it doesn't exist
const createUsersTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create events table if it doesn't exist
const createEventsTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT,
    date DATETIME NOT NULL,
    image_url TEXT,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Create event registrations table if it doesn't exist
const createRegistrationsTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
  )
`);

// Database migration function to add image_url column if it doesn't exist
const migrateDatabase = () => {
  try {
    // Check if image_url column exists in events table
    const tableInfo = db.prepare("PRAGMA table_info(events)").all();
    const imageUrlColumnExists = tableInfo.some(column => column.name === 'image_url');
    
    if (!imageUrlColumnExists) {
      console.log('Adding image_url column to events table...');
      db.prepare("ALTER TABLE events ADD COLUMN image_url TEXT").run();
      console.log('Successfully added image_url column to events table');
    }
  } catch (error) {
    // If table doesn't exist yet, this will fail silently
    // and the table will be created with the full schema below
    console.log('Migration skipped - events table will be created with full schema');
  }
};

// Initialize database
try {
  createUsersTable.run();
  createEventsTable.run();
  createRegistrationsTable.run();
  
  // Run migration for existing databases
  migrateDatabase();
  
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

export default db;