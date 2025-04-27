const { pool } = require('../config/database');
const { coursesImageDir } = require('../config/multer');
const path = require('path');
const fs = require('fs');

// Get all courses
async function getAllCourses(req, res) {
    try {
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Fetch courses from database with pagination
        const [courses] = await pool.query(`
            SELECT 
                c.course_id as id,
                c.title,
                c.description,
                c.thumbnail,
                c.category_id,
                cc.name as category_name,
                c.status,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT m.module_id) as lesson_count,
                0 as student_count
            FROM 
                courses c
            LEFT JOIN 
                course_categories cc ON c.category_id = cc.category_id
            LEFT JOIN
                modules m ON c.course_id = m.course_id
            GROUP BY
                c.course_id
            ORDER BY
                c.updated_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        // Get total count for pagination
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total FROM courses
        `);
        
        const totalCount = countResult[0].total;
        const totalPages = Math.ceil(totalCount / limit);
        
        // Return courses with pagination metadata
        res.json({
            courses: courses,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Error al cargar los cursos' });
    }
}

// Add this function to get all course categories
async function getAllCategories(req, res) {
    try {
        // Eliminar o comentar estas líneas de log
        // console.error('\x1b[36m%s\x1b[0m', '[CATEGORIES API] Getting all categories from database');
        const [categories] = await pool.query('SELECT * FROM course_categories ORDER BY name');
        // console.error('\x1b[32m%s\x1b[0m', '[CATEGORIES API] Categories retrieved from database:', categories.length);
        
        if (categories.length === 0) {
            // console.error('\x1b[33m%s\x1b[0m', '[CATEGORIES API] WARNING: No categories found in database');
        }
        
        res.json(categories);
    } catch (error) {
        // console.error('\x1b[31m%s\x1b[0m', '[CATEGORIES API] ERROR fetching categories:', error);
        res.status(500).json({ error: 'Error al cargar las categorías' });
    }
}

// Modificar la función getCourseById para incluir la categoría
async function getCourseById(req, res) {
    try {
        const courseId = req.params.id;
        
        // Get course details including category
        const [courses] = await pool.query(`
            SELECT 
                c.course_id as id,
                c.title,
                c.description,
                c.thumbnail,
                c.category_id,
                cc.name as category_name,
                c.status,
                c.created_at,
                c.updated_at
            FROM 
                courses c
            LEFT JOIN
                course_categories cc ON c.category_id = cc.category_id
            WHERE 
                c.course_id = ?
        `, [courseId]);
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        const course = courses[0];
        
        // Format course for frontend
        const formattedCourse = {
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.thumbnail ? `/uploads/courses/${course.thumbnail}` : null,
            category_id: course.category_id,
            category: course.category_name || 'General',
            status: course.status,
            created_at: course.created_at,
            updated_at: course.updated_at
        };
        
        res.json(formattedCourse);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Error al cargar el curso' });
    }
}

// Get available courses for students
async function getAvailableCourses(req, res) {
    try {
        // Get published courses
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE status = "published" ORDER BY created_at DESC'
        );
        
        // Format courses for frontend
        const formattedCourses = courses.map(course => ({
            id: course.course_id,
            title: course.title,
            description: course.description,
            image_url: course.thumbnail ? `/uploads/courses/${course.thumbnail}` : null,
            category: course.category || 'General',
            status: course.status,
            updated_at: course.updated_at
        }));
        
        res.json(formattedCourses);
    } catch (error) {
        console.error('Error fetching available courses:', error);
        res.status(500).json({ error: 'Error al cargar los cursos disponibles' });
    }
}

// Get course details
async function getCourseDetails(req, res) {
    try {
        const courseId = req.params.id;
        
        // Get course details
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ? AND status = "published"',
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        // Get modules for this course
        const [modules] = await pool.query(
            'SELECT * FROM modules WHERE course_id = ? ORDER BY position',
            [courseId]
        );
        
        // Format response
        const courseDetails = {
            ...courses[0],
            modules: modules.map(module => ({
                id: module.module_id,
                title: module.title,
                description: module.description,
                position: module.position
            }))
        };
        
        res.json(courseDetails);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ error: 'Error al cargar los detalles del curso' });
    }
}

