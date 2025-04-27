// Configurar event listeners para filtros
function setupFilterEventListeners() {
    // Event listener para el filtro de categorías
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        // Eliminar event listeners existentes clonando el elemento
        const newCategoryFilter = categoryFilter.cloneNode(true);
        categoryFilter.parentNode.replaceChild(newCategoryFilter, categoryFilter);
        newCategoryFilter.addEventListener('change', filterCourses);
    }
    
    // Event listener para el filtro de estado
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        // Eliminar event listeners existentes clonando el elemento
        const newStatusFilter = statusFilter.cloneNode(true);
        statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);
        newStatusFilter.addEventListener('change', filterCourses);
    }
    
    // Event listener para el campo de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Eliminar event listeners existentes clonando el elemento
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', filterCourses);
    }
}

// Configurar event listeners para el modal
function setupModalEventListeners() {
    // Event listeners para cerrar modales
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        // Clone the button to remove all event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add the event listener to the new button
        newButton.addEventListener('click', function() {
            closeCourseModal();
        });
    });
    
    // Close modal when clicking outside the modal content
    const modal = document.getElementById('courseModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeCourseModal();
            }
        });
    }

    // Close modal when pressing Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeCourseModal();
        }
    });
    
    // Setup form submission
    const courseForm = document.getElementById('courseForm');
    if (courseForm) {
        // Prevent default form submission
        courseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveCourse();
        });
        
        // Make sure the save button calls saveCourse
        const saveButton = document.querySelector('#courseModal .save-btn');
        if (saveButton) {
            saveButton.addEventListener('click', function(e) {
                e.preventDefault();
                saveCourse();
            });
        }
    }
    
    // Setup thumbnail preview
    const courseThumbnail = document.getElementById('courseThumbnail');
    if (courseThumbnail) {
        courseThumbnail.addEventListener('change', function(e) {
            const file = e.target.files[0];
            let thumbnailPreview = document.getElementById('thumbnail-preview');
            
            if (!thumbnailPreview) {
                thumbnailPreview = document.createElement('div');
                thumbnailPreview.id = 'thumbnail-preview';
                thumbnailPreview.className = 'thumbnail-preview';
                courseThumbnail.parentNode.appendChild(thumbnailPreview);
            }
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    thumbnailPreview.innerHTML = `<img src="${e.target.result}" alt="Thumbnail Preview">`;
                    thumbnailPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                thumbnailPreview.innerHTML = '';
                thumbnailPreview.style.display = 'none';
            }
        });
    }
}

// Store the current page globally
window.currentCoursePage = 1;

// Función de conveniencia para diferentes tipos de notificaciones
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function showInfo(message) {
    showNotification(message, 'info');
}

// Cargar las categorías en el filtro
async function loadCategoryFilter() {
    try {
        const response = await fetch('/api/courses/categories');
        
        if (!response.ok) {
            throw new Error('Error al cargar las categorías');
        }
        
        const categories = await response.json();
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (!categoryFilter) {
            return;
        }
        
        // Mantener la opción "Todas las Categorías"
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Añadir las categorías al filtro
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
        
        // No agregamos event listener aquí, lo hacemos en setupFilterEventListeners
        
    } catch (error) {
        console.error('Error loading category filter:', error);
    }
}

