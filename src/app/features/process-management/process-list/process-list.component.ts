import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ProcessoService } from '../../../core/services/processo.service';
import { ComarcaService } from '../../../core/services/comarca.service';
import { OrgaoService } from '../../../core/services/orgao.service';
import { PermissionService } from '../../../core/services/permission.service';
import { Processo } from '../../../shared/models/processo.model';
import { Comarca } from '../../../shared/models/comarca.model';
import { Orgao } from '../../../shared/models/orgao.model';
import { Subscription } from 'rxjs';
import { PaginatedResponse } from '../../../shared/models/api-response.model';

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.scss']
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

  constructor(
    private processoService: ProcessoService,
    private comarcaService: ComarcaService,
    private orgaoService: OrgaoService,
    public permissionService: PermissionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    console.log('ProcessListComponent constructor'); // Debug log
  }

  ngOnInit(): void {
    console.log('ProcessListComponent ngOnInit'); // Debug log
    this.loadFilterOptions();
    this.setupFilters();
    this.setupThemeListener();
  }

  ngAfterViewInit(): void {
    console.log('ProcessListComponent ngAfterViewInit'); // Debug log
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
    console.log('ProcessListComponent ngOnDestroy'); // Debug log
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  setupThemeListener(): void {
    console.log('Setting up theme listener...'); // Debug log
    // Listen for theme changes to trigger change detection
    this.themeSubscription = new Subscription();
    const themeHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
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
    console.log('Loading processes...'); // Debug log
    this.loading = true;
    
    // Check filter values
    const searchTerm = this.searchControl.value;
    const comarcaFilter = this.comarcaFilterControl.value;
    const orgaoFilter = this.orgaoFilterControl.value;
    const statusFilter = this.statusFilterControl.value;
    
    console.log('Filter values:', { searchTerm, comarcaFilter, orgaoFilter, statusFilter }); // Debug log

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
    } else if (comarcaFilter) {
      // Use comarca filter endpoint with pagination
      this.processoService.searchByComarcaPaginated(
        Number(comarcaFilter),
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse<Processo>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else if (orgaoFilter) {
      // Use orgao filter endpoint with pagination
      this.processoService.searchByOrgaoPaginated(
        Number(orgaoFilter),
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response: PaginatedResponse<Processo>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else if (statusFilter) {
      // Use status filter endpoint with pagination
      this.processoService.searchByStatusPaginated(
        statusFilter,
        this.currentPage,
        this.pageSize
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
    console.log('Processes loaded:', response.content.length); // Debug log
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
    console.error('Error loading processes:', error);
    this.loading = false;
    this.snackBar.open('Erro ao carregar processos', 'Fechar', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  loadFilterOptions(): void {
    console.log('Loading filter options...'); // Debug log
    
    // Try to load comarcas using the DTO method first
    this.comarcaService.getAllComarcasDto().subscribe({
      next: (comarcas) => {
        console.log('Comarcas loaded from DTO API:', comarcas); // Debug log
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
        console.log('Orgaos loaded:', orgaos); // Debug log
        this.orgaos = orgaos;
        console.log('Number of orgaos:', this.orgaos.length); // Debug log
        
        // Check if orgaos have the expected structure
        if (this.orgaos.length > 0) {
          console.log('First orgao:', this.orgaos[0]); // Debug log
          console.log('First orgao keys:', Object.keys(this.orgaos[0])); // Debug log
        }
      },
      error: (error) => {
        console.error('Error loading orgaos:', error);
        console.error('Error details:', error.message); // Debug log
        console.error('Error status:', error.status); // Debug log
      }
    });
  }

  private loadComarcasFallback(): void {
    console.log('Loading comarcas with fallback method...'); // Debug log
    // Load comarcas using the regular method
    this.comarcaService.getAllComarcas().subscribe({
      next: (comarcas) => {
        console.log('Comarcas loaded from regular API:', comarcas); // Debug log
        this.comarcas = comarcas || [];
        this.processComarcasData();
      },
      error: (error) => {
        console.error('Error loading comarcas with fallback method:', error);
        console.error('Error details:', error.message); // Debug log
        console.error('Error status:', error.status); // Debug log
        // Show error to user
        this.snackBar.open('Erro ao carregar comarcas', 'Fechar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private processComarcasData(): void {
    console.log('Processing comarcas data...'); // Debug log
    console.log('Comarcas before filtering:', this.comarcas); // Debug log
    
    // Less strict filtering - only remove completely invalid entries
    const validComarcas = this.comarcas.filter(comarca => 
      comarca && comarca.id && comarca.nome
    );
    
    console.log('Comarcas after filtering:', validComarcas); // Debug log
    this.comarcas = validComarcas;
    
    console.log('Final comarcas count:', this.comarcas.length); // Debug log
    
    // Check if comarcas have the expected structure
    if (this.comarcas.length > 0) {
      console.log('First comarca:', this.comarcas[0]); // Debug log
      
      // Check if the first comarca has the expected properties
      const firstComarca = this.comarcas[0];
      console.log('First comarca id:', firstComarca.id); // Debug log
      console.log('First comarca nome:', firstComarca.nome); // Debug log
      console.log('First comarca uf:', firstComarca.uf); // Debug log
      if (firstComarca.uf) {
        console.log('First comarca uf sigla:', firstComarca.uf?.sigla); // Debug log
      }
    }
  }

  setupFilters(): void {
    console.log('Setting up filters...'); // Debug log
    
    // Search filter with shorter debounce time for more responsive search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(200), // Reduced from 300ms for more responsive feeling
        distinctUntilChanged()
      )
      .subscribe(value => {
        console.log('Search filter changed:', value); // Debug log
        this.currentPage = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadProcesses();
      });

    // Comarca filter
    this.comarcaFilterControl.valueChanges.subscribe(() => {
      console.log('Comarca filter changed:', this.comarcaFilterControl.value); // Debug log
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadProcesses();
    });

    // Orgao filter
    this.orgaoFilterControl.valueChanges.subscribe(() => {
      console.log('Orgao filter changed:', this.orgaoFilterControl.value); // Debug log
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadProcesses();
    });

    // Status filter
    this.statusFilterControl.valueChanges.subscribe(() => {
      console.log('Status filter changed:', this.statusFilterControl.value); // Debug log
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadProcesses();
    });
  }

  applyFilters(): void {
    console.log('Applying filters...'); // Debug log
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadProcesses();
  }

  clearFilters(): void {
    console.log('Clearing filters...'); // Debug log
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
    console.log('Paginator page changed:', event); // Debug log
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
    console.log('getComarcaText called with:', comarca); // Debug log
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