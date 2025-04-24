import { saveModule, openModuleModal } from './admin-modules-ui.js';
import { saveContent, updateContentDataField } from './admin-modules-content.js';

// Configurar event listeners
function setupEventListeners(courseId) {
    console.log('Setting up event listeners for course ID:', courseId);
    
    // Botón de añadir módulo
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
    
    // Botón de guardar módulo
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
    
    // Cerrar modales con botones de cierre
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Botón de volver a cursos (ahora con ID 'back-to-modules-btn')
    const backToCoursesBtn = document.getElementById('back-to-modules-btn'); 
    if (backToCoursesBtn) {
        // Clonar para evitar listeners duplicados si setupEventListeners se llama más de una vez
        const newBtn = backToCoursesBtn.cloneNode(true);
        backToCoursesBtn.parentNode.replaceChild(newBtn, backToCoursesBtn);

        newBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto si fuera un link
            window.location.href = 'courses.html'; // Navegar a la página de cursos
        });
    }
}

// Configurar event listeners para contenido
function setupContentEventListeners(courseId) {
    // Cambio de tipo de contenido - MOVED TO openContentModal in admin-modules-content.js
    
    // Botón de guardar contenido
    const saveContentBtn = document.getElementById('save-content-btn');
    if (saveContentBtn) {
        // Eliminar listeners existentes para evitar duplicados
        const newBtn = saveContentBtn.cloneNode(true);
        saveContentBtn.parentNode.replaceChild(newBtn, saveContentBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveContent();
        });
    }
    
    // Submit del formulario de contenido
    const contentForm = document.getElementById('content-form');
    if (contentForm) {
        // Eliminar listeners existentes para evitar duplicados
        const newForm = contentForm.cloneNode(true);
        contentForm.parentNode.replaceChild(newForm, contentForm);
        
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveContent();
        });
    }
    
    // Botón de cancelar contenido
    const cancelContentBtn = document.getElementById('cancel-content');
    if (cancelContentBtn) {
        cancelContentBtn.addEventListener('click', function() {
            const modal = document.getElementById('content-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Exportar funciones para uso en otros módulos
export { setupEventListeners, setupContentEventListeners };
