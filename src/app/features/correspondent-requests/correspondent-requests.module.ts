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
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';

// Components
import { CorrespondentRequestsComponent } from './correspondent-requests.component';
import { CorrespondentRequestDetailComponent } from './correspondent-request-detail/correspondent-request-detail.component';

// Services
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';

// Guards
import { CorrespondenteGuard } from '../../core/guards/correspondente.guard';

// External Storage Module
import { ExternalStorageModule } from '../auth/external-storage/external-storage.module';

// Shared Module for RequestFilterComponent
import { SharedModule } from '../../shared/shared.module';

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
    MatDialogModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatRadioModule,
    // External Storage Module
    ExternalStorageModule,
    // Shared Module for RequestFilterComponent
    SharedModule
  ],
  providers: [
    TipoSolicitacaoService,
    // Add ComarcaService to providers
    // Note: ComarcaService is provided in 'root' so it's not strictly necessary here
  ]
})
export class CorrespondentRequestsModule { }