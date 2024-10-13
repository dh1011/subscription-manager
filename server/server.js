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
    
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL CHECK (service IN ('ntfy', 'gotify')),
      ntfy_topic TEXT,
      ntfy_domain TEXT DEFAULT 'https://ntfy.sh',
      gotify_url TEXT,
      gotify_token TEXT
    );

    -- Migration: Add new columns to notification_settings if they don't exist
    PRAGMA table_info(notification_settings);
  `);

  // Check if the new columns exist in notification_settings
  const notificationSettingsColumns = await db.all("PRAGMA table_info(notification_settings)");
  const serviceColumnExists = notificationSettingsColumns.some(column => column.name === 'service');

  if (!serviceColumnExists) {
    // Add the new columns with default values
    await db.exec(`
      ALTER TABLE notification_settings ADD COLUMN service TEXT NOT NULL DEFAULT 'ntfy' CHECK (service IN ('ntfy', 'gotify'));
      ALTER TABLE notification_settings ADD COLUMN gotify_url TEXT;
      ALTER TABLE notification_settings ADD COLUMN gotify_token TEXT;
    `);
    console.log('Added new columns to notification_settings table');
  }

  console.log('Database initialized successfully with migration for notification_settings.');
})();

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
    const result = await db.get('SELECT * FROM notification_settings LIMIT 1');
    if (!result) {
      console.error('Notification settings not set');
      return;
    }

    const formattedDate = dueDate.toISOString().split('T')[0];
    const message = `Subscription due: ${sub.name} - Amount: ${sub.amount} - Due Date: ${formattedDate}`;

    if (result.service === 'ntfy') {
      const ntfyTopic = result.ntfy_topic;
      const ntfyDomain = result.ntfy_domain || 'https://ntfy.sh';
      
      if (!ntfyTopic) {
        console.error('NTFY topic not set');
        return;
      }

      await axios.post(`${ntfyDomain}/${ntfyTopic}`, message);
    } else if (result.service === 'gotify') {
      const gotifyUrl = result.gotify_url;
      const gotifyToken = result.gotify_token;

      if (!gotifyUrl || !gotifyToken) {
        console.error('Gotify URL or token not set');
        return;
      }

      const url = `${gotifyUrl}/message?token=${gotifyToken}`;
      const bodyFormData = {
        title: 'Subscription Due',
        message: message,
        priority: 5,
      };

      try {
        const response = await axios({
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          url: url,
          data: bodyFormData,
        });
        console.log(response.data);
      } catch (err) {
        console.log(err.response ? err.response.data : err);
      }
    }

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

// Get notification settings
app.get('/api/notification-settings', async (req, res) => {
  try {
    const result = await db.get('SELECT * FROM notification_settings LIMIT 1');
    res.json(result || { service: 'ntfy', ntfy_domain: 'https://ntfy.sh' });
  } catch (err) {
    console.error('Error fetching notification settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set notification settings
app.post('/api/notification-settings', async (req, res) => {
  const { service, ntfy_topic, ntfy_domain, gotify_url, gotify_token } = req.body;
  try {
    await db.run('DELETE FROM notification_settings');
    await db.run(
      'INSERT INTO notification_settings (service, ntfy_topic, ntfy_domain, gotify_url, gotify_token) VALUES (?, ?, ?, ?, ?)',
      [service, ntfy_topic, ntfy_domain, gotify_url, gotify_token]
    );
    res.json({ message: 'Notification settings saved successfully' });
  } catch (err) {
    console.error('Error saving notification settings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});