import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, UserType } from '../../../shared/models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  UserType = UserType;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.formBuilder.group({
      login: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      senha: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      nomeCompleto: ['', [Validators.required, Validators.maxLength(255)]],
      emailPrincipal: ['', [Validators.email]],
      emailSecundario: ['', [Validators.email]],
      emailResponsavel: ['', [Validators.email]],
      tipo: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if user has admin role
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/unauthorized']);
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    const userData: RegisterRequest = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open('Usuário cadastrado com sucesso!', 'Fechar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/usuarios']);
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
}