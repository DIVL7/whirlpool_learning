import { loadModuleContents } from './admin-modules-content.js';
import { showSuccess, showError } from './admin-modules-utils.js';
// import { loadModules } from './admin-modules-core.js'; // Removed import to break circular dependency

// Renderizar módulos
function renderModules(modules, courseId) {
    // --- DEBUG LOG ---
    console.log('UI: renderModules called with courseId:', courseId);
    console.log('UI: renderModules received modules data:', JSON.stringify(modules, null, 2));
    if (!Array.isArray(modules)) {
         console.error('UI: ERROR - renderModules expected an array, but received:', typeof modules);
         // Display error in UI as well
         const modulesContainer = document.getElementById('modules-container');
         if(modulesContainer) {
            modulesContainer.innerHTML = '<p class="error-message">Error: Datos de módulos inválidos.</p>';
         }
         return; // Stop execution if data is not an array
    }

    const modulesContainer = document.getElementById('modules-container');
    if (!modulesContainer) {
        console.error('Modules container not found');
        return;
    }
    
    // Limpiar el contenedor
    modulesContainer.innerHTML = '';
    
    if (!modules || modules.length === 0) {
        // Mostrar estado vacío
        modulesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cubes"></i>
                <p>Este curso no tiene módulos</p>
                <button id="add-first-module-btn" class="btn-primary">
                    <i class="fas fa-plus"></i> Añadir primer módulo
                </button>
            </div>
        `;
        
        // Agregar event listener al botón
        const addFirstModuleBtn = document.getElementById('add-first-module-btn');
        if (addFirstModuleBtn) {
            addFirstModuleBtn.addEventListener('click', function() {
                openModuleModal(courseId);
            });
        }
        
        return;
    }
    
    // --- Update Module Counter ---
    const moduleCountElement = document.getElementById('module-count');
    if (moduleCountElement) {
        moduleCountElement.textContent = modules.length;
    }
    // --- End Update Module Counter ---

    // Ordenar módulos por posición
    modules.sort((a, b) => a.position - b.position);
    
    // Crear lista de módulos
    modules.forEach((module, index) => {
        // --- DEBUG LOG ---
        console.log(`UI: Processing module ${index + 1}:`, JSON.stringify(module, null, 2));
        if (!module || typeof module !== 'object') {
            console.error(`UI: ERROR - Invalid module data at index ${index}:`, module);
            return; // Skip this invalid module
        }
        if (!module.title || (!module.id && !module.module_id)) {
             console.warn(`UI: WARN - Module at index ${index} is missing title or ID:`, module);
             // Potentially skip rendering this module or render with placeholders
        }
        // --- END DEBUG LOG ---

        const moduleElement = document.createElement('div');
        moduleElement.className = 'module-card';
        moduleElement.dataset.moduleId = module.id || module.module_id; // Usar id o module_id
        
        moduleElement.innerHTML = `
            <div class="module-header">
                <div class="module-position">${module.position}</div>
                <div class="module-title">${module.title}</div>
                <div class="module-actions">
                    <button class="edit-module-btn" data-tooltip="Editar módulo">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-module-btn" data-tooltip="Eliminar módulo">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="add-content-btn" data-tooltip="Agregar contenido">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="manage-quiz-btn" data-tooltip="Gestionar quizzes">
                        <i class="fas fa-question-circle"></i> <!-- Icon for quizzes -->
                    </button>
                    <button class="toggle-content-btn" data-tooltip="Mostrar/ocultar contenidos">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="module-content-container" id="content-container-${module.id || module.module_id}" style="display: none;">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Cargando contenidos...</span>
                </div>
            </div>
        `;
        
        modulesContainer.appendChild(moduleElement);
        
        // Agregar event listeners a las acciones del módulo
        const editBtn = moduleElement.querySelector('.edit-module-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openModuleModal(courseId, module);
            });
        }
        
        const deleteBtn = moduleElement.querySelector('.delete-module-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                // Usar el ID del módulo de forma más segura
                const moduleId = module.id || module.module_id;
                confirmDeleteModule(moduleId, module.title);
            });
        }
        
        // Agregar event listener para el botón de agregar contenido
        const addContentBtn = moduleElement.querySelector('.add-content-btn');
        if (addContentBtn) {
            addContentBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const moduleId = module.id || module.module_id;
                // Importar la función desde admin-modules-content.js
                import('./admin-modules-content.js').then(module => {
                    module.openContentModal(courseId, moduleId);
                });
            });
        }
        
        const toggleBtn = moduleElement.querySelector('.toggle-content-btn');
        const contentContainer = moduleElement.querySelector('.module-content-container');
        
        if (toggleBtn && contentContainer) {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const isVisible = contentContainer.style.display !== 'none';
                
                if (isVisible) {
                    contentContainer.style.display = 'none';
                    this.querySelector('i').className = 'fas fa-chevron-down';
                } else {
                    contentContainer.style.display = 'block';
                    this.querySelector('i').className = 'fas fa-chevron-up';
                    
                    // Cargar contenidos si no se han cargado ya
                    if (contentContainer.querySelector('.loading-indicator')) {
                        // Obtener el ID del módulo de forma más segura
                        const moduleId = module.id || module.module_id || moduleElement.dataset.moduleId;
                        if (moduleId) {
                            console.log('Cargando contenidos para el módulo ID:', moduleId);
                            loadModuleContents(courseId, moduleId);
                        } else {
                            console.error('Error: No se pudo obtener el ID del módulo', module);
                            showError('Error al cargar los contenidos: ID de módulo no válido');
                        }
                    }
                }
            });
        } // *** REMOVED INCORRECTLY PLACED CODE BLOCK HERE ***

        // --- Add event listener for Manage Quiz button ---
        const manageQuizBtn = moduleElement.querySelector('.manage-quiz-btn');
        if (manageQuizBtn) {
            manageQuizBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const moduleId = module.id || module.module_id;
                const moduleTitle = module.title;
                console.log(`Manage quiz button clicked for module ${moduleId}`);
                openQuizManagementModal(moduleId, moduleTitle); // Call function to open the quiz management modal
            });
        }
        // --- End Manage Quiz button listener ---

    });
}

// Abrir modal de módulo
function openModuleModal(courseId, module = null) {
    const modal = document.getElementById('module-modal');
    const modalTitle = document.getElementById('module-modal-title');
    const form = document.getElementById('module-form');
    
    if (!modal || !modalTitle || !form) {
        console.error('Modal elements not found');
        return;
    }
    
    // Limpiar formulario
    form.reset();
    
    // Configurar modal según si es edición o creación
    if (module) {
        modalTitle.textContent = 'Editar Módulo';
        
        // Rellenar formulario con datos del módulo
        document.getElementById('module-title').value = module.title || '';
        document.getElementById('module-description').value = module.description || '';
        document.getElementById('module-position').value = module.position || 1;
        
        // Agregar ID del módulo como atributo de datos
        form.dataset.moduleId = module.module_id || module.id;
    } else {
        modalTitle.textContent = 'Añadir Nuevo Módulo';
        
        // Eliminar ID del módulo si existe
        delete form.dataset.moduleId;
        
        // Establecer posición predeterminada
        const modulesContainer = document.getElementById('modules-container');
        const moduleCards = modulesContainer ? modulesContainer.querySelectorAll('.module-card') : [];
        document.getElementById('module-position').value = moduleCards.length + 1;
    }
    
    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Evitar scroll
    
    // Enfocar el primer campo
    document.getElementById('module-title').focus();
}

// Prepare and show the delete module confirmation modal
function confirmDeleteModule(moduleId, moduleTitle) {
    console.log(`UI: Opening confirm delete modal for module ${moduleId}`);
    if (!moduleId) {
        showError('No se ha especificado un módulo para eliminar');
        return;
    }
    
    // Obtener elementos del modal
    const modal = document.getElementById('deleteModuleModal');
    const titleSpan = document.getElementById('deleteModuleTitle');
    const confirmBtn = document.getElementById('confirmDeleteModule');
    
    if (!modal || !confirmBtn) {
        console.error('Delete modal elements not found');
        return;
    }
    
    // Actualizar el título del módulo en el modal
    if (titleSpan) {
        titleSpan.textContent = moduleTitle || 'sin título';
    }
    
    // Guardar el ID del módulo en el botón para usarlo en la confirmación
    confirmBtn.dataset.moduleId = moduleId;
    
    // Mostrar modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // NOTE: The actual deletion logic and event listener for the confirm button
    // will be handled in admin-modules-events.js.
    // This function now only prepares and shows the modal.
}

// Mostrar vista de selección de curso
function showCourseSelectionView() {
    // Implementación de la función showCourseSelectionView
    // ...
}

// Cargar cursos disponibles
function loadAvailableCourses(page = 1) {
    // Implementación de la función loadAvailableCourses
    // ...
}

// Crear HTML de paginación
function createPaginationHTML(pagination) {
    // Implementación de la función createPaginationHTML
    // ...
}

// Exportar funciones para uso en otros módulos
export {
    renderModules,
    openModuleModal,
    confirmDeleteModule, // Exports the function that shows the modal
    showCourseSelectionView,
    loadAvailableCourses, 
    createPaginationHTML,
    // Quiz UI functions
    openQuizManagementModal, // Opens the main quiz list modal
    renderQuizList,          // Renders the list of quizzes
    openQuizFormModal,       // Opens the add/edit quiz details form
    resetQuizForm,           // Resets the quiz details form
    confirmDeleteQuiz,       // Opens the delete quiz confirmation modal
    openQuizEditorModal,     // Opens the modal for editing questions/answers
    renderQuestionList,      // Renders the list of questions
    resetQuestionForm,       // Resets the question form
    populateQuestionFormForEdit, // Populates question form for editing
    confirmDeleteQuestion,   // Opens the delete question confirmation modal
    renderAnswerList,        // Renders the list of answers for a question
    resetAnswerForm,         // Resets the answer form
    populateAnswerFormForEdit, // Populates answer form for editing
    confirmDeleteAnswer,     // Opens the delete answer confirmation modal
    closeModal,              // Generic helper to close any modal by ID
    updateAnswerSectionVisibility // Shows/hides answer section based on question type
};


// --- Quiz UI Functions ---

// Opens the modal listing quizzes for a specific module
async function openQuizManagementModal(moduleId, moduleTitle) {
    console.log(`Opening quiz management modal for module ${moduleId} (${moduleTitle})`);
    const modal = document.getElementById('quiz-management-modal');
    const titleElement = document.getElementById('quiz-management-module-title').querySelector('span');
    const listContainer = document.getElementById('quiz-list-container');
    const addQuizBtn = document.getElementById('add-quiz-btn');

    if (!modal || !titleElement || !listContainer || !addQuizBtn) {
        showError('Quiz management modal elements not found.');
        return;
    }

    titleElement.textContent = moduleTitle;
    modal.dataset.moduleId = moduleId; // Store module ID for later use
    addQuizBtn.dataset.moduleId = moduleId; // Store module ID on the add button

    // Clear previous list and show loading state (optional)
    listContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Cargando quizzes...</div>';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Fetch and render quizzes
    try {
        // Dynamically import the API function only when needed
        const { loadQuizzesFromAPI } = await import('./admin-modules-api.js');
        const quizzes = await loadQuizzesFromAPI(moduleId);
        renderQuizList(quizzes, moduleId); // Render the fetched quizzes
    } catch (err) {
        showError(`Error al cargar quizzes: ${err.message}`);
        listContainer.innerHTML = '<p class="error-message">Error al cargar quizzes.</p>';
    }
}

// Renders the list of quizzes in the management modal
function renderQuizList(quizzes, moduleId) {
    console.log(`Rendering quiz list for module ${moduleId}`, quizzes);
    const container = document.getElementById('quiz-list-container');
    if (!container) return;

    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay quizzes para este módulo.</p></div>';
        return;
    }

    // Sort quizzes by position before rendering
    quizzes.sort((a, b) => a.position - b.position);

    container.innerHTML = quizzes.map(quiz => `
        <div class="list-item quiz-item" data-quiz-id="${quiz.quiz_id}">
             <div class="item-main">
                <span class="item-position">${quiz.position}.</span>
                <span class="item-title">${quiz.title}</span>
             </div>
            <div class="item-actions">
                 <button class="btn-icon edit-quiz-details-btn" data-tooltip="Editar Detalles del Quiz">
                    <i class="fas fa-cog"></i>
                 </button>
                <button class="btn-icon edit-quiz-btn" data-tooltip="Editar Preguntas y Respuestas">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-icon-danger delete-quiz-btn" data-tooltip="Eliminar Quiz">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openQuizFormModal(moduleId, quiz = null) {
    console.log(`Opening quiz form modal for module ${moduleId}`, quiz);
    const modal = document.getElementById('quiz-form-modal');
    const form = document.getElementById('quiz-form');
    const title = document.getElementById('quiz-form-modal-title');

    if (!modal || !form || !title) {
        showError('Quiz form modal elements not found.');
        return;
    }

    resetQuizForm(); // Clear form before populating

    document.getElementById('quiz-module-id').value = moduleId;

    if (quiz) { // Editing existing quiz
        title.textContent = 'Editar Quiz';
        document.getElementById('quiz-id').value = quiz.quiz_id;
        document.getElementById('quiz-title').value = quiz.title || '';
        document.getElementById('quiz-description').value = quiz.description || '';
        document.getElementById('quiz-passing-score').value = quiz.passing_score !== null ? quiz.passing_score : 70;
        document.getElementById('quiz-time-limit').value = quiz.time_limit !== null ? quiz.time_limit : '';
        document.getElementById('quiz-position').value = quiz.position || 1;
    } else { // Adding new quiz
        title.textContent = 'Añadir Nuevo Quiz';
        // Calculate next position (simple approach)
        const quizItems = document.getElementById('quiz-list-container')?.querySelectorAll('.quiz-item') || [];
        document.getElementById('quiz-position').value = quizItems.length + 1;
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function resetQuizForm() {
    const form = document.getElementById('quiz-form');
    if (form) {
        form.reset();
        document.getElementById('quiz-id').value = ''; // Clear hidden ID field
        document.getElementById('quiz-module-id').value = ''; // Clear hidden module ID field
    }
}

function confirmDeleteQuiz(quizId, quizTitle) {
    console.log(`Confirming delete for quiz ${quizId} (${quizTitle})`);
     const modal = document.getElementById('deleteQuizModal');
     const titleElement = document.getElementById('deleteQuizTitle');
     const confirmBtn = document.getElementById('confirmDeleteQuizBtn');

     if (!modal || !titleElement || !confirmBtn) {
         showError('Delete quiz confirmation modal elements not found.');
         return;
     }

     titleElement.textContent = quizTitle || 'este quiz';
     confirmBtn.dataset.quizId = quizId; // Store quiz ID on button

     modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Opens the modal for editing a quiz's questions and answers
async function openQuizEditorModal(quiz) { // Made async for potential API call
    console.log('Opening quiz editor modal', quiz);
    const modal = document.getElementById('quiz-editor-modal');
    const titleSpan = document.getElementById('quiz-editor-modal-title').querySelector('span');
    const quizIdInput = document.getElementById('editor-quiz-id');
    const questionContainer = document.getElementById('question-list-container');
    const addQuestionBtn = document.getElementById('add-question-btn');

    if (!modal || !titleSpan || !quizIdInput || !questionContainer || !addQuestionBtn) {
        showError('Quiz editor modal elements not found.');
        return;
    }

    titleSpan.textContent = quiz.title;
    quizIdInput.value = quiz.quiz_id;
    addQuestionBtn.dataset.quizId = quiz.quiz_id; // Store quiz ID for adding questions

    // Reset question/answer forms
    resetQuestionForm();
    resetAnswerForm();
    document.getElementById('question-form-container').style.display = 'none';
    document.getElementById('answer-section-container').style.display = 'none'; // Hide answer section initially

    // Ensure we have the full quiz details (questions/answers)
    // The event listener calling this should have already fetched details
    if (!quiz.questions) {
        // As a fallback, fetch details if missing (should ideally be handled before calling)
        try {
            console.warn("Quiz details missing questions, fetching again...");
            const { loadQuizDetailsFromAPI } = await import('./admin-modules-api.js');
            const fullQuizData = await loadQuizDetailsFromAPI(quiz.quiz_id);
            quiz = fullQuizData; // Update quiz object with full data
        } catch (error) {
             showError(`Error al cargar detalles completos del quiz: ${error.message}`);
             return; // Don't open modal if details can't be loaded
        }
    }

    renderQuestionList(quiz.questions || [], quiz.quiz_id); // Render questions
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Renders the list of questions in the quiz editor modal
function renderQuestionList(questions, quizId) {
    console.log(`Rendering question list for quiz ${quizId}`, questions);
    const container = document.getElementById('question-list-container');
    if (!container) return;

    if (!questions || questions.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay preguntas añadidas.</p></div>';
        return;
    }

    // Sort questions by position
    questions.sort((a, b) => a.position - b.position);

    container.innerHTML = questions.map(q => `
        <div class="list-item question-item" data-question-id="${q.question_id}">
            <div class="item-main">
                <span class="item-position">${q.position}.</span>
                <span class="item-title">${q.question_text}</span>
                <span class="item-meta">(${q.question_type.replace('_', ' ')}, ${q.points} pts)</span>
            </div>
            <div class="item-actions question-actions">
                 <button class="btn-icon edit-question-btn" data-tooltip="Editar Pregunta">
                    <i class="fas fa-edit"></i>
                 </button>
                 <button class="btn-icon btn-icon-danger delete-question-btn" data-tooltip="Eliminar Pregunta">
                     <i class="fas fa-trash"></i>
                  </button>
             </div>
             <!-- Removed answer sublist rendering from here -->
         </div>
     `).join('');
}

function resetQuestionForm() {
    const form = document.getElementById('question-form');
     if (form) {
        form.reset();
        document.getElementById('question-id').value = ''; // Clear hidden ID
        document.getElementById('question-form-title').textContent = 'Añadir Pregunta';
        // Hide answer section when resetting question form
        document.getElementById('answer-section-container').style.display = 'none';
    }
    // Also reset answer form just in case
    resetAnswerForm();
}

// Populates the question form for editing
function populateQuestionFormForEdit(questionData) {
    console.log("Populating question form for edit:", questionData);
    const form = document.getElementById('question-form');
    const title = document.getElementById('question-form-title');
    if (!form || !title) {
        showError("Question form elements not found for editing.");
        return;
    }
    resetQuestionForm(); // Clear previous data first

    title.textContent = 'Editar Pregunta';
    document.getElementById('question-id').value = questionData.question_id;
    // Assuming the quiz ID is needed in the form, add a hidden input if not present
    // document.getElementById('editor-quiz-id-for-question').value = questionData.quiz_id;
    document.getElementById('question-text').value = questionData.question_text || '';
    document.getElementById('question-type').value = questionData.question_type || 'multiple_choice';
    document.getElementById('question-points').value = questionData.points !== null ? questionData.points : 1;
    document.getElementById('question-position').value = questionData.position || 1;

    // Show the form
    document.getElementById('question-form-container').style.display = 'block';
     document.getElementById('question-text').focus(); // Focus on text field

     // Update visibility of answer section based on the question type
     updateAnswerSectionVisibility(questionData.question_type);

     // Reset the answer form, but don't hide the section here.
     // Visibility is handled by updateAnswerSectionVisibility.
     resetAnswerForm();
 }

// Populates the answer form for editing
function populateAnswerFormForEdit(answerData) {
    console.log("Populating answer form for edit:", answerData);
    const form = document.getElementById('answer-form');
     if (!form) {
        showError("Answer form elements not found for editing.");
        return;
    }
    resetAnswerForm(); // Clear previous data

    document.getElementById('answer-id').value = answerData.answer_id;
    // Assuming the question ID is needed in the form, add a hidden input if not present
    // document.getElementById('answer-question-id').value = answerData.question_id;
    document.getElementById('answer-text').value = answerData.answer_text || '';
    document.getElementById('answer-is-correct').checked = !!answerData.is_correct;

    // Ensure the answer section is visible (it might be hidden when editing a question)
    document.getElementById('answer-section-container').style.display = 'block';
    document.getElementById('answer-text').focus(); // Focus on the text field
}


function confirmDeleteQuestion(questionId, questionText) {
    console.log(`Confirming delete for question ${questionId}`);
    const modal = document.getElementById('deleteQuestionModal');
    const textElement = document.getElementById('deleteQuestionText');
    const confirmBtn = document.getElementById('confirmDeleteQuestionBtn');

    if (!modal || !textElement || !confirmBtn) {
        showError('Delete question confirmation modal elements not found.');
        return;
    }

    textElement.textContent = questionText || 'esta pregunta';
    confirmBtn.dataset.questionId = questionId;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// --- Helper to show/hide answer section based on question type ---
function updateAnswerSectionVisibility(questionType) {
    const answerSectionContainer = document.getElementById('answer-section-container');
    const addAnswerBtn = document.getElementById('add-answer-btn');
    const answerFormContainer = document.getElementById('answer-form-container');

    if (!answerSectionContainer || !addAnswerBtn || !answerFormContainer) {
        console.error("Answer section elements not found for visibility update.");
        return;
    }

    if (questionType === 'multiple_choice') {
        answerSectionContainer.style.display = 'block';
        addAnswerBtn.style.display = 'inline-block'; // Or 'block' depending on layout
        // Keep answer form hidden until explicitly opened
        answerFormContainer.style.display = 'none'; // Keep hidden initially
    } else if (questionType === 'true_false') {
        answerSectionContainer.style.display = 'block'; // Show section to display T/F options
        addAnswerBtn.style.display = 'none'; // Hide "Add Answer" button
        answerFormContainer.style.display = 'none'; // Hide the generic answer form
    } else if (questionType === 'short_answer') {
        answerSectionContainer.style.display = 'none'; // Hide entire section
        addAnswerBtn.style.display = 'none';
        answerFormContainer.style.display = 'none';
    } else {
        // Default or unknown type, hide everything
        answerSectionContainer.style.display = 'none';
        addAnswerBtn.style.display = 'none';
        answerFormContainer.style.display = 'none';
    }
}


// Renders the list of answers based on question type
function renderAnswerList(answers, questionId, questionType) { // Added questionType parameter
    console.log(`Rendering answer list for question ${questionId}, type: ${questionType}`, answers);
    const container = document.getElementById('answer-list-container'); // Always target the main container

    if (!container) {
        console.error(`Answer container #answer-list-container not found.`);
        return;
    }

    // Clear previous content
    container.innerHTML = '';

    if (questionType === 'multiple_choice') {
        if (!answers || answers.length === 0) {
            container.innerHTML = '<p class="empty-sublist-message">No hay respuestas añadidas.</p>';
            return;
        }
        // Render multiple choice answers
        container.innerHTML = answers.map(a => `
            <div class="list-item answer-item" data-answer-id="${a.answer_id}" data-question-id="${questionId}">
                 <span class="item-title">${a.answer_text}</span>
                 ${a.is_correct ? '<i class="fas fa-check-circle correct-icon" data-tooltip="Respuesta Correcta"></i>' : ''}
                 <div class="item-actions answer-actions">
                     <button class="btn-icon btn-icon-xs btn-icon-danger delete-answer-btn" data-tooltip="Eliminar Respuesta">
                        <i class="fas fa-trash"></i>
                     </button>
                 </div>
            </div>
        `).join('');

    } else if (questionType === 'true_false') {
        // Find which answer is correct (assuming backend provides 'Verdadero'/'Falso' text)
        const trueAnswer = answers?.find(a => a.answer_text.toLowerCase() === 'verdadero');
        const falseAnswer = answers?.find(a => a.answer_text.toLowerCase() === 'falso');
        const isTrueCorrect = trueAnswer?.is_correct ?? false; // Default to false if not found
        const isFalseCorrect = falseAnswer?.is_correct ?? false;

        // Render static True/False options
        // Using radio buttons for single selection logic
        container.innerHTML = `
            <div class="list-item answer-item true-false-item" data-question-id="${questionId}" data-value="true">
                 <span class="item-title">Verdadero</span>
                 <input type="radio" name="tf_correct_${questionId}" value="true" id="tf_true_${questionId}" ${isTrueCorrect ? 'checked' : ''} class="tf-radio">
                 <label for="tf_true_${questionId}" class="tf-label ${isTrueCorrect ? 'correct' : ''}">
                    ${isTrueCorrect ? '<i class="fas fa-check-circle correct-icon"></i>' : '<i class="far fa-circle incorrect-icon"></i>'} Marcar como correcta
                 </label>
                 <!-- Delete button might not make sense for T/F -->
            </div>
            <div class="list-item answer-item true-false-item" data-question-id="${questionId}" data-value="false">
                 <span class="item-title">Falso</span>
                 <input type="radio" name="tf_correct_${questionId}" value="false" id="tf_false_${questionId}" ${isFalseCorrect ? 'checked' : ''} class="tf-radio">
                 <label for="tf_false_${questionId}" class="tf-label ${isFalseCorrect ? 'correct' : ''}">
                    ${isFalseCorrect ? '<i class="fas fa-check-circle correct-icon"></i>' : '<i class="far fa-circle incorrect-icon"></i>'} Marcar como correcta
                 </label>
                 <!-- Delete button might not make sense for T/F -->
            </div>
        `;
        // TODO: Add CSS for .tf-radio (hide), .tf-label, .tf-label.correct, .tf-label i

    } else if (questionType === 'short_answer') {
        container.innerHTML = '<p class="empty-sublist-message">Las respuestas cortas se califican manualmente.</p>';

    } else {
        // Unknown type
        container.innerHTML = '<p class="error-message">Tipo de pregunta no reconocido.</p>';
    }
}


function resetAnswerForm() {
    const form = document.getElementById('answer-form');
    if (form) {
        form.reset();
        document.getElementById('answer-id').value = ''; // Clear hidden ID
        document.getElementById('answer-is-correct').checked = false;
 }
 }

 function confirmDeleteAnswer(answerId, answerText, questionId) { // Add questionId parameter
     console.log(`Confirming delete for answer ${answerId} (question ${questionId})`); // Log questionId
     const modal = document.getElementById('deleteAnswerModal');
     const textElement = document.getElementById('deleteAnswerText');
    const confirmBtn = document.getElementById('confirmDeleteAnswerBtn');

    if (!modal || !textElement || !confirmBtn) {
        showError('Delete answer confirmation modal elements not found.');
        return;
     }

     textElement.textContent = answerText || 'esta respuesta';
     confirmBtn.dataset.answerId = answerId;
     // Store questionId on the button as well, passed from the event listener
     confirmBtn.dataset.questionId = questionId;

     modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Generic function to close any modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    }
}
