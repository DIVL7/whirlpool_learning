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
  setHeaders: (res, filePath) => { // Renamed 'path' to 'filePath' for clarity
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.gz')) {
      // Set correct headers for gzipped files
      res.setHeader('Content-Encoding', 'gzip');
      // Set the correct Content-Type based on the original file extension
      if (filePath.endsWith('.js.gz')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.wasm.gz')) {
        res.setHeader('Content-Type', 'application/wasm');
      } else if (filePath.endsWith('.data.gz')) {
        // Unity data files might not have a standard MIME type,
        // application/octet-stream is a safe default
        res.setHeader('Content-Type', 'application/octet-stream');
      }
      // Add more types if needed (e.g., .json.gz, .html.gz)
    }
  }
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
const courseApiRoutes = require('./routes/api/courses'); // Uncommented: This defines the variable
const courseRoutes = require('./routes/courses'); // This file contains the actual POST/PUT/DELETE handlers

// Registrar las rutas de API
app.use('/api/users', userRoutes);
app.use('/api/courses', courseApiRoutes); // Mount the API course routes (includes /list, modules, etc.)
app.use('/courses', courseRoutes); // Mount the main course routes (POST, PUT, DELETE)

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
