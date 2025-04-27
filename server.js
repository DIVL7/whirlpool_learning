require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { testDatabaseConnection } = require('./config/database');
const sessionConfig = require('./config/session');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const session = require('express-session');
const logRoutes = require('./routes/log');
const technicianRoutes = require('./routes/technician');
const forumRoutes = require('./routes/forum');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// PARA MANEJAR ESPECÍFICAMENTE LA RUTA DE TECHNICIAN
app.use('/technician', express.static(path.join(__dirname, 'technician')));

// Session configuration
app.use(session(sessionConfig));

// API routes
app.use('/api', routes);
app.use('/api/log', logRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/forum', forumRoutes);

// RUTAS ESPECÍFICAS PARA MANEJAR LA NAVEGACIÓN HTML
// Ruta general para las páginas de technician 
app.get('/technician/:page', (req, res, next) => {
    const page = req.params.page;
    // Verificar si el archivo existe antes de enviarlo
    const filePath = path.join(__dirname, 'technician', `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            next();  
        }
    });
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