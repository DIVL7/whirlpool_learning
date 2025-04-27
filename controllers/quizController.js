// controllers/quizController.js
const { pool } = require('../config/database');

// Get all quizzes for a specific module
exports.getQuizzesForModule = async (req, res, next) => {
    const { moduleId } = req.params;
    if (!moduleId) {
        return res.status(400).json({ message: 'Module ID is required' });
    }

    try {
        const [quizzes] = await pool.query(
            'SELECT * FROM quizzes WHERE module_id = ? ORDER BY position',
            [moduleId]
        );
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes for module:', error);
        next(error); // Pass error to the error handling middleware
    }
};

// Create a new quiz for a specific module
exports.createQuiz = async (req, res, next) => {
    const { moduleId } = req.params;
    const { title, description, passing_score = 70, time_limit = null, position } = req.body;

    if (!moduleId || !title || position === undefined || position === null) {
        return res.status(400).json({ message: 'Module ID, title, and position are required' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO quizzes (module_id, title, description, passing_score, time_limit, position) VALUES (?, ?, ?, ?, ?, ?)',
            [moduleId, title, description, passing_score, time_limit, position]
        );
        const newQuizId = result.insertId;
        res.status(201).json({ message: 'Quiz created successfully', quizId: newQuizId, moduleId, title, position });
    } catch (error) {
        console.error('Error creating quiz:', error);
        next(error);
    }
};

// Get a single quiz by ID, including its questions and answers
exports.getQuizById = async (req, res, next) => {
    const { quizId } = req.params;
    if (!quizId) {
        return res.status(400).json({ message: 'Quiz ID is required' });
    }

    try {
        // Fetch quiz details
        const [quizResult] = await pool.query('SELECT * FROM quizzes WHERE quiz_id = ?', [quizId]);
        if (quizResult.length === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        const quiz = quizResult[0];

        // Fetch questions for the quiz
        const [questions] = await pool.query(
            'SELECT * FROM questions WHERE quiz_id = ? ORDER BY position',
            [quizId]
        );

        // Fetch answers for each question
        const questionsWithAnswers = await Promise.all(questions.map(async (question) => {
            const [answers] = await pool.query(
                'SELECT * FROM answers WHERE question_id = ?',
                [question.question_id]
            );
            return { ...question, answers };
        }));

        quiz.questions = questionsWithAnswers;
        res.status(200).json(quiz);

    } catch (error) {
        console.error('Error fetching quiz by ID:', error);
        next(error);
    }
};

// Update an existing quiz
exports.updateQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const { title, description, passing_score, time_limit, position } = req.body;

    if (!quizId) {
        return res.status(400).json({ message: 'Quiz ID is required' });
    }
    // Basic validation: ensure at least one field is being updated
    if (title === undefined && description === undefined && passing_score === undefined && time_limit === undefined && position === undefined) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    // Build the update query dynamically based on provided fields
    let query = 'UPDATE quizzes SET ';
    const params = [];
    if (title !== undefined) {
        query += 'title = ?, ';
        params.push(title);
    }
    if (description !== undefined) {
        query += 'description = ?, ';
        params.push(description);
    }
    if (passing_score !== undefined) {
        query += 'passing_score = ?, ';
        params.push(passing_score);
    }
    if (time_limit !== undefined) { // Allow setting time_limit to null
        query += 'time_limit = ?, ';
        params.push(time_limit);
    }
     if (position !== undefined) {
        query += 'position = ?, ';
        params.push(position);
    }

    // Remove trailing comma and space
    query = query.slice(0, -2);
    query += ' WHERE quiz_id = ?';
    params.push(quizId);

    try {
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quiz not found or no changes made' });
        }

        res.status(200).json({ message: 'Quiz updated successfully', quizId });
    } catch (error) {
        console.error('Error updating quiz:', error);
        next(error);
    }
};

// Delete a quiz
exports.deleteQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    if (!quizId) {
        return res.status(400).json({ message: 'Quiz ID is required' });
    }

    try {
        // The database schema uses ON DELETE CASCADE for foreign keys in questions and answers,
        // so deleting the quiz should automatically delete related questions and answers.
        const [result] = await pool.query('DELETE FROM quizzes WHERE quiz_id = ?', [quizId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.status(200).json({ message: 'Quiz deleted successfully', quizId });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        next(error);
    }
};

// --- Question Management ---

// Add a question to a specific quiz
exports.addQuestionToQuiz = async (req, res, next) => {
    const { quizId } = req.params;
    const { question_text, question_type, points = 1, position } = req.body;

    if (!quizId || !question_text || !question_type || position === undefined || position === null) {
        return res.status(400).json({ message: 'Quiz ID, question text, type, and position are required' });
    }
    // Validate question_type against ENUM values
    const validTypes = ['multiple_choice', 'true_false', 'short_answer'];
    if (!validTypes.includes(question_type)) {
        return res.status(400).json({ message: `Invalid question type. Must be one of: ${validTypes.join(', ')}` });
    }

    try {
        // Check if quiz exists
        const [quizCheck] = await pool.query('SELECT quiz_id FROM quizzes WHERE quiz_id = ?', [quizId]);
        if (quizCheck.length === 0) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO questions (quiz_id, question_text, question_type, points, position) VALUES (?, ?, ?, ?, ?)',
            [quizId, question_text, question_type, points, position]
        );
        const newQuestionId = result.insertId;
        res.status(201).json({ message: 'Question added successfully', questionId: newQuestionId, quizId });
    } catch (error) {
        console.error('Error adding question to quiz:', error);
        next(error);
    }
};

