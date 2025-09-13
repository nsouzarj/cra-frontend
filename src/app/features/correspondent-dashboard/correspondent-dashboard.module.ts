import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CorrespondentDashboardComponent } from './correspondent-dashboard.component';
import { CorrespondentDashboardSimpleComponent } from './correspondent-dashboard-simple.component';
import { CorrespondenteGuard } from '../../core/guards/correspondente.guard';
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';

const routes: Routes = [
  {
    path: '',
    component: CorrespondentDashboardSimpleComponent,
    canActivate: [CorrespondenteGuard]
  }
];

@NgModule({
  declarations: [
    CorrespondentDashboardComponent,
    CorrespondentDashboardSimpleComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [
    TipoSolicitacaoService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CorrespondentDashboardModule { }