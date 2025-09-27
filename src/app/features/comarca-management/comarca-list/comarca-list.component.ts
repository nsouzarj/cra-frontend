import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Subscription } from 'rxjs';

import { ComarcaService } from '../../../core/services/comarca.service';
import { UfService } from '../../../core/services/uf.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Comarca } from '../../../shared/models/comarca.model';
import { Uf } from '../../../shared/models/uf.model';
import { PaginatedResponse } from '../../../shared/models/api-response.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-comarca-list',
  templateUrl: './comarca-list.component.html',
  styleUrls: ['./comarca-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatMenuModule
  ]
})
export class ComarcaListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Comarca>();
  displayedColumns: string[] = ['id', 'nome', 'uf', 'ativo', 'actions'];
  loading = true;
  
  searchControl = new FormControl('');
  ufFilterControl = new FormControl('');
  statusFilterControl = new FormControl('');
  
  ufs: Uf[] = [];
  
  // Pagination properties
  pageSize = 20;
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];
  totalElements = 0;
  currentPage = 0;
  sortBy = 'nome';
  sortDirection = 'ASC';

  private themeSubscription: Subscription | null = null;

  constructor(
    private comarcaService: ComarcaService,
    private ufService: UfService,
    public authService: AuthService,
    public permissionService: PermissionService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUfs();
    this.setupFilters();
    this.setupThemeListener();
  }

  ngAfterViewInit(): void {
    // Set up sort
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.sortBy = this.sort.active;
        this.sortDirection = this.sort.direction.toUpperCase() || 'ASC';
        this.currentPage = 0;
        this.loadComarcas();
      });
    }
    
    // Load initial data
    this.loadComarcas();
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
    };
    
    window.addEventListener('themeChanged', themeHandler);
    // Clean up the event listener when component is destroyed
    this.themeSubscription.add(() => {
      window.removeEventListener('themeChanged', themeHandler);
    });
  }

  loadComarcas(): void {
    this.loading = true;
    
    // Check if we have a search term
    const searchTerm = this.searchControl.value;
    const ufFilter = this.ufFilterControl.value;
    
    if (searchTerm) {
      // Use search endpoint
      this.comarcaService.searchByName(
        searchTerm, 
        this.currentPage, 
        this.pageSize, 
        this.sortBy, 
        this.sortDirection
      ).subscribe({
        next: (response: PaginatedResponse<Comarca>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    } else if (ufFilter) {
      // Use UF filter endpoint
      const selectedUf = this.ufs.find(uf => uf.id === Number(ufFilter));
      if (selectedUf) {
        this.comarcaService.getByUfSigla(
          selectedUf.sigla, 
          this.currentPage, 
          this.pageSize
        ).subscribe({
          next: (response: PaginatedResponse<Comarca>) => {
            this.handlePaginatedResponse(response);
          },
          error: (error) => {
            this.handleLoadError(error);
          }
        });
      } else {
        // Load all comarcas
        this.comarcaService.getComarcas(
          this.currentPage, 
          this.pageSize, 
          this.sortBy, 
          this.sortDirection
        ).subscribe({
          next: (response: PaginatedResponse<Comarca>) => {
            this.handlePaginatedResponse(response);
          },
          error: (error) => {
            this.handleLoadError(error);
          }
        });
      }
    } else {
      // Use default endpoint
      this.comarcaService.getComarcas(
        this.currentPage, 
        this.pageSize, 
        this.sortBy, 
        this.sortDirection
      ).subscribe({
        next: (response: PaginatedResponse<Comarca>) => {
          this.handlePaginatedResponse(response);
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
    }
  }

  private handlePaginatedResponse(response: PaginatedResponse<Comarca>): void {
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
    console.error('Error loading comarcas:', error);
    this.loading = false;
    this.snackBar.open('Erro ao carregar comarcas', 'Fechar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  loadUfs(): void {
    this.ufService.getUfs().subscribe({
      next: (ufs) => {
        this.ufs = ufs;
      },
      error: (error) => {
        console.error('Error loading UFs:', error);
        this.snackBar.open('Erro ao carregar estados', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  setupFilters(): void {
    // Search filter
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => {
        this.currentPage = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadComarcas();
      });

    // UF filter
    this.ufFilterControl.valueChanges.subscribe((ufId) => {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadComarcas();
    });

    // Status filter
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.pageIndex = 0;
      }
      this.loadComarcas();
    });
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.ufFilterControl.setValue('');
    this.statusFilterControl.setValue('');
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadComarcas();
  }

  viewComarca(comarca: Comarca): void {
    this.router.navigate(['/comarcas', comarca.id]);
  }

  editComarca(comarca: Comarca): void {
    this.router.navigate(['/comarcas/editar', comarca.id]);
  }

  toggleComarcaStatus(comarca: Comarca): void {
    // Check if comarca has a valid ID
    if (!comarca.id) {
      this.snackBar.open('Não foi possível alterar o status da comarca: ID inválido', 'Fechar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const action = comarca.ativo ? 'desativar' : 'ativar';
    
    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `Tem certeza que deseja ${action} a comarca "${comarca.nome}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const updatedComarca = { ...comarca, ativo: !comarca.ativo };

        this.comarcaService.updateComarca(comarca.id!, updatedComarca).subscribe({
          next: (updated) => {
            const index = this.dataSource.data.findIndex(c => c.id === comarca.id);
            if (index !== -1) {
              this.dataSource.data[index] = updated;
              this.dataSource._updateChangeSubscription();
            }
            
            this.snackBar.open(`Comarca ${action}da com sucesso!`, 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error(`Error ${action}ing comarca:`, error);
            this.snackBar.open(`Erro ao ${action} comarca`, 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  deleteComarca(comarca: Comarca): void {
    if (!comarca.id) {
      this.snackBar.open('Não foi possível excluir a comarca: ID inválido', 'Fechar', {
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
        message: `Tem certeza que deseja excluir a comarca "${comarca.nome}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.comarcaService.deleteComarca(comarca.id!).subscribe({
          next: () => {
            // After deletion, reload the current page
            this.loadComarcas();
            this.snackBar.open('Comarca excluída com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Error deleting comarca:', error);
            this.snackBar.open('Erro ao excluir comarca', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  // Handle paginator page change events
  paginatorPageChanged(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadComarcas();
  }
}