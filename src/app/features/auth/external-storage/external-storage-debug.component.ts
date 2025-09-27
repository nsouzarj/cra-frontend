import { Component, OnInit } from '@angular/core';
import { ExternalStorageService } from '../../../core/services/external-storage.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-external-storage-debug',
  templateUrl: './external-storage-debug.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule
  ]
})
export class ExternalStorageDebugComponent implements OnInit {
  debugInfo: any = null;
  error: string = '';

  constructor(private externalStorageService: ExternalStorageService) {}

  ngOnInit(): void {
  }

  checkStatus(): void {
    this.error = '';
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        this.debugInfo = response;
      },
      error: (error) => {
        console.error('Status error:', error);
        this.error = error.message || 'Unknown error';
        this.debugInfo = null;
      }
    });
  }

  getAuthUrl(): void {
    this.error = '';
    this.externalStorageService.getAuthorizationUrl().subscribe({
      next: (response) => {
        this.debugInfo = response;
      },
      error: (error) => {
        console.error('Auth URL error:', error);
        this.error = error.message || 'Unknown error';
        this.debugInfo = null;
      }
    });
  }

  testConnection(): void {
    this.error = '';
    this.externalStorageService.testConnection().subscribe({
      next: (response) => {
        this.debugInfo = response;
      },
      error: (error) => {
        console.error('Test connection error:', error);
        this.error = error.message || 'Unknown error';
        this.debugInfo = null;
      }
    });
  }

  isAuthenticated(): void {
    this.error = '';
    this.externalStorageService.isAuthenticated().subscribe({
      next: (response) => {
        this.debugInfo = { isAuthenticated: response };
      },
      error: (error) => {
        console.error('Is authenticated error:', error);
        this.error = error.message || 'Unknown error';
        this.debugInfo = null;
      }
    });
  }
}