import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { User, UserType } from '../../../shared/models/user.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PasswordResetDialogComponent, PasswordResetDialogData } from '../../../shared/components/password-reset-dialog/password-reset-dialog.component';
import { DateFormatService } from '../../../shared/services/date-format.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    ConfirmationDialogComponent,
    PasswordResetDialogComponent
  ]
})
export class UserDetailComponent implements OnInit, OnDestroy {
  user: User | null = null;
  userFind: User | null = null; // Keep this for template compatibility
  loading = true;
  currentUserId: number | undefined;

  private themeSubscription: Subscription | null = null;

  // Using inject() function instead of constructor injection
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  public permissionService = inject(PermissionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private dateFormatService = inject(DateFormatService);

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUserValue?.id;
    
    this.route.params.subscribe(params => {
      const userId = +params['id'];
      if (userId) {
        this.loadUser(userId);
      }
    });
    
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  setupThemeListener(): void {
    // Listen for theme changes to trigger change detection
    this.themeSubscription = new Subscription();
    const themeHandler = () => {
      // Force change detection when theme changes
      // This will cause the component to re-render with the new theme styles
    };
    
    window.addEventListener('themeChanged', themeHandler);
    // Clean up the event listener when component is destroyed
    this.themeSubscription.add(() => {
      window.removeEventListener('themeChanged', themeHandler);
    });
  }

  loadUser(userId: number): void {
    this.loading = true;
    // Debug log removed
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        // Debug log removed
        this.user = user;
        // Initialize userFind with the user data
        this.userFind = user;
        // If user is a correspondent, ensure correspondent data is loaded
        if (user.tipo === UserType.CORRESPONDENTE) {
          // Debug log removed
          // For correspondent users, we need to load the complete user data that includes correspondent information
          this.findUser(userId);
        } else {
          // Debug log removed
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.loading = false;
        this.snackBar.open('Erro ao carregar usuário', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.goBack();
      }
    });
  }

