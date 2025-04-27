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
        setupContentEventListeners(courseId);
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
        console.log('Loading modules for course ID:', courseId);
        
        // Using standardized endpoint
        const response = await fetch(`/api/courses/${courseId}/modules`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar los módulos');
        }
        
        const modules = await response.json();
        console.log('Modules loaded:', modules);
        
        // Render modules
        renderModules(modules, courseId);
        
        // Setup event listeners after rendering modules
        setupEventListeners(courseId);
        
    } catch (error) {
        console.error('Error loading modules:', error);
        showError(`Error al cargar los módulos: ${error.message}`);
    }
}

async function loadModuleContents(courseId, moduleId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/contents`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar los contenidos');
        }
        
        const contents = await response.json();
        
        const contentContainer = document.getElementById(`content-container-${moduleId}`);
        if (!contentContainer) return;
        
        // Clear loading indicator
        contentContainer.innerHTML = '';
        
        if (contents.length === 0) {
            contentContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>Este módulo no tiene contenidos</p>
                </div>
                <div class="content-actions">
                    <button class="add-content-btn" data-module-id="${moduleId}">
                        <i class="fas fa-plus"></i> Añadir contenido
                    </button>
                </div>
            `;
            
            // Add event listener to the add content button
            const addContentBtn = contentContainer.querySelector('.add-content-btn');
            if (addContentBtn) {
                addContentBtn.addEventListener('click', function() {
                    openContentModal(courseId, moduleId);
                });
            }
            
            return; // Importante: retornar aquí para evitar agregar otro botón
        }
        
        // Sort contents by position
        contents.sort((a, b) => a.position - b.position);
        
        // Create content list
        const contentList = document.createElement('div');
        contentList.className = 'content-list';
        contentContainer.appendChild(contentList);
        
        contents.forEach(content => {
            const contentItem = document.createElement('div');
            contentItem.className = 'content-item';
            contentItem.dataset.contentId = content.content_id;
            
            // Determine content type icon and label
            let typeIcon, typeLabel;
            switch (parseInt(content.content_type_id)) {
                case 1:
                    typeIcon = 'fas fa-video';
                    typeLabel = 'Video';
                    break;
                case 2:
                    typeIcon = 'fas fa-file-alt';
                    typeLabel = 'Texto';
                    break;
                case 3:
                    typeIcon = 'fas fa-file-pdf';
                    typeLabel = 'PDF';
                    break;
                case 4:
                    typeIcon = 'fas fa-image';
                    typeLabel = 'Imagen';
                    break;
                default:
                    typeIcon = 'fas fa-file';
                    typeLabel = 'Otro';
            }
            
            contentItem.innerHTML = `
                <div class="content-header">
                    <div class="content-type">
                        <i class="${typeIcon}"></i>
                        <span>${typeLabel}</span>
                    </div>
                    <div class="content-position">${content.position}</div>
                    <div class="content-title">${content.title}</div>
                    <div class="content-actions">
                        <button class="edit-content-btn" data-tooltip="Editar contenido">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-content-btn" data-tooltip="Eliminar contenido">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            contentList.appendChild(contentItem);
            
            // Add event listeners to content actions
            const editBtn = contentItem.querySelector('.edit-content-btn');
            if (editBtn) {
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openContentModal(courseId, moduleId, content);
                });
            }
            
            const deleteBtn = contentItem.querySelector('.delete-content-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    confirmDeleteContent(content.content_id, content.title);
                });
            }
        });
        
    } catch (error) {
        console.error('Error loading module contents:', error);
        showError(`Error al cargar los contenidos del módulo: ${error.message}`);
    }
}

// Set up event listeners
function setupEventListeners(courseId) {
    console.log('Setting up event listeners for course ID:', courseId);
    
    // Add module button
    const addModuleBtn = document.getElementById('add-module-btn');
    if (addModuleBtn) {
        console.log('Found add-module-btn, adding event listener');
        // Eliminar listeners existentes para evitar duplicados
        const newBtn = addModuleBtn.cloneNode(true);
        addModuleBtn.parentNode.replaceChild(newBtn, addModuleBtn);
        
        newBtn.addEventListener('click', function() {
            console.log('Add module button clicked');
            openModuleModal(courseId);
        });
    } else {
        console.error('add-module-btn not found');
    }
    
    // Save module button
    const saveModuleBtn = document.getElementById('save-module-btn');
    if (saveModuleBtn) {
        console.log('Found save-module-btn, adding event listener');
        // Eliminar listeners existentes para evitar duplicados
        const newBtn = saveModuleBtn.cloneNode(true);
        saveModuleBtn.parentNode.replaceChild(newBtn, saveModuleBtn);
        
        newBtn.addEventListener('click', function() {
            console.log('Save module button clicked');
            saveModule(courseId);
        });
    } else {
        console.error('save-module-btn not found');
    }
    
    // También configurar el formulario para manejar el submit
    const moduleForm = document.getElementById('module-form');
    if (moduleForm) {
        moduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Module form submitted');
            saveModule(courseId);
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

// Create module template function
function createModuleTemplate(module) {
    return `
        <div class="module-item" data-module-id="${module.id || module.module_id}">
            <div class="module-header">
                <h3>${module.title}</h3>
                <div class="module-actions">
                    <button class="btn-outline edit-module-btn" data-module-id="${module.id || module.module_id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-danger delete-module-btn" data-module-id="${module.id || module.module_id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                    <button class="btn-primary add-content-btn" data-module-id="${module.id || module.module_id}">
                        <i class="fas fa-plus"></i> Agregar Contenido
                    </button>
                </div>
            </div>
            <div class="module-description">${module.description || 'Sin descripción'}</div>
            <div class="module-contents" id="contents-${module.id || module.module_id}">
                <div class="contents-loading">Cargando contenidos...</div>
            </div>
        </div>
    `;
}

// Open content modal (create or edit)
function openContentModal(courseId, moduleId, content = null) {
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('content-modal-title');
    const form = document.getElementById('content-form');
    
    if (!modal || !modalTitle || !form) {
        console.error('Modal elements not found');
        return;
    }
    
    // Reset form
    form.reset();
    
    // Clear form dataset
    form.removeAttribute('data-content-id');
    
    // Set module ID in form
    form.setAttribute('data-module-id', moduleId);
    form.setAttribute('data-course-id', courseId);
    
    if (content) {
        // Edit existing content
        modalTitle.textContent = 'Editar Contenido';
        document.getElementById('content-title').value = content.title || '';
        
        // Set content type
        const contentTypeSelect = document.getElementById('content-type');
        if (contentTypeSelect && content.content_type_id) {
            contentTypeSelect.value = content.content_type_id;
            // Update data container based on type
            updateContentDataField(content.content_type_id);
        }
        
        // Set content data
        const contentDataField = document.getElementById('content-data');
        if (contentDataField) {
            contentDataField.value = content.content_data || '';
        }
        
        // Set position
        document.getElementById('content-position').value = content.position || 1;
        
        // Set content ID in form
        form.setAttribute('data-content-id', content.content_id);
    } else {
        // New content
        modalTitle.textContent = 'Nuevo Contenido';
        
        // Get next available position
        const contentsContainer = document.getElementById(`content-container-${moduleId}`);
        const contentItems = contentsContainer ? contentsContainer.querySelectorAll('.content-item') : [];
        document.getElementById('content-position').value = contentItems.length + 1;
        
        // Set default content type and update field
        const contentTypeSelect = document.getElementById('content-type');
        if (contentTypeSelect) {
            updateContentDataField(contentTypeSelect.value);
        }
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus first field
    setTimeout(() => {
        document.getElementById('content-title').focus();
    }, 100);
}

// Close content modal
function closeContentModal() {
    const modal = document.getElementById('content-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Save content (create or update)
async function saveContent() {
    const form = document.getElementById('content-form');
    const moduleId = form.getAttribute('data-module-id');
    const courseId = form.getAttribute('data-course-id');
    const contentId = form.getAttribute('data-content-id');
    const isEdit = !!contentId;
    
    // Get form data
    const title = document.getElementById('content-title').value.trim();
    const contentTypeId = document.getElementById('content-type').value;
    const contentData = document.getElementById('content-data').value.trim();
    const position = parseInt(document.getElementById('content-position').value) || 1;
    
    // Validate required fields
    if (!title) {
        showError('El título del contenido es obligatorio');
        return;
    }
    
    if (!contentData && contentTypeId !== '3' && contentTypeId !== '4') {
        showError('El contenido es obligatorio');
        return;
    }
    
    // Create data object
    const data = {
        title: title,
        content_type_id: contentTypeId,
        content_data: contentData,
        position: position,
        module_id: moduleId
    };
    
    try {
        console.log('Saving content:', data);
        
        const url = isEdit 
            ? `/api/courses/${courseId}/modules/${moduleId}/contents/${contentId}` 
            : `/api/courses/${courseId}/modules/${moduleId}/contents`;
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`Sending ${method} request to ${url}`);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.error || 'Error al guardar el contenido');
        }
        
        console.log('Content saved successfully:', responseData);
        
        // Close modal
        closeContentModal();
        
        // Show success message
        showSuccess(isEdit ? 'Contenido actualizado correctamente' : 'Contenido creado correctamente');
        
        // Reload module contents
        loadModuleContents(courseId, moduleId);
        
    } catch (error) {
        console.error('Error saving content:', error);
        showError(`Error al guardar el contenido: ${error.message}`);
    }
}

// Setup content event listeners
function setupContentEventListeners(courseId) {
    // Content type change event
    const contentTypeSelect = document.getElementById('content-type');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', function() {
            updateContentDataField(this.value);
        });
    }
    
    // Save content button
    const saveContentBtn = document.getElementById('save-content-btn');
    if (saveContentBtn) {
        const newBtn = saveContentBtn.cloneNode(true);
        saveContentBtn.parentNode.replaceChild(newBtn, saveContentBtn);
        
        newBtn.addEventListener('click', function() {
            saveContent();
        });
    }
    
    // Content form submit
    const contentForm = document.getElementById('content-form');
    if (contentForm) {
        contentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveContent();
        });
    }
}

// Open module modal (create or edit)
function openModuleModal(courseId, module = null) {
    console.log('Opening module modal for course ID:', courseId);
    
    const modal = document.getElementById('module-modal');
    const modalTitle = document.getElementById('module-modal-title');
    const form = document.getElementById('module-form');
    
    if (!modal || !modalTitle || !form) {
        console.error('Modal elements not found:', {
            modal: !!modal,
            modalTitle: !!modalTitle,
            form: !!form
        });
        return;
    }
    
    // Reset form
    form.reset();
    
    if (module) {
        // Edit existing module
        console.log('Editing existing module:', module);
        modalTitle.textContent = 'Editar Módulo';
        document.getElementById('module-title').value = module.title;
        document.getElementById('module-description').value = module.description || '';
        document.getElementById('module-position').value = module.position;
        form.dataset.moduleId = module.module_id || module.id;
    } else {
        // Add new module
        console.log('Adding new module');
        modalTitle.textContent = 'Añadir Nuevo Módulo';
        delete form.dataset.moduleId;
        
        // Set next position
        const moduleCount = parseInt(document.getElementById('module-count')?.textContent) || 0;
        document.getElementById('module-position').value = moduleCount + 1;
    }
    
    // Asegurarse de que el courseId se guarde en el formulario
    form.dataset.courseId = courseId;
    
    // Mostrar el modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Enfocar el primer campo
    setTimeout(() => {
        document.getElementById('module-title').focus();
    }, 100);
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
            
        case '5': // Interactive
            label = document.createElement('label');
            label.setAttribute('for', 'content-data');
            label.textContent = 'Código HTML Interactivo';
            
            input = document.createElement('textarea');
            input.setAttribute('id', 'content-data');
            input.setAttribute('name', 'content-data');
            input.setAttribute('rows', '15');
            input.setAttribute('placeholder', 'Ingresa el código HTML interactivo aquí...');
            input.setAttribute('required', 'required');
            
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
    
    // Validar campos requeridos
    const title = document.getElementById('module-title').value.trim();
    if (!title) {
        showError('El título del módulo es obligatorio');
        return;
    }
    
    const moduleData = {
        title: title,
        description: document.getElementById('module-description').value.trim(),
        position: parseInt(document.getElementById('module-position').value) || 1,
        course_id: parseInt(courseId)
    };
    
    try {
        console.log('Guardando módulo:', moduleData);
        
        const url = isEdit ? `/api/courses/${courseId}/modules/${moduleId}` : `/api/courses/${courseId}/modules`;
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`Enviando petición ${method} a ${url}`);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moduleData)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.error || 'Error al guardar el módulo');
        }
        
        console.log('Módulo guardado correctamente:', responseData);
        
        // Cerrar modal y recargar módulos
        const modal = document.getElementById('module-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
        
        // Mostrar mensaje de éxito
        showSuccess(isEdit ? 'Módulo actualizado correctamente' : 'Módulo creado correctamente');
        
        // Recargar curso y módulos
        await loadModules(courseId);
        
    } catch (error) {
        console.error('Error saving module:', error);
        showError(`Error al guardar el módulo: ${error.message}`);
    }
}

// Delete module
async function deleteModule(moduleId, courseId) {
    try {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar el módulo');
        }
        
        // Mostrar mensaje de éxito
        showSuccess('Módulo eliminado correctamente');
        
        // Recargar módulos
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error deleting module:', error);
        showError(`Error al eliminar el módulo: ${error.message}`);
    }
}

// Delete content
async function deleteContent(contentId) {
    try {
        const response = await fetch(`/api/courses/modules/contents/${contentId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el contenido');
        }
        
        // Get course ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        
        showSuccess('Contenido eliminado correctamente');
        
        // Reload modules
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error deleting content:', error);
        showError(`Error al eliminar el contenido: ${error.message}`);
    }
}

