const { pool } = require('../config/database');

// Get technician statistics 
exports.getStats = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Obtener el número de cursos asignados al técnico
        const [coursesAssigned] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM user_course_progress 
            WHERE user_id = ?
        `, [userId]);

        // Obtener el número de cursos completados
        const [coursesCompleted] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM user_course_progress 
            WHERE user_id = ? AND status = 'completed'
        `, [userId]);

        // Obtener el número de certificaciones (badges obtenidos)
        const [certifications] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM user_badges 
            WHERE user_id = ?
        `, [userId]);

        // Obtener conteo de notificaciones no leídas
        const [notifications] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM forum_answers fa
            JOIN forum_questions fq ON fa.question_id = fq.question_id
            WHERE fq.user_id = ? AND fa.created_at > COALESCE(
                (SELECT MAX(last_login) FROM users WHERE user_id = ?), 
                '2000-01-01'
            )
        `, [userId, userId]);

        // Calcular las tendencias (en un caso real se compararía con meses anteriores)
        // Por ahora usamos valores fijos basados en datos reales
        const coursesTrend = coursesAssigned[0].count > 3 ? '15%' : '5%';
        const completedTrend = coursesCompleted[0].count > 1 ? '10%' : '0%';
        const certificationTrend = certifications[0].count > 0 ? '5%' : '0%';

        res.json({
            success: true,
            coursesAssigned: coursesAssigned[0].count,
            coursesCompleted: coursesCompleted[0].count,
            certifications: certifications[0].count,
            coursesTrend: coursesTrend,
            completedTrend: completedTrend,
            certificationTrend: certificationTrend,
            notifications: notifications[0].count
        });
    } catch (error) {
        console.error('Error fetching technician stats:', error);
        res.status(500).json({ success: false, error: 'Error al cargar estadísticas' });
    }
};

