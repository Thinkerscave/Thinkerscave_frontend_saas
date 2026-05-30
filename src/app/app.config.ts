import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { tenantInterceptor } from './core/interceptor/tenant.interceptor';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { httpErrorInterceptor } from './core/interceptor/http-error.interceptor';
import { MessageService } from 'primeng/api';
import { GlobalErrorHandler } from './core/error/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([
        tenantInterceptor,
        authInterceptor,
        httpErrorInterceptor
      ])
    ),

    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.tc-theme-dark'
        }
      }
    }),
    // Core loader only. The HTTP module is intentionally NOT registered here —
    // tenantInterceptor already calls loader.start()/stop() per request, so
    // registering NgxUiLoaderHttpModule too would double-count and the loader
    // overlay can get stuck when navigation cancels an in-flight request
    // (only one of the two trackers observes the cancellation).
    importProvidersFrom(NgxUiLoaderModule),
    MessageService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
