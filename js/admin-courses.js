let allCourses = [];
let currentFilters = {
    category: 'all',
    status: 'all'
};

// Función para mostrar notificaciones
function showNotification(message, type = 'success', duration = 3000) {
    const container = document.getElementById('notification-container');
    
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icono según el tipo de notificación
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'info') icon = 'info-circle';
    
    // Contenido de la notificación
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icon}"></i>
            <p>${message}</p>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Añadir al contenedor
    container.appendChild(notification);
    
    // Configurar botón de cierre
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    });
    
    // Auto-cerrar después de la duración especificada
    setTimeout(() => {
        if (notification.parentNode === container) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode === container) {
                    container.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

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
        
        // Add timestamp to image URL to prevent caching
        const imageUrl = course.thumbnail ? 
            `../images/courses/${course.thumbnail}?t=${new Date().getTime()}` : 
            '../images/courses/default-course.jpg';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox">
            </td>
            <td>
                <div class="course-info">
                    <img src="${imageUrl}" alt="Course Thumbnail">
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

// Función para cerrar un modal
function closeModal(modalElement) {
    modalElement.classList.remove('show');
    setTimeout(() => {
        if (modalElement.id === 'deleteConfirmModal') {
            document.body.removeChild(modalElement);
        }
        document.body.style.overflow = 'auto';
    }, 300);
}

// Inicializar los botones de acción (editar, ver, eliminar)
function initializeActionButtons() {
    // Botones de editar
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const courseId = row.dataset.courseId;
            const title = row.querySelector('.course-info div h4').textContent;
            
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
            // Redirigir a la página de módulos del curso
            window.location.href = `course-modules.html?id=${courseId}`;
        });
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const courseId = row.dataset.courseId;
            
            // Mostrar modal de confirmación de eliminación
            showDeleteConfirmationModal(this);
        });
    });
}

