const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

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
                timeAgo: formatTimeAgo(item.date), // Assumes formatTimeAgo is available (e.g., from utils)
                date: item.date
            });
        });

        // Procesar actividad de cuestionarios
        quizActivity.forEach(item => {
            const resultText = item.passed ? 'aprobado' : 'no aprobado';
            activities.push({
                description: `Obtuviste una calificación de ${item.score}% (${resultText}) en "${item.quiz_title}"`,
                timeAgo: formatTimeAgo(item.date), // Assumes formatTimeAgo is available
                date: item.date
            });
        });

        // Procesar actividad de foro
        forumActivity.forEach(item => {
            activities.push({
                description: `Respondiste a la pregunta "${item.question_title}" en el foro`,
                timeAgo: formatTimeAgo(item.date), // Assumes formatTimeAgo is available
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
        const userId = req.session.user?.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Traer sólo los cursos en estado "in_progress"
        const [upcomingCourses] = await pool.query(
            `SELECT
           c.course_id   AS id,
           c.title,
           c.description,
           COALESCE(ucp.status, 'not_started') AS status,
           COALESCE(ucp.progress_percentage, 0) AS progress,
           ucp.started_at AS startDate
         FROM courses c
         JOIN user_course_progress ucp
           ON c.course_id = ucp.course_id
          AND ucp.user_id   = ?
         WHERE c.status = 'published'
           AND ucp.status = 'in_progress'
         ORDER BY ucp.started_at DESC
         LIMIT 3`,
            [userId]
        );

        return res.json({ success: true, courses: upcomingCourses });
    } catch (error) {
        console.error('Error fetching upcoming courses:', error);
        return res.status(500).json({ success: false, error: 'Error al cargar próximos cursos' });
    }
};

// Get technician courses 
exports.getCourses = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        const [rows] = await pool.query(
            `SELECT
           c.course_id             AS id,
           c.title,
           c.description,
           c.thumbnail,
           c.category_id,
           cc.name                 AS category_name,
           ucp.status,
           ucp.progress_percentage AS progress,
           ucp.started_at,
           ucp.completed_at
         FROM courses c
         INNER JOIN user_course_progress ucp
           ON c.course_id = ucp.course_id
           AND ucp.user_id   = ?
         LEFT JOIN course_categories cc
           ON c.category_id = cc.category_id
         WHERE c.status = 'published'
         ORDER BY
           FIELD(ucp.status, 'in_progress','not_started','completed'),
           c.updated_at DESC`,
            [userId]
        );

        // Primero mapeamos thumbnail_url
        const courses = rows.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            status: c.status,
            progress: c.progress,
            started_at: c.started_at,
            completed_at: c.completed_at,
            category_name: c.category_name,
            thumbnail_url: c.thumbnail
                ? `/uploads/courses/${c.thumbnail}`
                : null,
            // inicializamos score en 0 para todos
            score: 0
        }));

        // Ahora volvemos a insertar la lógica de cálculo de nota media:
        for (let course of courses) {
            if (course.status === 'completed') {
                const [[quizScore]] = await pool.query(
                    `SELECT
               AVG(qa.score) AS avg_score
             FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.quiz_id
             JOIN modules m ON q.module_id = m.module_id
             WHERE m.course_id = ?
               AND qa.user_id = ?
               AND qa.passed = 1`,
                    [course.id, userId]
                );
                course.score = quizScore.avg_score
                    ? Math.round(quizScore.avg_score)
                    : 90; // puntuación por defecto si no hay quizzes
            }
        }

        console.log('Enviando datos de cursos al cliente:', courses.length);
        return res.json({ success: true, courses });

    } catch (error) {
        console.error('Error fetching technician courses:', error);
        return res.status(500).json({ success: false, error: 'Error al cargar cursos' });
    }
};

