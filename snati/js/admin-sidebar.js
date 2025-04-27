document.addEventListener('DOMContentLoaded', function() {
    // Toggle submenu visibility when parent menu item is clicked
    const menuItemsWithSubmenu = document.querySelectorAll('.sidebar-nav li > a + ul.submenu');
    
    menuItemsWithSubmenu.forEach(submenu => {
        const parentLink = submenu.previousElementSibling;
        
        parentLink.addEventListener('click', function(e) {
            e.preventDefault();
            const parentLi = this.parentElement;
            
            // Toggle active class
            parentLi.classList.toggle('submenu-expanded');
            
            // Toggle submenu visibility
            if (submenu.style.display === 'block') {
                submenu.style.display = 'none';
            } else {
                submenu.style.display = 'block';
            }
        });
    });
    
    // Ensure submenus of active items are visible
    const activeMenuItems = document.querySelectorAll('.sidebar-nav li.active');
    activeMenuItems.forEach(item => {
        const submenu = item.querySelector('ul.submenu');
        if (submenu) {
            submenu.style.display = 'block';
        }
    });
});