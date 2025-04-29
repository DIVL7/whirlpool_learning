document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers
    initializeDatePickers();

    // Load initial charts with default date range (30 days)
    updateReportsByDateRange('30days');

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

    // Ensure default range if none provided
    range = range || '30days';

    switch (range) {
        case '7days': // Match HTML value
            startDate = new Date();
            startDate.setDate(today.getDate() - 7);
            endDate = today;
            break;
        case '30days': // Match HTML value
            startDate = new Date();
            startDate.setDate(today.getDate() - 30);
            endDate = today;
            break;
        case '90days': // Match HTML value
            startDate = new Date();
            startDate.setDate(today.getDate() - 90);
            endDate = today;
            break;
        case 'year': // Match HTML value
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

    // Update charts with new date range, passing the range string for fallback generation
    loadAbandonmentRateChart(apiStartDate, apiEndDate, range);
    loadQuizErrorRateChart(apiStartDate, apiEndDate, range);
    loadQuizSuccessRateChart(apiStartDate, apiEndDate, range);
    loadForumQuestionsChart(apiStartDate, apiEndDate, range); // Updated function call
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

    // Update charts with custom date range, passing 'custom' range string
    loadAbandonmentRateChart(startDate, endDate, 'custom');
    loadQuizErrorRateChart(startDate, endDate, 'custom');
    loadQuizSuccessRateChart(startDate, endDate, 'custom');
    loadForumQuestionsChart(startDate, endDate, 'custom'); // Updated function call
}


// --- Removed old report loading and rendering functions ---
// loadUserProgressReport, renderUserProgressReport
// loadCourseCompletionReport, renderCourseCompletionReport
// loadPopularContentReport, renderPopularContentReport


// --- Chart Loading Functions ---

// Generate fallback data based on range
function getFallbackData(chartType, range = '30days') {
    // Simple pseudo-random variation based on range
    let factor = 1;
    if (range === '7days') factor = 1.2;
    else if (range === '90days') factor = 0.8;
    else if (range === 'year') factor = 0.7;
    else if (range === 'custom') factor = 1.1; // Custom range might have specific patterns

    switch (chartType) {
        case 'abandonment':
            return { rate: (25 + Math.random() * 10 * factor).toFixed(1) };
        case 'error':
            return { rate: (15 + Math.random() * 10 * factor).toFixed(1) };
        case 'success':
             // Success rate should complement error rate somewhat
            const errorFallback = parseFloat(getFallbackData('error', range).rate);
            return { rate: (100 - errorFallback - (Math.random() * 5)).toFixed(1) }; // Approx 100 - error
        case 'forumQuestions': // Updated chart type
            const categories = ['General', 'Instalación', 'Diagnóstico', 'Errores Comunes', 'Software'];
            return categories.map(name => ({
                category_name: name,
                question_count: Math.floor(5 + Math.random() * 20 * factor) // Example counts
            }));
        default:
            return null; // Return null for unknown types
    }
}