// Enroll in a course
async function enrollInCourse(req, res) {
    try {
        // Check if user is logged in
        if (!req.session.user) {
            return res.status(401).json({ error: 'Debe iniciar sesión para inscribirse en un curso' });
        }
        
        const courseId = req.params.id;
        const userId = req.session.user.user_id;
        
        // Check if course exists and is published
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ? AND status = "published"',
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        // Check if user is already enrolled
        const [enrollments] = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );
        
        if (enrollments.length > 0) {
            return res.status(409).json({ error: 'Ya está inscrito en este curso' });
        }
        
        // Create enrollment
        await pool.query(
            'INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, NOW())',
            [userId, courseId]
        );
        
        res.status(201).json({ message: 'Inscripción exitosa' });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ error: 'Error al inscribirse en el curso' });
    }
}

// Export all functions
exports.getAllCourses = getAllCourses;
exports.getCourseById = getCourseById;
exports.getAvailableCourses = getAvailableCourses;
exports.getCourseDetails = getCourseDetails;
exports.enrollInCourse = enrollInCourse;
exports.getCourseModules = getCourseModules;
exports.createModule = createModule;
exports.updateModule = updateModule;
exports.deleteModule = deleteModule;
exports.getAllCategories = getAllCategories;

/**
 * Get all modules for a specific course
 */
async function getCourseModules(req, res) {
    try {
        const courseId = req.params.id;
        
        // Verify the course exists
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ?',
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        // Get modules for this course
        const [modules] = await pool.query(
            'SELECT * FROM modules WHERE course_id = ? ORDER BY position',
            [courseId]
        );
        
        // Format modules for frontend
        const formattedModules = modules.map(module => ({
            id: module.module_id,
            title: module.title,
            description: module.description,
            position: module.position,
            course_id: module.course_id,
            created_at: module.created_at,
            updated_at: module.updated_at
        }));
        
        res.json(formattedModules);
    } catch (error) {
        console.error('Error fetching course modules:', error);
        res.status(500).json({ error: 'Error al cargar los módulos del curso' });
    }
}

// Make sure to add these methods to the exports
module.exports = {
    getAllCourses,
    getCourseById,
    updateCourse,
    createCourse,
    deleteCourse,
    getAllCategories,
    getAvailableCourses,
    getCourseDetails,
    enrollInCourse,
    getCourseModules,  // Add this line
    createModule,      // Make sure this exists
    updateModule,      // Make sure this exists
    deleteModule       // Make sure this exists
};

/**
 * Create a new module for a course
 */
async function createModule(req, res) {
    try {
        const courseId = req.params.id;
        const { title, description, position } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        // Verify the course exists
        const [courses] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ?',
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        // If position is not provided, get the highest position and add 1
        let modulePosition = position;
        if (!modulePosition) {
            const [maxPosition] = await pool.query(
                'SELECT MAX(position) as max_position FROM modules WHERE course_id = ?',
                [courseId]
            );
            modulePosition = (maxPosition[0].max_position || 0) + 1;
        }
        
        // Insert the module
        const [result] = await pool.query(
            'INSERT INTO modules (course_id, title, description, position, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
            [courseId, title, description, modulePosition]
        );
        
        res.status(201).json({
            id: result.insertId,
            course_id: courseId,
            title,
            description,
            position: modulePosition
        });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ error: 'Error al crear el módulo' });
    }
}

/**
 * Update an existing module
 */
