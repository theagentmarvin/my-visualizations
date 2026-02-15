/**
 * Theme Manager Module
 * Handles dark/light mode toggle with persistence
 */

class ThemeManager {
  constructor() {
    this.toggleBtn = document.getElementById('theme-toggle');
    this.sunIcon = document.getElementById('sun-icon');
    this.moonIcon = document.getElementById('moon-icon');
    this.currentTheme = 'light';
    
    this.init();
  }

  init() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('wiki-reader-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (prefersDark) {
      this.setTheme('dark');
    }
    
    // Event listener
    this.toggleBtn?.addEventListener('click', () => this.toggle());
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('wiki-reader-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    localStorage.setItem('wiki-reader-theme', newTheme);
  }

  /**
   * Set specific theme
   */
  setTheme(theme) {
    this.currentTheme = theme;
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.sunIcon.style.display = 'none';
      this.moonIcon.style.display = 'block';
    } else {
      document.documentElement.removeAttribute('data-theme');
      this.sunIcon.style.display = 'block';
      this.moonIcon.style.display = 'none';
    }
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
}

export default ThemeManager;