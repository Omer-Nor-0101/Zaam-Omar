/* Postgres access (used when DATABASE_URL is set). Column names match the SQL Server version so index.js is identical. */
const { Pool, types } = require('pg');
types.setTypeParser(1082, (v) => v); // DATE stays 'YYYY-MM-DD'

const url = process.env.DATABASE_URL;
const local = /@(localhost|127\.0\.0\.1)/.test(url);
const pool = new Pool({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: false },
  max: 8
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Users" (
      "Id" SERIAL PRIMARY KEY,
      "AccountKey" VARCHAR(220) NOT NULL UNIQUE,
      "Name" VARCHAR(50) NOT NULL,
      "Username" VARCHAR(30),
      "Email" VARCHAR(200),
      "PasswordHash" VARCHAR(100) NOT NULL,
      "Created" DATE NOT NULL DEFAULT CURRENT_DATE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "UX_Users_Username" ON "Users"("Username") WHERE "Username" IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS "UX_Users_Email" ON "Users"("Email") WHERE "Email" IS NOT NULL;
    CREATE TABLE IF NOT EXISTS "AppData" (
      "Key" VARCHAR(100) PRIMARY KEY,
      "Value" TEXT NOT NULL,
      "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "UpdatedBy" INT REFERENCES "Users"("Id")
    );
    CREATE TABLE IF NOT EXISTS "Media" (
      "Id" VARCHAR(40) PRIMARY KEY,
      "OwnerId" INT REFERENCES "Users"("Id") ON DELETE SET NULL,
      "Name" VARCHAR(200) NOT NULL,
      "Type" VARCHAR(100) NOT NULL,
      "Size" BIGINT NOT NULL DEFAULT 0,
      "Created" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS "MediaChunks" (
      "MediaId" VARCHAR(40) NOT NULL REFERENCES "Media"("Id") ON DELETE CASCADE,
      "Idx" INT NOT NULL,
      "Data" BYTEA NOT NULL,
      PRIMARY KEY ("MediaId","Idx")
    );
    CREATE TABLE IF NOT EXISTS "PasswordResets" (
      "TokenHash" VARCHAR(64) PRIMARY KEY,
      "UserId" INT NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
      "Expires" TIMESTAMPTZ NOT NULL
    );
    DELETE FROM "Media" WHERE "Size"=0;
  `);
}

const pub = (r) => r && ({
  id: r.Id, key: r.AccountKey, name: r.Name,
  username: r.Username || '', email: r.Email || '',
  created: r.Created instanceof Date ? r.Created.toISOString().slice(0, 10) : String(r.Created || '')
});

async function countUsers() {
  const r = await pool.query('SELECT COUNT(*)::int AS n FROM "Users"');
  return r.rows[0].n;
}
async function findUserByLogin(id) {
  const r = await pool.query('SELECT * FROM "Users" WHERE "Email"=$1 OR "Username"=$1 LIMIT 1', [id]);
  return r.rows[0] || null;
}
async function findUserById(id) {
  const r = await pool.query('SELECT * FROM "Users" WHERE "Id"=$1', [id]);
  return r.rows[0] || null;
}
async function userExists(username, email) {
  const r = await pool.query(
    `SELECT 1 FROM "Users" WHERE ($1::text IS NOT NULL AND ("Username"=$1 OR "Email"=$1))
                              OR ($2::text IS NOT NULL AND ("Email"=$2 OR "Username"=$2)) LIMIT 1`,
    [username || null, email || null]);
  return r.rows.length > 0;
}
async function createUser({ name, username, email, key, hash }) {
  const r = await pool.query(
    `INSERT INTO "Users" ("AccountKey","Name","Username","Email","PasswordHash")
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [key, name, username || null, email || null, hash]);
  return r.rows[0];
}
async function listUsers() { return (await pool.query('SELECT * FROM "Users" ORDER BY "Id"')).rows; }
async function renameUser(id, name) { await pool.query('UPDATE "Users" SET "Name"=$2 WHERE "Id"=$1', [id, name]); }
async function getAllData() { return (await pool.query('SELECT "Key","Value","UpdatedAt" FROM "AppData"')).rows; }
async function setData(key, value, userId) {
  await pool.query(
    `INSERT INTO "AppData" ("Key","Value","UpdatedBy") VALUES ($1,$2,$3)
     ON CONFLICT ("Key") DO UPDATE SET "Value"=EXCLUDED."Value","UpdatedAt"=now(),"UpdatedBy"=EXCLUDED."UpdatedBy"`,
    [key, value, userId]);
}
async function deleteData(key) { await pool.query('DELETE FROM "AppData" WHERE "Key"=$1', [key]); }
async function lastChange() {
  const t = (await pool.query('SELECT MAX("UpdatedAt") AS t FROM "AppData"')).rows[0].t;
  return t ? new Date(t).toISOString() : '';
}

/* ---- Media: files are stored in the database in 4 MB chunks, so they survive restarts and redeploys ---- */
async function mediaCreate(id, ownerId, name, type) {
  await pool.query('INSERT INTO "Media" ("Id","OwnerId","Name","Type") VALUES ($1,$2,$3,$4)', [id, ownerId, name, type]);
}
async function mediaChunk(id, idx, buf) {
  await pool.query('INSERT INTO "MediaChunks" ("MediaId","Idx","Data") VALUES ($1,$2,$3)', [id, idx, buf]);
}
async function mediaFinish(id, size) { await pool.query('UPDATE "Media" SET "Size"=$2 WHERE "Id"=$1', [id, size]); }
async function mediaMeta(id) {
  const r = (await pool.query('SELECT "Id","OwnerId","Name","Type","Size" FROM "Media" WHERE "Id"=$1 AND "Size">0', [id])).rows[0];
  return r ? { id: r.Id, ownerId: r.OwnerId, name: r.Name, type: r.Type, size: Number(r.Size) } : null;
}
async function mediaGetChunk(id, idx) {
  const r = (await pool.query('SELECT "Data" FROM "MediaChunks" WHERE "MediaId"=$1 AND "Idx"=$2', [id, idx])).rows[0];
  return r ? r.Data : null;
}
async function mediaDelete(id) { await pool.query('DELETE FROM "Media" WHERE "Id"=$1', [id]); }

/* ---- Password reset ---- */
async function setPassword(userId, hash) { await pool.query('UPDATE "Users" SET "PasswordHash"=$2 WHERE "Id"=$1', [userId, hash]); }
async function createReset(userId, tokenHash, minutes) {
  await pool.query('DELETE FROM "PasswordResets" WHERE "UserId"=$1 OR "Expires"<now()', [userId]);
  await pool.query(`INSERT INTO "PasswordResets" ("TokenHash","UserId","Expires") VALUES ($1,$2,now() + ($3 || ' minutes')::interval)`, [tokenHash, userId, String(minutes)]);
}
async function findReset(tokenHash) {
  const r = (await pool.query('SELECT "UserId" FROM "PasswordResets" WHERE "TokenHash"=$1 AND "Expires">now()', [tokenHash])).rows[0];
  return r ? r.UserId : null;
}
async function deleteResets(userId) { await pool.query('DELETE FROM "PasswordResets" WHERE "UserId"=$1', [userId]); }

async function ping() { await pool.query('SELECT 1'); }

module.exports = {
  init, pub, countUsers, findUserByLogin, findUserById, userExists, createUser,
  listUsers, renameUser, getAllData, setData, deleteData, lastChange, ping,
  mediaCreate, mediaChunk, mediaFinish, mediaMeta, mediaGetChunk, mediaDelete,
  setPassword, createReset, findReset, deleteResets
};
