document.addEventListener('DOMContentLoaded', function() {
    // Load users data
    loadUsers();
    
    // Set up event listeners
    document.getElementById('add-user-btn').addEventListener('click', function() {
        openUserModal();
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('user-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close modal with close button
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('user-modal').style.display = 'none';
    });
    
    // User form submission
    document.getElementById('user-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveUser();
    });
    
    // Search functionality
    document.getElementById('user-search').addEventListener('input', function() {
        filterUsers(this.value);
    });
    
    // Role filter
    document.getElementById('role-filter').addEventListener('change', function() {
        filterUsersByRole(this.value);
    });
});

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Error al cargar los usuarios');
        }
        
        const users = await response.json();
        displayUsers(users);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Error al cargar los usuarios');
    }
}

// Display users in the table
function displayUsers(users) {
    const tableBody = document.querySelector('#users-table tbody');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        // Show empty state
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No hay usuarios disponibles</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Add each user to the table
    users.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.role = user.role;
        
        // Format role for display
        let roleDisplay = 'Usuario';
        let roleClass = 'role-user';
        
        switch (user.role) {
            case 'admin':
                roleDisplay = 'Administrador';
                roleClass = 'role-admin';
                break;
            case 'instructor':
                roleDisplay = 'Instructor';
                roleClass = 'role-instructor';
                break;
            case 'technician':
                roleDisplay = 'Técnico';
                roleClass = 'role-technician';
                break;
        }
        
        row.innerHTML = `
            <td>
                <div class="user-info-cell">
                    <div class="user-avatar">
                        ${user.avatar_url 
                            ? `<img src="${user.avatar_url}" alt="${user.first_name}">`
                            : `<div class="avatar-placeholder">${user.first_name.charAt(0)}${user.last_name.charAt(0)}</div>`
                        }
                    </div>
                    <div class="user-details">
                        <h3>${user.first_name} ${user.last_name}</h3>
                        <p>${user.email}</p>
                    </div>
                </div>
            </td>
            <td>${user.username}</td>
            <td><span class="role-badge ${roleClass}">${roleDisplay}</span></td>
            <td>${formatDate(user.created_at)}</td>
            <td>${user.last_login ? formatDate(user.last_login) : 'Nunca'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view-btn" title="Ver usuario" onclick="viewUser(${user.user_id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-btn" title="Editar usuario" onclick="editUser(${user.user_id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" title="Eliminar usuario" onclick="deleteUser(${user.user_id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Filter users based on search term
function filterUsers(searchTerm) {
    const rows = document.querySelectorAll('#users-table tbody tr');
    const lowerSearchTerm = searchTerm.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;
    
    rows.forEach(row => {
        const name = row.querySelector('.user-details h3').textContent.toLowerCase();
        const email = row.querySelector('.user-details p').textContent.toLowerCase();
        const username = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const role = row.dataset.role;
        
        // Check if matches search term
        const matchesSearch = name.includes(lowerSearchTerm) || 
                             email.includes(lowerSearchTerm) || 
                             username.includes(lowerSearchTerm);
        
        // Check if matches role filter
        const matchesRole = roleFilter === 'all' || role === roleFilter;
        
        // Show row if matches both filters
        row.style.display = (matchesSearch && matchesRole) ? '' : 'none';
    });
}

// Filter users by role
function filterUsersByRole(role) {
    const searchTerm = document.getElementById('user-search').value;
    filterUsers(searchTerm);
}

// Open user modal for adding or editing
function openUserModal(user = null) {
    const modal = document.getElementById('user-modal');
    const modalTitle = document.getElementById('user-modal-title');
    const form = document.getElementById('user-form');
    const passwordField = document.getElementById('user-password-container');
    
    // Reset form
    form.reset();
    
    if (user) {
        // Edit existing user
        modalTitle.textContent = 'Editar Usuario';
        document.getElementById('user-first-name').value = user.first_name;
        document.getElementById('user-last-name').value = user.last_name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-role').value = user.role;
        
        // Hide password field for editing (or make it optional)
        passwordField.style.display = 'none';
        document.getElementById('user-password').required = false;
        
        form.dataset.userId = user.user_id;
    } else {
        // Add new user
        modalTitle.textContent = 'Añadir Nuevo Usuario';
        delete form.dataset.userId;
        
        // Show password field for new users
        passwordField.style.display = 'block';
        document.getElementById('user-password').required = true;
    }
    
    modal.style.display = 'block';
}

// Save user (create or update)
async function saveUser() {
    const form = document.getElementById('user-form');
    const userId = form.dataset.userId;
    const isEdit = !!userId;
    
    // Get form data
    const userData = {
        first_name: document.getElementById('user-first-name').value,
        last_name: document.getElementById('user-last-name').value,
        email: document.getElementById('user-email').value,
        username: document.getElementById('user-username').value,
        role: document.getElementById('user-role').value
    };
    
    // Add password only for new users or if provided for existing users
    const password = document.getElementById('user-password').value;
    if (!isEdit || password) {
        userData.password = password;
    }
    
    try {
        const url = isEdit ? `/api/users/${userId}` : '/api/users';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el usuario');
        }
        
        // Close modal and reload users
        document.getElementById('user-modal').style.display = 'none';
        loadUsers();
        
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Error al guardar el usuario. Por favor, inténtalo de nuevo.');
    }
}

// Edit user
async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error('Error al cargar el usuario');
        }
        
        const user = await response.json();
        openUserModal(user);
        
    } catch (error) {
        console.error('Error loading user for edit:', error);
        alert('Error al cargar el usuario para editar. Por favor, inténtalo de nuevo.');
    }
}

// View user details
function viewUser(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el usuario');
        }
        
        // Reload users
        loadUsers();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error al eliminar el usuario. Por favor, inténtalo de nuevo.');
    }
}

// Eliminar la función showError existente (líneas 309-334)
// function showError(message) {
//     const errorContainer = document.createElement('div');
//     errorContainer.className = 'error-message';
//     errorContainer.innerHTML = `
//         <i class="fas fa-exclamation-circle"></i>
//         <span>${message}</span>
//     `;
//     
//     // Remove any existing error messages
//     const existingError = document.querySelector('.error-message');
//     if (existingError) {
//         existingError.remove();
//     }
//     
//     // Insert error at the top of the content
//     const contentContainer = document.querySelector('.dashboard-content');
//     contentContainer.insertBefore(errorContainer, contentContainer.firstChild);
//     
//     // Auto-remove after 5 seconds
//     setTimeout(() => {
//         errorContainer.classList.add('fade-out');
//         setTimeout(() => {
//             errorContainer.remove();
//         }, 500);
//     }, 5000);
// }