// Get progress chart data
exports.getProgressChart = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Obtener actividad de contenido completado del usuario en los últimos 7 días
        const [contentActivity] = await pool.query(`
            SELECT 
                DATE_FORMAT(completed_at, '%a') as day,
                COUNT(*) as count
            FROM user_content_progress
            WHERE 
                user_id = ? AND 
                completed = 1 AND 
                completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(completed_at, '%a')
            ORDER BY completed_at
        `, [userId]);

        // Obtener actividad de tiempo de estudio (aproximado por intentos de quiz)
        // Nota: en un sistema real, registraríamos el tiempo real
        const [studyActivity] = await pool.query(`
            SELECT 
                DATE_FORMAT(completed_at, '%a') as day,
                COUNT(*) * 0.5 as hours
            FROM quiz_attempts
            WHERE 
                user_id = ? AND 
                completed_at IS NOT NULL AND 
                completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(completed_at, '%a')
            ORDER BY completed_at
        `, [userId]);

        // Crear mapas para facilitar el acceso a los datos
        const contentByDay = new Map();
        const studyByDay = new Map();

        contentActivity.forEach(item => {
            contentByDay.set(item.day, item.count);
        });

        studyActivity.forEach(item => {
            studyByDay.set(item.day, item.hours);
        });

        // Obtener los días de la semana en español
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        // Preparar datos para el gráfico
        const lessonsData = days.map(day => contentByDay.get(day) || 0);
        const studyData = days.map(day => studyByDay.get(day) || 0);

        res.json({
            success: true,
            labels: days,
            datasets: [
                {
                    label: 'Lecciones Completadas',
                    data: lessonsData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Tiempo de Estudio (horas)',
                    data: studyData,
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    tension: 0.4
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching progress chart data:', error);
        res.status(500).json({ success: false, error: 'Error al cargar datos del gráfico' });
    }
};

// Get recent activity
exports.getRecentActivity = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Obtener contenido completado recientemente
        const [contentActivity] = await pool.query(`
            SELECT 
                ucp.completed_at as date,
                c.title as content_title,
                m.title as module_title,
                co.title as course_title
            FROM 
                user_content_progress ucp
            JOIN 
                contents c ON ucp.content_id = c.content_id
            JOIN 
                modules m ON c.module_id = m.module_id
            JOIN 
                courses co ON m.course_id = co.course_id
            WHERE 
                ucp.user_id = ? 
                AND ucp.completed = 1
            ORDER BY 
                ucp.completed_at DESC
            LIMIT 2
        `, [userId]);

        // Obtener intentos de quiz recientes
        const [quizActivity] = await pool.query(`
            SELECT 
                qa.completed_at as date,
                q.title as quiz_title,
                qa.score,
                qa.passed,
                m.title as module_title,
                c.title as course_title
            FROM 
                quiz_attempts qa
            JOIN 
                quizzes q ON qa.quiz_id = q.quiz_id
            JOIN 
                modules m ON q.module_id = m.module_id
            JOIN 
                courses c ON m.course_id = c.course_id
            WHERE 
                qa.user_id = ? 
                AND qa.completed_at IS NOT NULL
            ORDER BY 
                qa.completed_at DESC
            LIMIT 2
        `, [userId]);

        // Obtener respuestas recientes de foro
        const [forumActivity] = await pool.query(`
            SELECT 
                fa.created_at as date,
                fq.title as question_title
            FROM 
                forum_answers fa
            JOIN 
                forum_questions fq ON fa.question_id = fq.question_id
            WHERE 
                fa.user_id = ?
            ORDER BY 
                fa.created_at DESC
            LIMIT 1
        `, [userId]);

        // Crear la lista de actividades combinada
        const activities = [];

        // Procesar actividad de contenido
        contentActivity.forEach(item => {
            activities.push({
                description: `Completaste la lección "${item.content_title}" en "${item.module_title}"`,
                timeAgo: formatTimeAgo(item.date),
                date: item.date
            });
        });

        // Procesar actividad de cuestionarios
        quizActivity.forEach(item => {
            const resultText = item.passed ? 'aprobado' : 'no aprobado';
            activities.push({
                description: `Obtuviste una calificación de ${item.score}% (${resultText}) en "${item.quiz_title}"`,
                timeAgo: formatTimeAgo(item.date),
                date: item.date
            });
        });

        // Procesar actividad de foro
        forumActivity.forEach(item => {
            activities.push({
                description: `Respondiste a la pregunta "${item.question_title}" en el foro`,
                timeAgo: formatTimeAgo(item.date),
                date: item.date
            });
        });

        // Ordenar por fecha más reciente
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            activities: activities.slice(0, 4) // Limitar a 4 actividades
        });
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ success: false, error: 'Error al cargar actividad reciente' });
    }
};

// Get upcoming courses
exports.getUpcomingCourses = async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user?.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Obtener cursos no iniciados o con poco progreso
        const [upcomingCourses] = await pool.query(`
            SELECT 
                c.course_id as id,
                c.title,
                c.description,
                c.thumbnail,
                COALESCE(ucp.status, 'not_started') as status,
                COALESCE(ucp.progress_percentage, 0) as progress,
                ucp.started_at as startDate
            FROM 
                courses c
            LEFT JOIN 
                user_course_progress ucp ON c.course_id = ucp.course_id AND ucp.user_id = ?
            WHERE 
                c.status = 'published' 
                AND (ucp.status = 'not_started' OR ucp.status IS NULL OR 
                    (ucp.status = 'in_progress' AND ucp.progress_percentage < 20))
            ORDER BY 
                FIELD(COALESCE(ucp.status, 'not_started'), 'in_progress', 'not_started'),
                c.created_at DESC
            LIMIT 3
        `, [userId]);

        res.json({
            success: true,
            courses: upcomingCourses
        });
    } catch (error) {
        console.error('Error fetching upcoming courses:', error);
        res.status(500).json({ success: false, error: 'Error al cargar próximos cursos' });
    }
};

