import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { PermissionService } from '../../../core/services/permission.service';
// Add import for the new attachment service
import { SolicitacaoAnexoService } from '../../../core/services/solicitacao-anexo.service';
import { Solicitacao } from '../../../shared/models/solicitacao.model';
// Add import for the attachment model
import { SolicitacaoAnexo } from '../../../shared/models/solicitacao-anexo.model';
import { DateFormatService } from '../../../shared/services/date-format.service';
// Add MatDialog import for confirmation dialog
import { MatDialog } from '@angular/material/dialog';
// Add import for confirmation dialog component
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
// Add HttpEventType import for file upload progress handling
import { HttpEventType } from '@angular/common/http';
// Add AuthService import for role-based functionality
import { AuthService } from '../../../core/services/auth.service';
// Add import for external storage authentication
import { ExternalStorageAuthGuardService } from '../../../core/services/external-storage-auth-guard.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-request-detail',
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressBarModule
  ]
})
export class RequestDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private solicitacaoService = inject(SolicitacaoService);
  public permissionService = inject(PermissionService);
  private snackBar = inject(MatSnackBar);
  private dateFormatService = inject(DateFormatService);
  // Add the new attachment service to the constructor
  private solicitacaoAnexoService = inject(SolicitacaoAnexoService);
  // Add MatDialog to the constructor
  private dialog = inject(MatDialog);
  // Add AuthService to the constructor
  private authService = inject(AuthService);
  // Add external storage auth guard service
  private externalStorageAuthGuard = inject(ExternalStorageAuthGuardService);
  
  solicitacao: Solicitacao | null = null;
  loading = true;
  // Add property for attachments
  anexos: SolicitacaoAnexo[] = [];
  
  // File attachment properties
  selectedFiles: File[] = [];
  progressInfos: { value: number; fileName: string }[] = [];
  message = '';
  
  // Storage location selection
  storageLocation: 'local' | 'google_drive' = 'google_drive';

  private themeSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const requestId = +params['id'];
      if (requestId) {
        this.loadRequest(requestId);
        // Load attachments for this request
        this.loadAnexos(requestId);
      }
    });
    
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  setupThemeListener(): void {
    // Listen for theme changes to trigger change detection
    this.themeSubscription = new Subscription();
    const themeHandler = () => {
      // Force change detection when theme changes
      // This will cause the component to re-render with the new theme styles
    };
    
    window.addEventListener('themeChanged', themeHandler);
    // Clean up the event listener when component is destroyed
    this.themeSubscription.add(() => {
      window.removeEventListener('themeChanged', themeHandler);
    });
  }

  private loadRequest(requestId: number): void {
    this.solicitacaoService.getSolicitacaoById(requestId).subscribe({
      next: (solicitacao) => {
        this.solicitacao = solicitacao;
        this.loading = false;
        // Debug log removed
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
        // Debug log removed
        // Add debugging to check origin values
        this.anexos = anexos;
      },
      error: (error) => {
        console.error('Error loading attachments:', error);
        this.snackBar.open('Erro ao carregar anexos', 'Fechar', { duration: 5000 });
      }
    });
  }

  selectFiles(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFiles = Array.from(target.files || []);
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

    for (const file of this.selectedFiles) {
      this.progressInfos.push({ value: 0, fileName: file.name });
    }

    for (let i = 0; i < this.selectedFiles.length; i++) {
      this.uploadAnexo(solicitacaoId, this.selectedFiles[i], i);
    }
  }

  // Method to upload a single file
  private uploadAnexo(solicitacaoId: number, file: File, index: number): void {
    this.solicitacaoAnexoService.uploadAnexo(file, solicitacaoId, this.storageLocation).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
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
      error: (err) => {
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
      // Check storage location and proceed accordingly
      if (this.storageLocation === 'local') {
        // For local storage, proceed directly without authentication
        if (this.solicitacao?.id) {
          this.uploadAnexos(this.solicitacao.id);
        }
      } else {
        // For Google Drive, check external storage authentication before uploading
        this.externalStorageAuthGuard.checkAuthentication().subscribe({
          next: (isAuthenticated) => {
            if (isAuthenticated) {
              // Proceed with upload if authenticated
              if (this.solicitacao?.id) {
                this.uploadAnexos(this.solicitacao.id);
              }
            } else {
              // Show message if not authenticated
              this.message = 'Upload cancelado. Por favor, autentique-se com o armazenamento externo primeiro.';
              this.snackBar.open('Upload cancelado. Por favor, autentique-se com o armazenamento externo primeiro.', 'Fechar', { duration: 5000 });
            }
          },
          error: (error) => {
            console.error('Error checking authentication:', error);
            this.message = 'Erro ao verificar autenticação. Por favor, tente novamente.';
            this.snackBar.open('Erro ao verificar autenticação. Por favor, tente novamente.', 'Fechar', { duration: 5000 });
          }
        });
      }
    }
  }

  // Method to download an attachment
  downloadAnexo(anexoId: number, nomeArquivo: string, storageLocation?: string): void {
    // Check storage location and proceed accordingly
    if (storageLocation === 'google_drive') {
      // For Google Drive, check external storage authentication before downloading
      this.externalStorageAuthGuard.checkAuthentication().subscribe({
        next: (isAuthenticated) => {
          if (isAuthenticated) {
            // Proceed with download if authenticated
            this.performDownload(anexoId, nomeArquivo);
          } else {
            // Show message if not authenticated
            this.snackBar.open('Download cancelado. Por favor, autentique-se com o armazenamento externo primeiro.', 'Fechar', { duration: 5000 });
          }
        },
        error: (error) => {
          console.error('Error checking authentication:', error);
          this.snackBar.open('Erro ao verificar autenticação. Por favor, tente novamente.', 'Fechar', { duration: 5000 });
        }
      });
    } else {
      // For local storage, proceed directly
      this.performDownload(anexoId, nomeArquivo);
    }
  }
  
  // Method to perform the actual download
  private performDownload(anexoId: number, nomeArquivo: string): void {
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
        this.solicitacaoAnexoService.deleteAnexo(anexo.id!,anexo.origem!).subscribe({
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

  editRequest(): void {
    if (this.solicitacao?.id) {
      this.router.navigate(['/solicitacoes/editar', this.solicitacao.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/solicitacoes']);
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
    // Debug log removed
    const result = this.dateFormatService.formatDate(date);
    // Debug log removed
    return result;
  }

  /**
   * Format dates with time for display (specifically for file upload timestamps)
   * 
   * @param date - Date object, string or undefined
   * @returns Formatted date string in DD/MM/YYYY HH:mm format
   */
  formatDateTime(date: Date | string | undefined): string {
    // Debug log removed
    const result = this.dateFormatService.formatDateTime(date);
    // Debug log removed
    return result;
  }

  // Helper method to check if the solicitation is of type Audiência
  isAudiencia(): boolean {
    if (!this.solicitacao?.tipoSolicitacao) {
      return false;
    }
    
    const especie = this.solicitacao.tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = this.solicitacao.tipoSolicitacao.tipo?.toLowerCase() || '';
    
    return especie.includes('audiencia') || especie.includes('audiência') || 
           tipo.includes('audiencia') || tipo.includes('audiência');
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

  // Method to check if file upload is allowed
  canUploadFiles(): boolean {
    // Admins and lawyers can always upload files unless status is Finalizado
    if (this.authService.isAdmin() || this.authService.isAdvogado()) {
      return this.solicitacao?.statusSolicitacao?.status !== 'Finalizado';
    }
    
    // For other users, check the status
    const status = this.solicitacao?.statusSolicitacao?.status;
    return status === 'Em Andamento' || status === 'Concluído';
  }

  // Method to get tooltip message for file upload button
  getFileUploadTooltip(): string {
    if (this.canUploadFiles()) {
      return 'Adicionar arquivos';
    }
    
    // Check if it's because of user role or status
    if ((this.authService.isAdmin() || this.authService.isAdvogado()) && 
        this.solicitacao?.statusSolicitacao?.status === 'Finalizado') {
      return 'Não é possível adicionar arquivos pois a solicitação já foi finalizada';
    } else if (!(this.authService.isAdmin() || this.authService.isAdvogado()) && 
               !(this.solicitacao?.statusSolicitacao?.status === 'Em Andamento' || this.solicitacao?.statusSolicitacao?.status === 'Concluído')) {
      return 'Não é possível adicionar arquivos pois a solicitação já foi finalizada pelo solicitante';
    }
    
    return 'Não é possível adicionar arquivos';
  }

  // Method to get tooltip message for delete button
  getDeleteTooltip(anexo: SolicitacaoAnexo): string {
    if (!this.canUploadFiles()) {
      // Check if it's because of user role or status
      if ((this.authService.isAdmin() || this.authService.isAdvogado()) && 
          this.solicitacao?.statusSolicitacao?.status === 'Finalizado') {
        return 'Não é possível excluir arquivos pois a solicitação já foi finalizada';
      } else if (!(this.authService.isAdmin() || this.authService.isAdvogado()) && 
                 !(this.solicitacao?.statusSolicitacao?.status === 'Em Andamento' || this.solicitacao?.statusSolicitacao?.status === 'Concluído')) {
        return 'Não é possível excluir arquivos pois a solicitação já foi finalizada pelo solicitante';
      }
      return 'Não é possível excluir arquivos';
    }
    
    if (!this.canDeleteAttachment(anexo)) {
      return 'Você não tem permissão para excluir este arquivo';
    }
    
    return 'Excluir arquivo';
  }

  // Method to get the CSS class for an attachment based on its origin
  getAttachmentClass(anexo: SolicitacaoAnexo): string {
    // Debug log removed
    // Debug log removed
    if (anexo.origem === 'correspondente') {
      // Debug log removed
      return 'attachment-correspondente';
    } else {
      // Debug log removed
      return 'attachment-solicitante';
    }
  }

  // Helper method to check if the solicitation is of type Diligência
  isDiligencia(): boolean {
    if (!this.solicitacao?.tipoSolicitacao) {
      return false;
    }
    
    const especie = this.solicitacao.tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = this.solicitacao.tipoSolicitacao.tipo?.toLowerCase() || '';
    
    return especie.includes('diligencia') || especie.includes('diligência') || 
           tipo.includes('diligencia') || tipo.includes('diligência');
  }
}