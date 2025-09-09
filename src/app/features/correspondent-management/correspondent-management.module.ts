import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Angular Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// Components
import { CorrespondentListComponent } from './correspondent-list/correspondent-list.component';
import { CorrespondentFormComponent } from './correspondent-form/correspondent-form.component';
import { CorrespondentDetailComponent } from './correspondent-detail/correspondent-detail.component';

// Guards
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: CorrespondentListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'novo',
    component: CorrespondentFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'editar/:id',
    component: CorrespondentFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: ':id',
    component: CorrespondentDetailComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    CorrespondentListComponent,
    CorrespondentFormComponent,
    CorrespondentDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    
    // Angular Material
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatMenuModule,
    MatTabsModule,
    MatExpansionModule,
    MatAutocompleteModule
  ]
})
export class CorrespondentManagementModule { }