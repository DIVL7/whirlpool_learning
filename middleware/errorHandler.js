const multer = require('multer');

// Error handling middleware
function errorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        return res.status(400).json({ 
            error: 'Error al subir la imagen: ' + err.message,
            field: err.field
        });
    } else if (err) {
        // An unknown error occurred
        console.error('Unknown error:', err);
        return res.status(500).json({ 
            error: 'Error del servidor: ' + err.message 
        });
    }
    next();
}

module.exports = errorHandler;