import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  roles?: string[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {
  currentRoute = '';
  
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] // Only Admins and Lawyers use main dashboard
    },
    {
      label: 'Meu Dashboard',
      icon: 'dashboard',
      route: '/correspondent-dashboard',
      roles: ['ROLE_CORRESPONDENTE'] // Only Correspondents can access their dashboard
    },
    {
      label: 'Usuários',
      icon: 'people',
      route: '/usuarios',
      roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO']
    },
    {
      label: 'Correspondentes',
      icon: 'business',
      children: [
        {
          label: 'Listar',
          icon: 'list',
          route: '/correspondentes'
        },
        {
          label: 'Cadastrar',
          icon: 'add',
          route: '/correspondentes/novo'
        }
      ],
      roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] // Only Admins and Lawyers can manage correspondents
    },
    {
      label: 'Processos',
      icon: 'folder',
      children: [
        {
          label: 'Listar',
          icon: 'list',
          route: '/processos'
        },
        {
          label: 'Cadastrar',
          icon: 'add',
          route: '/processos/novo'
        }
      ],
      roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] // Only Admins and Lawyers can manage processes
    },
    {
      label: 'Solicitações',
      icon: 'assignment',
      children: [
        {
          label: 'Todas',
          icon: 'list',
          route: '/solicitacoes',
          roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] 
        },
        {
          label: 'Minhas Solicitações',
          icon: 'assignment_ind',
          route: '/minhas-solicitacoes',
          roles: ['ROLE_CORRESPONDENTE'] // Only Correspondents can view their own requests
        },
        {
          label: 'Criar Nova',
          icon: 'add',
          route: '/solicitacoes/novo',
          roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] // Only Admins and Lawyers can create
        },
        {
          label: 'Pendentes',
          icon: 'pending',
          route: '/solicitacoes/pendentes',
          roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] // Only Admins and Lawyers can view pending
        }
      ]
    },
    {
      label: 'Relatórios',
      icon: 'analytics',
      children: [
        {
          label: 'Processos',
          icon: 'bar_chart',
          route: '/relatorios/processos'
        },
        {
          label: 'Solicitações',
          icon: 'pie_chart',
          route: '/relatorios/solicitacoes'
        }
      ],
      roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] // Only Admins and Lawyers can access reports
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Track current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.currentRoute = event.url;
        }
      });

    // Set initial expanded state based on current route
    this.setInitialExpansion();
  }

  hasPermission(roles?: string[]): boolean {
    // If no roles are specified, allow access to all users
    if (!roles || roles.length === 0) {
      return true;
    }
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated) {
      return false;
    }
    
    // Get user roles from the authenticated user
    const userRoles = this.authService.currentUserValue?.authorities || [];
    
    // Check if user has any of the required roles
    return roles.some(role => userRoles.includes(role));
  }

  toggleExpanded(item: MenuItem): void {
    item.expanded = !item.expanded;
  }

  private setInitialExpansion(): void {
    this.menuItems.forEach(item => {
      if (item.children) {
        item.expanded = item.children.some(child => 
          child.route && this.currentRoute.startsWith(child.route)
        );
      }
    });
  }
}