/* Omar & Zaam backend: Express + SQL Server. Also serves the website itself. */
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
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

const MAX_MEDIA = 150 * 1024 * 1024;   // 150 MB per file
const CHUNK = 4 * 1024 * 1024;         // files are stored in the database in 4 MB pieces
const RESET_CODE = String(process.env.RESET_CODE || '');
const PUBLIC_URL = String(process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

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
    if (e.number === 2601 || e.number === 2627 || e.code === '23505') return res.status(409).json({ error: 'This username or Gmail already has an account. Use Login instead.' });
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


/* ---------- Password reset ----------
   1) If SMTP_* is set and the account has a Gmail: a one-time link (valid 30 min) is emailed.
   2) If RESET_CODE is set in the server environment: the owner can reset with that secret code. */
let mailer = null;
function getMailer() {
  if (mailer !== null) return mailer || null;
  if (!process.env.SMTP_HOST) { mailer = false; return null; }
  try {
    const nodemailer = require('nodemailer');
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
  } catch (e) { console.error('nodemailer is not installed. Run: npm install'); mailer = false; }
  return mailer || null;
}

app.post('/api/forgot', authLimiter, wrap(async (req, res) => {
  const id = String((req.body || {}).id || '').trim().toLowerCase().replace(/^@/, '');
  const base = { ok: true, emailEnabled: !!getMailer(), codeEnabled: RESET_CODE.length >= 8 };
  const u = id ? await db.findUserByLogin(id) : null;
  if (u && u.Email && getMailer()) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.createReset(u.Id, sha(token), 30);
    const origin = PUBLIC_URL || (req.protocol + '://' + req.get('host'));
    const link = origin + '/login.html?reset=' + token;
    try {
      await getMailer().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER, to: u.Email,
        subject: 'Omar & Zaam: reset your password',
        text: 'Hi ' + u.Name + ',\n\nOpen this link to choose a new password (valid for 30 minutes):\n' + link + '\n\nIf you did not ask for this, ignore this email.',
        html: '<p>Hi ' + String(u.Name).replace(/[<>&]/g, '') + ',</p><p><a href="' + link + '">Choose a new password</a> (valid for 30 minutes).</p><p>If you did not ask for this, ignore this email.</p>'
      });
    } catch (e) { console.error('Could not send reset email:', e.message); }
  }
  // Same answer whether or not the account exists, so nobody can probe for accounts.
  res.json(base);
}));

app.post('/api/reset', authLimiter, wrap(async (req, res) => {
  const b = req.body || {};
  const pass = String(b.password || '');
  if (pass.length < 6) return res.status(400).json({ error: 'Password needs at least 6 characters.' });
  let u = null;
  if (b.token) {
    const uid = await db.findReset(sha(String(b.token)));
    u = uid ? await db.findUserById(uid) : null;
    if (!u) return res.status(400).json({ error: 'This reset link is invalid or has expired. Ask for a new one.' });
  } else if (b.code) {
    const id = String(b.id || '').trim().toLowerCase().replace(/^@/, '');
    const found = id ? await db.findUserByLogin(id) : null;
    if (RESET_CODE.length < 8 || !found || !same(String(b.code), RESET_CODE)) return res.status(400).json({ error: 'Wrong username/Gmail or reset code.' });
    u = found;
  } else {
    return res.status(400).json({ error: 'Missing reset link or code.' });
  }
  await db.setPassword(u.Id, await bcrypt.hash(pass, 12));
  await db.deleteResets(u.Id);
  res.json({ token: sign(u), account: db.pub(u) });
}));

/* ---------- Photos & videos (stored in the database, so they never disappear) ---------- */
const MEDIA_TYPE = /^(image|video)\/[a-z0-9.+-]+$/;

async function authMedia(req, res, next) {   // <img>/<video> tags cannot send headers, so ?t=<token> is allowed here
  if (req.headers.authorization) return auth(req, res, next);
  try {
    const { uid } = jwt.verify(String(req.query.t || ''), SECRET);
    const u = await db.findUserById(uid);
    if (!u) throw new Error('gone');
    req.user = u; next();
  } catch (e) { res.status(401).json({ error: 'Please log in again.' }); }
}

