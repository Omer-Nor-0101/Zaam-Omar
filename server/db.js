/* Picks the database: TIDB_HOST set -> TiDB Cloud (MySQL); DATABASE_URL set -> Postgres; otherwise SQL Server. */
module.exports = process.env.TIDB_HOST ? require('./db-mysql')
  : process.env.DATABASE_URL ? require('./db-pg')
  : require('./db-mssql');
