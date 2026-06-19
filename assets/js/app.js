/**
 * Main Application Module
 * Handles UI events and DOM manipulation
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('TaskFlow Initialized');
    initThemeToggle();
});

/**
 * Theme Toggling Logic
 */
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;

    // Set initial icon based on current theme
    updateThemeToggleIcon();

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Apply theme transition class for smooth visual changes
        document.body.classList.add('theme-transition');
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('taskflow_theme', newTheme);
        
        updateThemeToggleIcon();
        
        // Remove transition class after animation finishes
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    });
}

function updateThemeToggleIcon() {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;
    
    const icon = themeToggleBtn.querySelector('i');
    if (!icon) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (currentTheme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
        icon.className = 'fas fa-moon';
        themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
}
