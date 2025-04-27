const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const courseRoutes = require('./courses'); // Using only the courses.js file
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
router.use('/courses', courseRoutes); // All course routes under /api/courses
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/technician', technicianRoutes); // Add technician routes
router.use('/forum', forumRoutes); // Add forum routes

module.exports = router;