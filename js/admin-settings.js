document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings navigation
    initSettingsNav();
    
    // Initialize save settings button
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    
    // Initialize manual backup button
    document.getElementById('manualBackup').addEventListener('click', performManualBackup);
    
    // Initialize toggle switches with saved values (if any)
    initializeFormValues();
});

/**
 * Initialize settings navigation
 */
function initSettingsNav() {
    const navItems = document.querySelectorAll('.settings-nav-item');
    const sections = document.querySelectorAll('.settings-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.style.display = 'none');
            
            // Show the target section
            const targetSection = document.getElementById(this.dataset.target);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });
}

/**
 * Initialize form values from localStorage or default values
 */
function initializeFormValues() {
    // Load saved settings from localStorage if available
    const savedSettings = JSON.parse(localStorage.getItem('whirlpoolSettings')) || {};
    
    // General settings
    if (savedSettings.general) {
        document.getElementById('siteName').value = savedSettings.general.siteName || 'Whirlpool Learning Platform';
        document.getElementById('siteDescription').value = savedSettings.general.siteDescription || 'Plataforma de aprendizaje para técnicos de Whirlpool.';
        document.getElementById('contactEmail').value = savedSettings.general.contactEmail || 'soporte@whirlpool.com';
        document.getElementById('maintenanceMode').checked = savedSettings.general.maintenanceMode || false;
    }
    
    // Appearance settings
    if (savedSettings.appearance) {
        document.getElementById('primaryColor').value = savedSettings.appearance.primaryColor || '#0066cc';
        document.getElementById('secondaryColor').value = savedSettings.appearance.secondaryColor || '#28a745';
        document.getElementById('darkMode').checked = savedSettings.appearance.darkMode || false;
    }
    
    // Notifications settings
    if (savedSettings.notifications) {
        document.getElementById('emailNotifications').checked = savedSettings.notifications.emailNotifications !== false;
        document.getElementById('newCourseNotifications').checked = savedSettings.notifications.newCourseNotifications !== false;
        document.getElementById('certificationNotifications').checked = savedSettings.notifications.certificationNotifications !== false;
        document.getElementById('courseReminders').checked = savedSettings.notifications.courseReminders || false;
    }
    
    // Security settings
    if (savedSettings.security) {
        document.getElementById('passwordPolicy').value = savedSettings.security.passwordPolicy || 'medium';
        document.getElementById('sessionTimeout').value = savedSettings.security.sessionTimeout || 30;
        document.getElementById('twoFactorAuth').checked = savedSettings.security.twoFactorAuth || false;
        document.getElementById('activityLogging').checked = savedSettings.security.activityLogging !== false;
    }
    
    // Integrations settings
    if (savedSettings.integrations) {
        document.getElementById('googleAnalyticsId').value = savedSettings.integrations.googleAnalyticsId || '';
        document.getElementById('smtpServer').value = savedSettings.integrations.smtpServer || 'smtp.whirlpool.com';
        document.getElementById('smtpPort').value = savedSettings.integrations.smtpPort || 587;
        document.getElementById('smtpUsername').value = savedSettings.integrations.smtpUsername || 'notifications@whirlpool.com';
        // We don't restore the password for security reasons
    }
    
    // Backup settings
    if (savedSettings.backup) {
        document.getElementById('autoBackups').checked = savedSettings.backup.autoBackups !== false;
        document.getElementById('backupFrequency').value = savedSettings.backup.backupFrequency || 'weekly';
        document.getElementById('backupRetention').value = savedSettings.backup.backupRetention || 30;
    }
}

/**
 * Save settings to localStorage and simulate API call
 */
function saveSettings() {
    // Show loading state
    const saveButton = document.getElementById('saveSettings');
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Guardando...';
    saveButton.disabled = true;
    
    // Collect settings from form
    const settings = {
        general: {
            siteName: document.getElementById('siteName').value,
            siteDescription: document.getElementById('siteDescription').value,
            contactEmail: document.getElementById('contactEmail').value,
            maintenanceMode: document.getElementById('maintenanceMode').checked
        },
        appearance: {
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            darkMode: document.getElementById('darkMode').checked
        },
        notifications: {
            emailNotifications: document.getElementById('emailNotifications').checked,
            newCourseNotifications: document.getElementById('newCourseNotifications').checked,
            certificationNotifications: document.getElementById('certificationNotifications').checked,
            courseReminders: document.getElementById('courseReminders').checked
        },
        security: {
            passwordPolicy: document.getElementById('passwordPolicy').value,
            sessionTimeout: document.getElementById('sessionTimeout').value,
            twoFactorAuth: document.getElementById('twoFactorAuth').checked,
            activityLogging: document.getElementById('activityLogging').checked
        },
        integrations: {
            googleAnalyticsId: document.getElementById('googleAnalyticsId').value,
            smtpServer: document.getElementById('smtpServer').value,
            smtpPort: document.getElementById('smtpPort').value,
            smtpUsername: document.getElementById('smtpUsername').value,
            // We don't save the password in localStorage for security reasons
        },
        backup: {
            autoBackups: document.getElementById('autoBackups').checked,
            backupFrequency: document.getElementById('backupFrequency').value,
            backupRetention: document.getElementById('backupRetention').value
        }
    };
    
    // Save to localStorage (in a real app, this would be an API call)
    localStorage.setItem('whirlpoolSettings', JSON.stringify(settings));
    
    // Simulate API call
    setTimeout(() => {
        // Show success message
        showNotification('Configuración guardada correctamente', 'success');
        
        // Reset button state
        saveButton.textContent = originalText;
        saveButton.disabled = false;
        
        // Apply some settings immediately (in a real app)
        applySettings(settings);
    }, 1000);
}

/**
 * Apply settings to the UI
 */
function applySettings(settings) {
    // Apply primary color
    if (settings.appearance && settings.appearance.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', settings.appearance.primaryColor);
    }
    
    // Apply secondary color (green color in the CSS)
    if (settings.appearance && settings.appearance.secondaryColor) {
        document.documentElement.style.setProperty('--green-color', settings.appearance.secondaryColor);
    }
    
    // Apply dark mode if enabled
    if (settings.appearance && settings.appearance.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

/**
 * Perform manual backup
 */
function performManualBackup() {
    // Show loading state
    const backupButton = document.getElementById('manualBackup');
    const originalText = backupButton.textContent;
    backupButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Respaldando...';
    backupButton.disabled = true;
    
    // Simulate backup process
    setTimeout(() => {
        // Create a dummy backup file (in a real app, this would be a real backup)
        const date = new Date().toISOString().slice(0, 10);
        const filename = `whirlpool_backup_${date}.sql`;
        
        // Show success message
        showNotification('Respaldo creado correctamente', 'success');
        
        // Reset button state
        backupButton.innerHTML = originalText;
        backupButton.disabled = false;
        
        // Simulate download (in a real app)
        simulateDownload(filename);
    }, 2000);
}

/**
 * Simulate file download
 */
function simulateDownload(filename) {
    // Create a dummy text content
    const content = `-- Whirlpool Learning Platform Backup\n-- Date: ${new Date().toISOString()}\n\n-- This is a simulated backup file for demonstration purposes.`;
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}