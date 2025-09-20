import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { CorrespondenteGuard } from './core/guards/correspondente.guard';

// Components
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard.component';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { ProfileComponent } from './features/auth/profile/profile.component';
import { ThemeTestComponent } from './theme-test.component'; // Added ThemeTestComponent
import { ThemeDebugComponent } from './theme-debug.component'; // Added ThemeDebugComponent
import { ThemeTroubleshootComponent } from './theme-troubleshoot.component'; // Added ThemeTroubleshootComponent
import { ThemeQuickTestComponent } from './theme-quick-test.component'; // Added ThemeQuickTestComponent
import { ExternalStorageDebugComponent } from './features/auth/external-storage/external-storage-debug.component'; // Added ExternalStorageDebugComponent

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'register', 
    component: RegisterComponent, 
    canActivate: [AdminGuard],
    data: { expectedRoles: ['ROLE_ADMIN'] }
  },
  { 
    path: 'dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [AuthGuard],
    data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] }
  },
  {
    path: 'correspondent-dashboard',
    loadChildren: () => import('./features/correspondent-dashboard/correspondent-dashboard.module').then(m => m.CorrespondentDashboardModule),
    canActivate: [CorrespondenteGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'usuarios',
    loadChildren: () => import('./features/user-management/user-management.module').then(m => m.UserManagementModule),
    canActivate: [RoleGuard],
    data: { expectedRoles: ['ROLE_ADMIN', 'ROLE_ADVOGADO'] }
  },
  {
    path: 'correspondentes',
    loadChildren: () => import('./features/correspondent-management/correspondent-management.module').then(m => m.CorrespondentManagementModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'processos',
    loadChildren: () => import('./features/process-management/process-management.module').then(m => m.ProcessManagementModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'solicitacoes',
    loadChildren: () => import('./features/request-management/request-management.module').then(m => m.RequestManagementModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'minhas-solicitacoes',
    loadChildren: () => import('./features/correspondent-requests/correspondent-requests.module').then(m => m.CorrespondentRequestsModule),
    canActivate: [CorrespondenteGuard]
  },
  {
    path: 'comarcas',
    loadChildren: () => import('./features/comarca-management/comarca-management.module').then(m => m.ComarcaManagementModule),
    canActivate: [AuthGuard]
  },
  { path: 'theme-test', component: ThemeTestComponent }, // Added theme test route
  { path: 'theme-debug', component: ThemeDebugComponent }, // Added theme debug route
  { path: 'theme-troubleshoot', component: ThemeTroubleshootComponent }, // Added theme troubleshoot route
  { path: 'theme-quick-test', component: ThemeQuickTestComponent }, // Added theme quick test route
  { path: 'external-storage-debug', component: ExternalStorageDebugComponent }, // Added external storage debug route
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Set to true for debugging
    useHash: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }