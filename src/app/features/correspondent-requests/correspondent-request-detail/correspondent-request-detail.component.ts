import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AuthService } from '../../../core/services/auth.service';
// Add import for the new attachment service
import { SolicitacaoAnexoService } from '../../../core/services/solicitacao-anexo.service';
import { Solicitacao } from '../../../shared/models/solicitacao.model';
// Add import for the attachment model
import { SolicitacaoAnexo } from '../../../shared/models/solicitacao-anexo.model';
import { DateFormatService } from '../../../shared/services/date-format.service';
// Add HttpEventType import for file upload progress handling
import { HttpEventType } from '@angular/common/http';
// Add import for confirmation dialog component
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-correspondent-request-detail',
  templateUrl: './correspondent-request-detail.component.html',
  styleUrls: ['./correspondent-request-detail.component.scss']
})
export class CorrespondentRequestDetailComponent implements OnInit {
  solicitacao: Solicitacao | null = null;
  loading = true;
  
  // File attachment properties
  anexos: SolicitacaoAnexo[] = [];
  selectedFiles: File[] = [];
  progressInfos: any[] = [];
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private solicitacaoService: SolicitacaoService,
    public permissionService: PermissionService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private dateFormatService: DateFormatService,
    // Add the new attachment service to the constructor
    private solicitacaoAnexoService: SolicitacaoAnexoService,
    // Add MatDialog to the constructor
    private dialog: MatDialog
  ) {
    console.log('AuthService in constructor:', authService);
    console.log('AuthService isAdmin:', authService.isAdmin());
    console.log('AuthService isAdvogado:', authService.isAdvogado());
    console.log('AuthService isCorrespondente:', authService.isCorrespondente());
  }

  ngOnInit(): void {
    console.log('AuthService in ngOnInit:', this.authService);
    console.log('AuthService isAdmin:', this.authService.isAdmin());
    console.log('AuthService isAdvogado:', this.authService.isAdvogado());
    console.log('AuthService isCorrespondente:', this.authService.isCorrespondente());
    
    this.route.params.subscribe(params => {
      const requestId = +params['id'];
      if (requestId) {
        this.loadRequest(requestId);
        // Load attachments for this request
        this.loadAnexos(requestId);
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
        console.log('Status value:', solicitacao.statusSolicitacao?.status);
        console.log('Status type:', typeof solicitacao.statusSolicitacao?.status);
        
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

  // Load attachments for the current request
  private loadAnexos(requestId: number): void {
    this.solicitacaoAnexoService.getAnexosBySolicitacaoId(requestId).subscribe({
      next: (anexos) => {
        console.log('Attachments loaded:', anexos);
        // Add debugging to check origin values
        anexos.forEach(anexo => {
          console.log(`Attachment ${anexo.nomearquivo} has origin:`, anexo.origem);
        });
        this.anexos = anexos;
      },
      error: (error) => {
        console.error('Error loading attachments:', error);
        this.snackBar.open('Erro ao carregar anexos', 'Fechar', { duration: 5000 });
      }
    });
  }

  // Method to handle file selection
  selectFiles(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    this.progressInfos = [];
    this.message = '';
  }

  // Method to upload all selected files
  private uploadAnexos(solicitacaoId: number): void {
    this.message = '';
    this.progressInfos = [];

    if (this.selectedFiles.length === 0) {
      return;
    }

    for (let i = 0; i < this.selectedFiles.length; i++) {
      this.progressInfos.push({ value: 0, fileName: this.selectedFiles[i].name });
    }

    for (let i = 0; i < this.selectedFiles.length; i++) {
      this.uploadAnexo(solicitacaoId, this.selectedFiles[i], i);
    }
  }

  // Method to upload a single file
  private uploadAnexo(solicitacaoId: number, file: File, index: number): void {
    this.solicitacaoAnexoService.uploadAnexo(file, solicitacaoId).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Upload progress
          const progress = Math.round(100 * event.loaded / event.total);
          this.progressInfos[index].value = progress;
        } else if (event.type === HttpEventType.Response) {
          // Upload complete
          this.message = 'Arquivo(s) carregado(s) com sucesso!';
          // Reload the current attachments
          this.loadAnexos(solicitacaoId);
          // Clear selected files
          this.selectedFiles = [];
          this.progressInfos = [];
        }
      },
      error: (err: any) => {
        this.progressInfos[index].value = 0;
        this.message = 'Erro ao carregar arquivo: ' + file.name;
        console.error('Error uploading file:', err);
        this.snackBar.open('Erro ao carregar arquivo: ' + file.name, 'Fechar', { duration: 5000 });
      }
    });
  }

  // Method to remove a file from the selected files list
  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    if (this.progressInfos[index]) {
      this.progressInfos.splice(index, 1);
    }
  }

  // Method triggered when user clicks the upload button
  onUploadFiles(): void {
    if (this.solicitacao?.id && this.selectedFiles.length > 0) {
      this.uploadAnexos(this.solicitacao.id);
    }
  }

  // Method to download an attachment
  downloadAnexo(anexoId: number, nomeArquivo: string): void {
    this.solicitacaoAnexoService.downloadAnexo(anexoId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading attachment:', error);
        this.snackBar.open('Erro ao baixar anexo', 'Fechar', { duration: 5000 });
      }
    });
  }

  // Method to delete an attachment with confirmation
  deleteAnexo(anexo: SolicitacaoAnexo): void {
    if (!anexo.id) return;

    // Check if the current user can delete this attachment
    if (!this.canDeleteAttachment(anexo)) {
      this.snackBar.open('Você não tem permissão para excluir este arquivo', 'Fechar', { duration: 5000 });
      return;
    }

    // Open confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Exclusão',
        message: `Tem certeza que deseja excluir o arquivo "${anexo.nomearquivo}"? Esta ação não pode ser desfeita.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // User confirmed deletion
        this.solicitacaoAnexoService.deleteAnexo(anexo.id!).subscribe({
          next: () => {
            // Remove the attachment from the list
            this.anexos = this.anexos.filter(a => a.id !== anexo.id);
            this.snackBar.open('Arquivo excluído com sucesso', 'Fechar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting attachment:', error);
            this.snackBar.open('Erro ao excluir arquivo', 'Fechar', { duration: 5000 });
          }
        });
      }
    });
  }

  // Method to check if the current user can delete an attachment
  canDeleteAttachment(anexo: SolicitacaoAnexo): boolean {
    // Admins and lawyers can delete any attachment
    if (this.authService.isAdmin() || this.authService.isAdvogado()) {
      return true;
    }
    
    // Correspondents can only delete their own attachments (origin = "correspondente")
    if (this.authService.isCorrespondente()) {
      return anexo.origem === 'correspondente';
    }
    
    // Default to false for other roles
    return false;
  }

  // Method to get tooltip message for delete button
  getDeleteTooltip(anexo: SolicitacaoAnexo): string {
    if (!this.canUploadFiles()) {
      // Check if it's because of user role or status
      if ((this.authService.isAdmin() || this.authService.isAdvogado()) && 
          this.isStatusFinalizada()) {
        return 'Não é possível excluir arquivos pois a solicitação já foi finalizada';
      } else if (this.authService.isCorrespondente()) {
        const status = this.solicitacao?.statusSolicitacao?.status;
        if (status === 'Finalizada' || status === 'Finalizado') {
          return 'Não é possível excluir arquivos pois a solicitação já foi finalizada';
        } else {
          return 'Não é possível excluir arquivos nesta fase da solicitação';
        }
      } else if (!(this.authService.isAdmin() || this.authService.isAdvogado()) && 
                 !(this.solicitacao?.statusSolicitacao?.status === 'Em Produção' || this.isStatusConcluido())) {
        return 'Não é possível excluir arquivos pois a solicitação já foi finalizada pelo solicitante';
      }
      return 'Não é possível excluir arquivos';
    }
    
    if (!this.canDeleteAttachment(anexo)) {
      return 'Você não tem permissão para excluir este arquivo';
    }
    
    return 'Excluir arquivo';
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
      // Also reload attachments
      this.loadAnexos(this.solicitacao.id);
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

    // Handle dataconclusao based on status changes
    if (newStatus === 'Concluído' || newStatus === 'Finalizada') {
      // When correspondent concludes the solicitation, set dataconclusao to current date
      updatedSolicitacao.dataconclusao = new Date();
    } else if (newStatus === 'Aguardando Confirmação') {
      // When setting to Aguardando Confirmação, clear dataconclusao
      updatedSolicitacao.dataconclusao = undefined;
    }

    this.solicitacaoService.updateSolicitacao(this.solicitacao.id, updatedSolicitacao).subscribe({
      next: (updated) => {
        this.solicitacao = updated;
        // Refresh attachments to ensure button states are updated
        if (this.solicitacao?.id) {
          this.loadAnexos(this.solicitacao.id);
        }
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
    // Only correspondents are restricted when status is "Finalizada" or "Concluído"
    return this.authService.isCorrespondente() && 
           !this.isStatusFinalizada() &&
           !this.isStatusConcluido();
  }

  // Method to check if an admin or lawyer can change the status
  canAdminOrLawyerChangeStatus(): boolean {
    // Admins or lawyers can always change status, even when it's "Finalizada"
    return this.authService.isAdmin() || this.authService.isAdvogado();
  }

  // Helper method to check if status is Finalizada (handles potential variations)
  isStatusFinalizada(): boolean {
    const status = this.solicitacao?.statusSolicitacao?.status;
    return status === 'Finalizada' || status === 'Finalizado';
  }
  
  // Helper method to check if status is Concluído (handles potential variations)
  isStatusConcluido(): boolean {
    const status = this.solicitacao?.statusSolicitacao?.status;
    return status === 'Concluído' || status === 'Concluida';
  }
  
  // Method to check if all buttons should be disabled (when status is "Aguardando Confirmação" or "Concluído" or "Finalizada")
  shouldDisableAllButtons(): boolean {
    return this.solicitacao?.statusSolicitacao?.status === 'Aguardando Confirmação' || 
           this.isStatusConcluido() ||
           this.isStatusFinalizada();
  }

  // Method to check if file upload is allowed
  canUploadFiles(): boolean {
    // Admins and lawyers can always upload files unless status is Finalizado
    if (this.authService.isAdmin() || this.authService.isAdvogado()) {
      return !this.isStatusFinalizada();
    }
    
    // For correspondents, check the status
    // Correspondents can upload files when status is "Em Produção" or "Concluído"
    // But not when status is "Finalizado"
    const status = this.solicitacao?.statusSolicitacao?.status;
    return status === 'Em Produção' || this.isStatusConcluido();
  }

  // Method to get tooltip message for file upload button
  getFileUploadTooltip(): string {
    if (this.canUploadFiles()) {
      return 'Adicionar arquivos';
    }
    
    // Check if it's because of user role or status
    if ((this.authService.isAdmin() || this.authService.isAdvogado()) && 
        this.isStatusFinalizada()) {
      return 'Não é possível adicionar arquivos pois a solicitação já foi finalizada';
    } else if (this.authService.isCorrespondente()) {
      const status = this.solicitacao?.statusSolicitacao?.status;
      if (status === 'Finalizada' || status === 'Finalizado') {
        return 'Não é possível adicionar arquivos pois a solicitação já foi finalizada';
      } else {
        return 'Não é possível adicionar arquivos nesta fase da solicitação';
      }
    } else if (!(this.authService.isAdmin() || this.authService.isAdvogado()) && 
               !(this.solicitacao?.statusSolicitacao?.status === 'Em Produção' || this.isStatusConcluido())) {
      return 'Não é possível adicionar arquivos pois a solicitação já foi finalizada pelo solicitante';
    }
    
    return 'Não é possível adicionar arquivos';
  }

  // Method to get the CSS class for an attachment based on its origin
  getAttachmentClass(anexo: SolicitacaoAnexo): string {
    console.log('Getting class for attachment:', anexo);
    console.log('Attachment origin:', anexo.origem);
    if (anexo.origem === 'correspondente') {
      console.log('Returning attachment-correspondente class');
      return 'attachment-correspondente';
    } else {
      console.log('Returning attachment-solicitante class');
      return 'attachment-solicitante';
    }
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

  /**
   * Format dates with time for display (specifically for file upload timestamps)
   * 
   * @param date - Date object, string or undefined
   * @returns Formatted date string in DD/MM/YYYY HH:mm format
   */
  formatDateTime(date: Date | string | undefined): string {
    return this.dateFormatService.formatDateTime(date);
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