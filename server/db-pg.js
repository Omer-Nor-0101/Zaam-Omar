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
async function ping() { await pool.query('SELECT 1'); }

module.exports = {
  init, pub, countUsers, findUserByLogin, findUserById, userExists, createUser,
  listUsers, renameUser, getAllData, setData, deleteData, lastChange, ping
};