// Obtener detalles específicos de un curso incluido su contenido
exports.getCourseDetails = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;
        const courseId = req.params.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        if (!courseId) return res.status(400).json({ success: false, error: 'ID de curso no proporcionado' });

        const [rows] = await pool.query(
            `SELECT
           c.course_id              AS id,
           c.title,
           c.description,
           c.thumbnail,
           c.category_id,
           cc.name                  AS category_name,
           COALESCE(ucp.status, 'not_started')           AS status,
           COALESCE(ucp.progress_percentage, 0)          AS progress_percentage,
           ucp.started_at,
           ucp.completed_at
         FROM courses c
         LEFT JOIN course_categories cc
           ON c.category_id = cc.category_id
         LEFT JOIN user_course_progress ucp
           ON c.course_id = ucp.course_id AND ucp.user_id = ?
         WHERE c.course_id = ? AND c.status = 'published'`,
            [userId, courseId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Curso no encontrado' });
        }

        // Prepara el objeto de respuesta con URL absoluta de thumbnail
        const curso = rows[0];
        const course = {
            id: curso.id,
            title: curso.title,
            description: curso.description,
            status: curso.status,
            progress_percentage: curso.progress_percentage,
            started_at: curso.started_at,
            completed_at: curso.completed_at,
            category_name: curso.category_name,
            thumbnail_url: curso.thumbnail
                ? `/uploads/courses/${curso.thumbnail}`
                : null
        };

        // Si es 'not_started', inicializa el record
        if (course.status === 'not_started') {
            await pool.query(
                `INSERT INTO user_course_progress
             (user_id, course_id, status, progress_percentage, started_at)
           VALUES (?, ?, 'in_progress', 0, NOW())
           ON DUPLICATE KEY UPDATE
             status = 'in_progress',
             started_at = COALESCE(started_at, NOW())`,
                [userId, courseId]
            );
            course.status = 'in_progress';
            course.started_at = new Date();
        }

        res.json({ success: true, course });

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
        if (!userId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        if (!courseId) return res.status(400).json({ success: false, error: 'ID de curso no proporcionado' });

        // 1) Traer módulos básicos
        const [modules] = await pool.query(
            `SELECT module_id, title, description, position
           FROM modules
          WHERE course_id = ?
          ORDER BY position`,
            [courseId]
        );

        // 2) Para cada módulo, contenidos + quizzes + formateo de rutas
        const detailed = await Promise.all(modules.map(async m => {
            // a) contenidos
            const [rawContents] = await pool.query(
                `SELECT
             c.content_id,
             c.title,
             c.content_type_id,
             c.content_data,
             COALESCE(ucp.completed, 0) AS completed
           FROM contents c
           LEFT JOIN user_content_progress ucp
             ON c.content_id = ucp.content_id
             AND ucp.user_id   = ?
           WHERE c.module_id = ?
           ORDER BY c.position`,
                [userId, m.module_id]
            );

            // formatea cada content_data → URL absoluta
            const contents = rawContents.map(item => {
                let data = item.content_data || '';
                if (!data.startsWith('/uploads') && !data.startsWith('http')) {
                    if (item.content_type_id === 4) data = `/uploads/content/images/${data}`;
                    else if (item.content_type_id === 3) data = `/uploads/content/pdfs/${data}`;
                    else if (item.content_type_id === 1) data = `/uploads/content/videos/${data}`;
                }
                return { ...item, content_data: data };
            });

            // b) quizzes
            const [quizzes] = await pool.query(
                `SELECT
                q.quiz_id,
                q.title,
                COALESCE(qa.passed, 0) AS passed,
                COUNT(qa_attempt.attempt_id) AS attempts
              FROM quizzes q
              LEFT JOIN (
                SELECT quiz_id, passed
                FROM quiz_attempts
                WHERE user_id = ?
                ORDER BY completed_at DESC
                LIMIT 1
              ) qa ON qa.quiz_id = q.quiz_id
              LEFT JOIN quiz_attempts qa_attempt
                ON qa_attempt.quiz_id = q.quiz_id
                AND qa_attempt.user_id = ?
              WHERE q.module_id = ?
              GROUP BY q.quiz_id, q.title, qa.passed
              ORDER BY q.position`,
                [userId, userId, m.module_id]
            );

            // c) progreso
            const doneContents = contents.filter(c => c.completed === 1).length;
            const doneQuizzes = quizzes.filter(q => q.status !== 'not_started').length;
            const totalItems = contents.length + quizzes.length;
            const progress = totalItems > 0
                ? Math.round(((doneContents + doneQuizzes) / totalItems) * 100)
                : 0;
            let status = 'not_started';
            if (progress === 100) status = 'completed';
            else if (progress > 0) status = 'in_progress';

            return {
                module_id: m.module_id,
                title: m.title,
                description: m.description,
                position: m.position,
                status,
                progress,
                contents,
                quizzes
            };
        }));

        res.json({ success: true, modules: detailed });

    } catch (err) {
        console.error('Error fetching course modules:', err);
        res.status(500).json({ success: false, error: 'Error al cargar módulos' });
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
        // 1) Traer todos los módulos del curso
        const [modules] = await pool.query(
            'SELECT module_id FROM modules WHERE course_id = ?',
            [courseId]
        );

        // 2) Para cada módulo, calcular su progreso individual
        let sumProgress = 0;
        await Promise.all(modules.map(async m => {
            // Contar contenidos totales y completados en este módulo
            const [[{ totalContents }]] = await pool.query(
                `SELECT COUNT(*) AS totalContents
             FROM contents c
            WHERE c.module_id = ?`,
                [m.module_id]
            );
            const [[{ doneContents }]] = await pool.query(
                `SELECT COUNT(*) AS doneContents
             FROM user_content_progress ucp
             JOIN contents c ON ucp.content_id = c.content_id
            WHERE ucp.user_id = ? 
              AND c.module_id = ? 
              AND ucp.completed = 1`,
                [userId, m.module_id]
            );

            // Contar quizzes totales y aprobados en este módulo
            const [[{ totalQuizzes }]] = await pool.query(
                `SELECT COUNT(*) AS totalQuizzes
             FROM quizzes q
            WHERE q.module_id = ?`,
                [m.module_id]
            );
            const [[{ doneQuizzes }]] = await pool.query(
                `SELECT COUNT(*) AS doneQuizzes
             FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.quiz_id
            WHERE qa.user_id = ? 
              AND q.module_id = ? 
              AND qa.passed = 1`,
                [userId, m.module_id]
            );

            // Calcular progreso del módulo
            const totalItems = totalContents + totalQuizzes;
            const moduleProg = totalItems > 0
                ? Math.round(((doneContents + doneQuizzes) / totalItems) * 100)
                : 0;
            sumProgress += moduleProg;
        }));

        // 3) Calcular promedio de módulos (nunca >100)
        const avg = modules.length > 0
            ? Math.round(sumProgress / modules.length)
            : 0;
        const progress = Math.min(avg, 100);

        // Determinar estado basado en el porcentaje
        let status = 'not_started';
        if (progress === 100) status = 'completed';
        else if (progress > 0) status = 'in_progress';

        // Insertar o actualizar en user_course_progress
        await pool.query(
            `INSERT INTO user_course_progress
           (user_id, course_id, status, progress_percentage, started_at, completed_at)
         VALUES (?, ?, ?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
           status            = VALUES(status),
           progress_percentage = VALUES(progress_percentage),
           completed_at = CASE
             WHEN VALUES(status) = 'completed' AND completed_at IS NULL THEN NOW()
             ELSE completed_at
           END`,
            [
                userId,
                courseId,
                status,
                progress,
                status === 'completed' ? new Date() : null
            ]
        );

        return true;
    } catch (err) {
        console.error('Error updating course progress:', err);
        return false;
    }
}

