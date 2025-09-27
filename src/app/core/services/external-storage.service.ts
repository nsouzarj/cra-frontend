import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
   * @param returnUrl Optional return URL to be passed as state parameter
   */
  getAuthorizationUrl(returnUrl?: string): Observable<{ authorizationUrl: string }> {
    let url = `${this.apiUrl}/authorize`;
    
    // If we have a return URL, pass it as a query parameter
    if (returnUrl) {
      // Encode the return URL to make it safe for query parameters
      const encodedReturnUrl = encodeURIComponent(returnUrl);
      url += `?returnUrl=${encodedReturnUrl}`;
    }
    
    return this.http.get<{ authorizationUrl: string }>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error getting authorization URL:', error);
        // Log detailed error information
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        console.error('Error message:', error.message);
        return throwError(() => new Error('Failed to get authorization URL: ' + (error.error?.message || error.message)));
      })
    );
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): Observable<{ message: string; status: string }> {
    return this.http.get<{ message: string; status: string }>(`${this.apiUrl}/status`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error getting connection status:', error);
        // Log detailed error information
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        console.error('Error message:', error.message);
        return throwError(() => new Error('Failed to get connection status: ' + (error.error?.message || error.message)));
      }
    ));
  }

  /**
   * Check if user is authenticated with external storage
   */
  isAuthenticated(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.getConnectionStatus().subscribe({
        next: (response) => {
          const isAuthenticated = response.status === 'OK';
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
    return this.http.get<any>(`${this.apiUrl}/test`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error testing Google Drive connection:', error);
        // Log detailed error information
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        console.error('Error message:', error.message);
        return throwError(() => new Error('Failed to test Google Drive connection: ' + (error.error?.message || error.message)));
      })
    );
  }
}