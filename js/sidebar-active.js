/**
 * Script para resaltar la sección activa en el menú lateral
 */
document.addEventListener('DOMContentLoaded', function() {
    // Obtener la ruta actual
    const currentPath = window.location.pathname;
    
    // Obtener todos los elementos del menú
    const menuItems = document.querySelectorAll('.sidebar-nav ul li a');
    
    // Eliminar la clase 'active' de todos los elementos del menú
    document.querySelectorAll('.sidebar-nav ul li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Recorrer todos los elementos del menú y comparar con la ruta actual
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        
        // Si la URL actual contiene la ruta del enlace, marcar como activo
        if (href && currentPath.includes(href) && href !== '/') {
            // Añadir la clase 'active' al elemento padre (li)
            const parentLi = item.closest('li');
            if (parentLi) {
                parentLi.classList.add('active');
                
                // Si es un submenú, también marcar el padre como activo
                const parentUl = parentLi.closest('ul.submenu');
                if (parentUl) {
                    const parentLiOfSubmenu = parentUl.closest('li');
                    if (parentLiOfSubmenu) {
                        parentLiOfSubmenu.classList.add('active');
                    }
                }
            }
        }
    });
    
    // Caso especial para la página de inicio/dashboard
    if (currentPath === '/' || currentPath.includes('/dashboard')) {
        const dashboardLink = document.querySelector('.sidebar-nav ul li a[href*="dashboard"]');
        if (dashboardLink) {
            dashboardLink.closest('li').classList.add('active');
        }
    }
});