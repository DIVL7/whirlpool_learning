// routes/quizzes.js
const express = require('express');
const quizController = require('../controllers/quizController');
const { isAdmin } = require('../middleware/auth'); // Assuming auth middleware exists

const router = express.Router({ mergeParams: true }); // mergeParams allows access to :moduleId from parent router

// --- Quiz Routes ---
// Mounted under /api/modules/:moduleId/quizzes

// GET /api/modules/:moduleId/quizzes - Get all quizzes for a module
router.get('/', isAdmin, quizController.getQuizzesForModule);

// POST /api/modules/:moduleId/quizzes - Create a new quiz for a module
router.post('/', isAdmin, quizController.createQuiz);

// --- Routes for specific quiz (needs quizId) ---
// These might be better mounted directly under /api/quizzes/

const quizRouter = express.Router(); // Separate router for /api/quizzes/:quizId

// GET /api/quizzes/:quizId - Get a specific quiz by ID (including questions/answers)
quizRouter.get('/:quizId', isAdmin, quizController.getQuizById);

// PUT /api/quizzes/:quizId - Update a specific quiz
quizRouter.put('/:quizId', isAdmin, quizController.updateQuiz);

// DELETE /api/quizzes/:quizId - Delete a specific quiz
quizRouter.delete('/:quizId', isAdmin, quizController.deleteQuiz);

// --- Question Routes ---
// POST /api/quizzes/:quizId/questions - Add a question to a quiz
quizRouter.post('/:quizId/questions', isAdmin, quizController.addQuestionToQuiz);

// PUT /api/questions/:questionId - Update a specific question
// DELETE /api/questions/:questionId - Delete a specific question
// Note: Need separate routes or logic to handle question/answer updates/deletes by their own IDs

const questionRouter = express.Router(); // Separate router for /api/questions/:questionId

questionRouter.put('/:questionId', isAdmin, quizController.updateQuestion);
questionRouter.delete('/:questionId', isAdmin, quizController.deleteQuestion);

// --- Answer Routes ---
// POST /api/questions/:questionId/answers - Add an answer to a question
questionRouter.post('/:questionId/answers', isAdmin, quizController.addAnswerToQuestion);

// PUT /api/answers/:answerId - Update a specific answer
// DELETE /api/answers/:answerId - Delete a specific answer

const answerRouter = express.Router(); // Separate router for /api/answers/:answerId

answerRouter.put('/:answerId', isAdmin, quizController.updateAnswer);
answerRouter.delete('/:answerId', isAdmin, quizController.deleteAnswer);


// Export routers to be mounted in server.js
module.exports = {
    moduleQuizRouter: router, // For routes nested under modules
    quizRouter: quizRouter,     // For routes directly accessing quizzes by ID
    questionRouter: questionRouter, // For routes accessing questions by ID
    answerRouter: answerRouter      // For routes accessing answers by ID
};
