import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
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
    MatDialogContent,
    MatDialogActions
  ]
})
export class ConfirmationDialogComponent {
  public dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as ConfirmationDialogData;
  
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