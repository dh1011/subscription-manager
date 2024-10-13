const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();
const fs = require('fs').promises;

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
      notify INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'USD'
    );
    
    CREATE TABLE IF NOT EXISTS ntfy_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL
    );
  `);

  // Migration step: Check if 'currency' column exists
  const columns = await db.all("PRAGMA table_info(subscriptions)");
  const columnNames = columns.map(column => column.name);

  if (!columnNames.includes('currency')) {
    // Add the 'currency' column if it doesn't exist
    await db.run("ALTER TABLE subscriptions ADD COLUMN currency TEXT DEFAULT 'USD'");
    console.log("Added 'currency' column to 'subscriptions' table");
  }

  // Create the new user_configuration table with default value 'USD' for currency
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_configuration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT DEFAULT 'USD',
      summary_currency TEXT DEFAULT 'USD'
    );
  `);

  console.log('Database initialized successfully with updated schema.');
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
    const result = await db.get('SELECT topic, domain FROM ntfy_settings LIMIT 1');
    const ntfyTopic = result?.topic;
    const ntfyDomain = result?.domain || 'https://ntfy.sh';
    
    if (!ntfyTopic) {
      console.error('NTFY topic not set');
      return;
    }

    const formattedDate = dueDate.toISOString().split('T')[0];
    const message = `Subscription due: ${sub.name} - Amount: ${sub.amount} ${sub.currency} - Due Date: ${formattedDate}`;

    await axios.post(`${ntfyDomain}/${ntfyTopic}`, message);
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
    currency,
  } = req.body;

  try {
    const result = await db.run(
      `INSERT INTO subscriptions
        (name, amount, due_date, icon, color, account, autopay, interval_value, interval_unit, notify, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        currency || 'USD',
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
    currency,
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
        notify = ?,
        currency = ?
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
        currency || 'USD',
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

// Get NTFY settings
app.get('/api/ntfy-settings', async (req, res) => {
  try {
    const result = await db.get('SELECT topic, domain FROM ntfy_settings LIMIT 1');
    res.json({ topic: result?.topic || '', domain: result?.domain || 'https://ntfy.sh' });
  } catch (err) {
    console.error('Error fetching NTFY settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set NTFY settings
app.post('/api/ntfy-settings', async (req, res) => {
  const { topic, domain } = req.body;
  try {
    await db.run('DELETE FROM ntfy_settings');
    await db.run('INSERT INTO ntfy_settings (topic) VALUES (?)', [topic]);
    res.json({ message: 'NTFY topic saved successfully' });
  } catch (err) {
    console.error('Error saving NTFY topic:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this new endpoint
app.get('/api/exchange-rates', async (req, res) => {
  try {
    if (!openExchangeRatesKey) {
      throw new Error('Open Exchange Rates API key not set');
    }
    const response = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=${openExchangeRatesKey}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Error fetching exchange rates' });
  }
});

// Get the Open Exchange Rates API key
app.get('/api/open-exchange-rates-key', async (req, res) => {
  try {
    const data = await fs.readFile('.env', 'utf8');
    const match = data.match(/OPEN_EXCHANGE_RATES_KEY=(.*)/);
    const key = match ? match[1] : '';
    res.json({ key });
  } catch (err) {
    console.error('Error fetching Open Exchange Rates API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set the Open Exchange Rates API key
app.post('/api/open-exchange-rates-key', async (req, res) => {
  const { key } = req.body;
  try {
    let data = await fs.readFile('.env', 'utf8');
    if (data.includes('OPEN_EXCHANGE_RATES_KEY=')) {
      data = data.replace(/OPEN_EXCHANGE_RATES_KEY=.*/, `OPEN_EXCHANGE_RATES_KEY=${key}`);
    } else {
      data += `\nOPEN_EXCHANGE_RATES_KEY=${key}`;
    }
    await fs.writeFile('.env', data);
    openExchangeRatesKey = key; // Update the in-memory key
    res.json({ message: 'Open Exchange Rates API key saved successfully' });
  } catch (err) {
    console.error('Error saving Open Exchange Rates API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

