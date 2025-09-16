import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ObservationDialogData {
  title: string;
  message: string;
  observationLabel?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-observation-dialog',
  templateUrl: './observation-dialog.component.html',
  styleUrls: ['./observation-dialog.component.scss']
})
export class ObservationDialogComponent {
  observation: string = '';

  constructor(
    public dialogRef: MatDialogRef<ObservationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ObservationDialogData
  ) {
    // Set default values if not provided
    this.data.observationLabel = this.data.observationLabel || 'Observação:';
    this.data.confirmText = this.data.confirmText || 'OK';
    this.data.cancelText = this.data.cancelText || 'CANCELAR';
  }

  onConfirm(): void {
    this.dialogRef.close(this.observation);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  // Method to check if the observation is valid (at least 20 characters)
  isObservationValid(): boolean {
    return !!this.observation && this.observation.trim().length >= 20;
  }
}