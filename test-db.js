const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
    const dbConfig = {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'whirlpool_learning'
    };
    
    try {
        console.log('Attempting to connect to database...');
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connection successful!');
        
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