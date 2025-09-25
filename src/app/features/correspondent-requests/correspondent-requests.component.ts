import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { AuthService } from '../../core/services/auth.service';
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';
import { ComarcaService } from '../../core/services/comarca.service';
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { TipoSolicitacao } from '../../shared/models/tiposolicitacao.model';
import { Comarca } from '../../shared/models/comarca.model';
import { User } from '../../shared/models/user.model';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-correspondent-requests',
  templateUrl: './correspondent-requests.component.html',
  styleUrls: ['./correspondent-requests.component.scss']
})
export class CorrespondentRequestsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Solicitacao>();
  displayedColumns: string[] = ['id', 'datasolicitacao', 'dataprazo', 'tipoSolicitacao', 'processo', 'correspondente', 'status', 'actions'];
  loading = true;
  
  // Filter properties
  filterStatus: string = '';
  filterSearch: string = '';
  filterProcesso: string = '';
  filterCorrespondente: string = '';
  filterTipo: string = ''; // This will now hold the tipo ID instead of text
  filterComarca: number | null = null; // Add comarca filter
  filterDataSolicitacaoFrom: Date | null = null;
  filterDataSolicitacaoTo: Date | null = null;
  filterDataPrazoFrom: Date | null = null;
  filterDataPrazoTo: Date | null = null;
  
  // Available tipos de solicitação for the dropdown
  tiposSolicitacao: TipoSolicitacao[] = [];
  comarcas: Comarca[] = []; // Add comarcas array for filter options
  
  currentUser: User | null = null;

  constructor(
    private solicitacaoService: SolicitacaoService,
    private authService: AuthService,
    private tipoSolicitacaoService: TipoSolicitacaoService,
    private comarcaService: ComarcaService, // Add comarca service
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentUserAndRequests();
    this.loadTiposSolicitacao();
    this.loadComarcas(); // Add this to load comarcas for filter
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCurrentUserAndRequests(): void {
    this.currentUser = this.authService.currentUserValue;
    
    // If we don't have user data or correspondent data, fetch from server
    if (!this.currentUser || 
        (this.authService.isCorrespondente() && !this.currentUser.correspondente)) {
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
      },
      error: (error) => {
        console.error('Error loading tipos de solicitação:', error);
        this.snackBar.open('Erro ao carregar tipos de solicitação', 'Fechar', { duration: 5000 });
      }
    });
  }

  loadComarcas(): void {
    // Load comarcas for filter options
    this.comarcaService.getAllComarcas().subscribe({
      next: (comarcas) => {
        this.comarcas = comarcas;
        console.log('Loaded', this.comarcas.length, 'comarcas for filter');
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
        this.snackBar.open('Erro ao carregar comarcas', 'Fechar', { duration: 5000 });
      }
    });
  }

  loadRequests(): void {
    console.log('loadRequests called with currentUser:', this.currentUser);
    console.log('filterComarca:', this.filterComarca);
    console.log('currentUser.correspondente:', this.currentUser?.correspondente);
    
    if (this.currentUser && this.currentUser.id) {
      // Check if we have a comarca filter
      if (this.filterComarca && this.currentUser.correspondente?.id) {
        console.log('Loading requests filtered by comarca:', this.filterComarca, 'and correspondent:', this.currentUser.correspondente.id);
        // Load requests for the current user's correspondent filtered by comarca
        this.solicitacaoService.searchByComarcaAndCorrespondentePaginated(
          this.filterComarca, 
          this.currentUser.correspondente.id
        ).subscribe({
          next: (response) => {
            console.log('Received paginated response filtered by comarca:', response);
            this.dataSource.data = response.content || [];
            this.loading = false;
            console.log('Loaded', this.dataSource.data.length, 'requests filtered by comarca');
            
            // Connect paginator and sort after data is loaded
            setTimeout(() => {
              if (this.paginator) {
                this.dataSource.paginator = this.paginator;
              }
              if (this.sort) {
                this.dataSource.sort = this.sort;
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
      } else {
        console.log('Loading all requests for correspondent:', this.currentUser.id);
        // Load requests specifically for the current user's correspondent
        this.solicitacaoService.searchByUserCorrespondente(this.currentUser.id).subscribe({
          next: (solicitacoes) => {
            console.log('Received all solicitacoes for correspondent:', solicitacoes);
            this.dataSource.data = solicitacoes;
            this.loading = false;
            console.log('Loaded', this.dataSource.data.length, 'requests for correspondent');
            
            // Connect paginator and sort after data is loaded
            setTimeout(() => {
              if (this.paginator) {
                this.dataSource.paginator = this.paginator;
              }
              if (this.sort) {
                this.dataSource.sort = this.sort;
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
      }
    } else if (this.currentUser && this.authService.isCorrespondente()) {
      // If we don't have user ID, show an error
      this.loading = false;
      this.snackBar.open('Erro ao carregar dados do usuário', 'Fechar', { duration: 5000 });
    } else {
      // User is not a correspondent
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
    console.log('applyFilter called with filterComarca:', this.filterComarca);
    // Always reload requests, the loadRequests method will handle the filtering logic
    this.loadRequests();
    
    // Reset paginator to first page when filtering
    if (this.paginator) {
      this.paginator.firstPage();
    }
    
    // Re-apply sorting after filtering
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterSearch = '';
    this.filterProcesso = '';
    this.filterCorrespondente = '';
    this.filterTipo = '';
    this.filterComarca = null; // Add this line
    this.filterDataSolicitacaoFrom = null;
    this.filterDataSolicitacaoTo = null;
    this.filterDataPrazoFrom = null;
    this.filterDataPrazoTo = null;
    
    // Clear the filter
    this.dataSource.filter = '';
    
    // Reset paginator to first page when clearing filters
    if (this.paginator) {
      this.paginator.firstPage();
    }
    
    // Reload requests to show all
    this.loadRequests();
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
    
    // Preserve the existing observation field
    if (solicitacao.observacao) {
      updatedSolicitacao.observacao = solicitacao.observacao;
    }
    
    // Handle dataconclusao based on status changes
    if (newStatus === 'Finalizada') {
      // When correspondent concludes the solicitation, set dataconclusao to current date
      updatedSolicitacao.dataconclusao = new Date();
    } else if (newStatus === 'Aguardando Confirmação') {
      // When setting to Aguardando Confirmação, clear dataconclusao
      updatedSolicitacao.dataconclusao = undefined;
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