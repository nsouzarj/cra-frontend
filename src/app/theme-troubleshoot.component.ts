import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService, Theme } from './core/services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-theme-troubleshoot',
  templateUrl: './theme-troubleshoot.component.html',
  styleUrls: ['./theme-troubleshoot.component.scss'],
  standalone: true
})
export class ThemeTroubleshootComponent implements OnInit, OnDestroy {
  currentTheme: Theme = 'light';
  bodyClasses: string = '';
  menuTestResult: string = '';
  
  constructor(
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('ThemeTroubleshootComponent: Initialized');
    this.refreshStatus();
    
    // Listen for theme changes
    window.addEventListener('themeChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('ThemeTroubleshootComponent: Theme changed event received:', customEvent.detail);
      this.refreshStatus();
    });
  }
  
  ngOnDestroy(): void {
    console.log('ThemeTroubleshootComponent: Destroyed');
  }
  
  refreshStatus(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.bodyClasses = Array.from(document.body.classList).join(', ');
    console.log('ThemeTroubleshootComponent: Refreshed status');
    console.log('Current theme:', this.currentTheme);
    console.log('Body classes:', this.bodyClasses);
  }
  
  setTheme(theme: Theme): void {
    console.log('ThemeTroubleshootComponent: Setting theme to', theme);
    try {
      this.themeService.setTheme(theme);
      // Add a small delay to ensure DOM updates
      setTimeout(() => {
        this.refreshStatus();
        console.log('ThemeTroubleshootComponent: Theme set successfully to', theme);
      }, 100);
    } catch (error) {
      console.error('ThemeTroubleshootComponent: Error setting theme:', error);
    }
  }
  
  testMenu(): void {
    console.log('ThemeTroubleshootComponent: Testing menu');
    const menuButton = document.getElementById('theme-menu-button');
    if (menuButton) {
      menuButton.click();
      this.menuTestResult = 'Menu button clicked - check if menu opened';
      console.log('ThemeTroubleshootComponent: Menu button clicked');
    } else {
      this.menuTestResult = 'Menu button not found';
      console.error('ThemeTroubleshootComponent: Menu button not found');
    }
  }
  
  clearLogs(): void {
    console.clear();
    this.menuTestResult = 'Console cleared';
    console.log('ThemeTroubleshootComponent: Console cleared');
  }
  
  goToThemeTest(): void {
    this.router.navigate(['/theme-test']);
  }
}