  findUser(id: number): void {
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        // Debug log removed
        this.userFind = user;
        // If the userFind has correspondent data, use it
        if (user.correspondente) {
          this.user = {
            ...this.user,
            correspondente: user.correspondente
          } as User;
        }
        this.loading = false;
        // Debug log removed
      },
      error: (error) => {
        console.error('Error obtaining user with correspondent data:', error);
        this.loading = false;
        this.snackBar.open('Não foi possível carregar os dados do correspondente', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getUserTypeText(tipo?: UserType): string {
    if (!tipo) return 'Indefinido';
    
    switch (tipo) {
      case UserType.ADMIN:
        return 'Administrador';
      case UserType.ADVOGADO:
        return 'Advogado';
      case UserType.CORRESPONDENTE:
        return 'Correspondente';
      default:
        return 'Indefinido';
    }
  }

  getUserTypeClass(tipo?: UserType): string {
    if (!tipo) return '';
    
    switch (tipo) {
      case UserType.ADMIN:
        return 'type-admin';
      case UserType.ADVOGADO:
        return 'type-advogado';
      case UserType.CORRESPONDENTE:
        return 'type-correspondente';
      default:
        return '';
    }
  }

  getUserPermissions(): {icon: string; title: string; description: string; allowed: boolean; restrictedForCorrespondent: boolean}[] {
    const userType = this.user?.tipo;
    
    // For correspondents, only allow "Gerenciar Solicitações"
    const isCorrespondent = userType === UserType.CORRESPONDENTE;
    
    const permissions: {icon: string; title: string; description: string; allowed: boolean; restrictedForCorrespondent: boolean}[] = [
      {
        icon: 'people',
        title: 'Gerenciar Usuários',
        description: 'Criar, editar e excluir usuários',
        allowed: userType === UserType.ADMIN,
        restrictedForCorrespondent: isCorrespondent
      },
      {
        icon: 'business',
        title: 'Gerenciar Correspondentes',
        description: 'Acesso completo aos correspondentes',
        allowed: userType === UserType.ADMIN || userType === UserType.ADVOGADO,
        restrictedForCorrespondent: isCorrespondent
      },
      {
        icon: 'folder',
        title: 'Gerenciar Processos',
        description: 'Criar e editar processos',
        allowed: userType === UserType.ADMIN || userType === UserType.ADVOGADO,
        restrictedForCorrespondent: isCorrespondent
      },
      {
        icon: 'assignment',
        title: 'Gerenciar Solicitações',
        description: 'Criar e acompanhar solicitações',
        allowed: true,
        restrictedForCorrespondent: isCorrespondent
      },
      {
        icon: 'analytics',
        title: 'Visualizar Relatórios',
        description: 'Acesso a relatórios e estatísticas',
        allowed: userType === UserType.ADMIN || userType === UserType.ADVOGADO,
        restrictedForCorrespondent: isCorrespondent
      }
    ];

    return permissions;
  }

  editUser(): void {
    if (this.user?.id) {
      this.router.navigate(['/usuarios/editar', this.user.id]);
    }
  }

  toggleUserStatus(): void {
    if (!this.user?.id) return;

    const action = this.user.ativo ? 'desativar' : 'ativar';
    const actionText = this.user.ativo ? 'desativar' : 'ativar';
    
    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Alteração de Status',
        message: `Tem certeza que deseja ${actionText} o usuário "${this.user.nomecompleto}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const service = this.user!.ativo ? 
          this.userService.deactivateUser(this.user!.id!) : 
          this.userService.activateUser(this.user!.id!);

        service.subscribe({
          next: (updatedUser) => {
            this.user = updatedUser;
            this.snackBar.open(`Usuário ${action}do com sucesso!`, 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error(`Error ${action}ing user:`, error);
            this.snackBar.open(`Erro ao ${action} usuário`, 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  resetPassword(): void {
    if (!this.user?.id) return;

    // Store the correspondent data before updating
    const correspondentData = this.user.correspondente;

    // Open password reset dialog directly without initial confirmation
    const passwordDialogRef = this.dialog.open(PasswordResetDialogComponent, {
      width: '500px',
      data: {
        userName: this.user!.nomecompleto
      } as PasswordResetDialogData
    });

    passwordDialogRef.afterClosed().subscribe(newPassword => {
      if (newPassword) {
        // Use the dedicated password reset endpoint
        this.userService.resetUserPassword(this.user!.id!, newPassword).subscribe({
          next: (responseUser) => {
            // Restore the correspondent data after the update
            // This ensures that even if the backend doesn't return correspondent data,
            // we maintain it in our local user object
            this.user = {
              ...responseUser,
              correspondente: correspondentData
            };
            
            this.snackBar.open('Senha redefinida com sucesso!', 'Fechar', {
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
            
            let errorMessage = 'Erro ao redefinir senha';
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

  deleteUser(): void {
    if (!this.user?.id) return;

    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o usuário "${this.user.nomecompleto}"?\n\nEsta ação não pode ser desfeita.`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(this.user!.id!).subscribe({
          next: () => {
            this.snackBar.open('Usuário excluído com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.goBack();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.snackBar.open('Erro ao excluir usuário', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/usuarios']);
  }

  getCorrespondentInfo(): {label: string; value: string}[] {
    if (!this.user || this.user.tipo !== UserType.CORRESPONDENTE || !this.user.correspondente?.id) {
      return [];
    }

    // If correspondent data hasn't loaded yet, show a loading message
    if (!this.user.correspondente) {
      return [{
        label: 'Carregando',
        value: 'Dados do correspondente...'
      }];
    }

    const correspondente = this.user.correspondente;
    const endereco = correspondente.endereco;
    
    const info: {label: string; value: string}[] = [
      {
        label: 'Nome',
        value: correspondente.nome
      },
      {
        label: 'OAB',
        value: correspondente.oab || 'Não informado'
      },
      {
        label: 'CPF/CNPJ',
        value: correspondente.cpfcnpj || 'Não informado'
      }
    ];

    // Add contact information
    if (correspondente.emailprimario) {
      info.push({
        label: 'Email Principal',
        value: correspondente.emailprimario
      });
    }

    if (correspondente.telefoneprimario) {
      info.push({
        label: 'Telefone Principal',
        value: correspondente.telefoneprimario
      });
    }

    if (correspondente.telefonecelularprimario) {
      info.push({
        label: 'Celular',
        value: correspondente.telefonecelularprimario
      });
    }

    // Add address information
    if (endereco) {
      if (endereco.logradouro) {
        info.push({
          label: 'Endereço',
          value: `${endereco.logradouro}${endereco.numero ? `, ${endereco.numero}` : ''}${endereco.complemento ? ` - ${endereco.complemento}` : ''}`
        });
      }

      if (endereco.bairro) {
        info.push({
          label: 'Bairro',
          value: endereco.bairro
        });
      }

      if (endereco.cidade || endereco.uf) {
        const cityUf = `${endereco.cidade || ''}${endereco.uf ? `/${endereco.uf.sigla}` : ''}`;
        if (cityUf) {
          info.push({
            label: 'Cidade/UF',
            value: cityUf
          });
        }
      }

      if (endereco.cep) {
        info.push({
          label: 'CEP',
          value: endereco.cep
        });
      }
    }

    return info;
  }

  // New method to get formatted correspondent type
  getFormattedCorrespondentType(type: string | undefined): string {
    switch (type) {
      case 'PESSOA_FISICA':
        return 'Pessoa Física';
      case 'PESSOA_JURIDICA':
        return 'Pessoa Jurídica';
      default:
        return type || 'Não informado';
    }
  }

  // New method to check if correspondent data is available
  hasCorrespondentData(): boolean {
    return !!this.user && 
           this.user.tipo === UserType.CORRESPONDENTE && 
           !!this.user.correspondente?.id &&
           !!this.user.correspondente;
  }

  // Method to check if we should show correspondent sections
  shouldShowCorrespondentSections(): boolean {
    return !!this.user && 
           this.user.tipo === UserType.CORRESPONDENTE && 
           !!this.user.correspondente?.id;
  }

  // Method to check if user is a correspondent (like in profile component)
  isCorrespondent(): boolean {
    // Check both the user type and role to be sure
    const isCorrespondentType = this.user?.tipo === UserType.CORRESPONDENTE;
    return isCorrespondentType;
  }

  formatDate(date: Date | string | undefined): string {
    return this.dateFormatService.formatDate(date);
  }
}