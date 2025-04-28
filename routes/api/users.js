const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path'); // Needed for constructing URL path
const { pool } = require('../../config/database');
const { isAdmin } = require('../../middleware/auth'); 
// avatarUpload import removed

const saltRounds = 10;

// Obtener todos los usuarios técnicos con paginación y ordenamiento
router.get('/', isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'name'; // Default sort by name
    const offset = (page - 1) * limit;

    // Map sortBy values to database columns
    let orderByClause = 'ORDER BY first_name ASC'; // Default order
    if (sortBy === 'date') {
        orderByClause = 'ORDER BY created_at DESC';
    } else if (sortBy === 'activity') {
        orderByClause = 'ORDER BY last_login DESC';
    } else if (sortBy === 'name') {
        orderByClause = 'ORDER BY first_name ASC, last_name ASC';
    }

    try {
        // Query para obtener el total de usuarios técnicos (para calcular totalPages)
        const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['technician']);
        const totalUsers = totalResult[0].total;
        const totalPages = Math.ceil(totalUsers / limit);

        // Query para obtener los usuarios técnicos de la página actual
        const [users] = await pool.query(`
            SELECT
                user_id,
                first_name,
                last_name,
                email,
                username,
                role,
                profile_picture,
                created_at,
                last_login
            FROM users
            WHERE role = ?
            ${orderByClause}
            LIMIT ? OFFSET ?
        `, ['technician', limit, offset]);

        res.json({
            users: users,
            totalPages: totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Obtener un usuario por ID
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al cargar el usuario de la base de datos' });
    }
});

// Crear un nuevo usuario
router.post('/', isAdmin, async (req, res) => {
    try {
        // Destructure only necessary fields, ignore role and status from request
        const { firstName, lastName, email, username, password } = req.body;

        // Validar campos requeridos (role and status are no longer required from body)
        if (!firstName || !lastName || !email || !username || !password) {
            return res.status(400).json({ error: 'Nombre, apellido, email, nombre de usuario y contraseña son requeridos' });
        }

        // Verificar si el email ya existe
        const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        
        // Verificar si el username ya existe
        const [existingUsername] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar el nuevo usuario con imagen predeterminada y rol 'technician', sin status
        const defaultProfilePicture = 'default-avatar.png'; // Corrected default image filename
        const userRole = 'technician'; // Force role to technician
        const [result] = await pool.query(
            'INSERT INTO users (first_name, last_name, email, username, password, role, profile_picture, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [firstName, lastName, email, username, hashedPassword, userRole, defaultProfilePicture]
        );

        res.status(201).json({
            success: true, 
            message: 'Usuario creado correctamente',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear el usuario en la base de datos' });
    }
});

// Actualizar un usuario existente
router.put('/:id', isAdmin, async (req, res) => {
    try {
        // Destructure only necessary fields, ignore role and status from request body for update
        const { firstName, lastName, email, username, password } = req.body;
        const userId = req.params.id;

        // Validar campos requeridos (role and status are not updated here)
        if (!firstName || !lastName || !email || !username) {
            return res.status(400).json({ error: 'Nombre, apellido, email y nombre de usuario son requeridos' });
        }

        // Verificar si el usuario existe
        const [existingUser] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Verificar si el email ya existe para otro usuario
        const [existingEmail] = await pool.query('SELECT * FROM users WHERE email = ? AND user_id != ?', [email, userId]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado para otro usuario' });
        }
        
        // Verificar si el username ya existe para otro usuario
        const [existingUsername] = await pool.query('SELECT * FROM users WHERE username = ? AND user_id != ?', [username, userId]);
        if (existingUsername.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya está en uso por otro usuario' });
        }

        // Build the update query dynamically, excluding role and status
        let query = 'UPDATE users SET first_name = ?, last_name = ?, email = ?, username = ?';
        let params = [firstName, lastName, email, username];

        // If a new password is provided, hash it and add it to the update
        if (password && password.trim() !== '') { // Check if password is provided and not empty
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE user_id = ?';
        params.push(userId);

        await pool.query(query, params);
        
        res.json({ 
            success: true, 
            message: 'Usuario actualizado correctamente' 
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar el usuario en la base de datos' });
    }
});

// Eliminar un usuario
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Verificar si el usuario existe
        const [existingUser] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Eliminar el usuario
        await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
        
        res.json({ 
            success: true, 
            message: 'Usuario eliminado correctamente' 
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario de la base de datos' });
    }
});

// Función para formatear fechas
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Función para formatear la última actividad
function formatLastActivity(dateString) {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
        return `Hace ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
        return `Hace ${diffHours} horas`;
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Hace ${weeks} semanas`;
    } else {
        return formatDate(dateString);
    }
}

// GET /api/users/:id/courses - Get courses assigned to a specific user
router.get('/:id/courses', isAdmin, async (req, res) => {
    const userId = req.params.id;
    try {
        // Query to get course IDs and titles assigned to the user
        const [assignedCourses] = await pool.query(`
            SELECT c.course_id, c.title
            FROM courses c
            JOIN user_course_progress ucp ON c.course_id = ucp.course_id
            WHERE ucp.user_id = ?
            ORDER BY c.title ASC
        `, [userId]);

        if (assignedCourses.length === 0) {
            // It's not an error if the user has no courses, return empty array
            return res.json([]);
        }

        res.json(assignedCourses);

    } catch (error) {
        console.error(`Error fetching assigned courses for user ${userId}:`, error);
        res.status(500).json({ error: 'Error al obtener los cursos asignados del usuario.' });
    }
});


// POST /api/users/assign-courses - Assign multiple courses to multiple users
router.post('/assign-courses', isAdmin, async (req, res) => {
    const { userIds, courseIds } = req.body;

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0 || !Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({ error: 'Se requieren IDs de usuario y IDs de curso válidos.' });
    }

    try {
        const connection = await pool.getConnection(); // Get connection for transaction
        await connection.beginTransaction();

        let assignmentsMade = 0;
        const values = [];
        userIds.forEach(userId => {
            courseIds.forEach(courseId => {
                // Prepare values for bulk insert: [userId, courseId, status, started_at]
                // Set status to 'not_started' and started_at to null initially
                values.push([parseInt(userId), parseInt(courseId), 'not_started', null]);
            });
        });

        if (values.length > 0) {
            // Use INSERT IGNORE to skip assignments that already exist
            const sql = 'INSERT IGNORE INTO user_course_progress (user_id, course_id, status, started_at) VALUES ?';
            const [result] = await connection.query(sql, [values]);
            assignmentsMade = result.affectedRows; // Number of new assignments successfully made
        }

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: `${assignmentsMade} asignaciones de curso realizadas correctamente. Se omitieron las asignaciones duplicadas.`
        });

    } catch (error) {
        console.error('Error assigning courses:', error);
        // Rollback transaction in case of error
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ error: 'Error al asignar cursos a los usuarios.' });
    }
});

