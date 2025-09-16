import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectChange } from '@angular/material/select';
import { Subscription, finalize } from 'rxjs';
import { SolicitacaoService } from '../../../core/services/solicitacao.service';
import { SolicitacaoStatusService } from '../../../core/services/solicitacao-status.service';
import { ProcessoService } from '../../../core/services/processo.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { UserService } from '../../../core/services/user.service';
import { TipoSolicitacaoService } from '../../../core/services/tiposolicitacao.service';
import { Solicitacao, SolicitacaoStatus } from '../../../shared/models/solicitacao.model';
import { Processo } from '../../../shared/models/processo.model';
import { Correspondente } from '../../../shared/models/correspondente.model';
import { User } from '../../../shared/models/user.model';
import { TipoSolicitacao } from '../../../shared/models/tiposolicitacao.model';
// Add the import for the new attachment service
import { SolicitacaoAnexoService } from '../../../core/services/solicitacao-anexo.service';
// Import AuthService to determine user role
import { AuthService } from '../../../core/services/auth.service';
// Import the updated model
import { SolicitacaoAnexo } from '../../../shared/models/solicitacao-anexo.model';

// Import DateAdapter and related modules for date formatting
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NativeDateAdapter } from '@angular/material/core';
// Import HttpEventType for file upload progress handling
import { HttpEventType } from '@angular/common/http';

// Custom date adapter for Brazilian format
export class BrazilianDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: any): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return null;
  }
}

// Custom date format for Brazilian standard
export const BRAZIL_DATE_FORMAT = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-request-form',
  templateUrl: './request-form.component.html',
  styleUrls: ['./request-form.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: BrazilianDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: BRAZIL_DATE_FORMAT }
  ]
})
export class RequestFormComponent implements OnInit, OnDestroy {
  requestForm: FormGroup;
  isEditMode = false;
  requestId: number | null = null;
  loading = false;
  
  // Dropdown options
  processos: Processo[] = [];
  correspondentes: Correspondente[] = [];
  usuarios: User[] = [];
  tiposSolicitacao: TipoSolicitacao[] = [];
  statuses: SolicitacaoStatus[] = [];
  
  // Filtered dropdown options (only active processes and correspondentes)
  filteredProcessos: Processo[] = [];
  filteredCorrespondentes: Correspondente[] = [];

  // Conditional fields visibility
  showAudienciaFields = false;
  showValorField = false;

  // File attachment properties
  selectedFiles: File[] = [];
  currentFiles: SolicitacaoAnexo[] = [];
  progressInfos: any[] = [];
  message = '';

  private themeSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private solicitacaoService: SolicitacaoService,
    private solicitacaoStatusService: SolicitacaoStatusService,
    private processoService: ProcessoService,
    private correspondenteService: CorrespondenteService,
    private userService: UserService,
    private tipoSolicitacaoService: TipoSolicitacaoService,
    // Add the new attachment service to the constructor
    private solicitacaoAnexoService: SolicitacaoAnexoService,
    // Inject AuthService to determine user role
    private authService: AuthService
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
    return this.formBuilder.group({
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
      horaAudiencia: [''],
      valor: ['', this.showValorField ? Validators.required : null]
    });
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
        // Ensure dataSolicitacao is populated with current date if empty
        const dataSolicitacaoValue = solicitacao.datasolicitacao || this.getCurrentDate();
        
