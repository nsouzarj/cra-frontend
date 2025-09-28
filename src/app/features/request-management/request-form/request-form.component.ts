import { Component, OnDestroy, OnInit, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpEventType } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

// Models
import { Solicitacao } from '../../../shared/models/solicitacao.model';
import { Processo } from '../../../shared/models/processo.model';
import { User, UserType } from '../../../shared/models/user.model';
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
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTimepickerModule, NativeDateTimeModule } from '@dhutaryan/ngx-mat-timepicker';

interface ProgressInfo {
  value: number;
  fileName: string;
}

@Component({
  selector: 'app-request-form',
  templateUrl: './request-form.component.html',
  styleUrls: ['./request-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatTimepickerModule,
    NativeDateTimeModule
  ]
})
export class RequestFormComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private solicitacaoService = inject(SolicitacaoService);
  private solicitacaoStatusService = inject(SolicitacaoStatusService);
  private processoService = inject(ProcessoService);
  private correspondenteService = inject(CorrespondenteService);
  private userService = inject(UserService);
  private tipoSolicitacaoService = inject(TipoSolicitacaoService);
  // Add the new attachment service to the constructor
  private solicitacaoAnexoService = inject(SolicitacaoAnexoService);
  // Inject AuthService to determine user role
  private authService = inject(AuthService);
  // Add external storage auth guard service
  private externalStorageAuthGuard = inject(ExternalStorageAuthGuardService);
  // Inject ChangeDetectorRef
  private changeDetectorRef = inject(ChangeDetectorRef);
  
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
  
  // Search controls for dropdowns
  processoSearchControl = new FormControl('');
  correspondenteSearchControl = new FormControl('');
  
  constructor() {
    this.requestForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.loadDropdownData();
    
    // Set up processo search
    this.processoSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      if (typeof searchTerm === 'string') {
        // Check if this is a display value (contains " - ")
        if (searchTerm.includes(' - ')) {
          // This is likely a display value, not a search term
          // Don't filter in this case
          return;
        }
        this.filterProcessos(searchTerm || '');
      } else if (searchTerm && typeof searchTerm === 'object') {
        // If it's a Processo object, set the form control to the ID
        this.requestForm.get('processo')?.setValue((searchTerm as Processo).id);
      }
    });
    
    // Set up correspondente search
    this.correspondenteSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      if (typeof searchTerm === 'string') {
        // Check if this is a display value (contains " - ")
        if (searchTerm.includes(' - ')) {
          // This is likely a display value, not a search term
          // Don't filter in this case
          return;
        }
        if (searchTerm.length > 2) {
          this.searchCorrespondentes(searchTerm);
        }
      } else if (!searchTerm) {
        // If no search term, show filtered correspondentes (active only)
        this.filteredCorrespondentes = this.correspondentes.filter(c => c.ativo === true);
      }
    });
    
    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.requestId = +params['id'];
        console.log('Edit mode detected with ID:', this.requestId);
        // Wait for dropdown data to be loaded before loading the request
        this.waitForDropdownDataThenLoadRequest();
        // Load existing attachments for this request
        this.loadAnexos();
      }
    });
    
    this.setupThemeListener();
  }

  // Wait for dropdown data to be loaded before loading the request
  private waitForDropdownDataThenLoadRequest(): void {
    console.log('waitForDropdownDataThenLoadRequest called');
    // Check if all dropdown data is loaded
    if (this.areAllDropdownsLoaded()) {
      console.log('All dropdowns loaded, calling loadRequest');
      this.loadRequest();
    } else {
      console.log('Not all dropdowns loaded yet, waiting...');
      // Wait a bit and try again
      setTimeout(() => {
        this.waitForDropdownDataThenLoadRequest();
      }, 100);
    }
  }

  // Check if all dropdown data is loaded
  private areAllDropdownsLoaded(): boolean {
    const result = this.processos.length > 0 && 
           this.correspondentes.length > 0 && 
           this.usuarios.length > 0 && 
           this.tiposSolicitacao.length > 0 && 
           this.statuses.length > 0;
    console.log('areAllDropdownsLoaded:', result, {
      processos: this.processos.length,
      correspondentes: this.correspondentes.length,
      usuarios: this.usuarios.length,
      tiposSolicitacao: this.tiposSolicitacao.length,
      statuses: this.statuses.length
    });
    return result;
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

  private createForm(): FormGroup {
    const form = this.formBuilder.group({
      tipoSolicitacao: [null, Validators.required],
      status: [''], // Will be set to "Aguardando Confirmação" in onSubmit for new solicitations
      processo: [null, Validators.required], // This will be set by the autocomplete selection
      correspondente: [null, Validators.required],
      usuario: [null, Validators.required],
      dataSolicitacao: [this.getCurrentDate()], // Pre-filled with current date but editable by user
      dataPrazo: [''],
      instrucoes: [''],
      // Conditional fields
      dataAgendamento: [''],
      horaAudiencia: [''],
      valor: [''] // Remove initial validator, let onTipoSolicitacaoChange handle it
    });
    
    // Debug log removed
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
    console.log('loadDropdownData called');
    // Load all processos initially (for search functionality)
    this.processoService.getProcessosPaginated(0, 10000, 'numeroprocesso', 'ASC').subscribe({
      next: (response) => {
        const processos = response.content || [];
        this.processos = processos;
        console.log('Loaded processos:', processos.length);
        
        // Filter to only show processes with status "EM_ANDAMENTO"
        this.filteredProcessos = this.processos.filter(p => p.status === 'EM_ANDAMENTO');
        
        // If no processes with "EM_ANDAMENTO" status, show all processes
        if (this.filteredProcessos.length === 0) {
          this.filteredProcessos = this.processos;
        }
        console.log('Filtered processos:', this.filteredProcessos.length);
        
        // Force change detection to ensure the template updates
        this.changeDetectorRef.detectChanges();
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
        console.log('Loaded correspondentes:', correspondentes.length);
        // Filter to only show active correspondentes
        this.filteredCorrespondentes = correspondentes.filter(c => c.ativo === true);
        console.log('Filtered correspondentes:', this.filteredCorrespondentes.length);
        
        // Force change detection to ensure the template updates
        this.changeDetectorRef.detectChanges();
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
        console.log('Loaded usuarios:', usuarios.length);
        
        // Force change detection to ensure the template updates
        this.changeDetectorRef.detectChanges();
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
        console.log('Loaded tipos solicitacao:', tipos.length);
        
        // Force change detection to ensure the template updates
        this.changeDetectorRef.detectChanges();
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
        console.log('Loaded statuses:', statuses.length);
        
        // Force change detection to ensure the template updates
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.snackBar.open('Erro ao carregar status', 'Fechar', { duration: 5000 });
      }
    });
  }

  // Method to filter processos based on search term
  private filterProcessos(searchTerm: string): void {
    console.log('filterProcessos called with:', searchTerm);
    if (!searchTerm) {
      // If no search term, show filtered processos (EM_ANDAMENTO or all)
      this.filteredProcessos = this.processos.filter(p => p.status === 'EM_ANDAMENTO');
      if (this.filteredProcessos.length === 0) {
        this.filteredProcessos = this.processos;
      }
      console.log('Filtered processos (no search term):', this.filteredProcessos.length);
      return;
    }
    
    // Filter processos based on search term (number or part name)
    this.filteredProcessos = this.processos.filter(p => 
      p.numeroprocesso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.parte && p.parte.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log('Filtered processos (with search term):', this.filteredProcessos.length);
  }

  // Method to handle processo selection from autocomplete
  onProcessoSelected(event: { option: { value: Processo } }): void {
    console.log('onProcessoSelected called with:', event);
    const selectedProcesso: Processo = event.option.value;
    this.requestForm.get('processo')?.setValue(selectedProcesso.id);
  }

  // Method to display processo in autocomplete
  displayProcesso(processo: Processo | string): string {
    // If it's already a string, return it directly
    if (typeof processo === 'string') {
      return processo;
    }
    
    // If it's a Processo object, format it properly
    const result = processo && processo.numeroprocesso ? `${processo.numeroprocesso} - ${processo.parte || ''}` : '';
    console.log('displayProcesso called with:', processo, 'result:', result);
    return result;
  }

  private loadRequest(): void {
    if (!this.requestId) return;
    
    console.log('loadRequest called with ID:', this.requestId);
    this.loading = true;
    this.solicitacaoService.getSolicitacaoById(this.requestId).subscribe({
      next: (solicitacao) => {
        console.log('Received solicitacao data:', solicitacao);
        // Store the complete solicitacao object to preserve fields not in the form
        this.loadedSolicitacao = solicitacao;
        
        // Ensure dataSolicitacao is populated with current date if empty
        const dataSolicitacaoValue = solicitacao.datasolicitacao || this.getCurrentDate();
        
        // Format the valor for display if it exists
        let formattedValor = null;
        if (solicitacao.valor !== null && solicitacao.valor !== undefined) {
          formattedValor = solicitacao.valor;
        }
        
        // Use the time exactly as it's stored in the database ("12:30 PM" format)
        // The timepicker might need a Date object, so we'll convert the string time
        let formattedHoraAudiencia = null;
        if (solicitacao.horaudiencia) {
          // Try to parse the time string ("12:30 PM") and convert to Date object
          const timeString = solicitacao.horaudiencia;
          console.log('Parsing time string for timepicker:', timeString);
          
          // Parse the time string (assuming it's in "HH:MM AM/PM" format)
          const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const period = match[3].toUpperCase();
            
            // Convert to 24-hour format for Date object
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }
            
            // Create a Date object with today's date and the parsed time
            const today = new Date();
            formattedHoraAudiencia = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
            console.log('Converted to Date object:', formattedHoraAudiencia);
          } else {
            // If parsing fails, use the string as is
            formattedHoraAudiencia = timeString;
            console.log('Using time string as is:', formattedHoraAudiencia);
          }
        }
        
        // Set form values
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
          horaAudiencia: formattedHoraAudiencia,
          valor: formattedValor
        });
        
        console.log('Form values after patch:', this.requestForm.getRawValue());
        console.log('horaAudiencia form control value after patch:', this.requestForm.get('horaAudiencia')?.value);
        console.log('Processo search control value:', this.processoSearchControl.value);
        console.log('Correspondente search control value:', this.correspondenteSearchControl.value);
        
        // Check if we need to show conditional fields based on the loaded tipoSolicitacao
        if (solicitacao.tipoSolicitacao?.idtiposolicitacao) {
          this.updateConditionalFields(solicitacao.tipoSolicitacao.idtiposolicitacao);
        }
        
        // Ensure conditional fields are shown if they have values (for edit mode)
        // This is important for audiência types that have existing data
        if (solicitacao.dataagendamento || solicitacao.horaudiencia) {
          // We need to check if the tipoSolicitacao is audiência
          if (solicitacao.tipoSolicitacao?.idtiposolicitacao) {
            const selectedTipo = this.tiposSolicitacao.find(tipo => tipo.idtiposolicitacao === solicitacao.tipoSolicitacao?.idtiposolicitacao);
            if (selectedTipo && this.isTipoAudiencia(selectedTipo)) {
              this.showAudienciaFields = true;
              console.log('Showing audiencia fields because of existing data');
              // Force change detection to ensure the template updates
              this.changeDetectorRef.detectChanges();
            }
          }
        }
        
        // Set the autocomplete display values after ensuring dropdown data is loaded
        this.ensureAutocompleteDisplayValues(solicitacao);
        
        console.log('After ensureAutocompleteDisplayValues:');
        console.log('Processo search control value:', this.processoSearchControl.value);
        console.log('Correspondente search control value:', this.correspondenteSearchControl.value);
        
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

  // Ensure autocomplete display values are set correctly
  private ensureAutocompleteDisplayValues(solicitacao: Solicitacao): void {
    console.log('ensureAutocompleteDisplayValues called with:', solicitacao);
    
    // Set the processo search control to the selected processo for display
    if (solicitacao.processo && solicitacao.processo.id) {
      console.log('Setting processo autocomplete value for ID:', solicitacao.processo.id);
      // Check if processos data is already loaded
      if (this.processos && this.processos.length > 0) {
        // Find the processo object from our loaded data
        const processo = this.processos.find(p => p.id === solicitacao.processo?.id);
        if (processo) {
          console.log('Found processo in loaded data:', processo);
          const displayValue = this.displayProcesso(processo);
          this.processoSearchControl.setValue(displayValue);
        } else {
          console.log('Processo not found in loaded data, fetching specifically');
          // If processo not found in loaded data, fetch it specifically
          this.processoService.getProcessoById(solicitacao.processo.id).subscribe({
            next: (processo) => {
              if (processo) {
                console.log('Successfully fetched processo:', processo);
                const displayValue = this.displayProcesso(processo);
                this.processoSearchControl.setValue(displayValue);
                // Also add to processos array to prevent future lookups
                if (!this.processos.find(p => p.id === processo.id)) {
                  this.processos.push(processo);
                }
                // Force change detection to ensure the template updates
                this.changeDetectorRef.detectChanges();
              }
            },
            error: (error) => {
              console.error('Error loading processo by ID:', error);
            }
          });
        }
      } else {
        console.log('Processos not loaded yet, fetching specifically');
        // If not loaded yet, fetch the processo specifically
        this.processoService.getProcessoById(solicitacao.processo.id).subscribe({
          next: (processo) => {
            if (processo) {
              console.log('Successfully fetched processo:', processo);
              const displayValue = this.displayProcesso(processo);
              this.processoSearchControl.setValue(displayValue);
              // Also add to processos array to prevent future lookups
              if (!this.processos.find(p => p.id === processo.id)) {
                this.processos.push(processo);
              }
              // Force change detection to ensure the template updates
              this.changeDetectorRef.detectChanges();
            }
          },
          error: (error) => {
            console.error('Error loading processo by ID:', error);
          }
        });
      }
    }
    
    // Set the correspondente search control to the selected correspondente for display
    if (solicitacao.correspondente && solicitacao.correspondente.id) {
      console.log('Setting correspondente autocomplete value for ID:', solicitacao.correspondente.id);
      // Check if correspondentes data is already loaded
      if (this.correspondentes && this.correspondentes.length > 0) {
        // Find the correspondente object from our loaded data
        const correspondente = this.correspondentes.find(c => c.id === solicitacao.correspondente?.id);
        if (correspondente) {
          console.log('Found correspondente in loaded data:', correspondente);
          const displayValue = this.displayCorrespondente(correspondente);
          this.correspondenteSearchControl.setValue(displayValue);
        } else {
          console.log('Correspondente not found in loaded data, fetching specifically');
          // If correspondente not found in loaded data, fetch it specifically
          this.correspondenteService.getCorrespondenteById(solicitacao.correspondente.id).subscribe({
            next: (correspondente) => {
              if (correspondente) {
                console.log('Successfully fetched correspondente:', correspondente);
                const displayValue = this.displayCorrespondente(correspondente);
                this.correspondenteSearchControl.setValue(displayValue);
                // Also add to correspondentes array to prevent future lookups
                if (!this.correspondentes.find(c => c.id === correspondente.id)) {
                  this.correspondentes.push(correspondente);
                }
                // Force change detection to ensure the template updates
                this.changeDetectorRef.detectChanges();
              }
            },
            error: (error) => {
              console.error('Error loading correspondente by ID:', error);
            }
          });
        }
      } else {
        console.log('Correspondentes not loaded yet, fetching specifically');
        // If not loaded yet, fetch the correspondente specifically
        this.correspondenteService.getCorrespondenteById(solicitacao.correspondente.id).subscribe({
          next: (correspondente) => {
            if (correspondente) {
              console.log('Successfully fetched correspondente:', correspondente);
              const displayValue = this.displayCorrespondente(correspondente);
              this.correspondenteSearchControl.setValue(displayValue);
              // Also add to correspondentes array to prevent future lookups
              if (!this.correspondentes.find(c => c.id === correspondente.id)) {
                this.correspondentes.push(correspondente);
              }
              // Force change detection to ensure the template updates
              this.changeDetectorRef.detectChanges();
            }
          },
          error: (error) => {
            console.error('Error loading correspondente by ID:', error);
          }
        });
      }
    }
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

  // Helper method to format time for display (converts "HH:MM" to "HH:MM AM/PM")
  private formatTimeForDisplay(timeString: string | null): string {
    console.log('formatTimeForDisplay called with:', timeString);
    // Ensure we're working with a string
    if (!timeString) return '';
    
    // Convert to string if it's not already (handles Date objects and other types)
    const timeStr = typeof timeString === 'string' ? timeString : String(timeString);
    console.log('formatTimeForDisplay - timeStr:', timeStr);
    
    // Check if it's already in display format (HH:MM AM/PM)
    const displayFormatMatch = timeStr.match(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    if (displayFormatMatch) {
      console.log('formatTimeForDisplay - already in display format:', timeStr);
      return timeStr;
    }
    
    // Parse the time string (assuming it's in HH:MM format)
    const [hours, minutes] = timeStr.split(':').map(Number);
    console.log('formatTimeForDisplay - hours, minutes:', hours, minutes);
    
    if (isNaN(hours) || isNaN(minutes)) return '';
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    const result = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    console.log('formatTimeForDisplay result:', result);
    return result;
  }
  
  // Helper method to parse time from display format (converts "HH:MM AM/PM" to "HH:MM")
  private parseTimeFromDisplay(timeString: string | null): string {
    console.log('parseTimeFromDisplay called with:', timeString);
    // Ensure we're working with a string
    if (!timeString) return '';
    
    // Convert to string if it's not already (handles Date objects and other types)
    const timeStr = typeof timeString === 'string' ? timeString : String(timeString);
    console.log('parseTimeFromDisplay - timeStr:', timeStr);
    
    // First check if it's already in HH:MM format (might be from database)
    const dbFormatMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
    if (dbFormatMatch) {
      console.log('parseTimeFromDisplay - already in DB format:', timeStr);
      return timeStr;
    }
    
    // Parse the time string (assuming it's in "HH:MM AM/PM" format)
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    console.log('parseTimeFromDisplay - match:', match);
    if (!match) return '';
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    console.log('parseTimeFromDisplay result:', result);
    return result;
  }
  
  // Test method to verify our fix works correctly
  private testTimeParsing(): void {
    console.log('Testing time parsing with different input types:');
    
    // Test with string
    console.log('String input:', this.parseTimeFromDisplay('10:30 AM'));
    
    // Test with null
    console.log('Null input:', this.parseTimeFromDisplay(null));
    
    // Test with empty string
    console.log('Empty string input:', this.parseTimeFromDisplay(''));
    
    // Test with Date object converted to string (this would cause the original error)
    console.log('Date object input:', this.parseTimeFromDisplay(new Date().toString()));
  }

  // Method to handle file selection
  selectFiles(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFiles = Array.from(target.files || []);
    this.progressInfos = [];
    this.message = '';
  }

  // Method to format currency input for Brazilian format
  formatCurrency(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, ''); // Remove all non-digit characters
    
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
    
    // Debug log removed
    
    // Match the diligência detection logic used in the dashboard
    const isDiligencia = especie.includes('diligencia') || especie.includes('diligência') || 
           tipo.includes('diligencia') || tipo.includes('diligência') ||
           especie.includes('dilig') || tipo.includes('dilig') ||
           especie.includes('cumprimento') || tipo.includes('cumprimento');
           
    // Debug log removed
    return isDiligencia;
  }
  
  // Method to handle tipoSolicitacao selection change
  onTipoSolicitacaoChange(tipoSolicitacaoId: number): void {
    // Debug log removed
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
    console.log('updateConditionalFields called with tipoSolicitacaoId:', tipoSolicitacaoId);
    // Debug log removed
    // Find the selected tipoSolicitacao
    const selectedTipo = this.tiposSolicitacao.find(tipo => tipo.idtiposolicitacao === tipoSolicitacaoId);
    
    // Debug log removed
    
    if (selectedTipo) {
      // Check if it's "Audiência" (case insensitive, with or without accents)
      const isAudiencia = this.isTipoAudiencia(selectedTipo);
      // For diligência, we hide the audiência fields
      const isDiligencia = this.isTipoDiligencia(selectedTipo);
      
      console.log('isAudiencia:', isAudiencia, 'isDiligencia:', isDiligencia);
      
      // Show/hide fields based on tipo - only show for audiencia, hide for diligencia
      this.showAudienciaFields = isAudiencia;
      this.showValorField = isAudiencia || isDiligencia;
      
      // Debug log removed
      // Debug log removed
      
      // Additional logging for debugging
      // Debug log removed
    } else {
      // Default to hiding conditional fields
      this.showAudienciaFields = false;
      this.showValorField = false;
      // Debug log removed
      // Debug log removed
    }
    
    // Special case: If we're in edit mode and already have audiencia data, ensure fields are visible
    if (this.isEditMode) {
      const formValue = this.requestForm.getRawValue();
      console.log('Edit mode - form values:', formValue);
      // Debug log removed
      
      if (formValue.dataAgendamento || formValue.horaAudiencia) {
        // Only show for audiencia types in edit mode
        if (selectedTipo && this.isTipoAudiencia(selectedTipo)) {
          this.showAudienciaFields = true;
          console.log('Showing audiencia fields in edit mode due to existing data');
          // Debug log removed
        }
      }
      
      // Also check if the current tipoSolicitacao is Audiência
      if (selectedTipo && this.isTipoAudiencia(selectedTipo)) {
        this.showAudienciaFields = true;
        console.log('Showing audiencia fields because tipo is audiencia');
        // Debug log removed
      }
      
      // Ensure valor field is visible if there's a value (for both audiencia and diligencia)
      if (formValue.valor) {
        this.showValorField = true;
        console.log('Showing valor field because it has a value');
        // Debug log removed
      }
    }
    
    console.log('showAudienciaFields:', this.showAudienciaFields, 'showValorField:', this.showValorField);
    // Debug log removed
    // Debug log removed
    
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
        if (event.type === HttpEventType.UploadProgress) {
          // Upload progress
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          this.progressInfos[index].value = progress;
        } else if (event.type === HttpEventType.Response) {
          // Upload complete
          this.message = 'Arquivo(s) carregado(s) com sucesso!';
          // Reload the current attachments
          this.loadAnexos();
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
    console.log('Form values before save:', formValue);
    console.log('horaAudiencia form control value:', this.requestForm.get('horaAudiencia')?.value);
    
    // Start with the loaded solicitacao to preserve fields not in the form
    const solicitacao: Solicitacao = this.loadedSolicitacao ? { ...this.loadedSolicitacao } : {
      id: 0,
      ativo: true,
      datasolicitacao: new Date(),
      dataprazo: undefined,
      instrucoes: '',
      tipoSolicitacao: undefined,
      statusSolicitacao: undefined,
      processo: undefined,
      correspondente: undefined,
      usuario: undefined
    } as unknown as Solicitacao;
    
    // Update fields that are in the form
    solicitacao.datasolicitacao = formValue.dataSolicitacao || this.getCurrentDate(); // Ensure we always have a value
    solicitacao.dataprazo = formValue.dataPrazo || null;
    solicitacao.instrucoes = formValue.instrucoes || null;
    solicitacao.ativo = true;

    // Add conditional fields if they should be included
    // For Audiência, always include horaAudiencia when it exists in the form (especially in edit mode)
    console.log('Checking audiencia conditions:', {
      showAudienciaFields: this.showAudienciaFields,
      isEditMode: this.isEditMode,
      horaAudiencia: formValue.horaAudiencia,
      horaAudienciaType: typeof formValue.horaAudiencia
    });
    
    // Always save audiencia fields if this is an audiencia type
    if (this.showAudienciaFields) {
      solicitacao.dataagendamento = formValue.dataAgendamento || null;
      // Debug the timepicker value to see what type it is
      console.log('Timepicker value:', formValue.horaAudiencia);
      console.log('Timepicker value type:', typeof formValue.horaAudiencia);
      
      // Convert the timepicker value to string format for the backend
      let timeString: string | undefined;
      if (formValue.horaAudiencia) {
        // If it's already a string, use it directly
        if (typeof formValue.horaAudiencia === 'string') {
          timeString = formValue.horaAudiencia;
        } 
        // If it's a Date object, convert it to "HH:MM AM/PM" format
        else if (formValue.horaAudiencia instanceof Date) {
          const hours = formValue.horaAudiencia.getHours();
          const minutes = formValue.horaAudiencia.getMinutes();
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          timeString = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
        // For any other type, convert to string
        else {
          timeString = String(formValue.horaAudiencia);
        }
      }
      
      // If the time is an empty string, set to undefined to match the model
      solicitacao.horaudiencia = timeString && timeString !== '' ? timeString : undefined;
      console.log('Setting audiencia fields:', {
        dataagendamento: solicitacao.dataagendamento,
        horaudiencia: solicitacao.horaudiencia
      });
    } else if (this.isEditMode && solicitacao.horaudiencia === undefined && this.loadedSolicitacao?.horaudiencia) {
      // Preserve existing audiencia time in edit mode if not changed
      solicitacao.horaudiencia = this.loadedSolicitacao.horaudiencia;
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
        solicitacao.statusSolicitacao = { idstatus: aguardandoConfirmacaoStatus.idstatus, status: '' };
      } else {
        // Fallback to first status if "Aguardando Confirmação" is not found
        solicitacao.statusSolicitacao = { idstatus: this.statuses.length > 0 ? this.statuses[0].idstatus : 1, status: '' };
      }
      
      // When creating a new solicitation with "Aguardando Confirmação" status, clear dataconclusao
      solicitacao.dataconclusao = undefined;
    } else if(formValue.status){
      // Use selected status for editing
      solicitacao.statusSolicitacao = { idstatus: formValue.status, status: '' };
      
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
      solicitacao.processo = { id: formValue.processo, numeroprocesso: '', ativo: true };
    }
    
    if (formValue.correspondente) {
      solicitacao.correspondente = { id: formValue.correspondente, nome: '', ativo: true };
    }
    
    if (formValue.usuario) {
      solicitacao.usuario = { id: formValue.usuario, login: '', nomecompleto: '', tipo: UserType.ADMIN, ativo: true };
    }

    // Determine if we're creating or updating
    const operation = this.isEditMode && this.requestId
      ? this.solicitacaoService.updateSolicitacao(this.requestId, solicitacao)
      : this.solicitacaoService.createSolicitacao(solicitacao);

    operation.pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (result) => {
        // Get the ID of the created/updated solicitacao
        const solicitacaoId = this.isEditMode ? this.requestId : (result?.id || result?.datasolicitacao);
        
        const message = this.isEditMode 
          ? 'Solicitação atualizada com sucesso!' 
          : 'Solicitação criada com sucesso!';
        this.snackBar.open(message, 'Fechar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Upload attachments if any were selected
        if (this.selectedFiles.length > 0 && solicitacaoId) {
          this.uploadAnexos(Number(solicitacaoId));
        }
        
        // Navigate to request detail page instead of list
        // Debug log removed
        if (solicitacaoId) {
          // Ensure navigation happens after any file uploads complete
          setTimeout(() => {
            this.router.navigate(['/solicitacoes', solicitacaoId]);
          }, 100);
        } else {
          console.error('Could not navigate to solicitation details page: solicitacaoId is null or undefined');
          // Debug log removed
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
        const fieldLabels: Record<string, string> = {
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

  // Method to search correspondentes based on search term
  private searchCorrespondentes(searchTerm: string): void {
    console.log('searchCorrespondentes called with:', searchTerm);
    this.correspondenteService.searchByNome(searchTerm).subscribe({
      next: (correspondentes) => {
        this.filteredCorrespondentes = correspondentes.filter(c => c.ativo === true);
        console.log('Filtered correspondentes:', this.filteredCorrespondentes.length);
      },
      error: (error) => {
        console.error('Error searching correspondentes:', error);
        this.snackBar.open('Erro ao buscar correspondentes', 'Fechar', { duration: 5000 });
      }
    });
  }

  // Method to handle correspondente selection from autocomplete
  onCorrespondenteSelected(event: { option: { value: Correspondente } }): void {
    console.log('onCorrespondenteSelected called with:', event);
    const selectedCorrespondente: Correspondente = event.option.value;
    this.requestForm.get('correspondente')?.setValue(selectedCorrespondente.id);
  }

  // Method to display correspondente in autocomplete
  displayCorrespondente(correspondente: Correspondente | string): string {
    // If it's already a string, return it directly
    if (typeof correspondente === 'string') {
      return correspondente;
    }
    
    // If it's a Correspondente object, format it properly
    const result = correspondente && correspondente.nome ? `${correspondente.nome} - ${correspondente.oab || ''}` : '';
    console.log('displayCorrespondente called with:', correspondente, 'result:', result);
    return result;
  }
}