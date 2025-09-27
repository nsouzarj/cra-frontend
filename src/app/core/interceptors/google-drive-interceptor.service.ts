import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class GoogleDriveInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if this is a Google Drive callback request
    if (req.url.includes('google-drive') && req.url.includes('callback')) {
      return next.handle(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            // Check if the response contains the Google Drive auth success pattern
            if (event.body && 
                typeof event.body === 'object' && 
                'access_token_received' in event.body && 
                'refresh_token_received' in event.body) {
              // This is a Google Drive auth success response
              // We could handle it here if needed
            }
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Google Drive callback error:', error);
          return throwError(() => error);
        })
      );
    }
    
    // Also check for Google Drive authorization URL responses
    if (req.url.includes('google-drive') && req.url.includes('authorize')) {
      return next.handle(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Google Drive authorization URL error:', error);
          // Check if this is the UNAVAILABLE response
          if (error.status === 400 && error.error && typeof error.error === 'object' && error.error.status === 'UNAVAILABLE') {
          }
          return throwError(() => error);
        })
      );
    }
    
    // Also check for Google Drive status responses
    if (req.url.includes('google-drive') && req.url.includes('status')) {
      return next.handle(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Google Drive status error:', error);
          return throwError(() => error);
        })
      );
    }
    
    return next.handle(req);
  }
}