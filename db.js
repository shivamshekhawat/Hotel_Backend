const sql=require('mssql');
require("dotenv").config();

const config={
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DB,
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  options: {
    encrypt: false,
    enableArithAbort: true,
    useUTC: true,  // Ensure all dates are treated as UTC
    timezone: 'utc' // Explicitly set timezone to UTC
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  port: parseInt(process.env.MSSQL_PORT)
}

async function connectDB() {
    try {
        await sql.connect(config);
        console.log('✅ MSSQL Connected');
        return true;
    } catch (err) {
        console.error('❌ Database Connection Failed:', err);
        process.exit(1); // Exit if database connection fails
    }
}

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

module.exports = { sql, pool, poolConnect,connectDB };