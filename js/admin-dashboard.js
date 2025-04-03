document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initUserActivityChart();
    initCourseProgressChart();
    
    // Event listeners for chart filters
    document.getElementById('userActivityTimeRange').addEventListener('change', function() {
        updateUserActivityChart(this.value);
    });
    
    document.getElementById('courseProgressFilter').addEventListener('change', function() {
        updateCourseProgressChart(this.value);
    });
});

// User Activity Chart
function initUserActivityChart() {
    const ctx = document.getElementById('userActivityChart').getContext('2d');
    
    // Sample data
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const logins = [25, 30, 45, 35, 40, 20, 15];
    const courseViews = [50, 60, 75, 65, 70, 40, 30];
    const quizCompletions = [10, 15, 20, 18, 22, 8, 5];
    
    window.userActivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Inicios de Sesión',
                    data: logins,
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Vistas de Cursos',
                    data: courseViews,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Cuestionarios Completados',
                    data: quizCompletions,
                    borderColor: '#ff6b00',
                    backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Update User Activity Chart based on selected time range
function updateUserActivityChart(timeRange) {
    // In a real application, this would fetch data from the server
    // For demo purposes, we'll just update with random data
    
    let labels, logins, courseViews, quizCompletions;
    
    if (timeRange === 'week') {
        labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        logins = [25, 30, 45, 35, 40, 20, 15];
        courseViews = [50, 60, 75, 65, 70, 40, 30];
        quizCompletions = [10, 15, 20, 18, 22, 8, 5];
    } else if (timeRange === 'month') {
        labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        logins = [150, 180, 200, 170];
        courseViews = [300, 350, 380, 320];
        quizCompletions = [80, 95, 110, 90];
    } else if (timeRange === 'quarter') {
        labels = ['Enero', 'Febrero', 'Marzo'];
        logins = [600, 650, 700];
        courseViews = [1200, 1300, 1400];
        quizCompletions = [350, 380, 400];
    }
    
    window.userActivityChart.data.labels = labels;
    window.userActivityChart.data.datasets[0].data = logins;
    window.userActivityChart.data.datasets[1].data = courseViews;
    window.userActivityChart.data.datasets[2].data = quizCompletions;
    window.userActivityChart.update();
}

// Course Progress Chart
function initCourseProgressChart() {
    const ctx = document.getElementById('courseProgressChart').getContext('2d');
    
    // Sample data
    const data = {
        labels: ['No Iniciado', 'En Progreso', 'Completado'],
        datasets: [{
            data: [15, 40, 45],
            backgroundColor: [
                '#6c757d',
                '#ffc107',
                '#28a745'
            ],
            borderWidth: 0
        }]
    };
    
    window.courseProgressChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });
}

// Update Course Progress Chart based on selected filter
function updateCourseProgressChart(courseType) {
    // In a real application, this would fetch data from the server
    // For demo purposes, we'll just update with different data based on selection
    
    let data;
    
    if (courseType === 'all') {
        data = [15, 40, 45];
    } else if (courseType === 'refrigerator') {
        data = [10, 30, 60];
    } else if (courseType === 'washing') {
        data = [20, 50, 30];
    } else if (courseType === 'dryer') {
        data = [25, 45, 30];
    }
    
    window.courseProgressChart.data.datasets[0].data = data;
    window.courseProgressChart.update();
}