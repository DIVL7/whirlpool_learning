document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initCompletionTrendChart();
    initEngagementChart();
    initRegionPerformanceChart();
    
    // Event listeners for chart filters
    document.getElementById('completionTrendFilter').addEventListener('change', function() {
        updateCompletionTrendChart(this.value);
    });
    
    document.getElementById('engagementFilter').addEventListener('change', function() {
        updateEngagementChart(this.value);
    });
    
    document.getElementById('regionMetricFilter').addEventListener('change', function() {
        updateRegionPerformanceChart(this.value);
    });
    
    // Date range selector
    document.getElementById('dateRangeSelect').addEventListener('change', function() {
        if (this.value === 'custom') {
            document.getElementById('customDateRange').style.display = 'flex';
        } else {
            document.getElementById('customDateRange').style.display = 'none';
            updateAllCharts(this.value);
        }
    });
    
    document.getElementById('applyDateRange').addEventListener('click', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
            updateAllCharts('custom', { startDate, endDate });
        } else {
            alert('Por favor selecciona fechas de inicio y fin.');
        }
    });
    
    // Export and Generate report buttons
    document.getElementById('exportReportBtn').addEventListener('click', function() {
        exportReportData();
    });
    
    document.getElementById('generateReportBtn').addEventListener('click', function() {
        regenerateReports();
    });
    
    // Set default dates for custom range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = thirtyDaysAgo;
});

// Course Completion Trend Chart
function initCompletionTrendChart() {
    const ctx = document.getElementById('completionTrendChart').getContext('2d');
    
    // Sample data - in a real application, this would come from your database
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const completionData = [65, 68, 70, 72, 75, 78, 80, 82, 83, 85, 87, 90];
    
    window.completionTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasa de Finalización (%)',
                data: completionData,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true
            }]
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
                    beginAtZero: false,
                    min: 60,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// User Engagement Chart
