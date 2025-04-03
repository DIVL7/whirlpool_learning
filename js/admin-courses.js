document.addEventListener('DOMContentLoaded', function() {
    // Load courses from database
    loadCoursesFromDatabase();
    
    // Initialize modal
    const courseModal = document.getElementById('courseModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const addCourseBtn = document.querySelector('.add-course-btn'); // Updated selector
    
    // Add course button
    addCourseBtn.addEventListener('click', function() {
        // Reset form
        document.getElementById('courseForm').reset();
        document.getElementById('courseForm').dataset.courseId = '';
        
        // Change modal title
        document.querySelector('.modal-header h2').textContent = 'Agregar Nuevo Curso';
        
        // Show modal
        courseModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal
    closeModalBtn.addEventListener('click', function() {
        courseModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === courseModal) {
            courseModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Form submission
    document.getElementById('courseForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const courseId = this.dataset.courseId;
        const title = document.getElementById('courseTitle').value;
        const description = document.getElementById('courseDescription').value;
        const status = document.getElementById('courseStatus').value;
        const thumbnailInput = document.getElementById('courseThumbnail');
        
        // Create FormData object to handle file uploads
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('status', status);
        
        // Add thumbnail file if selected
        if (thumbnailInput.files.length > 0) {
            formData.append('courseThumbnail', thumbnailInput.files[0]);
        }
        
        // Determine if this is an update or create
        const isUpdate = courseId ? true : false;
        
        // API endpoint and method
        const url = isUpdate ? `/api/courses/${courseId}` : '/api/courses';
        const method = isUpdate ? 'PUT' : 'POST';
        
        // Send request to server
        fetch(url, {
            method: method,
            body: formData
            // Don't set Content-Type header with FormData
        })
        .then(response => {
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json().then(data => {
                    if (!response.ok) {
                        throw new Error(data.error || 'Error al guardar el curso');
                    }
                    return data;
                });
            } else {
                // If not JSON, it's probably an error page
                return response.text().then(text => {
                    console.error('Received non-JSON response:', text);
                    throw new Error('El servidor devolvió una respuesta inesperada');
                });
            }
        })
        .then(data => {
            // Close modal
            document.getElementById('courseModal').classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Reload courses
            loadCoursesFromDatabase();
            
            // Show success message
            alert(data.message || 'Curso guardado exitosamente');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        });
    });
});

// Function to load courses from database
// Variables globales para almacenar los cursos y los filtros actuales
let allCourses = [];
let currentFilters = {
    category: 'all',
    status: 'all'
};

// Función para cargar los cursos desde la base de datos
function loadCoursesFromDatabase() {
    fetch('/api/courses')
        .then(response => response.json())
        .then(courses => {
            // Guardar todos los cursos para filtrado posterior
            allCourses = courses;
            
            // Aplicar filtros actuales
            displayFilteredCourses();
        })
        .catch(error => {
            console.error('Error fetching courses:', error);
            const tableBody = document.querySelector('.data-table tbody');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Error al cargar los cursos: ${error.message}</td>
                </tr>
            `;
        });
}

// Función para mostrar los cursos filtrados
function displayFilteredCourses() {
    // Filtrar los cursos según los criterios actuales
    const filteredCourses = allCourses.filter(course => {
        // Filtro de categoría
        if (currentFilters.category !== 'all') {
            // Extraer la categoría del título o usar una propiedad específica si existe
            const courseCategory = getCourseCategory(course);
            if (courseCategory !== currentFilters.category) {
                return false;
            }
        }
        
        // Filtro de estado
        if (currentFilters.status !== 'all' && course.status !== currentFilters.status) {
            return false;
        }
        
        return true;
    });
    
    // Actualizar la tabla con los cursos filtrados
    updateCoursesTable(filteredCourses);
}

// Función para determinar la categoría de un curso
function getCourseCategory(course) {
    // Esta función extrae la categoría basada en el título del curso
    // Puedes modificarla según la estructura de tus datos
    const title = course.title.toLowerCase();
    
    if (title.includes('refrigerator') || title.includes('refrigerador')) {
        return 'refrigerator';
    } else if (title.includes('washing') || title.includes('lavadora')) {
        return 'washing';
    } else if (title.includes('dryer') || title.includes('secadora')) {
        return 'dryer';
    } else if (title.includes('dishwasher') || title.includes('lavavajillas')) {
        return 'dishwasher';
    }
    
    // Categoría por defecto
    return 'other';
}

// Función para actualizar la tabla de cursos
function updateCoursesTable(courses) {
    const tableBody = document.querySelector('.data-table tbody');
    
    // Limpiar la tabla
    tableBody.innerHTML = '';
    
    if (courses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No se encontraron cursos con los filtros seleccionados</td>
            </tr>
        `;
        return;
    }
    
    // Generar filas para cada curso
    courses.forEach(course => {
        const row = document.createElement('tr');
        row.dataset.courseId = course.course_id;
        
        // Mapear valores de estado a texto para mostrar
        let statusText = 'Borrador';
        if (course.status === 'published') statusText = 'Publicado';
        else if (course.status === 'archived') statusText = 'Archivado';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox">
            </td>
            <td>
                <div class="course-info">
                    <img src="../images/courses/${course.thumbnail || 'default-course.jpg'}" alt="Course Thumbnail">
                    <div>
                        <h4>${course.title}</h4>
                        <span class="course-creator">${course.creator_name || 'Admin'}</span>
                    </div>
                </div>
            </td>
            <td>${course.lessons || 0}</td>
            <td>${course.students || 0}</td>
            <td><span class="status-badge ${course.status}">${statusText}</span></td>
            <td>${new Date(course.updated_at || course.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn view-btn" title="Ver">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Reinicializar los event listeners para los botones de acción
    initializeActionButtons();
}

// Inicializar los filtros
function initializeFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    // Event listener para el filtro de categoría
    categoryFilter.addEventListener('change', function() {
        currentFilters.category = this.value;
        displayFilteredCourses();
    });
    
    // Event listener para el filtro de estado
    statusFilter.addEventListener('change', function() {
        currentFilters.status = this.value;
        displayFilteredCourses();
    });
}

// Inicializar los botones de acción (editar, ver, eliminar)
function initializeActionButtons() {
    // Botones de editar
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const courseId = row.dataset.courseId;
            const title = row.querySelector('.course-info h4').textContent;
            
            // Resetear el formulario
            document.getElementById('courseForm').reset();
            document.getElementById('courseThumbnail').value = '';
            
            // Establecer el ID del curso en el formulario
            document.getElementById('courseForm').dataset.courseId = courseId;
            
            // Llenar el formulario con los datos del curso
            document.getElementById('courseTitle').value = title;
            
            // Obtener detalles adicionales del curso
            fetch(`/api/courses/${courseId}`)
                .then(response => response.json())
                .then(course => {
                    document.getElementById('courseDescription').value = course.description || '';
                    
                    // Establecer el estado
                    const statusSelect = document.getElementById('courseStatus');
                    for (let i = 0; i < statusSelect.options.length; i++) {
                        if (statusSelect.options[i].value === course.status) {
                            statusSelect.selectedIndex = i;
                            break;
                        }
                    }
                    
                    // Mostrar la miniatura actual si existe
                    if (course.thumbnail) {
                        const thumbnailPreview = document.getElementById('thumbnailPreview');
                        if (!thumbnailPreview) {
                            const previewContainer = document.createElement('div');
                            previewContainer.id = 'thumbnailPreview';
                            previewContainer.className = 'thumbnail-preview';
                            previewContainer.innerHTML = `
                                <p>Imagen actual:</p>
                                <img src="../images/courses/${course.thumbnail}" alt="Thumbnail Preview">
                            `;
                            
                            const thumbnailInput = document.getElementById('courseThumbnail');
                            thumbnailInput.parentNode.appendChild(previewContainer);
                        } else {
                            thumbnailPreview.innerHTML = `
                                <p>Imagen actual:</p>
                                <img src="../images/courses/${course.thumbnail}" alt="Thumbnail Preview">
                            `;
                        }
                    } else {
                        // Eliminar la vista previa si existe
                        const thumbnailPreview = document.getElementById('thumbnailPreview');
                        if (thumbnailPreview) {
                            thumbnailPreview.remove();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error fetching course details:', error);
                });
            
            // Cambiar el título del modal
            document.querySelector('.modal-header h2').textContent = 'Editar Curso';
            
            // Mostrar el modal
            document.getElementById('courseModal').classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Botones de ver
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.closest('tr').dataset.courseId;
            // Implementar la vista detallada del curso
            alert(`Ver detalles del curso ID: ${courseId}`);
        });
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const courseId = row.dataset.courseId;
            const courseTitle = row.querySelector('.course-info h4').textContent;
            
            if (confirm(`¿Estás seguro de que deseas eliminar el curso "${courseTitle}"?`)) {
                // Eliminar el curso
                fetch(`/api/courses/${courseId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message || 'Curso eliminado exitosamente');
                    // Recargar la lista de cursos
                    loadCoursesFromDatabase();
                })
                .catch(error => {
                    console.error('Error deleting course:', error);
                    alert('Error al eliminar el curso');
                });
            }
        });
    });
}

// Inicializar la página cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Cargar los cursos iniciales
    loadCoursesFromDatabase();
    
    // Inicializar los filtros
    initializeFilters();
    
    // ... resto del código de inicialización ...
});