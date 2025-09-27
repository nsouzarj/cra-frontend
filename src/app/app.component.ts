import { Component, OnInit, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ]
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'CRA - Sistema de Correspondentes';
  
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isMobile = false;
  isSidenavOpen = true;

  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Initialize theme
    // Theme is now initialized in the service constructor
    
    // Listen for theme changes
    window.addEventListener('themeChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
    });
    
    // Check if we just returned from external storage authentication
    this.checkExternalStorageAuthCallback();
  }
  
  ngAfterViewInit(): void {
    // Initialize sidenav after view is ready
    setTimeout(() => {
      this.checkScreenSize();
    }, 0);
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }
  
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.sidenav) {
      if (this.isMobile) {
        this.sidenav.mode = 'over';
        // Don't automatically close the sidenav on mobile, let the user control it
        // this.sidenav.close();
        // this.isSidenavOpen = false;
      } else {
        this.sidenav.mode = 'side';
        this.sidenav.open();
        this.isSidenavOpen = true;
      }
    }
  }
  
  toggleSidenav(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
      this.isSidenavOpen = !this.isSidenavOpen;
    }
  }
  
  // Check if we just returned from external storage authentication
  private checkExternalStorageAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    
    if (authSuccess === 'true') {
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show a success message or notification
      
      // Optionally, you could show a toast notification here
      // or trigger a refresh of any components that depend on the auth status
    }
  }
}