function initEngagementChart() {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    
    // Sample data
    const categories = ['Refrigerador', 'Lavadora', 'Secadora', 'Microondas', 'Lavavajillas', 'Estufa'];
    const timeData = [45, 38, 32, 28, 25, 20]; // Average time in minutes
    
    window.engagementChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Tiempo Promedio (minutos)',
                data: timeData,
                backgroundColor: [
                    'rgba(0, 123, 255, 0.7)',
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(255, 193, 7, 0.7)',
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(111, 66, 193, 0.7)',
                    'rgba(23, 162, 184, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 123, 255, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(111, 66, 193, 1)',
                    'rgba(23, 162, 184, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Region Performance Chart
function initRegionPerformanceChart() {
    const ctx = document.getElementById('regionPerformanceChart').getContext('2d');
    
    // Sample data
    const regions = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
    const certificationData = [42, 38, 35, 29, 45];
    
    window.regionPerformanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regions,
            datasets: [{
                label: 'Certificaciones Obtenidas',
                data: certificationData,
                backgroundColor: 'rgba(255, 193, 7, 0.7)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update functions for each chart
function updateCompletionTrendChart(courseType) {
    // In a real application, this would fetch data from the server
    // For demo purposes, we'll just update with different data based on selection
    
    let completionData;
    
    if (courseType === 'all') {
        completionData = [65, 68, 70, 72, 75, 78, 80, 82, 83, 85, 87, 90];
    } else if (courseType === 'refrigerator') {
        completionData = [70, 72, 75, 78, 80, 82, 85, 87, 88, 90, 92, 95];
    } else if (courseType === 'washing') {
        completionData = [60, 63, 65, 68, 70, 73, 75, 78, 80, 82, 85, 87];
    } else if (courseType === 'dryer') {
        completionData = [55, 58, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85];
    }
    
    window.completionTrendChart.data.datasets[0].data = completionData;
    window.completionTrendChart.update();
}

function updateEngagementChart(metricType) {
    // In a real application, this would fetch data from the server
    // For demo purposes, we'll just update with different data based on selection
    
    const categories = ['Refrigerador', 'Lavadora', 'Secadora', 'Microondas', 'Lavavajillas', 'Estufa'];
    let data, label;
    
    if (metricType === 'views') {
        data = [1250, 980, 820, 650, 580, 420];
        label = 'Número de Vistas';
    } else if (metricType === 'time') {
        data = [45, 38, 32, 28, 25, 20];
        label = 'Tiempo Promedio (minutos)';
    } else if (metricType === 'interactions') {
        data = [320, 280, 240, 190, 170, 130];
        label = 'Interacciones';
    }
    
    window.engagementChart.data.datasets[0].label = label;
    window.engagementChart.data.datasets[0].data = data;
    window.engagementChart.update();
}

function updateRegionPerformanceChart(metricType) {
    // In a real application, this would fetch data from the server
    // For demo purposes, we'll just update with different data based on selection
    
    const regions = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
    let data, label;
    
    if (metricType === 'completion') {
        data = [82, 78, 75, 70, 85];
        label = 'Tasa de Finalización (%)';
    } else if (metricType === 'certification') {
        data = [42, 38, 35, 29, 45];
        label = 'Certificaciones Obtenidas';
    } else if (metricType === 'engagement') {
        data = [120, 105, 95, 85, 130];
        label = 'Horas de Participación';
    }
    
    window.regionPerformanceChart.data.datasets[0].label = label;
    window.regionPerformanceChart.data.datasets[0].data = data;
    window.regionPerformanceChart.update();
}

// Update all charts based on date range
function updateAllCharts(dateRange, customDates) {
    // In a real application, this would fetch data from the server for the specified date range
    console.log('Updating charts for date range:', dateRange);
    if (customDates) {
        console.log('Custom date range:', customDates.startDate, 'to', customDates.endDate);
    }
    
    // For demo purposes, we'll just show an alert
    if (dateRange === 'custom') {
        alert(`Actualizando datos para el rango personalizado: ${customDates.startDate} a ${customDates.endDate}`);
    } else {
        alert(`Actualizando datos para el rango: ${dateRange}`);
    }
    
    // Simulate data refresh by slightly modifying existing data
    const randomFactor = 0.9 + Math.random() * 0.2; // Random factor between 0.9 and 1.1
    
    // Update completion trend chart
    const newCompletionData = window.completionTrendChart.data.datasets[0].data.map(
        value => Math.round(value * randomFactor)
    );
    window.completionTrendChart.data.datasets[0].data = newCompletionData;
    window.completionTrendChart.update();
    
    // Update engagement chart
    const newEngagementData = window.engagementChart.data.datasets[0].data.map(
        value => Math.round(value * randomFactor)
    );
    window.engagementChart.data.datasets[0].data = newEngagementData;
    window.engagementChart.update();
    
    // Update region performance chart
    const newRegionData = window.regionPerformanceChart.data.datasets[0].data.map(
        value => Math.round(value * randomFactor)
    );
    window.regionPerformanceChart.data.datasets[0].data = newRegionData;
    window.regionPerformanceChart.update();
}

// Export report data
function exportReportData() {
    // In a real application, this would generate a CSV or PDF file with the report data
    alert('Exportando datos del reporte...');
    
    // Simulate download delay
    setTimeout(function() {
        alert('Reporte exportado correctamente.');
    }, 1500);
}

// Regenerate reports with fresh data
function regenerateReports() {
    // In a real application, this would fetch fresh data from the server
    alert('Actualizando datos del reporte...');
    
    // Show loading state
    const btn = document.getElementById('generateReportBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
    btn.disabled = true;
    
    // Simulate loading delay
    setTimeout(function() {
        // Update all charts with slightly modified data
        updateAllCharts(document.getElementById('dateRangeSelect').value);
        
        // Restore button state
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        alert('Datos actualizados correctamente.');
    }, 2000);
}