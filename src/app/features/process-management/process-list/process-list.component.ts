import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { ProcessoService } from '../../../core/services/processo.service';
import { ComarcaService } from '../../../core/services/comarca.service';
import { OrgaoService } from '../../../core/services/orgao.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Processo } from '../../../shared/models/processo.model';
import { Comarca } from '../../../shared/models/comarca.model';
import { Orgao } from '../../../shared/models/orgao.model';
import { Subscription } from 'rxjs';
import { PaginatedResponse } from '../../../shared/models/api-response.model';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface ProcessFilter {
  comarcaId?: number;
  orgaoId?: number;
  status?: string;
}

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    RouterModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ]
})
export class ProcessListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Processo>();
  displayedColumns: string[] = ['numeroprocesso', 'parte', 'adverso', 'cartorio', 'localizacao', 'comarca', 'orgao', 'assunto', 'proceletronico', 'status', 'actions'];
  loading = true;
  
  // Filter controls
  searchControl = new FormControl('');
  comarcaFilterControl = new FormControl('');
  orgaoFilterControl = new FormControl('');
  statusFilterControl = new FormControl('');
  
  // Filter options
  comarcas: Comarca[] = [];
  orgaos: Orgao[] = [];
  statusOptions = [
    { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'ARQUIVADO', label: 'Arquivado' },
    { value: 'FINALIZADO', label: 'Finalizado' }
  ];

  // Pagination properties
  pageSize = 20;
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];
  totalElements = 0;
  currentPage = 0;
  sortBy = 'id';
  sortDirection = 'ASC';

  private themeSubscription: Subscription | null = null;

  // Using inject() function instead of constructor injection
  private processoService = inject(ProcessoService);
  private comarcaService = inject(ComarcaService);
  private orgaoService = inject(OrgaoService);
  public permissionService = inject(PermissionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadFilterOptions();
    this.setupFilters();
    this.setupThemeListener();
  }

  ngAfterViewInit(): void {
    // Set up sort
    if (this.sort) {
      this.sort.sortChange.subscribe((sortState: Sort) => {
        this.sortBy = sortState.active;
        this.sortDirection = sortState.direction.toUpperCase() || 'ASC';
        this.currentPage = 0;
        this.loadProcesses();
      });
    }
    
    // Load initial data
    this.loadProcesses();
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

  loadProcesses(): void {
    this.loading = true;
    
    // Check filter values
    const searchTerm = this.searchControl.value;
    const comarcaFilter = this.comarcaFilterControl.value;
    const orgaoFilter = this.orgaoFilterControl.value;
    const statusFilter = this.statusFilterControl.value;

    // Create filter object
    const filtro: ProcessFilter = {};
    if (comarcaFilter) filtro.comarcaId = Number(comarcaFilter);
    if (orgaoFilter) filtro.orgaoId = Number(orgaoFilter);
    if (statusFilter) filtro.status = statusFilter;

    if (searchTerm) {
      // Use search endpoint with pagination
      this.processoService.searchProcessosPaginated(
        searchTerm,
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      ).subscribe({
        next: (response: PaginatedResponse<Processo>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else if (Object.keys(filtro).length > 0) {
      // Use new filter endpoint with pagination
      this.processoService.getProcessosWithFilter(
        filtro,
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      ).subscribe({
        next: (response: PaginatedResponse<Processo>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else {
      // Use default endpoint with pagination
      this.processoService.getProcessosPaginated(
        this.currentPage,
        this.pageSize,
        this.sortBy,
        this.sortDirection
      ).subscribe({
        next: (response: PaginatedResponse<Processo>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    }
  }

  private handlePaginatedResponse(response: PaginatedResponse<Processo>): void {
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
    console.error('Error loading processes:', error);
    this.loading = false;
    this.snackBar.open('Erro ao carregar processos', 'Fechar', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  loadFilterOptions(): void {
    // Try to load comarcas using the DTO method first
    this.comarcaService.getAllComarcasDto().subscribe({
      next: (comarcas) => {
        if (comarcas && comarcas.length > 0) {
          this.comarcas = comarcas;
          this.processComarcasData();
        } else {
          // Fallback to the regular method if DTO returns no data
          this.loadComarcasFallback();
        }
      },
      error: (error) => {
        console.error('Error loading comarcas with DTO method:', error);
        // Fallback to the regular method if DTO method fails
        this.loadComarcasFallback();
      }
    });

    // Load orgaos
    this.orgaoService.getOrgaos().subscribe({
      next: (orgaos) => {
        this.orgaos = orgaos;
      },
      error: (error) => {
        console.error('Error loading orgaos:', error);
        console.error('Error details:', error.message);
        console.error('Error status:', error.status);
      }
    });
  }

  private loadComarcasFallback(): void {
    // Load comarcas using the regular method
    this.comarcaService.getAllComarcas().subscribe({
      next: (comarcas) => {
        this.comarcas = comarcas || [];
        this.processComarcasData();
      },
      error: (error) => {
        console.error('Error loading comarcas with fallback method:', error);
        console.error('Error details:', error.message);
        console.error('Error status:', error.status);
        // Show error to user
        this.snackBar.open('Erro ao carregar comarcas', 'Fechar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private processComarcasData(): void {
    // Less strict filtering - only remove completely invalid entries
    const validComarcas = this.comarcas.filter(comarca => 
      comarca && comarca.id && comarca.nome
    );
    
    this.comarcas = validComarcas;
  }

  setupFilters(): void {
    // Search filter with shorter debounce time for more responsive search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(200), // Reduced from 300ms for more responsive feeling
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadProcesses();
      });

    // Comarca filter
    this.comarcaFilterControl.valueChanges.subscribe(() => {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadProcesses();
    });

    // Orgao filter
    this.orgaoFilterControl.valueChanges.subscribe(() => {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadProcesses();
    });

    // Status filter
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadProcesses();
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadProcesses();
  }

  clearFilters(): void {
    // Reset all filter controls
    this.searchControl.setValue('');
    this.comarcaFilterControl.setValue('');
    this.orgaoFilterControl.setValue('');
    this.statusFilterControl.setValue('');
    
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    
    // Load processes with cleared filters
    this.loadProcesses();
  }

  // Handle paginator page change events
  paginatorPageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProcesses();
  }

  getStatusText(status?: string): string {
    if (!status) return 'Indefinido';
    switch (status) {
      case 'EM_ANDAMENTO': return 'Em Andamento';
      case 'SUSPENSO': return 'Suspenso';
      case 'ARQUIVADO': return 'Arquivado';
      case 'FINALIZADO': return 'Finalizado';
      default: return status;
    }
  }

  getStatusClass(status?: string): string {
    if (!status) return '';
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  getComarcaText(comarca?: Comarca): string {
    if (!comarca) return '-';
    // Added additional safety checks
    if (!comarca.nome) return '-';
    if (comarca.uf && comarca.uf.sigla) {
      return `${comarca.nome}/${comarca.uf.sigla}`;
    }
    return comarca.nome;
  }

  getOrgaoText(orgao?: Orgao): string {
    if (!orgao || !orgao.descricao) return '-';
    return orgao.descricao;
  }

  viewProcess(processo: Processo): void {
    this.router.navigate(['/processos', processo.id]);
  }

  editProcess(processo: Processo): void {
    this.router.navigate(['/processos/editar', processo.id]);
  }
}