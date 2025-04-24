import { loadModuleContents } from './admin-modules-content.js';
import { showSuccess, showError } from './admin-modules-utils.js';
import { loadModules } from './admin-modules-core.js';

// Renderizar módulos
function renderModules(modules, courseId) {
    const modulesContainer = document.getElementById('modules-container');
    if (!modulesContainer) {
        console.error('Modules container not found');
        return;
    }
    
    // Limpiar el contenedor
    modulesContainer.innerHTML = '';
    
    if (!modules || modules.length === 0) {
        // Mostrar estado vacío
        modulesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cubes"></i>
                <p>Este curso no tiene módulos</p>
                <button id="add-first-module-btn" class="btn-primary">
                    <i class="fas fa-plus"></i> Añadir primer módulo
                </button>
            </div>
        `;
        
        // Agregar event listener al botón
        const addFirstModuleBtn = document.getElementById('add-first-module-btn');
        if (addFirstModuleBtn) {
            addFirstModuleBtn.addEventListener('click', function() {
                openModuleModal(courseId);
            });
        }
        
        return;
    }
    
    // --- Update Module Counter ---
    const moduleCountElement = document.getElementById('module-count');
    if (moduleCountElement) {
        moduleCountElement.textContent = modules.length;
    }
    // --- End Update Module Counter ---

    // Ordenar módulos por posición
    modules.sort((a, b) => a.position - b.position);
    
    // Crear lista de módulos
    modules.forEach(module => {
        const moduleElement = document.createElement('div');
        moduleElement.className = 'module-card';
        moduleElement.dataset.moduleId = module.id || module.module_id; // Usar id o module_id
        
        moduleElement.innerHTML = `
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
                    <button class="add-content-btn" data-tooltip="Agregar contenido">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="toggle-content-btn" data-tooltip="Mostrar/ocultar contenidos">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="module-content-container" id="content-container-${module.id || module.module_id}" style="display: none;">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Cargando contenidos...</span>
                </div>
            </div>
        `;
        
        modulesContainer.appendChild(moduleElement);
        
        // Agregar event listeners a las acciones del módulo
        const editBtn = moduleElement.querySelector('.edit-module-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openModuleModal(courseId, module);
            });
        }
        
        const deleteBtn = moduleElement.querySelector('.delete-module-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Usar el ID del módulo de forma más segura
                const moduleId = module.id || module.module_id;
                confirmDeleteModule(moduleId, module.title);
            });
        }
        
        // Agregar event listener para el botón de agregar contenido
        const addContentBtn = moduleElement.querySelector('.add-content-btn');
        if (addContentBtn) {
            addContentBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const moduleId = module.id || module.module_id;
                // Importar la función desde admin-modules-content.js
                import('./admin-modules-content.js').then(module => {
                    module.openContentModal(courseId, moduleId);
                });
            });
        }
        
        const toggleBtn = moduleElement.querySelector('.toggle-content-btn');
        const contentContainer = moduleElement.querySelector('.module-content-container');
        
        if (toggleBtn && contentContainer) {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const isVisible = contentContainer.style.display !== 'none';
                
                if (isVisible) {
                    contentContainer.style.display = 'none';
                    this.querySelector('i').className = 'fas fa-chevron-down';
                } else {
                    contentContainer.style.display = 'block';
                    this.querySelector('i').className = 'fas fa-chevron-up';
                    
                    // Cargar contenidos si no se han cargado ya
                    if (contentContainer.querySelector('.loading-indicator')) {
                        // Obtener el ID del módulo de forma más segura
                        const moduleId = module.id || module.module_id || moduleElement.dataset.moduleId;
                        if (moduleId) {
                            console.log('Cargando contenidos para el módulo ID:', moduleId);
                            loadModuleContents(courseId, moduleId);
                        } else {
                            console.error('Error: No se pudo obtener el ID del módulo', module);
                            showError('Error al cargar los contenidos: ID de módulo no válido');
                        }
                    }
                }
            });
        }
    });
}

// Abrir modal de módulo
function openModuleModal(courseId, module = null) {
    const modal = document.getElementById('module-modal');
    const modalTitle = document.getElementById('module-modal-title');
    const form = document.getElementById('module-form');
    
    if (!modal || !modalTitle || !form) {
        console.error('Modal elements not found');
        return;
    }
    
    // Limpiar formulario
    form.reset();
    
    // Configurar modal según si es edición o creación
    if (module) {
        modalTitle.textContent = 'Editar Módulo';
        
        // Rellenar formulario con datos del módulo
        document.getElementById('module-title').value = module.title || '';
        document.getElementById('module-description').value = module.description || '';
        document.getElementById('module-position').value = module.position || 1;
        
        // Agregar ID del módulo como atributo de datos
        form.dataset.moduleId = module.module_id || module.id;
    } else {
        modalTitle.textContent = 'Añadir Nuevo Módulo';
        
        // Eliminar ID del módulo si existe
        delete form.dataset.moduleId;
        
        // Establecer posición predeterminada
        const modulesContainer = document.getElementById('modules-container');
        const moduleCards = modulesContainer ? modulesContainer.querySelectorAll('.module-card') : [];
        document.getElementById('module-position').value = moduleCards.length + 1;
    }
    
    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Evitar scroll
    
    // Enfocar el primer campo
    document.getElementById('module-title').focus();
}

// Guardar módulo
async function saveModule(courseId) {
    try {
        // Validar que tenemos un ID de curso
        if (!courseId) {
            showError('No se ha especificado un curso');
            return;
        }
        
        // Obtener datos del formulario
        const form = document.getElementById('module-form');
        const title = document.getElementById('module-title').value.trim();
        const description = document.getElementById('module-description').value.trim();
        const position = parseInt(document.getElementById('module-position').value) || 1;
        
        // Validar datos
        if (!title) {
            showError('El título del módulo es obligatorio');
            return;
        }
        
        // Crear objeto con datos del módulo
        const moduleData = {
            title,
            description,
            position,
            course_id: courseId
        };
        
        // Determinar si es creación o actualización
        const moduleId = form.dataset.moduleId;
        const isUpdate = !!moduleId;
        
        // URL y método según operación
        const url = isUpdate 
            ? `/api/courses/${courseId}/modules/${moduleId}` 
            : `/api/courses/${courseId}/modules`;
        const method = isUpdate ? 'PUT' : 'POST';
        
        // Enviar petición
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moduleData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar el módulo');
        }
        
        // Procesar respuesta
        const data = await response.json();
        
        // Cerrar modal
        const modal = document.getElementById('module-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Mostrar mensaje de éxito
        showSuccess(isUpdate ? 'Módulo actualizado correctamente' : 'Módulo creado correctamente');
        
        // Recargar módulos
        loadModules(courseId);
        
    } catch (error) {
        console.error('Error saving module:', error);
        showError(`Error al guardar el módulo: ${error.message}`);
    }
}

// Confirmar eliminación de módulo
function confirmDeleteModule(moduleId, moduleTitle) {
    if (!moduleId) {
        showError('No se ha especificado un módulo para eliminar');
        return;
    }
    
    // Obtener elementos del modal
    const modal = document.getElementById('deleteModuleModal');
    const titleSpan = document.getElementById('deleteModuleTitle');
    const confirmBtn = document.getElementById('confirmDeleteModule');
    
    if (!modal || !confirmBtn) {
        console.error('Delete modal elements not found');
        return;
    }
    
    // Actualizar el título del módulo en el modal
    if (titleSpan) {
        titleSpan.textContent = moduleTitle || 'sin título';
    }
    
    // Guardar el ID del módulo en el botón para usarlo en la confirmación
    confirmBtn.dataset.moduleId = moduleId;
    
    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Configurar botón de confirmación
    // Eliminar listeners previos
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    // Agregar nuevo listener
    newBtn.addEventListener('click', async function() {
        try {
            // Obtener ID del curso
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id');
            
            if (!courseId) {
                throw new Error('No se ha especificado un curso');
            }
            
            // Obtener el ID del módulo del dataset
            const moduleId = this.dataset.moduleId;
            
            if (!moduleId) {
                throw new Error('No se ha especificado un módulo para eliminar');
            }
            
            // Enviar petición para eliminar módulo
            const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el módulo');
            }
            
            // Cerrar modal
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Mostrar mensaje de éxito
            showSuccess('Módulo eliminado correctamente');
            
            // Recargar módulos
            loadModules(courseId);
            
        } catch (error) {
            console.error('Error deleting module:', error);
            showError(`Error al eliminar el módulo: ${error.message}`);
            
            // Cerrar modal
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Configurar botones para cerrar modal
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
}

// Mostrar vista de selección de curso
function showCourseSelectionView() {
    // Implementación de la función showCourseSelectionView
    // ...
}

// Cargar cursos disponibles
function loadAvailableCourses(page = 1) {
    // Implementación de la función loadAvailableCourses
    // ...
}

// Crear HTML de paginación
function createPaginationHTML(pagination) {
    // Implementación de la función createPaginationHTML
    // ...
}

// Exportar funciones para uso en otros módulos
export { 
    renderModules, 
    openModuleModal, 
    saveModule, 
    confirmDeleteModule, 
    showCourseSelectionView, 
    loadAvailableCourses, 
    createPaginationHTML 
};
