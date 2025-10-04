import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../../core/services/solicitacao-status.service';
import { ProcessoService } from '../../../core/services/processo.service';
import { ComarcaService } from '../../../core/services/comarca.service';
import { OrgaoService } from '../../../core/services/orgao.service';
import { Solicitacao, SolicitacaoStatus } from '../../../shared/models/solicitacao.model';
import { Processo } from '../../../shared/models/processo.model';
import { Comarca } from '../../../shared/models/comarca.model';
import { Orgao } from '../../../shared/models/orgao.model';
import { AuthService } from '@/app/core/services/auth.service';
import { PermissionService } from '@/app/core/services/permission.service';
import { ConfirmationDialogComponent } from '@/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { Subscription } from 'rxjs';
import { PaginatedResponse } from '../../../shared/models/api-response.model';
import { RequestFilterCriteria } from '@/app/shared/components/request-filter/request-filter.component';
import { SolicitacaoFiltro } from '../../../shared/models/solicitacao-filtro.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { RequestFilterComponent } from '@/app/shared/components/request-filter/request-filter.component';

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatToolbarModule,
    MatChipsModule,
    MatTooltipModule,
    RouterModule,
    RequestFilterComponent
  ]
})
export class RequestListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Solicitacao>();
  displayedColumns: string[] = ['id', 'datasolicitacao', 'dataprazo', 'tipoSolicitacao', 'processo', 'correspondente', 'status', 'actions'];
  loading = true;
  pdfLoading = new Set<number>();
  
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
  
  statuses: SolicitacaoStatus[] = [];
  
  // Filter options
  processos: Processo[] = [];
  comarcas: Comarca[] = [];
  orgaos: Orgao[] = [];
  
  // Pagination properties
  pageSize = 20;
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];
  totalElements = 0;
  currentPage = 0;
  sortBy = 'id';
  sortDirection = 'ASC';

  private themeSubscription: Subscription | null = null;

  // Using inject() function instead of constructor injection
  private http = inject(HttpClient);
  private solicitacaoService = inject(SolicitacaoService);
  private solicitacaoStatusService = inject(SolicitacaoStatusService);
  private processoService = inject(ProcessoService);
  private comarcaService = inject(ComarcaService);
  private orgaoService = inject(OrgaoService);
  public authService = inject(AuthService);
  public permissionService = inject(PermissionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadStatuses();
    this.loadFilterOptions();
    this.setupThemeListener();
  }

  ngAfterViewInit(): void {
    // Set up sort
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.sortBy = this.sort.active;
        this.sortDirection = this.sort.direction.toUpperCase() || 'ASC';
        this.currentPage = 0;
        this.loadRequests();
      });
    }
    
    // Load initial data
    this.loadRequests();
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
      this.cdr.detectChanges();
    };
    
    window.addEventListener('themeChanged', themeHandler);
    // Clean up the event listener when component is destroyed
    this.themeSubscription.add(() => {
      window.removeEventListener('themeChanged', themeHandler);
    });
  }

  loadRequests(): void {
    this.loading = true;
    
    // Prepare the filter object for the advanced search endpoint
    const filtro: SolicitacaoFiltro = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: this.sortBy,
      direction: this.sortDirection
    };
    
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
    if (this.currentFilter.dataPrazoFrom) filtro.dataPrazoInicio = this.currentFilter.dataPrazoFrom;
    if (this.currentFilter.dataPrazoTo) filtro.dataPrazoFim = this.currentFilter.dataPrazoTo;
    
    // Use the advanced search endpoint for more efficient searching
    this.solicitacaoService.searchAdvanced(filtro).subscribe({
      next: (response: PaginatedResponse<Solicitacao>) => {
        this.handlePaginatedResponse(response);
      },
      error: (error) => {
        this.handleLoadError(error);
      }
    });
  }

  private handlePaginatedResponse(response: PaginatedResponse<Solicitacao>): void {
    this.dataSource.data = response.content;
    // USE totalTableElements for correct pagination - this is the total count across all pages
    this.totalElements = response.totalTableElements ?? response.totalElements;
    
    // Update paginator
    if (this.paginator) {
      this.paginator.length = this.totalElements;
      this.paginator.pageIndex = this.currentPage;
      this.paginator.pageSize = this.pageSize;
    }
    
    this.loading = false;
  }

  private handleLoadError(error: unknown): void {
    console.error('Error loading requests:', error);
    this.loading = false;
    this.snackBar.open('Erro ao carregar solicitações', 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  loadStatuses(): void {
    this.solicitacaoStatusService.getSolicitacaoStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
      }
    });
  }

  loadFilterOptions(): void {
    // Load processos
    this.processoService.getProcessos().subscribe({
      next: (processos) => {
        this.processos = processos;
      },
      error: (error) => {
        console.error('Error loading processos:', error);
      }
    });

    // Load comarcas (using getAllComarcas for filter options)
    this.comarcaService.getAllComarcas().subscribe({
      next: (comarcas) => {
        this.comarcas = comarcas;
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
      }
    });

    // Load orgaos
    this.orgaoService.getOrgaos().subscribe({
      next: (orgaos) => {
        this.orgaos = orgaos;
      },
      error: (error) => {
        console.error('Error loading orgaos:', error);
      }
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
    // Debug log removed
    this.currentFilter = filterCriteria;
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadRequests();
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
    
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadRequests();
  }

  // Handle paginator page change events
  paginatorPageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadRequests();
  }

  viewRequest(): void {
    // Implementation for viewing a request
  }

  editRequest(): void {
    // Implementation for editing a request
  }

  /**
   * Generate and download PDF report for a solicitation
   * @param solicitacaoId The ID of the solicitation to generate PDF for
   */
  generatePdfReport(solicitacaoId: number): void {
    this.pdfLoading.add(solicitacaoId);
    this.solicitacaoService.generatePdfReport(solicitacaoId).subscribe({
      next: (blob: Blob) => {
        // Create a download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `solicitacao-${solicitacaoId}.pdf`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        console.error('Error generating PDF report:', error);
        this.snackBar.open('Erro ao gerar relatório PDF', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.pdfLoading.delete(solicitacaoId);
      }
    });
  }

  deleteRequest(id: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Exclusão',
        message: 'Tem certeza que deseja excluir esta solicitação? Esta ação não pode ser desfeita.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.solicitacaoService.deleteSolicitacao(id).subscribe({
          next: () => {
            this.snackBar.open('Solicitação excluída com sucesso', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            // Reload the requests after deletion
            this.loadRequests();
          },
          error: (error) => {
            console.error('Error deleting request:', error);
            this.snackBar.open('Erro ao excluir solicitação', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
  
  // Helper method to get status ID by name
  private getStatusIdByName(statusName: string): number | null {
    if (!statusName) return null;
    
    const status = this.statuses.find(s => s.status === statusName);
    return status ? status.idstatus : null;
  }
}