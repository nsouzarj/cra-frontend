import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { AuthService } from '../../core/services/auth.service';
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { TipoSolicitacao } from '../../shared/models/tiposolicitacao.model';
import { User } from '../../shared/models/user.model';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-correspondent-requests',
  templateUrl: './correspondent-requests.component.html',
  styleUrls: ['./correspondent-requests.component.scss']
})
export class CorrespondentRequestsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<Solicitacao>();
  displayedColumns: string[] = ['id', 'complemento', 'tipoSolicitacao', 'processo', 'correspondente', 'status', 'actions'];
  loading = true;
  
  // Filter properties
  filterStatus: string = '';
  filterSearch: string = '';
  filterProcesso: string = '';
  filterCorrespondente: string = '';
  filterTipo: string = ''; // This will now hold the tipo ID instead of text
  
  // Available tipos de solicitação for the dropdown
  tiposSolicitacao: TipoSolicitacao[] = [];
  
  currentUser: User | null = null;

  constructor(
    private solicitacaoService: SolicitacaoService,
    private authService: AuthService,
    private tipoSolicitacaoService: TipoSolicitacaoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserAndRequests();
    this.loadTiposSolicitacao();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadCurrentUserAndRequests(): void {
    this.currentUser = this.authService.currentUserValue;
    
    // If we don't have user data or correspondent data, fetch from server
    if (!this.currentUser || 
        (this.authService.isCorrespondente() && !this.currentUser.correspondente && !this.currentUser.correspondentId)) {
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUser = user;
          this.loadRequests();
        },
        error: (error) => {
          console.error('Error loading current user:', error);
          this.loading = false;
          this.snackBar.open('Erro ao carregar dados do usuário', 'Fechar', { duration: 5000 });
        }
      });
    } else {
      this.loadRequests();
    }
  }

  loadTiposSolicitacao(): void {
    this.tipoSolicitacaoService.getTiposSolicitacao().subscribe({
      next: (tipos) => {
        this.tiposSolicitacao = tipos;
        console.log('Loaded tipos de solicitação:', tipos);
      },
      error: (error) => {
        console.error('Error loading tipos de solicitação:', error);
        this.snackBar.open('Erro ao carregar tipos de solicitação', 'Fechar', { duration: 5000 });
      }
    });
  }

  loadRequests(): void {
    console.log('Current user:', this.currentUser);
    
    if (this.currentUser && this.currentUser.id) {
      console.log('User ID found:', this.currentUser.id);
      // Load requests specifically for the current user's correspondent
      this.solicitacaoService.searchByUserCorrespondente(this.currentUser.id).subscribe({
        next: (solicitacoes) => {
          console.log('Requests loaded for user correspondent:', solicitacoes);
          this.dataSource.data = solicitacoes;
          this.loading = false;
          
          // Connect paginator after data is loaded
          setTimeout(() => {
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
          }, 0);
        },
        error: (error) => {
          console.error('Error loading requests:', error);
          this.dataSource.data = [];
          this.loading = false;
          this.snackBar.open('Erro ao carregar solicitações', 'Fechar', { duration: 5000 });
        }
      });
    } else if (this.currentUser && this.authService.isCorrespondente()) {
      // If we don't have user ID, show an error
      console.log('User is correspondent but no user ID found');
      this.loading = false;
      this.snackBar.open('Erro ao carregar dados do usuário', 'Fechar', { duration: 5000 });
    } else {
      // User is not a correspondent
      console.log('User is not a correspondent');
      this.loading = false;
      this.snackBar.open('Acesso restrito a correspondentes', 'Fechar', { duration: 5000 });
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pendente';
    
    // Map status values to CSS classes
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'status-pendente';
      case 'em andamento':
      case 'em_andamento':
        return 'status-andamento';
      case 'finalizada':
        return 'status-finalizada';
      case 'cancelada':
        return 'status-cancelada';
      default:
        return 'status-pendente';
    }
  }

  applyFilter(): void {
    this.dataSource.filterPredicate = (solicitacao: Solicitacao, filter: string): boolean => {
      // Filter by status
      const statusMatch = this.filterStatus ? 
        solicitacao.statusSolicitacao?.status === this.filterStatus : true;
      
      // Filter by search term (in complemento field)
      const searchMatch = this.filterSearch ? 
        solicitacao.complemento?.toLowerCase().includes(this.filterSearch.toLowerCase()) : true;
      
      // Filter by processo
      const processoMatch = this.filterProcesso ? 
        solicitacao.processo?.numeroprocesso?.toLowerCase().includes(this.filterProcesso.toLowerCase()) : true;
      
      // Filter by correspondente
      const correspondenteMatch = this.filterCorrespondente ? 
        solicitacao.correspondente?.nome?.toLowerCase().includes(this.filterCorrespondente.toLowerCase()) : true;
      
      // Filter by tipo (now comparing ID instead of text)
      const tipoMatch = this.filterTipo ? 
        solicitacao.tipoSolicitacao?.idtiposolicitacao === Number(this.filterTipo) : true;
      
      return Boolean(statusMatch && searchMatch && processoMatch && correspondenteMatch && tipoMatch);
    };

    // Trigger the filter
    this.dataSource.filter = 'trigger';
    
    // Reset paginator to first page when filtering
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterSearch = '';
    this.filterProcesso = '';
    this.filterCorrespondente = '';
    this.filterTipo = '';
    
    // Clear the filter
    this.dataSource.filter = '';
    
    // Reset paginator to first page when clearing filters
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }
  
  refreshData(): void {
    this.loading = true;
    this.authService.refreshCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadRequests();
        this.snackBar.open('Dados atualizados com sucesso!', 'Fechar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error refreshing user data:', error);
        this.loading = false;
        this.snackBar.open('Erro ao atualizar dados', 'Fechar', { duration: 5000 });
      }
    });
  }

  canChangeStatus(): boolean {
    // Correspondents can change status, and admins/lawyers can always change status
    return this.authService.isCorrespondente() || this.authService.isAdmin() || this.authService.isAdvogado();
  }
  
  canCorrespondentChangeStatus(solicitacao: Solicitacao): boolean {
    // Only correspondents are restricted when status is "Finalizada"
    return this.authService.isCorrespondente() && 
           solicitacao?.statusSolicitacao?.status !== 'Finalizada';
  }
  
  canAdminOrLawyerChangeStatus(): boolean {
    // Admins or lawyers can always change status, even when it's "Finalizada"
    return this.authService.isAdmin() || this.authService.isAdvogado();
  }
  
  // Updated method to show confirmation dialog before updating status
  updateStatus(solicitacao: Solicitacao, newStatus: string): void {
    if (!this.canChangeStatus()) {
      this.snackBar.open('Você não tem permissão para alterar o status', 'Fechar', { duration: 5000 });
      return;
    }
    
    // Determine the correct idstatus based on the new status
    let idstatus: number;
    switch (newStatus) {
      case 'Em Andamento':
        idstatus = 4; // As per user's requirement
        break;
      case 'Finalizada':
        idstatus = 5; // Assuming Finalizada has ID 5
        break;
      default:
        idstatus = solicitacao.statusSolicitacao?.idstatus || 1;
    }
    
    // Create updated solicitacao object
    const updatedSolicitacao: Solicitacao = {
      ...solicitacao,
      statusSolicitacao: {
        idstatus: idstatus,
        status: newStatus
      }
    };
    
    // If status is "Finalizada", set dataConclusao
    if (newStatus === 'Finalizada') {
      updatedSolicitacao.dataConclusao = new Date().toISOString().split('T')[0];
    }
    
    // Show user-friendly status name in confirmation dialog
    const userFriendlyStatus = newStatus === 'Finalizada' ? 'Concluída' : newStatus;
    
    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Alteração de Status',
        message: `Tem certeza que deseja alterar o status da solicitação ${solicitacao.id} para "${userFriendlyStatus}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User confirmed, proceed with status update
        this.solicitacaoService.updateSolicitacao(solicitacao.id!, updatedSolicitacao).subscribe({
          next: (updated) => {
            // Update the data source
            const index = this.dataSource.data.findIndex(s => s.id === solicitacao.id);
            if (index !== -1) {
              this.dataSource.data[index] = updated;
              this.dataSource.data = [...this.dataSource.data];
            }
            
            this.snackBar.open('Status atualizado com sucesso!', 'Fechar', { duration: 3000 });
            console.log('Status updated successfully for solicitacao:', updated);
          },
          error: (error) => {
            console.error('Error updating status:', error);
            this.snackBar.open('Erro ao atualizar status', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }
}