// Mostrar cursos en la tabla
function displayCourses(courses) {
    const tableBody = document.querySelector('#courses-table tbody') || document.querySelector('.data-table tbody');
    
    if (!tableBody) {
        console.error('No se encontró el elemento tbody para mostrar los cursos');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!courses || courses.length === 0) {
        // Mostrar estado vacío
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <p>No hay cursos disponibles</p>
                        <button class="btn-primary add-course-btn">
                            <i class="fas fa-plus"></i> Crear Curso
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        // Add event listener to the newly created button
        const addButton = tableBody.querySelector('.add-course-btn');
        if (addButton) {
            addButton.addEventListener('click', () => openCourseModal());
        }
        
        return;
    }
    
    // Agregar cada curso a la tabla
    courses.forEach(course => {
        const row = document.createElement('tr');
        // Agregar atributos para filtrado
        row.setAttribute('data-category-id', course.category_id || '');
        row.setAttribute('data-status', course.status || '');
        row.setAttribute('data-course-id', course.id || '');
        
        // Formatear la fecha de actualización
        const updatedDate = course.updated_at ? formatDate(course.updated_at) : 'N/A';
        
        // Determinar el estado del curso
        let statusClass = '';
        let statusText = '';
        
        switch (course.status) {
            case 'published':
                statusClass = 'status-active';
                statusText = 'Publicado';
                break;
            case 'draft':
                statusClass = 'status-pending';
                statusText = 'Borrador';
                break;
            case 'archived':
                statusClass = 'status-inactive';
                statusText = 'Archivado';
                break;
            default:
                statusClass = 'status-pending';
                statusText = 'Borrador';
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="course-checkbox" data-course-id="${course.id}">
            </td>
            <td>
                <div class="course-info">
                    <div class="course-thumbnail">
                        ${course.image_url 
                            ? `<img src="${course.image_url}" alt="${course.title}">`
                            : `<div class="placeholder-thumbnail"><i class="fas fa-image"></i></div>`
                        }
                    </div>
                    <div class="course-details">
                        <h3>${course.title}</h3>
                        <p>${course.description ? (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description) : 'Sin descripción'}</p>
                        <span class="course-category">${course.category_name || 'Sin categoría'}</span>
                    </div>
                </div>
            </td>
            <td>${course.lesson_count || 0}</td>
            <td>${course.student_count || 0}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${updatedDate}</td>
            <td>
            <div class="action-buttons">
                <button class="btn-icon edit-course-btn btn-blue" data-course-id="${course.id}" data-tooltip="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon modules-course-btn btn-green" data-course-id="${course.id}" data-tooltip="Módulos">
                    <i class="fas fa-book-open"></i>
                </button>
                <button class="btn-icon delete-course-btn btn-red" data-course-id="${course.id}" data-tooltip="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
        `;
        
        tableBody.appendChild(row);
        
        // Agregar event listeners a los botones
        const editBtn = row.querySelector('.edit-course-btn');
        const modulesBtn = row.querySelector('.modules-course-btn');
        const deleteBtn = row.querySelector('.delete-course-btn');

        if (editBtn) {
            editBtn.addEventListener('click', () => editCourse(course.id));
        }

        if (modulesBtn) {
            modulesBtn.addEventListener('click', () => {
                // Redirect to course-modules.html with the course ID
                window.location.href = `course-modules.html?id=${course.id}`;
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteCourse(course.id, course.title));
        }
    });
    
    // Inicializar tooltips para los nuevos botones
    if (typeof initializeTooltips === 'function') {
        initializeTooltips();
    }
}

// Filtrar cursos según los criterios seleccionados
function filterCourses() {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const rows = document.querySelectorAll('#courses-table tbody tr, .data-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        // Si es la fila de estado vacío o cargando, no aplicar filtros
        if (row.querySelector('.empty-state') || row.querySelector('.loading-spinner')) {
            return;
        }
        
        const title = row.querySelector('.course-details h3')?.textContent.toLowerCase() || '';
        const description = row.querySelector('.course-details p')?.textContent.toLowerCase() || '';
        const categoryId = row.getAttribute('data-category-id');
        const status = row.getAttribute('data-status');
        
        // Verificar si cumple con todos los filtros
        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || categoryFilter === categoryId || categoryFilter.toString() === categoryId;
        const matchesStatus = statusFilter === 'all' || statusFilter === status;
        
        if (matchesSearch && matchesCategory && matchesStatus) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Mostrar mensaje si no hay resultados
    const tableBody = document.querySelector('#courses-table tbody') || document.querySelector('.data-table tbody');
    
    // Fix: Check if tableBody exists before trying to use it
    if (tableBody) {
        const noResultsRow = tableBody.querySelector('.no-results');
        
        if (visibleCount === 0 && !noResultsRow) {
            // No hay resultados y no existe la fila de "no hay resultados"
            const newRow = document.createElement('tr');
            newRow.className = 'no-results';
            newRow.innerHTML = `<td colspan="7" class="text-center">No se encontraron cursos con los filtros seleccionados</td>`;
            tableBody.appendChild(newRow);
        } else if (visibleCount > 0 && noResultsRow) {
            // Hay resultados pero existe la fila de "no hay resultados"
            noResultsRow.remove();
        }
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Función para cargar las categorías en el modal
async function loadCategories() {
    try {
        const response = await fetch('/api/courses/categories');
        
        if (!response.ok) {
            throw new Error('Error al cargar las categorías');
        }
        
        const categories = await response.json();
        const categorySelect = document.getElementById('courseCategory');
        
        if (!categorySelect) {
            return;
        }
        
        // Limpiar opciones existentes excepto la primera
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Añadir las categorías
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Error al cargar las categorías. Por favor, recarga la página.');
    }
}

function openCourseModal(course = null) {
    const modal = document.getElementById('courseModal');
    const modalTitle = modal.querySelector('.modal-header h2');
    const form = document.getElementById('courseForm');
    
    // Reset form
    form.reset();
    
    // Cargar las categorías
    loadCategories();
    
    // Limpiar el dataset del formulario
    form.removeAttribute('data-course-id');
    
    // Limpiar la vista previa de la imagen
    const thumbnailPreview = document.getElementById('thumbnail-preview');
    if (thumbnailPreview) {
        thumbnailPreview.innerHTML = '';
        thumbnailPreview.style.display = 'none';
    }
    
    if (course) {
        // Edit existing course
        modalTitle.textContent = 'Editar Curso';
        document.getElementById('courseTitle').value = course.title || '';
        document.getElementById('courseDescription').value = course.description || '';
        
        // Set the course ID in the form dataset for reference when saving
        form.dataset.courseId = course.id;
        
        // Set category if it exists
        const categorySelect = document.getElementById('courseCategory');
        
        if (categorySelect && course.category_id) {
            // Esperar un momento para que las categorías se carguen
            setTimeout(() => {
                categorySelect.value = course.category_id;
            }, 500);
        }
        
        // Set status
        const statusSelect = document.getElementById('courseStatus');
        if (statusSelect && course.status) {
            statusSelect.value = course.status;
        }
        
        // Show thumbnail preview if it exists
        if (course.thumbnail) {
            const thumbnailPreview = document.getElementById('thumbnail-preview') || document.createElement('div');
            thumbnailPreview.id = 'thumbnail-preview';
            thumbnailPreview.className = 'thumbnail-preview';
            thumbnailPreview.innerHTML = `<img src="${course.thumbnail}" alt="Thumbnail Preview">`;
            thumbnailPreview.style.display = 'block';
            
            // Add it to the DOM if it doesn't exist
            const thumbnailInput = document.getElementById('courseThumbnail');
            if (thumbnailInput && !document.getElementById('thumbnail-preview')) {
                thumbnailInput.parentNode.appendChild(thumbnailPreview);
            }
        }
    } else {
        // New course
        modalTitle.textContent = 'Nuevo Curso';
    }
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de curso
function closeCourseModal() {
    const modal = document.getElementById('courseModal');
    modal.style.display = 'none';
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
}

async function saveCourse() {
    const form = document.getElementById('courseForm');
    if (!form) {
        console.error('Form not found');
        showError('Error: Formulario no encontrado');
        return;
    }
    
    const courseId = form.dataset.courseId;
    const isEdit = !!courseId;
    
    // Create FormData object to handle file upload
    const formData = new FormData(form);
    
    try {
        // Using standardized endpoints
        const url = isEdit ? `/api/courses/${courseId}` : '/api/courses';
        const method = isEdit ? 'PUT' : 'POST';
        
        // Make sure the form has the required fields
        if (!formData.get('title')) {
            throw new Error('El título es obligatorio');
        }
        
        // Ensure we're not sending an empty file
        const fileInput = document.getElementById('courseThumbnail');
        if (fileInput && fileInput.files.length === 0 && formData.has('thumbnail')) {
            // Remove empty file input to prevent issues
            formData.delete('thumbnail');
        }
        
        // Debugging - log form data
        console.log(`Sending ${method} request to ${url}`);
        console.log('Form data contents:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[0] === 'thumbnail' ? 'File object' : pair[1]));
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar el curso');
        }
        
        closeCourseModal();
        
        loadCourses();
        
        showSuccess(isEdit ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente');
        
    } catch (error) {
        console.error('Error saving course:', error);
        showError(error.message || 'Error al guardar el curso. Por favor, inténtalo de nuevo.');
    }
}

// Show thumbnail preview when file is selected
document.addEventListener('DOMContentLoaded', function() {
    const courseImageInput = document.getElementById('courseThumbnail');
    
    if (courseImageInput) {
        courseImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            let thumbnailPreview = document.getElementById('thumbnail-preview');
            
            if (!thumbnailPreview) {
                // Create the preview element if it doesn't exist
                thumbnailPreview = document.createElement('div');
                thumbnailPreview.id = 'thumbnail-preview';
                thumbnailPreview.className = 'thumbnail-preview';
                
                // Insert it after the file input
                courseImageInput.parentNode.appendChild(thumbnailPreview);
            }
            
            if (file) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    thumbnailPreview.innerHTML = `<img src="${e.target.result}" alt="Thumbnail Preview">`;
                    thumbnailPreview.style.display = 'block';
                };
                
                reader.readAsDataURL(file);
            } else {
                thumbnailPreview.innerHTML = '';
                thumbnailPreview.style.display = 'none';
            }
        });
    } else {
    }
});

// Error display function
function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="close-error" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Remove any existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Insert error at the top of the content
    const contentContainer = document.querySelector('.dashboard-content');
    if (contentContainer) {
        contentContainer.insertBefore(errorContainer, contentContainer.firstChild);
    } else {
        // Fallback if dashboard-content doesn't exist
        document.body.insertBefore(errorContainer, document.body.firstChild);
    }
    
    // Make sure it's visible with prominent styling
    errorContainer.style.display = 'flex';
    errorContainer.style.alignItems = 'center';
    errorContainer.style.justifyContent = 'space-between';
    errorContainer.style.padding = '15px';
    errorContainer.style.margin = '10px 0';
    errorContainer.style.backgroundColor = 'var(--error-bg-color, #fff2f2)';
    errorContainer.style.color = 'var(--error-color, #d32f2f)';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.border = '1px solid var(--error-border-color, #ffcdd2)';
    
    // Scroll to make the error visible
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Initialize tooltips
function initializeTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            const tooltipText = this.dataset.tooltip;
            
            const tooltipElement = document.createElement('div');
            tooltipElement.className = 'tooltip';
            tooltipElement.textContent = tooltipText;
            
            document.body.appendChild(tooltipElement);
            
            const rect = this.getBoundingClientRect();
            tooltipElement.style.top = `${rect.top - tooltipElement.offsetHeight - 10}px`;
            tooltipElement.style.left = `${rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2)}px`;
            tooltipElement.style.opacity = '1';
        });
        
        tooltip.addEventListener('mouseleave', function() {
            const tooltipElement = document.querySelector('.tooltip');
            if (tooltipElement) {
                tooltipElement.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(tooltipElement);
                }, 300);
            }
        });
    });
}

// Función para manejar la selección de cursos
function setupSelectionHandlers() {
    // Manejar el checkbox "Seleccionar todos"
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            const checkboxes = document.querySelectorAll('.data-table tbody input[type="checkbox"]');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            
            updateDeleteSelectedButton();
        });
    }
    
    // Actualizar el botón de eliminar seleccionados cuando cambie la selección
    document.addEventListener('change', function(e) {
        if (e.target && e.target.type === 'checkbox' && e.target.closest('.data-table')) {
            updateDeleteSelectedButton();
        }
    });
    
    // Configurar el botón de eliminar seleccionados
    const deleteSelectedBtn = document.querySelector('.delete-selected-btn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', function() {
            openDeleteMultipleModal();
        });
    }
}

// Función para actualizar la visibilidad del botón de eliminar seleccionados
function updateDeleteSelectedButton() {
    const selectedCheckboxes = document.querySelectorAll('.data-table tbody input[type="checkbox"]:checked');
    const deleteSelectedBtn = document.querySelector('.delete-selected-btn');
    
    if (deleteSelectedBtn) {
        if (selectedCheckboxes.length > 0) {
            deleteSelectedBtn.style.display = 'inline-flex';
            deleteSelectedBtn.textContent = `Eliminar (${selectedCheckboxes.length})`;
        } else {
            deleteSelectedBtn.style.display = 'none';
        }
    }
}

// Función genérica para abrir un modal de confirmación
function openConfirmationModal(modalId, message, confirmCallback) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Si hay un elemento para mostrar el mensaje, actualizarlo
    if (message) {
        const messageElement = modal.querySelector('.modal-body p:first-child');
        if (messageElement) {
            messageElement.innerHTML = message;
        }
    }
    
    // Mostrar el modal
    modal.style.display = 'flex';
    
    // Evitar scroll en el body mientras el modal está abierto
    document.body.style.overflow = 'hidden';
    
    // Agregar event listeners a los botones del modal
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = () => {
            closeConfirmationModal(modalId);
        };
    });
    
    // Configurar el botón de confirmación
    const confirmButton = modal.querySelector('.btn-danger');
    if (confirmButton && confirmCallback) {
        confirmButton.onclick = confirmCallback;
    }
}

// Función genérica para cerrar un modal de confirmación
function closeConfirmationModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'none';
    
    // Restaurar scroll en el body
    document.body.style.overflow = 'auto';
    
    // Limpiar event listeners
    const confirmButton = modal.querySelector('.btn-danger');
    if (confirmButton) {
        confirmButton.onclick = null;
        
        // Restaurar el estado del botón de confirmación
        confirmButton.innerHTML = 'Eliminar';
        confirmButton.disabled = false;
    }
    
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = null;
    });
    
    // Eliminar cualquier dato almacenado en el dataset
    if (modal.dataset) {
        for (const key in modal.dataset) {
            delete modal.dataset[key];
        }
    }
}

// Función para editar un curso existente
async function editCourse(courseId) {
    try {
        // Obtener los datos del curso
        const response = await fetch(`/api/courses/${courseId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar los datos del curso');
        }
        
        const course = await response.json();
        
        // Abrir el modal con los datos del curso
        openCourseModal(course);
        
    } catch (error) {
        console.error('Error loading course for editing:', error);
        showError('Error al cargar los datos del curso. Por favor, inténtalo de nuevo.');
    }
}

// Función para eliminar un curso
async function deleteCourse(courseId, courseTitle) {
    // Preparar el mensaje
    const message = `¿Estás seguro de que deseas eliminar <strong>${courseTitle || 'este curso'}</strong>?`;
    
    // Guardar referencia al courseId para usarlo cuando se confirme
    const modal = document.getElementById('deleteCourseModal');
    if (modal) {
        modal.dataset.courseId = courseId;
    }
    
    // Definir la función de confirmación
    const confirmDelete = async () => {
        const confirmButton = document.getElementById('confirmDeleteCourse');
        
        try {
            // Mostrar indicador de carga
            if (confirmButton) {
                confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
                confirmButton.disabled = true;
            }
            
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el curso');
            }
            
            // Cerrar el modal
            closeConfirmationModal('deleteCourseModal');
            
            // Recargar la lista de cursos
            loadCourses();
            
            // Mostrar mensaje de éxito
            showSuccess('Curso eliminado correctamente');
            
        } catch (error) {
            console.error('Error deleting course:', error);
            showError(error.message || 'Error al eliminar el curso. Por favor, inténtalo de nuevo.');
            
            // Restaurar el botón
            if (confirmButton) {
                confirmButton.innerHTML = 'Eliminar';
                confirmButton.disabled = false;
            }
        }
    };
    
    // Abrir el modal con el mensaje y la función de confirmación
    openConfirmationModal('deleteCourseModal', message, confirmDelete);
}

