const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

// Forum routes
router.get('/categories', forumController.getCategories);
router.get('/questions', forumController.getQuestions);
router.post('/questions', forumController.createQuestion);

module.exports = router;