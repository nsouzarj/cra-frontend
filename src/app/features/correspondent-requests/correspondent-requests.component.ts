import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../core/services/solicitacao-status.service';
import { AuthService } from '../../core/services/auth.service';
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';
import { ComarcaService } from '../../core/services/comarca.service';
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { TipoSolicitacao } from '../../shared/models/tiposolicitacao.model';
import { Comarca } from '../../shared/models/comarca.model';
import { User } from '../../shared/models/user.model';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RequestFilterComponent } from '../../shared/components/request-filter/request-filter.component';
import { RequestFilterCriteria } from '../../shared/components/request-filter/request-filter.component';
import { PaginatedResponse } from '../../shared/models/api-response.model';
import { SolicitacaoFiltro } from '../../shared/models/solicitacao-filtro.model';

@Component({
  selector: 'app-correspondent-requests',
  templateUrl: './correspondent-requests.component.html',
  styleUrls: ['./correspondent-requests.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    RouterModule,
    ConfirmationDialogComponent,
    RequestFilterComponent
  ]
})
export class CorrespondentRequestsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Solicitacao>();
  displayedColumns: string[] = ['id', 'datasolicitacao', 'dataprazo', 'tipoSolicitacao', 'processo', 'correspondente', 'status', 'actions'];
  loading = true;
  
  // Current filter criteria
  currentFilter: RequestFilterCriteria = {
    status: '',
    search: '',
    processo: '',
    tipo: '',
    comarca: null,
    correspondenteId: null,
    correspondenteText: '',
    dataSolicitacaoFrom: null,
    dataSolicitacaoTo: null,
    dataPrazoFrom: null,
    dataPrazoTo: null
  };
  
  // Available tipos de solicitação for the dropdown
  tiposSolicitacao: TipoSolicitacao[] = [];
  comarcas: Comarca[] = [];
  statuses: SolicitacaoStatus[] = [];
  
  currentUser: User | null = null;

  // Using inject() function instead of constructor injection
  private solicitacaoService = inject(SolicitacaoService);
  private solicitacaoStatusService = inject(SolicitacaoStatusService);
  private authService = inject(AuthService);
  private tipoSolicitacaoService = inject(TipoSolicitacaoService);
  private comarcaService = inject(ComarcaService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadCurrentUserAndRequests();
    this.loadTiposSolicitacao();
    this.loadComarcas();
    this.loadStatuses();
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
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
        this.snackBar.open('Erro ao carregar comarcas', 'Fechar', { duration: 5000 });
      }
    });
  }

  loadStatuses(): void {
    // Load statuses for filter options
    this.solicitacaoStatusService.getSolicitacaoStatuses().subscribe({
      next: (statuses: SolicitacaoStatus[]) => {
        this.statuses = statuses;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.snackBar.open('Erro ao carregar statuses', 'Fechar', { duration: 5000 });
      }
    });
  }

  loadRequests(): void {
    // Set loading to true when starting to load requests
    this.loading = true;
    
    if (this.currentUser && this.currentUser.id) {
      // Prepare the filter object for the advanced search endpoint
      const filtro: SolicitacaoFiltro = {
        page: 0,
        size: 1000, // Load all requests for correspondent
        sortBy: 'datasolicitacao',
        direction: 'DESC'
      };
      
      // For correspondents, always filter by their own requests
      if (this.authService.isCorrespondente() && this.currentUser.correspondente?.id) {
        filtro.correspondenteId = this.currentUser.correspondente.id;
        
        // Apply other filter criteria for correspondents as well
        if (this.currentFilter.comarca) filtro.comarcaId = this.currentFilter.comarca;
        if (this.currentFilter.processo) filtro.numero = this.currentFilter.processo;
        if (this.currentFilter.status) filtro.statusId = this.getStatusIdByName(this.currentFilter.status);
        if (this.currentFilter.search) filtro.texto = this.currentFilter.search;
        if (this.currentFilter.tipo) filtro.tipoSolicitacaoId = parseInt(this.currentFilter.tipo);
        
        // Add date filters if they exist
        if (this.currentFilter.dataSolicitacaoFrom) filtro.dataInicio = this.currentFilter.dataSolicitacaoFrom;
        if (this.currentFilter.dataSolicitacaoTo) filtro.dataFim = this.currentFilter.dataSolicitacaoTo;
        if (this.currentFilter.dataPrazoFrom) filtro.dataPrazoInicio = this.currentFilter.dataPrazoFrom;
        if (this.currentFilter.dataPrazoTo) filtro.dataPrazoFim = this.currentFilter.dataPrazoTo;
      } 
      // For admins and lawyers, we can filter by various criteria including correspondent
      else if (this.authService.isAdmin() || this.authService.isAdvogado()) {
        // Add filter criteria if they exist
        if (this.currentFilter.comarca) filtro.comarcaId = this.currentFilter.comarca;
        if (this.currentFilter.correspondenteId) filtro.correspondenteId = this.currentFilter.correspondenteId;
        if (this.currentFilter.processo) filtro.numero = this.currentFilter.processo;
        if (this.currentFilter.status) filtro.statusId = this.getStatusIdByName(this.currentFilter.status);
        if (this.currentFilter.search) filtro.texto = this.currentFilter.search;
        if (this.currentFilter.tipo) filtro.tipoSolicitacaoId = parseInt(this.currentFilter.tipo);
        
        // Add date filters if they exist
        if (this.currentFilter.dataSolicitacaoFrom) filtro.dataInicio = this.currentFilter.dataSolicitacaoFrom;
        if (this.currentFilter.dataSolicitacaoTo) filtro.dataFim = this.currentFilter.dataSolicitacaoTo;
      }
      
      // Use the advanced search endpoint for more efficient searching
      this.solicitacaoService.searchAdvanced(filtro).subscribe({
        next: (response: PaginatedResponse<Solicitacao>) => {
          // Apply client-side filtering for additional criteria that might not be supported by backend
          const filteredSolicitacoes = this.applyClientSideFilter(response.content || []);
          
          this.dataSource.data = filteredSolicitacoes;
          this.loading = false;
          
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
      // If we don't have user data, show an error
      this.loading = false;
      this.snackBar.open('Erro ao carregar dados do usuário', 'Fechar', { duration: 5000 });
    }
  }

  // Helper method to apply client-side filtering
  private applyClientSideFilter(solicitacoes: Solicitacao[]): Solicitacao[] {
    return solicitacoes.filter(solicitacao => {
      // Filter by status
      if (this.currentFilter.status && 
          solicitacao.statusSolicitacao?.status !== this.currentFilter.status) {
        return false;
      }
      
      // Filter by search term (process number)
      if (this.currentFilter.search && 
          (!solicitacao.processo?.numeroprocesso || 
           !solicitacao.processo.numeroprocesso.toLowerCase().includes(this.currentFilter.search.toLowerCase()))) {
        return false;
      }
      
      // Filter by process
      if (this.currentFilter.processo && 
          (!solicitacao.processo?.numeroprocesso || 
           solicitacao.processo.numeroprocesso !== this.currentFilter.processo)) {
        return false;
      }
      
      // Filter by tipo
      if (this.currentFilter.tipo && 
          (!solicitacao.tipoSolicitacao?.idtiposolicitacao || 
           solicitacao.tipoSolicitacao.idtiposolicitacao.toString() !== this.currentFilter.tipo)) {
        return false;
      }
      
      // Filter by comarca
      if (this.currentFilter.comarca && 
          (!solicitacao.comarca?.id || 
           solicitacao.comarca.id !== this.currentFilter.comarca)) {
        return false;
      }
      
      // Filter by correspondent ID (for admins and lawyers)
      if (this.currentFilter.correspondenteId && 
          (!solicitacao.correspondente?.id || 
           solicitacao.correspondente.id !== this.currentFilter.correspondenteId)) {
        return false;
      }
      
      // Filter by correspondent name (for admins and lawyers)
      if (this.currentFilter.correspondenteText && 
          (!solicitacao.correspondente?.nome || 
           !solicitacao.correspondente.nome.toLowerCase().includes(this.currentFilter.correspondenteText.toLowerCase()))) {
        return false;
      }
      
      // Filter by data solicitação from
      if (this.currentFilter.dataSolicitacaoFrom && solicitacao.datasolicitacao) {
        const filterDate = new Date(this.currentFilter.dataSolicitacaoFrom);
        const solicitacaoDate = new Date(solicitacao.datasolicitacao);
        if (solicitacaoDate < filterDate) {
          return false;
        }
      }
      
      // Filter by data solicitação to
      if (this.currentFilter.dataSolicitacaoTo && solicitacao.datasolicitacao) {
        const filterDate = new Date(this.currentFilter.dataSolicitacaoTo);
        const solicitacaoDate = new Date(solicitacao.datasolicitacao);
        // Add one day to include the entire end date
        filterDate.setDate(filterDate.getDate() + 1);
        if (solicitacaoDate >= filterDate) {
          return false;
        }
      }
      
      // Filter by data prazo from
      if (this.currentFilter.dataPrazoFrom && solicitacao.dataprazo) {
        const filterDate = new Date(this.currentFilter.dataPrazoFrom);
        const solicitacaoDate = new Date(solicitacao.dataprazo);
        if (solicitacaoDate < filterDate) {
          return false;
        }
      }
      
      // Filter by data prazo to
      if (this.currentFilter.dataPrazoTo && solicitacao.dataprazo) {
        const filterDate = new Date(this.currentFilter.dataPrazoTo);
        const solicitacaoDate = new Date(solicitacao.dataprazo);
        // Add one day to include the entire end date
        filterDate.setDate(filterDate.getDate() + 1);
        if (solicitacaoDate >= filterDate) {
          return false;
        }
      }
      
      // If all filters pass, include this solicitation
      return true;
    });
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

  // New method to handle filter changes from the RequestFilterComponent
  onFilterChange(filterCriteria: RequestFilterCriteria): void {
    this.currentFilter = filterCriteria;
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
    // Reset the current filter criteria
    this.currentFilter = {
      status: '',
      search: '',
      processo: '',
      tipo: '',
      comarca: null,
      correspondenteId: null,
      correspondenteText: '',
      dataSolicitacaoFrom: null,
      dataSolicitacaoTo: null,
      dataPrazoFrom: null,
      dataPrazoTo: null
    };
    
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
  
  // Method to determine if correspondent filter should be shown
  shouldShowCorrespondentFilter(): boolean {
    // Show correspondent filter only for admins and lawyers
    return this.authService.isAdmin() || this.authService.isAdvogado();
  }
  
  // Helper method to get status ID by name
  private getStatusIdByName(statusName: string): number | null {
    if (!statusName) return null;
    
    const status = this.statuses.find(s => s.status === statusName);
    return status ? status.idstatus : null;
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
  
  // Helper method to format date to Brazilian format dd/MM/yyyy HH:mm:ss
  private formatDateToBrazilian(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}