// Get technician courses - Mejorado para asegurar datos completos
exports.getCourses = async (req, res) => {
    try {
        // Obtener el ID del técnico desde la sesión
        const userId = req.session.user?.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Traer sólo los cursos publicados que tenga registro en user_course_progress para este userId
        const [courses] = await pool.query(`
            SELECT 
                c.course_id                AS id,
                c.title,
                c.description,
                c.thumbnail,
                c.category_id,
                cc.name                    AS category_name,
                ucp.status,
                ucp.progress_percentage    AS progress,
                ucp.started_at,
                ucp.completed_at
            FROM courses c
            INNER JOIN user_course_progress ucp
                ON c.course_id = ucp.course_id
                AND ucp.user_id = ?
            LEFT JOIN course_categories cc
                ON c.category_id = cc.category_id
            WHERE c.status = 'published'
            ORDER BY 
                FIELD(ucp.status, 'in_progress','not_started','completed'),
                c.updated_at DESC
        `, [userId]);

        // Para cada curso completado, calcular la calificación promedio de los quizzes
        for (let course of courses) {
            if (course.status === 'completed') {
                const [quizScores] = await pool.query(`
                    SELECT 
                        AVG(qa.score) AS avg_score
                    FROM quiz_attempts qa
                    JOIN quizzes q   ON qa.quiz_id = q.quiz_id
                    JOIN modules m   ON q.module_id = m.module_id
                    WHERE 
                        m.course_id = ? 
                        AND qa.user_id = ?
                        AND qa.passed = 1
                `, [course.id, userId]);

                course.score = quizScores[0].avg_score
                    ? Math.round(quizScores[0].avg_score)
                    : 90;
            }
        }

        console.log('Enviando datos de cursos al cliente:', courses.length);
        res.json({ success: true, courses });

    } catch (error) {
        console.error('Error fetching technician courses:', error);
        res.status(500).json({ success: false, error: 'Error al cargar cursos' });
    }
};

// Obtener detalles específicos de un curso incluido su contenido
exports.getCourseDetails = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;
        const courseId = req.params.id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        if (!courseId) {
            return res.status(400).json({ success: false, error: 'ID de curso no proporcionado' });
        }

        // Obtener detalles del curso
        const [courses] = await pool.query(`
            SELECT 
                c.course_id as id,
                c.title,
                c.description,
                c.thumbnail,
                c.category_id,
                cc.name as category_name,
                COALESCE(ucp.status, 'not_started') as status,
                COALESCE(ucp.progress_percentage, 0) as progress_percentage,
                ucp.started_at,
                ucp.completed_at
            FROM 
                courses c
            LEFT JOIN 
                course_categories cc ON c.category_id = cc.category_id
            LEFT JOIN 
                user_course_progress ucp ON c.course_id = ucp.course_id AND ucp.user_id = ?
            WHERE 
                c.course_id = ? AND c.status = 'published'
        `, [userId, courseId]);

        if (courses.length === 0) {
            return res.status(404).json({ success: false, error: 'Curso no encontrado' });
        }

        // Si el curso existe y el usuario no lo ha iniciado aún, crear un registro de progreso
        if (courses[0].status === 'not_started') {
            try {
                await pool.query(`
                    INSERT INTO user_course_progress 
                    (user_id, course_id, status, progress_percentage, started_at) 
                    VALUES (?, ?, 'in_progress', 0, NOW())
                    ON DUPLICATE KEY UPDATE 
                    status = 'in_progress', 
                    started_at = COALESCE(started_at, NOW())
                `, [userId, courseId]);

                // Actualizar el estado en la respuesta
                courses[0].status = 'in_progress';
                courses[0].started_at = new Date();
            } catch (err) {
                console.error('Error al crear progreso de curso:', err);
                // Continuamos aunque falle esta parte
            }
        }

        // La respuesta final
        res.json({
            success: true,
            course: courses[0]
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ success: false, error: 'Error al cargar los detalles del curso' });
    }
};

