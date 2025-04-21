document.addEventListener('DOMContentLoaded', function() {
    // Get course ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        showCourseSelectionView();
    } else {
        loadCourseDetails(courseId);
        loadModules(courseId);
        setupEventListeners(courseId);
    }
});

// Load course details
async function loadCourseDetails(courseId) {
    try {
        // Verify if courseId is valid
        if (!courseId) {
            throw new Error('ID de curso no válido');
        }
        
        // Using standardized endpoint
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
            throw new Error('Error al cargar los detalles del curso');
        }
        
        const course = await response.json();
        
        // Update course details in the UI - check if elements exist first
        const titleElement = document.getElementById('course-title');
        if (titleElement) {
            titleElement.textContent = course.title;
        }
        
        const descriptionElement = document.getElementById('course-description');
        if (descriptionElement) {
            descriptionElement.textContent = course.description || 'Sin descripción';
        }
        
        // Update course thumbnail if available
        const thumbnailContainer = document.getElementById('course-thumbnail');
        if (thumbnailContainer) {
            if (course.thumbnail) {
                thumbnailContainer.innerHTML = `<img src="/uploads/courses/${course.thumbnail}" alt="${course.title}">`;
            } else if (course.image_url) {
                thumbnailContainer.innerHTML = `<img src="${course.image_url}" alt="${course.title}">`;
            } else {
                thumbnailContainer.innerHTML = `<div class="placeholder-thumbnail"><i class="fas fa-image"></i></div>`;
            }
        }
        
        // Update course metadata - check if elements exist
        const moduleCountElement = document.getElementById('module-count');
        if (moduleCountElement) {
            moduleCountElement.textContent = course.module_count || 0;
        }
        
        const contentCountElement = document.getElementById('content-count');
        if (contentCountElement) {
            contentCountElement.textContent = course.content_count || 0;
        }
        
        const enrolledCountElement = document.getElementById('enrolled-count');
        if (enrolledCountElement) {
            enrolledCountElement.textContent = course.student_count || 0;
        }
        
        // Update page title
        document.title = `${course.title} - Módulos | Whirlpool Learning`;
        
    } catch (error) {
        console.error('Error loading course details:', error);
        showError(`Error al cargar los detalles del curso: ${error.message}`);
    }
}

// Load modules for a course
async function loadModules(courseId) {
    try {
        // Using standardized endpoint
        const response = await fetch(`/api/courses/${courseId}/modules`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar los módulos');
        }
        
        const modules = await response.json();
        
        // Render modules
        renderModules(modules, courseId);
        
    } catch (error) {
        console.error('Error loading modules:', error);
        showError(`Error al cargar los módulos: ${error.message}`);
    }
}

