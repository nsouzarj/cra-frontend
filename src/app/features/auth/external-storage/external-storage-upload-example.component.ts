import { Component } from '@angular/core';
import { ExternalStorageAuthGuardService } from '../../../core/services/external-storage-auth-guard.service';
import { ExternalStorageService } from '../../../core/services/external-storage.service';

@Component({
  selector: 'app-external-storage-upload-example',
  template: `
    <div class="upload-container">
      <h2>File Upload Example</h2>
      
      <div class="file-upload-section">
        <input type="file" #fileInput (change)="onFileSelected($event)" multiple accept="*/*" />
        <button 
          mat-raised-button 
          color="primary" 
          (click)="fileInput.click()">
          Select Files
        </button>
        
        <div *ngIf="selectedFiles.length > 0" class="selected-files">
          <h3>Selected Files:</h3>
          <ul>
            <li *ngFor="let file of selectedFiles">{{ file.name }}</li>
          </ul>
          <button 
            mat-raised-button 
            color="accent" 
            (click)="uploadFiles()"
            [disabled]="isUploading">
            <mat-spinner *ngIf="isUploading" diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
            Upload Files
          </button>
        </div>
      </div>
      
      <div *ngIf="message" class="message-container" [ngClass]="{'error': isError, 'success': !isError}">
        {{ message }}
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .file-upload-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      border: 1px dashed #ccc;
      border-radius: 4px;
      background-color: #f9f9f9;
    }
    
    .selected-files {
      margin-top: 20px;
    }
    
    .selected-files ul {
      list-style-type: none;
      padding: 0;
    }
    
    .selected-files li {
      padding: 8px;
      background-color: #fff;
      margin-bottom: 4px;
      border-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .message-container {
      margin-top: 20px;
      padding: 12px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    .message-container.success {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .message-container.error {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class ExternalStorageUploadExampleComponent {
  selectedFiles: File[] = [];
  isUploading = false;
  message = '';
  isError = false;

  constructor(
    private authGuard: ExternalStorageAuthGuardService,
    private externalStorageService: ExternalStorageService
  ) { }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  uploadFiles() {
    // Check authentication before uploading
    this.authGuard.checkAuthentication().subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          // Proceed with upload
          this.performUpload();
        } else {
          // User cancelled or authentication failed
          this.showMessage('Upload cancelled. Please authenticate with external storage first.', true);
        }
      }
    });
  }

  private performUpload() {
    if (this.selectedFiles.length === 0) {
      this.showMessage('Please select files to upload.', true);
      return;
    }

    this.isUploading = true;
    this.message = '';
    this.isError = false;

    // Simulate file upload
    // In a real implementation, you would call your upload service here
    setTimeout(() => {
      this.isUploading = false;
      this.showMessage('Files uploaded successfully!', false);
      this.selectedFiles = [];
    }, 2000);
  }

  private showMessage(text: string, isError: boolean) {
    this.message = text;
    this.isError = isError;
  }
}