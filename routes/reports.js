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

// Get summary statistics for the dashboard cards
router.get('/summary', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = [];
        let dateFilterProgress = '';
        let dateFilterAttempts = '';
        let dateFilterCompletionTime = '';

        // Build date filters if dates are provided
        if (start_date && end_date) {
            params.push(start_date, end_date); // For completion rate (based on completion date)
            params.push(start_date, end_date); // For average score (based on attempt completion date)
            params.push(start_date, end_date); // For certifications (based on completion date)
            params.push(start_date, end_date); // For average time (based on completion date)

            dateFilterProgress = ' AND completed_at BETWEEN ? AND ?';
            dateFilterAttempts = ' AND completed_at BETWEEN ? AND ?';
            dateFilterCompletionTime = ' AND completed_at BETWEEN ? AND ?';
        } else {
             // If no dates, maybe default to all time or a specific recent period?
             // For simplicity now, let's calculate all-time if no dates provided.
             // Need to adjust params array accordingly if we remove date filters.
             // Let's keep the date filter structure but maybe pass very old/future dates if needed,
             // or adjust the queries to ignore the WHERE clause if params are empty.
             // Easiest for now: If no dates, don't filter by date.
             // We need 4 sets of params if dates are provided, 0 otherwise.
             if (params.length > 0) {
                 // This case should not happen if start/end date are null, but safety check
             } else {
                 dateFilterProgress = ''; // No date filter
                 dateFilterAttempts = ''; // No date filter
                 dateFilterCompletionTime = ''; // No date filter
             }
        }


        // 1. Completion Rate
        const completionQuery = `
            SELECT 
                COUNT(CASE WHEN status = 'completed' ${dateFilterProgress} THEN 1 END) as completed_count,
                COUNT(user_id) as total_enrollments
            FROM user_course_progress
            WHERE status IN ('in_progress', 'completed') 
              ${ dateFilterProgress ? 'AND started_at IS NOT NULL' : '' /* Only consider started courses for rate */}
        `;
        // Adjust params for completion query based on whether date filter is active
        const completionParams = (start_date && end_date) ? [start_date, end_date] : [];
        const [[completionStats]] = await pool.query(completionQuery, completionParams);
        const completionRate = (completionStats.total_enrollments > 0) 
            ? (completionStats.completed_count / completionStats.total_enrollments) * 100 
            : 0;

        // 2. Average Time (in hours for completed courses within the period)
        const avgTimeQuery = `
            SELECT AVG(TIMESTAMPDIFF(SECOND, started_at, completed_at)) as avg_duration_seconds
            FROM user_course_progress 
            WHERE status = 'completed' 
              AND started_at IS NOT NULL 
              AND completed_at IS NOT NULL
              ${dateFilterCompletionTime} 
        `;
         const avgTimeParams = (start_date && end_date) ? [start_date, end_date] : [];
        const [[avgTimeStats]] = await pool.query(avgTimeQuery, avgTimeParams);
        const averageTimeHours = avgTimeStats.avg_duration_seconds ? (avgTimeStats.avg_duration_seconds / 3600) : 0;


        // 3. Average Score (from quiz attempts, scaled to /5)
        const avgScoreQuery = `
            SELECT AVG(score) as average_score 
            FROM quiz_attempts 
            WHERE completed_at IS NOT NULL 
              ${dateFilterAttempts}
        `;
        const avgScoreParams = (start_date && end_date) ? [start_date, end_date] : [];
        const [[avgScoreStats]] = await pool.query(avgScoreQuery, avgScoreParams);
        // Assuming score is out of 100, scale to 5
        const averageScoreOutOf5 = avgScoreStats.average_score ? (avgScoreStats.average_score / 100) * 5 : 0;

        // 4. Certifications (Count of completed courses)
        // Re-use completion query logic but just need the count
         const certificationsQuery = `
            SELECT COUNT(progress_id) as certifications_count
            FROM user_course_progress 
            WHERE status = 'completed'
              ${dateFilterProgress} 
        `;
        // Re-use completionParams
        const [[certStats]] = await pool.query(certificationsQuery, completionParams);
        const certificationsCount = certStats.certifications_count || 0;


        res.json({
            completionRate: completionRate.toFixed(1), // e.g., 78.0
            averageTime: averageTimeHours.toFixed(1), // e.g., 4.2
            averageScore: averageScoreOutOf5.toFixed(1), // e.g., 4.7
            certifications: certificationsCount // e.g., 42
        });

    } catch (error) {
        console.error('Error fetching summary statistics:', error);
        res.status(500).json({ error: 'Error al obtener las estadísticas resumidas' });
    }
});

// --- New Chart Routes ---

