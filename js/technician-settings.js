document.addEventListener('DOMContentLoaded', () => {
    // Simulación de guardado de información personal
    const personalInfoForm = document.querySelector('.settings-card:nth-child(1) form');
    personalInfoForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        alert(`Simulando el guardado de información personal: Nombre - ${nombre}, Email - ${email}`);
    });

    // Simulación de cambio de contraseña
    const securityForm = document.querySelector('.settings-card:nth-child(2) form');
    securityForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const passwordActual = document.getElementById('password-actual').value;
        const passwordNuevo = document.getElementById('password-nuevo').value;
        const passwordConfirmar = document.getElementById('password-confirmar').value;
        if (passwordNuevo !== passwordConfirmar) {
            alert('Las nuevas contraseñas no coinciden.');
            return;
        }
        alert('Simulando el cambio de contraseña...');
        this.reset();
    });

    // Simulación de guardado de preferencias
    const preferencesForm = document.querySelector('.settings-card:nth-child(3) form');
    preferencesForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const idioma = document.getElementById('idioma').value;
        alert(`Simulando el guardado de preferencias: Idioma - ${idioma}`);
    });
});