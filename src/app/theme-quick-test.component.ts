import { Component, OnInit } from '@angular/core';
import { ThemeService, Theme } from './core/services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-theme-quick-test',
  template: `
    <div style="padding: 20px; background: white; border-radius: 8px; margin: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2>Theme Quick Test</h2>
      
      <div style="margin-bottom: 20px;">
        <h3>Current Theme: {{ currentTheme }}</h3>
        <p>Body classes: {{ bodyClasses }}</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3>Theme Buttons</h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button mat-raised-button 
                  (click)="setTheme('light')" 
                  [style.background-color]="currentTheme === 'light' ? '#e3f2fd' : '#f5f5f5'">
            Light
          </button>
          <button mat-raised-button 
                  (click)="setTheme('dark')" 
                  [style.background-color]="currentTheme === 'dark' ? '#e3f2fd' : '#f5f5f5'">
            Dark
          </button>
          <button mat-raised-button 
                  (click)="setTheme('blue')" 
                  [style.background-color]="currentTheme === 'blue' ? '#e3f2fd' : '#f5f5f5'">
            Blue
          </button>
          <button mat-raised-button 
                  (click)="setTheme('green')" 
                  [style.background-color]="currentTheme === 'green' ? '#e3f2fd' : '#f5f5f5'">
            Green
          </button>
          <button mat-raised-button 
                  (click)="setTheme('purple')" 
                  [style.background-color]="currentTheme === 'purple' ? '#e3f2fd' : '#f5f5f5'">
            Purple
          </button>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3>Test Results</h3>
        <div *ngFor="let result of testResults" 
             style="padding: 10px; margin: 5px 0; border-radius: 4px;"
             [style.background-color]="result.success ? '#e8f5e9' : '#ffebee'">
          {{ result.message }}
        </div>
      </div>
      
      <div>
        <button mat-raised-button (click)="runFullTest()" color="primary">Run Full Test</button>
        <button mat-raised-button (click)="clearResults()" color="warn" style="margin-left: 10px;">Clear Results</button>
        <button mat-raised-button (click)="goBack()" style="margin-left: 10px;">Back to App</button>
      </div>
    </div>
  `
})
export class ThemeQuickTestComponent implements OnInit {
  currentTheme: Theme = 'light';
  bodyClasses: string = '';
  testResults: { message: string; success: boolean }[] = [];

  constructor(
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateStatus();
  }
  
  updateStatus(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.bodyClasses = Array.from(document.body.classList).join(', ');
  }
  
  setTheme(theme: Theme): void {
    try {
      this.themeService.setTheme(theme);
      this.updateStatus();
      this.testResults.push({
        message: `Successfully set theme to ${theme}`,
        success: true
      });
    } catch (error) {
      this.testResults.push({
        message: `Error setting theme to ${theme}: ${error}`,
        success: false
      });
    }
  }
  
  runFullTest(): void {
    this.testResults = [];
    
    // Test 1: Get current theme
    try {
      const theme = this.themeService.getCurrentTheme();
      this.testResults.push({
        message: `Current theme: ${theme}`,
        success: true
      });
    } catch (error) {
      this.testResults.push({
        message: `Error getting current theme: ${error}`,
        success: false
      });
    }
    
    // Test 2: Get available themes
    try {
      const themes = this.themeService.getAvailableThemes();
      this.testResults.push({
        message: `Available themes: ${themes.map(t => t.label).join(', ')}`,
        success: true
      });
    } catch (error) {
      this.testResults.push({
        message: `Error getting available themes: ${error}`,
        success: false
      });
    }
    
    // Test 3: Set each theme
    const themes: Theme[] = ['light', 'dark', 'blue', 'green', 'purple'];
    for (const theme of themes) {
      try {
        this.themeService.setTheme(theme);
        this.updateStatus();
        this.testResults.push({
          message: `Successfully set theme to ${theme}`,
          success: true
        });
      } catch (error) {
        this.testResults.push({
          message: `Error setting theme to ${theme}: ${error}`,
          success: false
        });
      }
    }
    
    // Test 4: Check body classes
    try {
      const classes = Array.from(document.body.classList);
      this.testResults.push({
        message: `Body classes: ${classes.join(', ')}`,
        success: true
      });
    } catch (error) {
      this.testResults.push({
        message: `Error checking body classes: ${error}`,
        success: false
      });
    }
  }
  
  clearResults(): void {
    this.testResults = [];
  }
  
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}