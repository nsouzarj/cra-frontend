import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { ExternalStorageAuthComponent } from './external-storage-auth.component';
import { ExternalStorageAuthDialogComponent } from './external-storage-auth-dialog.component';
import { ExternalStorageUploadExampleComponent } from './external-storage-upload-example.component';
import { ExternalStorageDebugComponent } from './external-storage-debug.component';

@NgModule({
  declarations: [
    ExternalStorageAuthComponent,
    ExternalStorageAuthDialogComponent,
    ExternalStorageUploadExampleComponent,
    ExternalStorageDebugComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule
  ],
  exports: [
    ExternalStorageAuthComponent,
    ExternalStorageAuthDialogComponent,
    ExternalStorageUploadExampleComponent,
    ExternalStorageDebugComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ExternalStorageModule { }