require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || 'default-secret';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const hashedPassword = bcrypt.hashSync(password, 8);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: this.lastID, username } });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

app.get('/api/data/:key', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const key = req.params.key;
  db.get('SELECT value FROM user_data WHERE user_id = ? AND key = ?', [userId, key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({ data: null });
    try {
      res.json({ data: JSON.parse(row.value) });
    } catch (e) {
      res.status(500).json({ error: 'Parse error' });
    }
  });
});

app.post('/api/data/:key', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const key = req.params.key;
  const value = JSON.stringify(req.body);
  db.run('INSERT INTO user_data (user_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP', [userId, key, value], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Admin endpoints (protected by ADMIN_SECRET)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-secret';

const authenticateAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// List all users (like Firebase Auth console)
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
  db.all('SELECT id, username, created_at FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ users: rows, total: rows.length });
  });
});

// Get all data for a specific user (like Firebase Database)
app.get('/api/admin/users/:userId/data', authenticateAdmin, (req, res) => {
  const userId = req.params.userId;
  db.all('SELECT key, value, updated_at FROM user_data WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const data = {};
    rows.forEach(row => {
      try {
        data[row.key] = { value: JSON.parse(row.value), updated_at: row.updated_at };
      } catch (e) {
        data[row.key] = { value: row.value, updated_at: row.updated_at };
      }
    });
    res.json({ userId, data });
  });
});

// Get database stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as userCount FROM users', [], (err, userRow) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT COUNT(*) as dataCount FROM user_data', [], (err, dataRow) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        users: userRow.userCount,
        dataEntries: dataRow.dataCount
      });
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server on port ' + PORT);
});
