import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdvogadoDashboardComponent } from './advogado-dashboard.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: AdvogadoDashboardComponent,
    canActivate: [RoleGuard],
    data: { expectedRoles: ['ROLE_ADVOGADO'] }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AdvogadoDashboardComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdvogadoDashboardModule { }