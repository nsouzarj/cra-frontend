import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss']
})
export class RequestListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Solicitacao>();
  displayedColumns: string[] = ['id', 'datasolicitacao', 'dataprazo', 'tipoSolicitacao', 'processo', 'correspondente', 'status', 'actions'];
  loading = true;
  statuses: SolicitacaoStatus[] = [];
  
  // Filter properties
  filterStatus: string = '';
  filterSearch: string = '';
  filterProcesso: string = '';
  filterComarca: number | null = null;
  filterOrgao: number | null = null;
  filterDataSolicitacaoFrom: Date | null = null;
  filterDataSolicitacaoTo: Date | null = null;
  filterDataPrazoFrom: Date | null = null;
  filterDataPrazoTo: Date | null = null;
  
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

  constructor(
    private solicitacaoService: SolicitacaoService,
    private solicitacaoStatusService: SolicitacaoStatusService,
    private processoService: ProcessoService,
    private comarcaService: ComarcaService,
    private orgaoService: OrgaoService,
    public authService: AuthService,
    public permissionService: PermissionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

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
    const themeHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
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
    
    // Check if we have a search term
    const searchTerm = this.filterSearch;
    const statusFilter = this.filterStatus;
    const comarcaFilter = this.filterComarca;
    
    if (searchTerm) {
      // Use search endpoint with pagination
      this.solicitacaoService.searchSolicitacoesPaginated(
        searchTerm,
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      ).subscribe({
        next: (response: PaginatedResponse<Solicitacao>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else if (statusFilter) {
      // Use status filter endpoint with pagination
      this.solicitacaoService.searchByStatusPaginated(
        statusFilter,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse<Solicitacao>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else if (comarcaFilter) {
      // Use comarca filter endpoint with pagination
      this.solicitacaoService.searchByComarcaPaginated(
        comarcaFilter,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse<Solicitacao>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else {
      // Use default endpoint with pagination
      this.solicitacaoService.getSolicitacoesPaginated(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      ).subscribe({
        next: (response: PaginatedResponse<Solicitacao>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    }
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

  private handleLoadError(error: any): void {
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

  applyFilter(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadRequests();
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterSearch = '';
    this.filterProcesso = '';
    this.filterComarca = null;
    this.filterOrgao = null;
    this.filterDataSolicitacaoFrom = null;
    this.filterDataSolicitacaoTo = null;
    this.filterDataPrazoFrom = null;
    this.filterDataPrazoTo = null;
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

  viewRequest(solicitacao: Solicitacao): void {
    // Implementation for viewing a request
  }

  editRequest(solicitacao: Solicitacao): void {
    // Implementation for editing a request
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
}