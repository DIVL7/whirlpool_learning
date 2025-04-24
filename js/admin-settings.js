document.addEventListener('DOMContentLoaded', function() {
    // Load settings
    loadSettings();
    
    // Set up event listeners
    document.getElementById('save-general-settings').addEventListener('click', function() {
        saveGeneralSettings();
    });
    
    document.getElementById('save-email-settings').addEventListener('click', function() {
        saveEmailSettings();
    });
    
    document.getElementById('save-notification-settings').addEventListener('click', function() {
        saveNotificationSettings();
    });
    
    document.getElementById('save-security-settings').addEventListener('click', function() {
        saveSecuritySettings();
    });
    
    document.getElementById('test-email-connection').addEventListener('click', function() {
        testEmailConnection();
    });
    
    document.getElementById('clear-cache').addEventListener('click', function() {
        clearCache();
    });
    
    // Theme switcher
    document.getElementById('theme-selector').addEventListener('change', function() {
        changeTheme(this.value);
    });
    
    // Language selector
    document.getElementById('language-selector').addEventListener('change', function() {
        changeLanguage(this.value);
    });
});

// Load settings from server
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
            throw new Error('Error al cargar la configuración');
        }
        
        const settings = await response.json();
        
        // Populate general settings
        document.getElementById('site-name').value = settings.general.siteName || '';
        document.getElementById('site-description').value = settings.general.siteDescription || '';
        document.getElementById('admin-email').value = settings.general.adminEmail || '';
        document.getElementById('theme-selector').value = settings.general.theme || 'light';
        document.getElementById('language-selector').value = settings.general.language || 'es';
        
        // Populate email settings
        document.getElementById('smtp-host').value = settings.email.smtpHost || '';
        document.getElementById('smtp-port').value = settings.email.smtpPort || '';
        document.getElementById('smtp-user').value = settings.email.smtpUser || '';
        document.getElementById('smtp-password').value = settings.email.smtpPassword ? '********' : '';
        document.getElementById('smtp-encryption').value = settings.email.smtpEncryption || 'tls';
        document.getElementById('from-email').value = settings.email.fromEmail || '';
        document.getElementById('from-name').value = settings.email.fromName || '';
        
        // Populate notification settings
        document.getElementById('enable-email-notifications').checked = settings.notifications.enableEmailNotifications || false;
        document.getElementById('enable-browser-notifications').checked = settings.notifications.enableBrowserNotifications || false;
        document.getElementById('notify-new-user').checked = settings.notifications.notifyNewUser || false;
        document.getElementById('notify-course-completion').checked = settings.notifications.notifyCourseCompletion || false;
        
        // Populate security settings
        document.getElementById('session-timeout').value = settings.security.sessionTimeout || 30;
        document.getElementById('max-login-attempts').value = settings.security.maxLoginAttempts || 5;
        document.getElementById('password-expiry-days').value = settings.security.passwordExpiryDays || 90;
        document.getElementById('enable-2fa').checked = settings.security.enable2FA || false;
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showError('Error al cargar la configuración. Por favor, inténtalo de nuevo.');
    }
}

// Save general settings
async function saveGeneralSettings() {
    try {
        const generalSettings = {
            siteName: document.getElementById('site-name').value,
            siteDescription: document.getElementById('site-description').value,
            adminEmail: document.getElementById('admin-email').value,
            theme: document.getElementById('theme-selector').value,
            language: document.getElementById('language-selector').value
        };
        
        const response = await fetch('/api/settings/general', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(generalSettings)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar la configuración general');
        }
        
        showSuccess('Configuración general guardada correctamente');
        
    } catch (error) {
        console.error('Error saving general settings:', error);
        showError('Error al guardar la configuración general. Por favor, inténtalo de nuevo.');
    }
}

// Save email settings
async function saveEmailSettings() {
    try {
        const emailSettings = {
            smtpHost: document.getElementById('smtp-host').value,
            smtpPort: document.getElementById('smtp-port').value,
            smtpUser: document.getElementById('smtp-user').value,
            smtpEncryption: document.getElementById('smtp-encryption').value,
            fromEmail: document.getElementById('from-email').value,
            fromName: document.getElementById('from-name').value
        };
        
        // Only include password if it's changed (not ********)
        const password = document.getElementById('smtp-password').value;
        if (password && password !== '********') {
            emailSettings.smtpPassword = password;
        }
        
        const response = await fetch('/api/settings/email', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailSettings)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar la configuración de correo');
        }
        
        showSuccess('Configuración de correo guardada correctamente');
        
    } catch (error) {
        console.error('Error saving email settings:', error);
        showError('Error al guardar la configuración de correo. Por favor, inténtalo de nuevo.');
    }
}

