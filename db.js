const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.MSSQL_HOST,
  database: process.env.MSSQL_DB,
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  port: parseInt(process.env.MSSQL_PORT),
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

async function connectDB() {
  try {
    await poolConnect;
    console.log('✅ MSSQL Connected');
  } catch (err) {
    console.error('❌ Database Connection Failed:', err);
  }
}

// --------------------- Helper functions ---------------------

/**
 * Execute a query (generic)
 */
async function query(sqlQuery, inputs = []) {
  await poolConnect; // ensure pool is connected
  const request = pool.request();
  inputs.forEach(input => {
    request.input(input.name, input.type, input.value);
  });
  const result = await request.query(sqlQuery);
  return result.recordset;
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const sqlQuery = 'SELECT * FROM Users WHERE id=@id';
  return query(sqlQuery, [{ name: 'id', type: sql.Int, value: userId }]);
}

/**
 * Get admin by ID
 */
async function getAdminById(adminId) {
  const sqlQuery = "SELECT * FROM Users WHERE id=@id AND role='Administrator'";
  return query(sqlQuery, [{ name: 'id', type: sql.Int, value: adminId }]);
}

module.exports = {
  sql,
  pool,
  poolConnect,
  connectDB,
  query,
  getUserById,
  getAdminById,
};
