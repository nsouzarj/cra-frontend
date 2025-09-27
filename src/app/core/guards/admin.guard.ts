import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }

    if (this.authService.isAdmin()) {
      return true;
    }

    // User is not admin, redirect to unauthorized page
    this.router.navigate(['/unauthorized']);
    return false;
  }
}