/* Picks the database: TIDB_HOST set -> TiDB Cloud (MySQL), DATABASE_URL set -> Postgres (Neon/Supabase/Render), otherwise SQL Server. */
module.exports = process.env.TIDB_HOST ? require('./db-tidb')
  : process.env.DATABASE_URL ? require('./db-pg')
  : require('./db-mssql');
