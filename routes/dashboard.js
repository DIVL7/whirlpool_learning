const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/database');

// Get dashboard stats
router.get('/stats', isAuthenticated, async (req, res) => {
    try {
        // Get total users
        const [userRows] = await pool.query('SELECT COUNT(*) as total FROM users');
        const totalUsers = userRows[0].total;
        
        // Get total courses
        const [courseRows] = await pool.query('SELECT COUNT(*) as total FROM courses');
        const totalCourses = courseRows[0].total;
        
        // Get active courses - Fix: Check the actual value in your database
        // Looking at your schema, it should be "published" not published
        const [activeRows] = await pool.query('SELECT COUNT(*) as total FROM courses WHERE status = ?', ['published']);
        const activeCourses = activeRows[0].total;
        
        // Get total completed courses
        const [completedRows] = await pool.query('SELECT COUNT(*) as total FROM user_course_progress WHERE status = ?', ['completed']);
        const totalCompleted = completedRows[0].total;
        
        // Get total modules
        const [moduleRows] = await pool.query('SELECT COUNT(*) as total FROM modules');
        const totalModules = moduleRows[0].total;
        
        // Remove the nested route handler that's causing issues
        
        // Send response without avgRating
        res.json({
            totalUsers,
            totalCourses,
            activeCourses,
            totalCompleted,
            totalModules
            // Removed avgRating from here
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas del dashboard' });
    }
});

// Get recent activity
router.get('/recent-activity', isAuthenticated, async (req, res) => {
    try {
        // Get recent course progress activity
        const [activities] = await pool.query(`
            SELECT 
                'course_progress' as activity_type,
                u.user_id,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                c.course_id,
                c.title as course_title,
                ucp.progress_percentage, 
                ucp.status,
                COALESCE(ucp.completed_at, ucp.started_at) as activity_date
            FROM 
                user_course_progress ucp
            JOIN 
                users u ON ucp.user_id = u.user_id
            JOIN 
                courses c ON ucp.course_id = c.course_id
            ORDER BY 
                activity_date DESC
            LIMIT 10
        `);
        
        // Format activities for frontend
        const formattedActivities = activities.map(activity => {
            let description = '';
            let type = '';
            
            // Create description based on activity type
            if (activity.activity_type === 'course_progress') {
                if (activity.status === 'completed') {
                    description = `${activity.user_name} completó el curso "${activity.course_title}"`;
                    type = 'course_completion';
                } else {
                    description = `${activity.user_name} avanzó en el curso "${activity.course_title}" (${activity.progress_percentage}%)`;
                    type = 'course_progress';
                }
            }
            
            return {
                type: type,
                description: description,
                timestamp: activity.activity_date
            };
        });
        
        res.json(formattedActivities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Error al cargar actividad reciente' });
    }
});

module.exports = router;