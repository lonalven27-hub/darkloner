const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('./darkloner.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    tier TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const sign = (u) => jwt.sign({ id: u.id, email: u.email, tier: u.tier }, JWT_SECRET, { expiresIn: '7d' });

app.post('/api/users/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password too short' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name || '', email, hash);
    const user = { id: r.lastInsertRowid, name, email, tier: 'free' };
    res.cookie('token', sign(user), { httpOnly: true, sameSite: 'lax', maxAge: 7*24*3600*1000 });
    res.json({ success: true, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const user = { id: u.id, name: u.name, email: u.email, tier: u.tier };
  res.cookie('token', sign(user), { httpOnly: true, sameSite: 'lax', maxAge: 7*24*3600*1000 });
  res.json({ success: true, user });
});

app.post('/api/users/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/users/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const u = jwt.verify(token, JWT_SECRET);
    res.json({ user: u });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('DarkLoner backend running on port ' + PORT));
