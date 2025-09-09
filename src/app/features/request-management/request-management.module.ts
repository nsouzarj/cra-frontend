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
import { MatDialogModule } from '@angular/material/dialog'; // Added MatDialogModule

// Components
import { RequestListComponent } from './request-list/request-list.component';
import { RequestFormComponent } from './request-form/request-form.component';
import { RequestDetailComponent } from './request-detail/request-detail.component';

// Services
import { TipoSolicitacaoService } from '../../core/services/tiposolicitacao.service';
import { ProcessoService } from '../../core/services/processo.service';
import { ComarcaService } from '../../core/services/comarca.service';
import { OrgaoService } from '../../core/services/orgao.service';

// Guards
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: RequestListComponent, canActivate: [AuthGuard] },
  { path: 'novo', component: RequestFormComponent, canActivate: [AuthGuard] },
  { path: 'editar/:id', component: RequestFormComponent, canActivate: [AuthGuard] },
  { path: 'visualizar/:id', component: RequestDetailComponent, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [
    RequestListComponent,
    RequestFormComponent,
    RequestDetailComponent
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
    MatDialogModule // Added MatDialogModule
  ],
  providers: [
    TipoSolicitacaoService,
    ProcessoService,
    ComarcaService,
    OrgaoService
  ]
})
export class RequestManagementModule { }