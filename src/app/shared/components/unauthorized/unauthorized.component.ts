import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent {
  
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  getUserRoleText(): string {
    const user = this.authService.currentUserValue;
    
    // Check if we have a user
    if (!user) {
      return 'Usuário não identificado';
    }
    
    // Check if authorities exist and is not empty
    if (!user.authorities || user.authorities.length === 0) {
      return 'Sem permissão';
    }
    
    // Get the first role (primary role)
    const role = user.authorities[0];
    
    // Handle null or undefined role
    if (!role) {
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

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
}