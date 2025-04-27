/**
 * Shared utility functions for the Whirl platform
 */

// Reemplazar con una función que use showNotification
// Reemplazar todas las funciones showError en el proyecto
function showError(message) {
    // Eliminar cualquier mensaje de error estático existente
    const existingErrors = document.querySelectorAll('.error-message');
    if (existingErrors.length > 0) {
        existingErrors.forEach(error => error.remove());
    }
    
    // Usar el sistema de notificaciones para mostrar errores
    showNotification(message, 'error');
}

// Display success message
function showSuccess(message) {
    const successContainer = document.createElement('div');
    successContainer.className = 'success-message';
    successContainer.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Insert success at the top of the content
    const contentContainer = document.querySelector('.dashboard-content');
    contentContainer.insertBefore(successContainer, contentContainer.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        successContainer.classList.add('fade-out');
        setTimeout(() => {
            successContainer.remove();
        }, 500);
    }, 5000);
}

// Show notification
// Asegurarnos de que la función showNotification esté definida
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icons based on notification type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // Notification content
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <div class="notification-text">
                <p>${message}</p>
            </div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configure close button
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date for API
function formatDateForAPI(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
}

// Export functions to global scope for use in HTML files
window.showError = showError;
window.showSuccess = showSuccess;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatDateForAPI = formatDateForAPI;