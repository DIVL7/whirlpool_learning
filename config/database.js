require('dotenv').config();
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false,
    connectTimeout: 10000, // 10 seconds
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testDatabaseConnection() {
    try {
        // Removed the connection attempt message
        const connection = await pool.getConnection();
        console.log('Database connection successful!');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        return false;
    }
}

module.exports = { pool, testDatabaseConnection };