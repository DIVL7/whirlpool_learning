// js/technician-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    initTechnicianPage();
    initializeDashboard();
});

// Carga estadísticas reales del técnico
async function loadUserStats() {
    try {
        const resp = await fetch('/api/technician/stats', {
            credentials: 'same-origin'
        });
        const data = await resp.json();
        if (data.success) {
            document.getElementById('courses-count').textContent = data.coursesAssigned;
            document.getElementById('completed-count').textContent = data.coursesCompleted;
            document.getElementById('certification-count').textContent = data.certifications;

            // Tendencias
            document.getElementById('courses-trend').textContent = data.coursesTrend;
            document.getElementById('completed-trend').textContent = data.completedTrend;
            document.getElementById('certification-trend').textContent = data.certificationTrend;

            updateTrendClasses('courses-trend', data.coursesTrend);
            updateTrendClasses('completed-trend', data.completedTrend);
            updateTrendClasses('certification-trend', data.certificationTrend);
        }
    } catch (err) {
        console.error('Error al cargar estadísticas:', err);
    }
}

// Aplica iconos y clases según tendencia
function updateTrendClasses(elementId, trendValue) {
    const el = document.getElementById(elementId).parentElement;
    const icon = el.querySelector('i');
    const num = parseInt(trendValue) || 0;
    if (num >= 0) {
        el.classList.add('up'); el.classList.remove('down');
        icon.classList.add('fa-arrow-up'); icon.classList.remove('fa-arrow-down');
    } else {
        el.classList.add('down'); el.classList.remove('up');
        icon.classList.add('fa-arrow-down'); icon.classList.remove('fa-arrow-up');
    }
}

// Carga los últimos cursos en progreso y los muestra en la lista
async function loadInProgressCourses() {
    try {
        const resp = await fetch('/api/technician/courses', {
            credentials: 'same-origin'
        });
        const data = await resp.json();
        if (!data.success) return;

        const inProg = data.courses.filter(c => c.status === 'in_progress');
        const ul = document.getElementById('in-progress-list');
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
                    <div class="small-progress-fill" style="width: ${c.progress}%"></div>
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