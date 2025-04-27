document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data
    loadDashboardStats();
    loadRecentActivity();
    loadCompletionStats();
    initializeCharts();
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        console.log('%c[DASHBOARD] 🔄 Cargando estadísticas del dashboard...', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }
        
        const stats = await response.json();
        console.log('%c[DASHBOARD] ✅ Estadísticas cargadas correctamente:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', stats);
        
        // Update stats cards - Usar updateElementTextIfExists en lugar de acceder directamente
        updateElementTextIfExists('total-users', stats.totalUsers || 0);
        updateElementTextIfExists('active-courses', stats.activeCourses || 0);
        updateElementTextIfExists('completed-courses', stats.totalCompleted || 0);
        updateElementTextIfExists('total-certifications', stats.totalCertifications || 0);
        
    } catch (error) {
        console.error('%c[DASHBOARD] ❌ Error al cargar estadísticas:', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', error);
        showError('Error al cargar estadísticas del dashboard');
    }
}

// Función auxiliar para actualizar el texto de un elemento si existe
function updateElementTextIfExists(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`[DASHBOARD] ⚠️ Elemento con ID '${elementId}' no encontrado en el DOM`);
    }
}

// Load completion statistics
async function loadCompletionStats() {
    try {
        const response = await fetch('/api/dashboard/completion-stats');
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas de finalización');
        }
        
        const stats = await response.json();
        
        // Update completion stats
        document.getElementById('completion-rate').textContent = `${stats.completionRate}%`;
        document.getElementById('avg-score').textContent = stats.averageScore;
        
    } catch (error) {
        console.error('Error al cargar estadísticas de finalización:', error);
        document.getElementById('completion-rate').textContent = 'N/A';
        document.getElementById('avg-score').textContent = 'N/A';
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch('/api/dashboard/recent-activity');
        if (!response.ok) {
            throw new Error('Error al cargar actividad reciente');
        }
        
        const activities = await response.json();
        const activityList = document.getElementById('activity-list');
        
        // Clear existing activities
        activityList.innerHTML = '';
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="empty-state">No hay actividad reciente</p>';
            return;
        }
        
        // Add activities to the list (limit to 5 for minimalist view)
        activities.slice(0, 5).forEach(activity => {
            const activityItem = createActivityItem(activity);
            activityList.appendChild(activityItem);
        });
        
    } catch (error) {
        console.error('Error al cargar actividad reciente:', error);
        document.getElementById('activity-list').innerHTML = 
            '<p class="error-state">Error al cargar actividad reciente</p>';
    }
}

// Create activity item element
function createActivityItem(activity) {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    // Determine icon and color based on activity type
    let iconClass = 'fa-bell';
    let colorClass = 'blue';
    
    switch (activity.type) {
        case 'user_login':
            iconClass = 'fa-user';
            colorClass = 'green';
            break;
        case 'course_completion':
            iconClass = 'fa-graduation-cap';
            colorClass = 'orange';
            break;
        case 'new_user':
            iconClass = 'fa-user-plus';
            colorClass = 'blue';
            break;
        case 'content_update':
            iconClass = 'fa-edit';
            colorClass = 'purple';
            break;
    }
    
    // Format time ago
    const timeAgo = formatTimeAgo(new Date(activity.timestamp));
    
    activityItem.innerHTML = `
        <div class="activity-icon ${colorClass}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="activity-details">
            <p class="activity-text">${activity.description}</p>
            <p class="activity-time">${timeAgo}</p>
        </div>
    `;
    
    return activityItem;
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
        return `Hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
    } else if (diffHour > 0) {
        return `Hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
    } else if (diffMin > 0) {
        return `Hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    } else {
        return 'Justo ahora';
    }
}

// Initialize dashboard charts
function initializeCharts() {
    initCourseCompletionChart();
}

// Initialize course completion chart
function initCourseCompletionChart() {
    const ctx = document.getElementById('courseCompletionChart').getContext('2d');
    
    // Fetch data from API
    fetch('/api/dashboard/course-completion')
        .then(response => response.json())
        .then(data => {
            // Create chart with data from API
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Completado', 'En Progreso', 'No Iniciado'],
                    datasets: [{
                        data: [
                            data.completed || 2, 
                            data.inProgress || 3, 
                            data.notStarted || 0
                        ],
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.8)',
                            'rgba(255, 193, 7, 0.8)',
                            'rgba(108, 117, 125, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading course completion chart:', error);
            // Fallback data if API fails
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Completado', 'En Progreso', 'No Iniciado'],
                    datasets: [{
                        data: [2, 3, 0],
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.8)',
                            'rgba(255, 193, 7, 0.8)',
                            'rgba(108, 117, 125, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        });
}

// Utility function to show error messages
// Corregir la función showError para evitar la recursión infinita
function showError(message) {
    // Verificar si el contenedor de errores existe, si no, crearlo
    let errorContainer = document.getElementById('error-container');
    
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    }
    
    // Crear el elemento de error
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="close-error"><i class="fas fa-times"></i></button>
    `;
    
    // Agregar el error al contenedor
    errorContainer.appendChild(errorElement);
    
    // Configurar el botón para cerrar el error
    const closeButton = errorElement.querySelector('.close-error');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            errorElement.remove();
        });
    }
    
    // Eliminar automáticamente después de 5 segundos
    setTimeout(() => {
        if (errorElement && errorElement.parentNode) {
            errorElement.remove();
        }
    }, 5000);
}
    // Check if the global showError function exists
    if (typeof window.showError === 'function') {
        window.showError(message);
    } else {
        console.error(message);
        alert(message);
    }