import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = false;

  constructor() {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
      console.log('Theme loaded from localStorage:', savedTheme);
    } else {
      // Check system preference as default
      this.isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('Theme loaded from system preference:', this.isDarkTheme);
    }
    
    // Apply the theme on initialization
    // Add a small delay to ensure DOM is fully loaded
    setTimeout(() => {
      this.applyTheme();
      console.log('Theme applied:', this.isDarkTheme ? 'dark' : 'light');
    }, 0);
  }

  /**
   * Enable or disable dark theme
   */
  setDarkTheme(isDark: boolean): void {
    console.log('Setting dark theme:', isDark);
    this.isDarkTheme = isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    this.setDarkTheme(!this.isDarkTheme);
  }

  /**
   * Check if dark theme is currently enabled
   */
  isDarkMode(): boolean {
    return this.isDarkTheme;
  }
  
  /**
   * Apply the current theme
   */
  private applyTheme(): void {
    console.log('Applying theme, dark mode:', this.isDarkTheme);
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
      console.log('Dark theme class added');
    } else {
      document.body.classList.remove('dark-theme');
      console.log('Dark theme class removed');
    }
  }
}