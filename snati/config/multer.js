// Asegúrate de que este archivo tenga la configuración correcta para Multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define la ruta para las imágenes de cursos
const coursesImageDir = path.join(__dirname, '../uploads/courses');

// Asegúrate de que el directorio exista
if (!fs.existsSync(coursesImageDir)) {
    fs.mkdirSync(coursesImageDir, { recursive: true });
    console.log('Created directory for course images:', coursesImageDir);
}

// Configuración para almacenar imágenes de cursos
const courseStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, coursesImageDir);
    },
    filename: function(req, file, cb) {
        // Genera un nombre de archivo único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'course-' + uniqueSuffix + ext);
    }
});

// Filtro para asegurar que solo se suban imágenes
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
    }
};

// Exporta la configuración de multer para cursos
const courseUpload = multer({ 
    storage: courseStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limita a 5MB
    }
});

module.exports = {
    courseUpload,
    coursesImageDir
};