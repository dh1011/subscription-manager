import assert from 'node:assert/strict';
import test from 'node:test';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { migrateDb } from './db';

test('migrateDb upgrades a legacy database without losing subscriptions', async () => {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });

  try {
    await db.exec(`
      CREATE TABLE user_configuration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        currency TEXT NOT NULL,
        show_currency_symbol INTEGER NOT NULL DEFAULT 1
      );
      INSERT INTO user_configuration (currency, show_currency_symbol) VALUES ('USD', 1);

      CREATE TABLE subscriptions (
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
        currency TEXT DEFAULT 'default'
      );
      INSERT INTO subscriptions (
        name, amount, due_date, interval_value, interval_unit, notify, currency
      ) VALUES ('Legacy plan', 12.5, '2026-08-15', 1, 'months', 1, 'USD');

      CREATE TABLE ntfy_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        domain TEXT DEFAULT 'https://ntfy.sh'
      );
    `);

    await migrateDb(db);

    const subscriptionColumns = await db.all<Array<{ name: string }>>(
      'PRAGMA table_info(subscriptions)'
    );
    const notificationColumns = await db.all<Array<{ name: string }>>(
      'PRAGMA table_info(ntfy_settings)'
    );

    assert(subscriptionColumns.some(column => column.name === 'end_date'));
    assert(subscriptionColumns.some(column => column.name === 'tags'));
    assert(notificationColumns.some(column => column.name === 'service'));
    assert(notificationColumns.some(column => column.name === 'gotify_url'));
    assert(notificationColumns.some(column => column.name === 'gotify_token'));

    const preserved = await db.get<{ name: string; tags: string | null }>(
      'SELECT name, tags FROM subscriptions WHERE id = 1'
    );
    assert.deepEqual(preserved, { name: 'Legacy plan', tags: null });

    const inserted = await db.run(
      `INSERT INTO subscriptions (
        name, amount, due_date, icon, color, account, autopay,
        interval_value, interval_unit, notify, currency, end_date, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'New plan', 20, '2026-09-01', 'cash', '#fff', '', 0,
        1, 'months', 0, 'USD', null, JSON.stringify(['new'])
      ]
    );

    await db.run(
      'UPDATE subscriptions SET name = ?, tags = ? WHERE id = ?',
      ['Updated plan', JSON.stringify(['updated']), inserted.lastID]
    );

    const updated = await db.get<{ name: string; tags: string }>(
      'SELECT name, tags FROM subscriptions WHERE id = ?',
      inserted.lastID
    );
    assert.deepEqual(updated, { name: 'Updated plan', tags: '["updated"]' });
  } finally {
    await db.close();
  }
});
