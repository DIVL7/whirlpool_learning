const { pool } = require('../config/database');

// Obtener todas las categorías del foro
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(`
            SELECT * FROM forum_categories 
            ORDER BY name
        `);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching forum categories:', error);
        res.status(500).json({ success: false, error: 'Error al cargar categorías del foro' });
    }
};

// Obtener preguntas/temas (con filtro opcional por categoría)
exports.getQuestions = async (req, res) => {
    try {
        let query = `
            SELECT q.question_id, q.title, q.content, q.user_id, q.created_at, q.updated_at,
                   q.is_solved, q.category_id, fc.name as category_name,
                   u.username as author_name,
                   (SELECT COUNT(*) FROM forum_answers WHERE question_id = q.question_id) as answer_count
            FROM forum_questions q
            JOIN forum_categories fc ON q.category_id = fc.category_id
            JOIN users u ON q.user_id = u.user_id
        `;
        
        const params = [];
        
        // Si se proporciona un category_id, añadir filtro
        if (req.query.category_id) {
            query += ' WHERE q.category_id = ?';
            params.push(req.query.category_id);
        }
        
        query += ' ORDER BY q.updated_at DESC';
        
        const [questions] = await pool.query(query, params);
        res.json(questions);
    } catch (error) {
        console.error('Error fetching forum questions:', error);
        res.status(500).json({ success: false, error: 'Error al cargar preguntas del foro' });
    }
};

// Obtener una pregunta específica con sus respuestas
exports.getQuestionById = async (req, res) => {
    try {
        const questionId = req.params.id;
        
        // Incrementar el contador de vistas
        await pool.query(`
            UPDATE forum_questions 
            SET views = views + 1 
            WHERE question_id = ?
        `, [questionId]);
        
        // Obtener datos de la pregunta
        const [questions] = await pool.query(`
            SELECT q.*, fc.name as category_name,
                   u.username as author_name, u.profile_picture as author_picture
            FROM forum_questions q
            JOIN forum_categories fc ON q.category_id = fc.category_id
            JOIN users u ON q.user_id = u.user_id
            WHERE q.question_id = ?
        `, [questionId]);
        
        if (questions.length === 0) {
            return res.status(404).json({ success: false, error: 'Pregunta no encontrada' });
        }
        
        const question = questions[0];
        
        // Obtener respuestas
        const [answers] = await pool.query(`
            SELECT a.*, 
                   u.username as author_name, u.profile_picture as author_picture,
                   (SELECT COUNT(*) FROM forum_votes WHERE answer_id = a.answer_id AND vote_type = 'upvote') as upvotes,
                   (SELECT COUNT(*) FROM forum_votes WHERE answer_id = a.answer_id AND vote_type = 'downvote') as downvotes
            FROM forum_answers a
            JOIN users u ON a.user_id = u.user_id
            WHERE a.question_id = ?
            ORDER BY a.is_accepted DESC, (SELECT COUNT(*) FROM forum_votes WHERE answer_id = a.answer_id AND vote_type = 'upvote') DESC, a.created_at ASC
        `, [questionId]);
        
        // Añadir respuestas al objeto de pregunta
        question.answers = answers;
        
        res.json(question);
    } catch (error) {
        console.error('Error fetching question details:', error);
        res.status(500).json({ success: false, error: 'Error al cargar detalles de la pregunta' });
    }
};

// Crear una nueva pregunta
exports.createQuestion = async (req, res) => {
    try {
        const { title, content, category_id } = req.body;
        const userId = req.session.user?.user_id;
        
        // Validar datos de entrada
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        if (!title || !content || !category_id) {
            return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
        }
        
        // Insertar la pregunta
        const [result] = await pool.query(`
            INSERT INTO forum_questions 
            (title, content, user_id, category_id) 
            VALUES (?, ?, ?, ?)
        `, [title, content, userId, category_id]);
        
        res.status(201).json({ 
            success: true, 
            question_id: result.insertId,
            message: 'Pregunta creada exitosamente' 
        });
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ success: false, error: 'Error al crear la pregunta' });
    }
};

// Eliminar una pregunta
exports.deleteQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.session.user?.user_id;
        
        // Verificar autenticación
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // Verificar que la pregunta existe y pertenece al usuario
        const [question] = await pool.query(`
            SELECT * FROM forum_questions WHERE question_id = ?
        `, [questionId]);
        
        if (question.length === 0) {
            return res.status(404).json({ success: false, error: 'Pregunta no encontrada' });
        }
        
        // Verificar que el usuario es el autor de la pregunta
        if (question[0].user_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'No tienes permiso para eliminar esta pregunta' 
            });
        }
        
        // Eliminar la pregunta
        await pool.query(`
            DELETE FROM forum_questions WHERE question_id = ?
        `, [questionId]);
        
        res.json({ 
            success: true, 
            message: 'Pregunta eliminada exitosamente' 
        });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar la pregunta' });
    }
};

// Responder a una pregunta
exports.createAnswer = async (req, res) => {
    try {
        const questionId = req.params.id;
        const { content } = req.body;
        const userId = req.session.user?.user_id;
        
        // Validar datos de entrada
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        if (!content) {
            return res.status(400).json({ success: false, error: 'Se requiere contenido para la respuesta' });
        }
        
        // Verificar que la pregunta existe
        const [question] = await pool.query('SELECT * FROM forum_questions WHERE question_id = ?', [questionId]);
        
        if (question.length === 0) {
            return res.status(404).json({ success: false, error: 'Pregunta no encontrada' });
        }
        
        // Insertar la respuesta
        const [result] = await pool.query(`
            INSERT INTO forum_answers 
            (question_id, user_id, content) 
            VALUES (?, ?, ?)
        `, [questionId, userId, content]);
        
        // Actualizar la fecha de actualización de la pregunta
        await pool.query(`
            UPDATE forum_questions 
            SET updated_at = NOW() 
            WHERE question_id = ?
        `, [questionId]);
        
        res.status(201).json({ 
            success: true, 
            answer_id: result.insertId,
            message: 'Respuesta publicada exitosamente' 
        });
    } catch (error) {
        console.error('Error posting answer:', error);
        res.status(500).json({ success: false, error: 'Error al publicar la respuesta' });
    }
};

