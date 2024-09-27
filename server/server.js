const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

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
  const { name, amount, dueDate, icon, recurrence, color } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO subscriptions (name, amount, due_date, icon, recurrence, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, amount, dueDate, icon, recurrence, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/subscriptions/:id', async (req, res) => {
  const { id } = req.params;
  const { name, amount, dueDate, icon, recurrence, color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE subscriptions SET name = $1, amount = $2, due_date = $3, icon = $4, recurrence = $5, color = $6 WHERE id = $7 RETURNING *',
      [name, amount, dueDate, icon, recurrence, color, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Subscription not found' });
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});