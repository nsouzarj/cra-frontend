import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../core/services/solicitacao-status.service';
import { User } from '../../shared/models/user.model';
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

@Component({
  selector: 'app-correspondent-dashboard',
  templateUrl: './correspondent-dashboard.component.html',
  styleUrls: ['./correspondent-dashboard.component.scss']
})
export class CorrespondentDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  
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
    private solicitacaoService: SolicitacaoService,
    private solicitacaoStatusService: SolicitacaoStatusService
  ) {}

  ngOnInit(): void {
    // Try to get fresh user data from the server
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Received fresh user data in dashboard:', user);
        this.currentUser = user;
        console.log('Correspondent ID:', this.currentUser?.correspondentId);
        console.log('User ID:', this.currentUser?.id);
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error loading current user in dashboard:', error);
        // Fallback to cached data
        this.currentUser = this.authService.currentUserValue;
        console.log('Using cached user data in dashboard:', this.currentUser);
        console.log('Correspondent ID:', this.currentUser?.correspondentId);
        console.log('User ID:', this.currentUser?.id);
        this.loadDashboardData();
      }
    });
  }

  private loadDashboardData(): void {
    // Get all solicitacao statuses
    this.solicitacaoStatusService.getSolicitacaoStatuses().pipe(
      catchError((error: any) => {
        console.error('Error fetching solicitacao statuses:', error);
        return of([]);
      })
    ).subscribe({
      next: (statuses: SolicitacaoStatus[]) => {
        console.log('Loaded solicitacao statuses:', statuses);
        console.log('Number of statuses loaded:', statuses.length);
        // Load solicitacoes by status data
        this.loadSolicitacoesPorStatusData(statuses);
      },
      error: (error: any) => {
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
      this.loading = false;
      return;
    }

    // Get solicitations for the current correspondent using the appropriate method
    const correspondentId = this.currentUser?.correspondentId;
    const userId = this.currentUser?.id;
    
    let solicitacoesObservable: Observable<Solicitacao[]>;
    
    if (correspondentId) {
      console.log(`Fetching solicitacoes for correspondent ID ${correspondentId}`);
      solicitacoesObservable = this.solicitacaoService.searchByCorrespondente(correspondentId);
    } else if (userId) {
      console.log(`Fetching solicitacoes for user ID ${userId}`);
      solicitacoesObservable = this.solicitacaoService.searchByUserCorrespondente(userId);
    } else {
      console.log('No correspondent ID or user ID found, fetching all solicitacoes');
      solicitacoesObservable = this.solicitacaoService.getSolicitacoes().pipe(
        catchError((error: any) => {
          console.error('Error fetching all solicitacoes:', error);
          return of([]);
        })
      );
    }

    solicitacoesObservable.subscribe({
      next: (solicitacoes: Solicitacao[]) => {
        console.log(`Fetched ${solicitacoes.length} solicitacoes for current user`);
        console.log('Sample of fetched solicitacoes:', solicitacoes.slice(0, 3)); // Log first 3 solicitations
        
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
          } else {
            console.log('Solicitation without status:', solicitacao);
          }
        });
        
        console.log('Grouped solicitacoes por status:', solicitacoesPorStatus);
        
        // Update chart data with distinct colors for each status
        const labels = Object.keys(solicitacoesPorStatus);
        const values = Object.values(solicitacoesPorStatus);
        const colors = labels.map((status, index) => this.getStatusColor(status, index));
        
        console.log('Chart labels:', labels);
        console.log('Chart values:', values);
        console.log('Chart colors:', colors);
        
        this.solicitacoesPorStatusChart = {
          labels: labels,
          values: values,
          colors: colors
        };
        
        console.log('Updated solicitacoesPorStatusChart:', this.solicitacoesPorStatusChart);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading solicitacoes por status data:', error);
        this.loading = false;
      }
    });
  }

  // Chart helper methods
  getBarHeight(value: number, maxValue: number): string {
    console.log(`Calculating bar height for value: ${value}, max: ${maxValue}`);
    if (maxValue === 0) {
      console.log('Max value is 0, returning 0%');
      return '0%';
    }
    const height = `${(value / maxValue) * 100}%`;
    console.log(`Calculated height: ${height}`);
    return height;
  }

  getMaxValue(values: number[]): number {
    console.log('Getting max value from:', values);
    const max = Math.max(...values, 1); // Return at least 1 to avoid division by zero
    console.log(`Max value: ${max}`);
    return max;
  }

  getPieStrokeDasharray(value: number, values: number[]): string {
    const total = values.reduce((sum, val) => sum + val, 0);
    console.log(`Calculating stroke dasharray for value: ${value}, total: ${total}`);
    if (total === 0) {
      console.log('Total is 0, returning 0, 100');
      return '0, 100';
    }
    const percentage = (value / total) * 100;
    const result = `${percentage}, 100`;
    console.log(`Calculated stroke dasharray: ${result}`);
    return result;
  }

  getPieStrokeDashoffset(index: number, values: number[]): string {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const total = values.reduce((sum, val) => sum + val, 0);
      if (total === 0) {
        console.log('Total is 0, returning 0');
        return '0';
      }
      offset += (values[i] / total) * 100;
    }
    const result = `-${offset}`;
    console.log(`Calculated stroke dashoffset for index ${index}: ${result}`);
    return result;
  }

  // Method to calculate total solicitacoes for pie chart center
  getTotalSolicitacoes(): number {
    const total = this.solicitacoesPorStatusChart.values.reduce((sum, value) => sum + value, 0);
    console.log(`Calculating total solicitacoes: ${total}`);
    return total;
  }

  // Helper method to get color for a status with fallback to generated colors
  private getStatusColor(status: string, index: number): string {
    console.log(`Getting color for status: "${status}" at index: ${index}`);
    
    // First check if we have a predefined color
    if (this.statusColors[status]) {
      console.log(`Found predefined color for status "${status}": ${this.statusColors[status]}`);
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
    const color = colors[index % colors.length];
    console.log(`Generated color for status "${status}": ${color}`);
    return color;
  }
}