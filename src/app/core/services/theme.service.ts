import { Injectable } from '@angular/core';

export type Theme = 'light' | 'dark' | 'green' | 'purple' | 'amber' | 'yellow' | 'salmon' | 'midnightblue' | 'olive' | 'slategrey' | 'red' | 'lightsteelblue';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: Theme = 'light';

  constructor() {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && this.isValidTheme(savedTheme)) {
      this.currentTheme = savedTheme;
    } else {
      // Check system preference as default
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }
    
    // Apply the theme on initialization
    this.applyTheme();
  }

  /**
   * Set the current theme
   */
  setTheme(theme: Theme): void {
    if (!this.isValidTheme(theme)) {
      return;
    }
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  /**
   * Get the current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): { value: Theme; label: string }[] {
    return [
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Escuro' },
      { value: 'green', label: 'Verde' },
      { value: 'purple', label: 'Roxo' },
      { value: 'amber', label: 'Âmbar' },
      { value: 'yellow', label: 'Amarelo' },
      { value: 'salmon', label: 'Salmão' },
      { value: 'midnightblue', label: 'Midnight Blue' },
      { value: 'olive', label: 'Olive' },
      { value: 'slategrey', label: 'Slate Grey' },
      { value: 'red', label: 'Red' },
      { value: 'lightsteelblue', label: 'Light Steel Blue' }
    ];
  }

  /**
   * Check if a theme value is valid
   */
  private isValidTheme(theme: string): theme is Theme {
    return ['light', 'dark', 'green', 'purple', 'amber', 'yellow', 'salmon', 'midnightblue', 'olive', 'slategrey', 'red', 'lightsteelblue'].includes(theme);
  }

  /**
   * Apply the current theme
   */
  private applyTheme(): void {
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'green-theme', 'purple-theme', 'amber-theme', 'yellow-theme', 'salmon-theme', 'midnightblue-theme', 'olive-theme', 'slategrey-theme', 'red-theme', 'lightsteelblue-theme');
    
    // Add the current theme class
    const themeClass = `${this.currentTheme}-theme`;
    document.body.classList.add(themeClass);
    
    // Dispatch a custom event to notify other components of theme change
    const event = new CustomEvent('themeChanged', { detail: this.currentTheme });
    window.dispatchEvent(event);
  }
}