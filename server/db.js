/* Picks the database: DATABASE_URL set -> Postgres (online: Neon/Supabase/Render), otherwise SQL Server. */
module.exports = process.env.DATABASE_URL ? require('./db-pg') : require('./db-mssql');
