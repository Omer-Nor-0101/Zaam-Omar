/* TiDB Cloud / MySQL access (used when TIDB_HOST is set). Same exports as db-pg.js so index.js is unchanged.
   Big values (photos are saved as data URLs) are split into parts, because TiDB limits the size of one row. */
const mysql = require('mysql2/promise');

const CHUNK = 1000000; // characters per row (about 4 MB at the very most)

const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE || 'test',
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  timezone: 'Z',
  dateStrings: ['DATE'],   // DATE stays 'YYYY-MM-DD'
  waitForConnections: true,
  connectionLimit: 8,
  maxIdle: 2,
  idleTimeout: 60000,
  enableKeepAlive: true
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Users (
      Id INT AUTO_INCREMENT PRIMARY KEY,
      AccountKey VARCHAR(220) NOT NULL,
      Name VARCHAR(50) NOT NULL,
      Username VARCHAR(30) NULL,
      Email VARCHAR(200) NULL,
      PasswordHash VARCHAR(100) NOT NULL,
      Created DATE NOT NULL,
      UNIQUE KEY UX_Users_AccountKey (AccountKey),
      UNIQUE KEY UX_Users_Username (Username),
      UNIQUE KEY UX_Users_Email (Email)
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS AppData (
      \`Key\` VARCHAR(100) NOT NULL,
      Part INT NOT NULL,
      \`Value\` LONGTEXT NOT NULL,
      UpdatedAt DATETIME(3) NOT NULL,
      UpdatedBy INT NULL,
      PRIMARY KEY (\`Key\`, Part)
    )`);
}

const pub = (r) => r && ({
  id: r.Id, key: r.AccountKey, name: r.Name,
  username: r.Username || '', email: r.Email || '',
  created: r.Created instanceof Date ? r.Created.toISOString().slice(0, 10) : String(r.Created || '')
});

async function countUsers() {
  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM Users');
  return Number(rows[0].n);
}
async function findUserByLogin(id) {
  const [rows] = await pool.query('SELECT * FROM Users WHERE Email=? OR Username=? LIMIT 1', [id, id]);
  return rows[0] || null;
}
async function findUserById(id) {
  const [rows] = await pool.query('SELECT * FROM Users WHERE Id=?', [id]);
  return rows[0] || null;
}
async function userExists(username, email) {
  const vals = [username, email].filter(Boolean);
  if (!vals.length) return false;
  const ph = vals.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT 1 FROM Users WHERE Username IN (${ph}) OR Email IN (${ph}) LIMIT 1`, [...vals, ...vals]);
  return rows.length > 0;
}
async function createUser({ name, username, email, key, hash }) {
  const [res] = await pool.query(
    'INSERT INTO Users (AccountKey,Name,Username,Email,PasswordHash,Created) VALUES (?,?,?,?,?,CURDATE())',
    [key, name, username || null, email || null, hash]);
  return findUserById(res.insertId);
}
async function listUsers() { return (await pool.query('SELECT * FROM Users ORDER BY Id'))[0]; }
async function renameUser(id, name) { await pool.query('UPDATE Users SET Name=? WHERE Id=?', [name, id]); }

async function getAllData() {
  const [rows] = await pool.query('SELECT `Key`, Part, `Value`, UpdatedAt FROM AppData ORDER BY `Key`, Part');
  const map = new Map();
  for (const r of rows) {
    const cur = map.get(r.Key);
    if (!cur) map.set(r.Key, { Key: r.Key, Value: r.Value, UpdatedAt: r.UpdatedAt });
    else { cur.Value += r.Value; if (r.UpdatedAt > cur.UpdatedAt) cur.UpdatedAt = r.UpdatedAt; }
  }
  return [...map.values()];
}
async function setData(key, value, userId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM AppData WHERE `Key`=?', [key]);
    let part = 0;
    for (let i = 0; i === 0 || i < value.length; i += CHUNK, part++) {
      await conn.query(
        'INSERT INTO AppData (`Key`,Part,`Value`,UpdatedAt,UpdatedBy) VALUES (?,?,?,UTC_TIMESTAMP(3),?)',
        [key, part, value.slice(i, i + CHUNK), userId]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}
async function deleteData(key) { await pool.query('DELETE FROM AppData WHERE `Key`=?', [key]); }
async function lastChange() {
  const [rows] = await pool.query('SELECT MAX(UpdatedAt) AS t FROM AppData');
  return rows[0].t ? new Date(rows[0].t).toISOString() : '';
}
async function ping() { await pool.query('SELECT 1'); }

module.exports = {
  init, pub, countUsers, findUserByLogin, findUserById, userExists, createUser,
  listUsers, renameUser, getAllData, setData, deleteData, lastChange, ping
};
