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
const { quizRouter, questionRouter, answerRouter } = require('./routes/quizzes'); // Import quiz/question/answer routers

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar tipos MIME correctos para archivos estáticos
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Session configuration
app.use(session(sessionConfig));

// API routes
app.use('/api', routes);

// Add the log routes directly to ensure they're accessible
app.use('/api/log', logRoutes);

// Add the technician routes
app.use('/api/technician', technicianRoutes);

// Add the forum routes
app.use('/api/forum', require('./routes/forum'));

// Add the quiz/question/answer routes
app.use('/api/quizzes', quizRouter);
app.use('/api/questions', questionRouter);
app.use('/api/answers', answerRouter);

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

// Importar las rutas de API
const userRoutes = require('./routes/api/users');
// const courseApiRoutes = require('./routes/api/courses'); // No longer needed here, handled below
const courseRoutes = require('./routes/courses'); // Import the main course routes

// Registrar las rutas de API
app.use('/api/users', userRoutes);
// app.use('/api/courses', courseApiRoutes); // Remove this line
app.use('/api/courses', courseRoutes); // Mount the main course routes under /api/courses

app.use('/technician', express.static(path.join(__dirname, 'technician')));
  
  // permitir URLs sin “.html”
  app.get('/technician/:page', (req, res, next) => {
    const filePath = path.join(
      __dirname,
      'technician',
      `${req.params.page}.html`
    );
    res.sendFile(filePath, err => {
      if (err) next();  // si no existe, pasa al 404
    });
  });

// Error handling middleware (debe ser el último middleware)
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