// Load contents for a module
async function loadModuleContents(courseId, moduleId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/contents`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar los contenidos');
        }
        
        const contents = await response.json();
        
        const contentContainer = document.getElementById(`content-container-${moduleId}`);
        if (!contentContainer) return;
        
        if (contents.length === 0) {
            contentContainer.innerHTML = `
                <div class="no-content-message">
                    <p>No hay contenidos en este módulo</p>
                </div>
                <button class="add-content-btn" data-module-id="${moduleId}">
                    <i class="fas fa-plus"></i> Añadir contenido
                </button>
            `;
            
            // Add event listener to the add content button
            const addContentBtn = contentContainer.querySelector('.add-content-btn');
            if (addContentBtn) {
                addContentBtn.addEventListener('click', function() {
                    openContentModal(courseId, moduleId);
                });
            }
            
            return;
        }
        
        // Sort contents by position
        contents.sort((a, b) => a.position - b.position);
        
        // Create content list
        let contentHTML = '<ul class="content-list">';
        
        contents.forEach(content => {
            let contentIcon = '';
            
            // Set icon based on content type
            switch (content.content_type_id) {
                case 1: // Video
                    contentIcon = '<i class="fas fa-video"></i>';
                    break;
                case 2: // Text
                    contentIcon = '<i class="fas fa-file-alt"></i>';
                    break;
                case 3: // PDF
                    contentIcon = '<i class="fas fa-file-pdf"></i>';
                    break;
                case 4: // Image
                    contentIcon = '<i class="fas fa-image"></i>';
                    break;
                default:
                    contentIcon = '<i class="fas fa-file"></i>';
            }
            
            contentHTML += `
                <li class="content-item" data-content-id="${content.content_id}">
                    <div class="content-icon">${contentIcon}</div>
                    <div class="content-title">${content.title}</div>
                    <div class="content-actions">
                        <button class="edit-content-btn" data-tooltip="Editar contenido">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-content-btn" data-tooltip="Eliminar contenido">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        });
        
        contentHTML += '</ul>';
        contentHTML += `
            <button class="add-content-btn" data-module-id="${moduleId}">
                <i class="fas fa-plus"></i> Añadir contenido
            </button>
        `;
        
        contentContainer.innerHTML = contentHTML;
        
        // Add event listeners to content actions
        contentContainer.querySelectorAll('.edit-content-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const contentItem = this.closest('.content-item');
                const contentId = contentItem.dataset.contentId;
                
                // Get content details and open modal
                fetch(`/api/courses/modules/contents/${contentId}`)
                    .then(response => response.json())
                    .then(content => {
                        openContentModal(courseId, moduleId, content);
                    })
                    .catch(error => {
                        console.error('Error loading content details:', error);
                        showError(`Error al cargar los detalles del contenido: ${error.message}`);
                    });
            });
        });
        
        contentContainer.querySelectorAll('.delete-content-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const contentItem = this.closest('.content-item');
                const contentId = contentItem.dataset.contentId;
                const contentTitle = contentItem.querySelector('.content-title').textContent;
                
                confirmDeleteContent(contentId, moduleId, contentTitle);
            });
        });
        
        // Add event listener to the add content button
        const addContentBtn = contentContainer.querySelector('.add-content-btn');
        if (addContentBtn) {
            addContentBtn.addEventListener('click', function() {
                openContentModal(courseId, moduleId);
            });
        }
        
    } catch (error) {
        console.error('Error loading module contents:', error);
        const contentContainer = document.getElementById(`content-container-${moduleId}`);
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar los contenidos</p>
                    <p class="error-message">${error.message}</p>
                </div>
            `;
        }
    }
}

// Set up event listeners
function setupEventListeners(courseId) {
    // Add module button
    const addModuleBtn = document.getElementById('add-module-btn');
    if (addModuleBtn) {
        addModuleBtn.addEventListener('click', function() {
            openModuleModal(courseId);
        });
    }
    
    // Save module button
    const saveModuleBtn = document.getElementById('save-module-btn');
    if (saveModuleBtn) {
        saveModuleBtn.addEventListener('click', function() {
            saveModule(courseId);
        });
    }
    
    // Save content button
    const saveContentBtn = document.getElementById('save-content-btn');
    if (saveContentBtn) {
        saveContentBtn.addEventListener('click', saveContent);
    }
    
    // Content type change
    const contentTypeSelect = document.getElementById('content-type');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', function() {
            updateContentDataField(this.value);
        });
    }
    
    // Close modals with close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Back to courses button
    const backToCourses = document.getElementById('back-to-courses');
    if (backToCourses) {
        backToCourses.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'courses.html';
        });
    }
}

// Open module modal (create or edit)
function openModuleModal(courseId, module = null) {
    const modal = document.getElementById('module-modal');
    const modalTitle = document.getElementById('module-modal-title');
    const form = document.getElementById('module-form');
    
    // Reset form
    form.reset();
    
    if (module) {
        // Edit existing module
        modalTitle.textContent = 'Editar Módulo';
        document.getElementById('module-title').value = module.title;
        document.getElementById('module-description').value = module.description || '';
        document.getElementById('module-position').value = module.position;
        form.dataset.moduleId = module.module_id;
    } else {
        // Add new module
        modalTitle.textContent = 'Añadir Nuevo Módulo';
        delete form.dataset.moduleId;
        
        // Set next position
        const moduleCount = parseInt(document.getElementById('module-count').textContent) || 0;
        document.getElementById('module-position').value = moduleCount + 1;
    }
    
    form.dataset.courseId = courseId;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Open content modal (create or edit)
function openContentModal(courseId, moduleId, content = null) {
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('content-modal-title');
    const form = document.getElementById('content-form');
    
    // Reset form
    form.reset();
    
    if (content) {
        // Edit existing content
        modalTitle.textContent = 'Editar Contenido';
        document.getElementById('content-title').value = content.title;
        document.getElementById('content-type').value = content.content_type_id;
        document.getElementById('content-position').value = content.position;
        form.dataset.contentId = content.content_id;
        
        // Update content data field based on type
        updateContentDataField(content.content_type_id);
        
        // Set content data if available
        if (content.content_data) {
            document.getElementById('content-data').value = content.content_data;
        }
    } else {
        // Add new content
        modalTitle.textContent = 'Añadir Nuevo Contenido';
        delete form.dataset.contentId;
        
        // Set default content type
        const contentTypeSelect = document.getElementById('content-type');
        updateContentDataField(contentTypeSelect.value);
        
        // Set next position
        // Get the number of existing contents in the module
        const contentItems = document.querySelectorAll(`#content-container-${moduleId} .content-item`);
        document.getElementById('content-position').value = contentItems.length + 1;
    }
    
    form.dataset.moduleId = moduleId;
    form.dataset.courseId = courseId;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Update content data field based on content type
