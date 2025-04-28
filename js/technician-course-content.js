let courseId;

// Elements
const loadingEl = document.getElementById('course-loading');
const containerEl = document.getElementById('course-container');
const modulesListEl = document.getElementById('modules-list');
const welcomeScreenEl = document.getElementById('welcome-screen');
const moduleContentEl = document.getElementById('module-content');
const quizModalEl = document.getElementById('quiz-modal');
const quizContainerEl = document.getElementById('quiz-container');
const quizSubmitBtn = document.getElementById('quiz-submit-btn');
const quizCloseBtn = document.getElementById('quiz-close-btn');

let moduleList = [];
let currentModule = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Verifica sesión y despliega UI
    initTechnicianPage();

    const params = new URLSearchParams(window.location.search);
    courseId = params.get('id');
    if (!courseId) {
        showError('Curso no especificado.');
        return;
    }

    try {
        // Carga datos del curso y módulos
        await loadCourse(courseId);
        await loadModules(courseId);
        // Muestra contenido y oculta loader
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

        const startButton = document.getElementById('start-course-btn');
        if (startButton) {
            startButton.addEventListener('click', () => {
                const firstModule = document.querySelector('.module-item');
                if (firstModule) {
                    firstModule.click();
                } else {
                    console.error('No hay módulos disponibles para comenzar.');
                }
            });
        }

    } catch (err) {
        console.error('Error al cargar curso:', err);
        showError(err.message || 'Error al cargar el curso. Intente nuevamente más tarde.');
    }
});

// Muestra mensaje de error y oculta contenido
function showError(msg) {
    loadingEl.style.display = 'none';
    containerEl.style.display = 'none';
    document.getElementById('error-message').textContent = msg;
    document.getElementById('course-error').style.display = 'block';
}

// Carga datos básicos del curso
async function loadCourse(courseId) {
    console.log('Cargando datos del curso:', courseId);
    const res = await fetch(`/api/technician/courses/${courseId}`, { credentials: 'same-origin' });

    if (!res.ok) {
        console.error('Error en respuesta API:', res.status, res.statusText);
        throw new Error('No se pudo cargar el curso.');
    }

    const data = await res.json();
    console.log('Datos del curso recibidos:', data);

    if (!data.success) {
        throw new Error(data.error || 'Error al cargar datos del curso.');
    }

    const { course } = data;
    document.getElementById('course-name').textContent = course.title;
    document.getElementById('course-title').textContent = course.title;
    document.getElementById('course-description').textContent = course.description || '';

    const pct = parseFloat(course.progress_percentage || 0);
    document.getElementById('progress-percentage').textContent = `${pct}%`;
    document.getElementById('progress-fill').style.width = `${pct}%`;

    document.title = `${course.title} – Plataforma Técnicos`;
    console.log('Datos del curso cargados correctamente');
}

// Carga módulos + contenidos + quizzes
async function loadModules(courseId) {
    console.log('Cargando módulos del curso:', courseId);
    try {
        const res = await fetch(`/api/technician/courses/${courseId}/modules`, {
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Respuesta recibida:', res.status, res.statusText);

        if (!res.ok) {
            console.error('Error en respuesta API de módulos:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('Detalle del error:', errorText);
            throw new Error('No se pudieron cargar los módulos.');
        }

        const data = await res.json();
        console.log('Datos de módulos recibidos:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar módulos.');
        }

        moduleList = data.modules; // guarda globalmente
        if (!moduleList || !moduleList.length) {
            console.warn('No se encontraron módulos para este curso');
        }

        const ul = document.getElementById('modules-list');
        ul.innerHTML = moduleList.map((m, i) => {
            const cls = m.status === 'completed' ? 'completed'
                : m.status === 'in_progress' ? 'in-progress'
                    : '';
            return `
            <li class="module-item ${cls}" data-idx="${i}">
              <span class="module-number">${i + 1}</span>
              <span class="module-title">${m.title}</span>
              <span class="module-progress">${m.progress}%</span>
            </li>
          `;
        }).join('');

        // Al hacer clic en un módulo, lo mostramos
        document.querySelectorAll('.module-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.idx, 10);
                showModule(moduleList[idx], idx, moduleList.length);
            });
        });

        console.log('Módulos cargados correctamente');
    } catch (err) {
        console.error('Error al cargar módulos:', err);
        throw new Error(`Error al cargar módulos: ${err.message}`);
    }
}

