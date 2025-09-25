import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdvogadoGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(): boolean {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check if user is an advogado
    if (this.authService.isAdvogado()) {
      return true;
    }

    // User is not an advogado, redirect to unauthorized page
    this.router.navigate(['/unauthorized']);
    return false;
  }
}