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
      console.log('Tipo changed to:', tipo, 'Show correspondent field:', this.showCorrespondentField);
      // Remove the required validator - users can have no correspondent associated
      this.userForm.get('correspondente')?.clearValidators();
      this.userForm.get('correspondente')?.updateValueAndValidity();
    });
    
    // Subscribe to correspondent changes for debugging
    this.userForm.get('correspondente')?.valueChanges.subscribe(value => {
      console.log('=== CORRESPONDENT FIELD CHANGED ===');
      console.log('Correspondent field value changed to:', value);
      console.log('Current form state:', this.userForm.value);
      console.log('=== END CORRESPONDENT FIELD CHANGED ===');
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
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]]
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
    console.log('Loading correspondentes in user form...');
    this.correspondenteService.getCorrespondentes().subscribe({
      next: (correspondentes) => {
        console.log('Correspondentes loaded in user form:', correspondentes);
        this.correspondentes = correspondentes;
        console.log('Correspondentes array updated in user form, length:', this.correspondentes.length);
      },
      error: (error) => {
        console.error('Error loading correspondentes in user form:', error);
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
        console.log('=== LOADING USER DATA ===');
        console.log('User data received from backend:', user);
        console.log('User correspondente:', user.correspondente);
        
        this.userForm.patchValue({
          login: user.login,
          nomecompleto: user.nomecompleto,
          tipo: user.tipo,
          correspondente: user.correspondente?.id || null,
          emailprincipal: user.emailprincipal,
          emailsecundario: user.emailsecundario,
          emailresponsavel: user.emailresponsavel,
          ativo: user.ativo
        });

        // Set the showCorrespondentField flag based on user type
        this.showCorrespondentField = user.tipo === UserType.CORRESPONDENTE;
        
        console.log('Form correspondente field value after loading:', this.userForm.get('correspondente')?.value);
        console.log('=== END LOADING USER DATA ===');
        
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
    // Check if correspondent field is required and valid
    // Only require correspondent if user type is CORRESPONDENTE and user is trying to set one
    if (this.showCorrespondentField && this.userForm.get('correspondente')?.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (this.userForm.invalid) return;

    // Show confirmation dialog
    const action = this.isEditMode ? 'atualizar' : 'criar';
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar operação',
        message: `Tem certeza que deseja ${action} este usuário?`,
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
    
    const formData = this.userForm.value;
    
    // Debug: Log form data
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Form Data:', formData);
    console.log('Show Correspondent Field:', this.showCorrespondentField);
    console.log('Correspondent Value:', formData.correspondente);
    console.log('User Type:', formData.tipo);
    console.log('Is Correspondent Type:', formData.tipo === UserType.CORRESPONDENTE);
    
    // First, get the current user data to preserve authorities
    let userData: any = {};
    
    if (this.isEditMode && this.userId) {
      // For edit mode, we need to get the current user data first to preserve authorities
      this.userService.getUserById(this.userId).subscribe({
        next: (currentUser) => {
          // Preserve the authorities from the current user
          userData = {
            id: currentUser.id,
            login: formData.login,
            nomecompleto: formData.nomecompleto,
            tipo: formData.tipo,
            emailprincipal: formData.emailprincipal,
            emailsecundario: formData.emailsecundario,
            emailresponsavel: formData.emailresponsavel,
            ativo: formData.ativo,
            authorities: currentUser.authorities || [] // Preserve authorities
          };

          // Add password only for new users or if it's provided in edit mode
          if (!this.isEditMode && formData.senha) {
            userData.senha = formData.senha;
          }

          // Add correspondent for correspondent users (following the same pattern as comarca/UF)
          if (formData.tipo === UserType.CORRESPONDENTE) {
            // If a correspondent is selected, send it as { id: correspondentId }
            if (formData.correspondente) {
              userData.correspondente = { id: formData.correspondente };
              console.log('Setting correspondente as ID object:', { id: formData.correspondente });
            } else {
              // For correspondent users, if no correspondent is selected, send null to clear any existing association
              userData.correspondente = null;
              console.log('Setting correspondente to null for correspondent user type');
            }
          } else {
            console.log('Not setting correspondente. Tipo:', formData.tipo);
          }

          console.log('Final user data being sent:', userData);
          console.log('Final user data as JSON:', JSON.stringify(userData, null, 2));
          
          // Additional debugging - check if the correspondente property exists in the object
          if ('correspondente' in userData) {
            console.log('Correspondente property exists in userData');
            console.log('Correspondente value:', userData.correspondente);
            if (userData.correspondente) {
              console.log('Correspondente is truthy');
              console.log('Correspondente type:', typeof userData.correspondente);
              console.log('Correspondente keys:', Object.keys(userData.correspondente));
            } else {
              console.log('Correspondente is falsy');
            }
          } else {
            console.log('Correspondente property does NOT exist in userData');
          }
          
          console.log('=== END DEBUG ===');

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
              // Navigate to user detail page instead of list
              this.router.navigate(['/usuarios', user.id]);
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
        },
        error: (error) => {
          this.loading = false;
          console.error('Error getting current user data:', error);
          this.snackBar.open('Erro ao obter dados do usuário atual', 'Fechar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      // For new users, create userData without preserving authorities
      userData = {
        login: formData.login,
        nomecompleto: formData.nomecompleto,
        tipo: formData.tipo,
        emailprincipal: formData.emailprincipal,
        emailsecundario: formData.emailsecundario,
        emailresponsavel: formData.emailresponsavel,
        ativo: formData.ativo
      };

      // Add password only for new users or if it's provided in edit mode
      if (!this.isEditMode && formData.senha) {
        userData.senha = formData.senha;
      }

      // Add correspondent for correspondent users (following the same pattern as comarca/UF)
      if (formData.tipo === UserType.CORRESPONDENTE) {
        // If a correspondent is selected, send it as { id: correspondentId }
        if (formData.correspondente) {
          userData.correspondente = { id: formData.correspondente };
          console.log('Setting correspondente as ID object:', { id: formData.correspondente });
        } else {
          // For correspondent users, if no correspondent is selected, send null to clear any existing association
          userData.correspondente = null;
          console.log('Setting correspondente to null for correspondent user type');
        }
      } else {
        console.log('Not setting correspondente. Tipo:', formData.tipo);
      }

      console.log('Final user data being sent:', userData);
      console.log('Final user data as JSON:', JSON.stringify(userData, null, 2));
      
      // Additional debugging - check if the correspondente property exists in the object
      if ('correspondente' in userData) {
        console.log('Correspondente property exists in userData');
        console.log('Correspondente value:', userData.correspondente);
        if (userData.correspondente) {
          console.log('Correspondente is truthy');
          console.log('Correspondente type:', typeof userData.correspondente);
          console.log('Correspondente keys:', Object.keys(userData.correspondente));
        } else {
          console.log('Correspondente is falsy');
        }
      } else {
        console.log('Correspondente property does NOT exist in userData');
      }
      
      console.log('=== END DEBUG ===');

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
          // Navigate to user detail page instead of list
          this.router.navigate(['/usuarios', user.id]);
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
  }

  private markFormGroupTouched() {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid || !this.userId) return;

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar alteração de senha',
        message: 'Tem certeza que deseja alterar a senha deste usuário?',
        confirmText: 'SIM',
        cancelText: 'NÃO'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.proceedWithPasswordChange();
      }
    });
  }

  private proceedWithPasswordChange(): void {
    if (!this.userId) return;
    
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

  // New method to navigate back to user list
  onBackToList(): void {
    this.router.navigate(['/usuarios']);
  }
}