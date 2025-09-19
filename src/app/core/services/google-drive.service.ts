import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {
  private apiUrl = `${environment.apiUrl}/api/soli-arquivos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtém a URL de autenticação do Google do backend
   */
  getAuthUrl(): Observable<string> {
    return this.http.get<{ authUrl: string }>(`${this.apiUrl}/auth-url`).pipe(
      map(response => response.authUrl),
      catchError((error) => {
        console.error('Error getting Google auth URL:', error);
        return throwError(() => new Error('Failed to get Google auth URL'));
      })
    );
  }

  /**
   * Verifica o status da conexão com o Google Drive
   */
  getConnectionStatus(): Observable<{ connected: boolean; message: string; userId: number }> {
    return this.http.get<{ connected: boolean; message: string; userId: number }>(`${this.apiUrl}/connection-status`).pipe(
      catchError((error) => {
        console.error('Error getting Google Drive connection status:', error);
        return throwError(() => new Error('Failed to get Google Drive connection status'));
      })
    );
  }
}