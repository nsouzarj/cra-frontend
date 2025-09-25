import { Component, OnDestroy, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpEventType } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Models
import { Solicitacao } from '../../../shared/models/solicitacao.model';
import { Processo } from '../../../shared/models/processo.model';
import { User } from '../../../shared/models/user.model';
import { TipoSolicitacao } from '../../../shared/models/tiposolicitacao.model';
import { SolicitacaoStatus } from '../../../shared/models/solicitacao.model';
import { SolicitacaoAnexo } from '../../../shared/models/solicitacao-anexo.model';
import { Correspondente } from '../../../shared/models/correspondente.model';

// Components
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

// Services
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../../core/services/solicitacao-status.service';
import { ProcessoService } from '../../../core/services/processo.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { UserService } from '../../../core/services/user.service';
import { TipoSolicitacaoService } from '../../../core/services/tiposolicitacao.service';
import { SolicitacaoAnexoService } from '../../../core/services/solicitacao-anexo.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExternalStorageAuthGuardService } from '../../../core/services/external-storage-auth-guard.service';

interface ProgressInfo {
  value: number;
  fileName: string;
}

@Component({
  selector: 'app-request-form',
  templateUrl: './request-form.component.html',
  styleUrls: ['./request-form.component.scss']
})
export class RequestFormComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  requestForm: FormGroup;
  requestId: number | null = null;
  isEditMode = false;
  loading = false;
  message = '';
  
  // Dropdown data
  processos: Processo[] = [];
  filteredProcessos: Processo[] = [];
  correspondentes: Correspondente[] = [];
  filteredCorrespondentes: Correspondente[] = [];
  usuarios: User[] = [];
  tiposSolicitacao: TipoSolicitacao[] = [];
  statuses: SolicitacaoStatus[] = [];
  
  // File upload related
  selectedFiles: File[] = [];
  progressInfos: ProgressInfo[] = [];
  currentFiles: SolicitacaoAnexo[] = [];
  
  // Conditional field visibility
  showAudienciaFields = false;
  showValorField = false;
  
  // Theme subscription
  themeSubscription: Subscription | null = null;
  
  // Loaded solicitacao for edit mode
  loadedSolicitacao: Solicitacao | null = null;
  
  // Storage location selection
  storageLocation: 'local' | 'google_drive' = 'google_drive';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private solicitacaoService: SolicitacaoService,
    private solicitacaoStatusService: SolicitacaoStatusService,
    private processoService: ProcessoService,
    private correspondenteService: CorrespondenteService,
    private userService: UserService,
    private tipoSolicitacaoService: TipoSolicitacaoService,
    // Add the new attachment service to the constructor
    private solicitacaoAnexoService: SolicitacaoAnexoService,
    // Inject AuthService to determine user role
    private authService: AuthService,
    // Add external storage auth guard service
    private externalStorageAuthGuard: ExternalStorageAuthGuardService,
    // Inject ChangeDetectorRef
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.requestForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadDropdownData();
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.requestId = +params['id'];
        this.loadRequest();
        // Load existing attachments for this request
        this.loadAnexos();
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
    const themeHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Force change detection when theme changes
      // This will cause the component to re-render with the new theme styles
    };
    
    window.addEventListener('themeChanged', themeHandler);
    // Clean up the event listener when component is destroyed
    this.themeSubscription.add(() => {
      window.removeEventListener('themeChanged', themeHandler);
    });
  }

  private createForm(): FormGroup {
    const form = this.formBuilder.group({
      tipoSolicitacao: [null, Validators.required],
      status: [''], // Will be set to "Aguardando Confirmação" in onSubmit for new solicitations
      processo: [null, Validators.required],
      correspondente: [null, Validators.required],
      usuario: [null, Validators.required],
      dataSolicitacao: [this.getCurrentDate()], // Pre-filled with current date but editable by user
      dataPrazo: [''],
      instrucoes: [''],
      // Conditional fields
      dataAgendamento: [''],
      horaAudiencia: [''], // Changed from horaAudiencia to match model property
      valor: [''] // Remove initial validator, let onTipoSolicitacaoChange handle it
    });
    
    console.log('Form created with controls:', Object.keys(form.controls));
    return form;
  }

  // Helper method to get current date in YYYY-MM-DD format
  private getCurrentDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper method to format date for display
  private formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  private loadDropdownData(): void {
    // Load processos
    this.processoService.getProcessos().subscribe({
      next: (processos) => {
        this.processos = processos;
        // Filter to only show processes with status "EM_ANDAMENTO"
        this.filteredProcessos = processos.filter(p => p.status === 'EM_ANDAMENTO');
      },
      error: (error) => {
        console.error('Error loading processos:', error);
        this.snackBar.open('Erro ao carregar processos', 'Fechar', { duration: 5000 });
      }
    });

    // Load correspondentes
    this.correspondenteService.getCorrespondentes().subscribe({
      next: (correspondentes) => {
        this.correspondentes = correspondentes;
        // Filter to only show active correspondentes
        this.filteredCorrespondentes = correspondentes.filter(c => c.ativo === true);
      },
      error: (error) => {
        console.error('Error loading correspondentes:', error);
        this.snackBar.open('Erro ao carregar correspondentes', 'Fechar', { duration: 5000 });
      }
    });

    // Load usuarios
    this.userService.getUsers().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: (error) => {
        console.error('Error loading usuarios:', error);
        this.snackBar.open('Erro ao carregar usuários', 'Fechar', { duration: 5000 });
      }
    });

    // Load tipos de solicitacao
    this.tipoSolicitacaoService.getTiposSolicitacao().subscribe({
      next: (tipos) => {
        this.tiposSolicitacao = tipos;
      },
      error: (error) => {
        console.error('Error loading tipos de solicitacao:', error);
        this.snackBar.open('Erro ao carregar tipos de solicitação', 'Fechar', { duration: 5000 });
      }
    });

    // Load statuses
    this.solicitacaoStatusService.getSolicitacaoStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.snackBar.open('Erro ao carregar status', 'Fechar', { duration: 5000 });
      }
    });
  }

  private loadRequest(): void {
    if (!this.requestId) return;
    
    this.loading = true;
    this.solicitacaoService.getSolicitacaoById(this.requestId).subscribe({
      next: (solicitacao) => {
        // Store the complete solicitacao object to preserve fields not in the form
        this.loadedSolicitacao = solicitacao;
        
        // Ensure dataSolicitacao is populated with current date if empty
        const dataSolicitacaoValue = solicitacao.datasolicitacao || this.getCurrentDate();
        
        // Format the valor for display if it exists
        let formattedValor = null;
        if (solicitacao.valor !== null && solicitacao.valor !== undefined) {
          formattedValor = solicitacao.valor;
        }
        
        this.requestForm.patchValue({
          tipoSolicitacao: solicitacao.tipoSolicitacao?.idtiposolicitacao || null,
          status: solicitacao.statusSolicitacao?.idstatus || (this.statuses && this.statuses.length > 0 ? this.statuses[0].idstatus : 1),
          processo: solicitacao.processo?.id || null,
          correspondente: solicitacao.correspondente?.id || null,
          usuario: solicitacao.usuario?.id || null,
          dataSolicitacao: dataSolicitacaoValue,
          dataPrazo: solicitacao.dataprazo || '',
          instrucoes: solicitacao.instrucoes || '',
          observacao: solicitacao.observacao || '',
          // Conditional fields
          dataAgendamento: solicitacao.dataagendamento || '',
          horaAudiencia: solicitacao.horaudiencia || '',
          valor: formattedValor
        });
        
        // Check if we need to show conditional fields based on the loaded tipoSolicitacao
        if (solicitacao.tipoSolicitacao?.idtiposolicitacao) {
          this.updateConditionalFields(solicitacao.tipoSolicitacao.idtiposolicitacao);
        }
        
        // Ensure conditional fields are shown if they have values (for edit mode)
        if (solicitacao.dataagendamento || solicitacao.horaudiencia) {
          this.showAudienciaFields = true;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading solicitacao:', error);
        this.snackBar.open('Erro ao carregar solicitação', 'Fechar', { duration: 5000 });
        this.loading = false;
        this.router.navigate(['/solicitacoes']);
      }
    });
  }

  // Load existing attachments for the current request
  private loadAnexos(): void {
    if (!this.requestId) return;
    
    this.solicitacaoAnexoService.getAnexosBySolicitacaoId(this.requestId).subscribe({
      next: (anexos) => {
        this.currentFiles = anexos;
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

  // Method to format currency input for Brazilian format
  formatCurrency(event: any): void {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Remove all non-digit characters
    
    // Handle empty value
    if (value === '') {
      this.requestForm.get('valor')?.setValue(null, { emitEvent: false });
      return;
    }
    
    // Convert to number by inserting decimal point in the correct position
    // For Brazilian format, last 2 digits are decimal places
    let formattedValue: string;
    if (value.length <= 2) {
      formattedValue = '0.' + value.padStart(2, '0');
    } else {
      const integerPart = value.slice(0, -2);
      const decimalPart = value.slice(-2);
      formattedValue = integerPart + '.' + decimalPart;
    }
    
    // Convert to number
    const numberValue = parseFloat(formattedValue);
    if (!isNaN(numberValue)) {
      // Update the form control with the numeric value
      this.requestForm.get('valor')?.setValue(numberValue, { emitEvent: false });
    }
  }

  // Method to format a number as Brazilian currency for display
  formatCurrencyDisplay(value: number | string | null): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    // Convert string to number if needed
    let numericValue: number;
    if (typeof value === 'string') {
      // Remove any existing formatting
      const cleanValue = value.replace(/[^0-9,]/g, '').replace(',', '.');
      numericValue = parseFloat(cleanValue);
      if (isNaN(numericValue)) {
        return '';
      }
    } else {
      numericValue = value;
    }
    
    // Format as Brazilian currency without the R$ symbol
    return numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Helper method to check if a tipoSolicitacao is Audiência
  private isTipoAudiencia(tipoSolicitacao: TipoSolicitacao): boolean {
    if (!tipoSolicitacao) return false;
    
    const especie = tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = tipoSolicitacao.tipo?.toLowerCase() || '';
    
    return especie.includes('audiencia') || especie.includes('audiência') || 
           tipo.includes('audiencia') || tipo.includes('audiência');
  }
  
  // Helper method to check if a tipoSolicitacao is Diligência
  private isTipoDiligencia(tipoSolicitacao: TipoSolicitacao): boolean {
    if (!tipoSolicitacao) return false;
    
    const especie = tipoSolicitacao.especie?.toLowerCase() || '';
    const tipo = tipoSolicitacao.tipo?.toLowerCase() || '';
    
    console.log('Checking if tipo is diligencia:', { especie, tipo });
    
    // Match the diligência detection logic used in the dashboard
    const isDiligencia = especie.includes('diligencia') || especie.includes('diligência') || 
           tipo.includes('diligencia') || tipo.includes('diligência') ||
           especie.includes('dilig') || tipo.includes('dilig') ||
           especie.includes('cumprimento') || tipo.includes('cumprimento');
           
    console.log('Is diligencia result:', isDiligencia);
    return isDiligencia;
  }
  
  // Method to handle tipoSolicitacao selection change
  onTipoSolicitacaoChange(tipoSolicitacaoId: number): void {
    console.log('Tipo solicitacao changed to:', tipoSolicitacaoId);
    this.updateConditionalFields(tipoSolicitacaoId);
    
    // Update validator for valor field based on showValorField
    const valorControl = this.requestForm.get('valor');
    if (this.showValorField) {
      valorControl?.setValidators(Validators.required);
    } else {
      valorControl?.clearValidators();
    }
    valorControl?.updateValueAndValidity();
    
    // Force change detection to ensure the template updates
    this.changeDetectorRef.detectChanges();
  }

  // Method to update visibility of conditional fields based on tipoSolicitacao
  private updateConditionalFields(tipoSolicitacaoId: number): void {
    console.log('Updating conditional fields for tipo:', tipoSolicitacaoId);
    // Find the selected tipoSolicitacao
    const selectedTipo = this.tiposSolicitacao.find(tipo => tipo.idtiposolicitacao === tipoSolicitacaoId);
    
    console.log('Selected tipo:', selectedTipo);
    
    if (selectedTipo) {
      // Check if it's "Audiência" (case insensitive, with or without accents)
      const isAudiencia = this.isTipoAudiencia(selectedTipo);
      // For diligência, we hide the audiência fields
      const isDiligencia = this.isTipoDiligencia(selectedTipo);
      
      console.log('Is audiencia:', isAudiencia, 'Is diligencia:', isDiligencia);
      
      // Show/hide fields based on tipo - only show for audiencia, hide for diligencia
      this.showAudienciaFields = isAudiencia;
      this.showValorField = isAudiencia || isDiligencia;
      
      console.log('Setting showAudienciaFields to:', this.showAudienciaFields);
      console.log('Setting showValorField to:', this.showValorField);
      
      // Additional logging for debugging
      console.log('Tipo details:', {
        especie: selectedTipo.especie,
        tipo: selectedTipo.tipo,
        isAudiencia,
        isDiligencia
      });
    } else {
      // Default to hiding conditional fields
      this.showAudienciaFields = false;
      this.showValorField = false;
      console.log('Setting showAudienciaFields to false (default)');
      console.log('Setting showValorField to false (default)');
    }
    
    // Special case: If we're in edit mode and already have audiencia data, ensure fields are visible
    if (this.isEditMode) {
      const formValue = this.requestForm.getRawValue();
      console.log('Edit mode form values:', formValue);
      
      if (formValue.dataAgendamento || formValue.horaAudiencia) {
        // Only show for audiencia types in edit mode
        if (selectedTipo && this.isTipoAudiencia(selectedTipo)) {
          this.showAudienciaFields = true;
          console.log('Overriding showAudienciaFields to true (edit mode with existing audiencia data)');
        }
      }
      
      // Also check if the current tipoSolicitacao is Audiência
      if (selectedTipo && this.isTipoAudiencia(selectedTipo)) {
        this.showAudienciaFields = true;
        console.log('Overriding showAudienciaFields to true (edit mode with audiencia tipo)');
      }
      
      // Ensure valor field is visible if there's a value (for both audiencia and diligencia)
      if (formValue.valor) {
        this.showValorField = true;
        console.log('Overriding showValorField to true (edit mode with existing valor)');
      }
    }
    
    console.log('Final showAudienciaFields value:', this.showAudienciaFields);
    console.log('Final showValorField value:', this.showValorField);
    
    // Force change detection to ensure the template updates
    this.changeDetectorRef.detectChanges();
  }

  // Method to upload all selected files
  private uploadAnexos(solicitacaoId: number): void {
    // Check storage location and proceed accordingly
    if (this.storageLocation === 'local') {
      // For local storage, proceed directly without authentication
      this.performUpload(solicitacaoId);
    } else {
      // For Google Drive, check external storage authentication before uploading
      this.externalStorageAuthGuard.checkAuthentication().subscribe({
        next: (isAuthenticated) => {
          if (isAuthenticated) {
            // Proceed with upload if authenticated
            this.performUpload(solicitacaoId);
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

  // Method to perform the actual upload
  private performUpload(solicitacaoId: number): void {
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
    this.solicitacaoAnexoService.uploadAnexo(file, solicitacaoId, this.storageLocation).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Upload progress
          const progress = Math.round(100 * event.loaded / event.total);
          this.progressInfos[index].value = progress;
        } else if (event.type === HttpEventType.Response) {
          // Upload complete
          this.message = 'Arquivo(s) carregado(s) com sucesso!';
          // Reload the current attachments
          this.loadAnexos();
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

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    // Show confirmation dialog
    const action = this.isEditMode ? 'atualizar' : 'criar';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar operação',
        message: `Tem certeza que deseja ${action} esta solicitação?`,
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.proceedWithSave();
      }
    });
  }

  private proceedWithSave(): void {
    this.loading = true;
    
    // Prepare the solicitacao object
    const formValue = this.requestForm.getRawValue(); // Use getRawValue to include disabled fields
    
    // Start with the loaded solicitacao to preserve fields not in the form
    const solicitacao: any = this.loadedSolicitacao ? { ...this.loadedSolicitacao } : {};
    
    // Update fields that are in the form
    solicitacao.datasolicitacao = formValue.dataSolicitacao || this.getCurrentDate(); // Ensure we always have a value
    solicitacao.dataprazo = formValue.dataPrazo || null;
    solicitacao.instrucoes = formValue.instrucoes || null;
    solicitacao.ativo = true;

    // Add conditional fields if they should be included
    // For Audiência, always include horaAudiencia when it exists in the form (especially in edit mode)
    if (this.showAudienciaFields || (this.isEditMode && formValue.horaAudiencia !== undefined)) {
      solicitacao.dataagendamento = formValue.dataAgendamento || null;
      solicitacao.horaudiencia = formValue.horaAudiencia || null; // Fixed property name
      console.log('Setting audiencia fields:', {
        dataagendamento: solicitacao.dataagendamento,
        horaudiencia: solicitacao.horaudiencia
      });
    }
    
    // Always include valor field for diligência and audiência types
    if (this.showValorField) {
      // The valor is already stored as a number in the form control
      solicitacao.valor = formValue.valor || null;
    }

    // Add relationships if selected
    // Set default status for new solicitations
    if (!this.isEditMode) {
      // Find "Aguardando Confirmação" status
      const aguardandoConfirmacaoStatus = this.statuses.find(s => s.status === 'Aguardando Confirmação' || s.status === 'Aguardando Confirmacao');
      if (aguardandoConfirmacaoStatus) {
        solicitacao.statusSolicitacao = { idstatus: aguardandoConfirmacaoStatus.idstatus };
      } else {
        // Fallback to first status if "Aguardando Confirmação" is not found
        solicitacao.statusSolicitacao = { idstatus: this.statuses.length > 0 ? this.statuses[0].idstatus : 1 };
      }
      
      // When creating a new solicitation with "Aguardando Confirmação" status, clear dataconclusao
      solicitacao.dataconclusao = undefined;
    } else if(formValue.status){
      // Use selected status for editing
      solicitacao.statusSolicitacao = { idstatus: formValue.status };
      
      // When editing, check if status is "Aguardando Confirmação" and clear dataconclusao if so
      const selectedStatus = this.statuses.find(s => s.idstatus === formValue.status);
      if (selectedStatus && (selectedStatus.status === 'Aguardando Confirmação' || selectedStatus.status === 'Aguardando Confirmacao')) {
        solicitacao.dataconclusao = undefined;
      }
    }

    if (formValue.tipoSolicitacao) {
      solicitacao.tipoSolicitacao = { idtiposolicitacao: formValue.tipoSolicitacao };
    }
    
    if (formValue.processo) {
      solicitacao.processo = { id: formValue.processo };
    }
    
    if (formValue.correspondente) {
      solicitacao.correspondente = { id: formValue.correspondente };
    }
    
    if (formValue.usuario) {
      solicitacao.usuario = { id: formValue.usuario };
    }

    // Determine if we're creating or updating
    const operation = this.isEditMode && this.requestId
      ? this.solicitacaoService.updateSolicitacao(this.requestId, solicitacao)
      : this.solicitacaoService.createSolicitacao(solicitacao);

    operation.pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (result: any) => {
        // Get the ID of the created/updated solicitation
        const solicitacaoId = this.isEditMode ? this.requestId : (result?.id || result?.idsolicitacao);
        
        const message = this.isEditMode 
          ? 'Solicitação atualizada com sucesso!' 
          : 'Solicitação criada com sucesso!';
        this.snackBar.open(message, 'Fechar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Upload attachments if any were selected
        if (this.selectedFiles.length > 0 && solicitacaoId) {
          this.uploadAnexos(solicitacaoId);
        }
        
        // Navigate to request detail page instead of list
        console.log('Navigating to solicitation details page with ID:', solicitacaoId);
        if (solicitacaoId) {
          // Ensure navigation happens after any file uploads complete
          setTimeout(() => {
            this.router.navigate(['/solicitacoes', solicitacaoId]);
          }, 100);
        } else {
          console.error('Could not navigate to solicitation details page: solicitacaoId is null or undefined');
          console.log('Result object:', result);
          this.router.navigate(['/solicitacoes']);
        }
      },
      error: (error) => {
        console.error('Error saving solicitacao:', error);
        const message = this.isEditMode
          ? 'Erro ao atualizar solicitação'
          : 'Erro ao criar solicitação';
        this.snackBar.open(message, 'Fechar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.requestId) {
      // When editing, go back to the detail page
      this.router.navigate(['/solicitacoes', this.requestId]);
    } else {
      // When creating new, go back to the list
      this.router.navigate(['/solicitacoes']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.requestForm.controls).forEach(key => {
      const control = this.requestForm.get(key);
      control?.markAsTouched();
    });
  }
  
  // Helper method to check if a field has an error and has been touched
  isFieldInvalid(fieldName: string): boolean {
    const field = this.requestForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
  
  // Helper method to get error message for a field
  getFieldErrorMessage(fieldName: string): string {
    const field = this.requestForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          'processo': 'Processo',
          'correspondente': 'Correspondente',
          'tipoSolicitacao': 'Tipo de Solicitação',
          'usuario': 'Usuário',
          'valor': 'Valor'
        };
        return `${fieldLabels[fieldName] || fieldName} é obrigatório`;
      }
    }
    return '';
  }
  
  // Method to get the CSS class for an attachment based on its origin
  getAttachmentClass(anexo: SolicitacaoAnexo): string {
    if (anexo.origem === 'correspondente') {
      return 'attachment-correspondente';
    } else {
      return 'attachment-solicitante';
    }
  }
  
  // Method to format dates with time for display (specifically for file upload timestamps)
  formatDateTime(date: Date | string | undefined): string {
    if (!date) return '';
    
    // Handle different date formats
    let dateObj: Date;
    if (typeof date === 'string') {
      // Try to parse different date formats
      if (date.includes(',')) {
        // Handle comma-separated format like "2025,9,11,3,0"
        const parts = date.split(',').map(Number);
        dateObj = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
      } else if (date.includes('/')) {
        // Handle Brazilian format like "11/09/2025"
        const parts = date.split('/');
        dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        // Handle ISO format or other standard formats
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    // Format as DD/MM/YYYY HH:mm
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
}