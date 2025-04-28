document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers
    initializeDatePickers();

    // Load initial charts
    loadAbandonmentRateChart();
    loadQuizErrorRateChart();
    loadQuizSuccessRateChart();
    loadTechnicianActivityChart(); // Load the new chart

    // Set up event listeners for date filters
    const dateRangeSelect = document.getElementById('dateRangeSelect');
    const applyDateRangeBtn = document.getElementById('applyDateRange');
    const customDateContainerHTML = document.getElementById('customDateRange'); // Get the container div from HTML

    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                if (customDateContainerHTML) customDateContainerHTML.style.display = 'flex';
            } else {
                if (customDateContainerHTML) customDateContainerHTML.style.display = 'none';
                updateReportsByDateRange(this.value);
            }
        });
    }

    if (applyDateRangeBtn) {
        applyDateRangeBtn.addEventListener('click', function() {
            applyCustomDateFilter();
        });
    }

    // Set up event listener for update button
    const updateBtn = document.getElementById('generateReportBtn');

    if (updateBtn) {
        updateBtn.addEventListener('click', function() {
            // Re-apply current date filter to refresh chart data
            const selectedRange = dateRangeSelect ? dateRangeSelect.value : '30days'; // Default if select not found
            if (selectedRange === 'custom') {
                applyCustomDateFilter();
            } else {
                updateReportsByDateRange(selectedRange);
            }
            // Optionally show a notification
            if (typeof showNotification === 'function') {
                showNotification('Datos actualizados.', 'success');
            }
        });
    }

    // Remove event listeners for report tabs if they are no longer used
    // const reportTabs = document.querySelectorAll('.report-tab');
    // reportTabs.forEach(tab => { ... });
});

// Initialize date pickers
function initializeDatePickers() {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Format dates for input fields
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput) {
        startDateInput.value = formatDate(thirtyDaysAgo);
    } else {
        console.error("Element with ID 'startDate' not found.");
    }
    if (endDateInput) {
        endDateInput.value = formatDate(today);
    } else {
        console.error("Element with ID 'endDate' not found.");
    }
}


// --- Removed loadSummaryStats function ---


// Update charts based on selected date range
function updateReportsByDateRange(range) {
    let startDate, endDate;
    const today = new Date();
    
    switch (range) {
        case 'last7days':
            startDate = new Date();
            startDate.setDate(today.getDate() - 7);
            endDate = today;
            break;
        case 'last30days':
            startDate = new Date();
            startDate.setDate(today.getDate() - 30);
            endDate = today;
            break;
        case 'last90days':
            startDate = new Date();
            startDate.setDate(today.getDate() - 90);
            endDate = today;
            break;
        case 'thisyear':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = today;
            break;
        case 'custom':
            // Don't update reports here, wait for apply button click
            return;
        default:
            startDate = new Date();
            startDate.setDate(today.getDate() - 30);
            endDate = today;
    }
    
    // Format dates for API
    const formatDateForAPI = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    const apiStartDate = formatDateForAPI(startDate);
    const apiEndDate = formatDateForAPI(endDate);

    // Update charts with new date range
    loadAbandonmentRateChart(apiStartDate, apiEndDate);
    loadQuizErrorRateChart(apiStartDate, apiEndDate);
    loadQuizSuccessRateChart(apiStartDate, apiEndDate);
    loadTechnicianActivityChart(apiStartDate, apiEndDate); // Update new chart
}

// Apply custom date filter
function applyCustomDateFilter() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const startDate = startDateInput ? startDateInput.value : null;
    const endDate = endDateInput ? endDateInput.value : null;

    if (!startDate || !endDate) {
        alert('Por favor, selecciona fechas de inicio y fin válidas.');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert('La fecha de inicio debe ser anterior a la fecha de fin.');
        return;
    }

    // Update charts with custom date range
    loadAbandonmentRateChart(startDate, endDate);
    loadQuizErrorRateChart(startDate, endDate);
    loadQuizSuccessRateChart(startDate, endDate);
    loadTechnicianActivityChart(startDate, endDate); // Update new chart
}


