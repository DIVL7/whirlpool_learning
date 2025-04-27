const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { courseUpload } = require('../config/multer');
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