require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Simple CORS - allow frontend
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://asura-frontend-mu.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware to authenticate token
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

// Register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);

  db.run(
    `INSERT INTO users (username, password) VALUES (?, ?)`,
    [username, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, user: { id: this.lastID, username } });
    }
  );
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const passwordIsValid = bcrypt.compareSync(password, user.password);
      if (!passwordIsValid) return res.status(401).json({ token: null, error: 'Invalid password' });

      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, username: user.username } });
    }
  );
});

// Get User Data
app.get('/api/data/:key', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const key = req.params.key;

  db.get(
    `SELECT value FROM user_data WHERE user_id = ? AND key = ?`,
    [userId, key],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.json({ data: null });

      try {
        res.json({ data: JSON.parse(row.value) });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse data' });
      }
    }
  );
});

// Save User Data
app.post('/api/data/:key', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const key = req.params.key;
  const value = JSON.stringify(req.body);

  db.run(
    `INSERT INTO user_data (user_id, key, value, updated_at) 
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, key) DO UPDATE SET 
     value = excluded.value, 
     updated_at = CURRENT_TIMESTAMP`,
    [userId, key, value],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
