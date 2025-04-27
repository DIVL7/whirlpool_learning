document.addEventListener('DOMContentLoaded', () => {
    // Inicializar la página del técnico (maneja sesión, UI, logout)
    initTechnicianPage();

    // Inicializar los componentes del dashboard
    initializeDashboard();
});

// Función para inicializar notificaciones
async function initializeNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        if (data.success) {
            // Actualizar el contador de notificaciones
            document.querySelector('.notification-count').textContent = data.unreadCount;
            
            // Configurar el evento de clic en el icono de notificaciones
            document.querySelector('.notifications').addEventListener('click', () => {
                showNotificationsPanel(data.notifications);
            });
        }
    } catch (error) {
        console.error('Error initializing notifications:', error);
    }
}

// Función para mostrar el panel de notificaciones
function showNotificationsPanel(notifications) {
    // Crear el panel de notificaciones si no existe
    let panel = document.getElementById('notifications-panel');
    
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'notifications-panel';
        panel.className = 'notifications-panel';
        document.body.appendChild(panel);
        
        // Agregar estilos al panel
        const style = document.createElement('style');
        style.textContent = `
            .notifications-panel {
                position: fixed;
                top: 70px;
                right: 30px;
                width: 350px;
                max-height: 500px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .notifications-header {
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid var(--light-gray-color);
            }
            
            .notifications-title {
                font-size: 1.1rem;
                font-weight: 600;
                margin: 0;
            }
            
            .notifications-actions {
                display: flex;
                gap: 10px;
            }
            
            .notifications-action {
                background: none;
                border: none;
                color: var(--primary-color);
                cursor: pointer;
                font-size: 0.9rem;
            }
            
            .notifications-list {
                flex: 1;
                overflow-y: auto;
                max-height: 400px;
            }
            
            .notification-item {
                padding: 12px 15px;
                border-bottom: 1px solid var(--light-gray-color);
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            
            .notification-item:hover {
                background-color: var(--light-color);
            }
            
            .notification-item.unread {
                position: relative;
            }
            
            .notification-item.unread::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 5px;
                transform: translateY(-50%);
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: var(--primary-color);
            }
            
            .notification-item.unread {
                padding-left: 20px;
                background-color: rgba(0, 102, 204, 0.05);
            }
            
            .notification-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .notification-title {
                font-weight: 600;
                font-size: 0.9rem;
            }
            
            .notification-time {
                font-size: 0.8rem;
                color: var(--gray-color);
            }
            
            .notification-message {
                font-size: 0.85rem;
                color: var(--gray-color);
            }
            
            .notification-footer {
                padding: 10px 15px;
                text-align: center;
                border-top: 1px solid var(--light-gray-color);
            }
            
            .notification-footer a {
                color: var(--primary-color);
                font-size: 0.9rem;
            }
            
            .notification-empty {
                padding: 30px 15px;
                text-align: center;
                color: var(--gray-color);
            }
            
            /* Indicadores de tipo */
            .notification-item.info { border-left: 3px solid var(--primary-color); }
            .notification-item.success { border-left: 3px solid var(--success-color); }
            .notification-item.warning { border-left: 3px solid var(--accent-color); }
            .notification-item.error { border-left: 3px solid var(--error-color); }
        `;
        document.head.appendChild(style);
    }
    
    // Limpiar y actualizar el contenido del panel
    panel.innerHTML = `
        <div class="notifications-header">
            <h3 class="notifications-title">Notificaciones</h3>
            <div class="notifications-actions">
                <button class="notifications-action mark-all">Marcar todas como leídas</button>
                <button class="notifications-action close-panel">Cerrar</button>
            </div>
        </div>
        <div class="notifications-list">
            ${notifications.length > 0 ? 
                notifications.map(notification => `
                    <div class="notification-item ${notification.type} ${!notification.is_read ? 'unread' : ''}" data-id="${notification.notification_id}">
                        <div class="notification-header">
                            <span class="notification-title">${notification.title}</span>
                            <span class="notification-time">${notification.formatted_date}</span>
                        </div>
                        <div class="notification-message">${notification.message}</div>
                    </div>
                `).join('') 
                : 
                '<div class="notification-empty">No tienes notificaciones</div>'
            }
        </div>
        <div class="notification-footer">
            <a href="notifications.html">Ver todas las notificaciones</a>
        </div>
    `;
    
    // Agregar event listeners
    // Cerrar panel
    panel.querySelector('.close-panel').addEventListener('click', () => {
        document.body.removeChild(panel);
    });
    
    // Marcar todas como leídas
    panel.querySelector('.mark-all').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Actualizar la interfaz
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
                
                // Actualizar el contador
                document.querySelector('.notification-count').textContent = '0';
                
                showNotification('Todas las notificaciones han sido marcadas como leídas', 'success');
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            showNotification('Error al marcar notificaciones como leídas', 'error');
        }
    });
    
    // Marcar notificación individual como leída al hacer clic
    panel.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async function() {
            const notificationId = this.dataset.id;
            
            try {
                const response = await fetch('/api/notifications/mark-read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ notificationId })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Marcar como leída en la interfaz
                    this.classList.remove('unread');
                    
                    // Actualizar el contador
                    const currentCount = parseInt(document.querySelector('.notification-count').textContent);
                    if (currentCount > 0) {
                        document.querySelector('.notification-count').textContent = currentCount - 1;
                    }
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        });
    });
    
    // Cerrar el panel cuando se hace clic fuera de él
    document.addEventListener('click', function(event) {
        if (panel && !panel.contains(event.target) && !document.querySelector('.notifications').contains(event.target)) {
            if (document.body.contains(panel)) {
                document.body.removeChild(panel);
            }
        }
    });
}

