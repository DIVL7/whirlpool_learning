// Redirigiendo a la nueva implementación
import { loadCourseDetails, loadModules } from './admin-modules/admin-modules-core.js';

// Exportar las funciones principales para mantener compatibilidad
export { loadCourseDetails, loadModules };

// Advertencia en consola
console.warn('admin-modules.js está obsoleto. Por favor, use admin-modules-core.js en su lugar.');