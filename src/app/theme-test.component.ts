import { Component, OnInit } from '@angular/core';
import { ThemeService, Theme } from './core/services/theme.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-theme-test',
  templateUrl: './theme-test.component.html',
  styleUrls: ['./theme-test.component.scss']
})
export class ThemeTestComponent implements OnInit {
  currentTheme: Theme;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private location: Location
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    // Listen for theme changes
    window.addEventListener('themeChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.currentTheme = customEvent.detail;
    });
  }

  get availableThemes() {
    return this.themeService.getAvailableThemes();
  }

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  getCurrentThemeLabel(): string {
    const themes = this.themeService.getAvailableThemes();
    const current = themes.find(t => t.value === this.currentTheme);
    return current ? current.label : this.currentTheme;
  }

  goBack(): void {
    this.location.back();
  }
}