// Añade la llamada a esta función en initializeDashboard():
async function initializeDashboard() {
    // Cargar datos del usuario
    await loadUserStats();
    
    // Inicializar gráficos
    initializeCharts();
    
    // Cargar actividad reciente
    loadRecentActivity();
    
    // Cargar próximos cursos
    loadUpcomingCourses();
    
    // Cargar cursos en progreso
    loadInProgressCourses();

    // Inicializar notificaciones
    initializeNotifications();
}

// Función para inicializar el dashboard
async function initializeDashboard() {
    // Cargar datos del usuario
    await loadUserStats();

    // Inicializar gráficos
    initializeCharts();

    // Cargar actividad reciente
    loadRecentActivity();

    // Cargar próximos cursos
    loadUpcomingCourses();

    // Cargar cursos en progreso
    await loadInProgressCourses();
}

// Función para cargar estadísticas del usuario
async function loadUserStats() {
    try {
        const response = await fetch('/api/technician/stats');
        const data = await response.json();
        
        if (data.success) {
            // Actualizar widgets con datos reales
            document.getElementById('courses-count').textContent = data.coursesAssigned || 0;
            document.getElementById('completed-count').textContent = data.coursesCompleted || 0;
            document.getElementById('certification-count').textContent = data.certifications || 0;
            
            // Actualizar tendencias
            document.getElementById('courses-trend').textContent = data.coursesTrend || '0%';
            document.getElementById('completed-trend').textContent = data.completedTrend || '0%';
            document.getElementById('certification-trend').textContent = data.certificationTrend || '0%';
            
            // Actualizar clases de tendencia (arriba/abajo)
            updateTrendClasses('courses-trend', data.coursesTrend);
            updateTrendClasses('completed-trend', data.completedTrend);
            updateTrendClasses('certification-trend', data.certificationTrend);
            
            // Actualizar conteo de notificaciones
            document.querySelector('.notification-count').textContent = data.notifications || 0;
        } else {
            console.error('Error loading user stats:', data.error);
            // Mostrar datos simulados en caso de error
            showSimulatedData();
        }
    } catch (error) {
        console.error('Error fetching user stats:', error);
        // Mostrar datos simulados en caso de error
        showSimulatedData();
    }
}