// Get Abandonment Rate
router.get('/abandonment-rate', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = [];
        let dateFilter = '';

        if (start_date && end_date) {
            dateFilter = ' AND started_at >= ? AND started_at <= ?';
            params.push(start_date, end_date);
        } else {
             // If no dates, calculate for all time (no date filter)
             dateFilter = '';
        }

        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 0) AS rate
            FROM user_course_progress
            WHERE started_at IS NOT NULL 
              ${dateFilter}; 
        `;

        const [[result]] = await pool.query(query, params);
        res.json({ rate: parseFloat(result.rate).toFixed(1) }); // Return rate rounded to 1 decimal

    } catch (error) {
        console.error('Error fetching abandonment rate:', error);
        res.status(500).json({ error: 'Error al obtener la tasa de abandono' });
    }
});

// Get Quiz Error Rate
router.get('/quiz-error-rate', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = [];
        let dateFilter = '';

        if (start_date && end_date) {
            dateFilter = ' AND qa.completed_at >= ? AND qa.completed_at <= ?';
            params.push(start_date, end_date);
        } else {
            dateFilter = '';
        }

        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN uqa.is_correct = FALSE THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(uqa.answer_id), 0), 0) AS rate
            FROM user_quiz_answers uqa
            JOIN quiz_attempts qa ON uqa.attempt_id = qa.attempt_id
            WHERE qa.completed_at IS NOT NULL
              ${dateFilter};
        `;

        const [[result]] = await pool.query(query, params);
        res.json({ rate: parseFloat(result.rate).toFixed(1) });

    } catch (error) {
        console.error('Error fetching quiz error rate:', error);
        res.status(500).json({ error: 'Error al obtener la tasa de error de quizzes' });
    }
});

// Get Quiz Success Rate
router.get('/quiz-success-rate', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = [];
        let dateFilter = '';

        if (start_date && end_date) {
            dateFilter = ' AND qa.completed_at >= ? AND qa.completed_at <= ?';
            params.push(start_date, end_date);
        } else {
            dateFilter = '';
        }

        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN uqa.is_correct = TRUE THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(uqa.answer_id), 0), 0) AS rate
            FROM user_quiz_answers uqa
            JOIN quiz_attempts qa ON uqa.attempt_id = qa.attempt_id
            WHERE qa.completed_at IS NOT NULL
              ${dateFilter};
        `;

        const [[result]] = await pool.query(query, params);
        res.json({ rate: parseFloat(result.rate).toFixed(1) });

    } catch (error) {
        console.error('Error fetching quiz success rate:', error);
        res.status(500).json({ error: 'Error al obtener la tasa de éxito de quizzes' });
    }
});

// Get Technician Activity Report
router.get('/technician-activity', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = [];
        let dateFilter = '';

        // Apply date filter to the activity timestamp (e.g., course completion)
        if (start_date && end_date) {
            // We need to filter based on when the activity occurred.
            // Let's filter based on course completions within the period.
            // Note: This might exclude technicians active in other ways (logins, quiz attempts)
            // if they didn't complete a course in the period. A more complex query
            // could check multiple activity types.
            dateFilter = ' AND ucp.completed_at BETWEEN ? AND ?';
            params.push(start_date, end_date);
            // Add params again for the MAX(completed_at) subquery if filtering last activity by date
            params.push(start_date, end_date);
        } else {
             dateFilter = ''; // No date filter for activity period
             // No date filter for MAX(completed_at) either
        }


        // Query to get technician activity details
        // - Courses Completed: Count distinct completed courses
        // - Certifications: Same as courses completed for this definition
        // - Last Activity: Max completion date within the period (or overall if no period)
        const query = `
            SELECT
                u.user_id,
                CONCAT(u.first_name, ' ', u.last_name) AS technician_name,
                COUNT(DISTINCT CASE WHEN ucp.status = 'completed' ${dateFilter} THEN ucp.course_id END) AS courses_completed,
                COUNT(DISTINCT CASE WHEN ucp.status = 'completed' ${dateFilter} THEN ucp.course_id END) AS certifications,
                MAX(CASE WHEN ucp.status = 'completed' ${dateFilter} THEN ucp.completed_at END) AS last_activity_timestamp
                -- Consider adding total time if calculable (e.g., sum of estimated course durations)
            FROM users u
            LEFT JOIN user_course_progress ucp ON u.user_id = ucp.user_id
            WHERE u.role = 'technician'
            GROUP BY u.user_id, technician_name
            HAVING COUNT(DISTINCT CASE WHEN ucp.status = 'completed' ${dateFilter} THEN ucp.course_id END) > 0 -- Only show techs with activity in period
                OR MAX(CASE WHEN ucp.status = 'completed' ${dateFilter} THEN ucp.completed_at END) IS NOT NULL -- Or if last activity falls in period
            ORDER BY courses_completed DESC, last_activity_timestamp DESC;
        `;

        // Adjust params based on how many times the date filter is used
        const queryParams = (start_date && end_date) ? [start_date, end_date, start_date, end_date, start_date, end_date] : [];


        const [rows] = await pool.query(query, queryParams);
        res.json(rows);

    } catch (error) {
        console.error('Error fetching technician activity report:', error);
        res.status(500).json({ error: 'Error al obtener el reporte de actividad de técnicos' });
    }
});


module.exports = router;