// Load Abandonment Rate Chart
async function loadAbandonmentRateChart(startDate, endDate, range) {
    const canvas = document.getElementById('abandonmentRateChart');
    if (!canvas) {
        console.error("Element with ID 'abandonmentRateChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let data;
    try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(`/api/reports/abandonment-rate${queryParams}`);
        if (!response.ok) {
            // Try to parse error, but still throw to trigger fallback
            try {
                 const errorData = await response.json();
                 console.error('API Error:', errorData.error || `Status ${response.status}`);
            } catch (parseError) {
                 console.error('API Error: Status', response.status);
            }
            throw new Error('API request failed'); // Trigger fallback
        }
        data = await response.json();

        // Check if data is valid
        if (data && typeof data.rate !== 'undefined' && data.rate !== null) {
            renderAbandonmentBarChart(ctx, 'Tasa de Abandono', parseFloat(data.rate));
        } else {
            console.warn('Invalid or empty data received for abandonment rate. Using fallback.');
            throw new Error('Invalid data'); // Trigger fallback
        }

    } catch (error) {
        console.error('Using fallback data for abandonment rate chart:', error.message);
        const fallbackData = getFallbackData('abandonment', range);
        if (fallbackData) {
            renderAbandonmentBarChart(ctx, 'Tasa de Abandono (Ejemplo)', parseFloat(fallbackData.rate));
        } else {
            renderChartError(ctx, 'Error al cargar Tasa de Abandono');
        }
    }
}

// Load Quiz Error Rate Chart
async function loadQuizErrorRateChart(startDate, endDate, range) {
    const canvas = document.getElementById('quizErrorRateChart');
    if (!canvas) {
        console.error("Element with ID 'quizErrorRateChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let data;
    try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(`/api/reports/quiz-error-rate${queryParams}`);
         if (!response.ok) {
            try { const errorData = await response.json(); console.error('API Error:', errorData.error || `Status ${response.status}`); } catch (e) { console.error('API Error: Status', response.status); }
            throw new Error('API request failed');
        }
        data = await response.json();

        if (data && typeof data.rate !== 'undefined' && data.rate !== null) {
            renderRateChart(ctx, 'Tasa de Error', parseFloat(data.rate), ['Incorrectas', 'Correctas'], ['#DC3545', '#6C757D']); // Red for error
        } else {
             console.warn('Invalid or empty data received for error rate. Using fallback.');
             throw new Error('Invalid data');
        }

    } catch (error) {
        console.error('Using fallback data for quiz error rate chart:', error.message);
        const fallbackData = getFallbackData('error', range);
        if (fallbackData) {
             renderRateChart(ctx, 'Tasa de Error (Ejemplo)', parseFloat(fallbackData.rate), ['Incorrectas', 'Correctas'], ['#DC3545', '#6C757D']);
        } else {
            renderChartError(ctx, 'Error al cargar Tasa de Error');
        }
    }
}

// Load Quiz Success Rate Chart
async function loadQuizSuccessRateChart(startDate, endDate, range) {
    const canvas = document.getElementById('quizSuccessRateChart');
    if (!canvas) {
        console.error("Element with ID 'quizSuccessRateChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let data;
    try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(`/api/reports/quiz-success-rate${queryParams}`);
         if (!response.ok) {
            try { const errorData = await response.json(); console.error('API Error:', errorData.error || `Status ${response.status}`); } catch (e) { console.error('API Error: Status', response.status); }
            throw new Error('API request failed');
        }
        data = await response.json();

        if (data && typeof data.rate !== 'undefined' && data.rate !== null) {
            renderRateChart(ctx, 'Tasa de Éxito', parseFloat(data.rate), ['Correctas', 'Incorrectas'], ['#28A745', '#6C757D']); // Green for success
        } else {
             console.warn('Invalid or empty data received for success rate. Using fallback.');
             throw new Error('Invalid data');
        }

    } catch (error) {
        console.error('Using fallback data for quiz success rate chart:', error.message);
         const fallbackData = getFallbackData('success', range);
         if (fallbackData) {
            renderRateChart(ctx, 'Tasa de Éxito (Ejemplo)', parseFloat(fallbackData.rate), ['Correctas', 'Incorrectas'], ['#28A745', '#6C757D']);
         } else {
            renderChartError(ctx, 'Error al cargar Tasa de Éxito');
         }
    }
}

// Load Forum Questions Per Category Chart
async function loadForumQuestionsChart(startDate, endDate, range) { // Renamed function
    const canvas = document.getElementById('forumQuestionsChart'); // Updated canvas ID
    if (!canvas) {
        console.error("Element with ID 'forumQuestionsChart' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let data;
    try {
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        const response = await fetch(`/api/reports/forum-questions-per-category${queryParams}`); // Updated endpoint
         if (!response.ok) {
            try { const errorData = await response.json(); console.error('API Error:', errorData.error || `Status ${response.status}`); } catch (e) { console.error('API Error: Status', response.status); }
            throw new Error('API request failed');
        }
        data = await response.json();

        // Check if data is a non-empty array
        if (data && Array.isArray(data) && data.length > 0) {
            renderForumQuestionsChart(ctx, 'Preguntas por Categoría', data); // Updated render call
        } else {
             console.warn('Invalid or empty data received for forum questions. Using fallback.');
             throw new Error('Invalid data');
        }

    } catch (error) {
        console.error('Using fallback data for forum questions chart:', error.message);
        const fallbackData = getFallbackData('forumQuestions', range); // Updated fallback type
        if (fallbackData) {
            renderForumQuestionsChart(ctx, 'Preguntas por Categoría (Ejemplo)', fallbackData); // Updated render call
        } else {
            renderChartError(ctx, 'Error al cargar Preguntas del Foro'); // Updated error message
        }
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


// Renders a bar chart for Forum Questions Per Category
function renderForumQuestionsChart(ctx, title, data) { // Renamed function
    const canvasId = ctx.canvas.id;

    // Destroy existing chart instance if it exists
    if (existingCharts[canvasId]) {
        existingCharts[canvasId].destroy();
    }

    // Prepare data for the chart
    const labels = data.map(item => item.category_name || 'Sin Categoría'); // Extract category names
    const questionData = data.map(item => item.question_count || 0); // Extract question counts

    existingCharts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Número de Preguntas', // Updated label
                data: questionData,
                backgroundColor: '#6F42C1', // Example color (purple)
                borderColor: '#5A32A3',
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
                        text: 'Número de Preguntas' // Updated axis title
                    },
                    ticks: {
                        // Ensure only integers are shown on the y-axis
                        stepSize: 1,
                        precision: 0
                    }
                },
                x: {
                   title: {
                       display: true,
                       text: 'Categoría del Foro' // Updated axis title
                   },
                   // Optional: Rotate labels if many categories
                   ticks: {
                       autoSkip: false,
                       maxRotation: 45, // Adjust rotation as needed
                       minRotation: 30
                   }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend if title/axis are clear
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // Show category name and count in tooltip
                            return ` ${context.label}: ${context.parsed.y} preguntas`;
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
