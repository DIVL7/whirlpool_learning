const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');

// Technician dashboard routes
router.get('/stats', technicianController.getStats);
router.get('/progress-chart', technicianController.getProgressChart);
router.get('/recent-activity', technicianController.getRecentActivity);
router.get('/upcoming-courses', technicianController.getUpcomingCourses);
router.get('/courses', technicianController.getCourses);
router.get('/notifications', technicianController.getNotifications);

module.exports = router;