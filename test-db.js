const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
    const dbConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            // Disable certificate validation - only use in development
            rejectUnauthorized: false
        }
    };
    
    try {
        console.log('Attempting to connect to Aiven database...');
        console.log(`Using host: ${process.env.DB_HOST}, port: ${process.env.DB_PORT}, database: ${process.env.DB_NAME}`);
        
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connection to Aiven successful!');
        
        console.log('Testing query to users table...');
        const [rows] = await connection.execute('SELECT * FROM users LIMIT 5');
        
        console.log(`Found ${rows.length} users:`);
        console.log(rows);
        
        await connection.end();
        console.log('Connection closed.');
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

testDatabaseConnection();