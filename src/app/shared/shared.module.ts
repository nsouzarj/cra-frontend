import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HasPermissionDirective } from './directives/permission.directive';
import { PasswordResetDialogComponent } from './components/password-reset-dialog/password-reset-dialog.component';
import { RequestFilterComponent } from './components/request-filter/request-filter.component';
import { DateFormatService } from './services/date-format.service';
import { CorrespondenteService } from '../core/services/correspondente.service'; // Add this import

// Angular Material Modules needed for the password reset dialog
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
// Additional Material modules needed for the request filter
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HasPermissionDirective,
    PasswordResetDialogComponent,
    RequestFilterComponent,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    DateFormatService,
    CorrespondenteService // Add this provider
  ],
  exports: [
    HasPermissionDirective,
    PasswordResetDialogComponent,
    RequestFilterComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }