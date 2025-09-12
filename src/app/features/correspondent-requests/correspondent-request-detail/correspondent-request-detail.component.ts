import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AuthService } from '../../../core/services/auth.service';
import { Solicitacao } from '../../../shared/models/solicitacao.model';
import { DateFormatService } from '../../../shared/services/date-format.service';

@Component({
  selector: 'app-correspondent-request-detail',
  templateUrl: './correspondent-request-detail.component.html',
  styleUrls: ['./correspondent-request-detail.component.scss']
})
export class CorrespondentRequestDetailComponent implements OnInit {
  solicitacao: Solicitacao | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitacaoService: SolicitacaoService,
    public permissionService: PermissionService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dateFormatService: DateFormatService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const requestId = +params['id'];
      if (requestId) {
        this.loadRequest(requestId);
      }
    });
  }

  private loadRequest(requestId: number): void {
    this.solicitacaoService.getSolicitacaoById(requestId).subscribe({
      next: (solicitacao) => {
        // Log the raw data for debugging
        console.log('=== Raw solicitacao data ===');
        console.log('Complete solicitacao object:', solicitacao);
        console.log('datasolicitacao value:', solicitacao.datasolicitacao);
        console.log('dataprazo value:', solicitacao.dataprazo);
        console.log('dataconclusao value:', solicitacao.dataconclusao);
        console.log('dataagendamento value:', solicitacao.dataagendamento);
        
        // Run date format tests
        this.testDateFormat();
        
        this.solicitacao = solicitacao;
        this.loading = false;
        console.log('=== End of loadRequest ===');
      },
      error: (error) => {
        console.error('Error loading solicitacao:', error);
        this.snackBar.open('Erro ao carregar solicitação', 'Fechar', { duration: 5000 });
        this.loading = false;
        this.goBack();
      }
    });
  }

  editRequest(): void {
    if (this.solicitacao?.id) {
      this.router.navigate(['/solicitacoes/editar', this.solicitacao.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/minhas-solicitacoes']);
  }

  refreshData(): void {
    if (this.solicitacao?.id) {
      this.loading = true;
      this.loadRequest(this.solicitacao.id);
    }
  }

  // Method to update status with confirmation dialog
  updateStatus(newStatus: string): void {
    if (!this.solicitacao || !this.solicitacao.id) return;

    // Determine the correct idstatus based on the new status
    let idstatus: number;
    switch (newStatus) {
      case 'Em Andamento':
      case 'Em Produção':
        idstatus = 4; // As per user's requirement
        break;
      case 'Finalizada':
        idstatus = 5; // Assuming Finalizada has ID 5
        break;
      case 'Concluído':
        idstatus = 6; // Assuming Concluído has ID 6
        break;
      default:
        idstatus = this.solicitacao.statusSolicitacao?.idstatus || 1;
    }

    // Create updated solicitacao object
    const updatedSolicitacao: Solicitacao = {
      ...this.solicitacao,
      statusSolicitacao: {
        idstatus: idstatus,
        status: newStatus
      }
    };

    this.solicitacaoService.updateSolicitacao(this.solicitacao.id, updatedSolicitacao).subscribe({
      next: (updated) => {
        this.solicitacao = updated;
        this.snackBar.open('Status atualizado com sucesso!', 'Fechar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.snackBar.open('Erro ao atualizar status', 'Fechar', { duration: 5000 });
      }
    });
  }

  // Method to check if the current user can change the status
  canChangeStatus(): boolean {
    // Correspondents can change status, and admins/lawyers can always change status
    return this.authService.isCorrespondente() || this.authService.isAdmin() || this.authService.isAdvogado();
  }

  // Method to check if a correspondent can change the status
  canCorrespondentChangeStatus(): boolean {
    // Only correspondents are restricted when status is "Finalizada"
    return this.authService.isCorrespondente() && 
           this.solicitacao?.statusSolicitacao?.status !== 'Finalizada';
  }

  // Method to check if an admin or lawyer can change the status
  canAdminOrLawyerChangeStatus(): boolean {
    // Admins or lawyers can always change status, even when it's "Finalizada"
    return this.authService.isAdmin() || this.authService.isAdvogado();
  }

  // Method to check if all buttons should be disabled (when status is "Aguardando Confirmação")
  shouldDisableAllButtons(): boolean {
    return this.solicitacao?.statusSolicitacao?.status === 'Aguardando Confirmação';
  }

  getStatusText(status: string | undefined): string {
    return status || 'Pendente';
  }

  getProcessStatusText(status: string | undefined): string {
    return status || 'Não informado';
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pendente';
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  formatDate(date: Date | string | undefined): string {
    return this.dateFormatService.formatDate(date);
  }

  // Simple test method that can be called from template
  simpleTestDateFormat(dateString: string): string {
    console.log('Simple test called with:', dateString);
    return this.formatDate(dateString);
  }

  // Test method to verify date formatting
  testDateFormat(): void {
    console.log('=== Testing date format methods ===');
    
    // Test the specific format mentioned
    const testDate1 = '2025,9,11,3,0';
    console.log('Test 1 - Input:', testDate1, 'Output:', this.formatDate(testDate1));
    
    // Test standard ISO format
    const testDate2 = '2025-09-11';
    console.log('Test 2 - Input:', testDate2, 'Output:', this.formatDate(testDate2));
    
    // Test Brazilian format
    const testDate3 = '11/09/2025';
    console.log('Test 3 - Input:', testDate3, 'Output:', this.formatDate(testDate3));
    
    // Test another comma-separated format
    const testDate4 = '2025,12,3,15,30';
    console.log('Test 4 - Input:', testDate4, 'Output:', this.formatDate(testDate4));
    
    console.log('=== End of date format tests ===');
  }

  // Helper method to check if the solicitation is of type Audiência
  isAudiencia(): boolean {
    if (!this.solicitacao?.tipoSolicitacao) {
      console.log('isAudiencia: No tipoSolicitacao');
      return false;
    }
    
    const especie = this.solicitacao.tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = this.solicitacao.tipoSolicitacao.tipo?.toLowerCase() || '';
    
    const result = especie.includes('audiencia') || especie.includes('audiência') || 
           tipo.includes('audiencia') || tipo.includes('audiência');
    
    console.log('isAudiencia check:', { especie, tipo, result });
    return result;
  }

  // Helper method to check if the solicitation is of type Diligência
  isDiligencia(): boolean {
    if (!this.solicitacao?.tipoSolicitacao) {
      console.log('isDiligencia: No tipoSolicitacao');
      return false;
    }
    
    const especie = this.solicitacao.tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = this.solicitacao.tipoSolicitacao.tipo?.toLowerCase() || '';
    
    const result = especie.includes('diligencia') || especie.includes('diligência') || 
           tipo.includes('diligencia') || tipo.includes('diligência');
    
    console.log('isDiligencia check:', { especie, tipo, result });
    return result;
  }
}