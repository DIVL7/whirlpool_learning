// js/technician-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    initTechnicianPage();
    initializeDashboard();
    setupGameObjectLink(); // Add call to the new function
});

// --- Add the new function below ---

// Function to handle the random game object link
function setupGameObjectLink() {
    const gameObjectContainer = document.getElementById('game-object-container');
    if (!gameObjectContainer) return; // Exit if the container doesn't exist

    // Decide randomly whether to show the game object (e.g., 10% chance)
    const shouldShow = Math.random() < 0.1; // Reduced probability from 0.5

    if (shouldShow) {
        gameObjectContainer.style.display = 'block'; // Show the container

        gameObjectContainer.addEventListener('click', () => {
            // Store the current URL before navigating away
            sessionStorage.setItem('returnUrlFromGame', window.location.href);
            // Redirect to the game
            window.location.href = '/juego gzip/index.html'; // Path to the game's index file
        });
    }
}

// Carga estadísticas reales del técnico
async function loadUserStats() {
    try {
        const resp = await fetch('/api/technician/stats', { credentials: 'same-origin' });
        const data = await resp.json();
        if (!data.success) return;

        const elCourses = document.getElementById('courses-count');
        const elCompleted = document.getElementById('completed-count');
        const elCerts = document.getElementById('certification-count');
        const elTrendCourses = document.getElementById('courses-trend');
        const elTrendComp = document.getElementById('completed-trend');
        const elTrendCerts = document.getElementById('certification-trend');

        if (elCourses) elCourses.textContent = data.coursesAssigned;
        if (elCompleted) elCompleted.textContent = data.coursesCompleted;
        if (elCerts) elCerts.textContent = data.certifications;
        if (elTrendCourses) elTrendCourses.textContent = data.coursesTrend;
        if (elTrendComp) elTrendComp.textContent = data.completedTrend;
        if (elTrendCerts) elTrendCerts.textContent = data.certificationTrend;

        updateTrendClasses('courses-trend', data.coursesTrend);
        updateTrendClasses('completed-trend', data.completedTrend);
        updateTrendClasses('certification-trend', data.certificationTrend);
    } catch (err) {
        console.error('Error al cargar estadísticas:', err);
    }
}

// Aplica iconos y clases según la tendencia
function updateTrendClasses(elementId, trendValue) {
    const textEl = document.getElementById(elementId);
    if (!textEl) return;
    const container = textEl.parentElement;
    const icon = container.querySelector('i');
    const num = parseInt(trendValue, 10) || 0;

    container.classList.toggle('up', num >= 0);
    container.classList.toggle('down', num < 0);
    if (icon) {
        icon.classList.toggle('fa-arrow-up', num >= 0);
        icon.classList.toggle('fa-arrow-down', num < 0);
    }
}

// Carga los cursos en progreso, lista varios o redirige si solo hay uno
async function loadInProgressCourses() {
    try {
        const resp = await fetch('/api/technician/courses', { credentials: 'same-origin' });
        const data = await resp.json();
        if (!data.success) return;

        const courses = Array.isArray(data.courses) ? data.courses : [];
        const inProg = courses.filter(c => c.status === 'in_progress');
        const ul = document.getElementById('in-progress-list');
        if (!ul) return;

        ul.innerHTML = '';

        if (inProg.length === 0) {
            ul.innerHTML = '<li class="no-courses">No tienes cursos en progreso.</li>';
            return;
        }

        inProg.slice(0, 4).forEach(c => {
            const li = document.createElement('li');
            li.className = 'in-progress-item';
            li.innerHTML = `
                <span class="course-title">${c.title}</span>
                <div class="small-progress-bar">
                    <div class="small-progress-fill" style="width:${c.progress}%"></div>
                </div>
                <span class="progress-percent">${c.progress}%</span>
            `;
            li.addEventListener('click', () => {
                window.location.href = `course-content.html?id=${c.id}`;
            });
            ul.appendChild(li);
        });
    } catch (err) {
        console.error('Error cargando cursos en progreso:', err);
    }
}

async function initializeDashboard() {
    await loadUserStats();
    await loadInProgressCourses();
}
