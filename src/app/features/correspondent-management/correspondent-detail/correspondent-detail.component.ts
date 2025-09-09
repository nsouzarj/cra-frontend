import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service'; // Added PermissionService
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Correspondente } from '../../../shared/models/correspondente.model';

@Component({
  selector: 'app-correspondent-detail',
  templateUrl: './correspondent-detail.component.html',
  styleUrls: ['./correspondent-detail.component.scss']
})
export class CorrespondentDetailComponent implements OnInit {
  correspondent: Correspondente | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private correspondenteService: CorrespondenteService,
    private authService: AuthService,
    public permissionService: PermissionService, // Added PermissionService
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const correspondentId = +params['id'];
      if (correspondentId) {
        this.loadCorrespondent(correspondentId);
      }
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
}