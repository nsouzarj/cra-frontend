import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { CorrespondenteService } from '../../core/services/correspondente.service';
import { ProcessoService } from '../../core/services/processo.service';
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../core/services/solicitacao-status.service';
import { User } from '../../shared/models/user.model';
import { Correspondente } from '../../shared/models/correspondente.model';
import { Processo } from '../../shared/models/processo.model';
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { Router } from '@angular/router';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCorrespondentes: number;
  activeCorrespondentes: number;
  totalProcessos: number;
  processosEmAndamento: number;
  totalSolicitacoes: number;
  solicitacoesPendentes: number;
}

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
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

  // Chart data
  entityTypeChart: ChartData = {
    labels: ['Usuários', 'Correspondentes', 'Processos', 'Solicitações'],
    values: [0, 0, 0, 0],
    colors: ['#667eea', '#f093fb', '#4facfe', '#43e97b']
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

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private correspondenteService: CorrespondenteService,
    private processoService: ProcessoService,
    private solicitacaoService: SolicitacaoService,
    private solicitacaoStatusService: SolicitacaoStatusService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    // Redirect correspondent users to their specific dashboard
    if (this.authService.isCorrespondente()) {
      this.router.navigate(['/correspondent-dashboard']);
      return;
    }
    
    this.loadDashboardData();
  }

  canViewUsers(): boolean {
    return this.authService.isAdmin() || this.authService.isAdvogado();
  }

  private loadDashboardData(): void {
    const requests = [];

    // Add user-related requests for admin/advogado
    if (this.canViewUsers()) {
      requests.push(
        this.userService.getUsers().pipe(catchError(() => of([]))),
        this.userService.getActiveUsers().pipe(catchError(() => of([])))
      );
    } else {
      requests.push(of([]), of([])); // Placeholder values
    }

    // Add correspondent requests
    requests.push(
      this.correspondenteService.getCorrespondentes().pipe(catchError(() => of([]))),
      this.correspondenteService.getActiveCorrespondentes().pipe(catchError(() => of([])))
    );

    // Add process requests
    requests.push(
      this.processoService.getProcessos().pipe(catchError(() => of([]))),
      this.processoService.searchByStatus('EM_ANDAMENTO').pipe(catchError(() => of([])))
    );

    // Add solicitacao requests
    requests.push(
      this.solicitacaoService.getSolicitacoes().pipe(catchError(() => of([]))),
      this.solicitacaoService.searchByStatus('Pendente').pipe(catchError(() => of([])))
    );

    // Add solicitacao status requests
    requests.push(
      this.solicitacaoStatusService.getSolicitacaoStatuses().pipe(catchError((error) => {
        console.error('Error fetching solicitacao statuses:', error);
        return of([]);
      }))
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const [
          allUsers, activeUsers,
          allCorrespondentes, activeCorrespondentes,
          allProcessos, processosEmAndamento,
          allSolicitacoes, solicitacoesPendentes,
          solicitacaoStatuses
        ] = results as [User[], User[], Correspondente[], Correspondente[], Processo[], Processo[], Solicitacao[], Solicitacao[], SolicitacaoStatus[]];

        console.log('Dashboard data loaded:', {
          allUsers: allUsers.length,
          activeUsers: activeUsers.length,
          allCorrespondentes: allCorrespondentes.length,
          activeCorrespondentes: activeCorrespondentes.length,
          allProcessos: allProcessos.length,
          processosEmAndamento: processosEmAndamento.length,
          allSolicitacoes: allSolicitacoes.length,
          solicitacoesPendentes: solicitacoesPendentes.length,
          solicitacaoStatuses: solicitacaoStatuses.length
        });

        this.stats = {
          totalUsers: allUsers.length,
          activeUsers: activeUsers.length,
          totalCorrespondentes: allCorrespondentes.length,
          activeCorrespondentes: activeCorrespondentes.length,
          totalProcessos: allProcessos.length,
          processosEmAndamento: processosEmAndamento.length,
          totalSolicitacoes: allSolicitacoes.length,
          solicitacoesPendentes: solicitacoesPendentes.length
        };

        // Update chart data
        this.updateChartData();
        
        // Load solicitacoes by status data
        this.loadSolicitacoesPorStatusData(solicitacaoStatuses);

        // Log chart data for debugging
        this.logBarChartData();

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  private loadSolicitacoesPorStatusData(statuses: SolicitacaoStatus[]): void {
    console.log('Loading solicitacoes por status data:', statuses);
    
    if (!statuses || statuses.length === 0) {
      console.log('No statuses found, initializing empty chart');
      // Initialize with empty data
      this.solicitacoesPorStatusChart = {
        labels: ['Nenhum status encontrado'],
        values: [1],
        colors: ['#cccccc']
      };
      return;
    }

    // Log all available statuses first
    console.log('Available statuses:', statuses.map(s => ({ status: s.status, id: s.idstatus })));

    // Instead of searching for each status individually, let's get all solicitations
    // and group them by status to avoid mismatches
    this.solicitacaoService.getSolicitacoes().pipe(
      catchError((error) => {
        console.error('Error fetching all solicitacoes:', error);
        return of([]);
      })
    ).subscribe({
      next: (solicitacoes: Solicitacao[]) => {
        console.log(`Fetched ${solicitacoes.length} total solicitacoes`);
        
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
        
        console.log('Grouped solicitacoes por status:', solicitacoesPorStatus);
        
        // Update chart data with distinct colors for each status
        const labels = Object.keys(solicitacoesPorStatus);
        const values = Object.values(solicitacoesPorStatus);
        const colors = labels.map((status, index) => this.getStatusColor(status, index));
        
        this.solicitacoesPorStatusChart = {
          labels: labels,
          values: values,
          colors: colors
        };
        
        console.log('Updated solicitacoesPorStatusChart:', this.solicitacoesPorStatusChart);
      },
      error: (error) => {
        console.error('Error loading solicitacoes por status data:', error);
        // Fallback: search for each status individually
        this.loadSolicitacoesPorStatusDataFallback(statuses);
      }
    });
  }
  
  private loadSolicitacoesPorStatusDataFallback(statuses: SolicitacaoStatus[]): void {
    console.log('Using fallback method to load solicitacoes por status data');
    
    const statusRequests = statuses.map(status => {
      const cleanStatus = status.status.trim();
      console.log(`Fetching solicitacoes for status: "${cleanStatus}" (ID: ${status.idstatus})`);
      
      return this.solicitacaoService.searchByStatus(cleanStatus).pipe(
        catchError((error) => {
          console.error(`Error fetching solicitacoes for status "${cleanStatus}":`, error);
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
          const solicitacoes = results[index] as Solicitacao[];
          const count = solicitacoes.length;
          
          console.log(`Status "${cleanStatus}" has ${count} solicitacoes`);
          solicitacoesPorStatus[cleanStatus] = count;
          totalSolicitacoes += count;
        });

        console.log('Solicitacoes por status data (fallback):', solicitacoesPorStatus);

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
        
        console.log('Updated solicitacoesPorStatusChart (fallback):', this.solicitacoesPorStatusChart);
      },
      error: (error) => {
        console.error('Error in fallback method:', error);
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
      this.stats.totalSolicitacoes
    ];

    // Log chart data for debugging
    console.log('Entity Type Chart Data:', this.entityTypeChart);

    // Update entity status chart
    this.entityStatusChart.values = [
      this.stats.activeUsers + this.stats.activeCorrespondentes,
      (this.stats.totalUsers - this.stats.activeUsers) + (this.stats.totalCorrespondentes - this.stats.activeCorrespondentes),
      this.stats.processosEmAndamento,
      this.stats.solicitacoesPendentes
    ];
    
    // Log chart data for debugging
    console.log('Entity Status Chart Data:', this.entityStatusChart);
  }

  // Debug method to log bar chart data
  logBarChartData(): void {
    console.log('Entity Type Chart:', this.entityTypeChart);
    console.log('Solicitações Por Status Chart:', this.solicitacoesPorStatusChart);
    
    // Log individual bar data
    this.entityTypeChart.values.forEach((value, index) => {
      console.log(`Entity Bar ${index}: value=${value}, color=${this.entityTypeChart.colors[index]}`);
    });
    
    this.solicitacoesPorStatusChart.values.forEach((value, index) => {
      console.log(`Solicitações Bar ${index}: value=${value}, color=${this.solicitacoesPorStatusChart.colors[index]}`);
    });
  }

  // Helper method to get color for a status with fallback to generated colors
  private getStatusColor(status: string, index: number): string {
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
}