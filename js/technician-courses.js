let allCourses = [];
let currentPage = 1;
const coursesPerPage = 6;

document.addEventListener('DOMContentLoaded', () => {
    // Comprobar si el usuario está autenticado
    checkUserSession();

    // Inicializar componentes
    initializeEventListeners();

    // Configurar el botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

// Función para comprobar la sesión del usuario
async function checkUserSession() {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();

        if (!data.loggedIn) {
            // Redirigir al inicio de sesión si no hay sesión
            window.location.href = '../index.html';
            return;
        }

        // Si el usuario no es técnico, redirigir a la página adecuada
        if (data.user.role !== 'technician') {
            window.location.href = `../${data.user.role}/dashboard.html`;
            return;
        }

        // Actualizar la interfaz con los datos del usuario
        updateUserInterface(data.user);

        // Cargar los cursos del usuario
        loadUserCourses();
    } catch (error) {
        console.error('Error checking session:', error);
        showNotification('Error al verificar la sesión. Por favor, recarga la página.', 'error');
    }
}

// Función para actualizar la interfaz con los datos del usuario
function updateUserInterface(user) {
    document.getElementById('user-name').textContent = user.username;

    // Si hay una imagen de perfil, actualizarla
    if (user.profile_picture) {
        document.getElementById('user-avatar').src = `../images/${user.profile_picture}`;
    }
}

// Función para manejar el cierre de sesión
async function handleLogout(event) {
    event.preventDefault();

    try {
        const response = await fetch('/api/logout');
        const data = await response.json();

        if (data.success) {
            window.location.href = '../index.html';
        } else {
            showNotification('Error al cerrar sesión', 'error');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
}

// Función para inicializar los event listeners
function initializeEventListeners() {
    // Búsqueda de cursos
    document.getElementById('course-search').addEventListener('input', filterCourses);

    // Filtrado y ordenación de cursos
    document.getElementById('course-filter').addEventListener('change', filterCourses);
    document.getElementById('sort-courses').addEventListener('change', filterCourses);

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            document.getElementById('certificate-modal').classList.remove('show');
        });
    });
}

