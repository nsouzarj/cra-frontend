import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { User, UserType } from '../../../shared/models/user.model';
import { Correspondente } from '../../../shared/models/correspondente.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  changingPassword = false;
  savePassword = '';
  isEditMode = false;
  userId: number | null = null;
  UserType = UserType;
  
  // Correspondent related properties
  correspondentes: Correspondente[] = [];
  filteredCorrespondentes: Correspondente[] = [];
  showCorrespondentField = false;
  userLoaded = false; // Track if user data has been loaded

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private correspondenteService: CorrespondenteService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.userForm = this.createUserForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    // Check if user has admin role
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/unauthorized']);
      return;
    }

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = +params['id'];
        
        // Load user data first
        this.loadUser();
      }
      
      // Load correspondents for selection
      this.loadCorrespondentes();
    });
    
    // Watch for tipo changes to show/hide correspondent field
    this.userForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.showCorrespondentField = tipo === UserType.CORRESPONDENTE;
      if (this.showCorrespondentField) {
        this.userForm.get('correspondente')?.setValidators([Validators.required]);
      } else {
        this.userForm.get('correspondente')?.clearValidators();
        this.userForm.get('correspondente')?.setValue(null); // Reset the value when not needed
      }
      this.userForm.get('correspondente')?.updateValueAndValidity();
    });
  }

  createUserForm(): FormGroup {
    const form = this.formBuilder.group({
      login: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      senha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      nomecompleto: ['', [Validators.required, Validators.maxLength(255)]],
      emailprincipal: ['', [Validators.email]],
      emailsecundario: ['', [Validators.email]],
      emailresponsavel: ['', [Validators.email]],
      tipo: ['', [Validators.required]],
      correspondente: [null], // Use correspondentId to match the User model
      ativo: [true]
    });

    // Add a validator to automatically trim whitespace from the login field
    form.get('login')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const trimmedValue = value.trim();
        if (value !== trimmedValue) {
          form.get('login')?.setValue(trimmedValue, { emitEvent: false });
        }
      }
    });

    return form;
  }

  createPasswordForm(): FormGroup {
    const form = this.formBuilder.group({
      novaSenha: ['', [Validators.minLength(6)]],
      confirmarSenha: ['']
    });

    // Add custom validator for password confirmation
    form.get('confirmarSenha')?.setValidators([
      (control) => {
        const novaSenha = form.get('novaSenha')?.value;
        const confirmarSenha = control.value;
        
        if (novaSenha && confirmarSenha && novaSenha !== confirmarSenha) {
          return { passwordMismatch: true };
        }
        return null;
      }
    ]);

    return form;
  }

  loadCorrespondentes(): void {
    this.correspondenteService.getActiveCorrespondentes().subscribe({
      next: (correspondentes) => {
        this.correspondentes = correspondentes;
        this.filteredCorrespondentes = correspondentes;
        
        // If user is already loaded, update the form to ensure the correspondent is selected
        if (this.userLoaded) {
          const currentCorrespondentId = this.userForm.get('correspondente')?.value;
          if (currentCorrespondentId) {
            // Force form update to ensure the dropdown shows the correct value
            this.userForm.get('correspondente')?.setValue(currentCorrespondentId, { emitEvent: false });
          }
        }
      },
      error: (error) => {
        console.error('Error loading correspondentes:', error);
        this.snackBar.open('Erro ao carregar correspondentes', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadUser(): void {
    if (!this.userId) return;

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.userLoaded = true; // Mark user as loaded
        
        // Remove senha requirement in edit mode
        this.savePassword = user.senha || '';
        this.userForm.get('senha')?.clearValidators();
        this.userForm.get('senha')?.updateValueAndValidity();
        
        // Set correspondent field visibility
        this.showCorrespondentField = user.tipo === UserType.CORRESPONDENTE;
        if (this.showCorrespondentField) {
          this.userForm.get('correspondente')?.setValidators([Validators.required]);
        } else {
          this.userForm.get('correspondente')?.clearValidators();
          this.userForm.get('correspondente')?.setValue(null); // Reset the value when not needed
        }
        this.userForm.get('correspondente')?.updateValueAndValidity();
        
        // Populate form
        this.userForm.patchValue({
          login: user.login?.trim(), // Trim the login field
          nomecompleto: user.nomecompleto,
          emailprincipal: user.emailprincipal || '',
          emailsecundario: user.emailsecundario || '',
          emailresponsavel: user.emailresponsavel || '',
          tipo: user.tipo,
          correspondente: user.correspondente || null,
          ativo: user.ativo
        });
        
        // If correspondents are already loaded, validate that the selected correspondent exists
        if (this.correspondentes.length > 0 && user.correspondentId) {
          const correspondentExists = this.correspondentes.some(c => c.id === user.correspondente);
          if (!correspondentExists) {
            console.warn('Selected correspondent not found in loaded correspondents list');
          }
        }
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.snackBar.open('Erro ao carregar usuário', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/usuarios']);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    // Show confirmation dialog when editing a user
    if (this.isEditMode) {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Confirmar Alterações',
          message: 'Tem certeza que deseja salvar as alterações deste usuário?',
          confirmText: 'Salvar',
          cancelText: 'Cancelar'
        } as ConfirmationDialogData
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.saveUser();
        } else {
          this.loading = false;
        }
      });
    } else {
      // For create mode, save directly without confirmation
      this.saveUser();
    }
  }

  private saveUser(): void {
    this.loading = true;
    // Trim the login field to remove any leading/trailing whitespace
    let userData: any = {
      ...this.userForm.value,
      login: this.userForm.value.login?.trim()
    };

    // Only include correspondentId for CORRESPONDENTE type users
    if (userData.tipo === UserType.CORRESPONDENTE) {
      // Ensure correspondentId is included for correspondent users
      if (!userData.correspondente) {
        // If no correspondent is selected, show an error
        this.snackBar.open('Por favor, selecione um correspondente', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.loading = false;
        return;
      }
      // Ensure correspondentId is a number
      userData.correspondente = Number(userData.correspondente);
    } else {
      // Remove correspondentId for non-correspondent users
      delete userData.correspondente;
    }

    // For update operations, don't send password if it's empty or only whitespace
    if (this.isEditMode && (!userData.senha || userData.senha.trim() === '')) {
      delete userData.senha; // Remove password field entirely if empty to prevent changing it
    }

    const operation = this.isEditMode && this.userId ? 
      this.userService.updateUser(this.userId, userData) : 
      this.userService.createUser(userData);

    operation.subscribe({
      next: (user) => {
        this.loading = false;
        const message = this.isEditMode ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!';
        this.snackBar.open(message, 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/usuarios']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving user:', error);
        
        let message = 'Erro ao salvar usuário.';
        if (error.status === 400) {
          message = 'Dados inválidos ou login já existe.';
        }
        
        this.snackBar.open(message, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid || !this.userId) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    const novaSenha = this.passwordForm.get('novaSenha')?.value;
    if (!novaSenha) {
      return;
    }

    this.changingPassword = true;
    
    // Create a user object with only the password field
    const userData: Partial<User> = {
      
      login: this.userForm.get('login')?.value,
      nomecompleto: this.userForm.get('nomecompleto')?.value,
      emailprincipal: this.userForm.get('emailprincipal')?.value,
      emailsecundario: this.userForm.get('emailsecundario')?.value,
      emailresponsavel: this.userForm.get('emailresponsavel')?.value,
      tipo: this.userForm.get('tipo')?.value,
      ativo: this.userForm.get('ativo')?.value,
      dataEntrada: this.userForm.get('dataEntrada')?.value,
      authorities: this.userForm.get('authorities')?.value,
      senha: novaSenha
    };

    this.userService.updateUser(this.userId, userData as User).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordForm.reset();
        this.snackBar.open('Senha alterada com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.changingPassword = false;
        console.error('Error changing password:', error);
        this.snackBar.open('Erro ao alterar senha', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/usuarios']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}