document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers
    initializeDatePickers();
    
    // Load initial reports
    loadUserProgressReport();
    loadCourseCompletionReport();
    loadPopularContentReport();
    
    // Set up event listeners
    document.getElementById('date-range-filter').addEventListener('change', function() {
        updateReportsByDateRange(this.value);
    });
    
    document.getElementById('apply-custom-date').addEventListener('click', function() {
        applyCustomDateFilter();
    });
    
    document.getElementById('export-user-progress').addEventListener('click', function() {
        exportReport('user-progress');
    });
    
    document.getElementById('export-course-completion').addEventListener('click', function() {
        exportReport('course-completion');
    });
    
    document.getElementById('export-popular-content').addEventListener('click', function() {
        exportReport('popular-content');
    });
    
    // Add event listeners for report tabs
    const reportTabs = document.querySelectorAll('.report-tab');
    reportTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            reportTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all report sections
            document.querySelectorAll('.report-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected report section
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
        });
    });
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
    
    document.getElementById('start-date').value = formatDate(thirtyDaysAgo);
    document.getElementById('end-date').value = formatDate(today);
    
    // Show/hide custom date inputs based on selected range
    const dateRangeFilter = document.getElementById('date-range-filter');
    const customDateContainer = document.getElementById('custom-date-container');
    
    dateRangeFilter.addEventListener('change', function() {
        if (this.value === 'custom') {
            customDateContainer.style.display = 'flex';
        } else {
            customDateContainer.style.display = 'none';
        }
    });
}

// Update reports based on selected date range
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
    
    // Update reports with new date range
    loadUserProgressReport(formatDateForAPI(startDate), formatDateForAPI(endDate));
    loadCourseCompletionReport(formatDateForAPI(startDate), formatDateForAPI(endDate));
    loadPopularContentReport(formatDateForAPI(startDate), formatDateForAPI(endDate));
}

// Apply custom date filter
function applyCustomDateFilter() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!startDate || !endDate) {
        alert('Por favor, selecciona fechas de inicio y fin válidas.');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('La fecha de inicio debe ser anterior a la fecha de fin.');
        return;
    }
    
    // Update reports with custom date range
    loadUserProgressReport(startDate, endDate);
    loadCourseCompletionReport(startDate, endDate);
    loadPopularContentReport(startDate, endDate);
}

