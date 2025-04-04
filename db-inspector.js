const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectDatabase() {
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
        console.log('Connecting to database...');
        console.log(`Using host: ${process.env.DB_HOST}, database: ${process.env.DB_NAME}`);
        
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connection successful!');
        
        // Get all tables
        console.log('\n--- TABLES IN DATABASE ---');
        const [tables] = await connection.query('SHOW TABLES');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(tableName);
        });
        
        // Get structure of each table
        console.log('\n--- TABLE STRUCTURES ---');
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            console.log(`\nTable: ${tableName}`);
            
            const [columns] = await connection.query(`DESCRIBE ${tableName}`);
            console.log('Columns:');
            columns.forEach(column => {
                console.log(`  - ${column.Field} (${column.Type})${column.Key === 'PRI' ? ' PRIMARY KEY' : ''}${column.Null === 'NO' ? ' NOT NULL' : ''}`);
            });
        }
        
        await connection.end();
        console.log('\nConnection closed.');
    } catch (error) {
        console.error('Error inspecting database:', error);
    }
}

inspectDatabase();