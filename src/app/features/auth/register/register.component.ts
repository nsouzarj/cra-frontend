import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { CorrespondenteService } from '../../../core/services/correspondente.service';
import { RegisterRequest, UserType } from '../../../shared/models/user.model';
import { Correspondente } from '../../../shared/models/correspondente.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  UserType = UserType;
  showCorrespondentField = false;
  correspondentes: Correspondente[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private correspondenteService: CorrespondenteService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.formBuilder.group({
      login: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      nomecompleto: ['', [Validators.required, Validators.maxLength(255)]],
      emailprincipal: ['', [Validators.email]],
      emailsecundario: ['', [Validators.email]],
      emailresponsavel: ['', [Validators.email]],
      tipo: ['', [Validators.required]],
      correspondente: [null]
    });
  }

  ngOnInit(): void {
    // Check if user has admin role
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/unauthorized']);
    }
    
    // Load correspondentes for the correspondent selection dropdown
    this.loadCorrespondentes();
    
    // Subscribe to tipo changes to show/hide correspondent field
    this.registerForm.get('tipo')?.valueChanges.subscribe(tipo => {
      this.showCorrespondentField = tipo === UserType.CORRESPONDENTE;
      console.log('Tipo changed to:', tipo, 'Show correspondent field:', this.showCorrespondentField);
      // Remove the required validator - users can have no correspondent associated
      this.registerForm.get('correspondente')?.clearValidators();
      this.registerForm.get('correspondente')?.updateValueAndValidity();
    });
    
    // Subscribe to correspondent changes for debugging
    this.registerForm.get('correspondente')?.valueChanges.subscribe(value => {
      console.log('Correspondent field value changed to:', value);
    });
  }

  loadCorrespondentes(): void {
    console.log('Loading correspondentes...');
    this.correspondenteService.getCorrespondentes().subscribe({
      next: (correspondentes) => {
        console.log('Correspondentes loaded:', correspondentes);
        this.correspondentes = correspondentes;
        console.log('Correspondentes array updated, length:', this.correspondentes.length);
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

  onSubmit(): void {
    // Check if correspondent field is required and valid
    // Only require correspondent if user type is CORRESPONDENTE and user is trying to set one
    if (this.showCorrespondentField && this.registerForm.get('correspondente')?.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formData = this.registerForm.value;
    
    // Debug: Log form data
    console.log('=== REGISTRATION FORM SUBMISSION DEBUG ===');
    console.log('Form Data:', formData);
    console.log('Show Correspondent Field:', this.showCorrespondentField);
    console.log('Correspondent Value:', formData.correspondente);
    console.log('User Type:', formData.tipo);
    console.log('Is Correspondent Type:', formData.tipo === UserType.CORRESPONDENTE);
    
    // Prepare user data
    const userData: any = {
      login: formData.login,
      nomecompleto: formData.nomecompleto,
      tipo: formData.tipo,
      emailprincipal: formData.emailprincipal,
      emailsecundario: formData.emailsecundario,
      emailresponsavel: formData.emailresponsavel
    };

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

    this.userService.createUser(userData).subscribe({
      next: (user) => {
        this.loading = false;
        this.snackBar.open('Usuário cadastrado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        // Navigate to user detail page after creation
        this.router.navigate(['/usuarios', user.id]);
      },
      error: (error) => {
        this.loading = false;
        console.error('Registration error:', error);
        
        let message = 'Erro ao cadastrar usuário.';
        if (error.status === 400) {
          message = 'Dados inválidos ou login já existe.';
        } else if (error.status === 403) {
          message = 'Sem permissão para cadastrar usuários.';
        }
        
        this.snackBar.open(message, 'Fechar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }
}