// Obtener módulos de un curso específico con su contenido
exports.getCourseModules = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;
        const courseId = req.params.id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        if (!courseId) {
            return res.status(400).json({ success: false, error: 'ID de curso no proporcionado' });
        }

        // Obtener módulos del curso
        const [modules] = await pool.query(`
            SELECT 
                m.module_id,
                m.title,
                m.description,
                m.position
            FROM 
                modules m
            WHERE 
                m.course_id = ?
            ORDER BY 
                m.position
        `, [courseId]);

        // Para cada módulo, obtener su contenido y calcular progreso
        const formattedModules = [];

        for (const module of modules) {
            // Obtener contenido del módulo
            const [contents] = await pool.query(`
                SELECT 
                    c.content_id,
                    c.title,
                    c.content_type_id,
                    c.position,
                    COALESCE(ucp.completed, 0) as completed
                FROM 
                    contents c
                LEFT JOIN
                    user_content_progress ucp ON c.content_id = ucp.content_id AND ucp.user_id = ?
                WHERE 
                    c.module_id = ?
                ORDER BY 
                    c.position
            `, [userId, module.module_id]);

            // Obtener cuestionarios del módulo
            const [quizzes] = await pool.query(`
                SELECT 
                    q.quiz_id,
                    q.title,
                    q.description,
                    q.passing_score,
                    CASE 
                        WHEN qa.passed = 1 THEN 'completed'
                        WHEN qa.attempt_id IS NOT NULL THEN 'attempted'
                        ELSE 'not_started'
                    END as status
                FROM 
                    quizzes q
                LEFT JOIN (
                    SELECT 
                        quiz_id, 
                        MAX(attempt_id) as attempt_id,
                        MAX(passed) as passed
                    FROM 
                        quiz_attempts
                    WHERE 
                        user_id = ?
                    GROUP BY 
                        quiz_id
                ) qa ON q.quiz_id = qa.quiz_id
                WHERE 
                    q.module_id = ?
                ORDER BY 
                    q.position
            `, [userId, module.module_id]);

            // Calcular progreso del módulo
            let completedContents = contents.filter(c => c.completed).length;
            let completedQuizzes = quizzes.filter(q => q.status === 'completed').length;
            let totalItems = contents.length + quizzes.length;
            let progress = totalItems > 0 ?
                Math.round(((completedContents + completedQuizzes) / totalItems) * 100) : 0;

            // Determinar el estado del módulo
            let status = 'not_started';
            if (progress === 100) {
                status = 'completed';
            } else if (progress > 0) {
                status = 'in_progress';
            }

            formattedModules.push({
                module_id: module.module_id,
                title: module.title,
                description: module.description,
                position: module.position,
                status: status,
                progress: progress,
                contents: contents,
                quizzes: quizzes
            });
        }

        res.json({
            success: true,
            modules: formattedModules
        });
    } catch (error) {
        console.error('Error fetching course modules:', error);
        res.status(500).json({ success: false, error: 'Error al cargar los módulos del curso' });
    }
};

// Marcar contenido como completado
exports.markContentCompleted = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;
        const contentId = req.params.contentId;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        if (!contentId) {
            return res.status(400).json({ success: false, error: 'ID de contenido no proporcionado' });
        }

        // Marcar el contenido como completado
        await pool.query(`
            INSERT INTO user_content_progress 
            (user_id, content_id, completed, completed_at) 
            VALUES (?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE 
            completed = 1, 
            completed_at = NOW()
        `, [userId, contentId]);

        // Actualizar el progreso general del curso
        // Primero obtenemos el curso asociado a este contenido
        const [courseResult] = await pool.query(`
            SELECT 
                m.course_id
            FROM 
                contents c
            JOIN 
                modules m ON c.module_id = m.module_id
            WHERE 
                c.content_id = ?
        `, [contentId]);

        if (courseResult.length > 0) {
            const courseId = courseResult[0].course_id;

            // Calcular nuevo progreso
            await updateCourseProgress(userId, courseId);
        }

        res.json({
            success: true,
            message: 'Contenido marcado como completado'
        });
    } catch (error) {
        console.error('Error marking content as completed:', error);
        res.status(500).json({ success: false, error: 'Error al marcar el contenido como completado' });
    }
};

