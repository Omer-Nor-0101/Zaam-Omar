/* Forever Us backend: Express + SQL Server. Also serves the website itself. */
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.JWT_SECRET;
const MAX_USERS = Number(process.env.MAX_USERS || 2);
if (!SECRET || SECRET === 'change-me') {
  console.error('Set a long random JWT_SECRET in server/.env first.');
  process.exit(1);
}

/* Only these keys may be stored. Anything else is rejected. */
const SHARED_KEYS = new Set([
  'forever-us-photos-v2', 'forever-us-videos-v2', 'forever-us-places-v1',
  'forever-us-story-v2', 'forever-us-dreams-v1', 'forever-us-letters-v1',
  'forever-us-surprises-v1', 'forever-us-start', 'forever-us-social', 'forever-us-avatars'
]);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_RE = /^[a-z0-9_.]{3,20}$/;

const app = express();
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false, // the pages use inline styles/scripts and Google Fonts
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '60mb' })); // photos are saved as data URLs

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: 'Server error. Please try again.' });
});

const sign = (u) => jwt.sign({ uid: u.Id }, SECRET, { expiresIn: '60d' });

async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : '';
    const { uid } = jwt.verify(t, SECRET);
    const u = await db.findUserById(uid);
    if (!u) throw new Error('gone');
    req.user = u;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Please log in again.' });
  }
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' } });

/* ---------- API ---------- */
app.get('/api/health', wrap(async (req, res) => { await db.ping(); res.json({ ok: true }); }));

app.post('/api/register', authLimiter, wrap(async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim().slice(0, 50);
  const username = String(b.username || '').trim().toLowerCase().replace(/^@/, '');
  const email = String(b.email || '').trim().toLowerCase();
  const pass = String(b.password || '');
  if (!name) return res.status(400).json({ error: 'Please type your name.' });
  if (!username && !email) return res.status(400).json({ error: 'Enter a username, a Gmail, or both.' });
  if (username && !USER_RE.test(username)) return res.status(400).json({ error: 'Username: 3 to 20 letters, numbers, dots or underscores.' });
  if (email && !EMAIL.test(email)) return res.status(400).json({ error: 'Please enter a valid Gmail address.' });
  if (pass.length < 6) return res.status(400).json({ error: 'Password needs at least 6 characters.' });
  if (await db.countUsers() >= MAX_USERS) return res.status(403).json({ error: 'Registration is closed: this site already has its ' + MAX_USERS + ' accounts.' });
  if (await db.userExists(username, email)) return res.status(409).json({ error: 'This username or Gmail already has an account. Use Login instead.' });
  const hash = await bcrypt.hash(pass, 12);
  let u;
  try {
    u = await db.createUser({ name, username, email, key: email || ('@' + username), hash });
  } catch (e) {
    if (e.number === 2601 || e.number === 2627 || e.code === '23505' || e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This username or Gmail already has an account. Use Login instead.' });
    throw e;
  }
  res.json({ token: sign(u), account: db.pub(u) });
}));

app.post('/api/login', authLimiter, wrap(async (req, res) => {
  const id = String((req.body || {}).id || '').trim().toLowerCase().replace(/^@/, '');
  const pass = String((req.body || {}).password || '');
  const u = id ? await db.findUserByLogin(id) : null;
  // Same message for unknown user and wrong password.
  const ok = u && await bcrypt.compare(pass, u.PasswordHash);
  if (!ok) return res.status(401).json({ error: 'Wrong Gmail/username or password.' });
  res.json({ token: sign(u), account: db.pub(u) });
}));

/* Everything the page needs at start-up in one request. */
app.get('/api/sync', auth, wrap(async (req, res) => {
  const [rows, users, last] = await Promise.all([db.getAllData(), db.listUsers(), db.lastChange()]);
  const data = {};
  rows.forEach((r) => { data[r.Key] = r.Value; });
  res.json({ me: db.pub(req.user), accounts: users.map(db.pub), data, version: last });
}));

app.get('/api/version', auth, wrap(async (req, res) => { res.json({ version: await db.lastChange() }); }));

app.put('/api/data/:key', auth, wrap(async (req, res) => {
  const key = req.params.key;
  if (!SHARED_KEYS.has(key)) return res.status(400).json({ error: 'Unknown key.' });
  const value = (req.body || {}).value;
  if (typeof value !== 'string') return res.status(400).json({ error: 'value must be a string.' });
  try { JSON.parse(value); } catch (e) { return res.status(400).json({ error: 'value must be JSON.' }); }
  await db.setData(key, value, req.user.Id);
  res.json({ ok: true });
}));

app.delete('/api/data/:key', auth, wrap(async (req, res) => {
  if (!SHARED_KEYS.has(req.params.key)) return res.status(400).json({ error: 'Unknown key.' });
  await db.deleteData(req.params.key);
  res.json({ ok: true });
}));

app.put('/api/me', auth, wrap(async (req, res) => {
  const name = String((req.body || {}).name || '').trim().slice(0, 50);
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  await db.renameUser(req.user.Id, name);
  res.json({ ok: true, name });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

/* ---------- Website (only the public folders; server/ and .env are never exposed) ---------- */
const root = path.join(__dirname, '..');
['css', 'js', 'assets'].forEach((d) => app.use('/' + d, express.static(path.join(root, d), { dotfiles: 'deny' })));
app.get(['/', '/:page([a-z]+).html'], (req, res) => {
  const f = req.params.page ? req.params.page + '.html' : 'index.html';
  res.sendFile(path.join(root, f), (err) => { if (err) res.status(404).send('Not found'); });
});

db.init().then(() => {
  app.listen(PORT, () => console.log('Forever Us is running on http://localhost:' + PORT));
}).catch((e) => {
  console.error('Could not connect to the database:', e.message);
  console.error(process.env.TIDB_HOST ? 'Check TIDB_HOST, TIDB_PORT, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE.' : process.env.DATABASE_URL ? 'Check DATABASE_URL.' : 'Check DB_SERVER, DB_PORT, DB_USER, DB_PASSWORD in server/.env and that TCP/IP is enabled.');
  process.exit(1);
});
