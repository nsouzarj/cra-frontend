import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ]
})
export class UnauthorizedComponent implements OnInit {
  
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
  }

  logout(): void {
    this.authService.logout();
  }

  goToDashboard(): void {
    // Navigate to appropriate dashboard based on user role
    const user = this.authService.currentUserValue;
    if (user) {
      if (user.authorities?.includes('ROLE_CORRESPONDENTE')) {
        this.router.navigate(['/correspondent-dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  goBack(): void {
    window.history.back();
  }

  getUserRoleText(): string {
    const user = this.authService.currentUserValue;
    if (!user || !user.authorities || user.authorities.length === 0) {
      return 'Sem permissão';
    }
    
    const role = user.authorities[0];
    if (!role) {
      return 'Indefinido';
    }
    
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Administrador';
      case 'ROLE_ADVOGADO':
        return 'Advogado';
      case 'ROLE_CORRESPONDENTE':
        return 'Correspondente';
      default:
        return role.startsWith('ROLE_') ? role.substring(5) : role;
    }
  }
}