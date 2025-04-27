const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { pool } = require('../config/database');

// Get user progress report
router.get('/user-progress', isAuthenticated, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                u.user_id,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                c.course_id,
                c.title as course_title,
                ucp.progress,
                ucp.last_activity
            FROM 
                user_course_progress ucp
            JOIN 
                users u ON ucp.user_id = u.user_id
            JOIN 
                courses c ON ucp.course_id = c.course_id
        `;
        
        const params = [];
        
        if (start_date && end_date) {
            query += ` WHERE ucp.last_activity BETWEEN ? AND ?`;
            params.push(start_date, end_date);
        }
        
        query += ` ORDER BY ucp.last_activity DESC`;
        
        const [rows] = await pool.query(query, params);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching user progress report:', error);
        res.status(500).json({ error: 'Error al obtener el reporte de progreso de usuarios' });
    }
});

// Get course completion report
router.get('/course-completion', isAuthenticated, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                c.course_id,
                c.title as course_title,
                COUNT(DISTINCT ucp.user_id) as total_students,
                COUNT(CASE WHEN ucp.progress = 1 THEN 1 END) as completed,
                COUNT(CASE WHEN ucp.progress > 0 AND ucp.progress < 1 THEN 1 END) as in_progress,
                COUNT(CASE WHEN ucp.progress = 0 OR ucp.progress IS NULL THEN 1 END) as not_started,
                AVG(ucp.rating) as avg_rating
            FROM 
                courses c
            LEFT JOIN 
                user_course_progress ucp ON c.course_id = ucp.course_id
        `;
        
        const params = [];
        
        if (start_date && end_date) {
            query += ` WHERE (ucp.last_activity IS NULL OR ucp.last_activity BETWEEN ? AND ?)`;
            params.push(start_date, end_date);
        }
        
        query += ` GROUP BY c.course_id, c.title
                  ORDER BY completed DESC`;
        
        const [rows] = await pool.query(query, params);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching course completion report:', error);
        res.status(500).json({ error: 'Error al obtener el reporte de finalización de cursos' });
    }
});

// Get popular content report
router.get('/popular-content', isAuthenticated, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                m.module_id,
                m.title as module_title,
                c.course_id,
                c.title as course_title,
                cat.name as category_name,
                COUNT(DISTINCT ucp.user_id) as enrolled_users,
                AVG(ucp.progress) * 100 as completion_rate,
                AVG(ucp.rating) as avg_rating
            FROM 
                modules m
            JOIN 
                courses c ON m.course_id = c.course_id
            LEFT JOIN 
                categories cat ON c.category_id = cat.category_id
            LEFT JOIN 
                user_course_progress ucp ON c.course_id = ucp.course_id
        `;
        
        const params = [];
        
        if (start_date && end_date) {
            query += ` WHERE (ucp.last_activity IS NULL OR ucp.last_activity BETWEEN ? AND ?)`;
            params.push(start_date, end_date);
        }
        
        query += ` GROUP BY m.module_id, m.title, c.course_id, c.title, cat.name
                  ORDER BY enrolled_users DESC, completion_rate DESC`;
        
        const [rows] = await pool.query(query, params);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching popular content report:', error);
        res.status(500).json({ error: 'Error al obtener el reporte de contenido popular' });
    }
});

module.exports = router;