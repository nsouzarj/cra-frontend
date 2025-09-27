import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  
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

    const expectedRoles = route.data['expectedRoles'] as Array<string>;
    
    if (!expectedRoles || expectedRoles.length === 0) {
      return true; // No role requirement
    }

    const userRoles = this.authService.currentUserValue?.authorities || [];
    const hasRequiredRole = expectedRoles.some(role => userRoles.includes(role));

    if (hasRequiredRole) {
      return true;
    }

    // User doesn't have required role, redirect to unauthorized page
    this.router.navigate(['/unauthorized']);
    return false;
  }
}