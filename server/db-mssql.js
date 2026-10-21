/* SQL Server access. All queries are parameterised. */
const sql = require('mssql');

const cfg = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'ForeverUs',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: String(process.env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(process.env.DB_TRUST_CERT || 'true').toLowerCase() === 'true',
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {})
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  requestTimeout: 60000
};
if (!process.env.DB_INSTANCE) cfg.port = Number(process.env.DB_PORT || 1433);

let pool;

async function ensureDatabase() {
  // Connect to master first so the database can be created if it does not exist.
  const master = await new sql.ConnectionPool({ ...cfg, database: 'master' }).connect();
  try {
    await master.request()
      .input('n', sql.NVarChar, cfg.database)
      .query(`IF DB_ID(@n) IS NULL EXEC('CREATE DATABASE [' + REPLACE(@n, ']', ']]') + ']')`);
  } finally { await master.close(); }
}

async function init() {
  await ensureDatabase();
  pool = await new sql.ConnectionPool(cfg).connect();
  await pool.request().batch(`
    IF OBJECT_ID('dbo.Users') IS NULL
    CREATE TABLE dbo.Users (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      AccountKey NVARCHAR(220) NOT NULL UNIQUE,
      Name NVARCHAR(50) NOT NULL,
      Username NVARCHAR(30) NULL,
      Email NVARCHAR(200) NULL,
      PasswordHash NVARCHAR(100) NOT NULL,
      Created DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE)
    );
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_Users_Username')
      CREATE UNIQUE INDEX UX_Users_Username ON dbo.Users(Username) WHERE Username IS NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UX_Users_Email')
      CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email) WHERE Email IS NOT NULL;
    IF OBJECT_ID('dbo.AppData') IS NULL
    CREATE TABLE dbo.AppData (
      [Key] NVARCHAR(100) NOT NULL PRIMARY KEY,
      [Value] NVARCHAR(MAX) NOT NULL,
      UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
      UpdatedBy INT NULL REFERENCES dbo.Users(Id)
    );
  `);
}

const pub = (r) => r && ({
  id: r.Id, key: r.AccountKey, name: r.Name,
  username: r.Username || '', email: r.Email || '',
  created: r.Created instanceof Date ? r.Created.toISOString().slice(0, 10) : String(r.Created || '')
});

async function countUsers() {
  const r = await pool.request().query('SELECT COUNT(*) AS n FROM dbo.Users');
  return r.recordset[0].n;
}

async function findUserByLogin(id) {
  const r = await pool.request().input('id', sql.NVarChar(220), id)
    .query('SELECT TOP 1 * FROM dbo.Users WHERE Email=@id OR Username=@id');
  return r.recordset[0] || null;
}

async function findUserById(id) {
  const r = await pool.request().input('id', sql.Int, id)
    .query('SELECT * FROM dbo.Users WHERE Id=@id');
  return r.recordset[0] || null;
}

async function userExists(username, email) {
  const r = await pool.request()
    .input('u', sql.NVarChar(30), username || null)
    .input('e', sql.NVarChar(200), email || null)
    .query(`SELECT TOP 1 1 AS x FROM dbo.Users
            WHERE (@u IS NOT NULL AND (Username=@u OR Email=@u))
               OR (@e IS NOT NULL AND (Email=@e OR Username=@e))`);
  return r.recordset.length > 0;
}

async function createUser({ name, username, email, key, hash }) {
  const r = await pool.request()
    .input('k', sql.NVarChar(220), key)
    .input('n', sql.NVarChar(50), name)
    .input('u', sql.NVarChar(30), username || null)
    .input('e', sql.NVarChar(200), email || null)
    .input('h', sql.NVarChar(100), hash)
    .query(`INSERT INTO dbo.Users (AccountKey, Name, Username, Email, PasswordHash)
            OUTPUT INSERTED.* VALUES (@k,@n,@u,@e,@h)`);
  return r.recordset[0];
}

async function listUsers() {
  const r = await pool.request().query('SELECT * FROM dbo.Users ORDER BY Id');
  return r.recordset;
}

async function renameUser(id, name) {
  await pool.request().input('id', sql.Int, id).input('n', sql.NVarChar(50), name)
    .query('UPDATE dbo.Users SET Name=@n WHERE Id=@id');
}

async function getAllData() {
  const r = await pool.request().query('SELECT [Key], [Value], UpdatedAt FROM dbo.AppData');
  return r.recordset;
}

async function setData(key, value, userId) {
  await pool.request()
    .input('k', sql.NVarChar(100), key)
    .input('v', sql.NVarChar(sql.MAX), value)
    .input('u', sql.Int, userId)
    .query(`MERGE dbo.AppData AS t USING (SELECT @k AS k) AS s ON t.[Key]=s.k
            WHEN MATCHED THEN UPDATE SET [Value]=@v, UpdatedAt=SYSUTCDATETIME(), UpdatedBy=@u
            WHEN NOT MATCHED THEN INSERT ([Key],[Value],UpdatedBy) VALUES (@k,@v,@u);`);
}

async function deleteData(key) {
  await pool.request().input('k', sql.NVarChar(100), key)
    .query('DELETE FROM dbo.AppData WHERE [Key]=@k');
}

async function lastChange() {
  const r = await pool.request().query('SELECT MAX(UpdatedAt) AS t FROM dbo.AppData');
  const t = r.recordset[0].t;
  return t ? new Date(t).toISOString() : '';
}

async function ping() { await pool.request().query('SELECT 1 AS ok'); }

module.exports = {
  init, pub, countUsers, findUserByLogin, findUserById, userExists, createUser,
  listUsers, renameUser, getAllData, setData, deleteData, lastChange, ping
};
