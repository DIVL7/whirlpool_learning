const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');
const { isAuthenticated } = require('../middleware/auth');

// Middleware para asegurar que todas las rutas requieren autenticación
router.use(isAuthenticated);

// Technician dashboard routes
router.get('/stats', technicianController.getStats);
router.get('/progress-chart', technicianController.getProgressChart);
router.get('/recent-activity', technicianController.getRecentActivity);
router.get('/upcoming-courses', technicianController.getUpcomingCourses);

// Rutas de cursos
router.get('/courses', technicianController.getCourses);
router.get('/courses/:id', technicianController.getCourseDetails);
router.get('/courses/:id/modules', technicianController.getCourseModules);
router.post('/courses/content/:contentId/complete', technicianController.markContentCompleted);

// Rutas de certificados
router.get('/certificates', technicianController.getCertificates);
router.get('/certificates/:courseId/download', technicianController.downloadCertificate);

module.exports = router;