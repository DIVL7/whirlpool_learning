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

// --- Nueva configuración para contenido de módulos (PDF/Imagen) ---

// Define las rutas para los archivos de contenido (separadas)
const contentBaseDir = path.join(__dirname, '../uploads/content');
const contentPdfDir = path.join(contentBaseDir, 'pdfs');
const contentImageDir = path.join(contentBaseDir, 'images');

// Asegúrate de que los directorios existan
[contentBaseDir, contentPdfDir, contentImageDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Configuración para almacenar archivos de contenido
const contentStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Dirigir a la carpeta correcta según el tipo de archivo
        if (file.mimetype === 'application/pdf') {
            cb(null, contentPdfDir);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, contentImageDir);
        } else {
            // Si llega otro tipo de archivo (aunque el filtro debería prevenirlo)
            cb(new Error('Tipo de archivo no soportado para almacenamiento directo'), false); 
        }
    },
    filename: function(req, file, cb) {
        // Genera un nombre de archivo único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        // Usar un prefijo diferente para contenido
        cb(null, 'content-' + uniqueSuffix + ext); 
    }
});

// Filtro para asegurar que solo se suban PDF o imágenes
const contentFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF o de imagen'), false);
    }
};

// Exporta la configuración de multer para contenido
const contentUpload = multer({ 
    storage: contentStorage,
    fileFilter: contentFilter,
    limits: {
        // Ajustar límite si es necesario (ej. 10MB para PDF)
        fileSize: 10 * 1024 * 1024 
    }
});


// --- Avatar upload configuration removed ---


module.exports = {
    courseUpload,
    coursesImageDir,
    contentUpload, 
    contentPdfDir, 
    contentImageDir
    // avatarUpload and avatarsDir removed
};
