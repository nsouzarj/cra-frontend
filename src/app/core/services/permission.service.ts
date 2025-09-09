import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../../shared/models/user.model';

/**
 * Service for handling complex permission logic in the CRA system
 * Provides methods to check permissions for various actions and UI elements
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  
  constructor(private authService: AuthService) { }

  /**
   * Check if user can edit requests
   */
  public canEditRequests(): boolean {
    return this.authService.isAdminUser || this.authService.isAdvogadoUser;
  }

  /**
   * Check if user can delete requests
   */
  public canDeleteRequests(): boolean {
    return this.authService.isAdminUser;
  }

  /**
   * Check if user can create requests
   */
  public canCreateRequests(): boolean {
    return this.authService.isAdminUser || this.authService.isAdvogadoUser;
  }

  /**
   * Check if user can view all requests
   */
  public canViewAllRequests(): boolean {
    return this.authService.isAdminUser || this.authService.isAdvogadoUser;
  }

  /**
   * Check if user can assign requests
   */
  public canAssignRequests(): boolean {
    return this.authService.isAdminUser;
  }

  /**
   * Check if user can view reports
   */
  public canViewReports(): boolean {
    return this.authService.isAdminUser;
  }

  /**
   * Check if user can manage users
   */
  public canManageUsers(): boolean {
    return this.authService.isAdminUser;
  }

  /**
   * Check if user can manage correspondents
   */
  public canManageCorrespondents(): boolean {
    return this.authService.isAdminUser || this.authService.isAdvogadoUser;
  }

  /**
   * Generic method to check if user has specific permissions
   * @param permissions Array of permission strings to check
   * @param requireAll If true, user must have all permissions; if false, any permission is sufficient
   */
  public hasPermissions(permissions: string[], requireAll: boolean = false): boolean {
    if (requireAll) {
      return this.authService.hasAllRoles(permissions);
    } else {
      return this.authService.hasAnyRole(permissions);
    }
  }

  /**
   * Get user role as a string
   */
  public getUserRole(): string | null {
    return this.authService.userRole;
  }

  /**
   * Check if user has a specific role
   * @param role Role to check
   */
  public hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
}