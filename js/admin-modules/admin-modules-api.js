// Cargar detalles del curso desde la API
async function loadCourseDetailsFromAPI(courseId) {
    const response = await fetch(`/api/courses/${courseId}`);
    if (!response.ok) {
        throw new Error('Error al cargar los detalles del curso');
    }
    
    return await response.json();
}

// Cargar módulos desde la API
async function loadModulesFromAPI(courseId) {
    const response = await fetch(`/api/courses/${courseId}/modules`);
    if (!response.ok) {
        throw new Error('No se pudieron cargar los módulos');
    }
    
    return await response.json();
}

// Guardar módulo en la API
async function saveModuleToAPI(courseId, moduleData) {
    const url = moduleData.module_id 
        ? `/api/courses/${courseId}/modules/${moduleData.module_id}` 
        : `/api/courses/${courseId}/modules`;
    
    const method = moduleData.module_id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleData)
    });
    
    if (!response.ok) {
        throw new Error('Error al guardar el módulo');
    }
    
    return await response.json();
}

// Eliminar módulo en la API
async function deleteModuleFromAPI(moduleId) {
    const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Error al eliminar el módulo');
    }
    
    return await response.json();
}

// Guardar contenido en la API (ahora maneja FormData)
async function saveContentToAPI(courseId, moduleId, formData, isEdit) {
    const contentId = isEdit ? formData.get('content_id') : null;
    const url = isEdit 
        ? `/api/courses/${courseId}/modules/${moduleId}/contents/${contentId}` 
        : `/api/courses/${courseId}/modules/${moduleId}/contents`;
    
    const method = isEdit ? 'PUT' : 'POST';
    
    // Para FormData, no establecemos Content-Type, el navegador lo hace
    const response = await fetch(url, {
        method: method,
        body: formData // Enviar FormData directamente
    });
    
    if (!response.ok) {
        // Intentar obtener más detalles del error si es posible
        let errorMsg = 'Error al guardar el contenido';
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (e) {
            // No se pudo parsear JSON, usar el mensaje genérico
        }
        throw new Error(errorMsg);
    }
    
    return await response.json();
}

// Eliminar contenido en la API
async function deleteContentFromAPI(contentId) {
    // Obtener el courseId de los parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    // Buscar el elemento del contenido para obtener el moduleId
    const contentElement = document.querySelector(`.content-item[data-content-id="${contentId}"]`);
    let moduleId;
    
    if (contentElement) {
        // Obtener el moduleId del contenedor padre
        const moduleContainer = contentElement.closest('.module-content-container');
        if (moduleContainer) {
            moduleId = moduleContainer.id.replace('content-container-', '');
        }
    }
    
    // Si no se pudo obtener el moduleId del DOM, intentar obtenerlo del botón de confirmación
    if (!moduleId) {
        const confirmBtn = document.getElementById('confirmDeleteContent');
        if (confirmBtn && confirmBtn.dataset.moduleId) {
            moduleId = confirmBtn.dataset.moduleId;
        }
    }
    
    // Verificar que tenemos los IDs necesarios
    if (!courseId || !moduleId) {
        console.error('Error: No se pudieron obtener los IDs necesarios para eliminar el contenido', {
            contentId,
            courseId,
            moduleId
        });
        throw new Error('Faltan parámetros para eliminar el contenido');
    }
    
    // Construir la URL correcta con todos los parámetros necesarios
    const url = `/api/courses/${courseId}/modules/${moduleId}/contents/${contentId}`;
    
    console.log('Eliminando contenido con URL:', url);
    
    const response = await fetch(url, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Error al eliminar el contenido');
    }
    
    return await response.json();
}

// Exportar funciones para uso en otros módulos
export { 
    loadCourseDetailsFromAPI, 
    loadModulesFromAPI, 
    saveModuleToAPI, 
    deleteModuleFromAPI, 
    saveContentToAPI, 
    deleteContentFromAPI,
    // Quiz API functions
    loadQuizzesFromAPI,
    saveQuizToAPI,
    deleteQuizFromAPI,
    loadQuizDetailsFromAPI,
    // Question API functions
    saveQuestionToAPI,
    deleteQuestionFromAPI,
    // Answer API functions
    saveAnswerToAPI,
    deleteAnswerFromAPI
};

