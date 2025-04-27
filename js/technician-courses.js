let allCourses = [];
let currentPage = 1;
const coursesPerPage = 6;

document.addEventListener('DOMContentLoaded', () => {
    initTechnicianPage();
    initializeEventListeners();
    loadUserCourses();
});

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
    console.log('Cargando cursos desde:', '/api/technician/courses');

    // Mostrar estado de carga
    document.getElementById('courses-list-body').innerHTML = `
  <tr>
    <td colspan="4" class="loader-container">
      <div class="loader"></div>
      Cargando cursos...
    </td>
  </tr>
`;

    try {
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
        console.log('Datos recibidos:', data);

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
            throw new Error('La API devolvió un formato incorrecto');
        }
    } catch (error) {
        console.error('Error al cargar los cursos:', error);

        // Mostrar mensaje de error en la interfaz
        document.getElementById('courses-list-body').innerHTML = `
  <tr>
    <td colspan="4" class="error-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3>Error al cargar los cursos</h3>
      <p>${error.message || 'No se pudieron cargar los cursos desde el servidor.'}</p>
    </td>
  </tr>
`;

        showNotification('Error al cargar los cursos del servidor', 'error');
    }
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

// Función para mostrar los cursos en forma de lista
function displayCourses(courses, page) {
    const tbody = document.getElementById('courses-list-body');
    const paginationContainer = document.getElementById('pagination-container');

    // paginación
    const startIndex = (page - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const paginated = courses.slice(startIndex, endIndex);

    // sin cursos
    if (courses.length === 0) {
        tbody.innerHTML = `
        <tr>
          <td colspan="4" class="no-courses-message">
            No tienes cursos asignados. Contacta con tu administrador.
          </td>
        </tr>`;
        paginationContainer.innerHTML = '';
        return;
    }

    // genera filas
    const rows = paginated.map(c => {
        const statusMap = {
            not_started: ['No iniciado', 'status-published'],
            in_progress: ['En Progreso', 'status-in-progress'],
            completed: ['Completado', 'status-completed']
        };
        const [statusLabel, statusCls] = statusMap[c.status] || ['Desconocido', 'status-published'];

        return `
          <tr>
            <td>${c.title}</td>
            <td>${c.description || ''}</td>
            <td><span class="status-badge ${statusCls}">${statusLabel}</span></td>
            <td>${c.progress}%</td>
            <td>
  <div class="course-actions">
    <button class="btn-view" data-id="${c.id}">Ver curso</button>
    ${c.status === 'completed'
                ? `<button class="btn-certificate" data-id="${c.id}">Ver Certificado</button>`
                : ``}
  </div>
</td>
          </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;

    // Ver cursos
    tbody.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            window.location.href = `course-content.html?id=${id}`;
        });
    });

    // Certificado
    tbody.querySelectorAll('.btn-certificate').forEach(btn => {
        btn.addEventListener('click', () => {
            // busca el curso por su id
            const course = allCourses.find(c => c.id == btn.dataset.id);
            // rellena y muestra el modal
            showCertificate(course);
        });
    });

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
            (course.description && course.description.toLowerCase().includes(searchTerm));

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
