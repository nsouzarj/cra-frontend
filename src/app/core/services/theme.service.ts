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
    
    // Set CSS variables for header colors based on theme
    this.setHeaderCssVariables(this.currentTheme);
    
    // Dispatch a custom event to notify other components of theme change
    const event = new CustomEvent('themeChanged', { detail: this.currentTheme });
    window.dispatchEvent(event);
  }

  /**
   * Set CSS variables for header colors based on theme
   */
  private setHeaderCssVariables(theme: Theme): void {
    const root = document.documentElement;
    
    // Define theme-specific header colors
    const themeColors: { [key in Theme]: { background: string; color: string; welcomeColor: string; userInfoBg: string; userNameColor: string; userEmailColor: string; userRoleColor: string } } = {
      light: {
        background: '#3f51b5',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#f5f5f5',
        userNameColor: '#333333',
        userEmailColor: '#666666',
        userRoleColor: '#3f51b5'
      },
      dark: {
        background: '#2c2c2c',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#424242',
        userNameColor: '#ffffff',
        userEmailColor: '#bbbbbb',
        userRoleColor: '#90caf9'
      },
      green: {
        background: '#4caf50',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#e8f5e9',
        userNameColor: '#2e7d32',
        userEmailColor: '#388e3c',
        userRoleColor: '#1b5e20'
      },
      purple: {
        background: '#9c27b0',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#f3e5f5',
        userNameColor: '#7b1fa2',
        userEmailColor: '#9c27b0',
        userRoleColor: '#4a148c'
      },
      amber: {
        background: '#ffc107',
        color: '#212121',
        welcomeColor: 'rgba(33, 33, 33, 0.8)',
        userInfoBg: '#fff8e1',
        userNameColor: '#ff6f00',
        userEmailColor: '#ff8f00',
        userRoleColor: '#ffab00'
      },
      yellow: {
        background: '#ffeb3b',
        color: '#212121',
        welcomeColor: 'rgba(33, 33, 33, 0.8)',
        userInfoBg: '#fffde7',
        userNameColor: '#f57f17',
        userEmailColor: '#f9a825',
        userRoleColor: '#fbc02d'
      },
      salmon: {
        background: '#fa8072',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#ffebee',
        userNameColor: '#d32f2f',
        userEmailColor: '#f44336',
        userRoleColor: '#b71c1c'
      },
      midnightblue: {
        background: '#1976d2',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#e3f2fd',
        userNameColor: '#0d47a1',
        userEmailColor: '#1565c0',
        userRoleColor: '#01579b'
      },
      olive: {
        background: '#808000',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#f0f0f0',
        userNameColor: '#556b2f',
        userEmailColor: '#6b8e23',
        userRoleColor: '#8fbc8f'
      },
      slategrey: {
        background: '#708090',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#e6e6fa',
        userNameColor: '#2f4f4f',
        userEmailColor: '#696969',
        userRoleColor: '#778899'
      },
      red: {
        background: '#f44336',
        color: '#ffffff',
        welcomeColor: 'rgba(255, 255, 255, 0.8)',
        userInfoBg: '#ffebee',
        userNameColor: '#d32f2f',
        userEmailColor: '#f44336',
        userRoleColor: '#b71c1c'
      },
      lightsteelblue: {
        background: '#b0c4de',
        color: '#212121',
        welcomeColor: 'rgba(33, 33, 33, 0.8)',
        userInfoBg: '#f0f8ff',
        userNameColor: '#4682b4',
        userEmailColor: '#5f9ea0',
        userRoleColor: '#6495ed'
      }
    };

    // Set CSS variables
    const colors = themeColors[theme];
    root.style.setProperty('--header-background', colors.background);
    root.style.setProperty('--header-color', colors.color);
    root.style.setProperty('--header-welcome-color', colors.welcomeColor);
    root.style.setProperty('--header-user-info-bg', colors.userInfoBg);
    root.style.setProperty('--header-user-name-color', colors.userNameColor);
    root.style.setProperty('--header-user-email-color', colors.userEmailColor);
    root.style.setProperty('--header-user-role-color', colors.userRoleColor);
  }
}