// Función para mostrar el modal de confirmación de eliminación
function showDeleteConfirmationModal(deleteButton) {
    const row = deleteButton.closest('tr');
    const courseId = row.dataset.courseId;
    const courseTitle = row.querySelector('.course-info div h4').textContent;
    
    // Mostrar modal de confirmación
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal';
    confirmModal.id = 'deleteConfirmModal';
    confirmModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Confirmar Eliminación</h2>
                <button class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>¿Estás seguro de que deseas eliminar el curso "${courseTitle}"?</p>
                <p class="warning-text"><i class="fas fa-exclamation-triangle"></i> Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary close-modal">Cancelar</button>
                <button class="btn-danger confirm-delete">Eliminar</button>
            </div>
        </div>
    `;
    
    // Añadir el modal al DOM
    document.body.appendChild(confirmModal);
    
    // Mostrar el modal
    setTimeout(() => {
        confirmModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }, 10);
    
    // Configurar botones del modal
    const closeButtons = confirmModal.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => closeModal(confirmModal));
    });
    
    // Configurar botón de confirmación
    const confirmButton = confirmModal.querySelector('.confirm-delete');
    confirmButton.addEventListener('click', () => {
        deleteCourse(courseId, confirmModal);
    });
    
    // Cerrar modal al hacer clic fuera
    confirmModal.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            closeModal(confirmModal);
        }
    });
}

// Función para eliminar un curso
function deleteCourse(courseId, confirmModal) {
    // Mostrar indicador de carga en el botón
    const confirmButton = confirmModal.querySelector('.confirm-delete');
    confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
    confirmButton.disabled = true;

    // Obtener el token de autenticación (si existe)
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    // Configurar los headers para la solicitud
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Añadir el token de autenticación si existe
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Eliminar el curso
    fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: headers,
        credentials: 'include' // Incluir cookies en la solicitud
    })
    .then(response => {
        if (!response.ok) {
            // Si la respuesta no es OK, intentamos obtener el mensaje de error
            return response.json().then(data => {
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }).catch(err => {
                // Si no podemos parsear como JSON, usamos el status text
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Cerrar el modal
        closeModal(confirmModal);
        
        // Mostrar notificación de éxito
        showNotification(data.message || 'Curso eliminado exitosamente', 'success');
        
        // Recargar la lista de cursos
        loadCoursesFromDatabase();
        
        // Log para depuración
        console.log('Curso eliminado:', courseId, data);
    })
    .catch(error => {
        console.error('Error deleting course:', error);
        
        // Mostrar mensaje de error más descriptivo
        let errorMessage = error.message;
        if (error.message.includes('401')) {
            errorMessage = 'No tienes permisos para eliminar este curso. Por favor, inicia sesión nuevamente.';
        }
        
        showNotification(`Error al eliminar el curso: ${errorMessage}`, 'error');
        
        // Restaurar el botón
        confirmButton.innerHTML = 'Eliminar';
        confirmButton.disabled = false;
    });
}

// Función para inicializar los botones del modal
function initializeModalButtons() {
    // Botón para cerrar el modal (solo el botón X, ya no el de cancelar)
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal(document.getElementById('courseModal'));
        });
    });

    // Botón para abrir el modal de nuevo curso
    const addCourseBtn = document.querySelector('.add-course-btn');
    addCourseBtn.addEventListener('click', function() {
        // Resetear el formulario
        document.getElementById('courseForm').reset();
        document.getElementById('courseForm').removeAttribute('data-course-id');
        
        // Cambiar el título del modal
        document.querySelector('#courseModal .modal-header h2').textContent = 'Añadir Nuevo Curso';
        
        // Eliminar la vista previa de la imagen si existe
        const thumbnailPreview = document.getElementById('thumbnailPreview');
        if (thumbnailPreview) {
            thumbnailPreview.remove();
        }
        
        // Mostrar el modal
        document.getElementById('courseModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    });
    
    // Cerrar modal cuando se hace clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('courseModal');
        if (event.target === modal) {
            closeModal(modal);
        }
    });
}

// Inicializar la página cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Cargar los cursos iniciales
    loadCoursesFromDatabase();

    // Inicializar los filtros
    initializeFilters();

    // Inicializar los botones del modal
    initializeModalButtons();

    // Inicializar el formulario de cursos
    initializeCreateCourseForm();
});

function initializeCreateCourseForm() {
    const courseForm = document.getElementById('courseForm');
    
    // Eliminar cualquier event listener existente para evitar duplicados
    const newCourseForm = courseForm.cloneNode(true);
    courseForm.parentNode.replaceChild(newCourseForm, courseForm);
    
    newCourseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obtener datos del formulario
        const formData = new FormData(this);
        
        // Log form data for debugging
        console.log('Form data keys:', [...formData.keys()]);
        
        // Verificar si es una edición o creación
        const courseId = this.dataset.courseId;
        const isEdit = !!courseId;
        
        // Asegurarse de que el título esté presente
        if (!formData.get('title')) {
            showNotification('El título del curso es obligatorio', 'error');
            return;
        }
        
        // Configurar la URL y método según sea edición o creación
        let url = '/api/courses';
        let method = 'POST';
        
        if (isEdit) {
            url = `/api/courses/${courseId}`;
            method = 'PUT';
        }
        
        // Mostrar indicador de carga
        const saveButton = this.querySelector('.save-btn');
        const originalText = saveButton.textContent;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveButton.disabled = true;
        
        // Enviar datos al servidor
        fetch(url, {
            method: method,
            body: formData
        })
        .then(response => {
            // Improved error handling
            if (!response.ok) {
                // Check content type to handle different error formats
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Error al guardar el curso');
                    });
                } else {
                    // If not JSON, get text and throw a generic error
                    return response.text().then(text => {
                        console.error('Server response:', text);
                        throw new Error('Error al guardar el curso. Por favor, inténtalo de nuevo.');
                    });
                }
            }
            return response.json();
        })
        .then(data => {
            // Mostrar notificación de éxito
            showNotification(isEdit ? 'Curso actualizado correctamente' : 'Curso creado correctamente', 'success');
            
            // Cerrar el modal correctamente
            const modal = document.getElementById('courseModal');
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Actualizar la tabla de cursos sin recargar la página
            loadCoursesFromDatabase();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification(error.message || 'Error al guardar el curso', 'error');
        })
        .finally(() => {
            // Restaurar el botón de guardar
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;
        });
    });
}