app.put('/api/media', auth, wrap(async (req, res) => {
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!MEDIA_TYPE.test(type) || type === 'image/svg+xml') return res.status(415).json({ error: 'Only photos and videos can be uploaded.' });
  if (Number(req.headers['content-length'] || 0) > MAX_MEDIA) return res.status(413).json({ error: 'File is too big. The limit is 150 MB.' });
  let name = 'file';
  try { name = decodeURIComponent(String(req.headers['x-file-name'] || 'file')); } catch (e) {}
  name = name.replace(/[\r\n\\/]/g, '_').slice(0, 150) || 'file';
  const id = crypto.randomUUID();
  await db.mediaCreate(id, req.user.Id, name, type);
  let idx = 0, total = 0, held = Buffer.alloc(0), fail = null;
  try {
    for await (const part of req) {                // the loop waits for each database write: memory stays small
      total += part.length;
      if (total > MAX_MEDIA) { fail = [413, 'File is too big. The limit is 150 MB.']; break; }
      held = held.length ? Buffer.concat([held, part]) : part;
      while (held.length >= CHUNK) { await db.mediaChunk(id, idx++, held.subarray(0, CHUNK)); held = held.subarray(CHUNK); }
    }
    if (!fail) {
      if (held.length) await db.mediaChunk(id, idx++, held);
      if (!total) fail = [400, 'The file is empty.'];
      else await db.mediaFinish(id, total);
    }
  } catch (e) {                                    // upload cut off (phone lost signal, tab closed...)
    await db.mediaDelete(id).catch(() => {});
    if (!res.headersSent && !req.aborted) console.error(e);
    return;
  }
  if (fail) { await db.mediaDelete(id).catch(() => {}); return res.status(fail[0]).json({ error: fail[1] }); }
  res.json({ id, name, type, size: total });
}));

app.get('/api/media/:id', authMedia, wrap(async (req, res) => {
  const m = await db.mediaMeta(req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found.' });
  let start = 0, end = m.size - 1, status = 200;
  const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
  if (range && (range[1] || range[2])) {
    if (range[1]) { start = Number(range[1]); if (range[2]) end = Math.min(end, Number(range[2])); }
    else { start = Math.max(0, m.size - Number(range[2])); }
    if (start > end || start >= m.size) { res.set('Content-Range', 'bytes */' + m.size); return res.status(416).end(); }
    status = 206;
    res.set('Content-Range', 'bytes ' + start + '-' + end + '/' + m.size);
  }
  res.status(status).set({
    'Content-Type': m.type, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline; filename="' + m.name.replace(/[^\w.\- ]/g, '_') + '"'
  });
  for (let k = Math.floor(start / CHUNK); k <= Math.floor(end / CHUNK); k++) {
    if (res.destroyed) return;
    const buf = await db.mediaGetChunk(m.id, k);
    if (!buf) { res.destroy(); return; }
    const from = Math.max(start - k * CHUNK, 0), to = Math.min(end - k * CHUNK + 1, buf.length);
    if (!res.write(buf.subarray(from, to))) await new Promise((r) => res.once('drain', r).once('close', r));
  }
  res.end();
}));

app.delete('/api/media/:id', auth, wrap(async (req, res) => {
  const m = await db.mediaMeta(req.params.id);
  if (m && m.ownerId === req.user.Id) await db.mediaDelete(m.id);
  res.json({ ok: true });
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
  const server = app.listen(PORT, () => console.log('Omar & Zaam is running on http://localhost:' + PORT));
  server.requestTimeout = 0;            // big uploads on slow phones must not be cut after 5 minutes
  server.headersTimeout = 65 * 1000;
}).catch((e) => {
  console.error('Could not connect to the database:', e.message);
  console.error(process.env.DATABASE_URL ? 'Check DATABASE_URL.' : 'Check DB_SERVER, DB_PORT, DB_USER, DB_PASSWORD in server/.env and that TCP/IP is enabled.');
  process.exit(1);
});
