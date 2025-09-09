import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
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

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.scss']
})
export class RequestListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<Solicitacao>();
  displayedColumns: string[] = ['id', 'complemento', 'tipoSolicitacao', 'processo', 'correspondente', 'status', 'actions'];
  loading = true;
  statuses: SolicitacaoStatus[] = [];
  
  // Filter properties
  filterStatus: string = '';
  filterSearch: string = '';
  filterProcesso: string = '';
  filterComarca: number | null = null;
  filterOrgao: number | null = null;
  
  // Filter options
  processos: Processo[] = [];
  comarcas: Comarca[] = [];
  orgaos: Orgao[] = [];

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
    console.log('Inicializando componente de listagem de solicitações'); // Adicionando log para debug
    this.loadRequests();
    this.loadStatuses();
    this.loadFilterOptions();
    
    // Verificando se o paginator está disponível
    console.log('Paginator disponível no ngOnInit:', this.paginator); // Adicionando log para debug
  }

  ngAfterViewInit(): void {
    // Ensure paginator is connected to data source
    console.log('Configurando paginator'); // Adicionando log para debug
    this.dataSource.paginator = this.paginator;
    console.log('Paginator configurado:', this.paginator); // Adicionando log para debug
    console.log('DataSource paginator:', this.dataSource.paginator); // Adicionando log para debug
    
    // Forçando a detecção de mudanças
    this.cdr.detectChanges();
    console.log('Detecção de mudanças forçada após configuração do paginator'); // Adicionando log para debug
  }

  loadRequests(): void {
    this.solicitacaoService.getSolicitacoes().subscribe({
      next: (solicitacoes) => {
        console.log('Solicitações carregadas:', solicitacoes); // Adicionando log para debug
        console.log('Quantidade de solicitações:', solicitacoes.length); // Adicionando log para debug
        
        // Verificando se os dados estão corretos
        if (Array.isArray(solicitacoes)) {
          console.log('Os dados são um array'); // Adicionando log para debug
          this.dataSource.data = solicitacoes;
          
          // Verificando se os dados foram atribuídos corretamente
          console.log('Dados atribuídos ao dataSource:', this.dataSource.data); // Adicionando log para debug
          console.log('Tamanho do dataSource:', this.dataSource.data.length); // Adicionando log para debug
          
          // Verificando se o paginator está conectado
          console.log('Paginator está conectado:', this.paginator); // Adicionando log para debug
          console.log('DataSource paginator:', this.dataSource.paginator); // Adicionando log para debug
          
          // Forçando a detecção de mudanças
          this.cdr.detectChanges();
          console.log('Detecção de mudanças forçada'); // Adicionando log para debug
          
          // Tentando conectar o paginator novamente após a detecção de mudanças
          setTimeout(() => {
            if (this.paginator) {
              console.log('Conectando paginator após detecção de mudanças'); // Adicionando log para debug
              this.dataSource.paginator = this.paginator;
              console.log('Paginator conectado após detecção de mudanças:', this.paginator); // Adicionando log para debug
              console.log('DataSource paginator após conexão:', this.dataSource.paginator); // Adicionando log para debug
              
              // Forçando a detecção de mudanças novamente
              this.cdr.detectChanges();
              console.log('Detecção de mudanças forçada após conexão do paginator'); // Adicionando log para debug
            }
          }, 100);
        } else {
          console.error('Os dados não são um array:', solicitacoes); // Adicionando log para debug
          this.dataSource.data = [];
        }
        
        this.loading = false;
        
        // Tentando conectar o paginator novamente após o carregamento dos dados
        setTimeout(() => {
          if (this.paginator) {
            console.log('Conectando paginator após carregamento dos dados'); // Adicionando log para debug
            this.dataSource.paginator = this.paginator;
            console.log('Paginator conectado após carregamento dos dados:', this.paginator); // Adicionando log para debug
            console.log('DataSource paginator após conexão:', this.dataSource.paginator); // Adicionando log para debug
            
            // Forçando a detecção de mudanças novamente
            this.cdr.detectChanges();
            console.log('Detecção de mudanças forçada após conexão do paginator'); // Adicionando log para debug
            
            // Atualizando a tabela
            this.refreshTable();
          }
        }, 200);
        
        // Forçando a atualização da tabela imediatamente
        this.refreshTable();
        
        // Forçando a atualização da tabela após um pequeno delay
        setTimeout(() => {
          this.refreshTable();
        }, 300);
        
        // Forçando a atualização da tabela após um delay maior
        setTimeout(() => {
          this.refreshTable();
        }, 500);
        
        // Forçando a atualização da tabela após um delay ainda maior
        setTimeout(() => {
          this.refreshTable();
        }, 1000);
        
        // Forçando a atualização da tabela após um delay muito maior
        setTimeout(() => {
          this.refreshTable();
        }, 2000);
        
        // Forçando a atualização da tabela após um delay extremamente maior
        setTimeout(() => {
          this.refreshTable();
        }, 5000);
        
        // Forçando a atualização da tabela após um delay extremamente maior ainda
        setTimeout(() => {
          this.refreshTable();
        }, 10000);
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.dataSource.data = [];
        this.loading = false;
      }
    });
  }
  
  // Método para forçar a atualização da tabela
  refreshTable(): void {
    console.log('Atualizando tabela'); // Adicionando log para debug
    this.cdr.detectChanges();
    console.log('Detecção de mudanças forçada na atualização da tabela'); // Adicionando log para debug
    
    // Forçando a atualização da tabela novamente
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('Detecção de mudanças forçada na atualização da tabela (segunda vez)'); // Adicionando log para debug
    }, 100);
  }
  
  private connectPaginator(): void {
    // This method is no longer needed with the simplified approach
  }

  loadStatuses(): void {
    this.solicitacaoStatusService.getSolicitacaoStatuses().subscribe({
      next: (statuses) => {
        console.log('Status das solicitações carregados:', statuses); // Adicionando log para debug
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
        console.log('Processos carregados:', processos); // Adicionando log para debug
        this.processos = processos;
      },
      error: (error) => {
        console.error('Error loading processos:', error);
      }
    });

    // Load comarcas
    this.comarcaService.getComarcas().subscribe({
      next: (comarcas) => {
        console.log('Comarcas carregadas:', comarcas); // Adicionando log para debug
        this.comarcas = comarcas;
      },
      error: (error) => {
        console.error('Error loading comarcas:', error);
      }
    });

    // Load orgaos
    this.orgaoService.getOrgaos().subscribe({
      next: (orgaos) => {
        console.log('Órgãos carregados:', orgaos); // Adicionando log para debug
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
    console.log('Aplicando filtros:'); // Adicionando log para debug
    console.log('Status:', this.filterStatus); // Adicionando log para debug
    console.log('Pesquisa:', this.filterSearch); // Adicionando log para debug
    console.log('Processo:', this.filterProcesso); // Adicionando log para debug
    console.log('Comarca:', this.filterComarca); // Adicionando log para debug
    console.log('Órgão:', this.filterOrgao); // Adicionando log para debug
    
    this.dataSource.filterPredicate = (solicitacao: Solicitacao, filter: string): boolean => {
      // Filter by status
      const statusMatch = this.filterStatus ? 
        solicitacao.statusSolicitacao?.status === this.filterStatus : true;
      
      // Filter by search term (in complemento field)
      const searchMatch = this.filterSearch ? 
        solicitacao.complemento?.toLowerCase().includes(this.filterSearch.toLowerCase()) : true;
      
      // Filter by processo
      const processoMatch = this.filterProcesso ? 
        solicitacao.processo?.numeroprocesso?.toLowerCase().includes(this.filterProcesso.toLowerCase()) : true;
      
      // Filter by comarca
      const comarcaMatch = this.filterComarca ? 
        solicitacao.processo?.comarca?.id === this.filterComarca : true;
      
      // Filter by orgao
      const orgaoMatch = this.filterOrgao ? 
        solicitacao.processo?.orgao?.id === this.filterOrgao : true;
      
      console.log('Resultado do filtro para solicitação', solicitacao.id, ':', 
                  statusMatch && searchMatch && processoMatch && comarcaMatch && orgaoMatch); // Adicionando log para debug
      
      return Boolean(statusMatch && searchMatch && processoMatch && comarcaMatch && orgaoMatch);
    };

    // Trigger the filter
    this.dataSource.filter = 'trigger';
    
    // Reset paginator to first page when filtering
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  clearFilters(): void {
    console.log('Limpando filtros'); // Adicionando log para debug
    this.filterStatus = '';
    this.filterSearch = '';
    this.filterProcesso = '';
    this.filterComarca = null;
    this.filterOrgao = null;
    
    // Clear the filter
    this.dataSource.filter = '';
    
    // Reset paginator to first page when clearing filters
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }
  
  // Updated delete request method with confirmation dialog
  deleteRequest(id: number): void {
    // Find the request to get its description for the confirmation dialog
    const solicitacao = this.dataSource.data.find(s => s.id === id);
    const descricao = solicitacao?.complemento || `ID: ${id}`;
    
    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir a solicitação "${descricao}"?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.solicitacaoService.deleteSolicitacao(id).subscribe({
          next: () => {
            // Remove the deleted request from the data source
            const updatedData = this.dataSource.data.filter(s => s.id !== id);
            this.dataSource.data = updatedData;
            
            // If we're using pagination, we might need to refresh the paginator
            if (this.paginator) {
              this.paginator._changePageSize(this.paginator.pageSize);
            }
            
            // Show success message
            this.snackBar.open('Solicitação excluída com sucesso!', 'Fechar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Erro ao excluir solicitação:', error);
            
            // Show error message
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