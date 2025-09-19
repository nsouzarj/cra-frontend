import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { GoogleDriveStatusComponent } from './google-drive-status.component';
import { MatButtonModule } from '@angular/material/button';

// Rotas do módulo Google Drive
const routes: Routes = [
  { path: '', component: GoogleDriveStatusComponent }
];

@NgModule({
  declarations: [
    GoogleDriveStatusComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatButtonModule
  ]
})
export class GoogleDriveModule { }