import { Component, OnInit, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
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
    console.log('AppComponent: ngOnInit called');
    // Initialize theme
    // Theme is now initialized in the service constructor
    
    // Check if user is authenticated on app start
    if (this.authService.isAuthenticated) {
      // Validate token and get current user info
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          console.log('User authenticated:', user);
        },
        error: (error) => {
          console.error('Authentication error:', error);
          this.authService.logout();
        }
      });
    }
    
    // Listen for theme changes
    window.addEventListener('themeChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('AppComponent: Theme changed to', customEvent.detail);
    });
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
    console.log('Toggling sidenav');
    console.log('Sidenav reference:', this.sidenav);
    if (this.sidenav) {
      console.log('Sidenav mode:', this.sidenav.mode);
      console.log('Sidenav opened:', this.sidenav.opened);
      this.sidenav.toggle();
      this.isSidenavOpen = !this.isSidenavOpen;
      console.log('Sidenav is now:', this.isSidenavOpen ? 'open' : 'closed');
    } else {
      console.log('Sidenav reference is not available');
    }
  }
}