import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule
  ]
})
export class ConfirmationDialogComponent {
  // Using inject() function instead of constructor injection
  public dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  public data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);

  constructor() {
    // Set default values if not provided
    this.data.confirmText = this.data.confirmText || 'SIM';
    this.data.cancelText = this.data.cancelText || 'NÃO';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}