// Muestra el detalle de un módulo, guarda avances y carga contenido
function showModule(module, idx, total) {
    console.log('Mostrando módulo:', module);
    welcomeScreenEl.style.display = 'none';
    moduleContentEl.style.display = 'block';

    // Construye HTML básico
    let html = `
      <div class="module-header">
        <h2>Módulo ${idx + 1}: ${module.title}</h2>
      </div>
      <div class="content-section">
        <h3>Descripción</h3>
        <p>${module.description || ''}</p>
      </div>
    `;

    // Contenidos
    if (module.contents && module.contents.length) {
        html += `<div class="content-section"><h3>Contenidos</h3><ul class="content-list">`;
        module.contents.forEach(item => {
            const done = item.completed ? 'completed' : '';
            html += `
          <li class="content-item ${done}" data-id="${item.content_id}">
            <i class="${getContentTypeIcon(item.content_type_id)}"></i>
            <span>${item.title}</span>
          </li>
        `;
        });
        html += `</ul></div>`;
    }

    // Quizzes
    if (module.quizzes && module.quizzes.length) {
        html += `<div class="content-section"><h3>Evaluaciones</h3><ul class="quiz-list">`;
        module.quizzes.forEach(q => {
            const icon = q.status === 'completed'
                ? '<i class="fas fa-check-circle quiz-completed-icon"></i>'
                : q.status === 'attempted'
                    ? '<i class="fas fa-exclamation-circle quiz-attempted-icon"></i>'
                    : '';
            html += `
          <li class="quiz-item ${q.status}" data-id="${q.quiz_id}">
            <i class="fas fa-question-circle"></i>
            <span>${q.title}</span>
            ${icon}
          </li>
        `;
        });
        html += `</ul></div>`;
    }

    // Botones de navegación
    html += `<div class="navigation-buttons">`;
    html += idx > 0
        ? `<button class="btn-secondary prev-module">Anterior</button>`
        : `<button class="btn-secondary" disabled>Anterior</button>`;
    html += idx < total - 1
        ? `<button class="btn-primary next-module">Siguiente</button>`
        : `<button class="btn-primary" disabled>Siguiente</button>`;
    html += `</div>`;

    moduleContentEl.innerHTML = html

    // --- Inicio: Listeners para los quizzes ---
    moduleContentEl.querySelectorAll('.quiz-item').forEach(el => {
        el.addEventListener('click', async () => {
            const quizId = el.dataset.id;
            try {
                // Obtiene todas las preguntas y respuestas
                const res = await fetch(
                    `/api/technician/courses/${courseId}/modules/${module.module_id}/quizzes/${quizId}`,
                    { credentials: 'same-origin' }
                );

                if (!res.ok) {
                    throw new Error('Error al cargar el quiz');
                }

                const quiz = await res.json();
                console.log('Quiz cargado:', quiz);

                // Renderiza el quiz en el modal
                renderQuizModal(quiz);

                // Al pulsar "Enviar respuestas"
                quizSubmitBtn.onclick = async () => {
                    try {
                        const userAnswers = collectAnswers(); // [{questionId, answerId}, …]
                        console.log('Enviando respuestas:', userAnswers);

                        const submitRes = await fetch(
                            `/api/technician/courses/${courseId}/modules/${module.module_id}/quizzes/${quizId}/submit`,
                            {
                                method: 'POST',
                                credentials: 'same-origin',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ answers: userAnswers })
                            }
                        );

                        if (!submitRes.ok) {
                            const errorText = await submitRes.text();
                            throw new Error(`Error al enviar respuestas: ${errorText}`);
                        }

                        const result = await submitRes.json();
                        console.log('Resultado del quiz:', result);

                        closeQuizModal();

                        // Actualiza el icono según aprobado/reprobado
                        el.innerHTML = `
                            <i class="fas fa-question-circle"></i>
                            <span>${q.title}</span>
                            ${result.passed
                                ? '<i class="fas fa-check-circle quiz-completed-icon"></i>'
                                : '<i class="fas fa-exclamation-circle quiz-attempted-icon"></i>'}
                        `;
                    } catch (err) {
                        console.error('Error al procesar quiz:', err);
                        alert('Error al procesar el quiz. Inténtalo nuevamente.');
                    }
                };

                // Cerrar modal
                quizCloseBtn.onclick = closeQuizModal;
            } catch (err) {
                console.error('Error al cargar quiz:', err);
                alert('Error al cargar el quiz. Inténtalo nuevamente.');
            }
        });
    });

    // Interacción: marcar contenido como completado y mostrar su data
    moduleContentEl.querySelectorAll('.content-item').forEach(el => {
        el.addEventListener('click', async () => {
            const contentId = el.dataset.id;
            try {
                console.log('Marcando contenido como completado:', contentId);
                const success = await markCompleted(contentId);

                if (!success) {
                    throw new Error('No se pudo marcar como completado');
                }

                // Busca el item en module.contents
                const item = module.contents.find(c => c.content_id == contentId);
                if (item && item.content_data) {
                    // Verifica si ya existe un content-viewer para este item
                    const existingViewer = el.nextElementSibling;
                    if (existingViewer && existingViewer.classList.contains('content-viewer')) {
                        existingViewer.innerHTML = item.content_data;
                    } else {
                        el.insertAdjacentHTML('afterend', `<div class="content-viewer">${item.content_data}</div>`);
                    }
                }

                el.classList.add('completed');
            } catch (err) {
                console.error('Error al completar contenido:', err);
                alert('Error al marcar contenido como completado. Inténtalo nuevamente.');
            }
        });
    });

    // Auto-abrir primer contenido
    const firstContentItem = moduleContentEl.querySelector('.content-item');
    if (firstContentItem) { firstContentItem.click(); }

    // Botones Prev/Next
    const prevBtn = moduleContentEl.querySelector('.prev-module');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showModule(moduleList[idx - 1], idx - 1, total);
        });
    }

    const nextBtn = moduleContentEl.querySelector('.next-module');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showModule(moduleList[idx + 1], idx + 1, total);
        });
    }
}

