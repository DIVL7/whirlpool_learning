// Funciones comunes para todas las páginas de técnicos

// Función para comprobar la sesión del usuario
async function checkUserSession() {
    hideSessionErrors(); // Ocultar mensajes de error anteriores
    try {
        const response = await fetch('/api/auth/check-session', { credentials: 'same-origin' });
        const data = await response.json();

        if (!data.loggedIn) {
            // Redirigir al inicio de sesión si no hay sesión
            window.location.href = '../index.html';
            return false;
        }

        // Si el usuario no es técnico, redirigir a la página adecuada
        if (data.user.role !== 'technician') {
            window.location.href = `../${data.user.role}/dashboard.html`;
            return false;
        }

        // Actualizar la interfaz con los datos del usuario
        updateUserInterface(data.user);
        return true;
    } catch (error) {
        console.error('Error checking session:', error);
        showNotification('Error al verificar la sesión. Por favor, recarga la página.', 'error');
        return false;
    }
}

// Función para actualizar la interfaz con los datos del usuario
function updateUserInterface(user) {
    // Actualizar nombre de usuario en la interfaz
    const userNameElements = document.querySelectorAll('#user-name, #welcome-name, #username-display');
    userNameElements.forEach(element => {
        if (element) element.textContent = user.username || user.full_name || 'Usuario';
    });

    // Actualizar avatar del usuario si está disponible
    const userAvatarElements = document.querySelectorAll('#user-avatar');
    if (user.profile_picture) {
        userAvatarElements.forEach(element => {
            if (element) element.src = `../images/${user.profile_picture}`;
        });
    }
}

// Función para manejar el cierre de sesión
async function handleLogout(event) {
    if (event) event.preventDefault();

    try {
        const response = await fetch('/api/auth/logout', { credentials: 'same-origin' });
        const data = await response.json();

        if (data.success) {
            window.location.href = '../index.html';
        } else {
            showNotification('Error al cerrar sesión', 'error');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
}

// Función para ocultar errores de sesión
function hideSessionErrors() {
    const errorMessages = document.querySelectorAll('.alert');
    errorMessages.forEach(msg => {
        if (msg.textContent.includes('sesión') || msg.textContent.includes('Error al verificar')) {
            msg.style.display = 'none';
        }
    });
}

// Inicialización común para todas las páginas de técnicos
function initTechnicianPage() {
    // Comprobar sesión del usuario
    checkUserSession();

    // Configurar el botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    setTimeout(hideSessionErrors, 1000);
}

// —— Toggle global de la sidebar (desktop: collapsed, móvil: slide) ——
document.addEventListener('DOMContentLoaded', () => {
    const btn     = document.getElementById('sidebar-toggle'),
          sidebar = document.querySelector('.sidebar'),
          main    = document.querySelector('.main-content'),
          mq      = window.matchMedia('(max-width:768px)');
  
    if (!btn || !sidebar || !main) return;
  
    btn.addEventListener('click', () => {
      if (mq.matches) {
        sidebar.classList.toggle('show');
      } else {
        sidebar.classList.toggle('collapsed');
        main.classList.toggle('sidebar-collapsed');
      }
    });
  
    mq.addListener(e => {
      if (e.matches)    sidebar.classList.add('collapsed');
      else              sidebar.classList.remove('collapsed');
      main.classList.remove('sidebar-collapsed');
    });
  });

// Exponer funciones globalmente
window.checkUserSession = checkUserSession;
window.updateUserInterface = updateUserInterface;
window.handleLogout = handleLogout;
window.initTechnicianPage = initTechnicianPage;
window.hideSessionErrors = hideSessionErrors;