import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// Update the interface to match the actual API response
export interface DashboardData {
  totalSolicitacoes: number;
  totalProcessos: number;
  totalComarcas: number;
  totalUsuarios: number;
  pendentes: number;
  concluidas: number;
  pagas: number;
  naoPagas: number;
  atrasadas: number;
  processosAtivos: number;
  processosConcluidos: number;
  totalCorrespondentes: number;
  correspondentesAtivos: number;
  correspondentesInativos: number;
  comarcasAtivas: number;
  comarcasInativas: number;
  solicitacoesPorStatus: {
    status: string;
    count: number;
  }[];
  topComarcas: {
    comarcaId: number;
    comarcaNome: string;
    uf: string;
    count: number;
  }[];
  solicitacoesPorTipo: {
    tipoSolicitacaoId: number;
    tipoSolicitacaoEspecie: string;
    count: number;
  }[];
  recentSolicitacoes: any[];
}

// Add a mapped interface for our dashboard component
export interface MappedDashboardData {
  totalUsers: number;
  activeUsers: number;
  totalCorrespondentes: number;
  activeCorrespondentes: number;
  totalProcessos: number;
  processosEmAndamento: number;
  totalSolicitacoes: number;
  solicitacoesPendentes: number;
  totalComarcas: number;
  comarcasAtivas: number;
  comarcasInativas: number;
  audienciaCount: number;
  diligenciaCount: number;
}

// Add interface for chart data
export interface ChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/api/dashboard`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Retrieves dashboard statistics from the backend
   * 
   * @returns Observable containing dashboard data
   */
  getDashboardData(): Observable<DashboardData> {
    // Get the authentication token
    const token = this.authService.getToken();
    
    // Set up headers with authentication
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.get<DashboardData>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Retrieves correspondent-specific dashboard statistics from the backend
   * 
   * @param correspondenteId The correspondent ID
   * @returns Observable containing dashboard data for the specified correspondent
   */
  getCorrespondentDashboardData(correspondenteId: number): Observable<DashboardData> {
    // Get the authentication token
    const token = this.authService.getToken();
    
    // Set up headers with authentication
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.get<DashboardData>(`${this.apiUrl}/${correspondenteId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Maps the API response to the format expected by the dashboard component
   * 
   * @param apiData The raw API response
   * @returns Mapped dashboard data
   */
  mapDashboardData(apiData: DashboardData): MappedDashboardData {
    // Initialize counts
    let audienciaCount = 0;
    let diligenciaCount = 0;
    
    // Count audiencias and diligencias from the solicitacoesPorTipo array
    if (apiData.solicitacoesPorTipo && Array.isArray(apiData.solicitacoesPorTipo)) {
      apiData.solicitacoesPorTipo.forEach(item => {
        const especie = item.tipoSolicitacaoEspecie?.toLowerCase();
        if (especie) {
          if (especie.includes('audiencia') || especie.includes('audiência')) {
            audienciaCount += item.count;
          } else if (especie.includes('diligencia') || especie.includes('diligência')) {
            diligenciaCount += item.count;
          }
        }
      });
    }
    
    return {
      totalUsers: apiData.totalUsuarios || 0,
      activeUsers: 0, // Not directly provided in API, would need separate calculation
      totalCorrespondentes: apiData.totalCorrespondentes || 0,
      activeCorrespondentes: apiData.correspondentesAtivos || 0,
      totalProcessos: apiData.totalProcessos || 0,
      processosEmAndamento: apiData.processosAtivos || 0,
      totalSolicitacoes: apiData.totalSolicitacoes || 0,
      solicitacoesPendentes: apiData.pendentes || 0,
      totalComarcas: apiData.totalComarcas || 0,
      comarcasAtivas: apiData.comarcasAtivas || 0,
      comarcasInativas: apiData.comarcasInativas || 0,
      audienciaCount: audienciaCount,
      diligenciaCount: diligenciaCount
    };
  }

  /**
   * Maps the status data from the API response to chart data format
   * 
   * @param apiData The raw API response
   * @returns Chart data for solicitacoes por status
   */
  mapSolicitacoesPorStatusData(apiData: DashboardData): ChartData {
    // Check if we have solicitacoesPorStatus data
    if (!apiData.solicitacoesPorStatus || !Array.isArray(apiData.solicitacoesPorStatus)) {
      return {
        labels: ['Nenhum status encontrado'],
        values: [1],
        colors: ['#cccccc']
      };
    }

    // Map the status data to chart format
    const labels = apiData.solicitacoesPorStatus.map(item => item.status);
    const values = apiData.solicitacoesPorStatus.map(item => item.count);
    
    // Generate colors for each status
    const colors = labels.map((status, index) => this.getStatusColor(status, index));
    
    return {
      labels: labels,
      values: values,
      colors: colors
    };
  }

  /**
   * Helper method to get color for a status with fallback to generated colors
   * 
   * @param status The status name
   * @param index The index for color generation
   * @returns A color string
   */
  private getStatusColor(status: string, index: number): string {
    // Predefined colors for common statuses
    const statusColors: { [key: string]: string } = {
      // Process and general statuses
      'EM_ANDAMENTO': '#4facfe',
      'PENDENTE': '#ffcc00',
      'CONCLUIDO': '#43e97b',
      'CONCLUÍDO': '#43e97b',
      'CANCELADO': '#f5576c',
      'SUSPENSO': '#ff9800',
      'ARQUIVADO': '#9e9e9e',
      'FINALIZADO': '#2196f3',
      'ABERTO': '#00bcd4',
      'FECHADO': '#607d8b',
      'NOVO': '#9c27b0',
      
      // Confirmation-related statuses
      'AGUARDANDO CONFIRMAÇÃO': '#9c27b0',
      'AGUARDANDO CONFIRMACAO': '#9c27b0',
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

    // First check if we have a predefined color
    if (statusColors[status.toUpperCase()]) {
      return statusColors[status.toUpperCase()];
    }
    
    if (statusColors[status]) {
      return statusColors[status];
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

  /**
   * Handles HTTP errors for all service methods
   * 
   * @param error The error object
   * @returns Observable that throws the error
   */
  private handleError(error: any): Observable<never> {
    console.error('Dashboard Service Error:', error);
    throw error;
  }
}