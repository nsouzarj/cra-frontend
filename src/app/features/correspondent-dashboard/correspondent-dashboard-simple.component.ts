import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service'; // Added UserService import
import { SolicitacaoService } from '../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../core/services/solicitacao-status.service';
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { User } from '../../shared/models/user.model';
import { Solicitacao, SolicitacaoStatus } from '../../shared/models/solicitacao.model';
import { TipoSolicitacao } from '../../shared/models/tiposolicitacao.model';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators'; // Added switchMap

interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

interface TipoSolicitacaoCount {
  audiencia: number;
  diligencia: number;
}

@Component({
  selector: 'app-correspondent-dashboard-simple',
  templateUrl: './correspondent-dashboard-simple.component.html',
  styleUrls: ['./correspondent-dashboard.component.scss']
})
export class CorrespondentDashboardSimpleComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  
  solicitacoesPorStatusChart: ChartData = {
    labels: [],
    values: [],
    colors: []
  };

  tipoSolicitacaoCounts: TipoSolicitacaoCount = {
    audiencia: 0,
    diligencia: 0
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
    private userService: UserService, // Added UserService
    private solicitacaoService: SolicitacaoService,
    private solicitacaoStatusService: SolicitacaoStatusService,
    private tipoSolicitacaoService: TipoSolicitacaoService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    // Try to get fresh user data from the server
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadDashboardData();
      },
      error: (error) => {
        // Fallback to cached data
        this.currentUser = this.authService.currentUserValue;
        this.loadDashboardData();
      }
    });
  }

  private loadDashboardData(): void {
    // Get correspondent ID from current user
    let correspondentId = this.currentUser?.correspondente?.id;
    
    if (correspondentId) {
      this.loadDashboardDataWithId(correspondentId);
      return;
    }
    
    // If we don't have the correspondent ID, try to get it from the user service
    const userId = this.currentUser?.id;
    if (userId) {
      this.userService.getUserById(userId).pipe(
        switchMap(user => {
          const fetchedCorrespondentId = user?.correspondente?.id;
          if (fetchedCorrespondentId) {
            // Update the current user in auth service with the full data
            this.authService.updateCurrentUser(user);
            this.currentUser = user;
            return of(fetchedCorrespondentId);
          } else {
            // If still no correspondent ID, try other fallbacks
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                const fallbackCorrespondentId = parsedUser?.correspondente?.id || parsedUser?.correspondentId;
                if (fallbackCorrespondentId) {
                  return of(fallbackCorrespondentId);
                }
              } catch (e) {
                console.error('Error parsing stored user data:', e);
              }
            }
            return of(null);
          }
        })
      ).subscribe({
        next: (id) => {
          if (id) {
            this.loadDashboardDataWithId(id);
          } else {
            this.loading = false;
          }
        },
        error: (error) => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }
  
  private loadDashboardDataWithId(correspondentId: number): void {
    // Fetch correspondent-specific dashboard data
    this.dashboardService.getCorrespondentDashboardData(correspondentId).subscribe({
      next: (dashboardData: DashboardData) => {
        // Update tipo solicitacao counts
        this.updateTipoSolicitacaoCounts(dashboardData);
        
        // Update chart data
        this.solicitacoesPorStatusChart = this.dashboardService.mapSolicitacoesPorStatusData(dashboardData);
        
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
      }
    });
  }

  private updateTipoSolicitacaoCounts(dashboardData: DashboardData): void {
    // Reset counts
    this.tipoSolicitacaoCounts = {
      audiencia: 0,
      diligencia: 0
    };

    // Count audiencia and diligencia types from dashboard data
    if (dashboardData.solicitacoesPorTipo && Array.isArray(dashboardData.solicitacoesPorTipo)) {
      dashboardData.solicitacoesPorTipo.forEach(item => {
        const especie = item.tipoSolicitacaoEspecie?.toLowerCase();
        if (especie) {
          if (especie.includes('audiencia') || especie.includes('audiência')) {
            this.tipoSolicitacaoCounts.audiencia += item.count;
          } else if (especie.includes('diligencia') || especie.includes('diligência')) {
            this.tipoSolicitacaoCounts.diligencia += item.count;
          }
        }
      });
    }
  }

  // Chart helper methods
  getBarHeight(value: number, maxValue: number): string {
    if (maxValue === 0) {
      return '0%';
    }
    const height = `${(value / maxValue) * 100}%`;
    return height;
  }

  getMaxValue(values: number[]): number {
    const max = Math.max(...values, 1); // Return at least 1 to avoid division by zero
    return max;
  }

  getPieStrokeDasharray(value: number, values: number[]): string {
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      return '0, 100';
    }
    const percentage = (value / total) * 100;
    const result = `${percentage}, 100`;
    return result;
  }

  getPieStrokeDashoffset(index: number, values: number[]): string {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const total = values.reduce((sum, val) => sum + val, 0);
      if (total === 0) {
        return '0';
      }
      offset += (values[i] / total) * 100;
    }
    const result = `-${offset}`;
    return result;
  }

  // Method to calculate total solicitacoes for pie chart center
  getTotalSolicitacoes(): number {
    const total = this.solicitacoesPorStatusChart.values.reduce((sum, value) => sum + value, 0);
    return total;
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
    const color = colors[index % colors.length];
    return color;
  }
}