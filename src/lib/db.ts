import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'subscriptions.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export async function getDb() {
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

export async function initializeDb() {
  const db = await getDb();
  
  // Create user_configuration table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_configuration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT NOT NULL,
      show_currency_symbol INTEGER NOT NULL DEFAULT 1
    )
  `);

  // Create subscriptions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      account TEXT,
      autopay INTEGER NOT NULL DEFAULT 0,
      interval_value INTEGER NOT NULL DEFAULT 1,
      interval_unit TEXT NOT NULL,
      notify INTEGER NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'default',
      tags TEXT
    )
  `);

  // Create ntfy_settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ntfy_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      domain TEXT DEFAULT 'https://ntfy.sh'
    )
  `);

  // Check if we need to insert default user configuration
  const config = await db.get('SELECT * FROM user_configuration LIMIT 1');
  if (!config) {
    await db.run(
      'INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)',
      ['USD', 1]
    );
  }

  await db.close();
} 