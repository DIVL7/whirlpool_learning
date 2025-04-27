document.addEventListener('DOMContentLoaded', async () => {
    // Elementos del DOM
    const forumCategoriesContainer = document.getElementById('forum-categories');
    const categoryFilterSelect = document.getElementById('category-filter');
    const topicCategorySelect = document.getElementById('topic-category');
    const forumTopicsTable = document.getElementById('forum-topics');
    const newTopicForm = document.getElementById('new-topic-form');
    const topicModal = document.getElementById('topic-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const newAnswerForm = document.getElementById('new-answer-form');
    const searchInput = document.getElementById('forum-search');
    const usernameDisplay = document.getElementById('username-display');

    // Variables de estado
    let currentUser = null;
    let currentQuestionId = null;
    let allTopics = [];

    // Inicializar la página de técnico (incluye verificación de sesión)
    initTechnicianPage();

    // Obtener datos del usuario actual desde la sesión
    try {
        const response = await fetch('/api/auth/check-session', { credentials: 'same-origin' });
        const data = await response.json();

        if (data.loggedIn) {
            currentUser = data.user;

            // Inicializar el foro
            initPage();
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        showNotification('Error al obtener datos del usuario', 'error');
    }


    // Cargar categorías del foro
    async function loadCategories() {
        try {
            const response = await fetch('/api/forum/categories');
            const categories = await response.json();

            // Vaciar contenedores
            forumCategoriesContainer.innerHTML = '';

            // Agregar opciones a los selectores
            categoryFilterSelect.innerHTML = '<option value="">Todas las categorías</option>';
            topicCategorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

            // Añadir categorías al contenedor principal
            categories.forEach(category => {
                // Crear elemento de categoría
                const categoryElement = document.createElement('div');
                categoryElement.className = 'forum-category card-base';
                categoryElement.innerHTML = `
                    <h4>${category.name}</h4>
                    <p>${category.description || ''}</p>
                `;
                categoryElement.addEventListener('click', () => {
                    categoryFilterSelect.value = category.category_id;
                    loadTopics(category.category_id);
                });
                forumCategoriesContainer.appendChild(categoryElement);

                // Agregar a selectores
                categoryFilterSelect.innerHTML += `<option value="${category.category_id}">${category.name}</option>`;
                topicCategorySelect.innerHTML += `<option value="${category.category_id}">${category.name}</option>`;
            });
        } catch (error) {
            console.error('Error loading categories:', error);
            forumCategoriesContainer.innerHTML = '<div class="error-message">Error al cargar las categorías</div>';
            showNotification('Error al cargar las categorías del foro', 'error');
        }
    }

    // Cargar temas del foro
    async function loadTopics(categoryId = '') {
        try {
            const url = categoryId
                ? `/api/forum/questions?category_id=${categoryId}`
                : '/api/forum/questions';

            const response = await fetch(url);
            const topics = await response.json();

            // Guardar todos los temas
            allTopics = topics;

            // Mostrar temas
            displayTopics(topics);
        } catch (error) {
            console.error('Error loading topics:', error);
            forumTopicsTable.innerHTML = '<tr><td colspan="4" class="error-message">Error al cargar los temas</td></tr>';
            showNotification('Error al cargar los temas del foro', 'error');
        }
    }

    // Mostrar temas en la tabla
    function displayTopics(topics) {
        if (topics.length === 0) {
            forumTopicsTable.innerHTML = '<tr><td colspan="4" class="empty-message">No hay temas en esta categoría</td></tr>';
            return;
        }

        forumTopicsTable.innerHTML = '';

        topics.forEach(topic => {
            const row = document.createElement('tr');

            // Formatear la fecha
            const date = new Date(topic.created_at);
            const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            row.innerHTML = `
                <td>
                    <div class="topic-title-container">
                        <a href="#" class="topic-link" data-id="${topic.question_id}">
                            ${topic.title}
                        </a>
                        ${topic.is_solved ? '<span class="solved-badge">Resuelto</span>' : ''}
                    </div>
                    <div class="topic-category">
                        <span class="category-tag">${topic.category_name}</span>
                    </div>
                </td>
                <td>${topic.author_name}</td>
                <td>${topic.answer_count}</td>
                <td>${formattedDate}</td>
            `;

            // Agregar evento para abrir el modal
            const topicLink = row.querySelector('.topic-link');
            topicLink.addEventListener('click', (e) => {
                e.preventDefault();
                openTopicModal(topic.question_id);
            });

            forumTopicsTable.appendChild(row);
        });
    }

    // Abrir modal con detalles del tema y respuestas
    async function openTopicModal(questionId) {
        try {
            currentQuestionId = questionId;

            const response = await fetch(`/api/forum/questions/${questionId}`);
            const topicData = await response.json();

            // Mostrar detalles del tema
            const topicDetailContainer = document.getElementById('topic-detail');
            const answersContainer = document.getElementById('answers-container');

            // Formatear la fecha
            const date = new Date(topicData.created_at);
            const formattedDate = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Verificar si el usuario actual es el autor de la pregunta para mostrar el botón de eliminar
            const deleteButton = currentUser && currentUser.user_id === topicData.user_id
                ? `<button class="delete-question-btn" data-id="${topicData.question_id}"><i class="fas fa-trash-alt"></i> Eliminar</button>`
                : '';

            topicDetailContainer.innerHTML = `
                <div class="topic-header">
                    <h3>${topicData.title}</h3>
                    <div class="topic-meta">
                        <span class="category-tag">${topicData.category_name}</span>
                        ${topicData.is_solved ? '<span class="solved-badge">Resuelto</span>' : ''}
                    </div>
                </div>
                <div class="topic-author">
                    <div class="author-info">
                        <img src="${topicData.author_picture || '../images/default-avatar.jpg'}" alt="${topicData.author_name}" class="author-avatar">
                        <span class="author-name">${topicData.author_name}</span>
                    </div>
                    <div class="topic-actions">
                        <span class="topic-date">${formattedDate}</span>
                        ${deleteButton}
                    </div>
                </div>
                <div class="topic-content">
                    ${topicData.content}
                </div>
                <div class="topic-stats">
                    <span>Vistas: ${topicData.views || 0}</span>
                    <span>Respuestas: ${topicData.answers ? topicData.answers.length : 0}</span>
                </div>
            `;

            // IMPORTANTE: Asignar el evento al botón después de añadirlo al DOM
            const deleteQuestionBtn = topicDetailContainer.querySelector('.delete-question-btn');
            if (deleteQuestionBtn) {
                // Asignar un evento de clic directo sin función anónima
                deleteQuestionBtn.onclick = function () {
                    deleteQuestion(topicData.question_id);
                };
            }

            // Mostrar respuestas
            if (!topicData.answers || topicData.answers.length === 0) {
                answersContainer.innerHTML = '<div class="no-answers">Aún no hay respuestas para este tema. ¡Sé el primero en responder!</div>';
            } else {
                answersContainer.innerHTML = '';

                topicData.answers.forEach(answer => {
                    const answerDate = new Date(answer.created_at);
                    const formattedAnswerDate = answerDate.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const voteScore = (answer.upvotes || 0) - (answer.downvotes || 0);

                    // Verificar si el usuario actual es el autor de la respuesta para mostrar el botón de eliminar
                    const deleteAnswerButton = currentUser && currentUser.user_id === answer.user_id
                        ? `<button class="delete-answer-btn" data-id="${answer.answer_id}" title="Eliminar respuesta"><i class="fas fa-trash-alt"></i> Eliminar</button>`
                        : '';

                    const answerElement = document.createElement('div');
                    answerElement.className = `answer ${answer.is_accepted ? 'accepted-answer' : ''}`;
                    answerElement.innerHTML = `
                    <div class="answer-author">
                        <div class="author-info">
                            <img src="${answer.author_picture || '../images/default-avatar.jpg'}" alt="${answer.author_name}" class="author-avatar">
                            <span class="author-name">${answer.author_name}</span>
                        </div>
                        <div class="answer-actions-top">
                            <span class="answer-date">${formattedAnswerDate}</span>
                            ${deleteAnswerButton}
                        </div>
                    </div>
                    <div class="answer-content">
                        ${answer.content}
                    </div>
                    <div class="answer-actions">
                        <div class="vote-container">
                            <button class="vote-btn upvote" data-id="${answer.answer_id}" title="Votar a favor">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <span class="vote-count">${voteScore}</span>
                            <button class="vote-btn downvote" data-id="${answer.answer_id}" title="Votar en contra">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </div>
                        ${answer.is_accepted ?
                            '<div class="accepted-mark"><i class="fas fa-check-circle"></i> Respuesta aceptada</div>' :
                            (currentUser && topicData.user_id === currentUser.user_id ?
                                `<button class="accept-answer-btn" data-id="${answer.answer_id}">Aceptar respuesta</button>` :
                                '')}
                    </div>
                `;

                    answersContainer.appendChild(answerElement);

                    // Después de agregar al DOM, añadir eventos
                    const upvoteBtn = answerElement.querySelector('.upvote');
                    const downvoteBtn = answerElement.querySelector('.downvote');
                    const acceptBtn = answerElement.querySelector('.accept-answer-btn');
                    const deleteBtn = answerElement.querySelector('.delete-answer-btn');

                    if (upvoteBtn) {
                        upvoteBtn.addEventListener('click', () => voteForAnswer(answer.answer_id, 'upvote'));
                    }

                    if (downvoteBtn) {
                        downvoteBtn.addEventListener('click', () => voteForAnswer(answer.answer_id, 'downvote'));
                    }

                    if (acceptBtn) {
                        acceptBtn.addEventListener('click', () => acceptAnswer(answer.answer_id));
                    }

                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => deleteAnswer(answer.answer_id));
                    }
                });
            }

            // Mostrar el modal
            topicModal.style.display = 'block';

            // Restablecer el formulario de respuesta
            if (newAnswerForm) {
                newAnswerForm.reset();
            }
        } catch (error) {
            console.error('Error loading topic details:', error);
            showNotification('Error al cargar los detalles del tema', 'error');
        }
    }

    // Cerrar modal
    function closeTopicModal() {
        topicModal.style.display = 'none';
        currentQuestionId = null;
    }

    // Votar por una respuesta
    async function voteForAnswer(answerId, voteType) {
        try {
            if (!currentUser) {
                showNotification('Debes iniciar sesión para votar', 'warning');
                return;
            }

            // Obtener el contenedor de votos y sus elementos
            const voteContainer = document.querySelector(`.vote-btn[data-id="${answerId}"]`).closest('.vote-container');
            const upvoteBtn = voteContainer.querySelector('.upvote');
            const downvoteBtn = voteContainer.querySelector('.downvote');

            // Verificar si el usuario está intentando quitar su voto
            let actualVoteType = voteType;
            if ((voteType === 'upvote' && upvoteBtn.classList.contains('voted')) ||
                (voteType === 'downvote' && downvoteBtn.classList.contains('voted'))) {
                // Si ya tiene ese tipo de voto, lo quitamos (enviamos 'none')
                actualVoteType = 'none';
            }

            const response = await fetch(`/api/forum/answers/${answerId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vote_type: actualVoteType }),
            });

            const result = await response.json();

            if (response.ok) {
                // Actualizar la UI para mostrar los votos actualizados
                const voteCount = voteContainer.querySelector('.vote-count');

                const voteScore = (result.upvotes || 0) - (result.downvotes || 0);
                voteCount.textContent = voteScore;

                // Actualizar los estilos de los botones según el resultado
                if (actualVoteType === 'upvote') {
                    upvoteBtn.classList.add('voted');
                    downvoteBtn.classList.remove('voted');
                    showNotification('Voto positivo registrado', 'success');
                } else if (actualVoteType === 'downvote') {
                    upvoteBtn.classList.remove('voted');
                    downvoteBtn.classList.add('voted');
                    showNotification('Voto negativo registrado', 'success');
                } else {
                    // Si es 'none', quitamos ambas clases
                    upvoteBtn.classList.remove('voted');
                    downvoteBtn.classList.remove('voted');
                    showNotification('Voto eliminado', 'info');
                }
            } else {
                showNotification(result.error || 'Error al registrar el voto', 'error');
            }
        } catch (error) {
            console.error('Error voting for answer:', error);
            showNotification('Error al registrar el voto', 'error');
        }
    }

    // Aceptar una respuesta
    async function acceptAnswer(answerId) {
        try {
            if (!currentUser) {
                showNotification('Debes iniciar sesión para aceptar respuestas', 'warning');
                return;
            }

            const response = await fetch(`/api/forum/answers/${answerId}/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok) {
                // Recargar los detalles del tema para mostrar la respuesta aceptada
                openTopicModal(currentQuestionId);
                showNotification('Respuesta aceptada con éxito', 'success');
            } else {
                showNotification(result.error || 'Error al aceptar la respuesta', 'error');
            }
        } catch (error) {
            console.error('Error accepting answer:', error);
            showNotification('Error al aceptar la respuesta', 'error');
        }
    }

    // Función para crear un diálogo de confirmación personalizado
    function showConfirmationDialog(message, confirmCallback) {
        // Eliminar cualquier diálogo existente antes de crear uno nuevo
        const existingDialogs = document.querySelectorAll('.confirmation-dialog');
        existingDialogs.forEach(dialog => dialog.remove());

        // Crear el contenedor principal del diálogo con createElement en lugar de innerHTML
        const dialogContainer = document.createElement('div');
        dialogContainer.className = 'confirmation-dialog';

        // Crear el contenido interno con elementos DOM separados
        const dialogContent = document.createElement('div');
        dialogContent.className = 'confirmation-content';

        // Añadir el título
        const titleElement = document.createElement('h4');
        titleElement.textContent = 'Confirmar acción';
        dialogContent.appendChild(titleElement);

        // Añadir el mensaje
        const messageElement = document.createElement('p');
        messageElement.textContent = message; // Usar textContent en lugar de innerHTML
        dialogContent.appendChild(messageElement);

        // Añadir los botones
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'confirmation-buttons';

        const confirmButton = document.createElement('button');
        confirmButton.className = 'btn-confirm-delete';
        confirmButton.textContent = 'Aceptar';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn-cancel';
        cancelButton.textContent = 'Cancelar';

        buttonsContainer.appendChild(confirmButton);
        buttonsContainer.appendChild(cancelButton);
        dialogContent.appendChild(buttonsContainer);

        // Añadir el contenido al contenedor principal
        dialogContainer.appendChild(dialogContent);

        // Añadir el diálogo al DOM
        document.body.appendChild(dialogContainer);

        // Añadir eventos a los botones
        confirmButton.addEventListener('click', () => {
            dialogContainer.remove();
            confirmCallback();
        });

        cancelButton.addEventListener('click', () => {
            dialogContainer.remove();
        });

        // Si se hace clic fuera del contenido del diálogo, cerrar
        dialogContainer.addEventListener('click', (e) => {
            if (e.target === dialogContainer) {
                dialogContainer.remove();
            }
        });
    }
    // Crear un nuevo tema
    async function createNewTopic(e) {
        e.preventDefault();

        try {
            if (!currentUser) {
                showNotification('Debes iniciar sesión para crear un tema', 'warning');
                return;
            }

            const title = document.getElementById('topic-title').value.trim();
            const content = document.getElementById('topic-content').value.trim();
            const categoryId = document.getElementById('topic-category').value;

            if (!title || !content || !categoryId) {
                showNotification('Por favor, completa todos los campos', 'warning');
                return;
            }

            const response = await fetch('/api/forum/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    category_id: categoryId
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Limpiar el formulario
                newTopicForm.reset();

                // Recargar la lista de temas
                loadTopics();

                showNotification('Tema creado exitosamente', 'success');

                // Opcionalmente, abrir el nuevo tema
                if (result.question_id) {
                    setTimeout(() => {
                        openTopicModal(result.question_id);
                    }, 500);
                }
            } else {
                showNotification(result.error || 'Error al crear el tema', 'error');
            }
        } catch (error) {
            console.error('Error creating topic:', error);
            showNotification('Error al crear el tema', 'error');
        }
    }

    // Eliminar un tema
    function deleteQuestion(questionId) {
        showConfirmationDialog('¿Estás seguro que deseas eliminar esta pregunta? Esta acción no se puede deshacer.', async () => {
            try {
                const response = await fetch(`/api/forum/questions/${questionId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
                const result = await response.json();

                if (response.ok && result.success) {
                    closeTopicModal();
                    loadTopics();
                    showNotification('Pregunta eliminada exitosamente', 'success');
                } else {
                    showNotification(result.error || 'Error al eliminar la pregunta', 'error');
                }
            } catch (error) {
                console.error('Error deleting question:', error);
                showNotification('Error al eliminar la pregunta', 'error');
            }
        });
    }

    // Responder a un tema
    async function submitAnswer(e) {
        e.preventDefault();

        try {
            if (!currentUser) {
                showNotification('Debes iniciar sesión para responder', 'warning');
                return;
            }

            if (!currentQuestionId) {
                showNotification('Error: No se ha seleccionado un tema', 'error');
                return;
            }

            const content = document.getElementById('answer-content').value.trim();

            if (!content) {
                showNotification('Por favor, escribe tu respuesta', 'warning');
                return;
            }

            const response = await fetch(`/api/forum/questions/${currentQuestionId}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            const result = await response.json();

            if (response.ok) {
                // Limpiar el formulario
                newAnswerForm.reset();

                // Recargar los detalles del tema para mostrar la nueva respuesta
                openTopicModal(currentQuestionId);

                showNotification('Respuesta publicada exitosamente', 'success');
            } else {
                showNotification(result.error || 'Error al publicar la respuesta', 'error');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            showNotification('Error al publicar la respuesta', 'error');
        }
    }

    // Elminar respuesta a tema
    function deleteAnswer(answerId) {
        showConfirmationDialog('¿Estás seguro que deseas eliminar esta respuesta? Esta acción no se puede deshacer.', async () => {
            try {
                const response = await fetch(`/api/forum/answers/${answerId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
                const result = await response.json();

                if (response.ok && result.success) {
                    openTopicModal(currentQuestionId);
                    showNotification('Respuesta eliminada exitosamente', 'success');
                } else {
                    showNotification(result.error || 'Error al eliminar la respuesta', 'error');
                }
            } catch (error) {
                console.error('Error deleting answer:', error);
                showNotification('Error al eliminar la respuesta', 'error');
            }
        });
    }

    // Búsqueda en el foro
    function searchTopics() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            displayTopics(allTopics);
            return;
        }

        const filteredTopics = allTopics.filter(topic =>
            topic.title.toLowerCase().includes(searchTerm) ||
            (topic.content && topic.content.toLowerCase().includes(searchTerm)) ||
            topic.author_name.toLowerCase().includes(searchTerm) ||
            topic.category_name.toLowerCase().includes(searchTerm)
        );

        displayTopics(filteredTopics);
    }

    // Inicializar la página
    async function initPage() {
        await checkUserSession();
        await loadCategories();
        await loadTopics();

        // Event listeners
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeTopicModal);
        }

        if (newTopicForm) {
            newTopicForm.addEventListener('submit', createNewTopic);
        }

        if (newAnswerForm) {
            newAnswerForm.addEventListener('submit', submitAnswer);
        }

        // Cerrar modal cuando se hace clic fuera del contenido
        window.addEventListener('click', (e) => {
            if (e.target === topicModal) {
                closeTopicModal();
            }
        });

        // Filtrar por categoría
        if (categoryFilterSelect) {
            categoryFilterSelect.addEventListener('change', () => {
                loadTopics(categoryFilterSelect.value);
            });
        }

        // Búsqueda en tiempo real
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                searchTopics();
            });
        }

        // Cerrar sesión
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/api/auth/logout', { credentials: 'same-origin' });
                    const result = await response.json();

                    if (result.success) {
                        window.location.href = '../index.html';
                    } else {
                        showNotification('Error al cerrar sesión', 'error');
                    }
                } catch (error) {
                    console.error('Error logging out:', error);
                    showNotification('Error al cerrar sesión', 'error');
                }
            });
        }
    }

    initPage();
});