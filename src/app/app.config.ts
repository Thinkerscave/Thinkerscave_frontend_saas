import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideAppInitializer, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tenantInterceptor } from './core/interceptor/tenant.interceptor';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { authInterceptor } from './core/interceptor/auth.interceptor';
import { httpErrorInterceptor } from './core/interceptor/http-error.interceptor';
import { MessageService } from 'primeng/api';
import { GlobalErrorHandler } from './core/error/global-error-handler';
import { GlobalSearchProvider } from './shared/components/global-search/global-search.provider';
import { ApplicationGlobalSearchProvider } from './application/services/application-global-search.provider';
import { LoginService } from './core/services/login.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      const loginService = inject(LoginService);
      return firstValueFrom(loginService.restoreSessionFromRefreshToken());
    }),
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
    // Core loader only. Feature flows such as login start/stop it explicitly;
    // route content uses local loading states so background HTTP activity cannot
    // mask the application shell with a stale full-screen overlay.
    importProvidersFrom(NgxUiLoaderModule),
    MessageService,
    { provide: GlobalSearchProvider, useClass: ApplicationGlobalSearchProvider },
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
