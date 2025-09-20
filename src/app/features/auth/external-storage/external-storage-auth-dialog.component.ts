import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExternalStorageService } from '../../../core/services/external-storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-external-storage-auth-dialog',
  templateUrl: './external-storage-auth-dialog.component.html',
  styleUrls: ['./external-storage-auth-dialog.component.css']
})
export class ExternalStorageAuthDialogComponent implements OnInit {
  isLoading = false;
  error: string | null = null;
  isConnected = false;
  debugInfo: any = null;
  isCheckingStatus = false;

  constructor(
    public dialogRef: MatDialogRef<ExternalStorageAuthDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private externalStorageService: ExternalStorageService,
    private router: Router
  ) { }

  ngOnInit() {
    console.log('Initializing ExternalStorageAuthDialogComponent');
    // Check connection status when dialog opens
    this.checkAuthorizationStatus();
    
    // Listen for authentication success message from popup
    window.addEventListener('message', this.handleAuthMessage.bind(this));
  }

  ngOnDestroy() {
    // Clean up event listener
    window.removeEventListener('message', this.handleAuthMessage.bind(this));
  }

  // Handle authentication success message from popup
  private handleAuthMessage(event: MessageEvent) {
    if (event.data && event.data.type === 'GOOGLE_DRIVE_AUTH_SUCCESS') {
      console.log('Received auth success message from popup');
      // Check status and close dialog automatically
      this.checkAuthorizationStatus();
    }
  }

  // Check authorization status
  checkAuthorizationStatus() {
    console.log('Checking authorization status');
    this.isCheckingStatus = true;
    this.error = null;
    
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        console.log('Received connection status response:', response);
        this.isCheckingStatus = false;
        // Store debug info
        this.debugInfo = response;
        console.log('Connection status response:', response);
        
        if (response.status === 'OK') {
          // Authorization successful
          console.log('User is connected to Google Drive');
          this.isConnected = true;
          // Auto-close dialog after successful authentication
          setTimeout(() => {
            this.closeDialog(true);
          }, 1500);
        } else {
          console.log('User is not connected to Google Drive');
          this.isConnected = false;
        }
      },
      error: (error) => {
        console.error('Error checking authorization status:', error);
        this.isCheckingStatus = false;
        this.isConnected = false;
        this.debugInfo = { error: error.message };
        this.error = this.getFriendlyErrorMessage(error.message);
        console.error('Error checking authorization status:', error);
      }
    });
  }

  // Open popup window for authorization
  openExternalStorageAuthPopup() {
    console.log('Opening external storage auth popup');
    this.isLoading = true;
    this.error = null;
    
    this.externalStorageService.getAuthorizationUrl().subscribe({
      next: (response) => {
        const authUrl = response.authorizationUrl;
        console.log('Received authorization URL:', authUrl);
        this.isLoading = false;
        
        // Calculate center position for popup
        const popupWidth = 600;
        const popupHeight = 700;
        const left = (screen.width - popupWidth) / 2;
        const top = (screen.height - popupHeight) / 2;
        
        // Open popup window with the actual auth URL, centered on screen
        const popup = window.open(
          authUrl,
          'External Storage Authorization',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no`
        );
        
        // Check if popup was blocked
        if (!popup) {
          console.error('Popup was blocked by browser');
          this.error = 'Popup bloqueado pelo navegador. Por favor, permita popups para este site e tente novamente.';
          return;
        }
        
        console.log('Popup opened successfully');
        
        // Periodically check if popup is closed
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            console.log('Popup closed, checking connection status');
            clearInterval(checkPopup);
            this.checkAuthorizationStatus();
          }
        }, 1000);
      },
      error: (error) => {
        console.error('Error getting authorization URL:', error);
        this.error = this.getFriendlyErrorMessage(error.message);
        this.isLoading = false;
        console.error('Error getting authorization URL:', error);
      }
    });
  }

  // Close dialog and return result
  closeDialog(result: boolean = false) {
    console.log('Closing dialog with result:', result);
    this.dialogRef.close(result);
  }

  // Map technical error messages to user-friendly ones
  private getFriendlyErrorMessage(error: string): string {
    // Map technical error messages to user-friendly ones
    if (error.includes('Failed to initiate authentication')) {
      return 'Não foi possível iniciar o processo de autenticação. Por favor, tente novamente.';
    }
    if (error.includes('Failed to check connection status')) {
      return 'Não foi possível verificar o status da conexão. Por favor, tente novamente.';
    }
    if (error.includes('401') || error.includes('Unauthorized')) {
      return 'Autenticação necessária. Por favor, faça login no Google Drive.';
    }
    if (error.includes('403') || error.includes('Forbidden')) {
      return 'Acesso negado. Verifique se você concedeu as permissões necessárias ao aplicativo.';
    }
    if (error.includes('500') || error.includes('Internal Server Error')) {
      return 'Erro no servidor. Por favor, tente novamente mais tarde.';
    }
    if (error.includes('Network Error') || error.includes('network')) {
      return 'Erro de conexão. Verifique sua conexão com a internet e tente novamente.';
    }
    if (error.includes('Popup blocked')) {
      return 'Popup bloqueado pelo navegador. Por favor, permita popups para este site e tente novamente.';
    }
    
    // Default friendly message
    return 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.';
  }
}