const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
// const courseRoutes = require('./courses'); // Remove this - API routes handled separately
const settingsRoutes = require('./settings');
const dashboardRoutes = require('./dashboard');
const reportRoutes = require('./reports');
const logRoutes = require('./log');
const technicianRoutes = require('./technician'); // Add technician routes
const forumRoutes = require('./forum'); // Add forum routes

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Service is running' });
});

// Register routes
router.use('/auth', authRoutes);
// router.use('/courses', courseRoutes); // Remove this - API routes handled separately
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/technician', technicianRoutes); // Add technician routes
router.use('/forum', forumRoutes); // Add forum routes

// Make sure the course categories endpoint is properly registered
router.get('/courses/categories', (req, res, next) => {
    // This is a fallback in case the route isn't properly registered in courseRoutes
    const courseController = require('../controllers/courseController');
    courseController.getAllCategories(req, res);
});

// Remove the fallback route as it's no longer needed here
/*
router.get('/courses/categories', (req, res, next) => {
    // This is a fallback in case the route isn't properly registered in courseRoutes
    const courseController = require('../controllers/courseController');
    courseController.getAllCategories(req, res);
});
*/

module.exports = router;
