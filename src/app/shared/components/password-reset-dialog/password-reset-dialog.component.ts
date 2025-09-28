
import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PasswordResetDialogData {
  userName: string;
}

@Component({
  selector: 'app-password-reset-dialog',
  templateUrl: './password-reset-dialog.component.html',
  styleUrls: ['./password-reset-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogContent,
    MatDialogActions
  ]
})
export class PasswordResetDialogComponent {
  public dialogRef = inject(MatDialogRef<PasswordResetDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as PasswordResetDialogData;
  private snackBar = inject(MatSnackBar);
  
  newPassword = '';
  showPassword = false;
  
  constructor() {
    // Generate a random password when the dialog opens
    this.newPassword = this.generateRandomPassword();
  }

  generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  onPasswordChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.newPassword = target.value;
  }

  onCopyPassword(): void {
    navigator.clipboard.writeText(this.newPassword);
  }

  onRegeneratePassword(): void {
    this.newPassword = this.generateRandomPassword();
  }

  onConfirm(): void {
    // Validate password length
    if (this.newPassword.length < 6) {
      this.snackBar.open('A senha deve ter no mínimo 6 caracteres.', 'Fechar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }
    
    this.dialogRef.close(this.newPassword);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}