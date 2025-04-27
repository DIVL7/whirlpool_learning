document.addEventListener('DOMContentLoaded', () => {
    // Simulación de funcionalidad de búsqueda de calificaciones
    const searchInput = document.querySelector('.search-container input');
    const gradeRows = document.querySelectorAll('.data-table tbody tr');

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        gradeRows.forEach(row => {
            const courseName = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const moduleName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const grade = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            const date = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
            if (courseName.includes(searchTerm) || moduleName.includes(searchTerm) || grade.includes(searchTerm) || date.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Simulación de interacción con el resumen de progreso (solo alerta en este caso)
    const progressCard = document.querySelector('.card:contains("Progreso General")');
    progressCard.addEventListener('click', () => {
        alert('Simulando la visualización del progreso general...');
    });
});