const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    const dbConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            rejectUnauthorized: false
        },
        multipleStatements: true // Important for running multiple SQL statements
    };
    
    try {
        console.log('Connecting to database...');
        console.log(`Using host: ${process.env.DB_HOST}, database: ${process.env.DB_NAME}`);
        
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connection successful!');
        
        // Read and execute schema file
        console.log('Creating database schema...');
        const schemaPath = path.join(__dirname, 'db', 'database_schema.sql');
        const schemaSQL = await fs.readFile(schemaPath, 'utf8');
        
        // Modify schema SQL to work with Aiven MySQL
        // Remove CREATE DATABASE and USE statements as we're already connected to the right DB
        const modifiedSchemaSQL = schemaSQL
            .replace(/CREATE DATABASE.*?;/g, '')
            .replace(/USE.*?;/g, '');
            
        await connection.query(modifiedSchemaSQL);
        console.log('Schema created successfully!');
        
        // Read and execute test data file
        console.log('Inserting test data...');
        const testDataPath = path.join(__dirname, 'db', 'test_data.sql');
        const testDataSQL = await fs.readFile(testDataPath, 'utf8');
        
        // Modify test data SQL to remove USE statement
        const modifiedTestDataSQL = testDataSQL.replace(/USE.*?;/g, '');
        
        await connection.query(modifiedTestDataSQL);
        console.log('Test data inserted successfully!');
        
        await connection.end();
        console.log('Database initialization completed!');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initializeDatabase();