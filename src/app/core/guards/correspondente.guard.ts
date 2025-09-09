import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to restrict access to correspondent-specific routes
 * Only users with ROLE_CORRESPONDENTE can access these routes
 */
@Injectable({
  providedIn: 'root'
})
export class CorrespondenteGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if user is authenticated and is a correspondent
    if (this.authService.isAuthenticated && this.authService.isCorrespondente()) {
      return true;
    }

    // If not authenticated or not a correspondent, redirect to unauthorized page
    this.router.navigate(['/unauthorized']);
    return false;
  }
}