document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    loadCategoryFilter();
    
    setTimeout(() => {
        setupFilterEventListeners();
    }, 500);
    
    const addCourseButtons = document.querySelectorAll('.add-course-btn');
    addCourseButtons.forEach(button => {
        button.addEventListener('click', () => openCourseModal());
    });
    
    setupModalCloseListeners();
});

function setupFilterEventListeners() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const newCategoryFilter = categoryFilter.cloneNode(true);
        categoryFilter.parentNode.replaceChild(newCategoryFilter, categoryFilter);
        newCategoryFilter.addEventListener('change', filterCourses);
    }
    
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

function setupModalCloseListeners() {
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', function() {
            closeCourseModal();
        });
    });
    
    const modal = document.getElementById('courseModal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeCourseModal();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeCourseModal();
        }
    });
}

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

async function loadCourses() {
    try {
        const tableBody = document.querySelector('#courses-table tbody') || document.querySelector('.data-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="loading-spinner"></div>
                        <p>Cargando cursos...</p>
                    </td>
                </tr>
            `;
        }
        
        const response = await fetch('/api/courses');
        if (!response.ok) {
            throw new Error('Error al cargar los cursos');
        }
        
        const courses = await response.json();
        
        displayCourses(courses);
        
    } catch (error) {
        console.error('Error loading courses:', error);
        
        const tableBody = document.querySelector('#courses-table tbody') || document.querySelector('.data-table tbody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Error al cargar los cursos</p>
                            <p class="error-details">${error.message}</p>
                            <button class="btn-primary" onclick="loadCourses()">
                                <i class="fas fa-sync-alt"></i> Reintentar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        showError('Error al cargar los cursos. Por favor, inténtalo de nuevo.');
    }
}

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
        
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading category filter:', error);
    }
}

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
        
        const addButton = tableBody.querySelector('.add-course-btn');
        if (addButton) {
            addButton.addEventListener('click', () => openCourseModal());
        }
        
        return;
    }
    
    courses.forEach(course => {
        const row = document.createElement('tr');
        row.setAttribute('data-category-id', course.category_id || '');
        row.setAttribute('data-status', course.status || '');
    
        const updatedDate = course.updated_at ? formatDate(course.updated_at) : 'N/A';
        
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
                    <button class="btn-icon edit-course-btn" data-course-id="${course.id}" data-tooltip="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon preview-course-btn" data-course-id="${course.id}" data-tooltip="Vista previa">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon delete-course-btn" data-course-id="${course.id}" data-tooltip="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
        
        const editBtn = row.querySelector('.edit-course-btn');
        const previewBtn = row.querySelector('.preview-course-btn');
        const deleteBtn = row.querySelector('.delete-course-btn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => editCourse(course.id));
        }
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => previewCourse(course.id));
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteCourse(course.id, course.title));
        }
    });
    
    if (typeof initializeTooltips === 'function') {
        initializeTooltips();
    }
}
function filterCourses() {
    console.log('Filtering courses...');
    
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    console.log('Filter values:', { searchTerm, categoryFilter, statusFilter });
    
    const rows = document.querySelectorAll('#courses-table tbody tr, .data-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.querySelector('.empty-state') || row.querySelector('.loading-spinner')) {
            return;
        }
        
        const title = row.querySelector('.course-details h3')?.textContent.toLowerCase() || '';
        const description = row.querySelector('.course-details p')?.textContent.toLowerCase() || '';
        const categoryId = row.getAttribute('data-category-id');
        const status = row.getAttribute('data-status');
        
        console.log('Row data:', { 
            title: title.substring(0, 20) + '...', 
            categoryId, 
            status,
            rowElement: row
        });
        
        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || categoryFilter === categoryId || categoryFilter.toString() === categoryId;
        const matchesStatus = statusFilter === 'all' || statusFilter === status;
        
        console.log('Matches:', { matchesSearch, matchesCategory, matchesStatus });
        
        if (matchesSearch && matchesCategory && matchesStatus) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    const tableBody = document.querySelector('#courses-table tbody') || document.querySelector('.data-table tbody');
    if (tableBody) {
        const noResultsRow = tableBody.querySelector('.no-results');
        
        if (visibleCount === 0 && !noResultsRow) {
            const newRow = document.createElement('tr');
            newRow.className = 'no-results';
            newRow.innerHTML = `<td colspan="7" class="text-center">No se encontraron cursos con los filtros seleccionados</td>`;
            tableBody.appendChild(newRow);
        } else if (visibleCount > 0 && noResultsRow) {
            noResultsRow.remove();
        }
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

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
        
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
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
    
    form.reset();
    
    loadCategories();
    
    if (course) {
        modalTitle.textContent = 'Editar Curso';
        document.getElementById('courseTitle').value = course.title || '';
        document.getElementById('courseDescription').value = course.description || '';
        
        const categorySelect = document.getElementById('courseCategory');
        
        if (categorySelect && course.category_id) {
            setTimeout(() => {
                categorySelect.value = course.category_id;
            }, 500);
        }
        
        const statusSelect = document.getElementById('courseStatus');
        if (statusSelect && course.status) {
            statusSelect.value = course.status;
        }
        
        if (course.image_url) {
            const previewContainer = document.getElementById('thumbnail-preview');
            previewContainer.innerHTML = `<img src="${course.image_url}" alt="${course.title}">`;
            previewContainer.style.display = 'block';
        }
        
        form.dataset.courseId = course.id;
    } else {
        // New course
        modalTitle.textContent = 'Nuevo Curso';
        form.removeAttribute('data-course-id');
        
        // Hide thumbnail preview
        const previewContainer = document.getElementById('thumbnail-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.style.display = 'none';
        }
    }
    
    // Show modal
    modal.style.display = 'block';
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de curso
function closeCourseModal() {
    const modal = document.getElementById('courseModal');
    modal.style.display = 'none';
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
}

// Guardar curso (nuevo o editar)
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
        
        console.log(`Sending ${method} request to ${url}`);
        console.log('Form data contents:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[0] === 'thumbnail' ? 'File object' : pair[1]));
        }
        
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
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar el curso');
        }
        
        // Cerrar modal y restaurar scrolling
        closeCourseModal();
        
        // Recargar cursos para mostrar la lista actualizada
        loadCourses();
        
        // Mostrar mensaje de éxito
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
        console.log('Course image event listener set up');
    } else {
        console.warn('Course image input element not found in the DOM');
    }
});

// Error display function
function showError(message) {
    console.log('Showing error message:', message);
    
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

// Function to close the course modal properly
function closeCourseModal() {
    const modal = document.getElementById('courseModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Update the event listener for the close button
document.addEventListener('DOMContentLoaded', function() {
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeCourseModal();
        });
    });

    const modal = document.getElementById('courseModal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeCourseModal();
        }
    });

    // Close modal when pressing Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeCourseModal();
        }
    });
});

// Make sure form is properly set up when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
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
        
        console.log('Course form event listeners set up');
    } else {
        console.error('Course form not found in the DOM');
    }
});

function initEventListeners() {
    // Remove any existing event listeners first to prevent duplicates
    const addCourseBtn = document.querySelector('.add-course-btn');
    if (addCourseBtn) {
        // Clone the button to remove all event listeners
        const newAddCourseBtn = addCourseBtn.cloneNode(true);
        addCourseBtn.parentNode.replaceChild(newAddCourseBtn, addCourseBtn);
        
        // Add a single event listener
        newAddCourseBtn.addEventListener('click', () => {
            openCourseModal();
        });
    }
};

// Add this at the beginning of your document ready function or at the top of your script
document.addEventListener('DOMContentLoaded', function() {
    console.log('%c[DOM] 🔄 Document loaded, checking for duplicate IDs...', 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Check for duplicate courseCategory elements
    const categorySelects = document.querySelectorAll('#courseCategory');
    console.log('%c[DOM] 🔍 Found', 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;', categorySelects.length, 'elements with ID "courseCategory"');
    
    if (categorySelects.length > 1) {
        console.error('%c[DOM] ❌ DUPLICATE ID DETECTED: Multiple elements with ID "courseCategory"', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
        categorySelects.forEach((el, index) => {
            console.log(`%c[DOM] 🔍 Element ${index}:`, 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;', el);
        });
    }
    
    // Check for duplicate courseStatus elements
    const statusSelects = document.querySelectorAll('#courseStatus');
    console.log('%c[DOM] 🔍 Found', 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;', statusSelects.length, 'elements with ID "courseStatus"');
    
    if (statusSelects.length > 1) {
        console.error('%c[DOM] ❌ DUPLICATE ID DETECTED: Multiple elements with ID "courseStatus"', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;');
        statusSelects.forEach((el, index) => {
            console.log(`%c[DOM] 🔍 Element ${index}:`, 'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;', el);
        });
    }
});

// Make sure there's only one DOMContentLoaded event listener in the file
document.addEventListener('DOMContentLoaded', () => {
    console.log('Document ready - initializing courses page');
    
    // Initialize event listeners
    initEventListeners();
    
    // Load courses
    loadCourses();
});

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
    // Mostrar el modal de confirmación
    const modal = document.getElementById('deleteCourseModal');
    const courseTitleSpan = document.getElementById('deleteCourseTitle');
    
    // Establecer el título del curso en el mensaje
    courseTitleSpan.textContent = courseTitle || 'este curso';
    
    // Mostrar el modal
    modal.style.display = 'flex';
    
    // Evitar scroll en el body mientras el modal está abierto
    document.body.style.overflow = 'hidden';
    
    // Guardar referencia al courseId para usarlo cuando se confirme
    modal.dataset.courseId = courseId;
    
    // Agregar event listeners a los botones del modal
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = () => {
            closeDeleteModal();
        };
    });
    
    // Configurar el botón de confirmación
    const confirmButton = document.getElementById('confirmDeleteCourse');
    confirmButton.onclick = async () => {
        try {
            // Mostrar indicador de carga
            confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
            confirmButton.disabled = true;
            
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el curso');
            }
            
            closeDeleteModal();
            
            loadCourses();
            
            showSuccess('Curso eliminado correctamente');
            
        } catch (error) {
            console.error('Error deleting course:', error);
            showError(error.message || 'Error al eliminar el curso. Por favor, inténtalo de nuevo.');
            
            // Restaurar el botón
            confirmButton.innerHTML = 'Eliminar';
            confirmButton.disabled = false;
        }
    };
}

// Función para cerrar el modal de confirmación
function closeDeleteModal() {
    const modal = document.getElementById('deleteCourseModal');
    modal.style.display = 'none';
    
    // Restaurar scroll en el body
    document.body.style.overflow = 'auto';
    
    // Limpiar event listeners
    const confirmButton = document.getElementById('confirmDeleteCourse');
    confirmButton.onclick = null;
    
    const closeButtons = modal.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.onclick = null;
    });
}

// Función para previsualizar un curso
function previewCourse(courseId) {
    // Abrir una nueva ventana o pestaña con la vista previa del curso
    window.open(`/course/${courseId}/preview`, '_blank');
}

// Asegurarnos de que las funciones estén disponibles globalmente
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.previewCourse = previewCourse;

// Modificar la función init para llamar a initializeFilters
function init() {
    // Cargar cursos al iniciar
    loadCourses();
    
    // Inicializar filtros
    initializeFilters();
    
    // Configurar event listeners para botones
    const addCourseBtn = document.querySelector('.add-course-btn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', () => openCourseModal());
    }
    
    // Configurar event listeners para el modal
    setupModalEventListeners();
}

// Llamar a init cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', init);

// Function to handle pagination
function setupPagination(totalItems, itemsPerPage = 10, currentPage = 1) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    
    if (!paginationContainer) {
        console.error('Pagination container not found');
        return;
    }
    
    // Clear existing pagination
    paginationContainer.innerHTML = '';
    
    // Don't show pagination if there's only one page or no items
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    } else {
        paginationContainer.style.display = 'flex';
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-btn';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Determine which page buttons to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // First page button (if not already included)
    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'pagination-btn';
        firstPageBtn.textContent = '1';
        firstPageBtn.addEventListener('click', () => goToPage(1));
        paginationContainer.appendChild(firstPageBtn);
        
        // Add ellipsis if there's a gap
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        if (i === currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i.toString();
        pageBtn.addEventListener('click', () => goToPage(i));
        paginationContainer.appendChild(pageBtn);
    }
    
    // Last page button (if not already included)
    if (endPage < totalPages) {
        // Add ellipsis if there's a gap
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'pagination-btn';
        lastPageBtn.textContent = totalPages.toString();
        lastPageBtn.addEventListener('click', () => goToPage(totalPages));
        paginationContainer.appendChild(lastPageBtn);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-btn';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Function to navigate to a specific page
function goToPage(page) {
    // Store the current page in a variable accessible to the loadCourses function
    window.currentCoursePage = page;
    
    // Reload courses with the new page
    loadCourses(page);
}

// Modify the loadCourses function to handle pagination
async function loadCourses(page = 1) {
    const itemsPerPage = 10; // Number of courses per page
    const tableBody = document.querySelector('.data-table tbody');
    
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando cursos...</td></tr>';
    
    try {
        // Fetch all courses first to get the total count
        const response = await fetch('/api/courses');
        
        if (!response.ok) {
            throw new Error('Error al cargar los cursos');
        }
        
        const courses = await response.json();
        
        // Calculate pagination
        const totalItems = courses.length;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedCourses = courses.slice(startIndex, endIndex);
        
        // Display the courses for the current page
        if (paginatedCourses.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay cursos disponibles</td></tr>';
        } else {
            tableBody.innerHTML = '';
            displayCourses(paginatedCourses);
        }
        
        // Setup pagination
        setupPagination(totalItems, itemsPerPage, page);
        
    } catch (error) {
        console.error('Error loading courses:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error al cargar los cursos: ${error.message}</td></tr>`;
    }
}

// Store the current page globally
window.currentCoursePage = 1;

// Make sure to update the init function to use the new pagination
function init() {
    // Cargar cursos al iniciar con la página 1
    loadCourses(1);
    
    // Inicializar filtros
    initializeFilters();
    
    // Configurar event listeners para botones
    const addCourseBtn = document.querySelector('.add-course-btn');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', () => openCourseModal());
    }
    
    // Configurar event listeners para el modal
    setupModalEventListeners();
}

