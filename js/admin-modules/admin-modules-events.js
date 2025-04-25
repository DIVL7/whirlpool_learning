// Import UI functions needed for event handling
import { openModuleModal, openQuizManagementModal, renderQuizList, openQuizFormModal, resetQuizForm, confirmDeleteQuiz, openQuizEditorModal, renderQuestionList, resetQuestionForm, confirmDeleteQuestion, renderAnswerList, resetAnswerForm, confirmDeleteAnswer, closeModal } from './admin-modules-ui.js';
// Import content-related functions
import { saveContent, updateContentDataField } from './admin-modules-content.js';
// Import API functions
import { saveModuleToAPI, deleteModuleFromAPI, loadQuizzesFromAPI, saveQuizToAPI, deleteQuizFromAPI, loadQuizDetailsFromAPI, saveQuestionToAPI, deleteQuestionFromAPI, saveAnswerToAPI, deleteAnswerFromAPI } from './admin-modules-api.js'; // Added deleteModuleFromAPI
// Import utility functions
import { showSuccess, showError } from './admin-modules-utils.js';
// Import core functions (needed for saveModule to reload modules)
import { loadModules } from './admin-modules-core.js';

// Configurar event listeners
function setupEventListeners(courseId) {
    console.log('Setting up event listeners for course ID:', courseId);
    
    // Botón de añadir módulo
    const addModuleBtn = document.getElementById('add-module-btn');
    if (addModuleBtn) {
        console.log('Found add-module-btn, adding event listener');
        // Eliminar listeners existentes para evitar duplicados
        const newBtn = addModuleBtn.cloneNode(true);
        addModuleBtn.parentNode.replaceChild(newBtn, addModuleBtn);
        
        newBtn.addEventListener('click', function() {
            console.log('Add module button clicked');
            openModuleModal(courseId);
        });
    } else {
        console.error('add-module-btn not found');
    }
    
    // Botón de guardar módulo
    const saveModuleBtn = document.getElementById('save-module-btn');
    if (saveModuleBtn) {
        console.log('Found save-module-btn, adding event listener');
        // Eliminar listeners existentes para evitar duplicados
        const newBtn = saveModuleBtn.cloneNode(true);
        saveModuleBtn.parentNode.replaceChild(newBtn, saveModuleBtn);
        
        newBtn.addEventListener('click', function() {
            console.log('Save module button clicked');
            handleSaveModule(courseId); // Call the local handler function
        });
    } else {
        console.error('save-module-btn not found');
    }
    
    // También configurar el formulario para manejar el submit
    const moduleForm = document.getElementById('module-form');
    if (moduleForm) {
        moduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Module form submitted');
            handleSaveModule(courseId); // Call the local handler function
        });
    }
    
    // Cerrar modales con botones de cierre
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Botón de volver a cursos (ahora con ID 'back-to-modules-btn')
    const backToCoursesBtn = document.getElementById('back-to-modules-btn'); 
    if (backToCoursesBtn) {
        // Clonar para evitar listeners duplicados si setupEventListeners se llama más de una vez
        const newBtn = backToCoursesBtn.cloneNode(true);
        backToCoursesBtn.parentNode.replaceChild(newBtn, backToCoursesBtn);

        newBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir comportamiento por defecto si fuera un link
            window.location.href = 'courses.html'; // Navegar a la página de cursos
        });
    }

    // --- Quiz Event Listeners ---
    setupQuizEventListeners(); // Call a new function to organize quiz listeners
}

