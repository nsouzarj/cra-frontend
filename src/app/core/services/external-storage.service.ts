import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExternalStorageService {
  private apiUrl = `${environment.apiUrl}/api/google-drive`;

  constructor(private http: HttpClient) { }

  /**
   * Get the authorization URL
   */
  getAuthorizationUrl(): Observable<{ authorizationUrl: string }> {
    console.log('Calling getAuthorizationUrl endpoint');
    return this.http.get<{ authorizationUrl: string }>(`${this.apiUrl}/authorize`).pipe(
      tap(response => {
        console.log('Authorization URL response:', response);
        console.log('Authorization URL:', response.authorizationUrl);
      }),
      catchError((error) => {
        console.error('Error getting authorization URL:', error);
        return throwError(() => new Error('Failed to get authorization URL: ' + error.message));
      })
    );
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): Observable<{ message: string; status: string }> {
    console.log('Calling getConnectionStatus endpoint');
    return this.http.get<{ message: string; status: string }>(`${this.apiUrl}/status`).pipe(
      tap(response => {
        console.log('Connection status response:', response);
        console.log('Is connected:', response.status === 'OK');
      }),
      catchError((error) => {
        console.error('Error getting connection status:', error);
        return throwError(() => new Error('Failed to get connection status: ' + error.message));
      }
    ));
  }

  /**
   * Check if user is authenticated with external storage
   */
  isAuthenticated(): Observable<boolean> {
    console.log('Checking if user is authenticated');
    return new Observable<boolean>(observer => {
      this.getConnectionStatus().subscribe({
        next: (response) => {
          const isAuthenticated = response.status === 'OK';
          console.log('isAuthenticated check result:', isAuthenticated, response);
          observer.next(isAuthenticated);
          observer.complete();
        },
        error: (error) => {
          console.error('Error checking authentication status:', error);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }
  
  /**
   * Test Google Drive connection by trying to list files
   */
  testConnection(): Observable<any> {
    console.log('Testing Google Drive connection');
    return this.http.get(`${this.apiUrl}/files`).pipe(
      tap(response => console.log('Test connection response:', response)),
      catchError((error) => {
        console.error('Error testing connection:', error);
        return throwError(() => new Error('Failed to test connection: ' + error.message));
      })
    );
  }
}