// Función para actualizar las clases de tendencia
function updateTrendClasses(elementId, trendValue) {
    const trendElement = document.getElementById(elementId).parentElement;
    const trendIcon = trendElement.querySelector('i');
    
    // Convertir string de tendencia a número
    const trendNumber = parseInt(trendValue) || 0;
    
    // Actualizar clases basadas en el valor
    if (trendNumber >= 0) {
        trendElement.classList.remove('down');
        trendElement.classList.add('up');
        trendIcon.classList.remove('fa-arrow-down');
        trendIcon.classList.add('fa-arrow-up');
    } else {
        trendElement.classList.remove('up');
        trendElement.classList.add('down');
        trendIcon.classList.remove('fa-arrow-up');
        trendIcon.classList.add('fa-arrow-down');
    }
}

// Función para mostrar datos simulados (fallback)
function showSimulatedData() {
    // Widgets
    document.getElementById('courses-count').textContent = Math.floor(Math.random() * 10) + 5;
    document.getElementById('completed-count').textContent = Math.floor(Math.random() * 5) + 1;
    document.getElementById('certification-count').textContent = Math.floor(Math.random() * 3) + 1;
    
    // Tendencias
    const trendsCourses = Math.floor(Math.random() * 20) - 5;
    const trendsCompleted = Math.floor(Math.random() * 20) - 5;
    const trendsCertification = Math.floor(Math.random() * 20) - 5;
    
    document.getElementById('courses-trend').textContent = `${trendsCourses}%`;
    document.getElementById('completed-trend').textContent = `${trendsCompleted}%`;
    document.getElementById('certification-trend').textContent = `${trendsCertification}%`;
    
    // Actualizar clases de tendencia
    updateTrendClasses('courses-trend', trendsCourses);
    updateTrendClasses('completed-trend', trendsCompleted);
    updateTrendClasses('certification-trend', trendsCertification);
    
    // Notificaciones
    document.querySelector('.notification-count').textContent = Math.floor(Math.random() * 5);
}

// Función para inicializar los gráficos
function initializeCharts() {
    initializeProgressChart();
    initializeCourseStatusChart();
}

// Función para inicializar el gráfico de progreso
async function initializeProgressChart() {
    try {
        // Intentar cargar datos reales
        const response = await fetch('/api/technician/progress-chart');
        const chartData = await response.json();
        
        if (chartData.success) {
            createProgressChart(chartData.labels, chartData.datasets);
        } else {
            // Usar datos simulados si hay error
            createProgressChartWithSimulatedData();
        }
    } catch (error) {
        console.error('Error loading progress chart data:', error);
        // Usar datos simulados si hay error
        createProgressChartWithSimulatedData();
    }
}