function updateContentDataField(contentTypeId) {
    const container = document.getElementById('content-data-container');
    
    // Clear previous content
    container.innerHTML = '';
    
    let label, input;
    
    switch (contentTypeId) {
        case '1': // Video
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'URL del Video';
            
            input = document.createElement('input');
            input.setAttribute('type', 'url');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content-data');
            input.setAttribute('placeholder', 'https://www.youtube.com/watch?v=...');
            input.setAttribute('required', 'required');
            
            container.appendChild(label);
            container.appendChild(input);
            break;
            
        case '2': // Text
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'Contenido de Texto';
            
            input = document.createElement('textarea');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content-data');
            input.setAttribute('rows', '10');
            input.setAttribute('placeholder', 'Escribe el contenido aquí...');
            input.setAttribute('required', 'required');
            
            container.appendChild(label);
            container.appendChild(input);
            break;
            
        case '3': // PDF
        case '4': // Image
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = contentTypeId === '3' ? 'Archivo PDF' : 'Imagen';
            
            input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content-data');
            input.setAttribute('accept', contentTypeId === '3' ? '.pdf' : 'image/*');
            
            container.appendChild(label);
            container.appendChild(input);
            break;
            
        default:
            console.error('Tipo de contenido no válido');
    }
}

// Save module (create or update)
async function saveModule(courseId) {
    const form = document.getElementById('module-form');
    const moduleId = form.dataset.moduleId;
    const isEdit = !!moduleId;
    
    const moduleData = {
        title: document.getElementById('module-title').value,
        description: document.getElementById('module-description').value,
        position: parseInt(document.getElementById('module-position').value),
        course_id: parseInt(courseId)
    };
    
    try {
        const url = isEdit ? `/api/courses/${courseId}/modules/${moduleId}` : `/api/courses/${courseId}/modules`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moduleData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el módulo');
        }
        
        // Close modal and reload modules
        document.getElementById('module-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reload course details and modules
        loadCourseDetails(courseId);
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error saving module:', error);
        showError(`Error al guardar el módulo: ${error.message}`);
    }
}

// Save content (create or update)
async function saveContent() {
    const form = document.getElementById('content-form');
    const moduleId = form.dataset.moduleId;
    const contentId = form.dataset.contentId;
    const courseId = form.dataset.courseId;
    const isEdit = !!contentId;
    
    // Get form data
    const contentData = {
        title: document.getElementById('content-title').value,
        content_type_id: parseInt(document.getElementById('content-type').value),
        position: parseInt(document.getElementById('content-position').value),
        module_id: parseInt(moduleId)
    };
    
    // Handle different content types
    const contentType = document.getElementById('content-type').value;
    const contentDataElement = document.getElementById('content-data');
    
    try {
        let response;
        
        if (contentType === '3' || contentType === '4') {
            // File upload (PDF or Image)
            if (contentDataElement.files && contentDataElement.files[0]) {
                // Use FormData for file uploads
                const formData = new FormData();
                formData.append('file', contentDataElement.files[0]);
                formData.append('data', JSON.stringify(contentData));
                
                const url = isEdit ? `/api/courses/modules/contents/${contentId}` : '/api/courses/modules/contents';
                response = await fetch(url, {
                    method: isEdit ? 'PUT' : 'POST',
                    body: formData
                });
            } else if (!isEdit) {
                throw new Error('Por favor, selecciona un archivo.');
            } else {
                // If editing and no new file selected, just update the metadata
                const url = `/api/courses/modules/contents/${contentId}`;
                response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(contentData)
                });
            }
        } else {
            // Text-based content
            contentData.content_data = contentDataElement.value;
            
            const url = isEdit ? `/api/courses/modules/contents/${contentId}` : '/api/courses/modules/contents';
            response = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contentData)
            });
        }
        
        if (!response.ok) {
            throw new Error('Error al guardar el contenido');
        }
        
        // Close modal and reload modules
        document.getElementById('content-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error saving content:', error);
        showError(`Error al guardar el contenido: ${error.message}`);
    }
}

