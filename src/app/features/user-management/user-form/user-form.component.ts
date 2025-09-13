import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { User, UserType } from '../../../shared/models/user.model';
import { Correspondente } from '../../../shared/models/correspondente.model';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { PasswordResetDialogComponent } from '../../../shared/components/password-reset-dialog/password-reset-dialog.component';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  passwordForm: FormGroup;
  isEditMode = false;
  userId: number | null = null;
  loading = false;
  changingPassword = false;
  correspondentes: Correspondente[] = [];
  UserType = UserType;
  showCorrespondentField = false;
  currentUserId: number | undefined;

  private themeSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private correspondenteService: CorrespondenteService,
    private authService: AuthService,
    public permissionService: PermissionService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.userForm = this.createUserForm();
    this.passwordForm = this.createPasswordForm();
    this.currentUserId = this.authService.currentUserValue?.id;
  }

  ngOnInit(): void {
    this.loadCorrespondentes();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = +params['id'];
        this.loadUser();
      }
    });

    // Subscribe to tipo changes to show/hide correspondent field
    this.userForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.showCorrespondentField = tipo === UserType.CORRESPONDENTE;
      if (this.showCorrespondentField) {
        this.userForm.get('correspondente')?.setValidators([Validators.required]);
      } else {
        this.userForm.get('correspondente')?.clearValidators();
      }
      this.userForm.get('correspondente')?.updateValueAndValidity();
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

  private createUserForm(): FormGroup {
    const form = this.formBuilder.group({
      login: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      nomecompleto: ['', [Validators.required, Validators.maxLength(255)]],
      senha: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      tipo: ['', [Validators.required]],
      correspondente: [null],
      emailprincipal: ['', [Validators.email]],
      emailsecundario: ['', [Validators.email]],
      emailresponsavel: ['', [Validators.email]],
      ativo: [true]
    });

    return form;
  }

  private createPasswordForm(): FormGroup {
    const form = this.formBuilder.group({
      novaSenha: ['', [Validators.minLength(6)]],
      confirmarSenha: ['']
    });

    // Add custom validator to check if passwords match
    form.addValidators(this.passwordMatchValidator.bind(this));

    return form;
  }

  private passwordMatchValidator(form: AbstractControl) {
    const newPassword = form.get('novaSenha');
    const confirmPassword = form.get('confirmarSenha');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  loadCorrespondentes(): void {
    this.correspondenteService.getCorrespondentes().subscribe({
      next: (correspondentes) => {
        this.correspondentes = correspondentes;
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

    this.loading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          login: user.login,
          nomecompleto: user.nomecompleto,
          tipo: user.tipo,
          correspondente: user.correspondentId,
          emailprincipal: user.emailprincipal,
          emailsecundario: user.emailsecundario,
          emailresponsavel: user.emailresponsavel,
          ativo: user.ativo
        });

        // Set the showCorrespondentField flag based on user type
        this.showCorrespondentField = user.tipo === UserType.CORRESPONDENTE;
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.loading = false;
        this.snackBar.open('Erro ao carregar usuário', 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/usuarios']);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.loading = true;
    
    const formData = this.userForm.value;
    const userData: any = {
      login: formData.login,
      nomecompleto: formData.nomecompleto,
      tipo: formData.tipo,
      emailprincipal: formData.emailprincipal,
      emailsecundario: formData.emailsecundario,
      emailresponsavel: formData.emailresponsavel,
      ativo: formData.ativo
    };

    // Add password only for new users or if it's provided in edit mode
    if (!this.isEditMode || formData.senha) {
      userData.senha = formData.senha;
    }

    // Add correspondentId for correspondent users
    if (formData.tipo === UserType.CORRESPONDENTE && formData.correspondente) {
      userData.correspondentId = formData.correspondente;
    }

    const operation = this.isEditMode && this.userId
      ? this.userService.updateUser(this.userId, userData)
      : this.userService.createUser(userData);

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
    if (this.passwordForm.invalid || !this.userId) return;

    this.changingPassword = true;
    
    const newPassword = this.passwordForm.get('novaSenha')?.value;

    this.userService.resetUserPassword(this.userId, newPassword).subscribe({
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

  // Helper method to check if correspondent field should be shown
  shouldShowCorrespondentField(): boolean {
    return this.showCorrespondentField;
  }
}