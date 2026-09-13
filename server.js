const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database(process.env.DATABASE_PATH || './database.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Create tables if they don't exist
db.run(`
  CREATE TABLE IF NOT EXISTS residents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleName TEXT,
    age INTEGER NOT NULL,
    workplace TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API Routes

// Get all residents
app.get('/api/residents', (req, res) => {
  db.all('SELECT * FROM residents ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new resident
app.post('/api/residents', (req, res) => {
  const { firstName, lastName, middleName, age, workplace } = req.body;

  // Validation
  if (!firstName || !lastName || !age || !workplace) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  if (age < 13 || age > 150) {
    return res.status(400).json({ error: 'Введите корректный возраст' });
  }

  const sql = `
    INSERT INTO residents (firstName, lastName, middleName, age, workplace)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [firstName, lastName, middleName || '', age, workplace], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({
      id: this.lastID,
      firstName,
      lastName,
      middleName: middleName || '',
      age,
      workplace,
      message: 'Вы успешно зарегистрировались!'
    });
  });
});

// Get resident by ID
app.get('/api/residents/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM residents WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Житель не найден' });
      return;
    }
    res.json(row);
  });
});

// Update resident
app.put('/api/residents/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, middleName, age, workplace } = req.body;

  if (!firstName || !lastName || !age || !workplace) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  const sql = `
    UPDATE residents
    SET firstName = ?, lastName = ?, middleName = ?, age = ?, workplace = ?
    WHERE id = ?
  `;

  db.run(sql, [firstName, lastName, middleName || '', age, workplace, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Житель не найден' });
      return;
    }
    res.json({ message: 'Данные успешно обновлены' });
  });
});

// Delete resident
app.delete('/api/residents/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM residents WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Житель не найден' });
      return;
    }
    res.json({ message: 'Житель удален' });
  });
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: 'admin-token' });
  } else {
    res.status(401).json({ error: 'Неверный пароль' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
