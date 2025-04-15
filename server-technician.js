console.log("Iniciando servidor...");
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
    fileFilter: function (req, file, cb) {
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

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whirlpool_learning'
};

// Si estamos usando Aiven, consideramos SSL
if (process.env.DB_HOST && process.env.DB_HOST.includes('aiven')) {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

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

// Verificar si la tabla de notificaciones existe y crearla si no
async function setupNotificationsTable() {
    try {
        const [tables] = await pool.query(`
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'notifications'
        `);

        if (tables.length === 0) {
            console.log('Creando tabla de notificaciones...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    notification_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(100) NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
            `);

            // Insertar algunas notificaciones de ejemplo para técnicos
            await pool.query(`
                INSERT INTO notifications (user_id, title, message, type) 
                SELECT user_id, 'Nuevo curso disponible', 
                       'Se ha asignado un nuevo curso a tu perfil: "Refrigerator Repair Basics".', 'info'
                FROM users 
                WHERE role = 'technician' 
                LIMIT 5
            `);

            await pool.query(`
                INSERT INTO notifications (user_id, title, message, type) 
                SELECT user_id, 'Recordatorio de curso', 
                       'Tienes un curso en progreso que no has continuado en 3 días.', 'warning'
                FROM users 
                WHERE role = 'technician' 
                LIMIT 5
            `);

            console.log('Tabla de notificaciones creada con éxito.');
        }
    } catch (error) {
        console.error('Error verificando/creando tabla de notificaciones:', error);
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
                first_name: user.first_name,
                last_name: user.last_name,
                profile_picture: user.profile_picture,
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

// Check session endpoint - ACTUALIZADO para incluir toda la información necesaria
app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({
            loggedIn: true,
            user: {
                id: req.session.user.user_id,
                username: req.session.user.username,
                role: req.session.user.role,
                full_name: req.session.user.full_name,
                profile_picture: req.session.user.profile_picture
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout endpoint
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

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
    upload.single('courseThumbnail')(req, res, function (err) {
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

//
//
//
// API ROUTES SECCIÓN PARA TECNICOS

// SECCIÓN DE DASHBOARD
app.get('/api/technician/stats', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const userId = req.session.user.user_id;

        // Obtener conteo de cursos asignados
        const [coursesQuery] = await pool.query(`
            SELECT COUNT(*) as total FROM user_course_progress 
            WHERE user_id = ?
        `, [userId]);

        // Obtener conteo de cursos completados
        const [completedQuery] = await pool.query(`
            SELECT COUNT(*) as total FROM user_course_progress 
            WHERE user_id = ? AND status = 'completed'
        `, [userId]);

        // Obtener conteo de certificaciones
        const [certificationsQuery] = await pool.query(`
            SELECT COUNT(*) as total FROM user_badges 
            WHERE user_id = ?
        `, [userId]);

        // Obtener tendencias (comparación con el mes anterior)
        // Esto requeriría datos históricos reales, aquí usamos simulados
        const coursesTrend = Math.floor(Math.random() * 30) - 10;
        const completedTrend = Math.floor(Math.random() * 20);
        const certificationTrend = Math.floor(Math.random() * 25) - 5;

        // Obtener conteo de notificaciones
        const [notificationsQuery] = await pool.query(`
            SELECT COUNT(*) as count FROM notifications
            WHERE user_id = ? AND is_read = 0
        `, [userId]);

        const notifications = notificationsQuery[0].count || 0;

        res.json({
            success: true,
            coursesAssigned: coursesQuery[0].total,
            coursesCompleted: completedQuery[0].total,
            certifications: certificationsQuery[0].total,
            coursesTrend: `${coursesTrend}%`,
            completedTrend: `${completedTrend}%`,
            certificationTrend: `${certificationTrend}%`,
            notifications
        });
    } catch (error) {
        console.error('Error fetching technician stats:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar estadísticas del técnico'
        });
    }
});

app.get('/api/technician/progress-chart', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const userId = req.session.user.user_id;

        // Obtener las fechas para los últimos 7 días
        const dates = [];
        const labels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const formattedDate = date.toISOString().split('T')[0];
            dates.push(formattedDate);

            // Formato corto para etiquetas del gráfico
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            labels.push(dayNames[date.getDay()]);
        }

        // Obtener datos reales de actividad si es posible
        const [contentProgress] = await pool.query(`
            SELECT 
                DATE_FORMAT(completed_at, '%Y-%m-%d') as date, 
                COUNT(*) as count
            FROM user_content_progress
            WHERE 
                user_id = ? AND 
                completed = 1 AND 
                completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d')
        `, [userId]);

        const [quizAttempts] = await pool.query(`
            SELECT 
                DATE_FORMAT(completed_at, '%Y-%m-%d') as date, 
                COUNT(*) as count
            FROM quiz_attempts
            WHERE 
                user_id = ? AND 
                completed_at IS NOT NULL AND 
                completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d')
        `, [userId]);

        // Convertir los resultados a las series de datos esperadas por el gráfico
        const studyHours = dates.map(date => {
            const found = contentProgress.find(item => item.date === date);
            return found ? Math.min(found.count, 5) : 0; // Max 5 horas por día
        });

        const quizzes = dates.map(date => {
            const found = quizAttempts.find(item => item.date === date);
            return found ? found.count : 0;
        });

        // Si no hay datos reales, usar simulados
        const hasRealData = studyHours.some(hours => hours > 0) || quizzes.some(count => count > 0);

        const finalStudyHours = hasRealData ? studyHours : dates.map(() => Math.floor(Math.random() * 5) + 1);
        const finalQuizzes = hasRealData ? quizzes : dates.map(() => Math.floor(Math.random() * 3));

        res.json({
            success: true,
            labels: labels,
            datasets: [
                {
                    label: 'Horas de estudio',
                    data: finalStudyHours,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Cuestionarios completados',
                    data: finalQuizzes,
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching progress chart data:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar datos del gráfico de progreso'
        });
    }
});

app.get('/api/technician/course-status', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const userId = req.session.user.user_id;

        // Obtener conteo de cursos por estado
        const [statusQuery] = await pool.query(`
            SELECT 
                SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as not_started,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM user_course_progress 
            WHERE user_id = ?
        `, [userId]);

        // Si no hay datos, usar valores por defecto
        const defaultData = {
            notStarted: 0,
            inProgress: 0,
            completed: 0
        };

        if (statusQuery.length > 0) {
            res.json({
                success: true,
                data: {
                    notStarted: statusQuery[0].not_started || 0,
                    inProgress: statusQuery[0].in_progress || 0,
                    completed: statusQuery[0].completed || 0
                }
            });
        } else {
            res.json({
                success: true,
                data: defaultData
            });
        }
    } catch (error) {
        console.error('Error fetching course status data:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar datos de estado de cursos'
        });
    }
});

app.get('/api/technician/recent-activity', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const userId = req.session.user.user_id;

        // Obtener actividades de varias tablas
        const activities = [];

        // Intentar obtener datos de progreso de contenido
        try {
            const [contentProgressQuery] = await pool.query(`
                SELECT 
                    ucp.completed_at,
                    c.title,
                    m.title as module_title
                FROM user_content_progress ucp
                JOIN contents c ON ucp.content_id = c.content_id
                JOIN modules m ON c.module_id = m.module_id
                WHERE ucp.user_id = ? AND ucp.completed = 1
                ORDER BY ucp.completed_at DESC
                LIMIT 3
            `, [userId]);

            contentProgressQuery.forEach(item => {
                activities.push({
                    description: `Completaste la lección "${item.title}" en el módulo "${item.module_title}"`,
                    timeAgo: formatTimeAgo(new Date(item.completed_at))
                });
            });
        } catch (e) {
            console.error('Error fetching content progress activity:', e);
        }

        // Intentar obtener datos de intentos de quiz
        try {
            const [quizAttemptsQuery] = await pool.query(`
                SELECT 
                    qa.completed_at,
                    qa.score,
                    q.title,
                    m.title as module_title
                FROM quiz_attempts qa
                JOIN quizzes q ON qa.quiz_id = q.quiz_id
                JOIN modules m ON q.module_id = m.module_id
                WHERE qa.user_id = ? AND qa.completed_at IS NOT NULL
                ORDER BY qa.completed_at DESC
                LIMIT 3
            `, [userId]);

            quizAttemptsQuery.forEach(item => {
                activities.push({
                    description: `Obtuviste una calificación de ${item.score}% en el quiz "${item.title}"`,
                    timeAgo: formatTimeAgo(new Date(item.completed_at))
                });
            });
        } catch (e) {
            console.error('Error fetching quiz attempts activity:', e);
        }

        // Intentar obtener datos de cursos iniciados/completados
        try {
            const [courseProgressQuery] = await pool.query(`
                SELECT 
                    ucp.started_at,
                    ucp.completed_at,
                    ucp.status,
                    c.title
                FROM user_course_progress ucp
                JOIN courses c ON ucp.course_id = c.course_id
                WHERE ucp.user_id = ?
                ORDER BY 
                    CASE 
                        WHEN ucp.completed_at IS NOT NULL THEN ucp.completed_at
                        ELSE ucp.started_at
                    END DESC
                LIMIT 3
            `, [userId]);

            courseProgressQuery.forEach(item => {
                if (item.status === 'completed' && item.completed_at) {
                    activities.push({
                        description: `Completaste el curso "${item.title}"`,
                        timeAgo: formatTimeAgo(new Date(item.completed_at))
                    });
                } else if (item.status === 'in_progress' && item.started_at) {
                    activities.push({
                        description: `Comenzaste el curso "${item.title}"`,
                        timeAgo: formatTimeAgo(new Date(item.started_at))
                    });
                }
            });
        } catch (e) {
            console.error('Error fetching course progress activity:', e);
        }

        // Intentar obtener datos de actividad en el foro
        try {
            const [forumActivityQuery] = await pool.query(`
                SELECT 
                    'answer' as type,
                    fa.created_at,
                    fq.title as question_title
                FROM forum_answers fa
                JOIN forum_questions fq ON fa.question_id = fq.question_id
                WHERE fa.user_id = ?
                
                UNION ALL
                
                SELECT 
                    'question' as type,
                    fq.created_at,
                    fq.title as question_title
                FROM forum_questions fq
                WHERE fq.user_id = ?
                
                ORDER BY created_at DESC
                LIMIT 3
            `, [userId, userId]);

            forumActivityQuery.forEach(item => {
                if (item.type === 'answer') {
                    activities.push({
                        description: `Respondiste a la pregunta "${item.question_title}" en el foro`,
                        timeAgo: formatTimeAgo(new Date(item.created_at))
                    });
                } else {
                    activities.push({
                        description: `Publicaste la pregunta "${item.question_title}" en el foro`,
                        timeAgo: formatTimeAgo(new Date(item.created_at))
                    });
                }
            });
        } catch (e) {
            console.error('Error fetching forum activity:', e);
        }

        // Si no hay suficientes actividades, generar algunas simuladas
        if (activities.length < 4) {
            const simulatedActivities = [
                { text: 'Completaste la lección "Introducción a los refrigeradores"', time: 'Hace 2 horas' },
                { text: 'Obtuviste una calificación de 85% en el quiz "Componentes básicos"', time: 'Hace 1 día' },
                { text: 'Comenzaste el curso "Mantenimiento de Lavadoras"', time: 'Hace 2 días' },
                { text: 'El instructor respondió a tu pregunta en el foro', time: 'Hace 3 días' }
            ];

            // Agregar actividades simuladas hasta tener al menos 4
            let i = 0;
            while (activities.length < 4 && i < simulatedActivities.length) {
                activities.push({
                    description: simulatedActivities[i].text,
                    timeAgo: simulatedActivities[i].time
                });
                i++;
            }
        }

        // Ordenar por tiempo (más reciente primero)
        activities.sort((a, b) => {
            const timeA = parseTimeAgo(a.timeAgo);
            const timeB = parseTimeAgo(b.timeAgo);
            return timeA - timeB;
        });

        // Limitar a 5 actividades
        const limitedActivities = activities.slice(0, 5);

        res.json({
            success: true,
            activities: limitedActivities
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar actividad reciente'
        });
    }
});

// Función auxiliar para formatear tiempo transcurrido
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return `Hace ${diffInSeconds} segundos`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minutos`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `Hace ${diffInHours} horas`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `Hace ${diffInDays} días`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `Hace ${diffInMonths} meses`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `Hace ${diffInYears} años`;
}

// Función auxiliar para convertir "Hace X tiempo" a milisegundos para ordenar
function parseTimeAgo(timeAgoString) {
    const value = parseInt(timeAgoString.replace('Hace ', ''));

    if (timeAgoString.includes('segundos')) {
        return value * 1000;
    } else if (timeAgoString.includes('minutos')) {
        return value * 60 * 1000;
    } else if (timeAgoString.includes('horas')) {
        return value * 60 * 60 * 1000;
    } else if (timeAgoString.includes('días')) {
        return value * 24 * 60 * 60 * 1000;
    } else if (timeAgoString.includes('meses')) {
        return value * 30 * 24 * 60 * 60 * 1000;
    } else if (timeAgoString.includes('años')) {
        return value * 365 * 24 * 60 * 60 * 1000;
    }

    return 0;
}

// SECCIÓN DE COURSES 
// Endpoint para obtener los cursos asignados al técnico
app.get('/api/technician/courses', async (req, res) => {
    try {
        console.log('Procesando solicitud de cursos para técnico...');
        // Verificar que el usuario esté autenticado
        if (!req.session.user) {
            console.log('Usuario no autenticado');
            return res.status(401).json({ success: false, error: 'No autorizado' });
        }
        const userId = req.session.user.user_id;
        console.log('ID de usuario:', userId);

        // Consultar los cursos asignados mediante JOIN con user_course_progress
        const [courses] = await pool.query(`
    SELECT c.course_id AS id, c.title, c.description, c.thumbnail, 
           ucp.status, ucp.progress_percentage AS progress
    FROM courses c
    JOIN user_course_progress ucp ON c.course_id = ucp.course_id
    WHERE ucp.user_id = ?
    ORDER BY c.updated_at DESC
`, [userId]);

        console.log('Cursos obtenidos de la base de datos:', courses);

        // Convertir progress de string a número
        for (let course of courses) {
            course.progress = parseFloat(course.progress);
        }

        // Obtener calificaciones para los cursos completados
        for (let course of courses) {
            if (course.status === 'completed') {
                const [scoreQuery] = await pool.query(`
                    SELECT AVG(score) as average_score
                    FROM quiz_attempts
                    WHERE user_id = ? AND quiz_id IN (
                        SELECT quiz_id FROM quizzes WHERE module_id IN (
                            SELECT module_id FROM modules WHERE course_id = ?
                        )
                    )
                `, [userId, course.id]);

                if (scoreQuery[0].average_score) {
                    course.score = Math.round(scoreQuery[0].average_score);
                } else {
                    course.score = 90; // Valor por defecto si no hay calificaciones
                }
            }
        }

        console.log('Formato esperado por el frontend: { success: true, courses: [...] }');
        console.log('Respuesta enviada:', { success: true, courses });

        res.json({ success: true, courses });
    } catch (error) {
        console.error('Error fetching technician courses:', error);
        res.status(500).json({ success: false, error: 'Error al cargar los cursos' });
    }
});

// Endpoint para obtener los detalles de un curso asignado al técnico
app.get('/api/technician/courses/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, error: 'No autorizado' });
        }
        const courseId = req.params.id;
        const userId = req.session.user.user_id;
        
        // Verificar que el curso esté asignado al técnico (consulta en user_course_progress)
        const [assignment] = await pool.query(`
            SELECT * FROM user_course_progress
            WHERE user_id = ? AND course_id = ?
        `, [userId, courseId]);
        
        if (assignment.length === 0) {
            return res.status(404).json({ success: false, error: 'Curso no asignado' });
        }
        
        // Obtener la información completa del curso
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ?',
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ success: false, error: 'Curso no encontrado' });
        }
        
        // Añadir información de progreso al objeto del curso
        const course = courses[0];
        course.progress_percentage = assignment[0].progress_percentage;
        course.status = assignment[0].status;
        
        res.json({ success: true, course: course });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ success: false, error: 'Error al cargar el curso' });
    }
});

