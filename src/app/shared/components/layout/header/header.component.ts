import { Component, OnInit, Output, EventEmitter, HostListener, OnDestroy, ChangeDetectorRef, Input, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService, Theme } from '../../../../core/services/theme.service';
import { ZoomService } from '../../../../core/services/zoom.service';
import { User } from '../../../models/user.model';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

interface UserWithAlternativeFields extends User {
  emailPrincipal?: string;
  nomeCompleto?: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatDividerModule,
    RouterModule
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() isMobile = false;
  currentUser: User | null = null;
  private currentUserSubscription: Subscription | null = null;
  private themeSubscription: Subscription | null = null;
  
  @Output() toggleSidenav = new EventEmitter<void>();

  // Using inject() function instead of constructor injection
  public router = inject(Router);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private zoomService = inject(ZoomoomService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // Listen for theme changes
    this.setupThemeListener();
    
    // Subscribe to user changes to ensure we get updates when user logs in
    this.currentUserSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = this.normalizeUser(user);
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  setupThemeListener(): void {
    // Listen for theme changes to trigger change detection
    this.themeSubscription = new Subscription();
    const themeHandler = () => {
      // Force change detection when theme changes
      this.cdr.detectChanges();
    };
    
    window.addEventListener('themeChanged', themeHandler);
    // Clean up the event listener when component is destroyed
    this.themeSubscription.add(() => {
      window.removeEventListener('themeChanged', themeHandler);
    });
  }

  /**
   * Normalize user data to handle potential alternative field names from backend
   */
  private normalizeUser(user: User | null): User | null {
    if (!user) return null;
    
    // Handle potential case sensitivity or naming differences
    const normalizedUser = { ...user };
    
    const userWithAltFields = user as UserWithAlternativeFields;
    if (!normalizedUser.emailprincipal && userWithAltFields.emailPrincipal) {
      normalizedUser.emailprincipal = userWithAltFields.emailPrincipal;
    }
    
    if (!normalizedUser.nomecompleto && userWithAltFields.nomeCompleto) {
      normalizedUser.nomecompleto = userWithAltFields.nomeCompleto;
    }
    
    // Fallback: if nomecompleto is still missing, use login as the name
    if (!normalizedUser.nomecompleto) {
      normalizedUser.nomecompleto = normalizedUser.login;
    }
    
    return normalizedUser;
  }

  onToggleSidenav(): void {
    this.toggleSidenav.emit();
  }

  onThemeMenuClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onThemeSelect(theme: Theme, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Set the theme
    this.setTheme(theme);
    
    // Close the menu explicitly
    const menuButton = document.getElementById('theme-menu-button');
    if (menuButton) {
      const menuTrigger = (menuButton as any)._menuTrigger;
      if (menuTrigger && typeof menuTrigger.closeMenu === 'function') {
        menuTrigger.closeMenu();
      }
    }
  }

  setTheme(theme: Theme): void {
    // Simple approach - just call the theme service directly
    this.themeService.setTheme(theme);
    // Force change detection
    this.cdr.detectChanges();
  }

  getCurrentTheme(): Theme {
    const theme = this.themeService.getCurrentTheme();
    return theme;
  }

  getAvailableThemes(): { value: Theme; label: string }[] {
    const themes = this.themeService.getAvailableThemes();
    return themes;
  }

  getUserRoleText(): string {
    // First check if we have a current user
    if (!this.currentUser) {
      return 'Carregando...';
    }
    
    // Check if authorities exist and is not empty
    if (!this.currentUser.authorities || this.currentUser.authorities.length === 0) {
      return 'Sem permissão';
    }
    
    // Get the first role (primary role)
    const role = this.currentUser.authorities[0];
    
    // Handle null or undefined role
    if (!role) {
      return 'Indefinido';
    }
    
    // Ensure role is a string before calling string methods
    if (typeof role !== 'string') {
      return 'Indefinido';
    }
    
    // Map role to display text
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Administrador';
      case 'ROLE_ADVOGADO':
        return 'Advogado';
      case 'ROLE_CORRESPONDENTE':
        return 'Correspondente';
      default:
        // Return the role without ROLE_ prefix if it's not a standard role
        return role.startsWith('ROLE_') ? role.substring(5) : role;
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
  }

  testTheme(): void {
    // Try setting a specific theme
    this.setTheme('green');
  }

  refreshTheme(): void {
    this.themeService.setTheme(this.themeService.getCurrentTheme());
  }

  navigateToThemeSelection(): void {
    this.router.navigate(['/theme-test']);
  }
  
  navigateToThemeTroubleshoot(): void {
    this.router.navigate(['/theme-troubleshoot']);
  }

  // Zoom functionality methods
  zoomIn(): void {
    this.zoomService.zoomIn();
  }

  zoomOut(): void {
    this.zoomService.zoomOut();
  }

  resetZoom(): void {
    this.zoomService.resetZoom();
  }

  getZoomLevel(): number {
    return this.zoomService.getZoomLevel();
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Check if Ctrl key is pressed
    if (event.ctrlKey) {
      // Zoom in with Ctrl + Plus
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        this.zoomIn();
      }
      // Zoom out with Ctrl + Minus
      else if (event.key === '-') {
        event.preventDefault();
        this.zoomOut();
      }
      // Reset zoom with Ctrl + 0
      else if (event.key === '0') {
        event.preventDefault();
        this.resetZoom();
      }
    }
  }
}