exports.submitQuiz = async (req, res) => {
    try {
        const userId = req.session.user?.user_id;
        const { courseId, moduleId, quizId } = req.params;
        const answers = req.body.answers; // [{questionId, answerId}, ...]

        if (!userId) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, error: 'No se proporcionaron respuestas' });
        }

        // get passing score
        const [[{ passing_score }]] = await pool.query(
            'SELECT passing_score FROM quizzes WHERE quiz_id=?',
            [quizId]
        );

        // get correct answers for those questionIds
        const questionIds = answers.map(a => a.questionId);
        const [correctRows] = await pool.query(
            'SELECT answer_id FROM answers WHERE question_id IN (?) AND is_correct=1',
            [questionIds]
        );
        const correctSet = new Set(correctRows.map(r => r.answer_id));

        // score calculation
        const total = answers.length;
        const correctCount = answers.reduce((sum, a) => sum + (correctSet.has(a.answerId) ? 1 : 0), 0);
        const score = Math.round((correctCount / total) * 100);
        const passed = true;

        // insert quiz_attempt
        await pool.query(
            'INSERT INTO quiz_attempts (user_id, quiz_id, score, passed, completed_at) VALUES (?, ?, ?, ?, NOW())',
            [userId, quizId, score, passed ? 1 : 0]
        );

        // update course progress
        await updateCourseProgress(userId, courseId);

        res.json({ success: true, score, passed });
    } catch (err) {
        console.error('Error in submitQuiz:', err);
        res.status(500).json({ success: false, error: 'Error al procesar el quiz' });
    }
};