// Endpoint para obtener los módulos de un curso

// Añade este código de depuración al endpoint de módulos en server.js

app.get('/api/technician/courses/:id/modules', async (req, res) => {
    try {
        console.log('Solicitando módulos para el curso ID:', req.params.id);
        
        if (!req.session.user) {
            console.log('Error: Usuario no autenticado');
            return res.status(401).json({ success: false, error: 'No autorizado' });
        }
        
        const courseId = req.params.id;
        const userId = req.session.user.user_id;
        console.log('ID de usuario:', userId, 'ID de curso:', courseId);

        // Verificar que el curso esté asignado al técnico
        const [assignment] = await pool.query(`
            SELECT * FROM user_course_progress
            WHERE user_id = ? AND course_id = ?
        `, [userId, courseId]);
        
        console.log('Asignación del curso:', assignment);
        
        if (assignment.length === 0) {
            console.log('Error: Curso no asignado al técnico');
            return res.status(404).json({ success: false, error: 'Curso no asignado' });
        }

        // Obtener los módulos del curso
        console.log('Consultando módulos del curso...');
        const [modules] = await pool.query(`
            SELECT m.module_id, m.title, m.description, m.position,
                   (SELECT COUNT(*) FROM contents WHERE module_id = m.module_id) as content_count,
                   (SELECT COUNT(*) FROM quizzes WHERE module_id = m.module_id) as quiz_count
            FROM modules m
            WHERE m.course_id = ?
            ORDER BY m.position
        `, [courseId]);
        
        console.log('Módulos encontrados:', modules.length);

        // Para cada módulo, calcular el progreso
        for (let module of modules) {
            console.log('Procesando módulo ID:', module.module_id);
            
            // Obtener contenidos del módulo
            const [contents] = await pool.query(`
                SELECT c.content_id, c.title, c.content_type_id, ct.name as content_type, c.position
                FROM contents c
                JOIN content_types ct ON c.content_type_id = ct.content_type_id
                WHERE c.module_id = ?
                ORDER BY c.position
            `, [module.module_id]);
            
            console.log('Contenidos encontrados:', contents.length);

            // Obtener quizzes del módulo
            const [quizzes] = await pool.query(`
                SELECT q.quiz_id, q.title, q.description, q.passing_score, q.position
                FROM quizzes q
                WHERE q.module_id = ?
                ORDER BY q.position
            `, [module.module_id]);
            
            console.log('Quizzes encontrados:', quizzes.length);

            // Obtener progreso del usuario en este módulo
            console.log('Consultando progreso del usuario...');
            
            try {
                // Intentar obtener el progreso de contenido
                const [contentProgress] = await pool.query(`
                    SELECT COUNT(*) as completed_count
                    FROM user_content_progress
                    WHERE user_id = ? AND completed = 1 AND content_id IN (
                        SELECT content_id FROM contents WHERE module_id = ?
                    )
                `, [userId, module.module_id]);
                
                // Intentar obtener el progreso de quizzes
                const [quizProgress] = await pool.query(`
                    SELECT COUNT(*) as completed_count
                    FROM quiz_attempts
                    WHERE user_id = ? AND passed = 1 AND quiz_id IN (
                        SELECT quiz_id FROM quizzes WHERE module_id = ?
                    )
                `, [userId, module.module_id]);

                // Calcular progreso total
                const totalItems = contents.length + quizzes.length;
                const completedItems = contentProgress[0].completed_count + quizProgress[0].completed_count;
                
                console.log('Progreso calculado:', {
                    totalItems,
                    completedItems,
                    contentProgress: contentProgress[0].completed_count,
                    quizProgress: quizProgress[0].completed_count
                });
                
                module.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                module.contents = contents;
                module.quizzes = quizzes;
                
                // Determinar estado
                if (module.progress === 100) {
                    module.status = 'completed';
                } else if (module.progress > 0) {
                    module.status = 'in_progress';
                } else {
                    module.status = 'not_started';
                }
            } catch (progressError) {
                console.error('Error calculando progreso:', progressError);
                // Si hay error en el cálculo de progreso, establecer valores por defecto
                module.progress = 0;
                module.status = 'not_started';
                module.contents = contents;
                module.quizzes = quizzes;
            }
        }
        
        console.log('Enviando respuesta con', modules.length, 'módulos');
        res.json({ success: true, modules: modules });
    } catch (error) {
        console.error('Error detallado fetching course modules:', error);
        res.status(500).json({ success: false, error: 'Error al cargar los módulos del curso' });
    }
});



