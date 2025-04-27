document.addEventListener('DOMContentLoaded', async () => {
    // Verifica sesión y despliega UI
    initTechnicianPage();

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');
    if (!courseId) {
        showError('Curso no especificado.');
        return;
    }

    try {
        // Carga datos del curso y módulos
        await loadCourse(courseId);
        await loadModules(courseId);
        // Muestra contenido y oculta loader
        document.getElementById('course-loading').style.display = 'none';
        document.getElementById('course-container').style.display = 'block';

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
        console.error(err);
        showError(err.message);
    }
});

// Muestra mensaje de error y oculta contenido
function showError(msg) {
    document.getElementById('course-loading').style.display = 'none';
    document.getElementById('course-container').style.display = 'none';
    document.getElementById('error-message').textContent = msg;
    document.getElementById('course-error').style.display = 'block';
}

// Carga datos básicos del curso
async function loadCourse(courseId) {
    const res = await fetch(`/api/technician/courses/${courseId}`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('No se pudo cargar el curso.');
    const { success, course } = await res.json();
    if (!success) throw new Error('Error al cargar datos del curso.');

    document.getElementById('course-name').textContent = course.title;
    document.getElementById('course-title').textContent = course.title;
    document.getElementById('course-description').textContent = course.description || '';

    const pct = parseFloat(course.progress_percentage || 0);
    document.getElementById('progress-percentage').textContent = `${pct}%`;
    document.getElementById('progress-fill').style.width = `${pct}%`;

    document.title = `${course.title} – Plataforma Técnicos`;
}

// Lista global de módulos, para navegación
let moduleList = [];

// Carga módulos + contenidos + quizzes
async function loadModules(courseId) {
    const res = await fetch(`/api/technician/courses/${courseId}/modules`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('No se pudieron cargar los módulos.');
    const { success, modules } = await res.json();
    if (!success) throw new Error('Error al cargar módulos.');

    moduleList = modules; // guarda globalmente

    const ul = document.getElementById('modules-list');
    ul.innerHTML = modules.map((m, i) => {
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
}

// Muestra el detalle de un módulo, guarda avances y carga contenido
function showModule(module, idx, total) {
    document.getElementById('welcome-screen').style.display = 'none';
    const container = document.getElementById('module-content');
    container.style.display = 'block';

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

    container.innerHTML = html;

    // Interacción: marcar contenido como completado y mostrar su data
    container.querySelectorAll('.content-item').forEach(el => {
        el.addEventListener('click', async () => {
            const contentId = el.dataset.id;
            const success = await markCompleted(contentId);
            if (!success) return;
            // Busca el item en module.contents
            const item = module.contents.find(c => c.content_id == contentId);
            if (item && item.content_data) {
                el.insertAdjacentHTML('afterend', `<div class="content-viewer">${item.content_data}</div>`);
            }
            el.classList.add('completed');
        });
    });

    // Botones Prev/Next
    container.querySelector('.prev-module')?.addEventListener('click', () => {
        showModule(moduleList[idx - 1], idx - 1, total);
    });
    container.querySelector('.next-module')?.addEventListener('click', () => {
        showModule(moduleList[idx + 1], idx + 1, total);
    });
}

// Llama a la API para marcar como completado
async function markCompleted(contentId) {
    try {
        const res = await fetch(`/api/technician/courses/content/${contentId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });
        if (!res.ok) throw new Error();
        const { success } = await res.json();
        return success;
    } catch {
        console.error('Error al marcar contenido como completado');
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
