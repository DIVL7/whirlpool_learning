// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordToggle.classList.remove('fa-eye');
        passwordToggle.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordToggle.classList.remove('fa-eye-slash');
        passwordToggle.classList.add('fa-eye');
    }
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const remember = document.getElementById('remember') ? document.getElementById('remember').checked : false;
    
    // Validate form
    if (!username || !password) {
        showError('Por favor, completa todos los campos.');
        return;
    }
    
    // Show loading state
    const submitButton = document.querySelector('.btn-login-submit');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Iniciando sesión...';
    submitButton.disabled = true;
    
    // Send login request to server
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, remember })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error de red');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Login successful
            window.location.href = data.redirect;
        } else {
            // Login failed
            showError(data.message || 'Usuario o contraseña incorrectos.');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showError('Error de conexión. Por favor, inténtalo de nuevo más tarde.');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

// Display error message
function showError(message) {
    // Check if error message already exists
    let errorElement = document.getElementById('errorMessage');
    
    if (!errorElement) {
        // Create error element if it doesn't exist
        errorElement = document.createElement('div');
        errorElement.id = 'errorMessage';
        
        // Insert after form
        const form = document.getElementById('loginForm');
        form.parentNode.insertBefore(errorElement, form.nextSibling);
    }
    
    // Set error message
    errorElement.textContent = message;
    
    // Add error styles
    errorElement.style.color = 'var(--error-color)';
    errorElement.style.marginTop = '15px';
    errorElement.style.textAlign = 'center';
    errorElement.style.display = 'block';
}