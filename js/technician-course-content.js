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

// -- Helpers para previews dinámicos --
// Extraer ID de Vimeo
function extractVimeoId(url) {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : null;
}
// Implementar función para extraer ID de YouTube
function extractYouTubeId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}
// Funcion para obtener Contenido URL
function getContentUrl(subDir, filename) {
    // Si ya es ruta absoluta, la respetamos
    if (filename.startsWith('/')) return filename;
    return `/uploads/content/${subDir}/${filename}`;
}
// Funcion de notificaciones 
function showNotification(message, type = 'info') {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `
          <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
          </div>
          <button class="notification-close">&times;</button>
        `;
    container.appendChild(notif);
    notif.querySelector('.notification-close')
        .addEventListener('click', () => notif.remove());
    setTimeout(() => notif.remove(), 5000);
}


// Funcion para Refrescar el Progreso
async function refreshProgress() {
    // reload and update overall course progress
    await loadCourse(courseId);
    // reload modules and sidebar badges
    await loadModules(courseId);
    // re-open current module if one is open
    if (currentModule) {
        const idx = moduleList.findIndex(m => m.module_id === currentModule.module_id);
        if (idx !== -1) {
            showModule(moduleList[idx], idx, moduleList.length, false);
        }
    }
}

// Funcion para Refrescar solo la barra global de progreso
async function refreshCourseProgress() {
    try {
        const res = await fetch(`/api/technician/courses/${courseId}`, { credentials: 'same-origin' });
        if (!res.ok) return;
        const { course } = await res.json();
        const pct = Math.min(100, parseFloat(course.progress_percentage || 0));
        document.getElementById('progress-percentage').textContent = `${pct}%`;
        document.getElementById('progress-fill').style.width = `${pct}%`;
    } catch (e) {
        console.error('No se pudo actualizar progreso global', e);
    }
}

// Devuelve el HTML de preview según el tipo de contenido.
function renderPreview(item) {
    const data = item.content_data;
    const type = parseInt(item.content_type_id, 10);

    if (!data || data.trim() === '') {
        return `<div class="content-error">
                <i class="fas fa-exclamation-triangle"></i> 
                No hay contenido disponible para mostrar
              </div>`;
    }

    switch (type) {
        case 1: // Video
            // YouTube
            const ytId = extractYouTubeId(data);
            if (ytId) {
                return `<div class="video-responsive">
                    <iframe 
                      src="https://www.youtube.com/embed/${ytId}" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen
                      class="content-embed-video">
                    </iframe>
                  </div>`;
            }
            // Vimeo
            const vm = data.match(/vimeo\.com\/(\d+)/);
            if (vm) {
                return `<div class="video-responsive">
                    <iframe 
                      src="https://player.vimeo.com/video/${vm[1]}" 
                      frameborder="0" 
                      allow="autoplay; fullscreen; picture-in-picture" 
                      allowfullscreen
                      class="content-embed-video">
                    </iframe>
                  </div>`;
            }
            // Video local (mp4, webm…)
            if (data.match(/\.(mp4|webm|ogg|mov)$/i)) {
                const src = getContentUrl('videos', data);
                return `<video controls src="${src}" class="content-video"></video>`;
            }
            // Enlace externo
            if (data.startsWith('http')) {
                return `<a href="${data}" target="_blank" class="content-preview-link">
                    Ver video externo
                  </a>`;
            }
            return `<div class="content-error">
                  <i class="fas fa-exclamation-triangle"></i> 
                  Formato de video no reconocido.
                </div>`;

        case 4: // Imagen
            const imgSrc = getContentUrl('images', data);
            return `<img 
                  src="${imgSrc}" 
                  alt="${item.title}" 
                  class="content-preview-image" 
                  onerror="this.onerror=null; this.src='../images/image-placeholder.png'; this.classList.add('image-error')"
                />`;

        case 3: // PDF
            const pdfSrc = getContentUrl('pdfs', data);
            return `<iframe src="${pdfSrc}" class="content-preview-pdf"></iframe>`;

        case 2: // Texto / enlace
            if (data.startsWith('http')) {
                return `<a href="${data}" target="_blank" class="content-preview-link">Ver contenido enlazado</a>`;
            }
            return `<div class="content-text">${data}</div>`;

        default:
            // Cualquier otro
            return `<div class="content-text">${data}</div>`;
    }
}