async function updateModule(req, res) {
    try {
        const courseId = req.params.id;
        const moduleId = req.params.moduleId;
        const { title, description, position } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        // Verify the module exists and belongs to the course
        const [modules] = await pool.query(
            'SELECT * FROM modules WHERE module_id = ? AND course_id = ?',
            [moduleId, courseId]
        );
        
        if (modules.length === 0) {
            return res.status(404).json({ error: 'Módulo no encontrado' });
        }
        
        // Update the module
        await pool.query(
            'UPDATE modules SET title = ?, description = ?, position = ?, updated_at = NOW() WHERE module_id = ?',
            [title, description, position, moduleId]
        );
        
        res.json({
            id: moduleId,
            course_id: courseId,
            title,
            description,
            position
        });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ error: 'Error al actualizar el módulo' });
    }
}

/**
 * Delete a module
 */
async function deleteModule(req, res) {
    try {
        const courseId = req.params.id;
        const moduleId = req.params.moduleId;
        
        // Verify the module exists and belongs to the course
        const [modules] = await pool.query(
            'SELECT * FROM modules WHERE module_id = ? AND course_id = ?',
            [moduleId, courseId]
        );
        
        if (modules.length === 0) {
            return res.status(404).json({ error: 'Módulo no encontrado' });
        }
        
        // Delete the module
        await pool.query('DELETE FROM modules WHERE module_id = ?', [moduleId]);
        
        // Reorder remaining modules
        await pool.query(
            'SET @pos := 0; UPDATE modules SET position = (@pos := @pos + 1) WHERE course_id = ? ORDER BY position',
            [courseId]
        );
        
        res.json({ message: 'Módulo eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(500).json({ error: 'Error al eliminar el módulo' });
    }
}

/**
 * Create a new course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createCourse(req, res) {
    try {
        const { title, description, category_id, status } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        // Get the user ID from the session
        const userId = req.session.user ? req.session.user.user_id : null;
        
        // If no user is logged in, return an error
        if (!userId) {
            return res.status(401).json({ error: 'Debe iniciar sesión para crear un curso' });
        }
        
        // Handle file upload
        let thumbnailFilename = null;
        if (req.file) {
            thumbnailFilename = req.file.filename;
        }
        
        // Insert the course into the database - now including created_by field
        const [result] = await pool.query(
            'INSERT INTO courses (title, description, thumbnail, category_id, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [title, description, thumbnailFilename, category_id || null, status || 'draft', userId]
        );
        
        // Get the newly created course
        const courseId = result.insertId;
        const [courses] = await pool.query(
            `SELECT 
                c.course_id as id,
                c.title,
                c.description,
                c.thumbnail,
                c.category_id,
                cc.name as category_name,
                c.status,
                c.created_at,
                c.updated_at
            FROM 
                courses c
            LEFT JOIN
                course_categories cc ON c.category_id = cc.category_id
            WHERE 
                c.course_id = ?`,
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(500).json({ error: 'Error al crear el curso' });
        }
        
        // Format the course for the response
        const course = courses[0];
        const formattedCourse = {
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.thumbnail ? `/uploads/courses/${course.thumbnail}` : null,
            category_id: course.category_id,
            category_name: course.category_name || 'Sin categoría',
            status: course.status,
            created_at: course.created_at,
            updated_at: course.updated_at
        };
        
        res.status(201).json(formattedCourse);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Error al crear el curso' });
    }
}

/**
 * Update an existing course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateCourse(req, res) {
    try {
        const courseId = req.params.id;
        const { title, description, category_id, status } = req.body;
        
        // Validate required fields
        if (!title) {
            return res.status(400).json({ error: 'El título es obligatorio' });
        }
        
        // Get the user ID from the session
        const userId = req.session.user ? req.session.user.user_id : null;
        
        // If no user is logged in, return an error
        if (!userId) {
            return res.status(401).json({ error: 'Debe iniciar sesión para actualizar un curso' });
        }
        
        // Verify the course exists
        const [existingCourses] = await pool.query(
            'SELECT * FROM courses WHERE course_id = ?',
            [courseId]
        );
        
        if (existingCourses.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        const existingCourse = existingCourses[0];
        
        // Handle file upload
        let thumbnailFilename = existingCourse.thumbnail;
        if (req.file) {
            // If there's a new file, delete the old one if it exists
            if (existingCourse.thumbnail) {
                const oldFilePath = path.join(coursesImageDir, existingCourse.thumbnail);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            thumbnailFilename = req.file.filename;
        }
        
        // Update the course in the database - note we don't update created_by
        await pool.query(
            'UPDATE courses SET title = ?, description = ?, thumbnail = ?, category_id = ?, status = ?, updated_at = NOW() WHERE course_id = ?',
            [title, description, thumbnailFilename, category_id || null, status || 'draft', courseId]
        );
        
        // Get the updated course
        const [courses] = await pool.query(
            `SELECT 
                c.course_id as id,
                c.title,
                c.description,
                c.thumbnail,
                c.category_id,
                cc.name as category_name,
                c.status,
                c.created_at,
                c.updated_at
            FROM 
                courses c
            LEFT JOIN
                course_categories cc ON c.category_id = cc.category_id
            WHERE 
                c.course_id = ?`,
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(500).json({ error: 'Error al actualizar el curso' });
        }
        
        // Format the course for the response
        const course = courses[0];
        const formattedCourse = {
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.thumbnail ? `/uploads/courses/${course.thumbnail}` : null,
            category_id: course.category_id,
            category_name: course.category_name || 'Sin categoría',
            status: course.status,
            created_at: course.created_at,
            updated_at: course.updated_at
        };
        
        res.json(formattedCourse);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
}

/**
 * Delete a course, cascada manual sobre tablas hijas
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteCourse(req, res) {
    try {
      const courseId = req.params.id;
  
      // Verificar que el curso existe
      const [courses] = await pool.query(
        'SELECT * FROM courses WHERE course_id = ?',
        [courseId]
      );
      if (courses.length === 0) {
        return res.status(404).json({ error: 'Curso no encontrado' });
      }
      const course = courses[0];
  
      // Borrar el archivo de miniatura si existe
      if (course.thumbnail) {
        const filePath = path.join(coursesImageDir, course.thumbnail);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
  
      // **Borrado manual en tablas hijas**  
      // Referencian directamente course_id:
      await pool.query(
        'DELETE FROM user_course_progress WHERE course_id = ?',
        [courseId]
      );
  
      //  Módulos de ese curso.
      //  (User-content-progress → Contents → Modules)
      await pool.query(
        `DELETE ucp
         FROM user_content_progress ucp
         JOIN contents c ON ucp.content_id = c.content_id
         JOIN modules m  ON c.module_id   = m.module_id
         WHERE m.course_id = ?`,
        [courseId]
      );
      await pool.query(
        `DELETE c
         FROM contents c
         JOIN modules m ON c.module_id = m.module_id
         WHERE m.course_id = ?`,
        [courseId]
      );
  
      // Intentos de quiz y quizzes asociados:
      await pool.query(
        `DELETE qa
         FROM quiz_attempts qa
         JOIN quizzes q ON qa.quiz_id = q.quiz_id
         JOIN modules m ON q.module_id = m.module_id
         WHERE m.course_id = ?`,
        [courseId]
      );
      await pool.query(
        `DELETE q
         FROM quizzes q
         JOIN modules m ON q.module_id = m.module_id
         WHERE m.course_id = ?`,
        [courseId]
      );
  
      // Borrar los módulos del curso
      await pool.query(
        'DELETE FROM modules WHERE course_id = ?',
        [courseId]
      );
  
      // Borrar el curso
      await pool.query(
        'DELETE FROM courses WHERE course_id = ?',
        [courseId]
      );
  
      res.json({ message: 'Curso eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting course:', error);
      res.status(500).json({ error: 'Error al eliminar el curso' });
    }
  }
  