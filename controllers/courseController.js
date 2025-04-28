const { pool } = require('../config/database');
// Import both directories from multer config
const { coursesImageDir, contentFilesDir } = require('../config/multer'); 
const path = require('path');
const fs = require('fs');

// Helper function to safely delete files
const deleteFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
        } catch (err) {
            console.error(`Error deleting file ${filePath}:`, err);
        }
    }
};

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
                (SELECT COUNT(DISTINCT ucp.user_id) 
                 FROM user_course_progress ucp 
                 JOIN users u ON ucp.user_id = u.user_id 
                 WHERE ucp.course_id = c.course_id AND u.role = 'technician') as student_count
            FROM 
                courses c
            LEFT JOIN 
                course_categories cc ON c.category_id = cc.category_id
            LEFT JOIN
                modules m ON c.course_id = m.course_id
            GROUP BY
                c.course_id, cc.name -- Include cc.name in GROUP BY if used in SELECT outside aggregate
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
                c.updated_at,
                COUNT(DISTINCT m.module_id) as lesson_count, -- Also add lesson count here
                (SELECT COUNT(DISTINCT ucp.user_id) 
                 FROM user_course_progress ucp 
                 JOIN users u ON ucp.user_id = u.user_id 
                 WHERE ucp.course_id = c.course_id AND u.role = 'technician') as student_count -- Add student count here
            FROM 
                courses c
            LEFT JOIN
                course_categories cc ON c.category_id = cc.category_id
            LEFT JOIN 
                modules m ON c.course_id = m.course_id -- Join modules to count lessons
            WHERE 
                c.course_id = ?
            GROUP BY -- Group by course details
                c.course_id, cc.name 
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
            updated_at: course.updated_at,
            lesson_count: course.lesson_count, // Include lesson count
            student_count: course.student_count // Include student count
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

// Get course modules
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

// Get module contents
async function getModuleContents(req, res) {
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
        
        // Get contents for this module - CORREGIDO: usar la tabla 'contents' en lugar de 'module_contents'
        const [contents] = await pool.query(
            'SELECT * FROM contents WHERE module_id = ? ORDER BY position',
            [moduleId]
        );
        
        // Format contents for frontend
        const formattedContents = contents.map(content => ({
            content_id: content.content_id,
            title: content.title,
            content_type_id: content.content_type_id,
            content_data: content.content_data,
            position: content.position,
            module_id: content.module_id,
            created_at: content.created_at,
            updated_at: content.updated_at
        }));
        
        res.json(formattedContents);
    } catch (error) {
        console.error('Error fetching module contents:', error);
        res.status(500).json({ error: 'Error al cargar los contenidos del módulo' });
    }
}

// Create a module
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

// Update a module
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

// Delete a module
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
        
        // Reorder remaining modules - make sure these are executed as separate queries
        await pool.query('SET @pos := 0');
        await pool.query(
            'UPDATE modules SET position = (@pos := @pos + 1) WHERE course_id = ? ORDER BY position',
            [courseId]
        );
        
        res.json({ message: 'Módulo eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(500).json({ error: 'Error al eliminar el módulo' });
    }
}

// Create a course
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

// Update a course
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

// Delete a course, cascada manual sobre tablas hijas
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
        // Use the helper function for safe deletion
        deleteFile(filePath);
      }

      // **Borrado manual en tablas hijas**
      // Referencian directamente course_id:
      await pool.query(
        'DELETE FROM user_course_progress WHERE course_id = ?',
        [courseId]
      );

      //  Módulos de ese curso.
      //  (User-content-progress → Contents → Modules)
      // Need to delete content files first
      const [contentsToDelete] = await pool.query(
        `SELECT c.content_id, c.content_type_id, c.content_data
         FROM contents c
         JOIN modules m ON c.module_id = m.module_id
         WHERE m.course_id = ? AND c.content_type_id IN (3, 4) AND c.content_data IS NOT NULL`, // Only file types
        [courseId]
      );
      for (const content of contentsToDelete) {
          const contentFilePath = path.join(__dirname, '..', content.content_data); // Path includes subdir
          deleteFile(contentFilePath);
      }

      // Now delete related records
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


module.exports = {
    getAllCourses,
    getAllCategories,
    getCourseById,
    getAvailableCourses,
    getCourseDetails,
    enrollInCourse,
    getCourseModules,
    getModuleContents,
    createModule,
    updateModule,
    deleteModule,
    createCourse,
    updateCourse,
    deleteCourse,
    createContent, // Add new functions
    updateContent,
    deleteContent
};

// --- Content CRUD Functions ---

