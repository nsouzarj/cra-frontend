import { Component, OnInit } from '@angular/core';
import { ThemeService, Theme } from './core/services/theme.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

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
                  (click)="setTheme('green')" 
                  [style.background-color]="currentTheme === 'green' ? '#e3f2fd' : '#f5f5f5'">
            Green
          </button>
          <button mat-raised-button 
                  (click)="setTheme('purple')" 
                  [style.background-color]="currentTheme === 'purple' ? '#e3f2fd' : '#f5f5f5'">
            Purple
          </button>
          <button mat-raised-button 
                  (click)="setTheme('amber')" 
                  [style.background-color]="currentTheme === 'amber' ? '#e3f2fd' : '#f5f5f5'">
            Amber
          </button>
          <button mat-raised-button 
                  (click)="setTheme('yellow')" 
                  [style.background-color]="currentTheme === 'yellow' ? '#e3f2fd' : '#f5f5f5'">
            Yellow
          </button>
          <button mat-raised-button 
                  (click)="setTheme('salmon')" 
                  [style.background-color]="currentTheme === 'salmon' ? '#e3f2fd' : '#f5f5f5'">
            Salmon
          </button>
          <button mat-raised-button 
                  (click)="setTheme('midnightblue')" 
                  [style.background-color]="currentTheme === 'midnightblue' ? '#e3f2fd' : '#f5f5f5'">
            Midnight Blue
          </button>
          <button mat-raised-button 
                  (click)="setTheme('olive')" 
                  [style.background-color]="currentTheme === 'olive' ? '#e3f2fd' : '#f5f5f5'">
            Olive
          </button>
          <button mat-raised-button 
                  (click)="setTheme('slategrey')" 
                  [style.background-color]="currentTheme === 'slategrey' ? '#e3f2fd' : '#f5f5f5'">
            Slate Grey
          </button>
          <button mat-raised-button 
                  (click)="setTheme('red')" 
                  [style.background-color]="currentTheme === 'red' ? '#e3f2fd' : '#f5f5f5'">
            Red
          </button>
          <button mat-raised-button 
                  (click)="setTheme('lightsteelblue')" 
                  [style.background-color]="currentTheme === 'lightsteelblue' ? '#e3f2fd' : '#f5f5f5'">
            Light Steel Blue
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
  `,
  standalone: true,
  imports: [CommonModule, MatButtonModule]
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
    const themes: Theme[] = ['light', 'dark', 'green', 'purple', 'amber', 'yellow', 'salmon', 'midnightblue', 'olive', 'slategrey', 'red', 'lightsteelblue'];
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