// Función para cargar los cursos del usuario
async function loadUserCourses() {
    console.log('Intentando cargar cursos desde:', '/api/technician/courses');

    // Mostrar estado de carga
    document.getElementById('courses-container').innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p>Cargando cursos...</p>
        </div>
    `;

    try {
        console.log('Solicitando cursos a la API...');
        
        // Forzar petición fresca, sin caché
        const response = await fetch('/api/technician/courses', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            credentials: 'same-origin'
        });

        console.log('Respuesta de la API:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Datos recibidos en el frontend:', JSON.stringify(data));

        // Verificar que la respuesta tenga el formato esperado
        if (data && data.success === true && Array.isArray(data.courses)) {
            allCourses = data.courses;
            console.log('Datos cargados correctamente:', allCourses);
            
            // Actualizar interfaz con los datos
            updateCourseStats(allCourses);
            displayCourses(allCourses, currentPage);
            
            // Mostrar notificación de éxito
            showNotification(`Se han cargado ${allCourses.length} cursos de la base de datos`, 'success');
        } else {
            console.error('Formato de respuesta incorrecto:', data);
            throw new Error('Formato de respuesta incorrecto');
        }
    } catch (error) {
        console.error('Error al cargar los cursos:', error);
        showNotification('Error al cargar los cursos. Mostrando datos de ejemplo.', 'warning');
        
        // Cargar datos de ejemplo como fallback
        loadFallbackCourses();
    }
}

// Función para cargar cursos de ejemplo en caso de error
function loadFallbackCourses() {
    console.log('Cargando cursos de ejemplo como fallback');
    
    // Cursos de ejemplo
    const fallbackCourses = [
        {
            id: 1,
            title: 'Introducción a Whirlpool',
            description: 'Conoce los fundamentos de nuestra empresa, productos y valores.',
            thumbnail: null,
            status: 'completed',
            progress: 100,
            score: 95
        },
        {
            id: 2,
            title: 'Mantenimiento de Lavadoras',
            description: 'Guía completa para el mantenimiento básico y avanzado de lavadoras.',
            thumbnail: null,
            status: 'in_progress',
            progress: 65,
            score: null
        },
        {
            id: 3,
            title: 'Reparación de Refrigeradores',
            description: 'Aprende a solucionar problemas comunes en refrigeradores.',
            thumbnail: null,
            status: 'not_started',
            progress: 0,
            score: null
        },
        {
            id: 4,
            title: 'Atención al Cliente Whirlpool',
            description: 'Mejora tus habilidades de atención al cliente y resolución de problemas.',
            thumbnail: null,
            status: 'completed',
            progress: 100,
            score: 90
        },
        {
            id: 5,
            title: 'Diagnóstico de Hornos',
            description: 'Técnicas avanzadas para diagnosticar y reparar hornos.',
            thumbnail: null,
            status: 'not_started',
            progress: 0,
            score: null
        },
        {
            id: 6,
            title: 'Instalación de Lavavajillas',
            description: 'Guía paso a paso para la correcta instalación de lavavajillas.',
            thumbnail: null,
            status: 'in_progress',
            progress: 30,
            score: null
        },
        {
            id: 7,
            title: 'Reparación de Secadoras',
            description: 'Diagnóstico y solución de problemas comunes en secadoras.',
            thumbnail: null,
            status: 'not_started',
            progress: 0,
            score: null
        }
    ];

    // Actualizar la variable global de cursos
    allCourses = fallbackCourses;

    // Actualizar estadísticas de cursos
    updateCourseStats(allCourses);

    // Mostrar los cursos
    displayCourses(allCourses, currentPage);
}

// Función para actualizar las estadísticas de cursos
function updateCourseStats(courses) {
    const totalCourses = courses.length;
    const inProgressCourses = courses.filter(course => course.status === 'in_progress').length;
    const completedCourses = courses.filter(course => course.status === 'completed').length;

    document.getElementById('total-courses').textContent = totalCourses;
    document.getElementById('in-progress-courses').textContent = inProgressCourses;
    document.getElementById('completed-courses').textContent = completedCourses;
}

// Función para mostrar los cursos en la interfaz
function displayCourses(courses, page) {
    const container = document.getElementById('courses-container');

    console.log('Mostrando cursos:', courses);

    // Calcular los índices de inicio y fin para la paginación
    const startIndex = (page - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const paginatedCourses = courses.slice(startIndex, endIndex);

    console.log('Cursos paginados:', paginatedCourses);

    // Limpiar el contenedor
    container.innerHTML = '';

    if (courses.length === 0) {
        container.innerHTML = `
            <div class="no-courses-message">
                <i class="fas fa-search"></i>
                <h3>No se encontraron cursos</h3>
                <p>Intenta con otra búsqueda o consulta con tu administrador.</p>
            </div>
        `;
        return;
    }

    // Obtener el template
    const template = document.getElementById('course-card-template');
    console.log('Template encontrado:', template !== null);

    // Crear una tarjeta para cada curso
    paginatedCourses.forEach(course => {
        const card = template.content.cloneNode(true);

        // Configurar los datos del curso
        card.querySelector('.course-card').dataset.status = course.status;

        // Imagen del curso
        const courseImage = card.querySelector('.course-image img');
        courseImage.src = course.thumbnail ? `../images/courses/${course.thumbnail}` : '../images/course-default.jpg';
        courseImage.alt = course.title;

        // Estado del curso
        const statusElement = card.querySelector('.course-status');
        switch (course.status) {
            case 'completed':
                statusElement.textContent = 'Completado';
                statusElement.classList.add('status-completed');
                break;
            case 'in_progress':
                statusElement.textContent = 'En progreso';
                statusElement.classList.add('status-in-progress');
                break;
            default:
                statusElement.textContent = 'No iniciado';
                statusElement.classList.add('status-not-started');
        }

        // Detalles del curso
        card.querySelector('.course-title').textContent = course.title;
        card.querySelector('.course-description').textContent = course.description;

        // Progreso
        const progressFill = card.querySelector('.progress-fill');
        progressFill.style.width = `${course.progress}%`;
        card.querySelector('.progress-text').textContent = `${course.progress}%`;

        // Botón de acción
        const actionButton = card.querySelector('.course-button');
        if (course.status === 'completed') {
            actionButton.textContent = 'Ver Certificado';
            actionButton.classList.add('btn-certificate');
            actionButton.dataset.courseId = course.id;
            actionButton.addEventListener('click', () => showCertificate(course));
        } else if (course.status === 'in_progress') {
            actionButton.textContent = 'Continuar';
            actionButton.classList.add('btn-continue');
            actionButton.addEventListener('click', () => continueCourse(course.id));
        } else {
            actionButton.textContent = 'Empezar';
            actionButton.classList.add('btn-start');
            actionButton.addEventListener('click', () => startCourse(course.id));
        }

        // Añadir la tarjeta al contenedor
        container.appendChild(card);
    });

    // Actualizar la paginación
    updatePagination(courses.length, page);
}

// Función para actualizar la paginación
function updatePagination(totalCourses, currentPage) {
    const paginationContainer = document.getElementById('pagination-container');
    const totalPages = Math.ceil(totalCourses / coursesPerPage);

    // No mostrar paginación si hay una sola página
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Botón anterior
    paginationHTML += `
        <button class="pagination-button prev-page" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Números de página
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajustar si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Primera página y puntos suspensivos
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-button" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Páginas visibles
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-button ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    // Última página y puntos suspensivos
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-button" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Botón siguiente
    paginationHTML += `
        <button class="pagination-button next-page" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Añadir event listeners
    paginationContainer.querySelectorAll('.pagination-button[data-page]').forEach(button => {
        button.addEventListener('click', () => {
            const page = parseInt(button.dataset.page);
            currentPage = page;
            displayCourses(getFilteredCourses(), currentPage);
            window.scrollTo(0, 0);
        });
    });

    // Botones anterior y siguiente
    const prevButton = paginationContainer.querySelector('.prev-page');
    const nextButton = paginationContainer.querySelector('.next-page');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayCourses(getFilteredCourses(), currentPage);
                window.scrollTo(0, 0);
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayCourses(getFilteredCourses(), currentPage);
                window.scrollTo(0, 0);
            }
        });
    }
}

// Función para filtrar y ordenar cursos
function filterCourses() {
    // Restablecer a la primera página cuando se aplica un filtro
    currentPage = 1;

    // Mostrar los cursos filtrados
    displayCourses(getFilteredCourses(), currentPage);
}

// Función para obtener los cursos filtrados según los criterios actuales
function getFilteredCourses() {
    const searchTerm = document.getElementById('course-search').value.toLowerCase();
    const statusFilter = document.getElementById('course-filter').value;
    const sortOption = document.getElementById('sort-courses').value;

    // Filtrar por término de búsqueda y estado
    let filteredCourses = allCourses.filter(course => {
        const matchesSearch =
            course.title.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm);

        const matchesStatus =
            statusFilter === 'all' ||
            course.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Ordenar cursos
    filteredCourses.sort((a, b) => {
        switch (sortOption) {
            case 'name_asc':
                return a.title.localeCompare(b.title);
            case 'name_desc':
                return b.title.localeCompare(a.title);
            case 'progress_asc':
                return a.progress - b.progress;
            case 'progress_desc':
                return b.progress - a.progress;
            default:
                return 0;
        }
    });

    return filteredCourses;
}

// Función para mostrar el certificado
function showCertificate(course) {
    // Obtener datos del usuario
    const userName = document.getElementById('user-name').textContent;

    // Actualizar la información del certificado
    document.getElementById('certificate-name').textContent = userName;
    document.getElementById('certificate-course').textContent = course.title;
    document.getElementById('certificate-score').textContent = `${course.score || 90}%`;

    // Establecer la fecha
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('certificate-date').textContent = `Fecha: ${today.toLocaleDateString('es-ES', options)}`;

    // Mostrar el modal
    document.getElementById('certificate-modal').classList.add('show');

    // Configurar el botón de descarga
    document.getElementById('download-certificate').onclick = () => {
        showNotification('La funcionalidad de descarga estará disponible próximamente', 'info');
    };
}

// Función para continuar un curso
function continueCourse(courseId) {
    if (!courseId) {
        showNotification('Error: No se pudo identificar el curso', 'error');
        return;
    }
    // Redirigir al contenido del curso
    window.location.href = `course-content.html?id=${courseId}`;
}

// Función para iniciar un curso
function startCourse(courseId) {
    if (!courseId) {
        showNotification('Error: No se pudo identificar el curso', 'error');
        return;
    }
    // Redirigir al contenido del curso e indicar que es inicio
    window.location.href = `course-content.html?id=${courseId}&start=true`;
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    console.log(`Notificación (${type}): ${message}`); // Log para depuración

    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('No se encontró el contenedor de notificaciones');
        return;
    }

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