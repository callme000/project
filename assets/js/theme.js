/**
 * Theme Module
 * Immediately sets the theme before page rendering to prevent UI flash
 */
(function () {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
