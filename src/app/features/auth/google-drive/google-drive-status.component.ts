import { Component, OnInit } from '@angular/core';
import { GoogleDriveService } from '../../../core/services/google-drive.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-google-drive-status',
  template: `
    <div class="container">
      <h2>Google Drive - Status da Conexão</h2>
      
      <div class="status-section" *ngIf="connectionStatus">
        <div class="status-indicator" [ngClass]="connectionStatus!.connected ? 'connected' : 'disconnected'">
          <span>{{ connectionStatus!.message }}</span>
        </div>
        <div class="user-info" *ngIf="connectionStatus!.connected">
          ID do Usuário: {{ connectionStatus!.userId }}
        </div>
      </div>
      
      <div class="auth-section">
        <button 
          (click)="redirectToAuth()" 
          [disabled]="loading"
          class="btn btn-primary">
          <span *ngIf="!loading">Conectar ao Google Drive</span>
          <span *ngIf="loading">Redirecionando...</span>
        </button>
      </div>
      
      <div *ngIf="error" class="error">
        <p>Ocorreu um erro: {{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    
    .status-section {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .status-indicator {
      padding: 15px;
      border-radius: 4px;
      margin: 10px 0;
      font-weight: bold;
    }
    
    .status-indicator.connected {
      background-color: #e6f4ea;
      color: #34a853;
    }
    
    .status-indicator.disconnected {
      background-color: #fce8e6;
      color: #ea4335;
    }
    
    .user-info {
      margin-top: 10px;
      font-size: 14px;
      color: #666;
    }
    
    .auth-section {
      margin: 20px 0;
      padding: 20px;
    }
    
    .btn {
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px;
      font-size: 14px;
    }
    
    .btn-primary {
      background-color: #4285f4;
      color: white;
    }
    
    .btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .error {
      background-color: #fce8e6;
      color: #ea4335;
      padding: 10px;
      border-radius: 4px;
      margin: 15px 0;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class GoogleDriveStatusComponent implements OnInit {
  loading = false;
  error: string | null = null;
  connectionStatus: { connected: boolean; message: string; userId: number } | null = null;

  constructor(private googleDriveService: GoogleDriveService) {}

  ngOnInit(): void {
    this.checkConnectionStatus();
  }

  checkConnectionStatus(): void {
    this.googleDriveService.getConnectionStatus().subscribe({
      next: (status) => {
        this.connectionStatus = status;
      },
      error: (error) => {
        console.error('Error checking Google Drive connection status:', error);
        this.error = 'Falha ao verificar status da conexão. Por favor, tente novamente.';
      }
    });
  }

  redirectToAuth(): void {
    this.loading = true;
    this.error = null;
    
    // Obtém a URL de autenticação do backend e redireciona
    this.googleDriveService.getAuthUrl().subscribe({
      next: (authUrl) => {
        // Redireciona para a URL de autenticação do Google
        window.location.href = authUrl;
      },
      error: (error) => {
        console.error('Error getting Google auth URL:', error);
        this.loading = false;
        this.error = 'Falha ao obter URL de autenticação. Por favor, tente novamente.';
      }
    });
  }
}