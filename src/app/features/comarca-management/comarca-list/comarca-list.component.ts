import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
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

@Component({
  selector: 'app-comarca-list',
  templateUrl: './comarca-list.component.html',
  styleUrls: ['./comarca-list.component.scss']
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
    this.loadComarcas();
    this.loadUfs();
    this.setupFilters();
    this.setupThemeListener();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
    this.comarcaService.getComarcas().subscribe({
      next: (comarcas) => {
        this.dataSource.data = comarcas;
        this.loading = false;
        
        // Connect paginator after data is loaded
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        }, 0);
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
        this.loading = false;
        this.snackBar.open('Erro ao carregar comarcas', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
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
        this.applyFilters();
      });

    // UF filter
    this.ufFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Status filter
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.dataSource.filterPredicate = (comarca: Comarca, filter: string): boolean => {
      const searchTerm = this.searchControl.value?.toLowerCase() || '';
      const ufFilter = this.ufFilterControl.value;
      const statusFilter = this.statusFilterControl.value;

      // Search filter
      const matchesSearch = !searchTerm || 
        comarca.nome.toLowerCase().includes(searchTerm) ||
        comarca.uf.nome.toLowerCase().includes(searchTerm) ||
        comarca.uf.sigla.toLowerCase().includes(searchTerm);

      // UF filter
      const matchesUf = !ufFilter || ufFilter === '' || comarca.uf.id === Number(ufFilter);

      // Status filter
      let statusFilterValue: boolean | null = null;
      if (statusFilter === 'true') {
        statusFilterValue = true;
      } else if (statusFilter === 'false') {
        statusFilterValue = false;
      }
      
      const matchesStatus = !statusFilter || statusFilter === '' || 
                           (statusFilterValue !== null && comarca.ativo === statusFilterValue);

      return Boolean(matchesSearch && matchesUf && matchesStatus);
    };

    this.dataSource.filter = 'trigger'; // Trigger filter
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.ufFilterControl.setValue('');
    this.statusFilterControl.setValue('');
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
            this.dataSource.data = this.dataSource.data.filter(c => c.id !== comarca.id);
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
}