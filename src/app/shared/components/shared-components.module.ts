import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltip } from "@angular/material/tooltip";

// Components - Import standalone components
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { ObservationDialogComponent } from './observation-dialog/observation-dialog.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidenavComponent } from './layout/sidenav/sidenav.component';
import { ThemeTestComponent } from '../../theme-test.component';
import { ThemeDebugComponent } from '../../theme-debug.component';
import { ThemeTroubleshootComponent } from '../../theme-troubleshoot.component';
import { ThemeQuickTestComponent } from '../../theme-quick-test.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    // Import standalone components
    UnauthorizedComponent,
    NotFoundComponent,
    ConfirmationDialogComponent,
    ObservationDialogComponent,
    HeaderComponent,
    SidenavComponent,
    ThemeTestComponent,
    ThemeDebugComponent,
    ThemeTroubleshootComponent,
    ThemeQuickTestComponent,
    // Angular Material Modules
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltip
  ],
  exports: [
    UnauthorizedComponent,
    NotFoundComponent,
    ConfirmationDialogComponent,
    ObservationDialogComponent,
    HeaderComponent,
    SidenavComponent,
    ThemeTestComponent,
    ThemeDebugComponent,
    ThemeTroubleshootComponent,
    ThemeQuickTestComponent,
    // Angular Material Modules
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatSelectModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltip
  ]
})
export class SharedComponentsModule { }