// Función para abrir el modal de eliminación múltiple
function openDeleteMultipleModal() {
    const selectedCheckboxes = document.querySelectorAll('.data-table tbody input[type="checkbox"]:checked');
    const selectedCount = selectedCheckboxes.length;
    
    if (selectedCount === 0) {
        return;
    }
    
    // Preparar el mensaje
    const message = `¿Estás seguro de que deseas eliminar <strong>${selectedCount}</strong> cursos?`;
    
    // Definir la función de confirmación
    const confirmDeleteMultiple = async () => {
        const confirmButton = document.getElementById('confirmDeleteMultipleCourses');
        const selectedCheckboxes = document.querySelectorAll('.data-table tbody input[type="checkbox"]:checked');
        const courseIds = Array.from(selectedCheckboxes).map(checkbox => {
            const row = checkbox.closest('tr');
            return row.getAttribute('data-course-id') || checkbox.dataset.courseId;
        }).filter(id => id); // Filtrar IDs vacíos
        
        if (courseIds.length === 0) {
            closeConfirmationModal('deleteMultipleCoursesModal');
            return;
        }
        
        try {
            // Mostrar indicador de carga
            if (confirmButton) {
                confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
                confirmButton.disabled = true;
            }
            
            // Eliminar cada curso seleccionado
            const deletePromises = courseIds.map(courseId => 
                fetch(`/api/courses/${courseId}`, {
                    method: 'DELETE'
                }).then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.error || `Error al eliminar el curso ${courseId}`);
                        });
                    }
                    return response.json();
                })
            );
            
            // Esperar a que todas las eliminaciones se completen
            await Promise.all(deletePromises);
            
            // Cerrar el modal
            closeConfirmationModal('deleteMultipleCoursesModal');
            
            // Recargar la lista de cursos
            loadCourses();
            
            // Mostrar mensaje de éxito
            showSuccess(`${courseIds.length} cursos eliminados exitosamente`);
            
            // Actualizar el botón de eliminar seleccionados
            // Esta línea es la solución al problema
            updateDeleteSelectedButton();
            
            // También deseleccionar el checkbox "Seleccionar todos" si existe
            const selectAllCheckbox = document.getElementById('selectAll');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            
        } catch (error) {
            console.error('Error deleting courses:', error);
            showError(error.message || 'Error al eliminar los cursos. Por favor, inténtalo de nuevo.');
            
            // Restaurar el botón de confirmación
            if (confirmButton) {
                confirmButton.innerHTML = 'Eliminar';
                confirmButton.disabled = false;
            }
        }
    };
    
    // Abrir el modal con el mensaje y la función de confirmación
    openConfirmationModal('deleteMultipleCoursesModal', message, confirmDeleteMultiple);
}

