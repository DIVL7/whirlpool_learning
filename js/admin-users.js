document.addEventListener('DOMContentLoaded', function() {
    // Modal elements
    const userModal = document.getElementById('userModal');
    const userDetailsModal = document.getElementById('userDetailsModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const modalTitle = document.getElementById('modalTitle');
    
    // Buttons
    const addUserBtn = document.getElementById('addUserBtn');
    const editBtns = document.querySelectorAll('.edit-btn');
    const viewBtns = document.querySelectorAll('.view-btn');
    const deleteBtns = document.querySelectorAll('.delete-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const editUserBtn = document.querySelector('.edit-user-btn');
    const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
    
    // Forms
    const userForm = document.getElementById('userForm');
    
    // Filter elements
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortBy = document.getElementById('sortBy');
    const searchInput = document.querySelector('.search-container input');
    
    // Event listeners for opening modals
    addUserBtn.addEventListener('click', function() {
        modalTitle.textContent = 'Añadir Nuevo Usuario';
        userForm.reset();
        openModal(userModal);
    });
    
    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const userId = row.querySelector('td:first-child').textContent;
            const userName = row.querySelector('.user-info-cell span').textContent;
            
            modalTitle.textContent = 'Editar Usuario: ' + userName;
            
            // In a real application, you would fetch user data from the server
            // and populate the form fields
            populateUserForm(userId);
            
            openModal(userModal);
        });
    });
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const userId = row.querySelector('td:first-child').textContent;
            
            // In a real application, you would fetch user details from the server
            // For now, we'll just use the data from the table row
            const userName = row.querySelector('.user-info-cell span').textContent;
            const userEmail = row.querySelector('td:nth-child(3)').textContent;
            const userRole = row.querySelector('td:nth-child(4) span').textContent;
            const userImage = row.querySelector('.user-info-cell img').src;
            
            document.getElementById('detailsName').textContent = userName;
            document.getElementById('detailsEmail').textContent = userEmail;
            document.getElementById('detailsRole').textContent = userRole;
            document.getElementById('detailsProfileImage').src = userImage;
            
            openModal(userDetailsModal);
        });
    });
    
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const userName = row.querySelector('.user-info-cell span').textContent;
            
            document.getElementById('deleteUserName').textContent = userName;
            openModal(deleteConfirmModal);
        });
    });
    
    // Event listener for edit button in user details modal
    editUserBtn.addEventListener('click', function() {
        closeModal(userDetailsModal);
        
        const userName = document.getElementById('detailsName').textContent;
        modalTitle.textContent = 'Editar Usuario: ' + userName;
        
        // In a real application, you would fetch user data and populate the form
        // For now, we'll just open the empty form
        openModal(userModal);
    });
    
    // Event listener for confirm delete button
    confirmDeleteBtn.addEventListener('click', function() {
        // In a real application, you would send a delete request to the server
        alert('Usuario eliminado correctamente');
        closeModal(deleteConfirmModal);
    });
    
    // Event listeners for closing modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });
    
    // Form submission
    userForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Validate form
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        // In a real application, you would send the form data to the server
        alert('Usuario guardado correctamente');
        closeModal(userModal);
    });
    
    // Filter event listeners
    roleFilter.addEventListener('change', filterUsers);
    statusFilter.addEventListener('change', filterUsers);
    sortBy.addEventListener('change', sortUsers);
    searchInput.addEventListener('input', searchUsers);
    
    // Helper functions
    function openModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
    
    function populateUserForm(userId) {
        // In a real application, you would fetch user data from the server
        // For now, we'll just reset the form
        userForm.reset();
    }
    
    function filterUsers() {
        // In a real application, you would filter the users based on the selected criteria
        console.log('Filtering users...');
        console.log('Role:', roleFilter.value);
        console.log('Status:', statusFilter.value);
    }
    
    function sortUsers() {
        // In a real application, you would sort the users based on the selected criteria
        console.log('Sorting users by:', sortBy.value);
    }
    
    function searchUsers() {
        // In a real application, you would search for users based on the input
        console.log('Searching for:', searchInput.value);
    }
});