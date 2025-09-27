import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface PasswordResetDialogData {
  userName: string;
}

@Component({
  selector: 'app-password-reset-dialog',
  templateUrl: './password-reset-dialog.component.html',
  styleUrls: ['./password-reset-dialog.component.scss'],
  standalone: true
})
export class PasswordResetDialogComponent {
  newPassword: string = '';
  showPassword: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PasswordResetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PasswordResetDialogData,
    private snackBar: MatSnackBar
  ) {
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

  onPasswordChange(event: any): void {
    this.newPassword = event.target.value;
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