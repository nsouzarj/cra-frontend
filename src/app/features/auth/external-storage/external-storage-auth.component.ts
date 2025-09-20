import { Component, OnInit } from '@angular/core';
import { ExternalStorageService } from '../../../core/services/external-storage.service';
import { MatDialog } from '@angular/material/dialog';
import { ExternalStorageAuthDialogComponent } from './external-storage-auth-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-external-storage-auth',
  templateUrl: './external-storage-auth.component.html',
  styleUrls: ['./external-storage-auth.component.css']
})
export class ExternalStorageAuthComponent implements OnInit {
  connectionStatus: any = null;
  debugInfo: string = '';
  isCheckingStatus: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  isConnected: boolean = false;
  showAuthSuccessMessage: boolean = false;
  showDebugInfo: boolean = false;

  constructor(
    private externalStorageService: ExternalStorageService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Initializing ExternalStorageComponent');
    // Check if we're returning from Google Drive auth (URL contains code parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // We're returning from Google Drive auth, show success message and close
      this.handleAuthSuccess();
    } else {
      // Normal initialization
      this.checkAuthorizationStatus();
    }
  }

  handleAuthSuccess(): void {
    console.log('Handling auth success from redirect');
    this.isLoading = true;
    this.showAuthSuccessMessage = true;
    
    // Check connection status to confirm authentication
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        console.log('Received status response after auth:', response);
        this.connectionStatus = response;
        this.debugInfo = JSON.stringify(response, null, 2);
        this.isLoading = false;
        this.isConnected = response.status === 'OK';
        
        if (this.isConnected) {
          // Show success message and auto-close
          this.showAuthSuccessMessage = true;
          // Send message to parent window if this is a popup
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_DRIVE_AUTH_SUCCESS' }, '*');
          }
          // Close the popup after a delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error checking status after auth:', error);
        this.isLoading = false;
        this.error = 'Failed to verify authentication: ' + (error.message || 'Unknown error');
      }
    });
  }

  openExternalStorageAuthPopup(): void {
    console.log('Initiating authentication process');
    this.isLoading = true;
    this.error = null;
    this.showAuthSuccessMessage = false;
    
    this.externalStorageService.getAuthorizationUrl().subscribe({
      next: (response) => {
        console.log('Received auth response:', response);
        this.debugInfo = JSON.stringify(response, null, 2);
        this.isLoading = false;
        
        if (response.authorizationUrl) {
          console.log('Opening popup with URL:', response.authorizationUrl);
          
          // Calculate center position for popup
          const popupWidth = 600;
          const popupHeight = 700;
          const left = (screen.width - popupWidth) / 2;
          const top = (screen.height - popupHeight) / 2;
          
          // Open popup window with the actual auth URL, centered on screen
          const popup = window.open(
            response.authorizationUrl,
            'Google Drive Auth',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no`
          );
          
          // Check periodically if the popup is closed
          const checkPopup = setInterval(() => {
            if (popup?.closed) {
              console.log('Popup closed, checking connection status');
              clearInterval(checkPopup);
              this.checkAuthorizationStatus();
            }
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Auth error:', error);
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        this.isLoading = false;
        this.error = error.message || 'Failed to initiate authentication';
      }
    });
  }

  checkAuthorizationStatus(): void {
    console.log('Checking connection status');
    this.isCheckingStatus = true;
    this.error = null;
    
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        console.log('Received status response:', response);
        this.connectionStatus = response;
        this.debugInfo = JSON.stringify(response, null, 2);
        this.isCheckingStatus = false;
        this.isConnected = response.status === 'OK';
        console.log('Connection status updated. Is connected:', this.isConnected);
      },
      error: (error) => {
        console.error('Status error:', error);
        this.connectionStatus = null;
        this.debugInfo = `Error: ${JSON.stringify(error, null, 2)}`;
        this.isCheckingStatus = false;
        this.isConnected = false;
        this.error = error.message || 'Failed to check connection status';
      }
    });
  }

  testConnection(): void {
    console.log('Testing connection');
    this.isLoading = true;
    this.error = null;
    
    this.externalStorageService.testConnection().subscribe({
      next: (response) => {
        console.log('Test connection response:', response);
        this.debugInfo = `Test Connection Response:\n${JSON.stringify(response, null, 2)}`;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Test connection error:', error);
        this.debugInfo = `Test Connection Error:\n${JSON.stringify(error, null, 2)}`;
        this.isLoading = false;
        this.error = error.message || 'Failed to test connection';
      }
    });
  }

  getFriendlyErrorMessage(error: string): string {
    // Map technical error messages to user-friendly ones
    if (error.includes('Failed to initiate authentication')) {
      return 'Não foi possível iniciar o processo de autenticação. Por favor, tente novamente.';
    }
    if (error.includes('Failed to check connection status')) {
      return 'Não foi possível verificar o status da conexão. Por favor, tente novamente.';
    }
    if (error.includes('Failed to test connection')) {
      return 'Não foi possível testar a conexão. Por favor, verifique sua conexão com a internet e tente novamente.';
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
    
    // Default friendly message
    return 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.';
  }
}