// Configurar event listeners para contenido
function setupContentEventListeners(courseId) {
    // Cambio de tipo de contenido - MOVED TO openContentModal in admin-modules-content.js

    // Botón de guardar contenido
    const saveContentBtn = document.getElementById('save-content-btn');
    if (saveContentBtn) {
        // Eliminar listeners existentes para evitar duplicados
        const newBtn = saveContentBtn.cloneNode(true);
        saveContentBtn.parentNode.replaceChild(newBtn, saveContentBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveContent();
        });
    }
    
    // Submit del formulario de contenido
    const contentForm = document.getElementById('content-form');
    if (contentForm) {
        // Eliminar listeners existentes para evitar duplicados
        const newForm = contentForm.cloneNode(true);
        contentForm.parentNode.replaceChild(newForm, contentForm);
        
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveContent();
        });
    }
    
    // Botón de cancelar contenido
    const cancelContentBtn = document.getElementById('cancel-content');
    if (cancelContentBtn) {
        cancelContentBtn.addEventListener('click', function() {
            const modal = document.getElementById('content-modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// Exportar funciones para uso en otros módulos
export { setupEventListeners, setupContentEventListeners };

// --- Moved saveModule logic here ---
async function handleSaveModule(courseId) { // Renamed to avoid potential conflicts
    try {
        // Validar que tenemos un ID de curso
        if (!courseId) {
            showError('No se ha especificado un curso');
            return;
        }

        // Obtener datos del formulario
        const form = document.getElementById('module-form');
        const title = document.getElementById('module-title').value.trim();
        const description = document.getElementById('module-description').value.trim();
        const position = parseInt(document.getElementById('module-position').value) || 1;

        // Validar datos
        if (!title) {
            showError('El título del módulo es obligatorio');
            return;
        }

        // Crear objeto con datos del módulo
        const moduleData = {
            title,
            description,
            position,
            course_id: courseId // Ensure course_id is included if needed by backend
        };

        // Determinar si es creación o actualización
        const moduleId = form.dataset.moduleId;
        const isUpdate = !!moduleId;

        // Import API function dynamically or ensure it's imported at top
        const { saveModuleToAPI } = await import('./admin-modules-api.js'); // Assuming saveModuleToAPI exists

        // Call the API function
        const result = await saveModuleToAPI(courseId, {
             ...moduleData,
             module_id: moduleId // Pass module_id for updates
        });


        // Cerrar modal
        closeModal('module-modal'); // Use the generic closeModal helper

        // Mostrar mensaje de éxito
        showSuccess(isUpdate ? 'Módulo actualizado correctamente' : 'Módulo creado correctamente');

        // Recargar módulos using the imported function
        loadModules(courseId);

    } catch (error) {
        console.error('Error saving module:', error);
        showError(`Error al guardar el módulo: ${error.message}`);
    }
}


// --- Function to Setup Quiz Related Event Listeners ---
function setupQuizEventListeners() {
    console.log('Setting up quiz event listeners');

    // --- Quiz Management Modal Listeners (#quiz-management-modal) ---
    const quizManagementModal = document.getElementById('quiz-management-modal');
    if (quizManagementModal) {
        // "Nuevo Quiz" button
        const addQuizBtn = quizManagementModal.querySelector('#add-quiz-btn');
        if (addQuizBtn) {
            addQuizBtn.addEventListener('click', () => {
                const moduleId = addQuizBtn.dataset.moduleId;
                if (moduleId) {
                    openQuizFormModal(moduleId); // Open form to add new quiz
                } else {
                    showError('No se pudo determinar el ID del módulo.');
                }
            });
        }

        // Event delegation for dynamically added Edit/Delete quiz buttons
        const quizListContainer = quizManagementModal.querySelector('#quiz-list-container');
        if (quizListContainer) {
            quizListContainer.addEventListener('click', async (e) => {
                const target = e.target;
                const quizItem = target.closest('.quiz-item');
                if (!quizItem) return;

                const quizId = quizItem.dataset.quizId;
                const moduleId = quizManagementModal.dataset.moduleId; // Get module ID from modal

                if (target.classList.contains('edit-quiz-btn') || target.closest('.edit-quiz-btn')) {
                    console.log(`Edit quiz button clicked for quiz ${quizId}`);
                    try {
                        // Fetch full details needed for the editor
                        const quizDetails = await loadQuizDetailsFromAPI(quizId);
                        openQuizEditorModal(quizDetails); // Open the full editor
                    } catch (error) {
                        showError(`Error al cargar detalles del quiz: ${error.message}`);
                    }
                } else if (target.classList.contains('delete-quiz-btn') || target.closest('.delete-quiz-btn')) {
                    console.log(`Delete quiz button clicked for quiz ${quizId}`);
                    const quizTitle = quizItem.querySelector('span')?.textContent.split(' (ID:')[0] || 'este quiz';
                    confirmDeleteQuiz(quizId, quizTitle);
                }
            });
        }
    }

    // --- Quiz Form Modal Listeners (#quiz-form-modal) ---
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Quiz form submitted');
            const formData = new FormData(quizForm);
            const quizData = Object.fromEntries(formData.entries());
            const moduleId = quizData.moduleId; // Get module ID from hidden input
            const quizId = quizData.quizId || null; // Get quiz ID if editing

            // Convert numeric fields
            quizData.passing_score = parseInt(quizData.passing_score) || 70;
            quizData.time_limit = quizData.time_limit ? parseInt(quizData.time_limit) : null;
            quizData.position = parseInt(quizData.position) || 1;

            // Remove IDs from data object before sending if they are empty
            if (!quizId) delete quizData.quizId;
            delete quizData.moduleId; // Don't send moduleId in body if not needed by API for update

            try {
                const result = await saveQuizToAPI(moduleId, { // Pass moduleId separately
                    ...quizData,
                    quiz_id: quizId // Ensure quiz_id is passed for updates
                });
                showSuccess(quizId ? 'Quiz actualizado correctamente' : 'Quiz creado correctamente');
                closeModal('quiz-form-modal');
                // Refresh quiz list in the management modal if it's open
                const currentModuleId = document.getElementById('quiz-management-modal')?.dataset.moduleId;
                if (currentModuleId === moduleId) {
                     const quizzes = await loadQuizzesFromAPI(moduleId);
                     renderQuizList(quizzes, moduleId);
                }
            } catch (error) {
                showError(`Error al guardar el quiz: ${error.message}`);
            }
        });
    }

    // --- Quiz Editor Modal Listeners (#quiz-editor-modal) ---
    const quizEditorModal = document.getElementById('quiz-editor-modal');
    if (quizEditorModal) {
        const questionFormContainer = document.getElementById('question-form-container');
        const questionForm = document.getElementById('question-form');
        const answerSectionContainer = document.getElementById('answer-section-container');
        const answerFormContainer = document.getElementById('answer-form-container');
        const answerForm = document.getElementById('answer-form');

        // "Nueva Pregunta" button
        const addQuestionBtn = quizEditorModal.querySelector('#add-question-btn');
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => {
                resetQuestionForm();
                // Calculate next position
                const questionItems = document.getElementById('question-list-container')?.querySelectorAll('.question-item') || [];
                 document.getElementById('question-position').value = questionItems.length + 1;
                questionFormContainer.style.display = 'block';
                document.getElementById('question-text').focus();
            });
        }

        // Cancel Question Edit button
        const cancelQuestionBtn = quizEditorModal.querySelector('#cancel-question-edit');
         if (cancelQuestionBtn) {
            cancelQuestionBtn.addEventListener('click', () => {
                questionFormContainer.style.display = 'none';
                resetQuestionForm();
            });
        }

        // Question Form submission
        if (questionForm) {
            questionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(questionForm);
                const questionData = Object.fromEntries(formData.entries());
                const quizId = document.getElementById('editor-quiz-id').value;
                const questionId = questionData.questionId || null;

                // Convert numeric
                questionData.points = parseInt(questionData.points) || 1;
                questionData.position = parseInt(questionData.position) || 1;
                if (!questionId) delete questionData.questionId; // Don't send empty ID

                try {
                    const result = await saveQuestionToAPI(quizId, {
                        ...questionData,
                        question_id: questionId // Ensure question_id is passed for updates
                    });
                    showSuccess(questionId ? 'Pregunta actualizada' : 'Pregunta añadida');
                    questionFormContainer.style.display = 'none';
                    resetQuestionForm();
                    // Refresh question list
                    const updatedQuiz = await loadQuizDetailsFromAPI(quizId);
                    renderQuestionList(updatedQuiz.questions || [], quizId);
                } catch (error) {
                    showError(`Error al guardar pregunta: ${error.message}`);
                }
            });
        }

        // Event delegation for Question Edit/Delete buttons
        const questionListContainer = quizEditorModal.querySelector('#question-list-container');
        if (questionListContainer) {
            questionListContainer.addEventListener('click', (e) => {
                const target = e.target;
                const questionItem = target.closest('.question-item');
                if (!questionItem) return;

                const questionId = questionItem.dataset.questionId;
                const quizId = document.getElementById('editor-quiz-id').value;

                if (target.classList.contains('edit-question-btn') || target.closest('.edit-question-btn')) {
                    // Find the question data (ideally fetch fresh data, or find from rendered list)
                    // For simplicity, let's assume we refetch the quiz details to get the question
                     loadQuizDetailsFromAPI(quizId).then(quiz => {
                         const question = quiz.questions.find(q => q.question_id == questionId);
                         if (question) {
                             resetQuestionForm();
                             // Populate form
                             document.getElementById('question-id').value = question.question_id;
                             document.getElementById('question-text').value = question.question_text;
                             document.getElementById('question-type').value = question.question_type;
                             document.getElementById('question-points').value = question.points;
                             document.getElementById('question-position').value = question.position;
                             document.getElementById('question-form-title').textContent = 'Editar Pregunta';
                             // Show form and answer section
                             questionFormContainer.style.display = 'block';
                             answerSectionContainer.style.display = 'block';
                             renderAnswerList(question.answers || [], questionId); // Render answers for this question
                             document.getElementById('add-answer-btn').dataset.questionId = questionId; // Set question ID for adding answers
                         } else {
                             showError('No se encontró la pregunta para editar.');
                         }
                     }).catch(err => showError(`Error al cargar pregunta: ${err.message}`));

                } else if (target.classList.contains('delete-question-btn') || target.closest('.delete-question-btn')) {
                    const questionText = questionItem.querySelector('p > strong')?.textContent || 'esta pregunta';
                    confirmDeleteQuestion(questionId, questionText);
                }
            });
        }

         // --- Answer Listeners (within Quiz Editor) ---

         // "Nueva Respuesta" button
         const addAnswerBtn = quizEditorModal.querySelector('#add-answer-btn');
         if (addAnswerBtn) {
             addAnswerBtn.addEventListener('click', () => {
                 resetAnswerForm();
                 answerFormContainer.style.display = 'block';
                 document.getElementById('answer-text').focus();
             });
         }

         // Cancel Answer Edit button
         const cancelAnswerBtn = quizEditorModal.querySelector('#cancel-answer-edit');
         if (cancelAnswerBtn) {
             cancelAnswerBtn.addEventListener('click', () => {
                 answerFormContainer.style.display = 'none';
                 resetAnswerForm();
             });
         }

         // Answer Form submission
         if (answerForm) {
             answerForm.addEventListener('submit', async (e) => {
                 e.preventDefault();
                 const formData = new FormData(answerForm);
                 const answerData = {
                     answer_text: formData.get('answer_text'),
                     is_correct: formData.has('is_correct') // Checkbox value
                 };
                 const answerId = formData.get('answerId') || null;
                 // Get questionId from the currently edited question (e.g., from hidden input or data attribute)
                 const questionId = document.getElementById('question-id').value;
                 const quizId = document.getElementById('editor-quiz-id').value; // Need quizId to refresh later

                 if (!questionId) {
                     showError('No se pudo determinar la pregunta para añadir la respuesta.');
                     return;
                 }

                 try {
                     const result = await saveAnswerToAPI(questionId, {
                         ...answerData,
                         answer_id: answerId // Ensure answer_id is passed for updates
                     });
                     showSuccess(answerId ? 'Respuesta actualizada' : 'Respuesta añadida');
                     answerFormContainer.style.display = 'none';
                     resetAnswerForm();
                     // Refresh the answer list for the current question
                     const updatedQuiz = await loadQuizDetailsFromAPI(quizId);
                     const updatedQuestion = updatedQuiz.questions.find(q => q.question_id == questionId);
                     renderAnswerList(updatedQuestion?.answers || [], questionId);
                 } catch (error) {
                     showError(`Error al guardar respuesta: ${error.message}`);
                 }
             });
         }

         // Event delegation for Answer Edit/Delete buttons (within the answer section)
         const answerSection = quizEditorModal.querySelector('#answer-section-container');
         if (answerSection) {
             answerSection.addEventListener('click', (e) => {
                 const target = e.target;
                 const answerItem = target.closest('.answer-item');
                 if (!answerItem) return;

                 const answerId = answerItem.dataset.answerId;
                 const questionId = document.getElementById('question-id').value; // Get current question ID

                 if (target.classList.contains('edit-answer-btn') || target.closest('.edit-answer-btn')) {
                     // Find answer data (ideally fetch fresh, or find in rendered list)
                     // Assuming we have the data from renderAnswerList or need to find it
                     const answerText = answerItem.querySelector('span')?.textContent.split(' <i')[0] || '';
                     const isCorrect = !!answerItem.querySelector('.correct-icon');

                     resetAnswerForm();
                     // Populate form
                     document.getElementById('answer-id').value = answerId;
                     document.getElementById('answer-text').value = answerText;
                     document.getElementById('answer-is-correct').checked = isCorrect;
                     // Show form
                     answerFormContainer.style.display = 'block';

                 } else if (target.classList.contains('delete-answer-btn') || target.closest('.delete-answer-btn')) {
                     const answerText = answerItem.querySelector('span')?.textContent.split(' <i')[0] || 'esta respuesta';
                     confirmDeleteAnswer(answerId, answerText);
                 }
             });
         }
    }


    // --- Delete Confirmation Modal Listeners ---

    // Confirm Delete Quiz
    const confirmDeleteQuizBtn = document.getElementById('confirmDeleteQuizBtn');
    if (confirmDeleteQuizBtn) {
        confirmDeleteQuizBtn.addEventListener('click', async () => {
            const quizId = confirmDeleteQuizBtn.dataset.quizId;
            const moduleId = document.getElementById('quiz-management-modal')?.dataset.moduleId; // Get module ID
            if (!quizId || !moduleId) {
                showError('Error: No se pudo obtener el ID del quiz o módulo.');
                closeModal('deleteQuizModal');
                return;
            }
            try {
                await deleteQuizFromAPI(quizId);
                showSuccess('Quiz eliminado correctamente.');
                closeModal('deleteQuizModal');
                // Refresh quiz list
                const quizzes = await loadQuizzesFromAPI(moduleId);
                renderQuizList(quizzes, moduleId);
            } catch (error) {
                showError(`Error al eliminar quiz: ${error.message}`);
                closeModal('deleteQuizModal');
            }
        });
    }

    // Confirm Delete Question
    const confirmDeleteQuestionBtn = document.getElementById('confirmDeleteQuestionBtn');
    if (confirmDeleteQuestionBtn) {
        confirmDeleteQuestionBtn.addEventListener('click', async () => {
            const questionId = confirmDeleteQuestionBtn.dataset.questionId;
            const quizId = document.getElementById('editor-quiz-id')?.value; // Get quiz ID from editor
             if (!questionId || !quizId) {
                showError('Error: No se pudo obtener el ID de la pregunta o quiz.');
                closeModal('deleteQuestionModal');
                return;
            }
            try {
                await deleteQuestionFromAPI(questionId);
                showSuccess('Pregunta eliminada correctamente.');
                closeModal('deleteQuestionModal');
                // Refresh question list
                const updatedQuiz = await loadQuizDetailsFromAPI(quizId);
                renderQuestionList(updatedQuiz.questions || [], quizId);
            } catch (error) {
                showError(`Error al eliminar pregunta: ${error.message}`);
                closeModal('deleteQuestionModal');
            }
        });
    }

    // Confirm Delete Answer
    const confirmDeleteAnswerBtn = document.getElementById('confirmDeleteAnswerBtn');
    if (confirmDeleteAnswerBtn) {
        confirmDeleteAnswerBtn.addEventListener('click', async () => {
            const answerId = confirmDeleteAnswerBtn.dataset.answerId;
            const questionId = document.getElementById('question-id')?.value; // Get current question ID
            const quizId = document.getElementById('editor-quiz-id')?.value; // Get quiz ID
             if (!answerId || !questionId || !quizId) {
                showError('Error: No se pudo obtener el ID de la respuesta, pregunta o quiz.');
                closeModal('deleteAnswerModal');
                return;
            }
            try {
                await deleteAnswerFromAPI(answerId);
                showSuccess('Respuesta eliminada correctamente.');
                closeModal('deleteAnswerModal');
                // Refresh answer list
                const updatedQuiz = await loadQuizDetailsFromAPI(quizId);
                const updatedQuestion = updatedQuiz.questions.find(q => q.question_id == questionId);
                renderAnswerList(updatedQuestion?.answers || [], questionId);
            } catch (error) {
                showError(`Error al eliminar respuesta: ${error.message}`);
                closeModal('deleteAnswerModal');
            }
        });
    }

     // Generic close buttons for all modals (already partially handled in setupEventListeners)
     // Ensure all close buttons work for the new modals
     document.querySelectorAll('.modal .close-modal').forEach(btn => {
         // Check if listener already exists might be complex, re-adding might be okay if idempotent
         btn.addEventListener('click', function() {
             const modalId = this.dataset.modalId || this.closest('.modal')?.id;
             if (modalId) {
                 closeModal(modalId);
             }
         });
     });
     // Add listeners for secondary cancel buttons that also close modals
     document.querySelectorAll('.modal .btn-secondary.close-modal').forEach(btn => {
         btn.addEventListener('click', function() {
             const modalId = this.dataset.modalId || this.closest('.modal')?.id;
             if (modalId) {
                 closeModal(modalId);
             }
         });
     });

    // --- Add listener for the actual module delete confirmation ---
    const confirmDeleteModuleBtn = document.getElementById('confirmDeleteModule');
    if (confirmDeleteModuleBtn) {
        // Clone to prevent duplicate listeners if setup is called multiple times
        const newBtn = confirmDeleteModuleBtn.cloneNode(true);
        confirmDeleteModuleBtn.parentNode.replaceChild(newBtn, confirmDeleteModuleBtn);

        newBtn.addEventListener('click', async function() {
            const moduleId = this.dataset.moduleId;
            const urlParams = new URLSearchParams(window.location.search);
            const courseId = urlParams.get('id'); // Need courseId to reload modules

            if (!moduleId || !courseId) {
                showError('Error: No se pudo obtener el ID del módulo o curso.');
                closeModal('deleteModuleModal');
                return;
            }

            try {
                // Call the API function to delete
                await deleteModuleFromAPI(moduleId); // Use the correct API function
                showSuccess('Módulo eliminado correctamente.');
                closeModal('deleteModuleModal');
                // Reload modules for the current course
                loadModules(courseId);
            } catch (error) {
                showError(`Error al eliminar módulo: ${error.message}`);
                closeModal('deleteModuleModal');
            }
        });
    }
    // --- End module delete confirmation listener ---
}
