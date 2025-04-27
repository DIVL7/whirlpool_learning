// Funciones de utilidad para los módulos administrativos
// Verificamos si las funciones globales existen, de lo contrario proporcionamos implementaciones

// Función para mostrar mensajes de éxito
export const showSuccess = window.showSuccess || function(message) {
    console.log('Success:', message);
    // Si existe la función de notificación, la usamos
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'success');
    } else {
        // Implementación básica de respaldo
        const successContainer = document.createElement('div');
        successContainer.className = 'success-message';
        successContainer.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Eliminar mensajes de éxito existentes
        const existingSuccess = document.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }
        
        // Insertar en el contenido
        const contentContainer = document.querySelector('.dashboard-content');
        if (contentContainer) {
            contentContainer.insertBefore(successContainer, contentContainer.firstChild);
            
            // Auto-eliminar después de 5 segundos
            setTimeout(() => {
                successContainer.classList.add('fade-out');
                setTimeout(() => {
                    successContainer.remove();
                }, 500);
            }, 5000);
        }
    }
};

// Función para mostrar errores
export const showError = window.showError || function(message) {
    console.error('Error:', message);
    // Si existe la función de notificación, la usamos
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'error');
    } else {
        // Implementación básica de respaldo
        alert('Error: ' + message);
    }
};

// Función para mostrar notificaciones
export const showNotification = window.showNotification || function(message, type = 'info') {
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
};

// Funciones de formato de fecha
export const formatDate = window.formatDate || function(dateString) {
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
};

export const formatDateForAPI = window.formatDateForAPI || function(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
};

// Mostrar vista de selección de curso
function showCourseSelectionView() {
    const mainContent = document.querySelector('.dashboard-content');
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="page-header">
            <h1>Seleccionar Curso</h1>
            <p>Selecciona un curso para administrar sus módulos</p>
        </div>
        
        <div class="course-selection">
            <div class="course-list" id="course-list">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando cursos...</p>
                </div>
            </div>
            <div class="pagination" id="course-pagination"></div>
        </div>
    `;
    
    // Cargar cursos disponibles
    loadAvailableCourses();
}

// Función para cargar cursos disponibles (stub)
function loadAvailableCourses(page = 1) {
    // Esta función se implementará completamente en admin-modules-ui.js
    console.log('Cargando cursos disponibles, página:', page);
}

// Exportar funciones para uso en otros módulos
export { 
    showCourseSelectionView,
    loadAvailableCourses
};