// --- Removed old report loading and rendering functions ---
// loadUserProgressReport, renderUserProgressReport
// loadCourseCompletionReport, renderCourseCompletionReport
// loadPopularContentReport, renderPopularContentReport


// --- New Chart Loading Functions (Placeholders) ---

// Load Abandonment Rate Chart
async function loadAbandonmentRateChart(startDate, endDate) {
    const canvas = document.getElementById('abandonmentRateChart');
    if (!canvas) {
        console.error("Element with ID 'abandonmentRateChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(`/api/reports/abandonment-rate${queryParams}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cargar datos de tasa de abandono');
        }
        const data = await response.json();
        // Call the new rendering function for the bar chart
        renderAbandonmentBarChart(ctx, 'Tasa de Abandono', parseFloat(data.rate));

    } catch (error) {
        console.error('Error loading abandonment rate chart:', error);
        renderChartError(ctx, 'Error al cargar Tasa de Abandono');
    }
}

// Load Quiz Error Rate Chart
async function loadQuizErrorRateChart(startDate, endDate) {
    const canvas = document.getElementById('quizErrorRateChart');
    if (!canvas) {
        console.error("Element with ID 'quizErrorRateChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
     try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(`/api/reports/quiz-error-rate${queryParams}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cargar datos de tasa de error');
        }
        const data = await response.json();
        renderRateChart(ctx, 'Tasa de Error', parseFloat(data.rate), ['Incorrectas', 'Correctas'], ['#DC3545', '#6C757D']); // Red for error

    } catch (error) {
        console.error('Error loading quiz error rate chart:', error);
        renderChartError(ctx, 'Error al cargar Tasa de Error');
    }
}

// Load Quiz Success Rate Chart
async function loadQuizSuccessRateChart(startDate, endDate) {
    const canvas = document.getElementById('quizSuccessRateChart');
    if (!canvas) {
        console.error("Element with ID 'quizSuccessRateChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(`/api/reports/quiz-success-rate${queryParams}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cargar datos de tasa de éxito');
        }
        const data = await response.json();
        renderRateChart(ctx, 'Tasa de Éxito', parseFloat(data.rate), ['Correctas', 'Incorrectas'], ['#28A745', '#6C757D']); // Green for success

    } catch (error) {
        console.error('Error loading quiz success rate chart:', error);
        renderChartError(ctx, 'Error al cargar Tasa de Éxito');
    }
}


// Load Technician Activity Chart
async function loadTechnicianActivityChart(startDate, endDate) {
    const canvas = document.getElementById('technicianActivityChart');
    if (!canvas) {
        console.error("Element with ID 'technicianActivityChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        // TODO: Update API endpoint if different
        const response = await fetch(`/api/reports/technician-activity${queryParams}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al cargar datos de actividad de técnicos');
        }
        const data = await response.json(); // Assuming data is like [{ technician: 'Name', activity: value }, ...]
        renderTechnicianActivityChart(ctx, 'Actividad de Técnicos', data);

    } catch (error) {
        console.error('Error loading technician activity chart:', error);
        renderChartError(ctx, 'Error al cargar Actividad de Técnicos');
    }
}


// --- Chart Rendering Functions ---

let existingCharts = {}; // Keep track of existing chart instances

// Renders a doughnut chart for a given rate (percentage) - Used for Error/Success
function renderRateChart(ctx, title, rate, labels = ['Rate', 'Remaining'], colors = ['#007BFF', '#E9ECEF']) {
    const canvasId = ctx.canvas.id;
    // Ensure rate is within 0-100
    rate = Math.max(0, Math.min(100, rate));
    const remaining = 100 - rate;

    // Destroy existing chart instance if it exists
    if (existingCharts[canvasId]) {
        existingCharts[canvasId].destroy();
    }

    // Create a new doughnut chart
    existingCharts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: [rate, remaining],
                backgroundColor: colors,
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // Adjust doughnut thickness
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed.toFixed(1) + '%';
                            }
                            return label;
                        }
                    }
                },
                 // Display the percentage in the center
                 datalabels: { // Requires chartjs-plugin-datalabels
                    formatter: (value, ctx) => {
                        if (ctx.dataIndex === 0) { // Show only the main rate
                            return value.toFixed(1) + '%';
                        } else {
                            return '';
                        }
                    },
                    color: '#333',
                    font: {
                        weight: 'bold',
                        size: 16,
                    }
                 },
                 title: { // Keep title if needed, though chart card has one
                     display: false, // Set to true if you want title inside chart area
                     text: title
                 }
            }
        },
        // If using chartjs-plugin-datalabels, register it globally or per chart
        // plugins: [ChartDataLabels] // Example if using the plugin
    });
}

// Renders a horizontal bar chart for the Abandonment Rate
function renderAbandonmentBarChart(ctx, title, rate) {
    const canvasId = ctx.canvas.id;
     // Ensure rate is within 0-100
    rate = Math.max(0, Math.min(100, rate));

    // Destroy existing chart instance if it exists
    if (existingCharts[canvasId]) {
        existingCharts[canvasId].destroy();
    }

    existingCharts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Tasa de Abandono'], // Single category
            datasets: [{
                label: 'Abandonaron (%)',
                data: [rate],
                backgroundColor: '#007BFF', // Blue color for abandonment
                borderColor: '#0056b3',
                borderWidth: 1,
                barPercentage: 0.6, // Adjust bar thickness
                categoryPercentage: 0.8 // Adjust spacing if multiple categories were present
            }]
        },
        options: {
            indexAxis: 'y', // Make it horizontal
            responsive: true,
            maintainAspectRatio: false, // Allow chart to fill container height
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100, // Scale up to 100%
                    title: {
                        display: true,
                        text: 'Porcentaje (%)'
                    }
                },
                y: {
                   display: false // Hide the category axis label if only one bar
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend as label is clear
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label}: ${context.parsed.x.toFixed(1)}%`;
                        }
                    }
                },
                title: {
                    display: false, // Title is in the card header
                    text: title
                }
            }
        }
    });
}


