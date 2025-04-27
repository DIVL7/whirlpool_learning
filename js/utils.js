function showError(message) {
    // Usar el sistema de notificaciones para mostrar errores
    showNotification(message, 'error');
}

function showSuccess(message) {
    // Usar el sistema de notificaciones para mostrar éxitos
    showNotification(message, 'success');
}

// Función centralizada para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear contenedor de notificaciones si no existe
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Iconos según el tipo de notificación
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // Contenido de la notificación
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
    
    // Añadir notificación al contenedor
    notificationContainer.appendChild(notification);
    
    // Mostrar notificación con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configurar botón de cierre
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-eliminar después de 5 segundos
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

// Exportar las funciones para que estén disponibles globalmente
window.showError = showError;
window.showSuccess = showSuccess;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatDateForAPI = formatDateForAPI;
