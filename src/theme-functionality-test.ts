// Simple test to verify theme functionality
class ThemeTester {
  private currentTheme: string = 'light';
  private availableThemes: { value: string; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Escuro' },
    { value: 'blue', label: 'Azul' },
    { value: 'green', label: 'Verde' },
    { value: 'purple', label: 'Roxo' }
  ];

  constructor() {
    this.loadSavedTheme();
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && this.isValidTheme(savedTheme)) {
      this.currentTheme = savedTheme;
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }
    this.applyTheme();
  }

  private isValidTheme(theme: string): boolean {
    return ['light', 'dark', 'blue', 'green', 'purple'].includes(theme);
  }

  private applyTheme(): void {
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'blue-theme', 'green-theme', 'purple-theme');
    
    // Add the current theme class
    const themeClass = `${this.currentTheme}-theme`;
    document.body.classList.add(themeClass);
    
    console.log(`Theme '${this.currentTheme}' applied with class '${themeClass}'`);
  }

  public setTheme(theme: string): void {
    if (!this.isValidTheme(theme)) {
      console.error(`Invalid theme: ${theme}`);
      return;
    }
    
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  public getAvailableThemes(): { value: string; label: string }[] {
    return this.availableThemes;
  }

  // Test method
  public runTest(): void {
    console.log('=== Theme Functionality Test ===');
    console.log('Current theme:', this.getCurrentTheme());
    console.log('Available themes:', this.getAvailableThemes());
    
    // Test setting each theme
    this.availableThemes.forEach(theme => {
      console.log(`\nTesting theme: ${theme.value}`);
      this.setTheme(theme.value);
      console.log(`Current theme after setting: ${this.getCurrentTheme()}`);
    });
    
    console.log('\n=== Test Complete ===');
  }
}

// Run the test if we're in a browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const tester = new ThemeTester();
      tester.runTest();
    });
  } else {
    const tester = new ThemeTester();
    tester.runTest();
  }
}

export { ThemeTester };