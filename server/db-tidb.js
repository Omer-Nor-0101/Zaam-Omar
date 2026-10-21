/* TiDB Cloud / MySQL access (used when TIDB_HOST is set). Same functions and column names as db-pg.js, so index.js is unchanged. */
const mysql = require('mysql2/promise');

const DB = process.env.TIDB_DATABASE || 'ForeverUs';
const SYSTEM_DBS = ['sys', 'mysql', 'information_schema', 'performance_schema', 'metrics_schema', 'inspection_schema'];

const base = {
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }, // TiDB Cloud requires TLS
  dateStrings: ['DATE'],   // DATE stays 'YYYY-MM-DD'
  timezone: 'Z'
};
const utc = (c) => c.query("SET time_zone='+00:00'");

let pool;

async function init() {
  if (SYSTEM_DBS.includes(DB.toLowerCase())) {
    throw new Error('TIDB_DATABASE="' + DB + '" is a TiDB system database and cannot hold your tables. Change TIDB_DATABASE to another name, for example ForeverUs or test.');
  }
  // Create the database if it does not exist yet.
  const boot = await mysql.createConnection(base);
  try { await boot.query('CREATE DATABASE IF NOT EXISTS `' + DB.replace(/`/g, '') + '` CHARACTER SET utf8mb4'); }
  finally { await boot.end(); }

  pool = mysql.createPool({ ...base, database: DB, connectionLimit: 8, waitForConnections: true, maxPreparedStatements: 0 });
  pool.pool.on('connection', utc);

  const ddl = [
    `CREATE TABLE IF NOT EXISTS Users (
      Id INT AUTO_INCREMENT PRIMARY KEY,
      AccountKey VARCHAR(220) NOT NULL,
      Name VARCHAR(50) NOT NULL,
      Username VARCHAR(30) NULL,
      Email VARCHAR(200) NULL,
      PasswordHash VARCHAR(100) NOT NULL,
      Created DATE NOT NULL DEFAULT (UTC_DATE()),
      UNIQUE KEY UX_Users_AccountKey (AccountKey),
      UNIQUE KEY UX_Users_Username (Username),
      UNIQUE KEY UX_Users_Email (Email)
    ) CHARACTER SET utf8mb4`,
    `CREATE TABLE IF NOT EXISTS AppData (
      \`Key\` VARCHAR(100) NOT NULL PRIMARY KEY,
      \`Value\` LONGTEXT NOT NULL,
      UpdatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UpdatedBy INT NULL
    ) CHARACTER SET utf8mb4`,
    `CREATE TABLE IF NOT EXISTS Media (
      Id VARCHAR(40) NOT NULL PRIMARY KEY,
      OwnerId INT NULL,
      Name VARCHAR(200) NOT NULL,
      Type VARCHAR(100) NOT NULL,
      Size BIGINT NOT NULL DEFAULT 0,
      Created DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) CHARACTER SET utf8mb4`,
    `CREATE TABLE IF NOT EXISTS MediaChunks (
      MediaId VARCHAR(40) NOT NULL,
      Idx INT NOT NULL,
      Data LONGBLOB NOT NULL,
      PRIMARY KEY (MediaId, Idx)
    )`,
    `CREATE TABLE IF NOT EXISTS PasswordResets (
      TokenHash VARCHAR(64) NOT NULL PRIMARY KEY,
      UserId INT NOT NULL,
      Expires DATETIME(3) NOT NULL
    )`
  ];
  for (const q of ddl) await pool.query(q);
  await mediaPurgeEmpty();
}

// No foreign keys (older TiDB versions ignore them), so the cascades are done here.
async function mediaPurgeEmpty() {
  await pool.query('DELETE FROM MediaChunks WHERE MediaId IN (SELECT Id FROM Media WHERE Size=0)');
  await pool.query('DELETE FROM Media WHERE Size=0');
}

const pub = (r) => r && ({
  id: r.Id, key: r.AccountKey, name: r.Name,
  username: r.Username || '', email: r.Email || '',
  created: r.Created instanceof Date ? r.Created.toISOString().slice(0, 10) : String(r.Created || '')
});

const rows = async (sql, args) => (await pool.query(sql, args))[0];

async function countUsers() { return Number((await rows('SELECT COUNT(*) AS n FROM Users'))[0].n); }
async function findUserByLogin(id) { return (await rows('SELECT * FROM Users WHERE Email=? OR Username=? LIMIT 1', [id, id]))[0] || null; }
async function findUserById(id) { return (await rows('SELECT * FROM Users WHERE Id=?', [id]))[0] || null; }
async function userExists(username, email) {
  const r = await rows(
    `SELECT 1 AS x FROM Users WHERE (? IS NOT NULL AND (Username=? OR Email=?))
                                 OR (? IS NOT NULL AND (Email=? OR Username=?)) LIMIT 1`,
    [username || null, username || null, username || null, email || null, email || null, email || null]);
  return r.length > 0;
}
async function createUser({ name, username, email, key, hash }) {
  const [res] = await pool.query(
    'INSERT INTO Users (AccountKey,Name,Username,Email,PasswordHash) VALUES (?,?,?,?,?)',
    [key, name, username || null, email || null, hash]);
  return findUserById(res.insertId);
}
async function listUsers() { return rows('SELECT * FROM Users ORDER BY Id'); }
async function renameUser(id, name) { await pool.query('UPDATE Users SET Name=? WHERE Id=?', [name, id]); }
async function getAllData() { return rows('SELECT `Key`,`Value`,UpdatedAt FROM AppData'); }
async function setData(key, value, userId) {
  await pool.query(
    `INSERT INTO AppData (\`Key\`,\`Value\`,UpdatedBy) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE \`Value\`=VALUES(\`Value\`), UpdatedAt=CURRENT_TIMESTAMP(3), UpdatedBy=VALUES(UpdatedBy)`,
    [key, value, userId]);
}
async function deleteData(key) { await pool.query('DELETE FROM AppData WHERE `Key`=?', [key]); }
async function lastChange() {
  const t = (await rows('SELECT MAX(UpdatedAt) AS t FROM AppData'))[0].t;
  return t ? new Date(t).toISOString() : '';
}

/* ---- Media: files are stored in the database in 4 MB chunks ---- */
async function mediaCreate(id, ownerId, name, type) {
  await pool.query('INSERT INTO Media (Id,OwnerId,Name,Type) VALUES (?,?,?,?)', [id, ownerId, name, type]);
}
async function mediaChunk(id, idx, buf) {
  await pool.query('INSERT INTO MediaChunks (MediaId,Idx,Data) VALUES (?,?,?)', [id, idx, buf]);
}
async function mediaFinish(id, size) { await pool.query('UPDATE Media SET Size=? WHERE Id=?', [size, id]); }
async function mediaMeta(id) {
  const r = (await rows('SELECT Id,OwnerId,Name,Type,Size FROM Media WHERE Id=? AND Size>0', [id]))[0];
  return r ? { id: r.Id, ownerId: r.OwnerId, name: r.Name, type: r.Type, size: Number(r.Size) } : null;
}
async function mediaGetChunk(id, idx) {
  const r = (await rows('SELECT Data FROM MediaChunks WHERE MediaId=? AND Idx=?', [id, idx]))[0];
  return r ? r.Data : null;
}
async function mediaDelete(id) {
  await pool.query('DELETE FROM MediaChunks WHERE MediaId=?', [id]);
  await pool.query('DELETE FROM Media WHERE Id=?', [id]);
}

/* ---- Password reset ---- */
async function setPassword(userId, hash) { await pool.query('UPDATE Users SET PasswordHash=? WHERE Id=?', [hash, userId]); }
async function createReset(userId, tokenHash, minutes) {
  await pool.query('DELETE FROM PasswordResets WHERE UserId=? OR Expires<UTC_TIMESTAMP(3)', [userId]);
  await pool.query('INSERT INTO PasswordResets (TokenHash,UserId,Expires) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? MINUTE))', [tokenHash, userId, Number(minutes)]);
}
async function findReset(tokenHash) {
  const r = (await rows('SELECT UserId FROM PasswordResets WHERE TokenHash=? AND Expires>UTC_TIMESTAMP(3)', [tokenHash]))[0];
  return r ? r.UserId : null;
}
async function deleteResets(userId) { await pool.query('DELETE FROM PasswordResets WHERE UserId=?', [userId]); }

async function ping() { await pool.query('SELECT 1'); }

module.exports = {
  init, pub, countUsers, findUserByLogin, findUserById, userExists, createUser,
  listUsers, renameUser, getAllData, setData, deleteData, lastChange, ping,
  mediaCreate, mediaChunk, mediaFinish, mediaMeta, mediaGetChunk, mediaDelete,
  setPassword, createReset, findReset, deleteResets
};