// Eliminar una respuesta
exports.deleteAnswer = async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.session.user?.user_id;
        
        // Verificar autenticación
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // Verificar que la respuesta existe y pertenece al usuario
        const [answer] = await pool.query(`
            SELECT * FROM forum_answers WHERE answer_id = ?
        `, [answerId]);
        
        if (answer.length === 0) {
            return res.status(404).json({ success: false, error: 'Respuesta no encontrada' });
        }
        
        // Verificar que el usuario es el autor de la respuesta
        if (answer[0].user_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'No tienes permiso para eliminar esta respuesta' 
            });
        }
        
        // Eliminar la respuesta
        await pool.query(`
            DELETE FROM forum_answers WHERE answer_id = ?
        `, [answerId]);
        
        res.json({ 
            success: true, 
            message: 'Respuesta eliminada exitosamente' 
        });
    } catch (error) {
        console.error('Error deleting answer:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar la respuesta' });
    }
};

// Votar por una respuesta
exports.voteForAnswer = async (req, res) => {
    try {
        const answerId = req.params.id;
        const { vote_type } = req.body;
        const userId = req.session.user?.user_id;
        
        // Validar datos de entrada
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // Validar el tipo de voto
        if (vote_type !== 'upvote' && vote_type !== 'downvote' && vote_type !== 'none') {
            return res.status(400).json({ success: false, error: 'Tipo de voto inválido' });
        }
        
        // Verificar si el usuario ya ha votado por esta respuesta
        const [existingVote] = await pool.query(`
            SELECT * FROM forum_votes 
            WHERE answer_id = ? AND user_id = ?
        `, [answerId, userId]);
        
        if (vote_type === 'none') {
            // Si el tipo es 'none', eliminar el voto existente
            if (existingVote.length > 0) {
                await pool.query(`
                    DELETE FROM forum_votes 
                    WHERE answer_id = ? AND user_id = ?
                `, [answerId, userId]);
            }
        } else {
            // Si ya hay un voto, actualizarlo; si no, insertar nuevo
            if (existingVote.length > 0) {
                await pool.query(`
                    UPDATE forum_votes 
                    SET vote_type = ? 
                    WHERE answer_id = ? AND user_id = ?
                `, [vote_type, answerId, userId]);
            } else {
                await pool.query(`
                    INSERT INTO forum_votes 
                    (answer_id, user_id, vote_type) 
                    VALUES (?, ?, ?)
                `, [answerId, userId, vote_type]);
            }
        }
        
        // Contar votos actuales
        const [upvotes] = await pool.query(`
            SELECT COUNT(*) as count FROM forum_votes 
            WHERE answer_id = ? AND vote_type = 'upvote'
        `, [answerId]);
        
        const [downvotes] = await pool.query(`
            SELECT COUNT(*) as count FROM forum_votes 
            WHERE answer_id = ? AND vote_type = 'downvote'
        `, [answerId]);
        
        res.json({ 
            success: true, 
            upvotes: upvotes[0].count,
            downvotes: downvotes[0].count,
            message: vote_type === 'none' ? 'Voto eliminado exitosamente' : 'Voto registrado exitosamente' 
        });
    } catch (error) {
        console.error('Error voting for answer:', error);
        res.status(500).json({ success: false, error: 'Error al registrar el voto' });
    }
};

// Aceptar una respuesta
exports.acceptAnswer = async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.session.user?.user_id;
        
        // Validar datos de entrada
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }
        
        // Obtener información de la respuesta
        const [answers] = await pool.query(`
            SELECT a.*, q.user_id as question_user_id 
            FROM forum_answers a
            JOIN forum_questions q ON a.question_id = q.question_id
            WHERE a.answer_id = ?
        `, [answerId]);
        
        if (answers.length === 0) {
            return res.status(404).json({ success: false, error: 'Respuesta no encontrada' });
        }
        
        const answer = answers[0];
        
        // Verificar que el usuario es el autor de la pregunta
        if (answer.question_user_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'Solo el autor de la pregunta puede aceptar respuestas' 
            });
        }
        
        // Quitar aceptación de cualquier otra respuesta en la misma pregunta
        await pool.query(`
            UPDATE forum_answers 
            SET is_accepted = 0 
            WHERE question_id = ?
        `, [answer.question_id]);
        
        // Marcar esta respuesta como aceptada
        await pool.query(`
            UPDATE forum_answers 
            SET is_accepted = 1 
            WHERE answer_id = ?
        `, [answerId]);
        
        // Marcar la pregunta como resuelta
        await pool.query(`
            UPDATE forum_questions 
            SET is_solved = 1 
            WHERE question_id = ?
        `, [answer.question_id]);
        
        res.json({ 
            success: true, 
            message: 'Respuesta aceptada exitosamente' 
        });
    } catch (error) {
        console.error('Error accepting answer:', error);
        res.status(500).json({ success: false, error: 'Error al aceptar la respuesta' });
    }
};