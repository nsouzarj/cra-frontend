import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../../core/services/user.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { User, UserType } from '../../../shared/models/user.model';
import { Correspondente } from '../../../shared/models/correspondente.model';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = true;
  currentUserId: number | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private correspondenteService: CorrespondenteService,
    public authService: AuthService,
    public permissionService: PermissionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUserValue?.id;
    
    this.route.params.subscribe(params => {
      const userId = +params['id'];
      if (userId) {
        this.loadUser(userId);
      }
    });
  }

  loadUser(userId: number): void {
    this.loading = true;
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        // If user is a correspondent, ensure correspondent data is loaded
        if (user.tipo === UserType.CORRESPONDENTE && user.correspondentId) {
          this.loadCorrespondentData(user.correspondentId);
        } else {
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

  loadCorrespondentData(correspondentId: number): void {
    this.correspondenteService.getCorrespondenteById(correspondentId).subscribe({
      next: (correspondentData) => {
        if (this.user) {
          this.user.correspondente = correspondentData;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading correspondent data:', error);
        this.loading = false;
        this.snackBar.open('Erro ao carregar dados do correspondente', 'Fechar', {
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

  getUserPermissions(): any[] {
    const userType = this.user?.tipo;
    
    const permissions = [
      {
        icon: 'people',
        title: 'Gerenciar Usuários',
        description: 'Criar, editar e excluir usuários',
        allowed: userType === UserType.ADMIN
      },
      {
        icon: 'business',
        title: 'Gerenciar Correspondentes',
        description: 'Acesso completo aos correspondentes',
        allowed: true
      },
      {
        icon: 'folder',
        title: 'Gerenciar Processos',
        description: 'Criar e editar processos',
        allowed: true
      },
      {
        icon: 'assignment',
        title: 'Gerenciar Solicitações',
        description: 'Criar e acompanhar solicitações',
        allowed: true
      },
      {
        icon: 'analytics',
        title: 'Visualizar Relatórios',
        description: 'Acesso a relatórios e estatísticas',
        allowed: userType === UserType.ADMIN || userType === UserType.ADVOGADO
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
    const service = this.user.ativo ? 
      this.userService.deactivateUser(this.user.id) : 
      this.userService.activateUser(this.user.id);

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

  resetPassword(): void {
    if (!this.user?.id) return;

    const confirmed = confirm(`Tem certeza que deseja redefinir a senha do usuário "${this.user.nomecompleto}"?`);
    if (!confirmed) return;

    // This would typically call a specific reset password endpoint
    this.snackBar.open('Funcionalidade de redefinição de senha será implementada', 'Fechar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  deleteUser(): void {
    if (!this.user?.id) return;

    const confirmed = confirm(`Tem certeza que deseja excluir o usuário "${this.user.nomecompleto}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) return;

    this.userService.deleteUser(this.user.id).subscribe({
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

  goBack(): void {
    this.router.navigate(['/usuarios']);
  }

  getCorrespondentInfo(): any[] {
    if (!this.user || this.user.tipo !== UserType.CORRESPONDENTE || !this.user.correspondentId) {
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
    
    const info = [
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
}