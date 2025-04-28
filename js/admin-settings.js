document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkMode');

    // Function to apply theme based on checkbox state
    function applyTheme(isDarkMode) {
        const theme = isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        console.log(`Theme set to: ${theme}`); // For debugging
    }

    if (darkModeToggle) {
        // 1. Get initial theme from localStorage (default to 'light')
        const currentTheme = localStorage.getItem('theme') || 'light';
        const isDarkModeEnabled = currentTheme === 'dark';

        // 2. Set initial checkbox state
        darkModeToggle.checked = isDarkModeEnabled;

        // 3. Apply initial theme without transition flicker
        // Apply theme immediately before page fully renders if possible
        applyTheme(isDarkModeEnabled); 

        // 4. Add listener for changes
        darkModeToggle.addEventListener('change', function() {
            applyTheme(this.checked);
            // Optional: Provide user feedback
            // showSuccess(`Modo ${this.checked ? 'Oscuro' : 'Claro'} activado.`); 
        });
    } else {
        console.error("Dark mode toggle element (#darkMode) not found.");
    }

    // Remove or repurpose Save/Cancel buttons as theme applies instantly
    const saveButton = document.getElementById('saveSettings');
    const cancelButton = document.querySelector('.settings-actions .btn-secondary'); 

    if (saveButton) {
        // Example: Hide the save button if it's no longer needed for appearance settings
        // saveButton.style.display = 'none'; 
        // Or remove its specific event listener if it had one
    }
     if (cancelButton) {
        // Example: Hide the cancel button
        // cancelButton.style.display = 'none';
     }

    // --- Removed Functions ---
    // loadSettings()
    // saveGeneralSettings()
    // saveEmailSettings()
    // saveNotificationSettings()
    // saveSecuritySettings()
    // testEmailConnection()
    // clearCache()
    // changeLanguage()
    // The original changeTheme() is replaced by applyTheme()
});
