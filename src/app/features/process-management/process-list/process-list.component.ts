import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.scss']
})
export class ProcessListComponent implements OnInit, AfterViewInit {
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

  constructor(
    private processoService: ProcessoService,
    private comarcaService: ComarcaService,
    private orgaoService: OrgaoService,
    public permissionService: PermissionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProcesses();
    this.loadFilterOptions();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    // Ensure paginator is connected to data source
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProcesses(): void {
    this.processoService.getProcessos().subscribe({
      next: (processos) => {
        this.dataSource.data = processos;
        this.loading = false;
        
        // Connect paginator after data is loaded with a slight delay to ensure DOM is updated
        setTimeout(() => {
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        }, 0);
      },
      error: (error) => {
        console.error('Error loading processes:', error);
        this.loading = false;
        this.snackBar.open('Erro ao carregar processos', 'Fechar', { duration: 5000 });
      }
    });
  }

  loadFilterOptions(): void {
    // Load comarcas
    this.comarcaService.getComarcas().subscribe({
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

  setupFilters(): void {
    // Search filter with shorter debounce time for more responsive search
    this.searchControl.valueChanges
      .pipe(
        debounceTime(200), // Reduced from 300ms for more responsive feeling
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.applyFilters();
      });

    // Comarca filter
    this.comarcaFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Orgao filter
    this.orgaoFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });

    // Status filter
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    this.dataSource.filterPredicate = (processo: Processo, filter: string): boolean => {
      // Get filter values
      const searchTerm = this.searchControl.value?.toLowerCase().trim() || '';
      const comarcaFilter = this.comarcaFilterControl.value;
      const orgaoFilter = this.orgaoFilterControl.value;
      const statusFilter = this.statusFilterControl.value;

      // Search filter (check each searchable field individually)
      const matchesSearch = searchTerm === '' || [
        processo.numeroprocesso, 
        processo.parte,
        processo.adverso,
        processo.cartorio,
        processo.localizacao,
        processo.assunto
      ].some(field => field && field.toLowerCase().includes(searchTerm));

      // Comarca filter
      const matchesComarca = !comarcaFilter || comarcaFilter === '' || 
        !!(processo.comarca && processo.comarca.id === Number(comarcaFilter));

      // Orgao filter
      const matchesOrgao = !orgaoFilter || orgaoFilter === '' || 
        !!(processo.orgao && processo.orgao.id === Number(orgaoFilter));

      // Status filter
      const matchesStatus = !statusFilter || statusFilter === '' || 
        processo.status === statusFilter;

      // All conditions must be met for the item to be included
      // Using Boolean() to ensure we return a boolean value
      return Boolean(matchesSearch && matchesComarca && matchesOrgao && matchesStatus);
    };

    // This actually triggers the filter
    this.dataSource.filter = 'trigger'; 
  }

  clearFilters(): void {
    // Reset all filter controls
    this.searchControl.setValue('');
    this.comarcaFilterControl.setValue('');
    this.orgaoFilterControl.setValue('');
    this.statusFilterControl.setValue('');
    
    // Explicitly apply filters to refresh the table immediately
    this.applyFilters();
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
    return `${comarca.nome}${comarca.uf ? '/' + comarca.uf.sigla : ''}`;
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