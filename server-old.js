require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

const coursesImageDir = path.join(__dirname, 'images', 'courses');
if (!fs.existsSync(coursesImageDir)) {
    fs.mkdirSync(coursesImageDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, coursesImageDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'course-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Accept images only
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Session configuration
app.use(session({
    secret: 'whirlpool_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Database configuration for Aiven
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

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection successful!');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
}

// Login API endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.json({ success: false, message: 'Por favor, completa todos los campos.' });
        }
        
        // Query user from database
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        
        if (rows.length === 0) {
            return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
        }
        
        const user = rows[0];
        
        // Verify password (in a real app, you should use bcrypt)
        if (password === user.password) {
            // Update last login time
            await pool.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
            
            // Set session data
            req.session.user = {
                user_id: user.user_id,
                username: user.username,
                role: user.role,
                full_name: `${user.first_name} ${user.last_name}`
            };
            
            // Set remember me cookie if requested
            if (remember) {
                req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            }
            
            // Determine redirect based on role
            const redirect = user.role === 'admin' ? '/admin/dashboard.html' : '/technician/dashboard.html';
            
            return res.json({ success: true, redirect });
        } else {
            return res.json({ success: false, message: 'Usuario o contraseña incorrectos.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.json({ success: false, message: 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.' });
    }
});

// Check session endpoint
app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout endpoint
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

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

// API Routes for Courses
app.get('/api/courses', async (req, res) => {
    try {
        const [courses] = await pool.query(`
            SELECT c.course_id, c.title, c.description, c.thumbnail, 
                   c.created_by, c.created_at, c.updated_at, c.status,
                   (SELECT COUNT(*) FROM modules WHERE course_id = c.course_id) as lessons,
                   (SELECT COUNT(*) FROM user_course_progress WHERE course_id = c.course_id) as students
            FROM courses c
            ORDER BY c.updated_at DESC
        `);
        
        for (let course of courses) {
            const [creator] = await pool.query(`
                SELECT CONCAT(first_name, ' ', last_name) as creator_name 
                FROM users 
                WHERE user_id = ?
            `, [course.created_by]);
            
            if (creator.length > 0) {
                course.creator_name = creator[0].creator_name;
            }
        }
        
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Error al cargar los cursos' });
    }
});

// Get a single course by ID
app.get('/api/courses/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        
        // Get course details
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ?',
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        res.json(courses[0]);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Error al cargar el curso' });
    }
});

// Update an existing course with image upload
app.put('/api/courses/:id', (req, res, next) => {
    upload.single('courseThumbnail')(req, res, function(err) {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ error: 'Error al subir la imagen: ' + err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        // Check if user is logged in and is admin
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(401).json({ error: 'No autorizado' });
        }
        
        const courseId = req.params.id;
        const { title, description, status } = req.body;
        
        // If a new file was uploaded
        if (req.file) {
            // Get the current thumbnail to delete it later
            const [currentCourse] = await pool.query(
                'SELECT thumbnail FROM courses WHERE course_id = ?',
                [courseId]
            );
            
            // Update course with new thumbnail
            await pool.query(
                'UPDATE courses SET title = ?, description = ?, status = ?, thumbnail = ?, updated_at = NOW() WHERE course_id = ?',
                [title, description, status, path.basename(req.file.path), courseId]
            );
            
            // Delete old thumbnail if it exists
            if (currentCourse.length > 0 && currentCourse[0].thumbnail) {
                const oldThumbnailPath = path.join(coursesImageDir, currentCourse[0].thumbnail);
                if (fs.existsSync(oldThumbnailPath)) {
                    fs.unlinkSync(oldThumbnailPath);
                }
            }
        } else {
            // Update course without changing thumbnail
            await pool.query(
                'UPDATE courses SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE course_id = ?',
                [title, description, status, courseId]
            );
        }
        
        res.json({ message: 'Curso actualizado exitosamente' });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Error al actualizar el curso: ' + error.message });
    }
});

// Delete a course (including its thumbnail)
app.delete('/api/courses/:id', async (req, res) => {
    try {
        // Check if user is logged in and is admin
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(401).json({ error: 'No autorizado' });
        }
        
        const courseId = req.params.id;
        
        // Get the current thumbnail to delete it
        const [currentCourse] = await pool.query(
            'SELECT thumbnail FROM courses WHERE course_id = ?',
            [courseId]
        );
        
        // Delete course from database
        await pool.query('DELETE FROM courses WHERE course_id = ?', [courseId]);
        
        // Delete thumbnail if it exists
        if (currentCourse.length > 0 && currentCourse[0].thumbnail) {
            const thumbnailPath = path.join(coursesImageDir, currentCourse[0].thumbnail);
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
        }
        
        res.json({ message: 'Curso eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Error al eliminar el curso' });
    }
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Service is running' });
});

app.post('/api/courses', upload.single('thumbnail'), async (req, res) => {
    try {
        // Get the user ID from the session
        const userId = req.session.user ? req.session.user.user_id : 1; // Default to 1 for testing if no session
        
        // Extract course data from request
        const { title, description, status } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        // Handle the thumbnail - convert undefined to null
        const thumbnail = req.file ? req.file.filename : null;
        
        // Convert any undefined values to null explicitly
        const safeDescription = description || null;
        const safeStatus = status || 'draft'; // Default to draft if not specified
        
        // Insert the course into the database with safe values
        const [result] = await pool.execute(
            'INSERT INTO courses (title, description, thumbnail, created_by, status) VALUES (?, ?, ?, ?, ?)',
            [title, safeDescription, thumbnail, userId, safeStatus]
        );
        
        res.status(201).json({
            course_id: result.insertId,
            title,
            description: safeDescription,
            thumbnail,
            created_by: userId,
            status: safeStatus
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Error al crear el curso' });
    }
});

// Error handling middleware for multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        return res.status(400).json({ 
            error: 'Error al subir la imagen: ' + err.message,
            field: err.field
        });
    } else if (err) {
        // An unknown error occurred
        console.error('Unknown error:', err);
        return res.status(500).json({ 
            error: 'Error del servidor: ' + err.message 
        });
    }
    next();
});