// Create content for a module
async function createContent(req, res) {
    try {
        const { moduleId } = req.params;
        const { title, content_type_id, position } = req.body;

        // Validate required fields
        if (!title || !content_type_id || !position) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (título, tipo, posición)' });
        }

        let contentDataValue;
        const contentType = parseInt(content_type_id);

        // Handle file upload or text/URL data
        if (req.file) { // PDF or Image uploaded
            if (contentType !== 3 && contentType !== 4) {
                // Clean up uploaded file if type doesn't match
                deleteFile(req.file.path); 
                return res.status(400).json({ error: 'Tipo de contenido no coincide con el archivo subido' });
            }
            // Determine subdirectory and store the relative path
            const subDir = req.file.mimetype === 'application/pdf' ? 'pdfs' : 'images';
            contentDataValue = `/uploads/content/${subDir}/${req.file.filename}`; 
        } else { // Video or Text
            if (contentType !== 1 && contentType !== 2) {
                return res.status(400).json({ error: 'Tipo de contenido requiere un archivo (PDF o Imagen)' });
            }
            contentDataValue = req.body.content_data;
            if (!contentDataValue) {
                return res.status(400).json({ error: 'El contenido (URL o texto) es obligatorio' });
            }
        }

        // Insert content into database
        const [result] = await pool.query(
            'INSERT INTO contents (module_id, title, content_type_id, content_data, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [moduleId, title, contentType, contentDataValue, position]
        );

        res.status(201).json({
            content_id: result.insertId,
            module_id: moduleId,
            title,
            content_type_id: contentType,
            content_data: contentDataValue,
            position
        });

    } catch (error) {
        console.error('Error creating content:', error);
        // Clean up uploaded file if database insertion fails
        if (req.file) {
            deleteFile(req.file.path);
        }
        res.status(500).json({ error: 'Error al crear el contenido' });
    }
}

// Update content for a module
async function updateContent(req, res) {
    try {
        const { moduleId, contentId } = req.params;
        const { title, content_type_id, position } = req.body;

        // Validate required fields
        if (!title || !content_type_id || !position) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (título, tipo, posición)' });
        }

        // Verify content exists
        const [existingContents] = await pool.query(
            'SELECT * FROM contents WHERE content_id = ? AND module_id = ?',
            [contentId, moduleId]
        );

        if (existingContents.length === 0) {
            // Clean up uploaded file if content not found
            if (req.file) deleteFile(req.file.path);
            return res.status(404).json({ error: 'Contenido no encontrado' });
        }
        const existingContent = existingContents[0];
        const contentType = parseInt(content_type_id);
        let contentDataValue = existingContent.content_data; // Default to existing data

        // Handle file upload or text/URL data
        if (req.file) { // New PDF or Image uploaded
            if (contentType !== 3 && contentType !== 4) {
                deleteFile(req.file.path); // Clean up if type mismatch
                return res.status(400).json({ error: 'Tipo de contenido no coincide con el archivo subido' });
            }
            // Delete old file if it was a file type (using its stored path)
            if ((existingContent.content_type_id === 3 || existingContent.content_type_id === 4) && existingContent.content_data) {
                const oldFilePath = path.join(__dirname, '..', existingContent.content_data); // Path includes subdir
                deleteFile(oldFilePath);
            }
            // Determine subdirectory and store the new relative path
            const subDir = req.file.mimetype === 'application/pdf' ? 'pdfs' : 'images';
            contentDataValue = `/uploads/content/${subDir}/${req.file.filename}`;
        } else { // No new file uploaded
            if (contentType === 1 || contentType === 2) { // Video or Text
                contentDataValue = req.body.content_data;
                if (!contentDataValue) {
                    return res.status(400).json({ error: 'El contenido (URL o texto) es obligatorio' });
                }
                // If type changed from file to text/URL, delete old file (using its stored path)
                if ((existingContent.content_type_id === 3 || existingContent.content_type_id === 4) && existingContent.content_data) {
                     const oldFilePath = path.join(__dirname, '..', existingContent.content_data); // Path includes subdir
                     deleteFile(oldFilePath);
                }
            } else if (contentType === 3 || contentType === 4) {
                // Keep existing file path if type is file and no new file uploaded
                contentDataValue = existingContent.content_data; 
            }
        }

        // Update content in database
        await pool.query(
            'UPDATE contents SET title = ?, content_type_id = ?, content_data = ?, position = ?, updated_at = NOW() WHERE content_id = ?',
            [title, contentType, contentDataValue, position, contentId]
        );

        res.json({
            content_id: contentId,
            module_id: moduleId,
            title,
            content_type_id: contentType,
            content_data: contentDataValue,
            position
        });

    } catch (error) {
        console.error('Error updating content:', error);
         // Clean up uploaded file if database update fails
        if (req.file) {
            deleteFile(req.file.path);
        }
        res.status(500).json({ error: 'Error al actualizar el contenido' });
    }
}

// Delete content from a module
async function deleteContent(req, res) {
    try {
        const { contentId } = req.params;

        // Verify content exists and get its details
        const [existingContents] = await pool.query(
            'SELECT * FROM contents WHERE content_id = ?',
            [contentId]
        );

        if (existingContents.length === 0) {
            return res.status(404).json({ error: 'Contenido no encontrado' });
        }
        const contentToDelete = existingContents[0];

        // If content is PDF or Image, delete the associated file (using its stored path)
        if ((contentToDelete.content_type_id === 3 || contentToDelete.content_type_id === 4) && contentToDelete.content_data) {
             // Construct the absolute path from the project root
             const filePath = path.join(__dirname, '..', contentToDelete.content_data); // Path includes subdir
             deleteFile(filePath);
        }

        // Delete content from database
        await pool.query('DELETE FROM contents WHERE content_id = ?', [contentId]);

        res.json({ message: 'Contenido eliminado correctamente' });

    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Error al eliminar el contenido' });
    }
}
