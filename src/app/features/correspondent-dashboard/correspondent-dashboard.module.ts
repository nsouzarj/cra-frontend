import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CorrespondentDashboardComponent } from './correspondent-dashboard.component';
import { CorrespondenteGuard } from '../../core/guards/correspondente.guard';

const routes: Routes = [
  {
    path: '',
    component: CorrespondentDashboardComponent,
    canActivate: [CorrespondenteGuard]
  }
];

@NgModule({
  declarations: [
    CorrespondentDashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class CorrespondentDashboardModule { }