// Update an existing question
exports.updateQuestion = async (req, res, next) => {
    const { questionId } = req.params;
    const { question_text, question_type, points, position } = req.body;

    if (!questionId) {
        return res.status(400).json({ message: 'Question ID is required' });
    }
    if (question_text === undefined && question_type === undefined && points === undefined && position === undefined) {
        return res.status(400).json({ message: 'No update data provided' });
    }
    // Validate question_type if provided
    if (question_type !== undefined) {
        const validTypes = ['multiple_choice', 'true_false', 'short_answer'];
        if (!validTypes.includes(question_type)) {
            return res.status(400).json({ message: `Invalid question type. Must be one of: ${validTypes.join(', ')}` });
        }
    }

    // Build update query dynamically
    let query = 'UPDATE questions SET ';
    const params = [];
    if (question_text !== undefined) {
        query += 'question_text = ?, ';
        params.push(question_text);
    }
    if (question_type !== undefined) {
        query += 'question_type = ?, ';
        params.push(question_type);
    }
    if (points !== undefined) {
        query += 'points = ?, ';
        params.push(points);
    }
    if (position !== undefined) {
        query += 'position = ?, ';
        params.push(position);
    }

    query = query.slice(0, -2); // Remove trailing comma and space
    query += ' WHERE question_id = ?';
    params.push(questionId);

    try {
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Question not found or no changes made' });
        }

        res.status(200).json({ message: 'Question updated successfully', questionId });
    } catch (error) {
        console.error('Error updating question:', error);
        next(error);
    }
};

// Delete a question
exports.deleteQuestion = async (req, res, next) => {
    const { questionId } = req.params;
    if (!questionId) {
        return res.status(400).json({ message: 'Question ID is required' });
    }

    try {
        // ON DELETE CASCADE in answers table handles deleting related answers
        const [result] = await pool.query('DELETE FROM questions WHERE question_id = ?', [questionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.status(200).json({ message: 'Question deleted successfully', questionId });
    } catch (error) {
        console.error('Error deleting question:', error);
        next(error);
    }
};

// --- Answer Management ---

// Add an answer to a specific question
exports.addAnswerToQuestion = async (req, res, next) => {
    const { questionId } = req.params;
    const { answer_text, is_correct = false } = req.body;

    if (!questionId || !answer_text || is_correct === undefined) {
        return res.status(400).json({ message: 'Question ID, answer text, and correctness status are required' });
    }

    try {
        // Check if question exists
        const [questionCheck] = await pool.query('SELECT question_id FROM questions WHERE question_id = ?', [questionId]);
        if (questionCheck.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
            [questionId, answer_text, is_correct]
        );
        const newAnswerId = result.insertId;
        res.status(201).json({ message: 'Answer added successfully', answerId: newAnswerId, questionId });
    } catch (error) {
        console.error('Error adding answer to question:', error);
        next(error);
    }
};

// Update an existing answer
exports.updateAnswer = async (req, res, next) => {
    const { answerId } = req.params;
    const { answer_text, is_correct } = req.body;

    if (!answerId) {
        return res.status(400).json({ message: 'Answer ID is required' });
    }
    if (answer_text === undefined && is_correct === undefined) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    // Build update query dynamically
    let query = 'UPDATE answers SET ';
    const params = [];
    if (answer_text !== undefined) {
        query += 'answer_text = ?, ';
        params.push(answer_text);
    }
    if (is_correct !== undefined) {
        query += 'is_correct = ?, ';
        params.push(is_correct);
    }

    query = query.slice(0, -2); // Remove trailing comma and space
    query += ' WHERE answer_id = ?';
    params.push(answerId);

    try {
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Answer not found or no changes made' });
        }

        res.status(200).json({ message: 'Answer updated successfully', answerId });
    } catch (error) {
        console.error('Error updating answer:', error);
        next(error);
    }
};

// Delete an answer
exports.deleteAnswer = async (req, res, next) => {
    const { answerId } = req.params;
    if (!answerId) {
        return res.status(400).json({ message: 'Answer ID is required' });
    }

    try {
        const [result] = await pool.query('DELETE FROM answers WHERE answer_id = ?', [answerId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        res.status(200).json({ message: 'Answer deleted successfully', answerId });
    } catch (error) {
        console.error('Error deleting answer:', error);
        next(error);
    }
};

// Nuevo método: registrar intento de quiz
exports.submitQuizAttempt = async (req, res, next) => {
    try {
      const userId    = req.session.user.user_id;
      const { quizId } = req.params;
      const answers    = req.body.answers; // [{questionId, answerId}, ...]
  
      // Obtener datos del quiz (puntos y passing_score)
      const [quizRows] = await pool.query(
        'SELECT passing_score FROM quizzes WHERE quiz_id = ?',
        [quizId]
      );
      if (!quizRows.length) return res.status(404).json({ message: 'Quiz no encontrado' });
      const passingScore = quizRows[0].passing_score;
  
      // Calcular score total
      let correctCount = 0;
      for (let resp of answers) {
        const [ansRows] = await pool.query(
          'SELECT is_correct FROM answers WHERE question_id = ? AND answer_id = ?',
          [resp.questionId, resp.answerId]
        );
        if (ansRows[0]?.is_correct) correctCount++;
      }
      const score = Math.round((correctCount / answers.length) * 100);
      const passed = score >= passingScore;
  
      // Insertar intento
      await pool.query(
        `INSERT INTO quiz_attempts
           (quiz_id, user_id, score, passed, completed_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [quizId, userId, score, passed]
      );
  
      res.status(200).json({ success: true, score, passed });
    } catch (error) {
      console.error('Error submitQuizAttempt:', error);
      next(error);
    }
  };
  