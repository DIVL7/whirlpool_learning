document.addEventListener('DOMContentLoaded', async () => { // Make async for await
    // Initialize common technician page elements (like user info, sidebar, logout)
    // This function already fetches user data and updates the header (#user-name, #user-avatar)
    initTechnicianPage();

    // Simulación de guardado de preferencias
    // Now the first card is preferences
    const preferencesForm = document.querySelector('.settings-card:nth-child(1) form'); 
    if (preferencesForm) { // Add check if form exists
        preferencesForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const idioma = document.getElementById('idioma').value;
            alert(`Simulando el guardado de preferencias: Idioma - ${idioma}`);
        });
    } else {
        console.warn('Preferences form not found.'); // Warn if form is missing
    }
});
