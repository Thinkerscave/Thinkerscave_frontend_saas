import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginService } from '../../core/services/login.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Attaches the JWT Bearer token to every outgoing HTTP request.
 *
 * On 401:
 *   - Skips refresh for public/login endpoints
 *   - Triggers token refresh exactly once (concurrent requests queue and retry)
 *   - On refresh failure: clears tokens and redirects to session-expired
 *
 * Refresh uses HttpOnly cookie (withCredentials) when authUseHttpOnlyRefresh is true.
 *
 * 403 is an authorization denial for an authenticated user. It must not
 * trigger token refresh or clear the active session.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const loginService = inject(LoginService);
  const token = loginService.getAccessToken();

  let authReq = req;
  if (token && !req.url.includes('/auth/refresh')) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (req.url.includes('/auth/refresh')) {
        // Let the caller decide navigation. Bootstrap restoreSession() must
        // fail silently; mid-session refresh handlers redirect themselves.
        loginService.clearTokens();
        return throwError(() => error);
      }

      const isPublicApi = req.url.includes('/public/') || req.url.includes('/auth/forgot-password')
        || req.url.includes('/auth/verify-otp') || req.url.includes('/auth/reset-password');
      if (error.status === 403) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        if (
          isPublicApi
          || req.url.includes('/auth/login')
          || req.url.includes('/auth/logout')
          || req.url.includes('/auth/forgot-password')
        ) {
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          // Cookie mode: refresh cookie is sent automatically; no JS-held refresh token.
          if (!environment.authUseHttpOnlyRefresh && !loginService.getRefreshToken()) {
            isRefreshing = false;
            loginService.clearTokens();
            loginService.redirectToSessionExpired();
            return throwError(() => error);
          }

          return loginService.refreshAccessToken().pipe(
            switchMap((newToken: string) => {
              isRefreshing = false;
              loginService.setAccessToken(newToken);
              refreshTokenSubject.next(newToken);

              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                })
              );
            }),
            catchError(err => {
              isRefreshing = false;
              loginService.clearTokens();
              loginService.redirectToSessionExpired();
              return throwError(() => err);
            })
          );
        }

        return refreshTokenSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t =>
            next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${t!}` }
              })
            )
          )
        );
      }

      return throwError(() => error);
    })
  );
};
