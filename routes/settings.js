const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get general settings
router.get('/general', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings WHERE setting_type = "general"');
        
        // Convert to key-value object
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        
        res.json(settings);
    } catch (error) {
        console.error('Error fetching general settings:', error);
        res.status(500).json({ error: 'Error al obtener la configuración general' });
    }
});

// Update general settings
router.put('/general', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { siteName, siteDescription, adminEmail, theme, language } = req.body;
        
        // Validate required fields
        if (!siteName || !adminEmail) {
            return res.status(400).json({ error: 'Nombre del sitio y email del administrador son requeridos' });
        }
        
        // Update settings in database
        await Promise.all([
            pool.query('INSERT INTO settings (setting_type, setting_key, setting_value) VALUES ("general", "siteName", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [siteName, siteName]),
            pool.query('INSERT INTO settings (setting_type, setting_key, setting_value) VALUES ("general", "siteDescription", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [siteDescription, siteDescription]),
            pool.query('INSERT INTO settings (setting_type, setting_key, setting_value) VALUES ("general", "adminEmail", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [adminEmail, adminEmail]),
            pool.query('INSERT INTO settings (setting_type, setting_key, setting_value) VALUES ("general", "theme", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [theme, theme]),
            pool.query('INSERT INTO settings (setting_type, setting_key, setting_value) VALUES ("general", "language", ?) ON DUPLICATE KEY UPDATE setting_value = ?', [language, language])
        ]);
        
        res.json({ message: 'Configuración general actualizada correctamente' });
    } catch (error) {
        console.error('Error updating general settings:', error);
        res.status(500).json({ error: 'Error al actualizar la configuración general' });
    }
});

// Clear cache
router.post('/clear-cache', isAuthenticated, isAdmin, (req, res) => {
    try {
        // In a real application, this would clear various caches
        // For this demo, we'll just simulate a cache clearing operation
        
        // Simulate some delay
        setTimeout(() => {
            res.json({ message: 'Caché limpiada correctamente' });
        }, 1000);
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'Error al limpiar la caché' });
    }
});

module.exports = router;