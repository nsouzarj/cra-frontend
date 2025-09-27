import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { AppModule } from './app/app.module';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import { SharedModule } from './app/shared/shared.module';
import { SharedComponentsModule } from './app/shared/components/shared-components.module';

// Interceptors
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { ErrorHandlingInterceptor } from './app/core/interceptors/error-handling.interceptor';
import { GoogleDriveInterceptor } from './app/core/interceptors/google-drive-interceptor.service';

// Services
import { PaginatorI18nService } from './app/shared/services/paginator-i18n.service';

// Localization
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserAnimationsModule,
      HttpClientModule,
      ReactiveFormsModule,
      FormsModule,
      AppRoutingModule,
      SharedModule,
      SharedComponentsModule
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlingInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GoogleDriveInterceptor,
      multi: true
    },
    {
      provide: PaginatorI18nService,
      useClass: PaginatorI18nService
    },
    {
      provide: LOCALE_ID,
      useValue: 'pt-BR'
    }
  ]
}).catch(err => console.error(err));