// Load user progress report
async function loadUserProgressReport(startDate, endDate) {
    try {
        // Show loading state
        document.getElementById('user-progress-report').innerHTML = '<div class="loading-spinner"></div>';
        
        // Build query parameters
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        
        const response = await fetch(`/api/reports/user-progress${queryParams}`);
        if (!response.ok) {
            throw new Error('Error al cargar el reporte de progreso de usuarios');
        }
        
        const data = await response.json();
        renderUserProgressReport(data);
        
    } catch (error) {
        console.error('Error loading user progress report:', error);
        document.getElementById('user-progress-report').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar el reporte</p>
                <p class="error-message">${error.message}</p>
            </div>
        `;
    }
}

// Render user progress report
function renderUserProgressReport(data) {
    const container = document.getElementById('user-progress-report');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <p>No hay datos disponibles para el período seleccionado</p>
            </div>
        `;
        return;
    }
    
    // Create table
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Curso</th>
                    <th>Progreso</th>
                    <th>Última Actividad</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows
    data.forEach(item => {
        // Calculate progress percentage
        const progressPercent = Math.round(item.progress * 100);
        
        // Determine status
        let status = 'En progreso';
        let statusClass = 'status-in-progress';
        
        if (progressPercent === 100) {
            status = 'Completado';
            statusClass = 'status-completed';
        } else if (progressPercent === 0) {
            status = 'No iniciado';
            statusClass = 'status-not-started';
        }
        
        html += `
            <tr>
                <td>${item.user_name}</td>
                <td>${item.course_title}</td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                        <span>${progressPercent}%</span>
                    </div>
                </td>
                <td>${formatDate(item.last_activity)}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Load course completion report
async function loadCourseCompletionReport(startDate, endDate) {
    try {
        // Show loading state
        document.getElementById('course-completion-report').innerHTML = '<div class="loading-spinner"></div>';
        
        // Build query parameters
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        
        const response = await fetch(`/api/reports/course-completion${queryParams}`);
        if (!response.ok) {
            throw new Error('Error al cargar el reporte de finalización de cursos');
        }
        
        const data = await response.json();
        renderCourseCompletionReport(data);
        
    } catch (error) {
        console.error('Error loading course completion report:', error);
        document.getElementById('course-completion-report').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar el reporte</p>
                <p class="error-message">${error.message}</p>
            </div>
        `;
    }
}

// Render course completion report
function renderCourseCompletionReport(data) {
    const container = document.getElementById('course-completion-report');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-graduation-cap"></i>
                <p>No hay datos disponibles para el período seleccionado</p>
            </div>
        `;
        return;
    }
    
    // Create chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = '<canvas id="courseCompletionChart"></canvas>';
    
    // Create table
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    let tableHtml = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Curso</th>
                    <th>Completados</th>
                    <th>En Progreso</th>
                    <th>No Iniciados</th>
                    <th>Tasa de Finalización</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Prepare data for chart
    const courseLabels = [];
    const completedData = [];
    const inProgressData = [];
    const notStartedData = [];
    
    // Add rows and collect chart data
    data.forEach(item => {
        const completionRate = Math.round((item.completed / (item.completed + item.in_progress + item.not_started)) * 100);
        
        tableHtml += `
            <tr>
                <td>${item.course_title}</td>
                <td>${item.completed}</td>
                <td>${item.in_progress}</td>
                <td>${item.not_started}</td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${completionRate}%"></div>
                        <span>${completionRate}%</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Collect data for chart
        courseLabels.push(item.course_title);
        completedData.push(item.completed);
        inProgressData.push(item.in_progress);
        notStartedData.push(item.not_started);
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHtml;
    
    // Add chart and table to container
    container.innerHTML = '';
    container.appendChild(chartContainer);
    container.appendChild(tableContainer);
    
    // Create chart
    const ctx = document.getElementById('courseCompletionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: courseLabels,
            datasets: [
                {
                    label: 'Completados',
                    data: completedData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'En Progreso',
                    data: inProgressData,
                    backgroundColor: 'rgba(255, 193, 7, 0.7)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 1
                },
                {
                    label: 'No Iniciados',
                    data: notStartedData,
                    backgroundColor: 'rgba(108, 117, 125, 0.7)',
                    borderColor: 'rgba(108, 117, 125, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

// Load popular content report
async function loadPopularContentReport(startDate, endDate) {
    try {
        // Show loading state
        document.getElementById('popular-content-report').innerHTML = '<div class="loading-spinner"></div>';
        
        // Build query parameters
        let queryParams = '';
        if (startDate && endDate) {
            queryParams = `?start_date=${startDate}&end_date=${endDate}`;
        }
        
        const response = await fetch(`/api/reports/popular-content${queryParams}`);
        if (!response.ok) {
            throw new Error('Error al cargar el reporte de contenido popular');
        }
        
        const data = await response.json();
        renderPopularContentReport(data);
        
    } catch (error) {
        console.error('Error loading popular content report:', error);
        document.getElementById('popular-content-report').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar el reporte</p>
                <p class="error-message">${error.message}</p>
            </div>
        `;
    }
}

// Render popular content report
function renderPopularContentReport(data) {
    const container = document.getElementById('popular-content-report');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>No hay datos disponibles para el período seleccionado</p>
            </div>
        `;
        return;
    }
    
    // Create chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = '<canvas id="popularContentChart"></canvas>';
    
    // Create table
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    let tableHtml = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Contenido</th>
                    <th>Curso</th>
                    <th>Módulo</th>
                    <th>Tipo</th>
                    <th>Vistas</th>
                    <th>Tiempo Promedio (min)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Prepare data for chart
    const contentLabels = [];
    const viewsData = [];
    const avgTimeData = [];
    
    // Add rows and collect chart data
    data.forEach(item => {
        // Format content type
        let contentType = 'Texto';
        switch (item.content_type_id) {
            case 1: contentType = 'Video'; break;
            case 2: contentType = 'Texto'; break;
            case 3: contentType = 'PDF'; break;
            case 4: contentType = 'Imagen'; break;
            case 5: contentType = 'Interactivo'; break;
        }
        
        tableHtml += `
            <tr>
                <td>${item.content_title}</td>
                <td>${item.course_title}</td>
                <td>${item.module_title}</td>
                <td>${contentType}</td>
                <td>${item.views}</td>
                <td>${Math.round(item.avg_time_spent / 60)}</td>
            </tr>
        `;
        
        // Collect data for chart (top 10 only for readability)
        if (contentLabels.length < 10) {
            contentLabels.push(item.content_title);
            viewsData.push(item.views);
            avgTimeData.push(Math.round(item.avg_time_spent / 60));
        }
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHtml;
    
    // Add chart and table to container
    container.innerHTML = '';
    container.appendChild(chartContainer);
    container.appendChild(tableContainer);
    
    // Create chart
    const ctx = document.getElementById('popularContentChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: contentLabels,
            datasets: [
                {
                    label: 'Vistas',
                    data: viewsData,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Tiempo Promedio (min)',
                    data: avgTimeData,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Vistas'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Tiempo (min)'
                    }
                }
            }
        }
    });
}

// Export report to CSV
function exportReport(reportType) {
    let data, filename;
    
    switch (reportType) {
        case 'user-progress':
            data = extractTableData('user-progress-report');
            filename = 'progreso_usuarios.csv';
            break;
        case 'course-completion':
            data = extractTableData('course-completion-report');
            filename = 'finalizacion_cursos.csv';
            break;
        case 'popular-content':
            data = extractTableData('popular-content-report');
            filename = 'contenido_popular.csv';
            break;
        default:
            alert('Tipo de reporte no válido');
            return;
    }
    
    if (!data) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Convert to CSV
    const csv = convertToCSV(data);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 0);
}

// Extract data from table
function extractTableData(containerId) {
    const table = document.querySelector(`#${containerId} table`);
    if (!table) return null;
    
    const headers = [];
    const rows = [];
    
    // Get headers
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach(cell => {
        headers.push(cell.textContent.trim());
    });
    
    // Get rows
    const rowElements = table.querySelectorAll('tbody tr');
    rowElements.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            // Get text content, ignoring any HTML
            const progressBar = cell.querySelector('.progress-bar-container');
            if (progressBar) {
                // For progress bars, get the percentage text
                rowData.push(cell.textContent.trim().replace(/\s+/g, ' '));
            } else {
                rowData.push(cell.textContent.trim());
            }
        });
        rows.push(rowData);
    });
    
    return { headers, rows };
}