// Renders a bar chart for Technician Activity
function renderTechnicianActivityChart(ctx, title, data) {
    const canvasId = ctx.canvas.id;

    // Destroy existing chart instance if it exists
    if (existingCharts[canvasId]) {
        existingCharts[canvasId].destroy();
    }

    // Prepare data for the chart
    const labels = data.map(item => item.technician_name || 'Desconocido'); // Extract technician names
    const activityData = data.map(item => item.activity_count || 0); // Extract activity metric (e.g., courses completed, logins)

    existingCharts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Actividad Registrada', // Adjust label as needed
                data: activityData,
                backgroundColor: '#17A2B8', // Example color (info blue)
                borderColor: '#117A8B',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nivel de Actividad' // Adjust axis title
                    }
                },
                x: {
                   title: {
                       display: true,
                       text: 'Técnico'
                   }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend if label is sufficient
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                },
                title: {
                    display: false, // Title is in the card header
                    text: title
                }
            }
        }
    });
}


// Renders an error message on the canvas
function renderChartError(ctx, message) {
     const canvasId = ctx.canvas.id;
     // Destroy existing chart instance if it exists
    if (existingCharts[canvasId]) {
        existingCharts[canvasId].destroy();
        delete existingCharts[canvasId];
    }
    // Display error message
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#DC3545'; // Red color for error
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
}


// --- Removed Export/Print related functions for old reports ---
// exportReport, extractTableData, convertToCSV, printReport
// Also removed event listeners for old print/filter buttons in DOMContentLoaded


// Format date for display (Keep if needed elsewhere, otherwise remove)
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


// --- Removed filterUserProgressTable function ---
