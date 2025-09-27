import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExternalStorageService } from '../../../core/services/external-storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-external-storage-auth-dialog',
  templateUrl: './external-storage-auth-dialog.component.html',
  styleUrls: ['./external-storage-auth-dialog.component.css']
})
export class ExternalStorageAuthDialogComponent implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;
  isConnected = false;
  debugInfo: any = null;
  isCheckingStatus = false;
  returnUrl: string | null = null;
  showAuthInstructions = false;
  private statusCheckInterval: any = null;

  constructor(
    public dialogRef: MatDialogRef<ExternalStorageAuthDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private externalStorageService: ExternalStorageService,
    private router: Router
  ) { }

  ngOnInit() {
    // Check if we have a return URL in the data
    if (this.data && this.data.returnUrl) {
      this.returnUrl = this.data.returnUrl;
    }
    // Check connection status when dialog opens
    this.checkAuthorizationStatus();
  }

  ngOnDestroy() {
    // Clear interval when component is destroyed
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }

  // Check authorization status
  checkAuthorizationStatus() {
    this.isCheckingStatus = true;
    this.error = null;
    
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        this.isCheckingStatus = false;
        // Store debug info
        this.debugInfo = response;
        
        if (response.status === 'OK') {
          // Authorization successful
          this.isConnected = true;
          // Clear interval since we're connected
          if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
          }
          // Auto-close dialog after successful authentication
          setTimeout(() => {
            this.closeDialog(true);
          }, 1500);
        } else {
          this.isConnected = false;
          // If status is UNAVAILABLE, show a specific error message
          if (response.status === 'UNAVAILABLE') {
            this.error = 'O serviço do Google Drive não está disponível no momento. Por favor, tente novamente mais tarde.';
          }
        }
      },
      error: (error: any) => {
        console.error('Error checking authorization status:', error);
        this.isCheckingStatus = false;
        this.isConnected = false;
        this.debugInfo = { error: error.message };
        
        // Handle specific error cases
        if (error.status === 503 || (error.error && error.error.status === 'UNAVAILABLE')) {
          this.error = 'O serviço do Google Drive não está disponível no momento. Por favor, tente novamente mais tarde.';
        } else {
          this.error = this.getFriendlyErrorMessage(error.message || error.error?.message);
        }
        
        console.error('Error checking authorization status:', error);
      }
    });
  }

  // Start Google Drive authentication flow
  startGoogleDriveAuth() {
    this.isLoading = true;
    this.error = null;
    
    // Pass the return URL to the service
    this.externalStorageService.getAuthorizationUrl(this.returnUrl || undefined).subscribe({
      next: (response) => {
        const authUrl = response.authorizationUrl;
        this.isLoading = false;
        
        if (authUrl) {
          // Instead of redirecting, open in a new tab/window
          window.open(authUrl, '_blank');
          
          // Show instructions for the user
          this.showAuthInstructions = true;
          
          // Start periodic status checks
          this.startStatusCheckInterval();
        } else {
          // If we don't get a valid URL, show an error
          this.error = 'Não foi possível obter a URL de autenticação do Google Drive. Por favor, tente novamente.';
        }
      },
      error: (error: any) => {
        console.error('Error getting authorization URL:', error);
        this.isLoading = false;
        
        // Handle specific error cases
        if (error.status === 503 || (error.error && error.error.status === 'UNAVAILABLE')) {
          this.error = 'O serviço do Google Drive não está disponível no momento. Por favor, tente novamente mais tarde.';
        } else if (error.status === 400 && error.error && typeof error.error === 'object' && error.error.status === 'UNAVAILABLE') {
          // Handle the case where the backend returns the UNAVAILABLE JSON response
          this.error = 'O serviço do Google Drive não está disponível no momento. Por favor, tente novamente mais tarde.';
        } else {
          this.error = this.getFriendlyErrorMessage(error.message || error.error?.message);
        }
      }
    });
  }

  // Start periodic status checks
  private startStatusCheckInterval() {
    // Clear any existing interval
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
    
    // Check status every 3 seconds while showing auth instructions
    this.statusCheckInterval = setInterval(() => {
      if (this.showAuthInstructions && !this.isCheckingStatus) {
        this.checkAuthorizationStatus();
      }
    }, 3000);
  }

  // Manual check for authentication status (in case user completed auth in another tab)
  manualCheckAuthStatus() {
    this.checkAuthorizationStatus();
  }

  // Close dialog and return result
  closeDialog(result: boolean = false) {
    // Clear interval when closing dialog
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
    this.dialogRef.close(result);
  }

  // Navigate back to the return URL
  navigateToReturnUrl() {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    }
    this.closeDialog(true);
  }

  // Go back to the initial view (hide auth instructions)
  goBack() {
    this.showAuthInstructions = false;
    // Clear interval when going back
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
    // Check status again to see if auth was successful
    this.checkAuthorizationStatus();
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

    // Default friendly message
    return 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.';
  }
}