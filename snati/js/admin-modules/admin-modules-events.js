// Import UI functions needed for event handling
import { openModuleModal, openQuizManagementModal, renderQuizList, openQuizFormModal, resetQuizForm, confirmDeleteQuiz, openQuizEditorModal, renderQuestionList, resetQuestionForm, populateQuestionFormForEdit, confirmDeleteQuestion, renderAnswerList, resetAnswerForm, populateAnswerFormForEdit, confirmDeleteAnswer, closeModal, updateAnswerSectionVisibility } from './admin-modules-ui.js'; // Added updateAnswerSectionVisibility
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

                if (target.classList.contains('edit-quiz-details-btn') || target.closest('.edit-quiz-details-btn')) {
                    // --- Handle Edit Quiz Details ---
                    console.log(`Edit quiz details button clicked for quiz ${quizId}`);
                    try {
                        // Fetch details needed for the form modal
                        const quizDetails = await loadQuizDetailsFromAPI(quizId); // Assuming this fetches title, desc, score, time, pos
                        // Pass moduleId and the fetched quiz data to the form modal function
                        openQuizFormModal(moduleId, quizDetails);
                    } catch (error) {
                        showError(`Error al cargar detalles del quiz: ${error.message}`);
                    }

                } else if (target.classList.contains('edit-quiz-btn') || target.closest('.edit-quiz-btn')) {
                    // --- Handle Edit Questions/Answers ---
                    console.log(`Edit quiz questions/answers button clicked for quiz ${quizId}`);
                    try {
                        // Fetch full details needed for the editor modal
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
        const questionTypeDropdown = document.getElementById('question-type'); // Get the dropdown
        const answerSectionContainer = document.getElementById('answer-section-container');
        const answerFormContainer = document.getElementById('answer-form-container');
        const answerForm = document.getElementById('answer-form');

        // Add listener for Question Type change
        if (questionTypeDropdown) {
            // Use cloneNode to prevent duplicate listeners if setup is called multiple times
            const newDropdown = questionTypeDropdown.cloneNode(true);
            questionTypeDropdown.parentNode.replaceChild(newDropdown, questionTypeDropdown);

            newDropdown.addEventListener('change', (e) => {
                const selectedType = e.target.value;
                updateAnswerSectionVisibility(selectedType); // Update UI based on selection
                const answerListContainer = document.getElementById('answer-list-container');

                if (selectedType !== 'multiple_choice') {
                     resetAnswerForm(); // Reset answer form if not MC
                     answerFormContainer.style.display = 'none'; // Hide form
                }
                if (selectedType === 'true_false') {
                    // Render the T/F options immediately when selected in the form
                    const questionId = document.getElementById('question-id').value; // Get current question ID (might be empty for new)
                    renderAnswerList([], questionId, 'true_false'); // Render empty T/F structure
                } else if (selectedType === 'multiple_choice') {
                    // Clear the list if switching to MC from T/F or other types
                     if (answerListContainer) answerListContainer.innerHTML = '<p class="empty-sublist-message">No hay respuestas añadidas.</p>';
                } else if (selectedType === 'short_answer') {
                     if (answerListContainer) answerListContainer.innerHTML = '<p class="empty-sublist-message">Las respuestas cortas se califican manualmente.</p>';
                }
            });
        }

        // "Nueva Pregunta" button
        const addQuestionBtn = quizEditorModal.querySelector('#add-question-btn');
        if (addQuestionBtn) {
             // Clone to prevent duplicate listeners
            const newBtn = addQuestionBtn.cloneNode(true);
            addQuestionBtn.parentNode.replaceChild(newBtn, addQuestionBtn);
            newBtn.addEventListener('click', () => {
                resetQuestionForm();
                // Calculate next position
                const questionItems = document.getElementById('question-list-container')?.querySelectorAll('.question-item') || [];
                 document.getElementById('question-position').value = questionItems.length + 1;
                questionFormContainer.style.display = 'block';
                // Trigger change event on dropdown to set initial visibility for default type (multiple_choice)
                document.getElementById('question-type').dispatchEvent(new Event('change'));
                document.getElementById('question-text').focus();
            });
        }

         // Cancel Question Edit button
         const cancelQuestionBtn = quizEditorModal.querySelector('#cancel-question-edit');
          if (cancelQuestionBtn) {
             // Clone to prevent duplicate listeners
            const newBtn = cancelQuestionBtn.cloneNode(true);
            cancelQuestionBtn.parentNode.replaceChild(newBtn, cancelQuestionBtn);
             newBtn.addEventListener('click', () => {
                 questionFormContainer.style.display = 'none'; // Hide question form
                 answerSectionContainer.style.display = 'none'; // Hide answer section as well
                 resetQuestionForm(); // Reset form (which also resets answer form)
             });
        }

        // Question Form submission
        if (questionForm) {
             // Clone to prevent duplicate listeners
            const newForm = questionForm.cloneNode(true);
            questionForm.parentNode.replaceChild(newForm, questionForm);
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(newForm); // Use the cloned form
                const questionData = Object.fromEntries(formData.entries());
                const quizId = document.getElementById('editor-quiz-id').value;
                const questionId = questionData.questionId || null;
                const questionType = questionData.question_type; // Get type from form data

                // Convert numeric
                questionData.points = parseInt(questionData.points) || 1;
                questionData.position = parseInt(questionData.position) || 1;
                if (!questionId) delete questionData.questionId; // Don't send empty ID

                // Handle True/False answer saving (example - might need API adjustment)
                let answersPayload = null;
                if (questionType === 'true_false') {
                    const correctAnswerValue = newForm.querySelector('input[name^="tf_correct_"]:checked')?.value; // Get checked radio value
                    console.log('Selected T/F correct answer:', correctAnswerValue);
                    // Example: Backend might expect answers array like [{ text: 'Verdadero', is_correct: true/false }, { text: 'Falso', is_correct: true/false }]
                    answersPayload = [
                        { answer_text: 'Verdadero', is_correct: correctAnswerValue === 'true' },
                        { answer_text: 'Falso', is_correct: correctAnswerValue === 'false' }
                    ];
                    // Add answers to the question data payload if API expects it this way
                    // questionData.answers = answersPayload; // Uncomment if API expects answers during question save
                }


                try {
                    const result = await saveQuestionToAPI(quizId, {
                        ...questionData,
                        question_id: questionId // Ensure question_id is passed for updates
                        // If API handles T/F answers separately, don't send questionData.answers
                    });

                    // If API requires separate calls to save T/F answers after question is saved/updated:
                    // This assumes saveQuestionToAPI returns the saved/updated question with its ID
                    const savedQuestionId = result?.question_id || questionId;
                    if (questionType === 'true_false' && savedQuestionId && answersPayload) {
                        console.log("Saving/Updating True/False answers separately...");
                        // You might need a loop and call saveAnswerToAPI for 'Verdadero' and 'Falso'
                        // This requires knowing if the answers already exist (to update) or need creation.
                        // This logic depends heavily on the API design.
                        // For now, we assume the question save handles it or it's done manually.
                    }


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
            // No need to clone here as it's delegation on a static parent
            questionListContainer.addEventListener('click', (e) => {
                const target = e.target;
                const questionItem = target.closest('.question-item');
                if (!questionItem) return;

                const questionId = questionItem.dataset.questionId;
                const quizId = document.getElementById('editor-quiz-id').value;

                 if (target.classList.contains('edit-question-btn') || target.closest('.edit-question-btn')) {
                    // --- Handle Edit Question ---
                    console.log(`Edit question button clicked for question ${questionId}`);
                    // Fetch fresh quiz details to ensure we have the latest question data
                    loadQuizDetailsFromAPI(quizId).then(quiz => {
                         const question = quiz.questions.find(q => q.question_id == questionId);
                         if (question) {
                             // 1. Populate the question form
                             populateQuestionFormForEdit(question); // This now calls updateAnswerSectionVisibility

                             // 2. Get the main answer list container within the answer section
                             const mainAnswerListContainer = document.getElementById('answer-list-container');

                             // 3. Render the answers for THIS question into the main container, passing the type
                             if (mainAnswerListContainer) {
                                 renderAnswerList(question.answers || [], questionId, question.question_type); // Pass question type
                             } else {
                                 console.error("Answer list container (#answer-list-container) not found!");
                             }

                             // 4. Ensure the answer section is visible (handled by updateAnswerSectionVisibility called in populate)
                             // answerSectionContainer.style.display = 'block'; // No longer needed here

                             // 5. Set the question ID for the "Add Answer" button
                             const addAnswerBtn = document.getElementById('add-answer-btn');
                             if (addAnswerBtn) {
                                 addAnswerBtn.dataset.questionId = questionId;
                             } else {
                                 console.error("Add answer button (#add-answer-btn) not found!");
                             }

                             // 6. Hide the answer form initially when editing a question
                             const answerFormContainer = document.getElementById('answer-form-container');
                             if(answerFormContainer) {
                                answerFormContainer.style.display = 'none';
                                resetAnswerForm(); // Reset just in case
                             }

                         } else {
                             showError('No se encontró la pregunta para editar.');
                        }
                    }).catch(err => showError(`Error al cargar detalles de la pregunta: ${err.message}`));

                 } else if (target.classList.contains('delete-question-btn') || target.closest('.delete-question-btn')) {
                    const questionText = questionItem.querySelector('.item-title')?.textContent || 'esta pregunta'; // Adjusted selector
                    confirmDeleteQuestion(questionId, questionText);
                }
            });
        }

         // --- Answer Listeners (within Quiz Editor) ---

         // "Nueva Respuesta" button
         const addAnswerBtn = quizEditorModal.querySelector('#add-answer-btn');
         if (addAnswerBtn) {
             // Clone to prevent duplicate listeners
            const newBtn = addAnswerBtn.cloneNode(true);
            addAnswerBtn.parentNode.replaceChild(newBtn, addAnswerBtn);
             newBtn.addEventListener('click', () => {
                 // Only proceed if it's a multiple choice question
                 const currentQuestionType = document.getElementById('question-type').value;
                 if (currentQuestionType === 'multiple_choice') {
                     resetAnswerForm();
                     answerFormContainer.style.display = 'block';
                     document.getElementById('answer-text').focus();
                 } else {
                     showError('Solo se pueden añadir respuestas a preguntas de opción múltiple.');
                 }
             });
         }

         // Cancel Answer Edit button
         const cancelAnswerBtn = quizEditorModal.querySelector('#cancel-answer-edit');
         if (cancelAnswerBtn) {
             // Clone to prevent duplicate listeners
            const newBtn = cancelAnswerBtn.cloneNode(true);
            cancelAnswerBtn.parentNode.replaceChild(newBtn, cancelAnswerBtn);
             newBtn.addEventListener('click', () => {
                 answerFormContainer.style.display = 'none';
                 resetAnswerForm();
             });
         }

         // Answer Form submission
         if (answerForm) {
             // Clone to prevent duplicate listeners
            const newForm = answerForm.cloneNode(true);
            answerForm.parentNode.replaceChild(newForm, answerForm);
             newForm.addEventListener('submit', async (e) => {
                 e.preventDefault();
                 const formData = new FormData(newForm); // Use cloned form
                 const answerData = {
                     answer_text: formData.get('answer_text'),
                     is_correct: formData.has('is_correct') // Checkbox value
                 };
                 const answerId = formData.get('answerId') || null;
                 const questionId = document.getElementById('question-id').value; // ID of the question being edited
                 const questionType = document.getElementById('question-type').value; // Get type from the form
                 const quizId = document.getElementById('editor-quiz-id').value; // Need quizId to refresh later

                 // Only allow saving answers for multiple choice
                 if (questionType !== 'multiple_choice') {
                     showError('Solo se pueden guardar respuestas para preguntas de opción múltiple.');
                     return;
                 }

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
                     // Refresh the answer list for the current question, passing its type
                     const updatedQuiz = await loadQuizDetailsFromAPI(quizId);
                     const updatedQuestion = updatedQuiz.questions.find(q => q.question_id == questionId);
                     if (updatedQuestion) {
                         renderAnswerList(updatedQuestion.answers || [], questionId, updatedQuestion.question_type); // Pass type
                     }
                 } catch (error) {
                     showError(`Error al guardar respuesta: ${error.message}`);
                 }
             });
         }

         // Event delegation for Answer Edit/Delete buttons (within the answer section)
         const answerSection = quizEditorModal.querySelector('#answer-section-container');
         if (answerSection) {
             // No need to clone here as it's delegation on a static parent
             answerSection.addEventListener('click', (e) => {
                 const target = e.target;
                  const answerItem = target.closest('.answer-item');
                  if (!answerItem) return;

                  const answerId = answerItem.dataset.answerId; // Might be undefined for T/F items
                  const questionId = answerItem.dataset.questionId;
                  const quizId = document.getElementById('editor-quiz-id').value; // Get quiz ID for fetching

                  if (!questionId) {
                      showError('Error: No se pudo determinar la pregunta asociada a esta respuesta.');
                      return;
                  }

                  // Handle T/F radio button clicks
                  if (target.classList.contains('tf-radio') || target.classList.contains('tf-label')) {
                      const radio = answerItem.querySelector('.tf-radio');
                      if (radio && !radio.checked) {
                          radio.checked = true;
                          // Optionally: Immediately save the change or wait for question save?
                          // For now, just update UI, save happens with question save.
                          console.log(`T/F selection changed for Q:${questionId}, New correct: ${radio.value}`);
                          // Update labels visually
                          const labels = answerSection.querySelectorAll('.tf-label');
                          labels.forEach(lbl => lbl.classList.remove('correct'));
                          answerItem.querySelector('.tf-label').classList.add('correct');
                      }
                      return; // Stop further processing for T/F clicks
                  }


                  // Handle Delete button click (only for multiple choice)
                  if (target.classList.contains('delete-answer-btn') || target.closest('.delete-answer-btn')) {
                      // Ensure it's not a T/F item before trying to delete
                      if (!answerItem.classList.contains('true-false-item') && answerId) {
                          const answerText = answerItem.querySelector('.item-title')?.textContent || 'esta respuesta';
                          confirmDeleteAnswer(answerId, answerText, questionId); // Pass questionId
                      } else if (!answerId && answerItem.classList.contains('true-false-item')) {
                          // Ignore delete clicks on T/F items for now
                          console.log("Delete clicked on T/F item - ignored.");
                      } else {
                           showError('No se puede eliminar esta respuesta.');
                      }
                  }
              });
         }
    }


    // --- Delete Confirmation Modal Listeners ---

    // Confirm Delete Quiz
    const confirmDeleteQuizBtn = document.getElementById('confirmDeleteQuizBtn');
    if (confirmDeleteQuizBtn) {
         // Clone to prevent duplicate listeners
        const newBtn = confirmDeleteQuizBtn.cloneNode(true);
        confirmDeleteQuizBtn.parentNode.replaceChild(newBtn, confirmDeleteQuizBtn);
        newBtn.addEventListener('click', async () => {
            const quizId = newBtn.dataset.quizId; // Use cloned button
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
         // Clone to prevent duplicate listeners
        const newBtn = confirmDeleteQuestionBtn.cloneNode(true);
        confirmDeleteQuestionBtn.parentNode.replaceChild(newBtn, confirmDeleteQuestionBtn);
        newBtn.addEventListener('click', async () => {
            const questionId = newBtn.dataset.questionId; // Use cloned button
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
         // Clone to prevent duplicate listeners
         const newBtn = confirmDeleteAnswerBtn.cloneNode(true);
         confirmDeleteAnswerBtn.parentNode.replaceChild(newBtn, confirmDeleteAnswerBtn);

         newBtn.addEventListener('click', async () => {
             const answerId = newBtn.dataset.answerId;
             const questionId = newBtn.dataset.questionId; // Retrieve questionId stored on the button
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
                // Refresh answer list for the specific question
                const updatedQuiz = await loadQuizDetailsFromAPI(quizId);
                const updatedQuestion = updatedQuiz.questions.find(q => q.question_id == questionId);
                if (updatedQuestion) {
                    // Pass the correct question type when re-rendering
                    renderAnswerList(updatedQuestion.answers || [], questionId, updatedQuestion.question_type);
                } else {
                     // If question somehow got deleted, maybe refresh the whole question list?
                     renderQuestionList(updatedQuiz.questions || [], quizId);
                }
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
         // Clone to prevent duplicate listeners
         const newBtn = btn.cloneNode(true);
         btn.parentNode.replaceChild(newBtn, btn);
         newBtn.addEventListener('click', function() {
             const modalId = this.dataset.modalId || this.closest('.modal')?.id;
             if (modalId) {
                 closeModal(modalId);
             }
         });
     });
     // Add listeners for secondary cancel buttons that also close modals
     document.querySelectorAll('.modal .btn-secondary.close-modal').forEach(btn => {
          // Clone to prevent duplicate listeners
         const newBtn = btn.cloneNode(true);
         btn.parentNode.replaceChild(newBtn, btn);
         newBtn.addEventListener('click', function() {
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
