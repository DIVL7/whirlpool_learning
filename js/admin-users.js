// Módulo para la gestión de usuarios en el panel de administración
const AdminUsers = (() => {
    // Variables para el estado
    let currentPage = 1;
    let totalPages = 1;
    let usersPerPage = 10;
    let currentSortBy = 'name'; // Default sort
    let currentUsers = [];
    let selectedUserId = null; // Used for single edit/view/delete actions
    let selectedUserIds = new Set(); // Used for bulk actions like assigning courses
    let initialAssignedCourseIds = new Set(); // To track courses for unassignment in edit mode
    let coursesMarkedForUnassignment = new Set(); // Tracks courses marked for deletion in the edit modal

    // Elementos DOM
    const userTable = document.querySelector('table tbody');
    const paginationContainer = document.querySelector('.pagination');
    const userModal = document.getElementById('userModal');
    const userForm = document.getElementById('userForm');
    // const userDetailsModal = document.getElementById('userDetailsModal'); // Removed
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const addUserBtn = document.getElementById('addUserBtn');
    const modalTitle = document.getElementById('modalTitle');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const assignCoursesBtn = document.getElementById('assignCoursesBtn');
    const assignCoursesModal = document.getElementById('assignCoursesModal');
    const assignCoursesForm = document.getElementById('assignCoursesForm');
    const selectedUsersList = document.getElementById('selectedUsersList');
    // Updated elements for course selection (now checkboxes)
    const availableCoursesCheckboxList = document.getElementById('availableCoursesCheckboxList'); // Changed from availableCoursesDropdown
    const coursesLoadingText = document.getElementById('coursesLoadingText');
    // Updated elements for the new custom list in Edit Modal
    const assignedCoursesList = document.getElementById('assignedCoursesList'); // Changed from assignedCoursesDropdown
    const assignedCoursesLoadingText = document.getElementById('assignedCoursesLoadingText');


    // Inicialización
    function init() {
        // Cargar usuarios al iniciar
        loadUsers();

        // Event listeners
        if (addUserBtn) {
            addUserBtn.addEventListener('click', showAddUserModal);
        }
        if (assignCoursesBtn) {
            assignCoursesBtn.addEventListener('click', showAssignCoursesModal);
        }

        // Event delegation para botones de acción Y checkboxes en la tabla
        if (userTable) {
            userTable.addEventListener('click', handleTableActions); // Handles buttons AND checkboxes now
        }

        // Formulario de usuario (Add/Edit)
        if (userForm) {
            userForm.addEventListener('submit', handleUserFormSubmit);
        }
        // Listener for delete buttons within the assigned courses list (using delegation)
        const assignedCoursesContainer = document.querySelector('.assigned-courses-container'); // Get the container
        if (assignedCoursesContainer) {
            assignedCoursesContainer.addEventListener('click', handleDeleteCourseClick);
        }
        // Formulario de asignación de cursos
        if (assignCoursesForm) {
            assignCoursesForm.addEventListener('submit', handleAssignCoursesSubmit);
        }

        // Checkbox "Seleccionar todos"
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', handleSelectAllCheckboxChange);
        }

        // Botones de cerrar modales (incluye el nuevo modal)
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });

        // Botón de confirmación de eliminación
        const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', deleteUser);
        }

        // Paginación
        if (paginationContainer) {
            paginationContainer.addEventListener('click', handlePagination);
        }

        // Sorting dropdown listener
        const sortBySelect = document.getElementById('sortBy');
        if (sortBySelect) {
            sortBySelect.addEventListener('change', handleSortChange);
        }
    }

    // Cargar usuarios desde la API
    async function loadUsers(page = 1, sortBy = currentSortBy) { // Add sortBy parameter
        try {
            showLoader();
            currentSortBy = sortBy; // Update current sort value

            // Clear selection when loading new page/sort order
            selectedUserIds.clear();

            // Realizar petición a la API con paginación y ordenamiento
            const response = await fetch(`/api/users?page=${page}&limit=${usersPerPage}&sortBy=${sortBy}`);

            if (!response.ok) {
                // Try to get error message from response body
                let errorMsg = 'Error al cargar usuarios';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { /* Ignore parsing error */ }
                throw new Error(errorMsg);
            }
            
            const data = await response.json();
            currentUsers = data.users;
            totalPages = data.totalPages;
            currentPage = page;
            
            // Renderizar usuarios y paginación
            renderUsers(currentUsers);
            renderPagination(currentPage, totalPages);
            updateSelectAllCheckboxState(); // Update checkbox state after render
            updateAssignButtonState(); // Update button state after render

            hideLoader();
        } catch (error) {
            console.error('Error loading users:', error);
            showNotification(error.message, 'error'); // Show specific error message if available
            // Clear table and pagination on error
            if (userTable) userTable.innerHTML = '<tr><td colspan="7" class="error-state">Error al cargar usuarios. Intente de nuevo.</td></tr>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            hideLoader();
        }
    }

    // Handle sort dropdown change
    function handleSortChange(e) {
        const newSortBy = e.target.value;
        loadUsers(1, newSortBy); // Load first page with new sort order
    }

    // Renderizar usuarios en la tabla
    function renderUsers(users) {
        if (!userTable) return;
        
        userTable.innerHTML = '';
        
        if (users.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" class="empty-table-message">
                    <i class="fas fa-users"></i>
                    <p>No hay usuarios disponibles</p>
                </td>
            `;
            userTable.appendChild(emptyRow);
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.dataset.userId = user.user_id;
            const isSelected = selectedUserIds.has(user.user_id.toString()); // Check if user is selected

            const roleClass = user.role === 'admin' ? 'admin' : 'technician';
            const roleName = user.role === 'admin' ? 'Administrador' : 'Técnico';

            row.innerHTML = `
                <td><input type="checkbox" class="user-checkbox" data-id="${user.user_id}" ${isSelected ? 'checked' : ''}></td>
                <td>${user.user_id}</td>
                <td>
                    <div class="user-info-cell">
                        <img src="${user.profile_picture ? '../images/' + user.profile_picture : '../images/default-avatar.png'}" alt="${user.first_name} ${user.last_name}">
                        <span>${user.first_name} ${user.last_name}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge-role ${roleClass}">${roleName}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>${formatTimeAgo(user.last_login)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-btn" title="Editar" data-id="${user.user_id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-btn" title="Eliminar" data-id="${user.user_id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            userTable.appendChild(row);
        });
    }

    // Renderizar paginación
    function renderPagination(currentPage, totalPages) {
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = '';
        
        // Botón anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.disabled = currentPage === 1;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.dataset.page = 'prev';
        paginationContainer.appendChild(prevBtn);
        
        // Páginas
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4 && totalPages > 5) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'pagination-btn';
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;
            paginationContainer.appendChild(pageBtn);
        }
        
        // Ellipsis y última página
        if (endPage < totalPages) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
            
            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'pagination-btn';
            lastPageBtn.textContent = totalPages;
            lastPageBtn.dataset.page = totalPages;
            paginationContainer.appendChild(lastPageBtn);
        }
        
        // Botón siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.dataset.page = 'next';
        paginationContainer.appendChild(nextBtn);
    }

    // Manejar acciones de paginación
    function handlePagination(e) {
        if (!e.target.closest('.pagination-btn')) return;
        
        const btn = e.target.closest('.pagination-btn');
        if (btn.disabled) return;
        
        let newPage = currentPage;
        
        if (btn.dataset.page === 'prev') {
            newPage = currentPage - 1;
        } else if (btn.dataset.page === 'next') {
            newPage = currentPage + 1;
        } else {
            newPage = parseInt(btn.dataset.page);
        }
        
        if (newPage !== currentPage) {
            loadUsers(newPage);
        }
    }

    // Manejar acciones en la tabla (botones y checkboxes)
    function handleTableActions(e) {
        const target = e.target;
        console.log("Table click target:", target); // Log the clicked element

        // Checkbox click
        if (target.classList.contains('user-checkbox')) {
            handleUserCheckboxChange(target);
            return; // Stop further processing if it was a checkbox
        }

        // Button click
        const btn = target.closest('.btn-icon');
        if (btn) {
            const userId = btn.dataset.id;
            selectedUserId = userId; // Keep track for single actions

            if (btn.classList.contains('edit-btn')) {
                showEditUserModal(userId);
            // } else if (btn.classList.contains('view-btn')) { // Removed view button logic
            //     showUserDetails(userId);
            } else if (btn.classList.contains('delete-btn')) {
                showDeleteConfirmation(userId);
            }
        }
    }

    // --- Checkbox Handling ---
    function handleUserCheckboxChange(checkbox) {
        const userId = checkbox.dataset.id;
        if (checkbox.checked) {
            selectedUserIds.add(userId);
        } else {
            selectedUserIds.delete(userId);
        }
        updateSelectAllCheckboxState();
        updateAssignButtonState();
    }

    function handleSelectAllCheckboxChange() {
        const isChecked = selectAllCheckbox.checked;
        const userCheckboxes = userTable.querySelectorAll('.user-checkbox');

        userCheckboxes.forEach(checkbox => {
            const userId = checkbox.dataset.id;
            checkbox.checked = isChecked;
            if (isChecked) {
                selectedUserIds.add(userId);
            } else {
                selectedUserIds.delete(userId);
            }
        });
        updateAssignButtonState();
    }

    function updateSelectAllCheckboxState() {
        if (!selectAllCheckbox) return;
        const userCheckboxes = userTable.querySelectorAll('.user-checkbox');
        const totalCheckboxes = userCheckboxes.length;
        const checkedCount = Array.from(userCheckboxes).filter(cb => cb.checked).length;

        if (totalCheckboxes === 0 || checkedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === totalCheckboxes) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    function updateAssignButtonState() {
        if (assignCoursesBtn) {
            const isDisabled = selectedUserIds.size === 0;
            assignCoursesBtn.disabled = isDisabled;
            // Debugging log:
            console.log(`Assign Button Update: Selected Count = ${selectedUserIds.size}, Disabled = ${isDisabled}`);
        } else {
             console.error("Assign Courses button element not found in updateAssignButtonState.");
        }
    }
    // --- End Checkbox Handling ---


    // Mostrar modal para añadir usuario
    function showAddUserModal() {
        modalTitle.textContent = 'Añadir Nuevo Usuario';
            userForm.reset();
            userForm.dataset.mode = 'add';
            // Ensure password fields are required for add mode
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (passwordInput) passwordInput.required = true;
            if (confirmPasswordInput) confirmPasswordInput.required = true;
            openModal(userModal);
    }

    // Mostrar modal para editar usuario
    async function showEditUserModal(userId) {
        try {
            showLoader();
            
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) throw new Error('Error al cargar datos del usuario');
            
            const user = await response.json();
            
            modalTitle.textContent = 'Editar Usuario';
            userForm.dataset.mode = 'edit';
            userForm.dataset.userId = userId;
            
            // Rellenar formulario con datos del usuario
            document.getElementById('firstName').value = user.first_name;
            document.getElementById('lastName').value = user.last_name;
            document.getElementById('email').value = user.email;
            document.getElementById('username').value = user.username;
            // document.getElementById('role').value = user.role; // Role field doesn't exist in edit modal

            // Make password fields optional for editing
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (passwordInput) {
                passwordInput.value = ''; // Clear password field
                passwordInput.placeholder = 'Dejar en blanco para no cambiar';
                passwordInput.required = false; // Not required for edit
            }
            if (confirmPasswordInput) {
                confirmPasswordInput.value = ''; // Clear confirm password field
                confirmPasswordInput.placeholder = 'Dejar en blanco para no cambiar';
                confirmPasswordInput.required = false; // Not required for edit
            }

            // --- Load and populate assigned courses ---
            initialAssignedCourseIds.clear(); // Clear previous initial state
            coursesMarkedForUnassignment.clear(); // Clear courses marked for deletion
            if (assignedCoursesList && assignedCoursesLoadingText) {
                assignedCoursesLoadingText.style.display = 'block';
                assignedCoursesList.innerHTML = ''; // Clear previous list items

                try {
                    const assignedCourses = await fetchAssignedCourses(userId); // Fetch assigned courses
                    assignedCoursesLoadingText.style.display = 'none';

                    if (assignedCourses.length === 0) {
                        assignedCoursesList.innerHTML = '<p class="no-courses-message">Este usuario no tiene cursos asignados.</p>';
                    } else {
                        assignedCourses.forEach(course => {
                            const courseItem = document.createElement('div');
                            courseItem.classList.add('course-list-item');
                            courseItem.dataset.courseId = course.course_id; // Store course ID on the item

                            const courseTitle = document.createElement('span');
                            courseTitle.textContent = course.title;
                            courseItem.appendChild(courseTitle);

                            const deleteButton = document.createElement('button');
                            deleteButton.type = 'button'; // Prevent form submission
                            deleteButton.classList.add('btn-icon', 'delete-course-btn');
                            deleteButton.dataset.courseId = course.course_id;
                            deleteButton.title = 'Marcar para desasignar';
                            deleteButton.innerHTML = '<i class="fas fa-times"></i>'; // Use 'times' icon for deletion marking
                            courseItem.appendChild(deleteButton);

                            assignedCoursesList.appendChild(courseItem);
                            initialAssignedCourseIds.add(course.course_id.toString()); // Store initial state
                        });
                    }
                } catch (fetchError) {
                    console.error("Error fetching assigned courses:", fetchError);
                    assignedCoursesLoadingText.textContent = 'Error al cargar cursos asignados.';
                    assignedCoursesLoadingText.style.display = 'block'; // Show error in loading text area
                    assignedCoursesList.innerHTML = ''; // Clear list on error
                    showNotification('Error al cargar cursos asignados.', 'error');
                }
            } else {
                 console.error("Assigned courses list container or loading text element not found.");
            }
            // --- End Load and populate assigned courses ---


            openModal(userModal);
            hideLoader();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al cargar datos del usuario', 'error');
            hideLoader();
        }
    }

    // --- Course Assignment/Unassignment Logic ---
    async function unassignCourses(userId, courseIds) {
        if (!userId || !courseIds || courseIds.length === 0) {
            console.log("Unassignment skipped: No user ID or course IDs provided.");
            return; // Nothing to unassign
        }

        console.log(`Attempting to unassign courses [${courseIds.join(', ')}] for user ${userId}`); // Debug log

        try {
            const response = await fetch('/api/users/unassign-courses', { // Use actual endpoint
                method: 'POST', // Or PUT/DELETE depending on API design
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseIds }) // Send user ID and courses to unassign
            });

            const result = await response.json(); // Try to parse JSON response

            if (!response.ok) {
                throw new Error(result.error || 'Error al desasignar cursos');
            }

            console.log(`Successfully unassigned courses for user ${userId}:`, result.message); // Debug log
            // Notification is handled in the caller function (handleUserFormSubmit) to avoid double notifications
        } catch (error) {
            console.error(`Error unassigning courses for user ${userId}:`, error);
            // Propagate the error to be handled in the calling function
            throw error;
        }
    }

    // --- Handle clicking the delete button next to an assigned course ---
    function handleDeleteCourseClick(e) {
        const deleteButton = e.target.closest('.delete-course-btn');
        if (!deleteButton) return; // Click wasn't on a delete button

        const courseItem = deleteButton.closest('.course-list-item');
        const courseId = deleteButton.dataset.courseId;

        if (!courseItem || !courseId) return;

        // Toggle visual state
        courseItem.classList.toggle('marked-for-deletion');

        // Update the set of courses marked for unassignment
        if (courseItem.classList.contains('marked-for-deletion')) {
            coursesMarkedForUnassignment.add(courseId);
            deleteButton.title = 'Cancelar desasignación'; // Update tooltip
        } else {
            coursesMarkedForUnassignment.delete(courseId);
            deleteButton.title = 'Marcar para desasignar'; // Reset tooltip
        }

        console.log("Courses marked for unassignment:", coursesMarkedForUnassignment); // Debug log
    }


    // --- Course Fetching Logic ---
    async function fetchAssignedCourses(userId) {
        try {
            const response = await fetch(`/api/users/${userId}/courses`); // Use actual endpoint
            if (!response.ok) {
                let errorMsg = 'Error al cargar cursos asignados';
                try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {}
                throw new Error(errorMsg);
            }
            const courses = await response.json();
            return courses;
        } catch (error) {
            console.error(`Error fetching assigned courses for user ${userId}:`, error);
            // Propagate the error to be handled in the calling function
            throw error;
        }
    }


    // --- Assign Courses Modal Logic ---

    async function fetchAvailableCourses() {
        try {
            const response = await fetch('/api/courses/list'); // Use actual endpoint
            // console.log('Fetch Courses Response Status:', response.status); // REMOVED DEBUG LOG

            // Try to clone the response to read it twice (once for logging, once for parsing)
            // const responseClone = response.clone(); // REMOVED DEBUG LOG
            // try { // REMOVED DEBUG LOG
            //     const rawText = await responseClone.text(); // REMOVED DEBUG LOG
            //     console.log('Fetch Courses Raw Response Text:', rawText); // REMOVED DEBUG LOG
            // } catch (e) { // REMOVED DEBUG LOG
            //     console.error('Error reading raw response text:', e); // REMOVED DEBUG LOG
            // } // REMOVED DEBUG LOG


            if (!response.ok) {
                 let errorMsg = 'Error al cargar cursos';
                 try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch(e) {}
                 throw new Error(errorMsg);
            }
            const courses = await response.json();
            // console.log('Fetched Courses Data:', courses); // REMOVED DEBUG LOG
            return courses;
        } catch (error) {
            console.error("Error fetching courses:", error);
            // Use the global showNotification assumed to be available from utils.js
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'No se pudieron cargar los cursos.', 'error');
            } else {
                alert(error.message || 'No se pudieron cargar los cursos.');
            }
            return []; // Return empty array on error
        }
    }


    async function showAssignCoursesModal() {
        // Add explicit check here, even if button state should prevent this
        if (selectedUserIds.size === 0) {
            // Use the global showNotification assumed to be available from utils.js
            if (typeof showNotification === 'function') {
                showNotification('Por favor, selecciona al menos un usuario para asignar cursos.', 'warning');
            } else {
                console.warn('showNotification function not found. Please select users first.');
                alert('Por favor, selecciona al menos un usuario para asignar cursos.'); // Fallback alert
            }
            return; // Stop execution
        }

        // Clear previous content
        selectedUsersList.innerHTML = '';
        if (availableCoursesCheckboxList) availableCoursesCheckboxList.innerHTML = ''; // Clear checkbox list
        if (coursesLoadingText) coursesLoadingText.textContent = 'Cargando cursos...'; // Reset loading text
        openModal(assignCoursesModal); // Open modal early to show loading state
        showLoader(); // Show loader inside modal potentially

        // Populate selected users
        selectedUserIds.forEach(userId => {
            const user = currentUsers.find(u => u.user_id.toString() === userId);
            if (user) {
                const li = document.createElement('li');
                li.textContent = `${user.first_name} ${user.last_name} (ID: ${userId})`;
                selectedUsersList.appendChild(li);
            }
        });

        // Fetch and populate available courses checkbox list
        if (availableCoursesCheckboxList && coursesLoadingText) {
            coursesLoadingText.style.display = 'block'; // Show loading text
            availableCoursesCheckboxList.innerHTML = ''; // Clear previous checkboxes

            const courses = await fetchAvailableCourses();

            if (courses.length === 0) {
                coursesLoadingText.textContent = 'No hay cursos disponibles.';
                coursesLoadingText.style.display = 'block';
            } else {
                courses.forEach(course => {
                    const listItem = document.createElement('div');
                    listItem.classList.add('checkbox-list-item');

                    const label = document.createElement('label');
                    label.htmlFor = `course-checkbox-${course.course_id}`; // Associate label with checkbox

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `course-checkbox-${course.course_id}`;
                    checkbox.value = course.course_id;
                    checkbox.name = 'courseSelection'; // Use a common name for the group

                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(` ${course.title}`)); // Add space before title

                    listItem.appendChild(label);
                    availableCoursesCheckboxList.appendChild(listItem);
                });
                coursesLoadingText.style.display = 'none'; // Hide loading text
            }
        } else {
            console.error("Available courses checkbox list or loading text element not found.");
        }
        hideLoader();
    }

    async function handleAssignCoursesSubmit(e) {
        e.preventDefault();
        showLoader();

        // Get selected courses from the checkboxes
        const selectedCheckboxes = availableCoursesCheckboxList
            ? availableCoursesCheckboxList.querySelectorAll('input[type="checkbox"]:checked')
            : [];
        const courseIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
        const userIds = Array.from(selectedUserIds);

        if (userIds.length === 0) {
            hideLoader();
            showNotification('No hay usuarios seleccionados.', 'error');
            return;
        }
        if (courseIds.length === 0) {
            hideLoader();
            showNotification('Selecciona al menos un curso para asignar.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/users/assign-courses', { // Use actual endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds, courseIds })
            });

            const result = await response.json(); // Always try to parse JSON response

            if (!response.ok) {
                throw new Error(result.error || 'Error al asignar cursos');
            }

            showNotification(result.message || 'Cursos asignados correctamente.', 'success'); // Use message from backend
            closeAllModals();
            // Optionally clear selection after assignment
            // selectedUserIds.clear();
            // updateSelectAllCheckboxState();
            // updateAssignButtonState();
            // renderUsers(currentUsers); // Re-render to clear checkboxes visually if needed

            hideLoader();
        } catch (error) {
            console.error("Error assigning courses:", error);
            showNotification(error.message, 'error');
            hideLoader();
        }
    }

    // --- End Assign Courses Modal Logic ---


    // // Mostrar detalles del usuario - REMOVED
    // async function showUserDetails(userId) { ... }

    // Mostrar confirmación de eliminación
    function showDeleteConfirmation(userId) {
        const user = currentUsers.find(u => u.user_id == userId);
        if (!user) return;
        
        document.getElementById('deleteUserName').textContent = `${user.first_name} ${user.last_name}`;
        deleteConfirmModal.dataset.userId = userId;
        
        openModal(deleteConfirmModal);
    }

    // Manejar envío del formulario de usuario
    async function handleUserFormSubmit(e) {
        e.preventDefault();

        let courseIdsToUnassign = []; // Declare here for broader scope
        let unassignError = null; // Declare here to store potential unassignment error
        let unassignmentSuccessful = true; // Keep track of unassignment success

        try {
            showLoader();

            const formData = new FormData(userForm);
            const mode = userForm.dataset.mode;
            const dataToSend = Object.fromEntries(formData);

            let url = '/api/users';
            let method = 'POST';

            // --- Password and Role Handling ---
            if (mode === 'add') {
                // Add mode: Check password confirmation and set role
                if (!dataToSend.password || dataToSend.password !== dataToSend.confirmPassword) {
                    hideLoader(); // Hide loader before showing error
                    showNotification('Las contraseñas no coinciden o están vacías.', 'error');
                    return; // Stop submission
                }
                dataToSend.role = 'technician'; // Ensure role is technician for new users
                delete dataToSend.confirmPassword; // Don't send confirmation to backend

            } else if (mode === 'edit') {
                // Edit mode: Handle optional password change
                url = `/api/users/${userForm.dataset.userId}`;
                method = 'PUT';

                // Remove confirmPassword field data
                delete dataToSend.confirmPassword;

                // Only include password if it's provided and not empty
                if (!dataToSend.password || dataToSend.password.trim() === '') {
                    delete dataToSend.password;
                } else {
                    // If password is provided, confirmPassword should also be checked (even though not sent)
                    const confirmPasswordValue = formData.get('confirmPassword');
                    if (dataToSend.password !== confirmPasswordValue) {
                         hideLoader(); // Hide loader before showing error
                         showNotification('Las contraseñas no coinciden.', 'error');
                         return; // Stop submission
                    }
                }
                // Role cannot be edited from this form
                delete dataToSend.role;

                // --- Course Unassignment Logic (Edit Mode Only) ---
                // Populate the previously declared variable
                courseIdsToUnassign = Array.from(coursesMarkedForUnassignment);

                // Remove assignedCourses from dataToSend if it exists (it shouldn't with the new structure)
                delete dataToSend.assignedCourses;
                // --- End Course Unassignment Logic ---

            }
            // --- End Password and Role Handling ---


            // *** User Update API Call ***
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend) // Send the processed data
            });

            if (!response.ok) {
                let errorMsg = 'Error al guardar usuario';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg; // Use 'error' field from backend
                } catch(e) { /* Ignore parsing error */ }
                throw new Error(errorMsg);
            }

            // Reset password field requirement for next time modal opens
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
                 if (passwordInput) passwordInput.required = true;
                 if (confirmPasswordInput) confirmPasswordInput.required = true;

            // --- Handle Unassignment After Successful User Update (Edit Mode Only) ---
            if (mode === 'edit' && courseIdsToUnassign.length > 0) {
                try {
                    console.log(`Attempting unassignment for user ${userForm.dataset.userId}, courses: ${courseIdsToUnassign.join(', ')}`); // Debug log
                    await unassignCourses(userForm.dataset.userId, courseIdsToUnassign);
                    console.log("Unassignment call successful."); // Debug log
                    // Success notification is handled below based on overall success
                } catch (errorCaughtDuringUnassign) {
                    unassignmentSuccessful = false; // Mark as failed
                    unassignError = errorCaughtDuringUnassign; // Store the error object
                    // Log the error but don't necessarily stop the flow if user update was successful
                    console.error("Error during course unassignment:", unassignError);
                    // The notification will be shown after closing the modal, using the stored error.
                }
            }
            // --- End Handle Unassignment ---

            closeAllModals(); // Close modal before showing final notification
            loadUsers(currentPage);
                    // Determine the final notification message based on update and unassignment success
                    let finalMessage = '';
                    let messageType = 'success';

                    if (mode === 'add') {
                        finalMessage = 'Usuario creado exitosamente';
                    } else { // mode === 'edit'
                        if (unassignmentSuccessful) {
                            finalMessage = 'Usuario actualizado exitosamente';
                            if (courseIdsToUnassign.length > 0) { // Check if unassignment was attempted
                                finalMessage += ' y cursos desasignados.';
                            }
                        } else {
                            // User update was OK, but unassignment failed
                            // Use the stored unassignError object
                            finalMessage = `Usuario actualizado, pero ${unassignError?.message || 'error al desasignar cursos.'}`;
                            messageType = 'warning';
                        }
                    }
                    showNotification(finalMessage, messageType);

            hideLoader();
        } catch (error) { // Catches errors from the main user update fetch or other logic before unassignment
            console.error('Error during user form submission:', error);
            showNotification(error.message || 'Error al guardar usuario', 'error');
            hideLoader();
        }
    }

    // Eliminar usuario
    async function deleteUser() {
        const userId = deleteConfirmModal.dataset.userId;
        if (!userId) return;
        
        try {
            showLoader();
            
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar usuario');
            }
            
            closeAllModals();
            loadUsers(currentPage);
            showNotification('Usuario eliminado exitosamente', 'success');
            
            hideLoader();
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message, 'error');
            hideLoader();
        }
    }

    // Funciones auxiliares
    function openModal(modal) {
        if (!modal) return;
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
    
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.classList.remove('modal-open');
    }
    
    function showLoader() {
        // Implementar lógica para mostrar loader
        const loader = document.querySelector('.loader');
        if (loader) loader.style.display = 'flex';
    }
    
    function hideLoader() {
        // Implementar lógica para ocultar loader
        const loader = document.querySelector('.loader');
        if (loader) loader.style.display = 'none';
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }
    
    function formatTimeAgo(dateString) {
        if (!dateString) return 'Nunca';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        
        if (diffMonth > 0) {
            return `Hace ${diffMonth} ${diffMonth === 1 ? 'mes' : 'meses'}`;
        } else if (diffWeek > 0) {
            return `Hace ${diffWeek} ${diffWeek === 1 ? 'semana' : 'semanas'}`;
        } else if (diffDay > 0) {
            return `Hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
        } else if (diffHour > 0) {
            return `Hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
        } else if (diffMin > 0) {
            return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
        } else {
            return 'Hace unos segundos';
        }
    }
    
    // Removed local showNotification function definition; using global one from utils.js

    // API pública
    return {
        init
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', AdminUsers.init);