        this.requestForm.patchValue({
          tipoSolicitacao: solicitacao.tipoSolicitacao?.idtiposolicitacao || null,
          status: solicitacao.statusSolicitacao?.idstatus || (this.statuses && this.statuses.length > 0 ? this.statuses[0].status : 'PENDENTE'),
          processo: solicitacao.processo?.id || null,
          correspondente: solicitacao.correspondente?.id || null,
          usuario: solicitacao.usuario?.id || null,
          dataSolicitacao: dataSolicitacaoValue,
          dataPrazo: solicitacao.dataprazo || '',
          instrucoes: solicitacao.instrucoes || '',
          // Conditional fields
          dataAgendamento: solicitacao.dataagendamento || '',
          horaAudiencia: solicitacao.horaudiencia || '',
          valor: solicitacao.valor || ''
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
  formatCurrencyDisplay(value: number | null): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Format as Brazilian currency without the R$ symbol
    return value.toLocaleString('pt-BR', {
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
    
    return especie.includes('diligencia') || especie.includes('diligência') || 
           tipo.includes('diligencia') || tipo.includes('diligência');
  }
  
  // Method to handle tipoSolicitacao selection change
  onTipoSolicitacaoChange(tipoSolicitacaoId: number): void {
    this.updateConditionalFields(tipoSolicitacaoId);
    
    // Update validator for valor field based on showValorField
    const valorControl = this.requestForm.get('valor');
    if (this.showValorField) {
      valorControl?.setValidators(Validators.required);
    } else {
      valorControl?.clearValidators();
    }
    valorControl?.updateValueAndValidity();
  }

  // Method to update visibility of conditional fields based on tipoSolicitacao
  private updateConditionalFields(tipoSolicitacaoId: number): void {
    // Find the selected tipoSolicitacao
    const selectedTipo = this.tiposSolicitacao.find(tipo => tipo.idtiposolicitacao === tipoSolicitacaoId);
    
    if (selectedTipo) {
      // Check if it's "Audiência" (case insensitive, with or without accents)
      const isAudiencia = this.isTipoAudiencia(selectedTipo);
      const isDiligencia = this.isTipoDiligencia(selectedTipo);
      
      // Show/hide fields based on tipo
      this.showAudienciaFields = isAudiencia;
      this.showValorField = isAudiencia || isDiligencia;
    } else {
      // Default to hiding conditional fields
      this.showAudienciaFields = false;
      this.showValorField = false;
    }
    
    // Special case: If we're in edit mode and already have audiencia data, ensure fields are visible
    if (this.isEditMode) {
      const formValue = this.requestForm.getRawValue();
      if (formValue.dataAgendamento || formValue.horaAudiencia) {
        this.showAudienciaFields = true;
      }
      
      // Also check if the current tipoSolicitacao is Audiência
      if (selectedTipo && this.isTipoAudiencia(selectedTipo)) {
        this.showAudienciaFields = true;
      }
    }
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

    this.loading = true;
    
    // Prepare the solicitacao object
    const formValue = this.requestForm.getRawValue(); // Use getRawValue to include disabled fields
    
    const solicitacao: any = {
      datasolicitacao: formValue.dataSolicitacao || this.getCurrentDate(), // Ensure we always have a value
      dataprazo: formValue.dataPrazo || null,
      instrucoes: formValue.instrucoes || null,
      ativo: true
    };

    // Add conditional fields if they should be included
    // For Audiência, always include horaAudiencia when it exists in the form (especially in edit mode)
    if (this.showAudienciaFields || (this.isEditMode && formValue.horaAudiencia !== undefined)) {
      solicitacao.dataagendamento = formValue.dataAgendamento || null;
      solicitacao.horaudiencia = formValue.horaAudiencia || null;
    }
    
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
    } else if(formValue.status){
      // Use selected status for editing
      solicitacao.statusSolicitacao = { idstatus: formValue.status };
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
        const solicitacaoId = this.isEditMode ? this.requestId : result.id;
        const message = this.isEditMode 
          ? 'Solicitação atualizada com sucesso!' 
          : 'Solicitação criada com sucesso!';
        this.snackBar.open(message, 'Fechar', { duration: 3000 });
        
        // Upload attachments if any were selected
        if (this.selectedFiles.length > 0 && solicitacaoId) {
          this.uploadAnexos(solicitacaoId);
        }
        
        this.router.navigate(['/solicitacoes']);
      },
      error: (error) => {
        console.error('Error saving solicitacao:', error);
        const message = this.isEditMode
          ? 'Erro ao atualizar solicitação'
          : 'Erro ao criar solicitação';
        this.snackBar.open(message, 'Fechar', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/solicitacoes']);
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
}