// Llama a la API para marcar como completado
async function markCompleted(contentId) {
    try {
        const res = await fetch(`/api/technician/courses/content/${contentId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        if (!res.ok) {
            console.error('Error de API al marcar contenido:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('Detalle del error:', errorText);
            return false;
        }

        const data = await res.json();
        return data.success;
    } catch (err) {
        console.error('Error al marcar contenido como completado:', err);
        return false;
    }
}

// Iconos según tipo de contenido
function getContentTypeIcon(typeId) {
    switch (parseInt(typeId, 10)) {
        case 1: return 'fas fa-play-circle';    // Video
        case 2: return 'fas fa-file-alt';        // Texto
        case 3: return 'fas fa-file-pdf';        // PDF
        case 4: return 'fas fa-image';           // Imagen
        case 5: return 'fas fa-puzzle-piece';    // Interactivo
        default: return 'fas fa-file';
    }
}

// ————— Funciones auxiliares para el modal de quizzes —————
function renderQuizModal(quiz) {
    quizContainerEl.innerHTML = ''; // Limpiar contenido anterior

    let html = `<h3>${quiz.title}</h3>`;

    if (!quiz.questions || !quiz.questions.length) {
        html += '<p>Este quiz no tiene preguntas disponibles.</p>';
        quizContainerEl.innerHTML = html;
        quizModalEl.style.display = 'block';
        return;
    }

    quiz.questions.forEach(q => {
        html += `<div class="question-block" data-qid="${q.question_id}">
        <p>${q.question_text}</p>`;

        if (!q.answers || !q.answers.length) {
            html += '<p class="error">Esta pregunta no tiene opciones de respuesta.</p>';
        } else {
            q.answers.forEach(a => {
                html += `<label>
              <input type="radio"
                     name="q_${q.question_id}"
                     value="${a.answer_id}" />
              ${a.answer_text}
            </label>`;
            });
        }

        html += `</div>`;
    });

    quizContainerEl.innerHTML = html;
    quizModalEl.style.display = 'block';
}

// Recolecta las respuestas seleccionadas
function collectAnswers() {
    const answers = [];
    document.querySelectorAll('.question-block').forEach(qb => {
        const qid = qb.dataset.qid;
        const sel = qb.querySelector(`input[name="q_${qid}"]:checked`);
        if (sel) {
            answers.push({
                questionId: parseInt(qid, 10),
                answerId: parseInt(sel.value, 10)
            });
        }
    });
    return answers;
}

function closeQuizModal() {
    quizModalEl.style.display = 'none';
}
