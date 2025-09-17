const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DB,
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  options: {
    encrypt: false,
    enableArithAbort: true
  },
  pool: { 
    max: 10, 
    min: 0, 
    idleTimeoutMillis: 30000 
  },
  port: parseInt(process.env.MSSQL_PORT)
};

let pool;

async function connectDB() {
  try {
    if (!pool) {
      pool = new sql.ConnectionPool(config);
      await pool.connect();
    }
    console.log('✅ Database connected successfully');
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function getPool() {
  if (!pool) {
    await connectDB();
  }
  return pool;
}

module.exports = { sql, connectDB, getPool };
