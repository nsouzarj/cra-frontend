import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { Correspondente } from '../../../shared/models/correspondente.model';

@Component({
  selector: 'app-correspondent-list',
  templateUrl: './correspondent-list.component.html',
  styleUrls: ['./correspondent-list.component.scss']
})
export class CorrespondentListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Correspondente>();
  displayedColumns: string[] = ['id', 'nome', 'cpfcnpj', 'oab', 'emailprimario', 'telefoneprimario', 'cidade', 'ativo', 'dataInclusao', 'actions'];
  loading = true;
  
  searchControl = new FormControl('');
  typeFilterControl = new FormControl('');
  statusFilterControl = new FormControl('');

  constructor(
    private correspondenteService: CorrespondenteService,
    public authService: AuthService,
    public permissionService: PermissionService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCorrespondentes();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    // Ensure paginator is connected to data source
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCorrespondentes(): void {
    this.loading = true;
    this.correspondenteService.getCorrespondentes().subscribe({
      next: (correspondents) => {
        this.dataSource.data = correspondents;
        this.loading = false;
        
        // Connect paginator after data is loaded with a slight delay to ensure DOM is updated
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        }, 0);
      },
      error: (error) => {
        console.error('Error loading correspondents:', error);
        this.loading = false;
        this.snackBar.open('Erro ao carregar correspondentes', 'Fechar', {
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

    // Type filter
    this.typeFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Status filter
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.dataSource.filterPredicate = (correspondent: Correspondente, filter: string): boolean => {
      const searchTerm = this.searchControl.value?.toLowerCase() || '';
      const typeFilter = this.typeFilterControl.value;
      const statusFilter = this.statusFilterControl.value;

      // Search filter
      const matchesSearch = !searchTerm || 
        correspondent.nome.toLowerCase().includes(searchTerm) ||
        (correspondent.cpfcnpj ? correspondent.cpfcnpj.toLowerCase().includes(searchTerm) : false) ||
        (correspondent.oab ? correspondent.oab.toLowerCase().includes(searchTerm) : false) ||
        (correspondent.emailprimario ? correspondent.emailprimario.toLowerCase().includes(searchTerm) : false);  // Fixed field name

      // Type filter
      const matchesType = !typeFilter || typeFilter === '' || correspondent.tipo === typeFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== null && statusFilter !== undefined && statusFilter !== '') {
        if (statusFilter === 'true') {
          matchesStatus = correspondent.ativo === true;
        } else if (statusFilter === 'false') {
          matchesStatus = correspondent.ativo === false;
        }
      }

      return Boolean(matchesSearch && matchesType && matchesStatus);
    };

    this.dataSource.filter = 'trigger'; // Trigger filter
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.typeFilterControl.setValue('');
    this.statusFilterControl.setValue('');
  }

  viewCorrespondent(correspondent: Correspondente): void {
    this.router.navigate(['/correspondentes', correspondent.id]);
  }

  editCorrespondent(correspondent: Correspondente): void {
    this.router.navigate(['/correspondentes/editar', correspondent.id]);
  }

  toggleCorrespondentStatus(correspondent: Correspondente): void {
    if (!correspondent.id) return;

    const action = correspondent.ativo ? 'desativar' : 'ativar';
    const service = correspondent.ativo ? 
      this.correspondenteService.deactivateCorrespondente(correspondent.id) : 
      this.correspondenteService.activateCorrespondente(correspondent.id);

    service.subscribe({
      next: (updatedCorrespondent) => {
        const index = this.dataSource.data.findIndex(c => c.id === correspondent.id);
        if (index !== -1) {
          this.dataSource.data[index] = updatedCorrespondent;
          this.dataSource._updateChangeSubscription();
        }
        
        this.snackBar.open(`Correspondente ${action}do com sucesso!`, 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error(`Error ${action}ing correspondent:`, error);
        this.snackBar.open(`Erro ao ${action} correspondente`, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  duplicateCorrespondent(correspondent: Correspondente): void {
    const duplicated = { ...correspondent };
    delete duplicated.id;
    duplicated.nome = `${correspondent.nome} - Cópia`;
    duplicated.cpfcnpj = '';
    duplicated.oab = '';
    
    this.router.navigate(['/correspondentes/novo'], { 
      state: { correspondent: duplicated } 
    });
  }

  deleteCorrespondent(correspondent: Correspondente): void {
    // Check if correspondent has a valid ID
    if (!correspondent.id) {
      this.snackBar.open('Não foi possível excluir o correspondente: ID inválido', 'Fechar', {
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
        message: `Tem certeza que deseja excluir o correspondente "${correspondent.nome}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.correspondenteService.deleteCorrespondente(correspondent.id!).subscribe({
          next: () => {
            this.dataSource.data = this.dataSource.data.filter(c => c.id !== correspondent.id);
            this.snackBar.open('Correspondente excluído com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Error deleting correspondent:', error);
            this.snackBar.open('Erro ao excluir correspondente', 'Fechar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  exportData(): void {
    // Open confirmation dialog
    const dialogData: ConfirmationDialogData = {
      title: 'Confirmar Exportação',
      message: 'Tem certeza que deseja exportar os dados dos correspondentes?',
      confirmText: 'SIM',
      cancelText: 'NÃO'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // This would typically export to CSV or Excel
        this.snackBar.open('Funcionalidade de exportação será implementada', 'Fechar', {
          duration: 3000,
          panelClass: ['info-snackbar']
        });
      }
    });
  }

  getFormattedType(type: string | undefined): string {
    switch (type) {
      case 'PESSOA_FISICA':
        return 'Pessoa Física';
      case 'PESSOA_JURIDICA':
        return 'Pessoa Jurídica';
      default:
        return type || 'Não informado';
    }
  }
}