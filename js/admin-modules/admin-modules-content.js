import { showError, showSuccess } from './admin-modules-utils.js';
import { saveContentToAPI, deleteContentFromAPI } from './admin-modules-api.js';

// Cargar contenidos de un módulo
async function loadModuleContents(courseId, moduleId) {
    try {
        // Verificar que moduleId no sea undefined
        if (!moduleId) {
            console.error('Error: moduleId es undefined');
            // En lugar de lanzar un error, podemos retornar temprano
            const contentContainer = document.getElementById(`content-container-${moduleId}`);
            if (contentContainer) {
                contentContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>No se puede cargar contenidos: ID de módulo no válido</p>
                    </div>
                `;
            }
            return; // Retornar temprano sin lanzar error
        }
        
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/contents`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar los contenidos');
        }
        
        // Modificación: Verificar el formato de la respuesta y extraer los contenidos correctamente
        const data = await response.json();
        // Verificar si la respuesta tiene un formato específico (con propiedad 'contents')
        const contents = Array.isArray(data) ? data : (data.contents || []);
        
        const contentContainer = document.getElementById(`content-container-${moduleId}`);
        if (!contentContainer) return;
        
        // Limpiar indicador de carga
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
            
            // Agregar event listener al botón de añadir contenido
            const addContentBtn = contentContainer.querySelector('.add-content-btn');
            if (addContentBtn) {
                addContentBtn.addEventListener('click', function() {
                    openContentModal(courseId, moduleId);
                });
            }
            
            return;
        }
        
        // Ordenar contenidos por posición
        contents.sort((a, b) => a.position - b.position);
        
        // Crear lista de contenidos
        const contentList = document.createElement('div');
        contentList.className = 'content-list';
        contentContainer.appendChild(contentList);
        
        contents.forEach(content => {
            const contentItem = document.createElement('div');
            contentItem.className = 'content-item';
            contentItem.dataset.contentId = content.content_id;
            
            // Determinar icono y etiqueta del tipo de contenido
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
            
            // Agregar event listeners a las acciones de contenido
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

// Función para abrir el modal de contenido
function openContentModal(courseId, moduleId, content = null) {
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('content-modal-title');
    const form = document.getElementById('content-form');
    
    if (!modal || !modalTitle || !form) {
        console.error('Elementos del modal no encontrados');
        return;
    }
    
    // Limpiar formulario
    form.reset();
    
    // Configurar modal según si es edición o creación
    if (content) {
        modalTitle.textContent = 'Editar Contenido';
        
        // Rellenar formulario con datos del contenido
        document.getElementById('content-title').value = content.title || '';
        document.getElementById('content-type').value = content.content_type_id || '';
        document.getElementById('content-position').value = content.position || 1;
        
        // Actualizar campo de datos según el tipo de contenido
        updateContentDataField(content.content_type_id);
        
        // Rellenar valor para Texto/Video, mostrar archivo actual para PDF/Imagen
        const contentTypeId = parseInt(content.content_type_id);
        if (contentTypeId === 1 || contentTypeId === 2) { // Video or Text
            const contentInput = document.getElementById('content-data');
            if(contentInput) contentInput.value = content.content_data || '';
        } else if (contentTypeId === 3 || contentTypeId === 4) { // PDF or Image
            // No se puede setear el valor de un input file. Mostrar el archivo actual.
            const container = document.getElementById('content-data-container');
            if (container && content.content_data) {
                const currentFileElement = document.createElement('div');
                currentFileElement.className = 'current-file-info';
                // Extraer solo el nombre del archivo de la ruta
                const fileName = content.content_data.split('/').pop(); 
                currentFileElement.innerHTML = `Archivo actual: <a href="${content.content_data}" target="_blank">${fileName}</a> <small>(Selecciona un nuevo archivo para reemplazar)</small>`;
                // Insertar después del input file
                const fileInput = container.querySelector('#content-data');
                if (fileInput) {
                    fileInput.insertAdjacentElement('afterend', currentFileElement);
                    // Hacer que el input file no sea 'required' al editar si ya hay un archivo
                    fileInput.required = false; 
                }
            } else if (container) {
                 // Si no hay content_data (raro, pero posible), asegurar que sea requerido
                 const fileInput = container.querySelector('#content-data');
                 if (fileInput) fileInput.required = true;
            }
        }
        
        // Agregar IDs como atributos de datos
        form.dataset.contentId = content.content_id;
        form.dataset.moduleId = moduleId;
        form.dataset.courseId = courseId;
    } else {
        modalTitle.textContent = 'Añadir Nuevo Contenido';
        
        // Eliminar IDs si existen
        delete form.dataset.contentId;
        
        // Guardar IDs necesarios
        form.dataset.moduleId = moduleId;
        form.dataset.courseId = courseId;
        
        // Establecer posición predeterminada
        const contentContainer = document.getElementById(`content-container-${moduleId}`);
        const contentItems = contentContainer ? contentContainer.querySelectorAll('.content-item') : [];
        document.getElementById('content-position').value = contentItems.length + 1;
        
        // Restablecer campo de datos - Mostrar placeholder inicial
        const container = document.getElementById('content-data-container');
        if (container) {
            container.innerHTML = `
                <label>Contenido</label>
                <div class="content-placeholder">Selecciona un tipo de contenido arriba para continuar.</div>
            `;
        }
        // Asegurarse que el select esté vacío
        document.getElementById('content-type').value = ''; 
    }
    
    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Evitar scroll
    
    // Enfocar el primer campo
    document.getElementById('content-title').focus();

    // --- Handle Content Type Dropdown and Listener ---
    const originalSelect = document.getElementById('content-type'); 
    if (originalSelect) {
        // Clone and replace BEFORE setting value or adding listener
        const newSelect = originalSelect.cloneNode(true);
        originalSelect.parentNode.replaceChild(newSelect, originalSelect);

        // Set the value on the NEW select if editing
        if (content) {
            newSelect.value = content.content_type_id || '';
        } else {
            newSelect.value = ''; // Ensure it's empty for new content
        }

        // Add the listener to the new element
        newSelect.addEventListener('change', function() {
            updateContentDataField(this.value);
            // Re-populate data if it's text/video after type change during edit
            if (content && (parseInt(this.value) === 1 || parseInt(this.value) === 2)) {
                 const contentInput = document.getElementById('content-data');
                 if(contentInput) contentInput.value = content.content_data || '';
            } else if (content && (parseInt(this.value) === 3 || parseInt(this.value) === 4)) {
                // Re-show file info if type changed back to file during edit
                 const container = document.getElementById('content-data-container');
                 if (container && content.content_data) {
                    // Remove existing info if present before adding again
                    const existingInfo = container.querySelector('.current-file-info');
                    if (existingInfo) existingInfo.remove();
                    // Add file info
                    const currentFileElement = document.createElement('div');
                    currentFileElement.className = 'current-file-info';
                    const fileName = content.content_data.split('/').pop();
                    currentFileElement.innerHTML = `Archivo actual: <a href="${content.content_data}" target="_blank">${fileName}</a> <small>(Selecciona un nuevo archivo para reemplazar)</small>`;
                    const fileInput = container.querySelector('#content-data');
                    if (fileInput) {
                        fileInput.insertAdjacentElement('afterend', currentFileElement);
                        fileInput.required = false; // Not required if editing existing file
                    }
                 }
            }
        });

        // Trigger update once *after* setting value to ensure correct field shows initially
        updateContentDataField(newSelect.value);

        // Re-populate data for text/video or show file info *after* the field is created by updateContentDataField
        if (content) {
            const contentTypeId = parseInt(content.content_type_id);
            if (contentTypeId === 1 || contentTypeId === 2) { // Video or Text
                const contentInput = document.getElementById('content-data');
                if(contentInput) contentInput.value = content.content_data || '';
            } else if (contentTypeId === 3 || contentTypeId === 4) { // PDF or Image
                const container = document.getElementById('content-data-container');
                if (container && content.content_data) {
                    // Remove existing info if present (might be duplicated by change handler)
                    const existingInfo = container.querySelector('.current-file-info');
                    if (existingInfo) existingInfo.remove();
                    // Add file info
                    const currentFileElement = document.createElement('div');
                    currentFileElement.className = 'current-file-info';
                    const fileName = content.content_data.split('/').pop();
                    currentFileElement.innerHTML = `Archivo actual: <a href="${content.content_data}" target="_blank">${fileName}</a> <small>(Selecciona un nuevo archivo para reemplazar)</small>`;
                    const fileInput = container.querySelector('#content-data');
                    if (fileInput) {
                        fileInput.insertAdjacentElement('afterend', currentFileElement);
                        fileInput.required = false; // Not required if editing existing file
                    }
                } else if (container) {
                     // Ensure required is true if editing but no file exists
                     const fileInput = container.querySelector('#content-data');
                     if (fileInput) fileInput.required = true;
                }
            }
        }
    }
    // --- End Content Type Handling ---
}

// Función para guardar contenido
async function saveContent() {
    try {
        const form = document.getElementById('content-form');
        if (!form) {
            showError('Formulario no encontrado');
            return;
        }
        
        // Obtener IDs necesarios
        const courseId = form.dataset.courseId;
        const moduleId = form.dataset.moduleId;
        const contentId = form.dataset.contentId;
        
        if (!courseId || !moduleId) {
            showError('Información de curso o módulo no disponible');
            return;
        }
        
        // Obtener datos del formulario
        const title = document.getElementById('content-title').value.trim();
        const contentTypeId = document.getElementById('content-type').value;
        const contentInput = document.getElementById('content-data'); // Get the input element
        const position = parseInt(document.getElementById('content-position').value) || 1;
        
        // Validar datos
        if (!title) {
            showError('El título del contenido es obligatorio');
            return;
        }
        
        if (!contentTypeId) {
            showError('Debe seleccionar un tipo de contenido');
            return;
        }

        // Crear FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content_type_id', contentTypeId);
        formData.append('position', position);
        formData.append('module_id', moduleId);

        // Si es edición, agregar ID del contenido
        if (contentId) {
            formData.append('content_id', contentId);
        }

        // Manejar archivo o valor de texto/URL
        if (contentInput.type === 'file') {
            if (contentInput.files.length > 0) {
                formData.append('content_data', contentInput.files[0]); // Append the file
            } else if (!contentId) { // Only require file for new content
                showError('Debe seleccionar un archivo');
                return;
            }
            // If editing and no new file is selected, the backend should keep the old file.
            // We don't append 'content_data' in this case for edits unless it's required and empty.
            // The 'required' attribute was potentially removed in openContentModal if a file existed.
        } else { // Text or Video
            const contentDataValue = contentInput.value.trim();
            if (!contentDataValue) {
                showError('El contenido (URL o texto) no puede estar vacío');
                return;
            }
            formData.append('content_data', contentDataValue); // Append the text/URL value
        }

        // Guardar contenido usando FormData
        await saveContentToAPI(courseId, moduleId, formData, !!contentId); // Pass formData and isEdit flag
        
        // Cerrar modal
        const modal = document.getElementById('content-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Mostrar mensaje de éxito
        showSuccess(contentId ? 'Contenido actualizado correctamente' : 'Contenido creado correctamente');
        
        // Recargar contenidos
        loadModuleContents(courseId, moduleId);
        
    } catch (error) {
        console.error('Error saving content:', error);
        showError(`Error al guardar el contenido: ${error.message}`);
    }
}

// Función para actualizar el campo de datos de contenido
function updateContentDataField(contentType) {
    const container = document.getElementById('content-data-container');
    if (!container) return;
    
    // Convertir a número si es string
    const typeId = parseInt(contentType) || 0;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear campo según el tipo de contenido
    switch (typeId) {
        case 1: // Video
            container.innerHTML = `
                <label for="content-data">URL del Video</label>
                <input type="url" id="content-data" name="content_data" placeholder="https://www.youtube.com/watch?v=..." required>
                <small class="form-hint">Introduce la URL de YouTube o Vimeo</small>
            `;
            break;
            
        case 2: // Texto
            container.innerHTML = `
                <label for="content-data">Contenido de Texto</label>
                <textarea id="content-data" name="content_data" rows="10" placeholder="Escribe el contenido aquí..." required></textarea>
                <small class="form-hint">Puedes usar formato Markdown para dar estilo al texto</small>
            `;
            break;
            
        case 3: // PDF
            container.innerHTML = `
                <label for="content-data">Archivo PDF</label>
                <input type="file" id="content-data" name="content_data" accept=".pdf"> 
                <small class="form-hint">Selecciona un archivo PDF (máx. 10MB)</small> 
            `;
            // 'required' será manejado en openContentModal para edición
            break;
            
        case 4: // Imagen
            container.innerHTML = `
                <label for="content-data">Archivo de Imagen</label>
                <input type="file" id="content-data" name="content_data" accept="image/*">
                <small class="form-hint">Selecciona un archivo de imagen (JPG, PNG, GIF - máx. 5MB)</small>
                
            `;
             // 'required' será manejado en openContentModal para edición
            break;
            
        default:
            container.innerHTML = `
                <label for="content-data">Contenido</label>
                <textarea id="content-data" name="content_data" rows="5" placeholder="Selecciona un tipo de contenido..." required></textarea>
            `;
    }
}

// Función para confirmar eliminación de contenido
function confirmDeleteContent(contentId, contentTitle) {
    if (!contentId) {
        showError('No se ha especificado un contenido para eliminar');
        return;
    }
    
    // Obtener elementos del modal
    const modal = document.getElementById('deleteContentModal');
    const titleSpan = document.getElementById('deleteContentTitle');
    const confirmBtn = document.getElementById('confirmDeleteContent');
    
    if (!modal || !confirmBtn) {
        console.error('Elementos del modal de eliminación no encontrados');
        return;
    }
    
    // Actualizar el título del contenido en el modal
    if (titleSpan) {
        titleSpan.textContent = contentTitle || 'sin título';
    }
    
    // Guardar el ID del contenido en el botón para usarlo en la confirmación
    confirmBtn.dataset.contentId = contentId;
    
    // Obtener el moduleId del elemento del contenido
    const contentElement = document.querySelector(`.content-item[data-content-id="${contentId}"]`);
    let moduleId;
    
    if (contentElement) {
        const moduleContainer = contentElement.closest('.module-content-container');
        if (moduleContainer) {
            moduleId = moduleContainer.id.replace('content-container-', '');
            // Guardar el moduleId en el botón
            confirmBtn.dataset.moduleId = moduleId;
        }
    }
    
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
            // Obtener el ID del contenido del dataset
            const contentId = this.dataset.contentId;
            
            if (!contentId) {
                throw new Error('No se ha especificado un contenido para eliminar');
            }
            
            // Enviar petición para eliminar contenido
            await deleteContentFromAPI(contentId);
            
            // Cerrar modal
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Mostrar mensaje de éxito
            showSuccess('Contenido eliminado correctamente');
            
            // Obtener IDs para recargar contenidos
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id');
            const moduleId = this.dataset.moduleId;
            
            if (moduleId && courseId) {
                // Recargar contenidos
                loadModuleContents(courseId, moduleId);
            }
            
        } catch (error) {
            console.error('Error deleting content:', error);
            showError(`Error al eliminar el contenido: ${error.message}`);
            
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

// Exportar funciones para uso en otros módulos
export { 
    loadModuleContents, 
    updateContentDataField, 
    saveContent,
    openContentModal,
    confirmDeleteContent
};
