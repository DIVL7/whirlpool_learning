document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data
    loadDashboardStats();
    loadRecentActivity();
    initializeCharts();
    
    // Set up event listeners
    document.getElementById('courseProgressFilter').addEventListener('change', function() {
        updateCourseProgressChart(this.value);
    });
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        console.log('%c[DASHBOARD] 🔄 Loading dashboard stats...', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }
        
        const stats = await response.json();
        console.log('%c[DASHBOARD] ✅ Stats loaded successfully:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', stats);
        
        // Update stats cards
        document.getElementById('total-users').textContent = stats.totalUsers || 0;
        document.getElementById('active-courses').textContent = stats.activeCourses || 0;
        document.getElementById('completed-courses').textContent = stats.totalCompleted || 0;
        document.getElementById('total-modules').textContent = stats.totalModules || 0;
        
        // Add more detailed logging to help debug
        console.log('%c[DASHBOARD] 🔍 Updated DOM elements with stats:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', {
            'total-users': stats.totalUsers,
            'active-courses': stats.activeCourses,
            'completed-courses': stats.totalCompleted,
            'total-modules': stats.totalModules
        });
        
    } catch (error) {
        console.error('%c[DASHBOARD] ❌ Error loading dashboard stats:', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', error);
        showError('Error al cargar estadísticas del dashboard');
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
        const activityList = document.querySelector('.activity-list');
        
        // Clear existing activities
        activityList.innerHTML = '';
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="empty-state">No hay actividad reciente</p>';
            return;
        }
        
        // Add activities to the list
        activities.forEach(activity => {
            const activityItem = createActivityItem(activity);
            activityList.appendChild(activityItem);
        });
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.querySelector('.activity-list').innerHTML = 
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
    
    // Format date
    const activityDate = new Date(activity.timestamp);
    const formattedDate = activityDate.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    activityItem.innerHTML = `
        <div class="activity-icon ${colorClass}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="activity-details">
            <p class="activity-text">${activity.description}</p>
            <p class="activity-time">${formattedDate}</p>
        </div>
    `;
    
    return activityItem;
}

// Initialize dashboard charts
function initializeCharts() {
    initUserRegistrationChart();
    initCourseProgressChart();
}

// Initialize user registration chart
function initUserRegistrationChart() {
    const ctx = document.getElementById('userRegistrationChart').getContext('2d');
    
    // Sample data - replace with API call in production
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const data = [5, 8, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nuevos Usuarios',
                data: data,
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
                borderColor: 'rgba(0, 102, 204, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize course progress chart
function initCourseProgressChart() {
    const ctx = document.getElementById('courseProgressChart').getContext('2d');
    
    // Sample data - replace with API call in production
    const data = {
        labels: ['Completado', 'En Progreso', 'No Iniciado'],
        datasets: [{
            data: [30, 50, 20],
            backgroundColor: [
                'rgba(40, 167, 69, 0.8)',
                'rgba(255, 193, 7, 0.8)',
                'rgba(108, 117, 125, 0.8)'
            ],
            borderWidth: 0
        }]
    };
    
    window.courseProgressChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
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
}

// Update course progress chart based on filter
function updateCourseProgressChart(filter) {
    // Sample data - replace with API call in production
    let data;
    
    switch (filter) {
        case 'refrigerator':
            data = [40, 45, 15];
            break;
        case 'washing':
            data = [25, 60, 15];
            break;
        case 'dryer':
            data = [20, 45, 35];
            break;
        default: // 'all'
            data = [30, 50, 20];
    }
    
    window.courseProgressChart.data.datasets[0].data = data;
    window.courseProgressChart.update();
}

// Eliminar la función showError existente (líneas 247-272)
// function showError(message) {
//     const errorContainer = document.createElement('div');
//     errorContainer.className = 'error-message';
//     errorContainer.innerHTML = `
//         <i class="fas fa-exclamation-circle"></i>
//         <span>${message}</span>
//     `;
//     
//     // Remove any existing error messages
//     const existingError = document.querySelector('.error-message');
//     if (existingError) {
//         existingError.remove();
//     }
//     
//     // Insert error at the top of the content
//     const contentContainer = document.querySelector('.dashboard-content');
//     contentContainer.insertBefore(errorContainer, contentContainer.firstChild);
//     
//     // Auto-remove after 5 seconds
//     setTimeout(() => {
//         errorContainer.classList.add('fade-out');
//         setTimeout(() => {
//             errorContainer.remove();
//         }, 500);
//     }, 5000);
// }