// Save notification settings
async function saveNotificationSettings() {
    try {
        const notificationSettings = {
            enableEmailNotifications: document.getElementById('enable-email-notifications').checked,
            enableBrowserNotifications: document.getElementById('enable-browser-notifications').checked,
            notifyNewUser: document.getElementById('notify-new-user').checked,
            notifyCourseCompletion: document.getElementById('notify-course-completion').checked
        };
        
        const response = await fetch('/api/settings/notifications', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationSettings)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar la configuración de notificaciones');
        }
        
        showSuccess('Configuración de notificaciones guardada correctamente');
        
    } catch (error) {
        console.error('Error saving notification settings:', error);
        showError('Error al guardar la configuración de notificaciones. Por favor, inténtalo de nuevo.');
    }
}

// Save security settings
async function saveSecuritySettings() {
    try {
        const securitySettings = {
            sessionTimeout: parseInt(document.getElementById('session-timeout').value),
            maxLoginAttempts: parseInt(document.getElementById('max-login-attempts').value),
            passwordExpiryDays: parseInt(document.getElementById('password-expiry-days').value),
            enable2FA: document.getElementById('enable-2fa').checked
        };
        
        const response = await fetch('/api/settings/security', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(securitySettings)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar la configuración de seguridad');
        }
        
        showSuccess('Configuración de seguridad guardada correctamente');
        
    } catch (error) {
        console.error('Error saving security settings:', error);
        showError('Error al guardar la configuración de seguridad. Por favor, inténtalo de nuevo.');
    }
}

// Test email connection
async function testEmailConnection() {
    try {
        // Show loading state
        const button = document.getElementById('test-email-connection');
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando...';
        
        const emailSettings = {
            smtpHost: document.getElementById('smtp-host').value,
            smtpPort: document.getElementById('smtp-port').value,
            smtpUser: document.getElementById('smtp-user').value,
            smtpEncryption: document.getElementById('smtp-encryption').value,
            fromEmail: document.getElementById('from-email').value,
            fromName: document.getElementById('from-name').value
        };
        
        // Only include password if it's provided
        const password = document.getElementById('smtp-password').value;
        if (password && password !== '********') {
            emailSettings.smtpPassword = password;
        }
        
        const response = await fetch('/api/settings/test-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailSettings)
        });
        
        // Reset button state
        button.disabled = false;
        button.textContent = originalText;
        
        if (!response.ok) {
            throw new Error('Error al probar la conexión de correo');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Conexión de correo exitosa. Se ha enviado un correo de prueba.');
        } else {
            showError(`Error en la conexión de correo: ${result.message}`);
        }
        
    } catch (error) {
        console.error('Error testing email connection:', error);
        
        // Reset button state
        const button = document.getElementById('test-email-connection');
        button.disabled = false;
        button.textContent = 'Probar Conexión';
        
        showError('Error al probar la conexión de correo. Por favor, verifica la configuración.');
    }
}

// Clear application cache
async function clearCache() {
    try {
        // Show loading state
        const button = document.getElementById('clear-cache');
        const originalText = button.textContent;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Limpiando...';
        
        const response = await fetch('/api/settings/clear-cache', {
            method: 'POST'
        });
        
        // Reset button state
        button.disabled = false;
        button.textContent = originalText;
        
        if (!response.ok) {
            throw new Error('Error al limpiar la caché');
        }
        
        showSuccess('Caché limpiada correctamente');
        
    } catch (error) {
        console.error('Error clearing cache:', error);
        
        // Reset button state
        const button = document.getElementById('clear-cache');
        button.disabled = false;
        button.textContent = 'Limpiar Caché';
        
        showError('Error al limpiar la caché. Por favor, inténtalo de nuevo.');
    }
}

// Change theme
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update favicon based on theme
    const favicon = document.getElementById('favicon');
    if (theme === 'dark') {
        favicon.href = '/images/favicon-dark.png';
    } else {
        favicon.href = '/images/favicon.png';
    }
}

// Change language
function changeLanguage(language) {
    localStorage.setItem('language', language);
    // In a real application, this would reload the page or update UI text
    // For now, we'll just show a message
    showSuccess(`Idioma cambiado a: ${language === 'es' ? 'Español' : 'English'}`);
}