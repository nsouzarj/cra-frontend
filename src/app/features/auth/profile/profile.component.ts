import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { Correspondente } from '../../../shared/models/correspondente.model';
import { UserService } from '@/app/core/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
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
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Profile component initialized');
    
    // Try to get fresh user data from the server
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Received user data in profile component:', user);
        // Ensure emailprincipal is properly set
        this.currentUser = this.normalizeUser(user);
        
        console.log('Nome do Correspondente:', this.currentUser?.correspondente?.nome);
        console.log('Normalized user data in profile component:', this.currentUser);
        
        // Check if user is a correspondent and log correspondent data status
        if (this.isCorrespondent()) {
          this.idusuario = this.currentUser?.id ?? null;
          if (this.idusuario !== null) {
            this.findUser(this.idusuario);
          }
          console.log('User is a correspondent');
          console.log('Correspondent data available:', !!this.currentUser.correspondente);
          console.log('Correspondent ID available:', !!this.currentUser.correspondentId);
          if (this.currentUser.correspondente) {
            console.log('Correspondent data:', this.currentUser.correspondente);
          }
          if (this.currentUser.correspondentId) {
            console.log('Correspondent ID:', this.currentUser.correspondentId);
          }
        } else {
          console.log('User is not a correspondent');
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
        console.log('User obtained:', JSON.stringify(user));
        this.userFind = user;
        // If the userFind has correspondent data, use it
        if (user.correspondente && !this.currentUser?.correspondente) {
          this.currentUser = {
            ...this.currentUser,
            correspondente: user.correspondente
          } as User;
        }
        console.log('User obtained:', JSON.stringify(this.userFind));
      },
      error: (error) => {
        console.error('Error obtaining user:', error);
      }
    });
  }



  /**
   * Normalize user data to ensure emailprincipal is properly set
   * Handles potential case sensitivity or naming differences from backend
   */
  private normalizeUser(user: User): User {
    console.log('Normalizing user data:', user);
    
    // If emailprincipal is not set but emailPrincipal is, use that
    if (!user.emailprincipal && (user as any).emailPrincipal) {
      const normalized = {
        ...user,
        emailprincipal: (user as any).emailPrincipal
      };
      console.log('Normalized emailprincipal:', normalized);
      return normalized;
    }
    
    // If nomecompleto is not set but nomeCompleto is, use that
    if (!user.nomecompleto && (user as any).nomeCompleto) {
      const normalized = {
        ...user,
        nomecompleto: (user as any).nomeCompleto
      };
      console.log('Normalized nomecompleto:', normalized);
      return normalized;
    }
    
    // Fallback: if nomecompleto is still missing, use login as the name
    if (!user.nomecompleto) {
      const normalized = {
        ...user,
        nomecompleto: user.login || 'Usuário'
      };
      console.log('Applied nomecompleto fallback:', normalized);
      return normalized;
    }
    
    // Ensure correspondent data is preserved
    console.log('User data normalization complete:', user);
    return user;
  }

  private loadCachedUserData(): void {
    console.log('Loading cached user data');
    // Get cached user data
    let user = this.authService.currentUserValue;
    console.log('Cached user from authService:', user);
    
    // Normalize the user data
    if (user) {
      user = this.normalizeUser(user);
      this.currentUser = user;
    }
    
    // If we have cached data, we're done
    if (this.currentUser) {
      console.log('Using cached user data:', this.currentUser);
      console.log('Correspondent NOME:', this.currentUser?.correspondente?.nome);
      this.loading = false;
      return;
    }
    
    // If no cached data, try to get it from localStorage directly
    const storedUser = localStorage.getItem('currentUser');
    console.log('Stored user from localStorage:', storedUser);
    if (storedUser) {
      try {
        let user = JSON.parse(storedUser);
        console.log('Parsed user from localStorage:', user);
        user = this.normalizeUser(user);
        this.currentUser = user;
        console.log('Normalized user from localStorage:', this.currentUser);
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
    
    console.log('isCorrespondent check:', {
      userType: this.currentUser?.tipo,
      authorities: this.currentUser?.authorities,
      isCorrespondentType,
      hasCorrespondentRole,
      result
    });
    
    return result;
  }
  
  // Add this method for debugging
  debugUserData(): void {
    console.log('=== DEBUG USER DATA ===');
    console.log('Current User Data:', this.currentUser);
    console.log('User Type:', this.currentUser?.tipo);
    console.log('User Type Type:', typeof this.currentUser?.tipo);
    console.log('Authorities:', this.currentUser?.authorities);
    console.log('Is Correspondent:', this.isCorrespondent());
    console.log('Correspondent ID:', this.currentUser?.correspondente?.nome);
    
    if (this.isCorrespondent()) {
      console.log('User is a correspondent');
      if (this.currentUser?.correspondente) {
        console.log('Correspondent Data:', this.currentUser.correspondente);
      } else {
        console.log('No correspondent data found in currentUser');
        if (this.currentUser?.correspondentId) {
          console.log('User has correspondentId:', this.currentUser.correspondentId, 'but no correspondent data');
        } else {
          console.log('No correspondentId found in currentUser');
        }
      }
    } else {
      console.log('User is not a correspondent');
    }
    
    // Also check what's in localStorage
    const storedUser = localStorage.getItem('currentUser');
    console.log('Raw stored user data:', storedUser);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Parsed stored user data:', parsedUser);
        console.log('Stored user correspondent data:', parsedUser.correspondente);
        console.log('Stored user correspondentId:', parsedUser.correspondentId);
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
    
    // Check auth service current user
    const authServiceUser = this.authService.currentUserValue;
    console.log('Auth service current user:', authServiceUser);
    console.log('Auth service user correspondent data:', authServiceUser?.correspondente);
    console.log('Auth service user correspondentId:', authServiceUser?.correspondentId);
  }
}