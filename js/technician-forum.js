document.addEventListener('DOMContentLoaded', () => {
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
    
    // Verificar sesión y obtener datos del usuario
    async function checkUserSession() {
        try {
            const response = await fetch('/api/check-session');
            const data = await response.json();
            
            if (data.loggedIn) {
                currentUser = data.user;
                usernameDisplay.textContent = currentUser.username;
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
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
                categoryElement.className = 'forum-category';
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
                    <span class="topic-date">${formattedDate}</span>
                </div>
                <div class="topic-content">
                    ${topicData.content}
                </div>
                <div class="topic-stats">
                    <span>Vistas: ${topicData.views}</span>
                    <span>Respuestas: ${topicData.answers.length}</span>
                </div>
            `;
            
            // Mostrar respuestas
            if (topicData.answers.length === 0) {
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
                    
                    const answerElement = document.createElement('div');
                    answerElement.className = `answer ${answer.is_accepted ? 'accepted-answer' : ''}`;
                    answerElement.innerHTML = `
                        <div class="answer-author">
                            <div class="author-info">
                                <img src="${answer.author_picture || '../images/default-avatar.jpg'}" alt="${answer.author_name}" class="author-avatar">
                                <span class="author-name">${answer.author_name}</span>
                            </div>
                            <span class="answer-date">${formattedAnswerDate}</span>
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
                    
                    if (upvoteBtn) {
                        upvoteBtn.addEventListener('click', () => voteForAnswer(answer.answer_id, 'upvote'));
                    }
                    
                    if (downvoteBtn) {
                        downvoteBtn.addEventListener('click', () => voteForAnswer(answer.answer_id, 'downvote'));
                    }
                    
                    if (acceptBtn) {
                        acceptBtn.addEventListener('click', () => acceptAnswer(answer.answer_id));
                    }
                });
            }
            
            // Mostrar el modal
            topicModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading topic details:', error);
            alert('Error al cargar los detalles del tema');
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
                alert('Debes iniciar sesión para votar');
                return;
            }
            
            const response = await fetch(`/api/forum/answers/${answerId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vote_type: voteType }),
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Actualizar la UI para mostrar los votos actualizados
                const voteContainer = document.querySelector(`.vote-btn[data-id="${answerId}"]`)
                    .closest('.vote-container');
                const voteCount = voteContainer.querySelector('.vote-count');
                
                voteCount.textContent = (result.upvotes || 0) - (result.downvotes || 0);
                
                // Cambiar el estilo de los botones según corresponda
                const upvoteBtn = voteContainer.querySelector('.upvote');
                const downvoteBtn = voteContainer.querySelector('.downvote');
                
                if (voteType === 'upvote') {
                    upvoteBtn.classList.add('voted');
                    downvoteBtn.classList.remove('voted');
                } else {
                    upvoteBtn.classList.remove('voted');
                    downvoteBtn.classList.add('voted');
                }
            } else {
                alert(result.error || 'Error al votar por la respuesta');
            }
        } catch (error) {
            console.error('Error voting for answer:', error);
            alert('Error al registrar el voto');
        }
    }
    
    // Aceptar una respuesta
    async function acceptAnswer(answerId) {
        try {
            if (!currentUser) {
                alert('Debes iniciar sesión para aceptar respuestas');
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
            } else {
                alert(result.error || 'Error al aceptar la respuesta');
            }
        } catch (error) {
            console.error('Error accepting answer:', error);
            alert('Error al aceptar la respuesta');
        }
    }
    
    // Crear un nuevo tema
    async function createNewTopic(e) {
        e.preventDefault();
        
        try {
            if (!currentUser) {
                alert('Debes iniciar sesión para crear un tema');
                return;
            }
            
            const title = document.getElementById('topic-title').value.trim();
            const content = document.getElementById('topic-content').value.trim();
            const categoryId = document.getElementById('topic-category').value;
            
            if (!title || !content || !categoryId) {
                alert('Por favor, completa todos los campos');
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
                
                alert('Tema creado exitosamente');
                
                // Opcionalmente, abrir el nuevo tema
                if (result.question_id) {
                    openTopicModal(result.question_id);
                }
            } else {
                alert(result.error || 'Error al crear el tema');
            }
        } catch (error) {
            console.error('Error creating topic:', error);
            alert('Error al crear el tema');
        }
    }
    
    // Responder a un tema
    async function submitAnswer(e) {
        e.preventDefault();
        
        try {
            if (!currentUser) {
                alert('Debes iniciar sesión para responder');
                return;
            }
            
            if (!currentQuestionId) {
                alert('Error: No se ha seleccionado un tema');
                return;
            }
            
            const content = document.getElementById('answer-content').value.trim();
            
            if (!content) {
                alert('Por favor, escribe tu respuesta');
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
                
                alert('Respuesta publicada exitosamente');
            } else {
                alert(result.error || 'Error al publicar la respuesta');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Error al publicar la respuesta');
        }
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
            topic.content?.toLowerCase().includes(searchTerm) ||
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
        closeModalBtn.addEventListener('click', closeTopicModal);
        newTopicForm.addEventListener('submit', createNewTopic);
        newAnswerForm.addEventListener('submit', submitAnswer);
        
        // Cerrar modal cuando se hace clic fuera del contenido
        window.addEventListener('click', (e) => {
            if (e.target === topicModal) {
                closeTopicModal();
            }
        });
        
        // Filtrar por categoría
        categoryFilterSelect.addEventListener('change', () => {
            loadTopics(categoryFilterSelect.value);
        });
        
        // Búsqueda en tiempo real
        searchInput.addEventListener('input', () => {
            searchTopics();
        });
        
        // Cerrar sesión
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('/api/logout');
                    const result = await response.json();
                    
                    if (result.success) {
                        window.location.href = '../index.html';
                    }
                } catch (error) {
                    console.error('Error logging out:', error);
                    alert('Error al cerrar sesión');
                }
            });
        }
    }
    
    // Iniciar la aplicación
    initPage();
});