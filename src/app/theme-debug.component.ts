import { Component, OnInit } from '@angular/core';
import { ThemeService, Theme } from './core/services/theme.service';

@Component({
  selector: 'app-theme-debug',
  template: `
    <div style="padding: 20px;">
      <h2>Theme Debug Component</h2>
      <p>Current Theme: {{ currentTheme }}</p>
      <div>
        <button (click)="setTheme('light')" [style.background-color]="currentTheme === 'light' ? '#e3f2fd' : '#f5f5f5'">Light</button>
        <button (click)="setTheme('dark')" [style.background-color]="currentTheme === 'dark' ? '#e3f2fd' : '#f5f5f5'">Dark</button>
        <button (click)="setTheme('blue')" [style.background-color]="currentTheme === 'blue' ? '#e3f2fd' : '#f5f5f5'">Blue</button>
        <button (click)="setTheme('green')" [style.background-color]="currentTheme === 'green' ? '#e3f2fd' : '#f5f5f5'">Green</button>
        <button (click)="setTheme('purple')" [style.background-color]="currentTheme === 'purple' ? '#e3f2fd' : '#f5f5f5'">Purple</button>
      </div>
      <div style="margin-top: 20px;">
        <h3>Available Themes:</h3>
        <ul>
          <li *ngFor="let theme of availableThemes" 
              (click)="setTheme(theme.value)" 
              [style.background-color]="currentTheme === theme.value ? '#e3f2fd' : 'transparent'"
              style="padding: 10px; cursor: pointer;">
            {{ theme.label }}
          </li>
        </ul>
      </div>
    </div>
  `
})
export class ThemeDebugComponent implements OnInit {
  currentTheme: Theme = 'light';
  availableThemes: { value: Theme; label: string }[] = [];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.availableThemes = this.themeService.getAvailableThemes();
    console.log('ThemeDebugComponent: Initial theme:', this.currentTheme);
    console.log('ThemeDebugComponent: Available themes:', this.availableThemes);
  }

  setTheme(theme: Theme): void {
    console.log('ThemeDebugComponent: Setting theme:', theme);
    this.themeService.setTheme(theme);
    this.currentTheme = this.themeService.getCurrentTheme();
    console.log('ThemeDebugComponent: Current theme after setting:', this.currentTheme);
  }
}