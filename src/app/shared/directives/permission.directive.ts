import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

/**
 * Directive to show/hide elements based on user permissions
 * 
 * Usage:
 * <button *appHasPermission="['ROLE_ADMIN', 'ROLE_ADVOGADO']">Edit</button>
 * <div *appHasPermission="['ROLE_ADMIN']; requireAll: true">Only for admins</div>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  
  private isVisible = false;

  @Input() set appHasPermission(roles: string[]) {
    this.updateView(roles, this.appHasPermissionRequireAll);
  }

  @Input() set appHasPermissionRequireAll(requireAll: boolean) {
    this.updateView(this.appHasPermission, requireAll);
  }

  private updateView(roles: string[] = [], requireAll = false): void {
    let hasPermission = false;

    if (roles.length === 0) {
      // If no roles specified, show by default
      hasPermission = true;
    } else if (requireAll) {
      // User must have all specified roles
      hasPermission = this.authService.hasAllRoles(roles);
    } else {
      // User must have at least one of the specified roles
      hasPermission = this.authService.hasAnyRole(roles);
    }

    if (hasPermission && !this.isVisible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isVisible = true;
    } else if (!hasPermission && this.isVisible) {
      this.viewContainer.clear();
      this.isVisible = false;
    }
  }
}