// POST /api/users/unassign-courses - Unassign multiple courses from a single user
router.post('/unassign-courses', isAdmin, async (req, res) => {
    const { userId, courseIds } = req.body;

    // Validate input
    if (!userId || !Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({ error: 'Se requieren ID de usuario y un array de IDs de curso válidos.' });
    }

    // Ensure courseIds are integers to prevent SQL injection issues if they weren't already numbers
    const validCourseIds = courseIds.map(id => parseInt(id)).filter(id => !isNaN(id));

    if (validCourseIds.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron IDs de curso válidos.' });
    }

    try {
        const connection = await pool.getConnection(); // Use connection for potential transaction if needed later
        
        // Construct the placeholder string (?, ?, ...) for the IN clause
        const placeholders = validCourseIds.map(() => '?').join(',');
        
        // Prepare the parameters array: [userId, courseId1, courseId2, ...]
        const params = [parseInt(userId), ...validCourseIds];

        // Execute the delete query
        const sql = `DELETE FROM user_course_progress WHERE user_id = ? AND course_id IN (${placeholders})`;
        const [result] = await connection.query(sql, params);
        
        connection.release();

        res.json({
            success: true,
            message: `${result.affectedRows} asignaciones de curso eliminadas correctamente para el usuario ${userId}.`
        });

    } catch (error) {
        console.error(`Error unassigning courses for user ${userId}:`, error);
        if (connection) connection.release(); // Ensure connection is released on error
        res.status(500).json({ error: 'Error al desasignar cursos del usuario.' });
    }
});


// --- Avatar Upload Route Removed ---


module.exports = router;