// Cargar datos y mostrar contenido
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
function showModule(module, idx, total, autoOpen = true) {
    currentModule = module;
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
        html += `<div id="content-viewer" class="content-viewer"></div>`;
    }

    // Quizzes
    if (module.quizzes && module.quizzes.length) {
        html += `<div class="content-section"><h3>Evaluaciones</h3><ul class="quiz-list">`;
        module.quizzes.forEach(q => {
            const icon = q.passed
                ? '<i class="fas fa-check-circle quiz-completed-icon"></i>'
                : '<i class="fas fa-exclamation-circle quiz-attempted-icon"></i>';
            html += `
            <li class="quiz-item ${q.passed ? 'completed' : 'attempted'}" data-id="${q.quiz_id}">
                <i class="fas fa-question-circle"></i>
                <span>${q.title}</span>
                ${icon}
                <small class="quiz-attempts">${q.attempts} intento${q.attempts !== 1 ? 's' : ''}</small>
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

    // —— Listeners para los contenidos —— 
    moduleContentEl.querySelectorAll('.content-item').forEach((el, i) => {
        el.addEventListener('click', async () => {
            const contentId = el.dataset.id;
            // 1) Busca el objeto content
            const item = module.contents.find(c => c.content_id.toString() === contentId);
            if (!item) return;

            // 2) Renderiza el contenido en el div fijo #content-viewer
            const viewer = moduleContentEl.querySelector('#content-viewer');
            viewer.innerHTML = renderPreview(item);

            // 3) Marca como completado en la BD
            const success = await markCompleted(contentId);
            if (success) {
                // 4) Actualiza la UI de este ítem
                el.classList.add('completed');

                // 5) Recalcula completados (contenidos + quizzes)
                const mod = moduleList[idx];
                const doneCount =
                    mod.contents.filter(c => c.completed).length
                    + (mod.quizzes
                        ? mod.quizzes.filter(q => q.passed /*ó q.status==='completed'*/).length
                        : 0);
                const totalCount = mod.contents.length + (mod.quizzes ? mod.quizzes.length : 0);
                const pctModule = Math.round((doneCount / totalCount) * 100);
                // 6) Actualiza badge en sidebar
                const sidebarBadge = containerEl.querySelector(`.module-item[data-idx="${idx}"] .module-progress`);
                if (sidebarBadge) sidebarBadge.textContent = `${pctModule}%`;
                // Y también barra global si quieres
                await refreshCourseProgress();
            }
        });
    });


    // --- Listeners para los quizzes ---
    moduleContentEl.querySelectorAll('.quiz-item').forEach(el => {
        el.addEventListener('click', async () => {
            const quizId = el.dataset.id;

            // 1) Obtener los datos del quiz
            const res = await fetch(
                `/api/technician/courses/${courseId}/modules/${module.module_id}/quizzes/${quizId}`,
                { credentials: 'same-origin' }
            );
            if (!res.ok) {
                showNotification('No se pudo cargar el quiz. Inténtalo más tarde.', 'error');
                return;
            }
            const quiz = await res.json();

            // 2) Mostrar el modal con las preguntas
            renderQuizModal(quiz);
            quizModalEl.style.display = 'flex';
            quizCloseBtn.onclick = closeQuizModal;

            // 3) Al pulsar "Enviar respuestas"
            quizSubmitBtn.onclick = async () => {
                try {
                    // 3a) Construir el array de respuestas
                    const answers = quiz.questions.map(q => {
                        const sel = document.querySelector(`input[name="q-${q.question_id}"]:checked`);
                        return {
                            questionId: q.question_id,
                            answerId: sel ? parseInt(sel.value, 10) : null
                        };
                    });

                    // 3b) Enviar las respuestas
                    const submitRes = await fetch(
                        `/api/technician/courses/${courseId}/modules/${module.module_id}/quizzes/${quizId}`,
                        {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ answers })
                        }
                    );

                    if (!submitRes.ok) {
                        const { message } = await submitRes.json().catch(() => ({}));
                        showNotification(
                            message || 'No se pudo enviar el quiz. Inténtalo de nuevo.',
                            'error'
                        );
                        return;
                    }

                    // 3c) Leer la respuesta (score + passed)
                    const { score, passed } = await submitRes.json();

                    // 4) Cerrar el modal
                    closeQuizModal();

                    // 5) Actualizar el icono según resultado
                    el.innerHTML = `
                    <i class="fas fa-question-circle"></i>
                    <span>${quiz.title}</span>
                    ${passed
                            ? '<i class="fas fa-check-circle quiz-completed-icon"></i>'
                            : '<i class="fas fa-exclamation-circle quiz-attempted-icon"></i>'}
                  `;
                    el.classList.remove('attempted', 'completed');
                    el.classList.add(passed ? 'completed' : 'attempted');

                    // 6) Mostrar notificación y refrescar progreso
                    if (passed) {
                        showNotification(`¡Bien hecho! Obtuviste ${score}%`, 'success');
                    } else {
                        showNotification(
                            `Obtuviste ${score}%. Necesitas ≥${quiz.passing_score}% para aprobar.`,
                            'warning'
                        );
                    }

                    // 7) Refrescar sólo la barra global
                    await refreshCourseProgress();

                } catch (err) {
                    console.error('Error al procesar el quiz:', err);
                    showNotification('Error al procesar el quiz. Inténtalo nuevamente.', 'error');
                }
            };

            // Listener para cerrar manualmente el modal
            quizCloseBtn.onclick = closeQuizModal;
        });
    });


    // Auto-abrir primer contenido
    if (autoOpen) {
        const firstContentItem = moduleContentEl.querySelector('.content-item');
        if (firstContentItem) firstContentItem.click();
    }

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

// Funciones auxiliares para el modal de quizzes 
function renderQuizModal(quiz) {
    // 1) Ocultar el botón de envío hasta que haya preguntas
    quizSubmitBtn.style.display = 'none';
    // 2) Vaciar contenido previo
    quizContainerEl.innerHTML = '';

    // 3) Construir el HTML del título (manteniendo el botón de cerrar en el DOM)
    let html = `<h3>${quiz.title}</h3>`;

    // 4) Si NO hay preguntas, mostrar mensaje
    if (!quiz.questions || quiz.questions.length === 0) {
        html += `<p>Este quiz no tiene preguntas disponibles.</p>`;
    } else {
        // 5) Si hay preguntas, renderizar cada bloque y luego habilitar el botón
        quiz.questions.forEach(q => {
            html += `
          <div class="question-block" data-qid="${q.question_id}">
            <p>${q.question_text}</p>`;
            if (!q.answers || q.answers.length === 0) {
                html += `<p class="error">Esta pregunta no tiene opciones de respuesta.</p>`;
            } else {
                q.answers.forEach(a => {
                    html += `
              <label class="answer-option">
                <input type="radio"
                       name="q-${q.question_id}"
                       value="${a.answer_id}" />
                ${a.answer_text}
              </label>`;
                });
            }
            html += `</div>`;
        });
        // 6) Una vez renderizadas las preguntas, mostramos el botón de envío
        quizSubmitBtn.style.display = '';
    }

    // 7) Insertar todo dentro del contenedor
    quizContainerEl.innerHTML = html;

    // 8) Mostrar el modal (flex para centrarlo)
    quizModalEl.style.display = 'flex';

    // 9) Conectar el botón de cerrar para ocultar el modal
    quizCloseBtn.onclick = closeQuizModal;
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

// Funcion para cerrar el Modal
function closeQuizModal() {
    quizModalEl.style.display = 'none';
}