// Función auxiliar para actualizar el progreso de un curso
async function updateCourseProgress(userId, courseId) {
    try {
        // Obtener total de contenidos y cuestionarios del curso
        const [totalItems] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM contents c 
                 JOIN modules m ON c.module_id = m.module_id 
                 WHERE m.course_id = ?) 
                + 
                (SELECT COUNT(*) FROM quizzes q 
                 JOIN modules m ON q.module_id = m.module_id 
                 WHERE m.course_id = ?) as total
        `, [courseId, courseId]);

        // Obtener contenidos completados
        const [completedContents] = await pool.query(`
            SELECT 
                COUNT(*) as completed
            FROM 
                user_content_progress ucp
            JOIN 
                contents c ON ucp.content_id = c.content_id
            JOIN 
                modules m ON c.module_id = m.module_id
            WHERE 
                ucp.user_id = ? 
                AND m.course_id = ? 
                AND ucp.completed = 1
        `, [userId, courseId]);

        // Obtener cuestionarios completados
        const [completedQuizzes] = await pool.query(`
            SELECT 
                COUNT(*) as completed
            FROM 
                quiz_attempts qa
            JOIN 
                quizzes q ON qa.quiz_id = q.quiz_id
            JOIN 
                modules m ON q.module_id = m.module_id
            WHERE 
                qa.user_id = ? 
                AND m.course_id = ? 
                AND qa.passed = 1
        `, [userId, courseId]);

        // Calcular progreso porcentual
        const totalCount = totalItems[0].total;
        const completedCount = completedContents[0].completed + completedQuizzes[0].completed;
        const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        // Determinar estado
        let newStatus = 'in_progress';
        if (progressPercent >= 100) {
            newStatus = 'completed';
        } else if (progressPercent <= 0) {
            newStatus = 'not_started';
        }

        // Actualizar el progreso
        await pool.query(`
            INSERT INTO user_course_progress 
            (user_id, course_id, status, progress_percentage, 
             started_at, completed_at)
            VALUES 
            (?, ?, ?, ?, NOW(), ${newStatus === 'completed' ? 'NOW()' : 'NULL'})
            ON DUPLICATE KEY UPDATE 
            status = ?,
            progress_percentage = ?,
            completed_at = ${newStatus === 'completed' ? 'NOW()' : 'completed_at'}
        `, [userId, courseId, newStatus, progressPercent, newStatus, progressPercent]);

        return true;
    } catch (error) {
        console.error('Error updating course progress:', error);
        return false;
    }
}

exports.getCertificates = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;
        if (!userId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });

        const [rows] = await pool.query(`
        SELECT 
          ucp.course_id       AS id,
          c.title             AS courseTitle,
          ucp.completed_at    AS issuedAt
        FROM user_course_progress ucp
        JOIN courses c ON ucp.course_id = c.course_id
        WHERE ucp.user_id = ? AND ucp.status = 'completed'
        ORDER BY ucp.completed_at DESC
      `, [userId]);

        const certificates = rows.map(cert => ({
            id: cert.id,
            title: cert.courseTitle,
            date: new Date(cert.issuedAt).toLocaleDateString('es-MX', {
                day: 'numeric', month: 'long', year: 'numeric'
            }),
            // Aquí defines cómo obtener el PDF
            url: `/api/technician/certificates/${cert.id}/download`
        }));

        res.json({ success: true, certificates });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ success: false, error: 'Error al cargar certificados' });
    }
};

exports.downloadCertificate = async (req, res) => {
    const userId = req.session.user?.user_id;
    const courseId = req.params.courseId;

    // Verifico que el técnico completó ese curso
    const [[prog]] = await pool.query(
        `SELECT status FROM user_course_progress
       WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
    );
    if (!prog || prog.status !== 'completed') {
        return res.status(403).send('No tienes permiso para este certificado');
    }

    // Aquí sirves o generas el PDF.
    const filePath = `/path/to/certs/${userId}_${courseId}.pdf`;
    return res.download(filePath, `certificado_${courseId}.pdf`);
};