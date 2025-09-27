import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Correspondente } from '../../../shared/models/correspondente.model';
import { DateFormatService } from '../../../shared/services/date-format.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-correspondent-detail',
  templateUrl: './correspondent-detail.component.html',
  styleUrls: ['./correspondent-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ConfirmationDialogComponent
  ]
})
export class CorrespondentDetailComponent implements OnInit, OnDestroy {
  correspondent: Correspondente | null = null;
  loading = true;

  private themeSubscription: Subscription | null = null;

  // Using inject() function instead of constructor injection
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private correspondenteService = inject(CorrespondenteService);
  private authService = inject(AuthService);
  public permissionService = inject(PermissionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private dateFormatService = inject(DateFormatService);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const correspondentId = +params['id'];
      if (correspondentId) {
        this.loadCorrespondent(correspondentId);
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

  private loadCorrespondent(correspondentId: number): void {
    this.correspondenteService.getCorrespondenteById(correspondentId).subscribe({
      next: (correspondent) => {
        this.correspondent = correspondent;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading correspondent:', error);
        this.snackBar.open('Erro ao carregar correspondente', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
        this.goBack();
      }
    });
  }

  editCorrespondent(): void {
    if (this.correspondent?.id) {
      this.router.navigate(['/correspondentes/editar', this.correspondent.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/correspondentes']);
  }

  toggleCorrespondentStatus(): void {
    if (!this.correspondent?.id) return;

    const action = this.correspondent.ativo ? 'desativar' : 'ativar';
    const service = this.correspondent.ativo ? 
      this.correspondenteService.deactivateCorrespondente(this.correspondent.id) : 
      this.correspondenteService.activateCorrespondente(this.correspondent.id);

    service.subscribe({
      next: (updatedCorrespondent) => {
        this.correspondent = updatedCorrespondent;
        this.snackBar.open(`Correspondente ${action}do com sucesso!`, 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error(`Error ${action}ing correspondent:`, error);
        this.snackBar.open(`Erro ao ${action} correspondente`, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  duplicateCorrespondent(): void {
    if (!this.correspondent) return;

    const duplicated = { ...this.correspondent };
    delete duplicated.id;
    duplicated.nome = `${this.correspondent.nome} - Cópia`;
    duplicated.cpfcnpj = '';
    duplicated.oab = '';
    
    this.router.navigate(['/correspondentes/novo'], { 
      state: { correspondent: duplicated } 
    });
  }

  deleteCorrespondent(): void {
    if (!this.correspondent?.id) {
      this.snackBar.open('Não foi possível excluir o correspondente: ID inválido', 'Fechar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o correspondente "${this.correspondent.nome}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      } as ConfirmationDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.correspondenteService.deleteCorrespondente(this.correspondent!.id!).subscribe({
          next: () => {
            this.snackBar.open('Correspondente excluído com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/correspondentes']);
          },
          error: (error) => {
            console.error('Error deleting correspondent:', error);
            this.snackBar.open('Erro ao excluir correspondente', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getFormattedType(type: string | undefined): string {
    switch (type) {
      case 'PESSOA_FISICA':
        return 'Pessoa Física';
      case 'PESSOA_JURIDICA':
        return 'Pessoa Jurídica';
      default:
        return type || 'Não informado';
    }
  }

  formatDate(date: Date | string | undefined): string {
    return this.dateFormatService.formatDate(date);
  }
}