// Confirm delete module
function confirmDeleteModule(moduleId, moduleTitle) {
    // Preparar el mensaje
    const message = `¿Estás seguro de que deseas eliminar el módulo <strong>${moduleTitle || 'este módulo'}</strong>?`;
    
    // Guardar referencia al moduleId para usarlo cuando se confirme
    const modal = document.getElementById('deleteModuleModal');
    if (modal) {
        modal.dataset.moduleId = moduleId;
    }
    
    // Definir la función de confirmación
    const confirmDelete = async () => {
        const confirmButton = document.getElementById('confirmDeleteModule');
        
        try {
            // Mostrar indicador de carga
            if (confirmButton) {
                confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
                confirmButton.disabled = true;
            }
            
            // Obtener el courseId de la URL
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id');
            
            if (!courseId) {
                throw new Error('No se pudo determinar el ID del curso');
            }
            
            await deleteModule(moduleId, courseId);
            
            // Cerrar el modal
            closeConfirmationModal('deleteModuleModal');
            
        } catch (error) {
            console.error('Error deleting module:', error);
            showError(error.message || 'Error al eliminar el módulo. Por favor, inténtalo de nuevo.');
            
            // Restaurar el botón
            if (confirmButton) {
                confirmButton.innerHTML = 'Eliminar';
                confirmButton.disabled = false;
            }
        }
    };
    
    // Abrir el modal con el mensaje y la función de confirmación
    openConfirmationModal('deleteModuleModal', message, confirmDelete);
}

