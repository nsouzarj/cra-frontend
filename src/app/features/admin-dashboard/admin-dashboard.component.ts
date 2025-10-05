import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { CorrespondenteService } from '../../core/services/correspondente.service';
import { ProcessoService } from '../../core/services/processo.service';
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../core/services/solicitacao-status.service';
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';
import { ComarcaService } from '../../core/services/comarca.service';
import { DashboardService,  ChartData } from '../../core/services/dashboard.service';
import { User } from '../../shared/models/user.model';
import { Correspondente } from '../../shared/models/correspondente.model';
import { Processo } from '../../shared/models/processo.model';
import { PaginatedResponse } from '../../shared/models/api-response.model';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { TipoSolicitacao } from '../../shared/models/tiposolicitacao.model';
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCorrespondentes: number;
  activeCorrespondentes: number;
  totalProcessos: number;
  processosEmAndamento: number;
  totalSolicitacoes: number;
  solicitacoesPendentes: number;
  totalComarcas?: number;
  comarcasAtivas?: number;
  comarcasInativas?: number;
}

// Add interface for top comarcas
interface TopComarca {
  comarcaId: number;
  comarcaNome: string;
  uf: string;
  count: number;
}

interface TipoSolicitacaoCount {
  audiencia: number;
  diligencia: number
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./dashboard-common.scss'], // Use common dashboard SCSS
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    RouterModule
  ]
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  stats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalCorrespondentes: 0,
    activeCorrespondentes: 0,
    totalProcessos: 0,
    processosEmAndamento: 0,
    totalSolicitacoes: 0,
    solicitacoesPendentes: 0
  };

  tipoSolicitacaoCounts: TipoSolicitacaoCount = {
    audiencia: 0,
    diligencia: 0
  };

  // Add top comarcas array
  topComarcas: TopComarca[] = [];

  // Chart data - now using the imported ChartData interface
  entityTypeChart: ChartData = {
    labels: ['Usuários', 'Correspondentes', 'Processos', 'Solicitações', 'Comarcas'],
    values: [0, 0, 0, 0, 0],
    colors: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#ff6b6b']
  };

  entityStatusChart: ChartData = {
    labels: ['Ativos', 'Inativos', 'Em Andamento', 'Pendentes'],
    values: [0, 0, 0, 0],
    colors: ['#43e97b', '#f5576c', '#4facfe', '#ffcc00']
  };

  solicitacoesPorStatusChart: ChartData = {
    labels: [],
    values: [],
    colors: []
  };

  solicitacoesAtrasadasChart: ChartData = {
    labels: ['1-5 dias', '6-10 dias', '> 10 dias'],
    values: [0, 0, 0],
    colors: ['#f57f17', '#e65100', '#c62828'] // Amarelo forte, Laranja forte, Vermelho forte
  };


  private statusColors: { [key: string]: string } = {
    // Process and general statuses
    'EM_ANDAMENTO': '#4facfe',
    'PENDENTE': '#ffcc00',
    'CONCLUIDO': '#43e97b',
    'CANCELADO': '#f5576c',
    'SUSPENSO': '#ff9800',
    'ARQUIVADO': '#9e9e9e',
    'FINALIZADO': '#2196f3',
    'ABERTO': '#00bcd4',
    'FECHADO': '#607d8b',
    'NOVO': '#9c27b0',
    
    // Confirmation-related statuses
    'Agurdando Confirmação': '#9c27b0',
    'Agurdando Confirmacao': '#9c27b0',
    'Aguardando Confirmação': '#9c27b0',
    'Aguardando Confirmacao': '#9c27b0',
    
    // Additional common statuses
    'APROVADO': '#8bc34a',
    'REJEITADO': '#e91e63',
    'EM_ANALISE': '#ff9800',
    'ANALISE': '#ff9800',
    'PROCESSANDO': '#3f51b5',
    'ENVIADO': '#009688',
    'RECEBIDO': '#cddc39',
    'ATRASADO': '#f44336',
    'URGENTE': '#ff5722',
    
    // Portuguese variations
    'Em Andamento': '#4facfe',
    'Pendente': '#ffcc00',
    'Concluído': '#43e97b',
    'Cancelado': '#f5576c',
    'Suspenso': '#ff9800',
    'Arquivado': '#9e9e9e',
    'Finalizado': '#2196f3',
    'Aprovado': '#8bc34a',
    'Rejeitado': '#e91e63',
    'Em Análise': '#ff9800',
    'Processando': '#3f51b5',
    'Enviado': '#009688',
    'Recebido': '#cddc39'
  };

  // Injected services
  public authService = inject(AuthService);
  private userService = inject(UserService);
  private correspondenteService = inject(CorrespondenteService);
  private processoService = inject(ProcessoService);
  private solicitacaoService = inject(SolicitacaoService);
  private solicitacaoStatusService = inject(SolicitacaoStatusService);
  private tipoSolicitacaoService = inject(TipoSolicitacaoService);
  private comarcaService = inject(ComarcaService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  constructor() {}

  // Method to manually refresh dashboard data
  refreshDashboard(): void {
    this.loading = true;
    this.loadDashboardData();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    // Allow both admin and advogado users to access this dashboard
    if (!this.authService.isAdmin() && !this.authService.isAdvogado()) {
      if (this.authService.isCorrespondente()) {
        this.router.navigate(['/correspondent-dashboard']);
      } else {
        this.router.navigate(['/unauthorized']);
      }
      return;
    }
    
    this.loadDashboardData();
  }

  canViewUsers(): boolean {
    return this.authService.isAdmin() || this.authService.isAdvogado();
  }

  private loadDashboardData(): void {
    // Try to use the dedicated dashboard API first
    // We will fetch dashboard data and all solicitations in parallel
    const dashboardData$ = this.dashboardService.getDashboardData();
    const allSolicitacoes$ = this.solicitacaoService.getSolicitacoes().pipe(
      catchError(_error => of([])) // If solicitations fail, return empty array
    );

    forkJoin([dashboardData$, allSolicitacoes$]).pipe(
      catchError((_error) => {
        // Call the fallback method directly instead of returning an Observable
        this.loadDashboardDataFallback();
        // Return an observable that never emits to prevent the subscribe block from executing
        return new Observable<never>(() => {});
      })
    ).subscribe({
      next: (results) => {
        const [dashboardData, allSolicitacoes] = results;

        // Map the dashboard data to our stats using the service method
        const mappedData = this.dashboardService.mapDashboardData(dashboardData);
        
        this.stats = {
          totalUsers: mappedData.totalUsers,
          activeUsers: mappedData.activeUsers,
          totalCorrespondentes: mappedData.totalCorrespondentes,
          activeCorrespondentes: mappedData.activeCorrespondentes,
          totalProcessos: mappedData.totalProcessos,
          processosEmAndamento: mappedData.processosEmAndamento,
          totalSolicitacoes: mappedData.totalSolicitacoes,
          solicitacoesPendentes: mappedData.solicitacoesPendentes,
          totalComarcas: mappedData.totalComarcas,
          comarcasAtivas: mappedData.comarcasAtivas,
          comarcasInativas: mappedData.comarcasInativas
        };
        
        // Set top comarcas data
        if (dashboardData.topComarcas && Array.isArray(dashboardData.topComarcas)) {
          this.topComarcas = dashboardData.topComarcas.map(comarca => ({
            comarcaId: comarca.comarcaId,
            comarcaNome: comarca.comarcaNome,
            uf: comarca.uf,
            count: comarca.count
          }));
        }
        
        // Map the audiencia and diligencia counts
        this.tipoSolicitacaoCounts = {
          audiencia: mappedData.audienciaCount,
          diligencia: mappedData.diligenciaCount
        };
        
        // Update chart data
        this.updateChartData();
        
        // Map and set the solicitacoes por status chart data
        this.solicitacoesPorStatusChart = this.dashboardService.mapSolicitacoesPorStatusData(dashboardData);

        // Processar dados para o novo gráfico de solicitações atrasadas
        this.processSolicitacoesAtrasadas(allSolicitacoes);

        this.loading = false;
      },
      error: (_error) => {
        // This will only be called if there's an error in the subscribe block itself
      }
    });
  }
  
  // Fallback method to load dashboard data using individual services
  private loadDashboardDataFallback(): void {
    const requests: Observable<any>[] = [];

    // Add user-related requests for admin/advogado
    if (this.canViewUsers()) {
      requests.push(
        this.userService.getUsers().pipe(catchError((_error) => {
          return of([]);
        })),
        this.userService.getActiveUsers().pipe(catchError((_error) => {
          return of([]);
        }))
      );
    } else {
      requests.push(of([]), of([])); // Placeholder values
    }

    // Add correspondent requests
    requests.push(
      this.correspondenteService.getCorrespondentes().pipe(catchError((_error) => {
        return of([]);
      })),
      this.correspondenteService.getActiveCorrespondentes().pipe(catchError((_error) => {
        return of([]);
      }))
    );

    // Add process requests
    requests.push(
      this.processoService.getProcessos().pipe(catchError((_error) => {
        return of([]);
      })),
      this.processoService.searchByStatusPaginated('EM_ANDAMENTO', 0, 1000).pipe(
        catchError((_error) => {
          return of({ 
            content: [], 
            totalElements: 0, 
            totalPages: 0, 
            size: 0, 
            number: 0, 
            first: true, 
            last: true, 
            numberOfElements: 0,
            totalTableElements: 0 
          });
        }),
        // Extract content array from paginated response
        map((response: PaginatedResponse<Processo>) => response.content || [])
      )
    );

    // Add solicitacao requests
    requests.push(
      this.solicitacaoService.getSolicitacoes().pipe(catchError((_error) => {
        return of([]);
      })),
      this.solicitacaoService.searchByStatus('Pendente').pipe(catchError((_error) => {
        return of([]);
      }))
    );

    // Add solicitacao status requests
    requests.push(
      this.solicitacaoStatusService.getSolicitacaoStatuses().pipe(catchError((_error) => {
        return of([]);
      }))
    );

    // Add tipo solicitacao requests
    requests.push(
      this.tipoSolicitacaoService.getTiposSolicitacao().pipe(catchError((_error) => {
        return of([]);
      }))
    );

    // Add comarca requests
    requests.push(
      this.comarcaService.getComarcasCount().pipe(catchError((_error) => {
        return of(0);
      }))
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        let [
          allUsers, activeUsers,
          allCorrespondentes, activeCorrespondentes,
          allProcessos, processosEmAndamento,
          allSolicitacoes, solicitacoesPendentes,
          solicitacaoStatuses,
          tipoSolicitacoes,
          totalComarcas // Add this
        ] = results as [User[], User[], Correspondente[], Correspondente[], Processo[], Processo[], Solicitacao[], Solicitacao[], SolicitacaoStatus[], TipoSolicitacao[], number];

        // Validate that all arrays are actually arrays
        if (!Array.isArray(allUsers)) {
          allUsers = [];
        }
        if (!Array.isArray(activeUsers)) {
          activeUsers = [];
        }
        if (!Array.isArray(allCorrespondentes)) {
          allCorrespondentes = [];
        }
        if (!Array.isArray(activeCorrespondentes)) {
          activeCorrespondentes = [];
        }
        if (!Array.isArray(allProcessos)) {
          allProcessos = [];
        }
        if (!Array.isArray(processosEmAndamento)) {
          processosEmAndamento = [];
        }
        if (!Array.isArray(allSolicitacoes)) {
          allSolicitacoes = [];
        }
        if (!Array.isArray(solicitacoesPendentes)) {
          solicitacoesPendentes = [];
        }
        if (!Array.isArray(solicitacaoStatuses)) {
          solicitacaoStatuses = [];
        }
        if (!Array.isArray(tipoSolicitacoes)) {
          tipoSolicitacoes = [];
        }

        this.stats = {
          totalUsers: allUsers.length,
          activeUsers: activeUsers.length,
          totalCorrespondentes: allCorrespondentes.length,
          activeCorrespondentes: activeCorrespondentes.length,
          totalProcessos: allProcessos.length,
          processosEmAndamento: processosEmAndamento.length,
          totalSolicitacoes: allSolicitacoes.length,
          solicitacoesPendentes: solicitacoesPendentes.length,
          totalComarcas: totalComarcas // Add this
        };

        // Count audiencia and diligencia types
        const tipoSolicitacaoCounts = { audiencia: 0, diligencia: 0 };
        
        // Ensure solicitacoes is an array before processing
        if (Array.isArray(allSolicitacoes)) {
          allSolicitacoes.forEach((solicitacao) => {
            if (solicitacao.tipoSolicitacao?.especie) {
              const especie = solicitacao.tipoSolicitacao.especie.toLowerCase();
              
              // More flexible matching for audiencia terms
              if (especie.includes('audiencia') || especie.includes('audiência') || 
                  especie.includes('audiência') || especie.includes('hearing')) {
                tipoSolicitacaoCounts.audiencia++;
              } 
              // More flexible matching for diligencia terms
              else if (especie.includes('diligencia') || especie.includes('diligência') || 
                       especie.includes('diligence') || especie.includes('dilig') ||
                       especie.includes('diligência') || especie.includes('diligencia') ||
                       especie.includes('dilligence') || especie.includes('dilligência')) {
                tipoSolicitacaoCounts.diligencia++;
              }
            }
          });
        }

        // Update the component's tipoSolicitacaoCounts
        this.tipoSolicitacaoCounts = tipoSolicitacaoCounts;
        
        // Update chart data
        this.updateChartData();
        
        // Load solicitacoes by status data
        this.loadSolicitacoesPorStatusData(solicitacaoStatuses);

        // Processar dados para o novo gráfico de solicitações atrasadas
        this.processSolicitacoesAtrasadas(allSolicitacoes);

        this.loading = false;
      },
      error: (_error) => {
        // Set default values to prevent empty dashboard
        this.stats = {
          totalUsers: 0,
          activeUsers: 0,
          totalCorrespondentes: 0,
          activeCorrespondentes: 0,
          totalProcessos: 0,
          processosEmAndamento: 0,
          totalSolicitacoes: 0,
          solicitacoesPendentes: 0
        };
        
        // Set loading to false even on error to prevent infinite loading state
        this.loading = false;
      }
    });
  }

  private loadSolicitacoesPorStatusData(statuses: SolicitacaoStatus[]): void {
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
      // Initialize with empty data
      this.solicitacoesPorStatusChart = {
        labels: ['Nenhum status encontrado'],
        values: [1],
        colors: ['#cccccc']
      };
      return;
    }

    // Instead of searching for each status individually, let's get all solicitations
    // and group them by status to avoid mismatches
    this.solicitacaoService.getSolicitacoes().pipe(
      catchError((_error) => {
        return of([]);
      })
    ).subscribe({
      next: (solicitacoes: Solicitacao[]) => {
        // Ensure solicitacoes is an array
        if (!Array.isArray(solicitacoes)) {
          solicitacoes = [];
        }
        
        // Group solicitations by status
        const solicitacoesPorStatus: { [key: string]: number } = {};
        
        // Initialize with all known statuses set to 0
        statuses.forEach(status => {
          solicitacoesPorStatus[status.status.trim()] = 0;
        });
        
        // Count solicitations by their actual status
        solicitacoes.forEach(solicitacao => {
          if (solicitacao.statusSolicitacao?.status) {
            const status = solicitacao.statusSolicitacao.status.trim();
            solicitacoesPorStatus[status] = (solicitacoesPorStatus[status] || 0) + 1;
          }
        });
        
        // Update chart data with distinct colors for each status
        const labels = Object.keys(solicitacoesPorStatus);
        const values = Object.values(solicitacoesPorStatus);
        const colors = labels.map((status, index) => this.getStatusColor(status, index));
        
        this.solicitacoesPorStatusChart = {
          labels: labels,
          values: values,
          colors: colors
        };
      },
      error: (_error) => {
        // Fallback: search for each status individually
        this.loadSolicitacoesPorStatusDataFallback(statuses);
      }
    });
  }
  
  private loadSolicitacoesPorStatusDataFallback(statuses: SolicitacaoStatus[]): void {
    if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
      // Initialize with empty data
      this.solicitacoesPorStatusChart = {
        labels: ['Nenhum status encontrado'],
        values: [1],
        colors: ['#cccccc']
      };
      return;
    }
    
    const statusRequests = statuses.map(status => {
      const cleanStatus = status.status.trim();
      
      return this.solicitacaoService.searchByStatus(cleanStatus).pipe(
        catchError((_error) => {
          return of([]);
        })
      );
    });

    forkJoin(statusRequests).subscribe({
      next: (results) => {
        const solicitacoesPorStatus: { [key: string]: number } = {};
        let totalSolicitacoes = 0;
        
        statuses.forEach((status, index) => {
          const cleanStatus = status.status.trim();
          // Ensure the result is an array
          const solicitacoes = Array.isArray(results[index]) ? results[index] : [];
          const count = solicitacoes.length;
          
          solicitacoesPorStatus[cleanStatus] = count;
          totalSolicitacoes += count;
        });

        // Update chart data
        let labels = Object.keys(solicitacoesPorStatus);
        let values = Object.values(solicitacoesPorStatus);
        let colors = labels.map((status, index) => this.getStatusColor(status, index));
        
        // If no data, show a "No data" message
        if (totalSolicitacoes === 0) {
          labels = ['Nenhuma solicitação encontrada'];
          values = [1];
          colors = ['#eeeeee'];
        }
        
        this.solicitacoesPorStatusChart = {
          labels: labels,
          values: values,
          colors: colors
        };
      },
      error: (_error) => {
        // Initialize with error data
        this.solicitacoesPorStatusChart = {
          labels: ['Erro ao carregar dados'],
          values: [1],
          colors: ['#ff6b6b']
        };
      }
    });
  }

  private updateChartData(): void {
    // Update entity type chart
    this.entityTypeChart.values = [
      this.stats.totalUsers,
      this.stats.totalCorrespondentes,
      this.stats.totalProcessos,
      this.stats.totalSolicitacoes,
      this.stats.totalComarcas || 0 // Add comarcas
    ];

    // Update entity status chart
    this.entityStatusChart.values = [
      this.stats.activeUsers + this.stats.activeCorrespondentes,
      (this.stats.totalUsers - this.stats.activeUsers) + (this.stats.totalCorrespondentes - this.stats.activeCorrespondentes),
      this.stats.processosEmAndamento,
      this.stats.solicitacoesPendentes
    ];
  }

  private processSolicitacoesAtrasadas(solicitacoes: Solicitacao[]): void {
    const counts = {
      ate5: 0,
      ate10: 0,      
      maisDe10: 0
    };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    solicitacoes.forEach(solicitacao => {
      // A regra de cor do prazo só se aplica a status específicos.
      const status = solicitacao.statusSolicitacao?.status?.toLowerCase();
      const statusPermitidos = ['em andamento', 'em_andamento', 'aguardando confirmação', 'aguardando confirmacao', 'em producao', 'em_producao', 'em produção'];
      if (!solicitacao.dataprazo || !status || !statusPermitidos.includes(status)) {
        return; // Ignora se não tem prazo ou o status não é permitido
      }

      const prazo = new Date(solicitacao.dataprazo);
      prazo.setHours(0, 0, 0, 0);

      if (prazo.getTime() >= hoje.getTime()) {
        return; // Ignora se não está atrasada
      }

      const diffTime = hoje.getTime() - prazo.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 10) counts.maisDe10++;
      else if (diffDays > 5) counts.ate10++;
      else if (diffDays >= 1) counts.ate5++;
    });

    this.solicitacoesAtrasadasChart.values = [counts.ate5, counts.ate10, counts.maisDe10];
  }

  // Helper method to get color for a status with fallback to generated colors
  getStatusColor(status: string, index: number): string {
    // First check if we have a predefined color
    if (this.statusColors[status]) {
      return this.statusColors[status];
    }
    
    // Generate a distinct color based on the index
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607', 
      '#8338EC', '#3A86FF', '#38B000', '#9EF01A', '#FF006E',
      '#8338EC', '#0077B6', '#00B4D8', '#90E0EF', '#007F5F',
      '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#264653'
    ];
    
    // Return a color from our palette, cycling if necessary
    return colors[index % colors.length];
  }

  // Helper method to get max value from comarca counts
  getMaxComarcaValue(): number {
    if (!this.topComarcas || this.topComarcas.length === 0) {
      return 1;
    }
    const counts = this.topComarcas.map(c => c.count);
    return Math.max(...counts, 1); // Return at least 1 to avoid division by zero
  }

  // Helper method to get bar height for comarca
  getComarcaBarHeight(count: number): string {
    const maxValue = this.getMaxComarcaValue();
    if (maxValue === 0) return '0%';
    return `${(count / maxValue) * 100}%`;
  }

  // Chart helper methods
  getBarHeight(value: number, maxValue: number): string {
    if (maxValue === 0) return '0%';
    return `${(value / maxValue) * 100}%`;
  }

  getMaxValue(values: number[]): number {
    return Math.max(...values, 1); // Return at least 1 to avoid division by zero
  }

  getPieStrokeDasharray(value: number, values: number[]): string {
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return '0, 100';
    const percentage = (value / total) * 100;
    return `${percentage}, 100`;
  }

  getPieStrokeDashoffset(index: number, values: number[]): string {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const total = values.reduce((sum, val) => sum + val, 0);
      if (total === 0) return '0';
      offset += (values[i] / total) * 100;
    }
    return `-${offset}`;
  }

  getTotalEntities(): number {
    return this.stats.totalUsers + this.stats.totalCorrespondentes + 
           this.stats.totalProcessos + this.stats.totalSolicitacoes;
  }

  // Method to calculate total solicitacoes for pie chart center
  getTotalSolicitacoes(): number {
    return this.solicitacoesPorStatusChart.values.reduce((sum, value) => sum + value, 0);
  }

  // Method to navigate to request list with overdue filter
  navigateToOverdueRequests(period: string): void {
    const hoje = new Date();
    let dataPrazoTo: Date | null = new Date();
    let dataPrazoFrom: Date | null = new Date();

    switch (period) {
      case '1-5 dias':
        dataPrazoTo.setDate(hoje.getDate() - 1);
        dataPrazoFrom.setDate(hoje.getDate() - 5);
        break;
      case '6-10 dias':
        dataPrazoTo.setDate(hoje.getDate() - 6);
        dataPrazoFrom.setDate(hoje.getDate() - 10);
        break;
      case '11-20 dias':
        dataPrazoTo.setDate(hoje.getDate() - 11);
        dataPrazoFrom.setDate(hoje.getDate() - 20);
        break;
      case '> 20 dias':
        dataPrazoTo.setDate(hoje.getDate() - 21);
        dataPrazoFrom = null; // No start date for "> 20 days"
        break;
    }

    this.router.navigate(['/solicitacoes'], {
      queryParams: {
        dataPrazoFrom: dataPrazoFrom ? dataPrazoFrom.toISOString().split('T')[0] : null,
        dataPrazoTo: dataPrazoTo ? dataPrazoTo.toISOString().split('T')[0] : null,
        status: 'Atrasada' // A custom filter key to indicate overdue
      }
    });
  }
}