// Delete module
async function deleteModule(moduleId, courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el módulo');
        }
        
        // Reload course details and modules
        loadCourseDetails(courseId);
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error deleting module:', error);
        showError(`Error al eliminar el módulo: ${error.message}`);
    }
}

// Delete content
async function deleteContent(contentId, moduleId) {
    try {
        const response = await fetch(`/api/courses/modules/contents/${contentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el contenido');
        }
        
        // Get course ID from the module form
        const courseId = document.getElementById('module-form').dataset.courseId;
        
        // Reload modules
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error deleting content:', error);
        showError(`Error al eliminar el contenido: ${error.message}`);
    }
}

// Confirm delete module
function confirmDeleteModule(courseId, moduleId, moduleTitle) {
    if (confirm(`¿Estás seguro de que deseas eliminar el módulo "${moduleTitle}"? Esta acción no se puede deshacer.`)) {
        deleteModule(moduleId, courseId);
    }
}

// Confirm delete content
function confirmDeleteContent(contentId, moduleId, contentTitle) {
    if (confirm(`¿Estás seguro de que deseas eliminar el contenido "${contentTitle}"? Esta acción no se puede deshacer.`)) {
        deleteContent(contentId, moduleId);
    }
}

// Show error message
function showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="close-error" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(errorContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorContainer.parentNode) {
            errorContainer.remove();
        }
    }, 5000);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const moduleModal = document.getElementById('module-modal');
    const contentModal = document.getElementById('content-modal');
    
    if (event.target === moduleModal) {
        moduleModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    if (event.target === contentModal) {
        contentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Function to show course selection view
function showCourseSelectionView() {
    // Hide modules view
    document.querySelector('.course-modules-container').style.display = 'none';
    
    // Update title and description
    document.querySelector('.page-header h1').textContent = 'Seleccionar Curso';
    document.querySelector('.page-header p').textContent = 'Selecciona un curso para administrar sus módulos';
    
    // Create container for course selection
    const mainContent = document.querySelector('.dashboard-content');
    
    // Create course selection element if it doesn't exist
    if (!document.getElementById('course-selection-container')) {
        const courseSelectionContainer = document.createElement('div');
        courseSelectionContainer.id = 'course-selection-container';
        courseSelectionContainer.className = 'card';
        courseSelectionContainer.innerHTML = `
            <div class="card-header">
                <h3>Cursos Disponibles</h3>
                <p>Selecciona un curso para administrar sus módulos</p>
            </div>
            <div class="card-body">
                <div class="course-grid" id="courses-grid">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        
        mainContent.appendChild(courseSelectionContainer);
        
        // Load available courses
        loadAvailableCourses();
    }
}

function loadAvailableCourses(page = 1) {
    // Using standardized endpoint with pagination
    fetch(`/api/courses?page=${page}&limit=12`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los cursos');
            }
            return response.json();
        })
        .then(data => {
            // Extract courses and pagination from the response
            const courses = data.courses || [];
            const pagination = data.pagination || { currentPage: 1, totalPages: 1 };
            
            const coursesGrid = document.getElementById('courses-grid');
            coursesGrid.innerHTML = '';
            
            if (courses.length === 0) {
                coursesGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <p>No hay cursos disponibles</p>
                        <a href="courses.html" class="btn-primary">
                            <i class="fas fa-plus"></i> Crear Curso
                        </a>
                    </div>
                `;
            } else {
                courses.forEach(course => {
                    const courseCard = document.createElement('div');
                    courseCard.className = 'course-card';
                    
                    courseCard.innerHTML = `
                        <div class="course-thumbnail">
                            ${course.thumbnail 
                                ? `<img src="/uploads/courses/${course.thumbnail}" alt="${course.title}">`
                                : `<div class="placeholder-thumbnail"><i class="fas fa-image"></i></div>`
                            }
                        </div>
                        <div class="course-info">
                            <h3 class="course-title">${course.title}</h3>
                            <p class="course-description">${course.description || 'Sin descripción'}</p>
                            <div class="course-meta">
                                <span class="meta-item">
                                    <i class="fas fa-cubes"></i> ${course.module_count || 0} módulos
                                </span>
                                <span class="meta-item">
                                    <i class="fas fa-users"></i> ${course.student_count || 0} estudiantes
                                </span>
                            </div>
                        </div>
                        <div class="course-actions">
                            <a href="course-modules.html?id=${course.id}" class="btn-primary">
                                <i class="fas fa-cubes"></i> Administrar Módulos
                            </a>
                        </div>
                    `;
                    
                    coursesGrid.appendChild(courseCard);
                });
                
                // Add pagination controls if there are multiple pages
                if (pagination.totalPages > 1) {
                    // Remove existing pagination if any
                    const existingPagination = document.querySelector('.pagination-container');
                    if (existingPagination) {
                        existingPagination.remove();
                    }
                    
                    const paginationContainer = document.createElement('div');
                    paginationContainer.className = 'pagination-container';
                    paginationContainer.innerHTML = createPaginationHTML(pagination);
                    coursesGrid.parentElement.appendChild(paginationContainer);
                    
                    // Add event listeners to pagination buttons
                    document.querySelectorAll('.pagination-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const pageNum = parseInt(this.dataset.page);
                            if (!isNaN(pageNum)) {
                                loadAvailableCourses(pageNum);
                            }
                        });
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('courses-grid').innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar los cursos</p>
                    <p class="error-message">${error.message}</p>
                    <button id="retry-load-courses" class="btn-primary">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
            
            document.getElementById('retry-load-courses').addEventListener('click', function() {
                loadAvailableCourses();
            });
        });
}

// Helper function to create pagination HTML
function createPaginationHTML(pagination) {
    const { currentPage, totalPages } = pagination;
    
    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn prev-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust if we're near the end
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // First page if not included in range
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    // Last page if not included in range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

// Next button
paginationHTML += `
    <button class="pagination-btn next-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
    </button>
`;

paginationHTML += '</div>';
return paginationHTML;
}

// Render modules in the UI
function renderModules(modules, courseId) {
    const container = document.getElementById('modules-container');
    
    if (!container) {
        console.error('Modules container not found');
        return;
    }
    
    if (!modules || modules.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cubes"></i>
                <p>No hay módulos disponibles para este curso</p>
                <button class="btn-primary" id="create-first-module">
                    <i class="fas fa-plus"></i> Crear primer módulo
                </button>
            </div>
        `;
        
        // Add event listener for the create first module button
        const createFirstModuleBtn = document.getElementById('create-first-module');
        if (createFirstModuleBtn) {
            createFirstModuleBtn.addEventListener('click', () => openModuleModal(courseId));
        }
        
        return;
    }
    
    // Clear previous content
    container.innerHTML = '';
    
    // Sort modules by position
    modules.sort((a, b) => a.position - b.position);
    
    // Render each module
    modules.forEach(module => {
        const moduleElement = document.createElement('div');
        moduleElement.className = 'module-item';
        moduleElement.dataset.moduleId = module.module_id;
        
        moduleElement.innerHTML = `
            <div class="module-header" data-module-id="${module.module_id}">
                <div class="module-left">
                    <div class="module-number">${module.position}</div>
                    <div class="module-title">${module.title}</div>
                </div>
                <div class="module-actions">
                    <button class="toggle-module-btn" data-tooltip="Expandir/Colapsar">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="add-content-btn" data-tooltip="Añadir contenido">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="edit-module-btn" data-tooltip="Editar módulo">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-module-btn btn-danger" data-tooltip="Eliminar módulo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="module-content" style="display: none;">
                <div class="module-description">${module.description || 'Sin descripción'}</div>
                <div class="module-contents-header">
                    <div class="module-contents-title">Contenidos</div>
                </div>
                <div class="content-container" id="content-container-${module.module_id}">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        
        container.appendChild(moduleElement);
        
        // Add event listeners for module actions
        const header = moduleElement.querySelector('.module-header');
        const toggleBtn = moduleElement.querySelector('.toggle-module-btn');
        const addContentBtn = moduleElement.querySelector('.add-content-btn');
        const editBtn = moduleElement.querySelector('.edit-module-btn');
        const deleteBtn = moduleElement.querySelector('.delete-module-btn');
        
        // Toggle module content
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const content = moduleElement.querySelector('.module-content');
            const isVisible = content.style.display !== 'none';
            content.style.display = isVisible ? 'none' : 'block';
            toggleBtn.querySelector('i').className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
        });
        
        // Header click also toggles content
        header.addEventListener('click', () => {
            toggleBtn.click();
        });
        
        // Add content button
        addContentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openContentModal(courseId, module.module_id);
        });
        
        // Edit module button
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openModuleModal(courseId, module);
        });
        
        // Delete module button
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteModule(courseId, module.module_id, module.title);
        });
        
        // Load module contents
        loadModuleContents(courseId, module.module_id);
    });
    
    // Update module count in the UI
    const moduleCountElement = document.getElementById('module-count');
    if (moduleCountElement) {
        moduleCountElement.textContent = modules.length;
    }
}