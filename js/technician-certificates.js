document.addEventListener('DOMContentLoaded', () => {
    // Initialize common technician page elements (like user info)
    initTechnicianPage();

    const container   = document.querySelector('.certificates-container');
    const searchInput = document.querySelector('.search-container input');

    // Función que pinta las tarjetas
    function renderCertificates(certs) {
        container.innerHTML = '';
        if (!certs.length) {
            container.innerHTML = '<p>No has obtenido certificados aún.</p>';
            return;
        }
        certs.forEach(cert => {
            const card = document.createElement('div');
            card.className = 'certificate-card card-base';
            card.innerHTML = `
                <img src="../images/whirlpool-logo.png" alt="Logo" class="certificate-logo">
                <h3 class="certificate-course">${cert.title}</h3>
                <p class="certificate-date">Fecha de emisión: ${cert.date}</p>
                <button class="btn-primary" data-url="${cert.url}">
                    <i class="fas fa-file-pdf"></i> Descargar PDF
                </button>
            `;
            container.appendChild(card);
        });
    }

    // Fetch al endpoint 
    fetch('/api/technician/certificates')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderCertificates(data.certificates);
            } else {
                console.error('Error al cargar certificados:', data.error);
            }
        })
        .catch(err => console.error('Fetch error:', err));

    // Filtrado por búsqueda
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase();
        document.querySelectorAll('.certificate-card').forEach(card => {
            const title = card.querySelector('.certificate-course').textContent.toLowerCase();
            card.style.display = title.includes(term) ? '' : 'none';
        });
    });

    // 4) Descargar PDF al hacer click
    container.addEventListener('click', e => {
        const btn = e.target.closest('.btn-primary');
        if (btn) {
            window.open(btn.dataset.url, '_blank');
        }
    });
});
