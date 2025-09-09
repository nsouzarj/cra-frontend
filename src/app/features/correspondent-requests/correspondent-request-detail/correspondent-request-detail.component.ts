import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { AuthService } from '../../../core/services/auth.service';
import { Solicitacao } from '../../../shared/models/solicitacao.model';
import { User } from '../../../shared/models/user.model';
import { ChangeDetectorRef } from '@angular/core';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-correspondent-request-detail',
  templateUrl: './correspondent-request-detail.component.html',
  styleUrls: ['./correspondent-request-detail.component.scss']
})
export class CorrespondentRequestDetailComponent implements OnInit {
  solicitacao: Solicitacao | null = null;
  loading = true;
  currentUser: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitacaoService: SolicitacaoService,
    public authService: AuthService, // Make it public so it can be accessed from template
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog // Added MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserAndRequest();
  }

  loadCurrentUserAndRequest(): void {
    this.currentUser = this.authService.currentUserValue;
    
    // If we don't have user data, fetch from server
    if (!this.currentUser) {
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.route.params.subscribe(params => {
            const requestId = +params['id'];
            if (requestId) {
              this.loadRequest(requestId);
            }
          });
        },
        error: (error) => {
          console.error('Error loading current user:', error);
          this.loading = false;
          this.snackBar.open('Erro ao carregar dados do usuário', 'Fechar', { duration: 5000 });
          this.goBack();
        }
      });
    } else {
      this.route.params.subscribe(params => {
        const requestId = +params['id'];
        if (requestId) {
          this.loadRequest(requestId);
        }
      });
    }
  }

  private loadRequest(requestId: number): void {
    this.solicitacaoService.getSolicitacaoById(requestId).subscribe({
      next: (solicitacao) => {
        // Always allow the user to view the request if they are a correspondent
        // The API should already ensure that users only get their own requests
        if (this.currentUser && this.authService.isCorrespondente()) {
          this.solicitacao = solicitacao;
          // Trigger change detection to ensure UI updates
          this.cdr.detectChanges();
          console.log('Loaded solicitacao:', solicitacao);
        } else {
          this.snackBar.open('Você não tem permissão para visualizar esta solicitação', 'Fechar', { duration: 5000 });
          this.goBack();
          return;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading solicitacao:', error);
        this.snackBar.open('Erro ao carregar solicitação', 'Fechar', { duration: 5000 });
        this.loading = false;
        this.goBack();
      }
    });
  }

  private hasPermissionToView(solicitacao: Solicitacao): boolean {
    // Check if user is authenticated and is a correspondent
    if (!this.currentUser || !this.authService.isCorrespondente()) {
      return false;
    }

    // If the user is an admin, they can view any request
    if (this.authService.isAdmin()) {
      return true;
    }

    // For correspondent users, we trust that the API only returns their own requests
    // So we allow them to view any request that was returned by the API
    return true;
  }

  goBack(): void {
    this.router.navigate(['/minhas-solicitacoes']);
  }

  getStatusText(status: string | undefined): string {
    return status || 'Pendente';
  }

  getProcessStatusText(status: string | undefined): string {
    return status || 'Não informado';
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pendente';
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }
  
  // Getter method to check if current user is a correspondent
  isCurrentUserCorrespondent(): boolean {
    return this.authService.isCorrespondente();
  }
  
  // Method to determine if a button should be disabled
  isButtonDisabled(buttonType: string): boolean {
    // If the current user is a correspondent and the request status ID is 4, disable all buttons
    const isCorrespondent = this.authService.isCorrespondente();
    const statusId = this.solicitacao?.statusSolicitacao?.idstatus;
    
    // Ensure we're comparing numbers correctly
    const isStatus4 = statusId !== undefined && statusId !== null && 
                     (typeof statusId === 'number' ? statusId === 4 : Number(statusId) === 4);
    
    // Main requirement: If correspondent and status ID is 4, disable ALL buttons
    const disableForStatus4 = isCorrespondent && isStatus4;
    
    // Additional conditions based on button type (only apply if not already disabled for status 4)
    if (disableForStatus4) {
      return true;
    }
    
    // Button-specific conditions (only apply if not disabled for status 4)
    let additionalConditions = false;
    switch (buttonType) {
      case 'iniciar':
        // Disable if already in production or finalized
        additionalConditions = 
          this.solicitacao?.statusSolicitacao?.status === 'Em Produção' || 
          this.solicitacao?.statusSolicitacao?.status === 'Finalizada';
        break;
      case 'finalizar':
        // Disable if already finalized
        additionalConditions = this.solicitacao?.statusSolicitacao?.status === 'Finalizada';
        break;
      case 'reabrir':
        // No additional conditions for reabrir button
        break;
    }
    
    const result = additionalConditions;
    
    return result;
  }
  
  // Method to check if all buttons should be disabled (direct implementation of user requirement)
  shouldDisableAllButtons(): boolean {
    // If the current user is a correspondent and the request status ID is 4, disable all buttons
    const isCorrespondent = this.authService.isCorrespondente();
    const statusId = this.solicitacao?.statusSolicitacao?.idstatus;
    
    // Ensure we're comparing numbers correctly
    const isStatus4 = statusId !== undefined && statusId !== null && 
                     (typeof statusId === 'number' ? statusId === 4 : Number(statusId) === 4);
    
    const result = isCorrespondent && isStatus4;
    
    return result;
  }
  
  // Method to check if "Iniciar Trabalho" button should be disabled
  shouldDisableIniciarTrabalho(): boolean {
    // If all buttons should be disabled due to status 4
    if (this.shouldDisableAllButtons()) {
      return true;
    }
    
    // Disable "Iniciar Trabalho" button if status is "Em Produção", "Finalizada", or "Concluído"
    return this.solicitacao?.statusSolicitacao?.status === 'Em Produção' || 
           this.solicitacao?.statusSolicitacao?.status === 'Finalizada' || 
           this.solicitacao?.statusSolicitacao?.status === 'Concluído';
  }
  
  // Method to check if "Concluir Trabalho" button should be disabled
  shouldDisableConcluirTrabalho(): boolean {
    // If all buttons should be disabled due to status 4
    if (this.shouldDisableAllButtons()) {
      return true;
    }
    
    // Disable "Concluir Trabalho" button if status is "Finalizada" or "Concluído"
    // But keep it enabled when status is "Em Produção"
    return this.solicitacao?.statusSolicitacao?.status === 'Finalizada' || 
           this.solicitacao?.statusSolicitacao?.status === 'Concluído';
  }
  
  // Method to check if "Concluir Trabalho" button should be visible
  shouldShowConcluirTrabalho(): boolean {
    // Show "Concluir Trabalho" button when status is "Em Produção" for correspondents
    // Or for admins/lawyers in any status (including "Concluído")
    return (this.authService.isCorrespondente() && 
            this.solicitacao?.statusSolicitacao?.status === 'Em Produção') ||
           this.canAdminOrLawyerChangeStatus();
  }
  
  canChangeStatus(): boolean {
    // Correspondents can change status, and admins/lawyers can always change status
    return this.authService.isCorrespondente() || this.authService.isAdmin() || this.authService.isAdvogado();
  }
  
  canCorrespondentChangeStatus(): boolean {
    // Only correspondents are restricted when status is "Finalizada" or "Concluído"
    return this.authService.isCorrespondente() && 
           this.solicitacao?.statusSolicitacao?.status !== 'Finalizada' &&
           this.solicitacao?.statusSolicitacao?.status !== 'Concluído';
  }
  
  canAdminOrLawyerChangeStatus(): boolean {
    // Admins or lawyers can always change status, even when it's "Finalizada" or "Concluído"
    return this.authService.isAdmin() || this.authService.isAdvogado();
  }
  
  // Updated method to show confirmation dialog before updating status
  updateStatus(newStatus: string): void {
    if (!this.canChangeStatus() || !this.solicitacao) {
      this.snackBar.open('Você não tem permissão para alterar o status', 'Fechar', { duration: 5000 });
      return;
    }
    
    // Determine the correct idstatus based on the new status
    let idstatus: number;
    switch (newStatus) {
      case 'Em Produção':
        idstatus = 4; // As per user's requirement
        break;
      case 'Finalizada':
      case 'Concluído':
        idstatus = 5; // Assuming Finalizada/Concluído has ID 5
        break;
      default:
        idstatus = this.solicitacao.statusSolicitacao?.idstatus || 1;
    }
    
    // Create updated solicitacao object
    const updatedSolicitacao: Solicitacao = {
      ...this.solicitacao,
      statusSolicitacao: {
        idstatus: idstatus,
        status: newStatus
      }
    };
    
    // If status is "Finalizada" or "Concluído", set dataConclusao
    if (newStatus === 'Finalizada' || newStatus === 'Concluído') {
      updatedSolicitacao.dataConclusao = new Date().toISOString().split('T')[0];
    }
    
    // Show user-friendly status name in confirmation dialog
    const userFriendlyStatus = newStatus === 'Finalizada' ? 'Concluída' : newStatus;
    
    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Alteração de Status',
        message: `Tem certeza que deseja alterar o status para "${userFriendlyStatus}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User confirmed, proceed with status update
        this.solicitacaoService.updateSolicitacao(this.solicitacao!.id!, updatedSolicitacao).subscribe({
          next: (updated) => {
            this.solicitacao = updated;
            this.snackBar.open('Status atualizado com sucesso!', 'Fechar', { duration: 3000 });
            console.log('Status updated successfully for solicitacao:', updated);
            // Emit an event or call a method to notify parent components if needed
          },
          error: (error) => {
            console.error('Error updating status:', error);
            this.snackBar.open('Erro ao atualizar status', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  refreshData(): void {
    this.loading = true;
    this.authService.refreshCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        // Reload the current request
        this.route.params.subscribe(params => {
          const requestId = +params['id'];
          if (requestId && this.solicitacao) {
            this.loadRequest(requestId);
          }
        });
        this.snackBar.open('Dados atualizados com sucesso!', 'Fechar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error refreshing user data:', error);
        this.loading = false;
        this.snackBar.open('Erro ao atualizar dados', 'Fechar', { duration: 5000 });
      }
    });
  }

}