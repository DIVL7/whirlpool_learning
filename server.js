require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { testDatabaseConnection } = require('./config/database');
const sessionConfig = require('./config/session');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const session = require('express-session');
const logRoutes = require('./routes/log'); // Add this line to import log routes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Session configuration
app.use(session(sessionConfig));

// API routes
app.use('/api', routes);

// Add the log routes directly to ensure they're accessible
app.use('/api/log', logRoutes); // Add this line to register log routes

// Compatibility routes to keep the frontend working
// These can be removed once the frontend is updated to use the new API endpoints
app.post('/api/login', (req, res) => {
    req.url = '/auth/login';
    routes(req, res);
});

app.get('/api/check-session', (req, res) => {
    req.url = '/auth/check-session';
    routes(req, res);
});

app.get('/api/logout', (req, res) => {
    req.url = '/auth/logout';
    routes(req, res);
});

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        const dbConnected = await testDatabaseConnection();
        
        if (!dbConnected) {
            console.warn('WARNING: Could not connect to database. Server will start anyway, but some features may not work.');
        }
        
        // Start server regardless of database connection
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        console.log('Retrying in 5 seconds...');
        setTimeout(startServer, 5000);
    }
}

startServer();