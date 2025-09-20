import { Component, OnInit } from '@angular/core';
import { ExternalStorageService } from '../../../core/services/external-storage.service';

@Component({
  selector: 'app-external-storage-debug',
  templateUrl: './external-storage-debug.component.html'
})
export class ExternalStorageDebugComponent implements OnInit {
  debugInfo: any = null;
  error: string = '';

  constructor(private externalStorageService: ExternalStorageService) {}

  ngOnInit(): void {
    console.log('ExternalStorageDebugComponent initialized');
  }

  checkStatus(): void {
    console.log('Checking status...');
    this.error = '';
    this.externalStorageService.getConnectionStatus().subscribe({
      next: (response) => {
        console.log('Status response:', response);
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
    console.log('Getting auth URL...');
    this.error = '';
    this.externalStorageService.getAuthorizationUrl().subscribe({
      next: (response) => {
        console.log('Auth URL response:', response);
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
    console.log('Testing connection...');
    this.error = '';
    this.externalStorageService.testConnection().subscribe({
      next: (response) => {
        console.log('Test connection response:', response);
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
    console.log('Checking if authenticated...');
    this.error = '';
    this.externalStorageService.isAuthenticated().subscribe({
      next: (response) => {
        console.log('Is authenticated response:', response);
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