// Confirm delete content
function confirmDeleteContent(contentId, contentTitle) {
    // Preparar el mensaje
    const message = `¿Estás seguro de que deseas eliminar el contenido <strong>${contentTitle || 'este contenido'}</strong>?`;
    
    // Guardar referencia al contentId para usarlo cuando se confirme
    const modal = document.getElementById('deleteContentModal');
    if (modal) {
        modal.dataset.contentId = contentId;
    }
    
    // Definir la función de confirmación
    const confirmDelete = async () => {
        const confirmButton = document.getElementById('confirmDeleteContent');
        
        try {
            // Mostrar indicador de carga
            if (confirmButton) {
                confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
                confirmButton.disabled = true;
            }
            
            await deleteContent(contentId);
            
            // Cerrar el modal
            closeConfirmationModal('deleteContentModal');
            
        } catch (error) {
            console.error('Error deleting content:', error);
            showError(error.message || 'Error al eliminar el contenido. Por favor, inténtalo de nuevo.');
            
            // Restaurar el botón
            if (confirmButton) {
                confirmButton.innerHTML = 'Eliminar';
                confirmButton.disabled = false;
            }
        }
    };
    
    // Abrir el modal con el mensaje y la función de confirmación
    openConfirmationModal('deleteContentModal', message, confirmDelete);
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

function renderModules(modules, courseId) {
    // Usar el selector correcto - este es el contenedor principal de módulos
    const modulesContainer = document.getElementById('modules-container');
    if (!modulesContainer) {
        console.error('No se encontró el contenedor de módulos (modules-container)');
        return;
    }
    
    // Clear existing modules
    modulesContainer.innerHTML = '';
    
    if (modules.length === 0) {
        modulesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cubes"></i>
                <p>Este curso no tiene módulos</p>
                <button id="add-first-module-btn" class="btn-primary">
                    <i class="fas fa-plus"></i> Añadir primer módulo
                </button>
            </div>
        `;
        
        // Add event listener to the add first module button
        const addFirstModuleBtn = document.getElementById('add-first-module-btn');
        if (addFirstModuleBtn) {
            addFirstModuleBtn.addEventListener('click', function() {
                openModuleModal(courseId);
            });
        }
        
        return;
    }
    
    // Sort modules by position
    modules.sort((a, b) => a.position - b.position);
    
    // Crear la lista de módulos con la estructura correcta
    const modulesList = document.createElement('div');
    modulesList.className = 'modules-list';
    modulesContainer.appendChild(modulesList);
    
    // Create module list
    modules.forEach(module => {
        const moduleItem = document.createElement('div');
        moduleItem.className = 'module-item';
        moduleItem.dataset.moduleId = module.id || module.module_id;
        
        moduleItem.innerHTML = `
        <div class="module-header">
            <div class="module-position">${module.position}</div>
            <div class="module-title">${module.title}</div>
            <div class="module-actions">
                <button class="edit-module-btn" data-tooltip="Editar módulo">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-module-btn" data-tooltip="Eliminar módulo">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="toggle-module-btn" data-tooltip="Expandir/Colapsar">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        </div>
        <div class="module-content" style="display: none;">
            <div class="module-description">
                ${module.description || 'Sin descripción'}
            </div>
            <div id="content-container-${module.id || module.module_id}" class="content-container">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando contenidos...</p>
                </div>
            </div>
            <div class="content-actions">
                <button class="add-content-btn" data-module-id="${module.id || module.module_id}">
                    <i class="fas fa-plus"></i> Añadir contenido
                </button>
            </div>
        </div>
    `;
        
        modulesList.appendChild(moduleItem);
        
        // Add event listeners to module actions
        const editBtn = moduleItem.querySelector('.edit-module-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openModuleModal(courseId, module);
            });
        }
        
        const deleteBtn = moduleItem.querySelector('.delete-module-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                confirmDeleteModule(module.id || module.module_id, module.title);
            });
        }
        
        const toggleBtn = moduleItem.querySelector('.toggle-module-btn');
        const moduleContent = moduleItem.querySelector('.module-content');
        
        if (toggleBtn && moduleContent) {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Toggle content visibility
                const isVisible = moduleContent.style.display !== 'none';
                moduleContent.style.display = isVisible ? 'none' : 'block';
                toggleBtn.querySelector('i').className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                
                // Load contents if expanding and not already loaded
                if (!isVisible) {
                    console.log(`Expandiendo módulo ${module.id || module.module_id} del curso ${courseId}`);
                    loadModuleContents(courseId, module.id || module.module_id);
                }
            });
        }
        
        // Add event listener to add content button
        const addContentBtn = moduleItem.querySelector('.add-content-btn');
        if (addContentBtn) {
            addContentBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openContentModal(courseId, module.id);
            });
        }
    });
    
    // Update module count in UI
    const moduleCountElement = document.getElementById('module-count');
    if (moduleCountElement) {
        moduleCountElement.textContent = modules.length;
    }
}

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