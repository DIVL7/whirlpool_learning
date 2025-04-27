const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { isAuthenticated } = require('../middleware/auth');

// Rutas públicas
router.get('/categories', forumController.getCategories);
router.get('/questions', forumController.getQuestions);
router.get('/questions/:id', forumController.getQuestionById);

// Rutas protegidas (requieren autenticación)
router.post('/questions', isAuthenticated, forumController.createQuestion);
router.post('/questions/:id/answers', isAuthenticated, forumController.createAnswer);
router.post('/answers/:id/vote', isAuthenticated, forumController.voteForAnswer);
router.put('/answers/:id/accept', isAuthenticated, forumController.acceptAnswer);
router.delete('/questions/:id', isAuthenticated, forumController.deleteQuestion);
router.delete('/answers/:id', isAuthenticated, forumController.deleteAnswer);

module.exports = router;