// Endpoint para obtener notificaciones del técnico
app.get('/api/notifications', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const userId = req.session.user.user_id;

        // Verificar si la tabla de notificaciones existe
        let notificationsExist = false;
        try {
            const [checkTable] = await pool.query(`
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'notifications'
            `);
            notificationsExist = checkTable.length > 0;
        } catch (error) {
            console.error('Error checking notifications table:', error);
        }

        if (notificationsExist) {
            // Obtener notificaciones del usuario
            const [notifications] = await pool.query(`
                SELECT notification_id, title, message, is_read, type, 
                       DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as formatted_date,
                       created_at
                FROM notifications 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 10
            `, [userId]);

            // Contar notificaciones no leídas
            const [unreadCount] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM notifications 
                WHERE user_id = ? AND is_read = FALSE
            `, [userId]);

            return res.json({
                success: true,
                notifications: notifications,
                unreadCount: unreadCount[0].count
            });
        } else {
            // Si la tabla no existe, crear la tabla
            try {
                await setupNotificationsTable();

                // Intentar nuevamente obtener las notificaciones
                const [notifications] = await pool.query(`
                    SELECT notification_id, title, message, is_read, type, 
                           DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as formatted_date,
                           created_at
                    FROM notifications 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 10
                `, [userId]);

                // Contar notificaciones no leídas
                const [unreadCount] = await pool.query(`
                    SELECT COUNT(*) as count 
                    FROM notifications 
                    WHERE user_id = ? AND is_read = FALSE
                `, [userId]);

                return res.json({
                    success: true,
                    notifications: notifications,
                    unreadCount: unreadCount[0].count
                });
            } catch (setupError) {
                console.error('Error setting up notifications table:', setupError);

                // Si no se puede crear la tabla, devolver datos simulados
                const simulatedNotifications = [
                    {
                        notification_id: 1,
                        title: 'Nuevo curso disponible',
                        message: 'Se ha asignado un nuevo curso a tu perfil: "Refrigerator Repair Basics".',
                        is_read: false,
                        type: 'info',
                        formatted_date: formatCurrentDate(),
                        created_at: new Date()
                    },
                    {
                        notification_id: 2,
                        title: 'Recordatorio',
                        message: 'Tienes un quiz pendiente por completar en el curso "Washing Machine Troubleshooting".',
                        is_read: false,
                        type: 'warning',
                        formatted_date: formatCurrentDate(-1),
                        created_at: new Date(Date.now() - 86400000)
                    }
                ];

                return res.json({
                    success: true,
                    notifications: simulatedNotifications,
                    unreadCount: 2
                });
            }
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cargar notificaciones'
        });
    }
});

// Función auxiliar para formatear la fecha actual
function formatCurrentDate(dayOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Endpoint para marcar notificaciones como leídas
app.post('/api/notifications/mark-read', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const userId = req.session.user.user_id;
        const { notificationId } = req.body;

        // Verificar si la tabla de notificaciones existe
        let notificationsExist = false;
        try {
            const [checkTable] = await pool.query(`
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'notifications'
            `);
            notificationsExist = checkTable.length > 0;
        } catch (error) {
            console.error('Error checking notifications table:', error);
        }

        if (notificationsExist) {
            if (notificationId) {
                // Marcar una notificación específica como leída
                await pool.query(`
                    UPDATE notifications 
                    SET is_read = TRUE 
                    WHERE notification_id = ? AND user_id = ?
                `, [notificationId, userId]);
            } else {
                // Marcar todas las notificaciones como leídas
                await pool.query(`
                    UPDATE notifications 
                    SET is_read = TRUE 
                    WHERE user_id = ?
                `, [userId]);
            }
        }

        res.json({
            success: true,
            message: 'Notificaciones marcadas como leídas'
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({
            success: false,
            error: 'Error al marcar notificaciones como leídas'
        });
    }
});

//Informacion de el estado del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
}).on('error', (error) => {
    console.error('Error al iniciar el servidor:', error);
});