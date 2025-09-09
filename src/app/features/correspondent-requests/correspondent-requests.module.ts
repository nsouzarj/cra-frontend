import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatDatepickerModule } from '@angular/material/datepicker';

// Angular Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';

// Components
import { CorrespondentRequestsComponent } from './correspondent-requests.component';
import { CorrespondentRequestDetailComponent } from './correspondent-request-detail/correspondent-request-detail.component';

// Services
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';

// Guards
import { CorrespondenteGuard } from '../../core/guards/correspondente.guard';

const routes: Routes = [
  { path: '', component: CorrespondentRequestsComponent, canActivate: [CorrespondenteGuard] },
  { path: 'visualizar/:id', component: CorrespondentRequestDetailComponent, canActivate: [CorrespondenteGuard] }
];

@NgModule({
  declarations: [
    CorrespondentRequestsComponent,
    CorrespondentRequestDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule
  ],
  providers: [
    TipoSolicitacaoService
  ]
})
export class CorrespondentRequestsModule { }