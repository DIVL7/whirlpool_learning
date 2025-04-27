// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Get header height for offset
                const headerHeight = document.querySelector('header').offsetHeight;
                
                window.scrollTo({
                    top: targetElement.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header scroll effect
    document.addEventListener('DOMContentLoaded', function() {
        const header = document.querySelector('header');
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.style.backgroundColor = 'rgba(255, 255, 255, 1)'; /* Fully opaque when scrolled */
            } else {
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'; /* Slightly transparent when at top */
            }
        });
    });
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    
    if (isLoggedIn && username) {
        // Update login button to show username
        const loginButton = document.querySelector('.btn-login');
        
        if (loginButton) {
            loginButton.textContent = username;
            
            // Determine redirect based on username
            if (username === 'admin1') {
                loginButton.href = 'admin/dashboard.html';
            } else {
                loginButton.href = 'technician/dashboard.html';
            }
        }
    }
});