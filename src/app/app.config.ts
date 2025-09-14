import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { tenantInterceptor } from './core/interceptor/tenant.interceptor';
import { NgxUiLoaderHttpModule, NgxUiLoaderModule } from 'ngx-ui-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([tenantInterceptor])
    ),

    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    importProvidersFrom(
      NgxUiLoaderModule, // core loader
      NgxUiLoaderHttpModule.forRoot({ showForeground: true }) // auto show on HTTP
    )
  ]
};
