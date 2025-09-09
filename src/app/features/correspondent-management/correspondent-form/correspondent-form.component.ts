import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { UfService } from '../../../core/services/uf.service';
import { Correspondente, Endereco } from '../../../shared/models/correspondente.model';
import { Uf } from '../../../shared/models/uf.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-correspondent-form',
  templateUrl: './correspondent-form.component.html',
  styleUrls: ['./correspondent-form.component.scss']
})
export class CorrespondentFormComponent implements OnInit {
  correspondentForm: FormGroup;
  loading = false;
  isEditMode = false;
  correspondentId: number | null = null;
  ufs: Uf[] = [];

  @ViewChild('cpfCnpjInput', { static: false }) cpfCnpjInput!: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private correspondenteService: CorrespondenteService,
    private ufService: UfService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.correspondentForm = this.createForm();
  }

  ngOnInit(): void {
    // Load UFs first
    this.loadUfs();

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.correspondentId = +params['id'];
        // We'll load the correspondent after UFs are loaded
      }
    });

    // Check for duplicated correspondent data
    const navigation = this.router.getCurrentNavigation();
    const duplicatedData = navigation?.extras?.state?.['correspondent'];
    if (duplicatedData) {
      this.correspondentForm.patchValue(duplicatedData);
    }

    // Subscribe to tipo changes to format CPF/CNPJ
    this.correspondentForm.get('tipo')?.valueChanges.subscribe(() => {
      this.formatCpfCnpj();
    });
  }

  loadUfs(): void {
    this.ufService.getUfs().subscribe({
      next: (ufs) => {
        this.ufs = ufs;
        // Now that UFs are loaded, load correspondent if in edit mode
        if (this.isEditMode && this.correspondentId) {
          this.loadCorrespondent();
        }
      },
      error: (error) => {
        console.error('Error loading UFs:', error);
        // Fallback to hardcoded UFs in case of error
        this.ufs = [
          { id: 1, sigla: 'AC', nome: 'Acre' },
          { id: 2, sigla: 'AL', nome: 'Alagoas' },
          { id: 3, sigla: 'AP', nome: 'Amapá' },
          { id: 4, sigla: 'AM', nome: 'Amazonas' },
          { id: 5, sigla: 'BA', nome: 'Bahia' },
          { id: 6, sigla: 'CE', nome: 'Ceará' },
          { id: 7, sigla: 'DF', nome: 'Distrito Federal' },
          { id: 8, sigla: 'ES', nome: 'Espírito Santo' },
          { id: 9, sigla: 'GO', nome: 'Goiás' },
          { id: 10, sigla: 'MA', nome: 'Maranhão' },
          { id: 11, sigla: 'MT', nome: 'Mato Grosso' },
          { id: 12, sigla: 'MS', nome: 'Mato Grosso do Sul' },
          { id: 13, sigla: 'MG', nome: 'Minas Gerais' },
          { id: 14, sigla: 'PA', nome: 'Pará' },
          { id: 15, sigla: 'PB', nome: 'Paraíba' },
          { id: 16, sigla: 'PR', nome: 'Paraná' },
          { id: 17, sigla: 'PE', nome: 'Pernambuco' },
          { id: 18, sigla: 'PI', nome: 'Piauí' },
          { id: 19, sigla: 'RJ', nome: 'Rio de Janeiro' },
          { id: 20, sigla: 'RN', nome: 'Rio Grande do Norte' },
          { id: 21, sigla: 'RS', nome: 'Rio Grande do Sul' },
          { id: 22, sigla: 'RO', nome: 'Rondônia' },
          { id: 23, sigla: 'RR', nome: 'Roraima' },
          { id: 24, sigla: 'SC', nome: 'Santa Catarina' },
          { id: 25, sigla: 'SP', nome: 'São Paulo' },
          { id: 26, sigla: 'SE', nome: 'Sergipe' },
          { id: 27, sigla: 'TO', nome: 'Tocantins' }
        ];
        this.snackBar.open('Erro ao carregar estados. Usando lista padrão.', 'Fechar', {
          duration: 5000,
        });
        // Load correspondent even if UFs failed to load (will use fallback UFs)
        if (this.isEditMode && this.correspondentId) {
          this.loadCorrespondent();
        }
      }
    });
  }

  createForm(): FormGroup {
    const form = this.formBuilder.group({
      nome: ['', [Validators.required]],
      cpfcnpj: ['', [Validators.required]],
      oab: [''],
      emailprimario: ['', [Validators.required, Validators.email]],  // Changed from emailPrincipal
      emailsecundario: ['', [Validators.email]],
      telefoneprimario: [''],  // Changed from telefone
      telefonecelularprimario: ['', [Validators.required]],  // Changed from celular
      tipo: [''],
      observacoes: [''],
      ativo: [true],
      endereco: this.formBuilder.group({
        logradouro: ['', [Validators.required]],
        numero: [''],
        complemento: [''],
        bairro: ['', [Validators.required]],
        cidade: ['', [Validators.required]],
        uf: ['', [Validators.required]],
        cep: ['']
      })
    });

    // Subscribe to cpfCnpj changes for real-time formatting
    form.get('cpfcnpj')?.valueChanges.subscribe(() => {
      this.formatCpfCnpj();
    });

    // Subscribe to email fields for automatic lowercase conversion
    form.get('emailprimario')?.valueChanges.subscribe(value => {  // Changed from emailPrincipal
      if (value && typeof value === 'string') {
        const lowerCaseValue = value.toLowerCase();
        if (value !== lowerCaseValue) {
          form.get('emailprimario')?.setValue(lowerCaseValue, { emitEvent: false });  // Changed from emailPrincipal
        }
      }
    });

    form.get('emailsecundario')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const lowerCaseValue = value.toLowerCase();
        if (value !== lowerCaseValue) {
          form.get('emailsecundario')?.setValue(lowerCaseValue, { emitEvent: false });
        }
      }
    });

    // Subscribe to name and address fields for automatic uppercase conversion
    form.get('nome')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperCaseValue = value.toUpperCase();
        if (value !== upperCaseValue) {
          form.get('nome')?.setValue(upperCaseValue, { emitEvent: false });
        }
      }
    });

    form.get('endereco')?.get('logradouro')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperCaseValue = value.toUpperCase();
        if (value !== upperCaseValue) {
          form.get('endereco')?.get('logradouro')?.setValue(upperCaseValue, { emitEvent: false });
        }
      }
    });

    form.get('endereco')?.get('bairro')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperCaseValue = value.toUpperCase();
        if (value !== upperCaseValue) {
          form.get('endereco')?.get('bairro')?.setValue(upperCaseValue, { emitEvent: false });
        }
      }
    });

    form.get('endereco')?.get('cidade')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const upperCaseValue = value.toUpperCase();
        if (value !== upperCaseValue) {
          form.get('endereco')?.get('cidade')?.setValue(upperCaseValue, { emitEvent: false });
        }
      }
    });

    return form;
  }

  loadCorrespondent(): void {
    if (!this.correspondentId) return;

    this.correspondenteService.getCorrespondenteById(this.correspondentId).subscribe({
      next: (correspondent) => {
        // Find the UF object based on the sigla
        let ufObject = null;
        if (correspondent.endereco?.uf?.sigla && this.ufs.length > 0) {
          ufObject = this.ufs.find(uf => uf.sigla === correspondent.endereco!.uf!.sigla) || null;
        }
        
        this.correspondentForm.patchValue({
          nome: correspondent.nome,
          cpfcnpj: correspondent.cpfcnpj || '',
          oab: correspondent.oab || '',
          emailprimario: correspondent.emailprimario || '',  // Fixed field mapping
          emailsecundario: correspondent.emailsecundario || '',
          telefoneprimario: correspondent.telefoneprimario || '',  // Fixed field mapping
          telefonecelularprimario: correspondent.telefonecelularprimario || '',  // Fixed field mapping
          tipo: correspondent.tipo || '',
          observacoes: correspondent.observacoes || '',
          ativo: correspondent.ativo,
          endereco: {
            logradouro: correspondent.endereco?.logradouro || '',
            numero: correspondent.endereco?.numero || '',
            complemento: correspondent.endereco?.complemento || '',
            bairro: correspondent.endereco?.bairro || '',
            cidade: correspondent.endereco?.cidade || '',
            uf: ufObject,
            cep: correspondent.endereco?.cep || ''
          }
        });
      },
      error: (error) => {
        console.error('Error loading correspondent:', error);
        this.snackBar.open('Erro ao carregar correspondente', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/correspondentes']);
      }
    });
  }

  formatCpfCnpj(): void {
    const cpfCnpjControl = this.correspondentForm.get('cpfcnpj');
    const tipo = this.correspondentForm.get('tipo')?.value;
    
    if (!cpfCnpjControl || !tipo) return;
    
    let value = cpfCnpjControl.value;
    if (!value) return;
    
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    
    let formattedValue = '';
    
    if (tipo === 'PESSOA_FISICA') {
      // Format as CPF: 000.000.000-00 (max 11 digits)
      const cpf = cleanValue.substring(0, 11);
      formattedValue = cpf;
      
      if (cpf.length > 3) {
        formattedValue = cpf.substring(0, 3) + '.' + cpf.substring(3);
      }
      if (cpf.length > 6) {
        formattedValue = formattedValue.substring(0, 7) + '.' + formattedValue.substring(7);
      }
      if (cpf.length > 9) {
        formattedValue = formattedValue.substring(0, 11) + '-' + formattedValue.substring(11);
      }
    } else if (tipo === 'PESSOA_JURIDICA') {
      // Format as CNPJ: 00.000.000/0000-00 (max 14 digits)
      const cnpj = cleanValue.substring(0, 14);
      formattedValue = cnpj;
      
      if (cnpj.length > 2) {
        formattedValue = cnpj.substring(0, 2) + '.' + cnpj.substring(2);
      }
      if (cnpj.length > 5) {
        formattedValue = formattedValue.substring(0, 6) + '.' + formattedValue.substring(6);
      }
      if (cnpj.length > 8) {
        formattedValue = formattedValue.substring(0, 10) + '/' + formattedValue.substring(10);
      }
      if (cnpj.length > 12) {
        formattedValue = formattedValue.substring(0, 15) + '-' + formattedValue.substring(15);
      }
    } else {
      // If no type selected, just return the clean value
      formattedValue = cleanValue;
    }
    
    // Only update if different to avoid infinite loops
    if (cpfCnpjControl.value !== formattedValue) {
      cpfCnpjControl.setValue(formattedValue);
    }
  }

  onSubmit(): void {
    if (this.correspondentForm.invalid) {
      this.markFormGroupTouched(this.correspondentForm);
      return;
    }

    // Show confirmation dialog
    const action = this.isEditMode ? 'atualizar' : 'criar';
    const dialogData: ConfirmationDialogData = {
      title: 'Confirmar operação',
      message: `Tem certeza que deseja ${action} este correspondente?`,
      confirmText: 'SIM',
      cancelText: 'NÃO'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.proceedWithSave();
      }
    });
  }

  private proceedWithSave(): void {
    this.loading = true;
    
    // Map form fields to backend entity fields
    const formValue = this.correspondentForm.value;
    const correspondentData: any = {
      nome: formValue.nome,
      cpfcnpj: formValue.cpfcnpj,
      oab: formValue.oab,
      emailprimario: formValue.emailprimario,
      emailsecundario: formValue.emailsecundario,
      telefoneprimario: formValue.telefoneprimario,
      telefonesecundario: formValue.telefonesecundario,
      telefonecelularprimario: formValue.telefonecelularprimario,
      telefonecelularsecundario: formValue.telefonecelularsecundario,
      tipo: formValue.tipo,
      observacoes: formValue.observacoes,
      ativo: formValue.ativo,
      endereco: formValue.endereco
    };

    // Remove formatting from CPF/CNPJ before sending to backend
    if (correspondentData.cpfcnpj) {
      correspondentData.cpfcnpj = correspondentData.cpfcnpj.replace(/\D/g, '');
    }

    const operation = this.isEditMode && this.correspondentId ? 
      this.correspondenteService.updateCorrespondente(this.correspondentId, correspondentData) : 
      this.correspondenteService.createCorrespondente(correspondentData);

    operation.subscribe({
      next: (correspondent) => {
        this.loading = false;
        const message = this.isEditMode ? 'Correspondente atualizado com sucesso!' : 'Correspondente criado com sucesso!';
        this.snackBar.open(message, 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/correspondentes']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving correspondent:', error);
        
        let message = 'Erro ao salvar correspondente.';
        if (error.status === 400) {
          message = 'Dados inválidos ou CPF/CNPJ/OAB já existe.';
        }
        
        this.snackBar.open(message, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/correspondentes']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }
}