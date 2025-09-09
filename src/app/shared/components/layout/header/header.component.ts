import { Component, OnInit, Output, EventEmitter, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ZoomService } from '../../../../core/services/zoom.service';
import { User } from '../../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private currentUserSubscription: Subscription | null = null;
  
  @Output() toggleSidenav = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private zoomService: ZoomService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
  }

  /**
   * Normalize user data to handle potential alternative field names from backend
   */
  private normalizeUser(user: User | null): User | null {
    if (!user) return null;
    
    // Handle potential case sensitivity or naming differences
    const normalizedUser = { ...user };
    
    if (!normalizedUser.emailprincipal && (user as any).emailPrincipal) {
      normalizedUser.emailprincipal = (user as any).emailPrincipal;
    }
    
    if (!normalizedUser.nomecompleto && (user as any).nomeCompleto) {
      normalizedUser.nomecompleto = (user as any).nomeCompleto;
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

  toggleTheme(): void {
    console.log('Toggling theme');
    this.themeService.toggleTheme();
  }

  isDarkMode(): boolean {
    const isDark = this.themeService.isDarkMode();
    console.log('Checking dark mode:', isDark);
    return isDark;
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

  // Keyboard shortcuts for zoom (Ctrl + '+' to zoom in, Ctrl + '-' to zoom out, Ctrl + '0' to reset)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.ctrlKey) {
      switch (event.key) {
        case '+':
        case '=': // Some keyboards use '=' for '+'
          event.preventDefault();
          this.zoomIn();
          break;
        case '-':
          event.preventDefault();
          this.zoomOut();
          break;
        case '0':
          event.preventDefault();
          this.resetZoom();
          break;
      }
    }
  }
}