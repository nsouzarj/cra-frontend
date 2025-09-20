import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { ExternalStorageService } from './external-storage.service';
import { ExternalStorageAuthDialogComponent } from '../../features/auth/external-storage/external-storage-auth-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ExternalStorageAuthGuardService {
  
  constructor(
    private externalStorageService: ExternalStorageService,
    private dialog: MatDialog
  ) { }

  // Check authentication and show dialog if needed
  checkAuthentication(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.externalStorageService.isAuthenticated().subscribe({
        next: (isAuthenticated) => {
          if (isAuthenticated) {
            // Already authenticated, proceed
            observer.next(true);
            observer.complete();
          } else {
            // Not authenticated, show dialog
            this.showAuthDialog().subscribe({
              next: (result) => {
                observer.next(result);
                observer.complete();
              }
            });
          }
        },
        error: (error) => {
          console.error('Error checking authentication:', error);
          // Show dialog on error as well
          this.showAuthDialog().subscribe({
            next: (result) => {
              observer.next(result);
              observer.complete();
            }
          });
        }
      });
    });
  }

  // Show authentication dialog
  private showAuthDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(ExternalStorageAuthDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {}
    });

    return dialogRef.afterClosed();
  }
}