exports.getCertificates = async (req, res) => {
    const userId = req.session.user?.user_id;
    if (!userId) return res.status(401).json({ success: false });

    // Traemos los cursos completados
    const [rows] = await pool.query(`
      SELECT c.course_id AS id, c.title, ucp.completed_at AS date
      FROM user_course_progress ucp
      JOIN courses c ON ucp.course_id = c.course_id
      WHERE ucp.user_id = ? AND ucp.status = 'completed'
      ORDER BY ucp.completed_at DESC
    `, [userId]);

    const certificates = rows.map(r => ({
        title: r.title,
        date: new Date(r.date).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
        }),
        url: `/api/technician/certificates/${r.id}/download`
    }));

    res.json({ success: true, certificates });
};

exports.downloadCertificate = async (req, res) => {
    const userId = req.session.user?.user_id;
    const courseId = req.params.courseId;

    // Comprobamos que el curso esté completado
    const [[prog]] = await pool.query(
        `SELECT status, progress_percentage AS score 
         FROM user_course_progress 
         WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
    );
    if (!prog || prog.status !== 'completed') {
        return res.status(403).send('No tienes permiso para este certificado');
    }

    // Preparamos la respuesta como PDF descargable
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado_${courseId}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    /// -- Logo --
    const logoPath = path.resolve(
        __dirname,
        '..',
        'images',
        'whirlpool-logo.png'
    );
    console.log('Intentando abrir logo en:', logoPath);
    doc.image(logoPath, { width: 200, align: 'center' });
    doc.moveDown(2);


    // -- Título --
    doc
        .fontSize(26)
        .text('Certificado de Finalización', { align: 'center', underline: true });
    doc.moveDown(1.5);

    // -- Cuerpo --
    const userName = req.session.user.username;
    const [[courseRow]] = await pool.query(
        `SELECT title FROM courses WHERE course_id = ?`,
        [courseId]
    );
    const courseTitle = courseRow.title;

    const opts = { year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date().toLocaleDateString('es-ES', opts);

    doc
        .fontSize(14)
        .text(`Otorgado a: ${userName}`, { align: 'center' })
        .moveDown(0.5)
        .text(`Curso: ${courseTitle}`, { align: 'center' })
        .moveDown(0.5)
        .text(`Calificación final: ${prog.score}%`, { align: 'center' })
        .moveDown(0.5)
        .text(`Fecha: ${fecha}`, { align: 'center' });

    doc.moveDown(2);
    doc
        .fontSize(12)
        .text('__________________________', { align: 'right' })
        .text('Director de Capacitación', { align: 'right' });

    doc.end();
};

// NOTE: formatTimeAgo function removed as it's expected to be available globally from utils.js
