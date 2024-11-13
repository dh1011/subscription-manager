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
  const dbPath = process.env.DB_DIR
    ? path.join(process.env.DB_DIR, 'subscriptions.db')
    : path.resolve(__dirname, '../subscriptions.db');
  console.log(`Using subscriptions database located at: ${dbPath}`);
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
      currency VARCHAR(10) DEFAULT 'default'
    );
    
    CREATE TABLE IF NOT EXISTS ntfy_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      domain TEXT DEFAULT 'https://ntfy.sh'
    );

    -- Migration: Add domain column to ntfy_settings if it doesn't exist
    PRAGMA table_info(ntfy_settings);
  `);

  // Check if the domain column exists in ntfy_settings
  const ntfySettingsColumns = await db.all("PRAGMA table_info(ntfy_settings)");
  const domainColumnExists = ntfySettingsColumns.some(column => column.name === 'domain');

  if (!domainColumnExists) {
    // Add the domain column with a default value
    await db.exec(`
      ALTER TABLE ntfy_settings ADD COLUMN domain TEXT DEFAULT 'https://ntfy.sh';
    `);
    console.log('Added domain column to ntfy_settings table');
  }

  // Create the new user_configuration table with default value 'dollar' for currency
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_configuration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT DEFAULT 'USD',
      show_currency_symbol INTEGER DEFAULT 1
    );
  `);

  // Check if the currency column exists in subscriptions
  const subscriptionsColumns = await db.all("PRAGMA table_info(subscriptions)");
  const currencyColumnExists = subscriptionsColumns.some(column => column.name === 'currency');

  if (!currencyColumnExists) {
    // Add the currency column with a default value
    await db.exec(`
      ALTER TABLE subscriptions ADD COLUMN currency VARCHAR(10) DEFAULT 'default';
    `);
    console.log('Added currency column to subscriptions table');
  }

  // Check if show_currency_symbol column exists
  const userConfigColumns = await db.all("PRAGMA table_info(user_configuration)");
  const symbolColumnExists = userConfigColumns.some(column => column.name === 'show_currency_symbol');

  if (!symbolColumnExists) {
    await db.exec(`
      ALTER TABLE user_configuration ADD COLUMN show_currency_symbol INTEGER DEFAULT 1;
    `);
    console.log('Added show_currency_symbol column to user_configuration table');
  }

  console.log('Database initialized successfully with new table for user configuration.');
})();

// Get the user's currency configuration
app.get('/api/user-configuration', async (req, res) => {
  try {
    const result = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
    res.json({ 
      currency: result?.currency || 'USD',
      showCurrencySymbol: result?.show_currency_symbol === 1 // Convert to boolean
    });
  } catch (err) {
    console.error('Error fetching user configuration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set or update the user's currency configuration
app.post('/api/user-configuration', async (req, res) => {
  const { currency, showCurrencySymbol } = req.body;
  try {
    const existingConfig = await db.get('SELECT id FROM user_configuration LIMIT 1');
    
    if (existingConfig) {
      await db.run(
        'UPDATE user_configuration SET currency = ?, show_currency_symbol = ? WHERE id = ?',
        [currency, showCurrencySymbol ? 1 : 0, existingConfig.id]
      );
    } else {
      await db.run(
        'INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)',
        [currency, showCurrencySymbol ? 1 : 0]
      );
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
    const message = `Subscription due: ${sub.name} - Amount: ${sub.amount} - Due Date: ${formattedDate}`;

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
    const userConfig = await db.get('SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1');
    const defaultCurrency = userConfig?.currency || 'USD';
    const showCurrencySymbol = userConfig?.show_currency_symbol === 1; // Default to true if not set
    
    const subscriptionsWithCurrency = result.map(sub => ({
      ...sub,
      currency: sub.currency === 'default' ? defaultCurrency : sub.currency,
      showCurrencySymbol // Add the display preference to each subscription
    }));
    
    res.json(subscriptionsWithCurrency);
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
        currency || 'default',
      ]
    );
    const newSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', result.lastID);
    
    // If currency is 'default', replace with user configuration currency
    if (newSubscription.currency === 'default') {
      const userConfig = await db.get('SELECT currency FROM user_configuration LIMIT 1');
      newSubscription.currency = userConfig?.currency || 'USD';
    }
    
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
        currency || 'default',
        id,
      ]
    );
    const updatedSubscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', id);
    if (!updatedSubscription) {
      res.status(404).json({ error: 'Subscription not found' });
    } else {
      // If currency is 'default', replace with user configuration currency
      if (updatedSubscription.currency === 'default') {
        const userConfig = await db.get('SELECT currency FROM user_configuration LIMIT 1');
        updatedSubscription.currency = userConfig?.currency || 'USD';
      }
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
    await db.run('INSERT INTO ntfy_settings (topic, domain) VALUES (?, ?)', [topic, domain]);
    res.json({ message: 'NTFY settings saved successfully' });
  } catch (err) {
    console.error('Error saving NTFY settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
