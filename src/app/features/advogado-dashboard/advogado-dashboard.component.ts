import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { CorrespondenteService } from '../../core/services/correspondente.service';
import { ProcessoService } from '../../core/services/processo.service';
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { DashboardService, DashboardData, MappedDashboardData, ChartData } from '../../core/services/dashboard.service';
import { User } from '../../shared/models/user.model';
import { Correspondente } from '../../shared/models/correspondente.model';
import { Processo } from '../../shared/models/processo.model';
import { Solicitacao } from '../../shared/models/solicitacao.model';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

interface DashboardStats {
  totalProcessos: number;
  processosEmAndamento: number;
  totalSolicitacoes: number;
  solicitacoesPendentes: number;
}

interface TipoSolicitacaoCount {
  audiencia: number;
  diligencia: number;
}

@Component({
  selector: 'app-advogado-dashboard',
  templateUrl: './advogado-dashboard.component.html',
  styleUrls: ['../admin-dashboard/dashboard-common.scss']
})
export class AdvogadoDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  stats: DashboardStats = {
    totalProcessos: 0,
    processosEmAndamento: 0,
    totalSolicitacoes: 0,
    solicitacoesPendentes: 0
  };

  tipoSolicitacaoCounts: TipoSolicitacaoCount = {
    audiencia: 0,
    diligencia: 0
  };

  // Chart data
  entityTypeChart: ChartData = {
    labels: ['Processos', 'Solicitações'],
    values: [0, 0],
    colors: ['#4facfe', '#43e97b']
  };

  entityStatusChart: ChartData = {
    labels: ['Em Andamento', 'Pendentes'],
    values: [0, 0],
    colors: ['#4facfe', '#ffcc00']
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
    private processoService: ProcessoService,
    private solicitacaoService: SolicitacaoService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('=== ADVOGADO DASHBOARD INIT ===');
    this.currentUser = this.authService.currentUserValue;
    console.log('Current user:', this.currentUser);
    
    // Additional security check - ensure user is advogado
    if (!this.authService.isAdvogado()) {
      console.log('Security violation: Non-advogado user attempted to access advogado dashboard');
      // Redirect non-advogado users
      if (this.authService.isAdmin()) {
        this.router.navigate(['/dashboard']);
      } else if (this.authService.isCorrespondente()) {
        this.router.navigate(['/correspondent-dashboard']);
      } else {
        this.router.navigate(['/unauthorized']);
      }
      return;
    }
    
    console.log('Loading dashboard data...');
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    console.log('=== STARTING ADVOGADO DASHBOARD DATA LOADING ===');
    
    // For advogado users, we should only show their own data or data they have access to
    // Let's load their solicitations and processes
    const userId = this.currentUser?.id;
    
    if (!userId) {
      console.error('No user ID found');
      this.loading = false;
      return;
    }
    
    // Load data specific to this advogado user
    forkJoin({
      processos: this.processoService.getProcessos().pipe(catchError(() => of([]))),
      solicitacoes: this.solicitacaoService.getSolicitacoes().pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        const { processos, solicitacoes } = results;
        
        console.log('Loaded processos:', processos.length);
        console.log('Loaded solicitacoes:', solicitacoes.length);
        
        // Filter data to only show what this advogado user should see
        // For now, we'll show all data but in a real implementation, 
        // this should be filtered by user permissions
        
        // Calculate stats
        this.stats = {
          totalProcessos: processos.length,
          processosEmAndamento: processos.filter((p: Processo) => 
            p.status?.toLowerCase().includes('andamento')).length,
          totalSolicitacoes: solicitacoes.length,
          solicitacoesPendentes: solicitacoes.filter((s: Solicitacao) => 
            s.statusSolicitacao?.status?.toLowerCase().includes('pendente')).length
        };
        
        // Count audiencia and diligencia types
        let audienciaCount = 0;
        let diligenciaCount = 0;
        
        solicitacoes.forEach((solicitacao: Solicitacao) => {
          if (solicitacao.tipoSolicitacao?.especie) {
            const especie = solicitacao.tipoSolicitacao.especie.toLowerCase();
            if (especie.includes('audiencia') || especie.includes('audiência')) {
              audienciaCount++;
            } else if (especie.includes('diligencia') || especie.includes('diligência')) {
              diligenciaCount++;
            }
          }
        });
        
        this.tipoSolicitacaoCounts = {
          audiencia: audienciaCount,
          diligencia: diligenciaCount
        };
        
        // Update chart data
        this.updateChartData();
        
        // For solicitacoes by status, we'll need to group them
        this.loadSolicitacoesPorStatusData(solicitacoes);
        
        this.loading = false;
        console.log('=== ADVOGADO DASHBOARD LOADING COMPLETE ===');
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }
  
  private updateChartData(): void {
    console.log('=== UPDATING CHART DATA ===');
    console.log('Stats data:', this.stats);
    
    // Update entity type chart
    this.entityTypeChart.values = [
      this.stats.totalProcessos,
      this.stats.totalSolicitacoes
    ];

    // Update entity status chart
    this.entityStatusChart.values = [
      this.stats.processosEmAndamento,
      this.stats.solicitacoesPendentes
    ];
    
    console.log('=== CHART DATA UPDATE COMPLETE ===');
  }
  
  private loadSolicitacoesPorStatusData(solicitacoes: Solicitacao[]): void {
    // Group solicitations by status
    const statusMap: { [key: string]: number } = {};
    
    solicitacoes.forEach(solicitacao => {
      const status = solicitacao.statusSolicitacao?.status || 'Sem Status';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    // Update chart data
    const labels = Object.keys(statusMap);
    const values = Object.values(statusMap);
    const colors = labels.map((status, index) => this.getStatusColor(status, index));
    
    this.solicitacoesPorStatusChart = {
      labels: labels,
      values: values,
      colors: colors
    };
    
    console.log('Updated solicitacoesPorStatusChart:', this.solicitacoesPorStatusChart);
  }

  // Helper method to get color for a status
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
    return this.stats.totalProcessos + this.stats.totalSolicitacoes;
  }

  getTotalSolicitacoes(): number {
    return this.solicitacoesPorStatusChart.values.reduce((sum, value) => sum + value, 0);
  }
}