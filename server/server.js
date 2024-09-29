const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const cron = require('node-cron');
const axios = require('axios');

// Middleware
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


// Function to compute the next due date for a subscription
const computeNextDueDate = (sub) => {
  const now = new Date();
  const dueDate = new Date(sub.due_date);
  let nextDueDate = new Date(dueDate);

  while (nextDueDate < now) {
    const interval = parseInt(sub.interval) || 1;
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
        nextDueDate = null;
        break;
    }

    if (!nextDueDate) break;
  }

  return nextDueDate;
};

// Function to send notification via NTFY
const sendNotification = async (sub) => {
  try {
    const result = await pool.query('SELECT topic FROM ntfy_settings LIMIT 1');
    const ntfyTopic = result.rows[0]?.topic;
    
    if (!ntfyTopic) {
      console.error('NTFY topic not set');
      return;
    }

    const message = `Subscription due: ${sub.name} - Amount: ${sub.amount}`;

    await axios.post(`https://ntfy.sh/${ntfyTopic}`, message);
    console.log(`Notification sent for subscription ${sub.name}`);
  } catch (error) {
    console.error(`Error sending notification for subscription ${sub.name}:`, error);
  }
};

// Scheduled task that runs daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily notification task');
  try {
    const result = await pool.query('SELECT * FROM subscriptions WHERE notify = true');
    const subscriptions = result.rows;

    subscriptions.forEach((sub) => {
      const nextDueDate = computeNextDueDate(sub);
      if (nextDueDate) {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (nextDueDate >= today && nextDueDate <= tomorrow) {
          sendNotification(sub);
        }
      }
    });
  } catch (err) {
    console.error('Error in notification task:', err);
  }
});

// Routes
app.get('/api/subscriptions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscriptions');
    res.json(result.rows);
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
    const result = await pool.query(
      `INSERT INTO subscriptions
        (name, amount, due_date, icon, color, account, autopay, interval_value, interval_unit, notify)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        amount,
        dueDate,
        icon,
        color,
        account,
        autopay,
        interval_value || 1,
        interval_unit || 'months',
        notify,
      ]
    );
    res.status(201).json(result.rows[0]);
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
    const result = await pool.query(
      `UPDATE subscriptions SET
        name = $1,
        amount = $2,
        due_date = $3,
        icon = $4,
        color = $5,
        account = $6,
        autopay = $7,
        interval_value = $8,
        interval_unit = $9,
        notify = $10
       WHERE id = $11
       RETURNING *`,
      [
        name,
        amount,
        dueDate,
        icon,
        color,
        account,
        autopay,
        interval_value || 1,
        interval_unit || 'months',
        notify,
        id,
      ]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Subscription not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error updating subscription:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.delete('/api/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM subscriptions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
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
    const result = await pool.query('SELECT topic FROM ntfy_settings LIMIT 1');
    res.json({ topic: result.rows[0]?.topic || '' });
  } catch (err) {
    console.error('Error fetching NTFY topic:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set NTFY topic
app.post('/api/ntfy-topic', async (req, res) => {
  const { topic } = req.body;
  try {
    await pool.query('DELETE FROM ntfy_settings');
    await pool.query('INSERT INTO ntfy_settings (topic) VALUES ($1)', [topic]);
    res.json({ message: 'NTFY topic saved successfully' });
  } catch (err) {
    console.error('Error saving NTFY topic:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});