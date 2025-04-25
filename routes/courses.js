const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { moduleQuizRouter } = require('./quizzes'); // Import the router for quizzes within modules
// Importar ambas configuraciones de multer
const { courseUpload, contentUpload } = require('../config/multer');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/available', courseController.getAvailableCourses);

// Course category routes (must come before /:id routes)
router.get('/categories', courseController.getAllCategories);

// Course module routes
router.get('/:id/modules', courseController.getCourseModules);
router.post('/:id/modules', isAdmin, courseController.createModule);
router.put('/:id/modules/:moduleId', isAdmin, courseController.updateModule);
router.delete('/:id/modules/:moduleId', isAdmin, courseController.deleteModule);
// Añadir la ruta para obtener los contenidos de un módulo
router.get('/:id/modules/:moduleId/contents', courseController.getModuleContents);
// Rutas para CRUD de Contenido (protegidas por isAdmin)
router.post('/:id/modules/:moduleId/contents', 
    isAdmin, 
    contentUpload.single('content_data'), // Middleware para manejar archivo
    courseController.createContent
);
router.put('/:id/modules/:moduleId/contents/:contentId', 
    isAdmin, 
    contentUpload.single('content_data'), // Middleware para manejar archivo
    courseController.updateContent
);
router.delete('/:id/modules/:moduleId/contents/:contentId', 
    isAdmin,
    courseController.deleteContent
);

// Mount quiz routes under modules
router.use('/:id/modules/:moduleId/quizzes', moduleQuizRouter); // Use the imported router

// Basic course routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes (admin only)
router.post('/', isAdmin, courseUpload.single('thumbnail'), courseController.createCourse);
router.put('/:id', isAdmin, (req, res, next) => {
    courseUpload.single('thumbnail')(req, res, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, courseController.updateCourse);
router.delete('/:id', isAdmin, courseController.deleteCourse);

module.exports = router;