// Función para previsualizar un curso
function previewCourse(courseId) {
    // Redirigir a la página de vista previa del curso
    window.open(`/courses/preview/${courseId}`, '_blank');
}

// Función para cargar los cursos desde la API
async function loadCourses(page = 1) {
    try {
        // Mostrar indicador de carga
        const tableBody = document.querySelector('#courses-table tbody') || document.querySelector('.data-table tbody');

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Cargando cursos...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Guardar la página actual
        window.currentCoursePage = page;
        
        // Construir la URL con parámetros de paginación
        const url = `/api/courses?page=${page}&limit=10`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error al cargar los cursos');
        }
        
        const data = await response.json();
        
        // Mostrar los cursos en la tabla
        displayCourses(data.courses || data);
        
        // Actualizar la paginación si está disponible
        if (data.pagination && typeof updatePagination === 'function') {
            updatePagination(data.pagination);
        } else if (Array.isArray(data.courses) && typeof updatePagination === 'function') {
            // FIX: Verificar si realmente hay más páginas basado en el total de cursos
            // en lugar de asumir que hay más páginas si hay exactamente 10 cursos
            const totalItems = data.totalCount || 0;
            const totalPages = Math.ceil(totalItems / 10);
            
            // PROBLEMA: Esta condición está creando una página adicional cuando hay exactamente 10 cursos
            // Si no hay totalCount, solo crear una página adicional si estamos en página 1
            // y hay exactamente 10 cursos (límite completo)
            const hasMorePages = totalItems > 0 
            ? page < totalPages 
            : (page === 1 && data.courses.length > 10);

            const paginationData = {
            currentPage: page,
            totalPages: totalItems > 0 
                ? totalPages 
                : (hasMorePages ? page + 1 : page),
            totalItems: totalItems || data.courses.length,
            itemsPerPage: 10
            };
            updatePagination(paginationData);
        } else if (Array.isArray(data) && typeof updatePagination === 'function') {
            // FIX: Similar a la lógica anterior pero para cuando data es un array directamente
            const totalItems = data.totalCount || 0;
            const totalPages = Math.ceil(totalItems / 10);
            
            // Solo crear una página adicional si estamos en página 1 y hay exactamente 10 cursos
            const hasMorePages = totalItems > 0 
                ? page < totalPages 
                : (page === 1 && data.length > 10);
                
            const paginationData = {
                currentPage: page,
                totalPages: totalItems > 0 
                    ? totalPages 
                    : (hasMorePages ? page + 1 : page),
                totalItems: totalItems || data.length,
                itemsPerPage: 10
            };
            updatePagination(paginationData);
        }
        
    } catch (error) {
        console.error('Error loading courses:', error);
        
        // Mostrar mensaje de error en la tabla
        const tableBody = document.querySelector('#courses-table tbody') || document.querySelector('.data-table tbody');
        
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="error-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error al cargar los cursos</p>
                            <button class="btn-primary retry-btn" onclick="loadCourses()">
                                <i class="fas fa-sync"></i> Reintentar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

// Función para actualizar la paginación
function updatePagination(pagination) {
    const paginationContainer = document.querySelector('.pagination');
    
    if (!paginationContainer) {
        return;
    }
    
    const { currentPage, totalPages } = pagination;
    
    // Limpiar la paginación existente
    paginationContainer.innerHTML = '';
    
    // Botón anterior
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn prev-btn';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage <= 1;
    prevButton.addEventListener('click', () => loadCourses(currentPage - 1));
    paginationContainer.appendChild(prevButton);
    
    // Determinar qué páginas mostrar
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Primera página si no está incluida en el rango
    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'pagination-btn';
        firstPageBtn.textContent = '1';
        firstPageBtn.addEventListener('click', () => loadCourses(1));
        paginationContainer.appendChild(firstPageBtn);
        
        // Añadir elipsis si hay un salto
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // Páginas numeradas
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => loadCourses(i));
        paginationContainer.appendChild(pageBtn);
    }
    
    // Última página si no está incluida en el rango
    if (endPage < totalPages) {
        // Añadir elipsis si hay un salto
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'pagination-btn';
        lastPageBtn.textContent = totalPages;
        lastPageBtn.addEventListener('click', () => loadCourses(totalPages));
        paginationContainer.appendChild(lastPageBtn);
    }
    
    // Botón siguiente
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn next-btn';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage >= totalPages;
    nextButton.addEventListener('click', () => loadCourses(currentPage + 1));
    paginationContainer.appendChild(nextButton);
}

// Inicializar la página cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Cargar las categorías en el filtro
    loadCategoryFilter();
    
    // Configurar event listeners para filtros
    setupFilterEventListeners();
    
    // Configurar event listeners para el modal
    setupModalEventListeners();
    
    // Configurar handlers para selección de cursos
    setupSelectionHandlers();
    
    // Cargar los cursos
    loadCourses();
    
    // Configurar el botón para crear un nuevo curso
    const addCourseBtn = document.querySelector('.add-course-btn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', () => openCourseModal());
    }
    
    // Inicializar tooltips
    if (typeof initializeTooltips === 'function') {
        initializeTooltips();
    }
});