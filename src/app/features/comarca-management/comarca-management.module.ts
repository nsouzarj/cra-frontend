import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Guards
import { AdminGuard } from '../../core/guards/admin.guard';

// Components
import { ComarcaListComponent } from './comarca-list/comarca-list.component';
import { ComarcaFormComponent } from './comarca-form/comarca-form.component';
import { ComarcaDetailComponent } from './comarca-detail/comarca-detail.component';

// Shared Modules
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { 
    path: '', 
    component: ComarcaListComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: 'nova', 
    component: ComarcaFormComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: ':id', 
    component: ComarcaDetailComponent,
    canActivate: [AdminGuard]
  },
  { 
    path: 'editar/:id', 
    component: ComarcaFormComponent,
    canActivate: [AdminGuard]
  }
];

@NgModule({
  declarations: [
    ComarcaListComponent,
    ComarcaFormComponent,
    ComarcaDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    HttpClientModule,
    // Angular Material Modules
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule,
    // Shared Modules
    SharedComponentsModule,
    SharedModule
  ]
})
export class ComarcaManagementModule { }