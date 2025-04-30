const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { isAdmin } = require('../../middleware/auth');
const courseController = require('../../controllers/courseController');
const quizController = require('../../controllers/quizController'); // Import quiz controller
const { contentUpload } = require('../../config/multer'); // Import contentUpload middleware

// --- Course Routes ---

// GET /api/courses - Fetch the main list of courses with pagination (for admin course page)
router.get('/', isAdmin, courseController.getAllCourses);

// GET /api/courses/list - Fetch a simple list of PUBLISHED courses (ID and Title) (for assignment modal)
router.get('/list', isAdmin, async (req, res) => {
    try {
        // Temporarily fetch ALL courses for debugging status issues
        const [courses] = await pool.query('SELECT course_id, title, status FROM courses ORDER BY title ASC'); // Added status, removed WHERE
        res.json(courses);
    } catch (error) {
        console.error('Error fetching all course list:', error); // Updated error message context
        res.status(500).json({ error: 'Error al obtener la lista de cursos' });
    }
});

// GET /api/courses/:id - Fetch details for a specific course (used in module admin)
// Note: Frontend calls /api/courses/:id, so we use getCourseById here
router.get('/:id', isAdmin, courseController.getCourseById); 

// POST /api/courses - Create a new course (Assuming courseUpload handles thumbnail)
// This route might already exist elsewhere (e.g., routes/courses.js), ensure it's consistent
// router.post('/', isAdmin, courseUpload.single('thumbnail'), courseController.createCourse); // Example if needed here

// PUT /api/courses/:id - Update a course
// This route might already exist elsewhere (e.g., routes/courses.js), ensure it's consistent
// router.put('/:id', isAdmin, courseUpload.single('thumbnail'), courseController.updateCourse); // Example if needed here

// DELETE /api/courses/:id - Delete a course
// This route might already exist elsewhere (e.g., routes/courses.js), ensure it's consistent
// router.delete('/:id', isAdmin, courseController.deleteCourse); // Example if needed here


// --- Module Routes (Nested under Courses) ---

// GET /api/courses/:id/modules - Fetch modules for a specific course
router.get('/:id/modules', isAdmin, courseController.getCourseModules);

// POST /api/courses/:id/modules - Create a new module for a course
router.post('/:id/modules', isAdmin, courseController.createModule);

// PUT /api/courses/:id/modules/:moduleId - Update a specific module
router.put('/:id/modules/:moduleId', isAdmin, courseController.updateModule);

// DELETE /api/courses/:id/modules/:moduleId - Delete a specific module
router.delete('/:id/modules/:moduleId', isAdmin, courseController.deleteModule);


// --- Content Routes (Nested under Modules) ---

// GET /api/courses/:id/modules/:moduleId/contents - Fetch contents for a specific module
router.get('/:id/modules/:moduleId/contents', isAdmin, courseController.getModuleContents);

// POST /api/courses/:id/modules/:moduleId/contents - Create new content for a module
// Use contentUpload middleware for file handling (PDF/Image)
router.post('/:id/modules/:moduleId/contents', isAdmin, contentUpload.single('content_data'), courseController.createContent);

// PUT /api/courses/:id/modules/:moduleId/contents/:contentId - Update specific content
// Use contentUpload middleware for file handling (PDF/Image)
router.put('/:id/modules/:moduleId/contents/:contentId', isAdmin, contentUpload.single('content_data'), courseController.updateContent);

// DELETE /api/courses/:id/modules/:moduleId/contents/:contentId - Delete specific content
router.delete('/:id/modules/:moduleId/contents/:contentId', isAdmin, courseController.deleteContent);


// --- Quiz Routes (Nested under Modules) ---

// GET /api/courses/:id/modules/:moduleId/quizzes - Fetch quizzes for a specific module
router.get('/:id/modules/:moduleId/quizzes', isAdmin, quizController.getQuizzesForModule);

// POST /api/courses/:id/modules/:moduleId/quizzes - Create a new quiz for a module
router.post('/:id/modules/:moduleId/quizzes', isAdmin, quizController.createQuiz);

// Note: Routes for updating/deleting specific quizzes, questions, and answers 
// (e.g., /api/quizzes/:quizId, /api/questions/:questionId) are likely defined 
// in separate route files (e.g., routes/api/quizzes.js) and assumed to be working.


module.exports = router;
