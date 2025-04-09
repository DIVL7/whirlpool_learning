const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const courseRoutes = require('./courses'); // Using only the courses.js file
const settingsRoutes = require('./settings');
const dashboardRoutes = require('./dashboard');
const reportRoutes = require('./reports');
const logRoutes = require('./log');

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Register routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes); // All course routes under /api/courses
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

// Make sure the course categories endpoint is properly registered
router.get('/courses/categories', (req, res, next) => {
    // This is a fallback in case the route isn't properly registered in courseRoutes
    const courseController = require('../controllers/courseController');
    courseController.getAllCategories(req, res);
});

module.exports = router;