// Importar los módulos necesarios
import { setupEventListeners, setupContentEventListeners } from './admin-modules-events.js';
import { renderModules } from './admin-modules-ui.js';
import { loadCourseDetailsFromAPI, loadModulesFromAPI } from './admin-modules-api.js';
import { showError, showCourseSelectionView } from './admin-modules-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    // Obtener ID del curso desde parámetros de URL
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

// Cargar detalles del curso
async function loadCourseDetails(courseId) {
    try {
        // Verificar si el courseId es válido
        if (!courseId) {
            throw new Error('ID de curso no válido');
        }
        
        const course = await loadCourseDetailsFromAPI(courseId);
        
        // Actualizar detalles del curso en la UI
        const titleElement = document.getElementById('course-title');
        if (titleElement) {
            titleElement.textContent = course.title;
        }
        
        const descriptionElement = document.getElementById('course-description');
        if (descriptionElement) {
            descriptionElement.textContent = course.description || 'Sin descripción';
        }
        
        // Actualizar miniatura del curso si está disponible
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
        
        // Actualizar metadatos del curso (contador de módulos ahora se actualiza en renderModules)
        const contentCountElement = document.getElementById('content-count');
        if (contentCountElement) {
            contentCountElement.textContent = course.content_count || 0;
        }
        
        const enrolledCountElement = document.getElementById('enrolled-count');
        if (enrolledCountElement) {
            enrolledCountElement.textContent = course.student_count || 0;
        }
        
        // Actualizar título de la página
        document.title = `${course.title} - Módulos | Whirlpool Learning`;
        
    } catch (error) {
        console.error('Error loading course details:', error);
        showError(`Error al cargar los detalles del curso: ${error.message}`);
    }
}

// Cargar módulos para un curso
async function loadModules(courseId) {
    try {
        console.log('CORE: Loading modules for course ID:', courseId);

        const modules = await loadModulesFromAPI(courseId);
        // --- DEBUG LOG ---
        console.log('CORE: Modules data received from API:', JSON.stringify(modules, null, 2));
        if (!Array.isArray(modules)) {
            console.error('CORE: ERROR - Expected modules to be an array, but received:', typeof modules);
        }
        // --- END DEBUG LOG ---

        // Renderizar módulos
        renderModules(modules, courseId);
        
    } catch (error) {
        console.error('Error loading modules:', error);
        showError(`Error al cargar los módulos: ${error.message}`);
    }
}

// Exportar funciones para uso en otros módulos
export { loadCourseDetails, loadModules };