// Convert data to CSV
function convertToCSV(data) {
    const { headers, rows } = data;
    let csv = headers.join(',') + '\n';
    
    rows.forEach(row => {
        // Escape commas and quotes in cell values
        const escapedRow = row.map(cell => {
            // If cell contains commas, quotes, or newlines, wrap in quotes
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                // Double up quotes to escape them
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        });
        
        csv += escapedRow.join(',') + '\n';
    });
    
    return csv;
}

// Format date for display
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

// Add function to print reports
function printReport(reportType) {
    // Get the report container
    const reportContainer = document.getElementById(`${reportType}-report`);
    if (!reportContainer) {
        alert('Reporte no encontrado');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the current date for the report header
    const currentDate = new Date().toLocaleDateString('es-MX');
    
    // Get report title based on type
    let reportTitle = '';
    switch (reportType) {
        case 'user-progress':
            reportTitle = 'Reporte de Progreso de Usuarios';
            break;
        case 'course-completion':
            reportTitle = 'Reporte de Finalización de Cursos';
            break;
        case 'popular-content':
            reportTitle = 'Reporte de Contenido Popular';
            break;
    }
    
    // Get date range information
    const dateRangeFilter = document.getElementById('date-range-filter');
    let dateRangeText = '';
    
    switch (dateRangeFilter.value) {
        case 'last7days':
            dateRangeText = 'Últimos 7 días';
            break;
        case 'last30days':
            dateRangeText = 'Últimos 30 días';
            break;
        case 'last90days':
            dateRangeText = 'Últimos 90 días';
            break;
        case 'thisyear':
            dateRangeText = 'Este año';
            break;
        case 'custom':
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            dateRangeText = `${startDate} a ${endDate}`;
            break;
    }
    
    // Create print content with styling
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportTitle}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ddd;
                }
                .report-title {
                    font-size: 24px;
                    margin-bottom: 5px;
                }
                .report-date {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }
                .report-range {
                    font-size: 14px;
                    color: #666;
                }
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                .report-table th, .report-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .report-table th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .report-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .progress-bar-container {
                    width: 100%;
                    background-color: #e9ecef;
                    border-radius: 4px;
                    height: 20px;
                    position: relative;
                }
                .progress-bar {
                    background-color: #007bff;
                    height: 100%;
                    border-radius: 4px;
                }
                .progress-bar-container span {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #000;
                    font-size: 12px;
                }
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .status-completed {
                    background-color: #d4edda;
                    color: #155724;
                }
                .status-in-progress {
                    background-color: #fff3cd;
                    color: #856404;
                }
                .status-not-started {
                    background-color: #f8f9fa;
                    color: #6c757d;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">${reportTitle}</div>
                <div class="report-date">Generado el: ${currentDate}</div>
                <div class="report-range">Período: ${dateRangeText}</div>
            </div>
            
            ${reportContainer.innerHTML}
            
            <div class="footer">
                <p>Plataforma de Aprendizaje Whirlpool &copy; ${new Date().getFullYear()}</p>
            </div>
            
            <div class="no-print">
                <button onclick="window.print();" style="margin: 20px auto; display: block; padding: 10px 20px;">Imprimir Reporte</button>
            </div>
            
            <script>
                // Auto print after load
                window.onload = function() {
                    // Remove chart canvases as they don't print well
                    const canvases = document.querySelectorAll('canvas');
                    canvases.forEach(canvas => {
                        canvas.parentNode.removeChild(canvas);
                    });
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Add event listeners for print buttons
document.addEventListener('DOMContentLoaded', function() {
    // Add print buttons to the existing code
    document.getElementById('print-user-progress').addEventListener('click', function() {
        printReport('user-progress');
    });
    
    document.getElementById('print-course-completion').addEventListener('click', function() {
        printReport('course-completion');
    });
    
    document.getElementById('print-popular-content').addEventListener('click', function() {
        printReport('popular-content');
    });
    
    // Add filter functionality for user progress report
    document.getElementById('filter-user-progress').addEventListener('input', function() {
        filterUserProgressTable(this.value);
    });
});

// Filter user progress table
function filterUserProgressTable(searchTerm) {
    const table = document.querySelector('#user-progress-report table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const userName = row.cells[0].textContent.toLowerCase();
        const courseTitle = row.cells[1].textContent.toLowerCase();
        
        if (userName.includes(searchTerm) || courseTitle.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}