// Función para crear el gráfico de progreso con datos reales
function createProgressChart(labels, datasets) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Actividad'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createProgressChartWithSimulatedData() {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas de estudio',
                data: labels.map(() => Math.floor(Math.random() * 5) + 1),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Cuestionarios completados',
                data: labels.map(() => Math.floor(Math.random() * 3)),
                borderColor: '#16a34a',
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
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
                    title: {
                        display: true,
                        text: 'Actividad'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Día'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Función para inicializar el gráfico de estado de cursos
async function initializeCourseStatusChart() {
    try {
        // Intentar cargar datos reales
        const response = await fetch('/api/technician/course-status');
        const chartData = await response.json();
        
        if (chartData.success) {
            createCourseStatusChart(chartData.data);
        } else {
            // Usar datos simulados si hay error
            createCourseStatusChartWithSimulatedData();
        }
    } catch (error) {
        console.error('Error loading course status chart data:', error);
        // Usar datos simulados si hay error
        createCourseStatusChartWithSimulatedData();
    }
}

// Función para crear el gráfico de estado de cursos con datos reales
function createCourseStatusChart(data) {
    const ctx = document.getElementById('courseStatusChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['No Iniciado', 'En Progreso', 'Completado'],
            datasets: [{
                data: [data.notStarted, data.inProgress, data.completed],
                backgroundColor: ['#6b7280', '#eab308', '#16a34a'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Cambiado a true para mantener proporción
            cutout: '70%',
            layout: {
                padding: 0
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createCourseStatusChartWithSimulatedData() {
    const ctx = document.getElementById('courseStatusChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['No Iniciado', 'En Progreso', 'Completado'],
            datasets: [{
                data: [
                    Math.floor(Math.random() * 5) + 1,
                    Math.floor(Math.random() * 3) + 1,
                    Math.floor(Math.random() * 2) + 1
                ],
                backgroundColor: ['#6b7280', '#eab308', '#16a34a'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true, // Cambiado a true para mantener proporción
            cutout: '70%',
            layout: {
                padding: 0
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Función para cargar actividad reciente
async function loadRecentActivity() {
    const activityList = document.getElementById('activity-list');
    
    try {
        // Intentar cargar datos reales
        const response = await fetch('/api/technician/recent-activity');
        const data = await response.json();
        
        // Limpiar el elemento
        activityList.innerHTML = '';
        
        if (data.success && data.activities.length > 0) {
            // Mostrar actividades reales
            data.activities.forEach(activity => {
                const li = document.createElement('li');
                li.innerHTML = `${activity.description} <span class="activity-time">${activity.timeAgo}</span>`;
                activityList.appendChild(li);
            });
        } else {
            // Mostrar mensaje si no hay actividades
            const li = document.createElement('li');
            li.textContent = 'No hay actividad reciente que mostrar.';
            activityList.appendChild(li);
            
            // Agregar algunas actividades simuladas para la demo
            addSimulatedActivities(activityList);
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        
        // Limpiar el elemento
        activityList.innerHTML = '';
        
        // Mostrar actividades simuladas en caso de error
        addSimulatedActivities(activityList);
    }
}

// Función para agregar actividades simuladas
function addSimulatedActivities(activityList) {
    const activities = [
        { text: 'Completaste la lección "Introducción a los refrigeradores"', time: 'Hace 2 horas' },
        { text: 'Obtuviste una calificación de 85% en el quiz "Componentes básicos"', time: 'Hace 1 día' },
        { text: 'Comenzaste el curso "Mantenimiento de Lavadoras"', time: 'Hace 2 días' },
        { text: 'El instructor respondió a tu pregunta en el foro', time: 'Hace 3 días' }
    ];
    
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.innerHTML = `${activity.text} <span class="activity-time">${activity.time}</span>`;
        activityList.appendChild(li);
    });
}

// Función para cargar próximos cursos
async function loadUpcomingCourses() {
    const coursesContainer = document.getElementById('upcoming-courses');
    
    try {
        // Intentar cargar datos reales
        const response = await fetch('/api/technician/upcoming-courses');
        const data = await response.json();
        
        // Limpiar el contenedor
        coursesContainer.innerHTML = '';
        
        if (data.success && data.courses.length > 0) {
            // Mostrar cursos reales
            data.courses.forEach(course => {
                const courseCard = createCourseCard(course);
                coursesContainer.appendChild(courseCard);
            });
        } else {
            // Mostrar mensaje si no hay cursos
            coursesContainer.innerHTML = '<p class="no-data-message">No hay próximos cursos asignados.</p>';
            
            // Agregar algunos cursos simulados para la demo
            addSimulatedCourses(coursesContainer);
        }
    } catch (error) {
        console.error('Error loading upcoming courses:', error);
        
        // Limpiar el contenedor
        coursesContainer.innerHTML = '';
        
        // Mostrar cursos simulados en caso de error
        addSimulatedCourses(coursesContainer);
    }
}

// Función para crear una tarjeta de curso
function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    // Determinar el estado del curso
    let statusClass = '';
    let statusText = '';
    
    switch (course.status) {
        case 'not_started':
            statusClass = 'status-not-started';
            statusText = 'No iniciado';
            break;
        case 'in_progress':
            statusClass = 'status-in-progress';
            statusText = 'En progreso';
            break;
        case 'completed':
            statusClass = 'status-completed';
            statusText = 'Completado';
            break;
        default:
            statusClass = 'status-not-started';
            statusText = 'No iniciado';
    }
    
    card.innerHTML = `
        <div class="course-image">
            <img src="${course.thumbnail ? '../images/courses/' + course.thumbnail : '../images/course-default.jpg'}" alt="${course.title}">
            <span class="course-status ${statusClass}">${statusText}</span>
        </div>
        <div class="course-info">
            <h4>${course.title}</h4>
            <p>${course.description || 'Sin descripción'}</p>
            <div class="course-footer">
                <div class="course-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${course.progress || 0}%"></div>
                    </div>
                    <span>${course.progress || 0}%</span>
                </div>
                <a href="course-details.html?id=${course.id}" class="btn-primary">Ver Curso</a>
            </div>
        </div>
    `;
    
    return card;
}

// Función para agregar cursos simulados
function addSimulatedCourses(container) {
    const courses = [
        {
            id: 1,
            title: 'Refrigerator Repair Basics',
            description: 'Aprende los fundamentos de la reparación de refrigeradores',
            thumbnail: null,
            status: 'in_progress',
            progress: 45
        },
        {
            id: 2,
            title: 'Washing Machine Troubleshooting',
            description: 'Técnicas avanzadas de solución de problemas para lavadoras',
            thumbnail: null,
            status: 'not_started',
            progress: 0
        },
        {
            id: 3,
            title: 'Dryer Maintenance',
            description: 'Procedimientos esenciales de mantenimiento para secadoras',
            thumbnail: null,
            status: 'not_started',
            progress: 0
        }
    ];
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Agregar cursos simulados
    courses.forEach(course => {
        const courseCard = createCourseCard(course);
        container.appendChild(courseCard);
    });
}

// Carga los últimos cursos en progreso y los muestra en la lista
async function loadInProgressCourses() {
    try {
        const resp = await fetch('/api/technician/courses', {
            credentials: 'same-origin'
        });
        const data = await resp.json();
        if (!data.success) return;

        const inProg = data.courses.filter(c => c.status === 'in_progress');
        const ul = document.getElementById('in-progress-list');
        ul.innerHTML = ''; // Limpiar lista existente

        if (inProg.length === 0) {
            ul.innerHTML = '<li class="no-courses">No tienes cursos en progreso.</li>';
            return;
        }

        inProg.slice(0, 4).forEach(c => { // Mostrar máximo 4
            const li = document.createElement('li');
            li.className = 'in-progress-item'; // Asegúrate que esta clase exista en CSS
            li.innerHTML = `
                <span class="course-title">${c.title}</span>
                <div class="small-progress-bar">
                    <div class="small-progress-fill" style="width: ${c.progress}%"></div>
                </div>
                <span class="progress-percent">${c.progress}%</span>
            `;

            // Añadir evento para ir al curso
            li.addEventListener('click', () => {
                window.location.href = `course-content.html?id=${c.id}`;
            });

            ul.appendChild(li);
        });
    } catch (err) {
        console.error('Error cargando cursos en progreso:', err);
        // Opcional: Mostrar mensaje de error en la UI
        const ul = document.getElementById('in-progress-list');
        if (ul) {
            ul.innerHTML = '<li class="error-message">Error al cargar cursos en progreso.</li>';
        }
    }
}


// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Asegurarse que esta función exista, ya sea aquí o en un archivo común como technician-common.js
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Determinar el icono según el tipo
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Agregar la notificación al contenedor
    container.appendChild(notification);
    
    // Configurar el botón de cierre
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    });
    
    // Eliminar automáticamente después de 5 segundos
    setTimeout(() => {
        if (container.contains(notification)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}
