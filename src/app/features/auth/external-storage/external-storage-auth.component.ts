import { Component, OnInit, inject } from '@angular/core';
import { ExternalStorageService } from '../../../core/services/external-storage.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

interface ConnectionStatus {
  status: string;
  message?: string;
  [key: string]: string | number | boolean | object | null | undefined;
}

@Component({
  selector: 'app-external-storage-auth',
  templateUrl: './external-storage-auth.component.html',
  styleUrls: ['./external-storage-auth.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ]
})
export class ExternalStorageAuthComponent implements OnInit {
  connectionStatus: ConnectionStatus | null = null;
  debugInfo = '';
  isCheckingStatus = false;
  isLoading = false;
  error: string | null = null;
  isConnected = false;
  showAuthSuccessMessage = false;
  showDebugInfo = false;
  isRedirectedFromAuth = false;
  returnUrl: string | null = null;

  // Using inject() function instead of constructor injection
  private externalStorageService = inject(ExternalStorageService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  ngOnInit(): void {
    // Check if we're returning from Google Drive auth (URL contains code parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    // Get the return URL if it exists
    this.returnUrl = urlParams.get('state');
    
    // Check if the page contains the JSON response pattern
    const pageContent = document.body.textContent || '';
    const isJsonResponse = pageContent.includes('"access_token_received": true') && 
                          pageContent.includes('"refresh_token_received": true');
    
    if (code || isJsonResponse) {
      // We're returning from Google Drive auth, show success message
      this.isRedirectedFromAuth = true;
      this.handleAuthSuccess();
    } else {
      // Normal initialization
      this.checkAuthorizationStatus();
    }
  }

  handleAuthSuccess(): void {
    this.isLoading = true;
    this.showAuthSuccessMessage = true;
    
    // Check connection status to confirm authentication
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        this.connectionStatus = response;
        this.debugInfo = JSON.stringify(response, null, 2);
        this.isLoading = false;
        this.isConnected = response.status === 'OK';
        
        if (this.isConnected) {
          // Show success message
          this.showAuthSuccessMessage = true;
          
          // If we have a return URL, navigate back to it after a delay
          if (this.returnUrl) {
            // Decode the return URL and navigate to it
            try {
              const decodedReturnUrl = decodeURIComponent(this.returnUrl);
              // Navigate after a short delay to show the success message
              setTimeout(() => {
                this.router.navigateByUrl(decodedReturnUrl);
              }, 3000);
            } catch (e) {
              console.error('Error decoding return URL:', e);
              // Fallback to dashboard
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 3000);
            }
          } else {
            // If no return URL, go to dashboard
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 3000);
          }
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
    this.isLoading = true;
    this.error = null;
    this.showAuthSuccessMessage = false;
    
    // Pass the current URL as the return URL
    const currentUrl = this.router.url;
    this.externalStorageService.getAuthorizationUrl(currentUrl).subscribe({
      next: (response) => {
        this.debugInfo = JSON.stringify(response, null, 2);
        this.isLoading = false;
        
        if (response.authorizationUrl) {
          // Calculate responsive popup dimensions
          const maxWidth = 600;
          const maxHeight = 700;
          const minWidth = 320;
          const minHeight = 500;
          
          // Get available screen dimensions using modern APIs for better accuracy
          const screenWidth = window.screen.availWidth || window.innerWidth;
          const screenHeight = window.screen.availHeight || window.innerHeight;
          
          // Calculate popup dimensions based on screen size
          let popupWidth = Math.min(maxWidth, screenWidth * 0.9);
          let popupHeight = Math.min(maxHeight, screenHeight * 0.8);
          
          // Ensure minimum dimensions
          popupWidth = Math.max(popupWidth, minWidth);
          popupHeight = Math.max(popupHeight, minHeight);
          
          // Calculate center position for popup using modern APIs for better accuracy
          const left = Math.max(0, (screenWidth - popupWidth) / 2);
          const top = Math.max(0, (screenHeight - popupHeight) / 2);
          
          // Open popup window with the actual auth URL, centered on screen
          const popup = window.open(
            response.authorizationUrl,
            'Google Drive Auth',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,directories=no,status=no`
          );
          
          // Check periodically if the popup is closed
          const checkPopup = setInterval(() => {
            if (popup?.closed) {
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
    this.isCheckingStatus = true;
    this.error = null;
    
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        this.connectionStatus = response;
        this.debugInfo = JSON.stringify(response, null, 2);
        this.isCheckingStatus = false;
        this.isConnected = response.status === 'OK';
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
    this.isLoading = true;
    this.error = null;
    
    this.externalStorageService.testConnection().subscribe({
      next: (response) => {
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

  // Navigate back to the return URL or dashboard
  closeAndReturn(): void {
    if (this.returnUrl) {
      // If we have a return URL, navigate to it
      try {
        const decodedReturnUrl = decodeURIComponent(this.returnUrl);
        this.router.navigateByUrl(decodedReturnUrl);
      } catch (e) {
        console.error('Error decoding return URL:', e);
        // Fallback to dashboard
        this.router.navigate(['/dashboard']);
      }
    } else {
      // Go to dashboard
      this.router.navigate(['/dashboard']);
    }
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