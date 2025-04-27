const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { pool } = require('../config/database');

// Get dashboard stats
router.get('/stats', isAuthenticated, async (req, res) => {
    try {
        // Get total technician users
        const [userRows] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['technician']); // Corrected role value
        const totalUsers = userRows[0].total; // This now holds the count of technicians

        // Get total courses - Modificado para manejar errores silenciosamente
        let totalCourses = 0;
        let activeCourses = 0;
        try {
            const [courseRows] = await pool.query('SELECT COUNT(*) as total FROM courses');
            totalCourses = courseRows[0].total || 0;
            
            // Get active courses
            const [activeRows] = await pool.query('SELECT COUNT(*) as total FROM courses WHERE status = ?', ['published']);
            activeCourses = activeRows[0].total || 0;
        } catch (err) {
            console.error('Error al consultar cursos:', err);
            // Continuar con la ejecución en caso de error
        }
        
        // Get total completed courses
        let totalCompleted = 0;
        try {
            const [completedRows] = await pool.query('SELECT COUNT(*) as total FROM user_course_progress WHERE status = ?', ['completed']);
            totalCompleted = completedRows[0].total || 0;
        } catch (err) {
            console.error('Error al consultar cursos completados:', err);
            // Continuar con la ejecución en caso de error
        }
        
        // Get total modules
        let totalModules = 0;
        try {
            const [moduleRows] = await pool.query('SELECT COUNT(*) as total FROM modules');
            totalModules = moduleRows[0].total || 0;
        } catch (err) {
            console.error('Error al consultar módulos:', err);
            // Continuar con la ejecución en caso de error
        }
        
        // Get total certifications (from user_badges table)
        let totalCertifications = 0;
        try {
            const [certRows] = await pool.query(`
                SELECT COUNT(*) as total 
                FROM user_badges 
                JOIN badges ON user_badges.badge_id = badges.badge_id 
                WHERE badges.name LIKE '%certificación%' OR badges.name LIKE '%certification%'
            `);
            totalCertifications = certRows[0].total || 0;
        } catch (err) {
            console.error('Error al consultar certificaciones:', err);
            // Continuar con la ejecución en caso de error
        }
        
        // Send response
        res.json({
            totalUsers: totalUsers, // Keep the key as totalUsers for now to match frontend ID
            totalCourses,
            activeCourses,
            totalCompleted,
            totalModules,
            totalCertifications
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas del dashboard' });
    }
});

// Get completion statistics
router.get('/completion-stats', isAuthenticated, async (req, res) => {
    try {
        // Get completion rate
        const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM user_course_progress');
        const totalEnrollments = totalRows[0].total;
        
        const [completedRows] = await pool.query('SELECT COUNT(*) as total FROM user_course_progress WHERE status = ?', ['completed']);
        const completedEnrollments = completedRows[0].total;
        
        const completionRate = totalEnrollments > 0 
            ? Math.round((completedEnrollments / totalEnrollments) * 100) 
            : 0;
        
        // Get average quiz score
        const [scoreRows] = await pool.query('SELECT AVG(score) as average FROM quiz_attempts');
        const averageScore = scoreRows[0].average && !isNaN(scoreRows[0].average) 
            ? parseFloat(scoreRows[0].average).toFixed(1) 
            : 'N/A';
        
        res.json({
            completionRate,
            averageScore
        });
    } catch (error) {
        console.error('Error fetching completion stats:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas de finalización' });
    }
});

// Get course completion data for chart
router.get('/course-completion', isAuthenticated, async (req, res) => {
    try {
        // Get counts for each status
        const [completedRows] = await pool.query('SELECT COUNT(*) as total FROM user_course_progress WHERE status = ?', ['completed']);
        const completed = completedRows[0].total;
        
        const [inProgressRows] = await pool.query('SELECT COUNT(*) as total FROM user_course_progress WHERE status = ?', ['in_progress']);
        const inProgress = inProgressRows[0].total;
        
        const [notStartedRows] = await pool.query('SELECT COUNT(*) as total FROM user_course_progress WHERE status = ?', ['not_started']);
        const notStarted = notStartedRows[0].total;
        
        res.json({
            completed,
            inProgress,
            notStarted
        });
    } catch (error) {
        console.error('Error fetching course completion data:', error);
        res.status(500).json({ error: 'Error al cargar datos de finalización de cursos' });
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
            LIMIT 5
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
