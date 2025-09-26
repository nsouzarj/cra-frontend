import { Component, OnInit, HostListener } from '@angular/core';
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
  isMobile: boolean = false;
  currentRoute = '';
  
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] // Admins and Lawyers use main dashboard
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
      label: 'Comarcas',
      icon: 'location_city',
      children: [
        {
          label: 'Listar',
          icon: 'list',
          route: '/comarcas'
        },
        {
          label: 'Cadastrar',
          icon: 'add',
          route: '/comarcas/nova'
        }
      ],
      roles: ['ROLE_ADMIN'] // Only Admins can manage comarcas
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
    // Check screen size on init
    this.checkScreenSize();
    
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
    
    // Listen for theme changes
    window.addEventListener('themeChanged', (event: Event) => {
      const customEvent = event as CustomEvent;
      // The theme styles are applied to the body, so the sidenav will automatically update
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }
  
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
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
    const hasRolePermission = roles.some(role => userRoles.includes(role));
    
    // Special handling for correspondent role - also check user type
    if (roles.includes('ROLE_CORRESPONDENTE')) {
      const isCorrespondentType = this.authService.currentUserValue?.tipo === 3; // UserType.CORRESPONDENTE
      if (isCorrespondentType) {
        return true;
      }
    }
    
    return hasRolePermission;
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
  
  logout(): void {
    this.authService.logout();
  }
}