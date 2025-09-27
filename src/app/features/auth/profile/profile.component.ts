import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { Correspondente } from '../../../shared/models/correspondente.model';
import { UserService } from '@/app/core/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PasswordResetDialogComponent, PasswordResetDialogData } from '../../../shared/components/password-reset-dialog/password-reset-dialog.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  userFind: User | null = null;
  loading = true;
  idusuario: number | null = null;

  constructor(
    private authService: AuthService,
    private correspondenteService: CorrespondenteService,
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Try to get fresh user data from the server
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        // Ensure emailprincipal is properly set
        this.currentUser = this.normalizeUser(user);
        
        // Check if user is a correspondent and log correspondent data status
        if (this.isCorrespondent()) {
          this.idusuario = this.currentUser?.id ?? null;
          if (this.idusuario !== null) {
            this.findUser(this.idusuario);
          }
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user profile from server:', error);
        // If server request fails, use cached data but try to refresh it
        this.loadCachedUserData();
      }
    });

  
  }

  findUser(id: number): void {
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.userFind = user;
        // If the userFind has correspondent data, use it
        if (user.correspondente && !this.currentUser?.correspondente) {
          this.currentUser = {
            ...this.currentUser,
            correspondente: user.correspondente
          } as User;
        }
      },
      error: (error) => {
        console.error('Error obtaining user:', error);
      }
    });
  }

  /**
   * Resets the current user's password
   */
  resetPassword(): void {
    if (!this.currentUser?.id) return;

    // Open password reset dialog
    const passwordDialogRef = this.dialog.open(PasswordResetDialogComponent, {
      width: '500px',
      data: {
        userName: this.currentUser!.nomecompleto
      } as PasswordResetDialogData
    });

    passwordDialogRef.afterClosed().subscribe(newPassword => {
      if (newPassword) {
        // Use the dedicated password reset endpoint
        this.userService.resetUserPassword(this.currentUser!.id!, newPassword).subscribe({
          next: (responseUser) => {
            // Update the current user with the response
            this.currentUser = this.normalizeUser(responseUser);
            
            // Also update the user in the auth service
            this.authService.updateCurrentUser(this.currentUser);
            
            this.snackBar.open('Senha alterada com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Error resetting password:', error);
            // Log more detailed error information
            if (error.error) {
              console.error('Error details:', error.error);
            }
            if (error.message) {
              console.error('Error message:', error.message);
            }
            if (error.status) {
              console.error('Error status:', error.status);
            }
            
            let errorMessage = 'Erro ao alterar senha';
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this.snackBar.open(errorMessage, 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  /**
   * Normalize user data to ensure emailprincipal is properly set
   * Handles potential case sensitivity or naming differences from backend
   */
  private normalizeUser(user: User): User {
    // If emailprincipal is not set but emailPrincipal is, use that
    if (!user.emailprincipal && (user as any).emailPrincipal) {
      const normalized = {
        ...user,
        emailprincipal: (user as any).emailPrincipal
      };
      return normalized;
    }
    
    // If nomecompleto is not set but nomeCompleto is, use that
    if (!user.nomecompleto && (user as any).nomeCompleto) {
      const normalized = {
        ...user,
        nomecompleto: (user as any).nomeCompleto
      };
      return normalized;
    }
    
    // Fallback: if nomecompleto is still missing, use login as the name
    if (!user.nomecompleto) {
      const normalized = {
        ...user,
        nomecompleto: user.login || 'Usuário'
      };
      return normalized;
    }
    
    // Ensure correspondent data is preserved
    return user;
  }

  private loadCachedUserData(): void {
    // Get cached user data
    let user = this.authService.currentUserValue;
    
    // Normalize the user data
    if (user) {
      user = this.normalizeUser(user);
      this.currentUser = user;
    }
    
    // If we have cached data, we're done
    if (this.currentUser) {
      this.loading = false;
      return;
    }
    
    // If no cached data, try to get it from localStorage directly
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        let user = JSON.parse(storedUser);
        user = this.normalizeUser(user);
        this.currentUser = user;
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
    
    this.loading = false;
  }

  getUserRoleText(): string {
    if (!this.currentUser) {
      return 'Usuário não identificado';
    }
    
    if (!this.currentUser.authorities || this.currentUser.authorities.length === 0) {
      return 'Sem permissão';
    }
    
    const role = this.currentUser.authorities[0];
    
    if (!role) {
      return 'Indefinido';
    }
    
    // Ensure role is a string before calling string methods
    if (typeof role !== 'string') {
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

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  isCorrespondent(): boolean {
    // Check both the user type and role to be sure
    const isCorrespondentType = this.currentUser?.tipo === 3; // UserType.CORRESPONDENTE
    const hasCorrespondentRole = this.currentUser?.authorities?.includes('ROLE_CORRESPONDENTE') || false;
    const result = isCorrespondentType || hasCorrespondentRole;
    
    return result;
  }
  
  // Add this method for debugging
  debugUserData(): void {
    // Check auth service current user
    const authServiceUser = this.authService.currentUserValue;
    
    // Try to get user data directly from localStorage with more detailed inspection
    const directStoredUser = localStorage.getItem('currentUser');
    if (directStoredUser) {
      try {
        const directParsed = JSON.parse(directStoredUser);
        // Deep inspection
        this.inspectObjectRecursively(directParsed, 'directParsed', 3);
      } catch (e) {
        console.error('Error in direct parsing:', e);
      }
    }
  }
  
  // Helper method to recursively inspect an object
  private inspectObjectRecursively(obj: any, name: string, depth: number, currentDepth: number = 0): void {
    if (currentDepth >= depth) return;
    
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            this.inspectObjectRecursively(value, `${name}.${key}`, depth, currentDepth + 1);
          }
        }
      }
    }
  }
}