// --- Quiz API Functions ---

// Cargar quizzes para un módulo desde la API
async function loadQuizzesFromAPI(moduleId) {
    // Obtener courseId de la URL actual
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    if (!courseId) throw new Error('Course ID not found in URL');

    const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/quizzes`);
    if (!response.ok) {
        throw new Error('No se pudieron cargar los quizzes');
    }
    return await response.json();
}

// Guardar quiz en la API (Crear o Actualizar)
async function saveQuizToAPI(moduleId, quizData) {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    if (!courseId) throw new Error('Course ID not found in URL');

    const isEdit = !!quizData.quiz_id; // Check if it's an edit by presence of quiz_id
    const url = isEdit
        ? `/api/quizzes/${quizData.quiz_id}` // Use direct quiz route for update
        : `/api/courses/${courseId}/modules/${moduleId}/quizzes`; // Use nested route for create

    const method = isEdit ? 'PUT' : 'POST';

    // Ensure moduleId is included for creation, but not needed for update URL
    const bodyData = { ...quizData };
    if (!isEdit) {
        bodyData.module_id = moduleId; // Ensure module_id is part of the body for creation
    }

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al guardar el quiz' }));
        throw new Error(errorData.message || 'Error al guardar el quiz');
    }
    return await response.json();
}

// Eliminar quiz en la API
async function deleteQuizFromAPI(quizId) {
    const response = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al eliminar el quiz' }));
        throw new Error(errorData.message || 'Error al eliminar el quiz');
    }
    return await response.json();
}

// Cargar detalles completos de un quiz (con preguntas y respuestas)
async function loadQuizDetailsFromAPI(quizId) {
    const response = await fetch(`/api/quizzes/${quizId}`);
    if (!response.ok) {
        throw new Error('No se pudieron cargar los detalles del quiz');
    }
    return await response.json();
}


// --- Question API Functions ---

// Guardar pregunta en la API (Crear o Actualizar)
async function saveQuestionToAPI(quizId, questionData) {
    const isEdit = !!questionData.question_id;
    const url = isEdit
        ? `/api/questions/${questionData.question_id}` // Use direct question route for update
        : `/api/quizzes/${quizId}/questions`; // Use nested route for create

    const method = isEdit ? 'PUT' : 'POST';

    const bodyData = { ...questionData };
     if (!isEdit) {
        bodyData.quiz_id = quizId; // Ensure quiz_id is part of the body for creation
    }

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al guardar la pregunta' }));
        throw new Error(errorData.message || 'Error al guardar la pregunta');
    }
    return await response.json();
}

// Eliminar pregunta en la API
async function deleteQuestionFromAPI(questionId) {
    const response = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al eliminar la pregunta' }));
        throw new Error(errorData.message || 'Error al eliminar la pregunta');
    }
    return await response.json();
}


// --- Answer API Functions ---

// Guardar respuesta en la API (Crear o Actualizar)
async function saveAnswerToAPI(questionId, answerData) {
    const isEdit = !!answerData.answer_id;
    const url = isEdit
        ? `/api/answers/${answerData.answer_id}` // Use direct answer route for update
        : `/api/questions/${questionId}/answers`; // Use nested route for create

    const method = isEdit ? 'PUT' : 'POST';

    const bodyData = { ...answerData };
     if (!isEdit) {
        bodyData.question_id = questionId; // Ensure question_id is part of the body for creation
    }

    const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al guardar la respuesta' }));
        throw new Error(errorData.message || 'Error al guardar la respuesta');
    }
    return await response.json();
}

// Eliminar respuesta en la API
async function deleteAnswerFromAPI(answerId) {
    const response = await fetch(`/api/answers/${answerId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al eliminar la respuesta' }));
        throw new Error(errorData.message || 'Error al eliminar la respuesta');
    }
    return await response.json();
}
