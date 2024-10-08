const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const cron = require('node-cron');
const axios = require('axios');

// Middleware
app.use(express.json());

// Database connection and initialization
let db;
(async () => {
  const dbPath = path.resolve(__dirname, '../subscriptions.db');
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create or migrate existing tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      account TEXT,
      autopay INTEGER DEFAULT 0,
      interval_value INTEGER DEFAULT 1,
      interval_unit TEXT CHECK (interval_unit IN ('days', 'weeks', 'months', 'years')),
      notify INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS ntfy_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL
    );
  `);

  // Create the new user_configuration table with default value 'dollar' for currency
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_configuration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT DEFAULT 'dollar'
    );
  `);

  console.log('Database initialized successfully with new table for user configuration.');
})();

// Get the user's currency configuration
app.get('/api/user-configuration', async (req, res) => {
  try {
    const result = await db.get('SELECT currency FROM user_configuration LIMIT 1');
    res.json({ currency: result?.currency || 'USD' });
  } catch (err) {
    console.error('Error fetching user configuration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set or update the user's currency configuration
app.post('/api/user-configuration', async (req, res) => {
  const { currency } = req.body;
  try {
    // Check if the configuration exists, if not, insert it, otherwise update it
    const existingConfig = await db.get('SELECT id FROM user_configuration LIMIT 1');

    if (existingConfig) {
      // Update the existing record
      await db.run('UPDATE user_configuration SET currency = ? WHERE id = ?', [currency, existingConfig.id]);
    } else {
      // Insert a new record
      await db.run('INSERT INTO user_configuration (currency) VALUES (?)', [currency]);
    }

    res.json({ message: 'User configuration updated successfully' });
  } catch (err) {
    console.error('Error saving user configuration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to compute the next due date for a subscription
const computeNextDueDates = (sub) => {
  const now = new Date();
  const dueDate = new Date(sub.due_date);
  let nextDueDate = new Date(dueDate);
  const dueDates = [];
  const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  while (nextDueDate <= oneMonthLater) {
    if (nextDueDate >= now) {
      dueDates.push(new Date(nextDueDate));
    }

    const interval = parseInt(sub.interval_value) || 1;
    const intervalUnit = sub.interval_unit || 'months';

    switch (intervalUnit) {
      case 'days':
        nextDueDate.setDate(nextDueDate.getDate() + interval);
        break;
      case 'weeks':
        nextDueDate.setDate(nextDueDate.getDate() + interval * 7);
        break;
      case 'months':
        nextDueDate.setMonth(nextDueDate.getMonth() + interval);
        break;
      case 'years':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
        break;
      default:
        nextDueDate = new Date(oneMonthLater.getTime() + 1);
        break;
    }
  }

  return dueDates;
};

// Function to send notification via NTFY
const sendNotification = async (sub, dueDate) => {
  try {
    const result = await db.get('SELECT topic FROM ntfy_settings LIMIT 1');
    const ntfyTopic = result?.topic;
    
    if (!ntfyTopic) {
      console.error('NTFY topic not set');
      return;
    }

    const formattedDate = dueDate.toISOString().split('T')[0];
    const message = `Subscription due: ${sub.name} - Amount: ${sub.amount} - Due Date: ${formattedDate}`;

    await axios.post(`https://ntfy.sh/${ntfyTopic}`, message);
    console.log(`Notification sent for subscription ${sub.name} due on ${formattedDate}`);
  } catch (error) {
    console.error(`Error sending notification for subscription ${sub.name}:`, error);
  }
};

// Scheduled task that runs daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily notification task');
  try {
    const subscriptions = await db.all('SELECT * FROM subscriptions WHERE notify = 1');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const sub of subscriptions) {
      const upcomingDueDates = computeNextDueDates(sub);
      
      for (const dueDate of upcomingDueDates) {
        if (dueDate >= today && dueDate < tomorrow) {
          await sendNotification(sub, dueDate);
        }
      }
    }
  } catch (err) {
    console.error('Error in notification task:', err);
  }
});

// Routes
app.get('/api/subscriptions', async (req, res) => {
  try {
    const result = await db.all('SELECT * FROM subscriptions');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/subscriptions', async (req, res) => {
  const {
    name,
    amount,
    dueDate,
    icon,
    color,
    account,
    autopay,
    interval_value,
    interval_unit,
    notify,
  } = req.body;

  try {
    const result = await db.run(
      `INSERT INTO subscriptions
        (name, amount, due_date, icon, color, account, autopay, interval_value, interval_unit, notify)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        amount,
        dueDate,
        icon,
        color,
        account,
        autopay ? 1 : 0,
        interval_value || 1,
        interval_unit || 'months',
        notify ? 1 : 0,
      ]
    );
    const newSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', result.lastID);
    res.status(201).json(newSubscription);
  } catch (err) {
    console.error('Error adding subscription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    amount,
    dueDate,
    icon,
    color,
    account,
    autopay,
    interval_value,
    interval_unit,
    notify,
  } = req.body;

  try {
    await db.run(
      `UPDATE subscriptions SET
        name = ?,
        amount = ?,
        due_date = ?,
        icon = ?,
        color = ?,
        account = ?,
        autopay = ?,
        interval_value = ?,
        interval_unit = ?,
        notify = ?
       WHERE id = ?`,
      [
        name,
        amount,
        dueDate,
        icon,
        color,
        account,
        autopay ? 1 : 0,
        interval_value || 1,
        interval_unit || 'months',
        notify ? 1 : 0,
        id,
      ]
    );
    const updatedSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', id);
    if (!updatedSubscription) {
      res.status(404).json({ error: 'Subscription not found' });
    } else {
      res.json(updatedSubscription);
    }
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete('/api/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.run('DELETE FROM subscriptions WHERE id = ?', id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Subscription not found' });
    } else {
      res.json({ message: 'Subscription deleted successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get NTFY topic
app.get('/api/ntfy-topic', async (req, res) => {
  try {
    const result = await db.get('SELECT topic FROM ntfy_settings LIMIT 1');
    res.json({ topic: result?.topic || '' });
  } catch (err) {
    console.error('Error fetching NTFY topic:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set NTFY topic
app.post('/api/ntfy-topic', async (req, res) => {
  const { topic } = req.body;
  try {
    await db.run('DELETE FROM ntfy_settings');
    await db.run('INSERT INTO ntfy_settings (topic) VALUES (?)', [topic]);
    res.json({ message: 'NTFY topic saved successfully' });
  } catch (err) {
    console.error('Error saving NTFY topic:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});