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
 * 403 is an authorization denial for an authenticated user. It must not
 * trigger token refresh or clear the active session.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const loginService = inject(LoginService);
  const token = loginService.getAccessToken();

  // Attach Bearer token to all non-refresh requests
  let authReq = req;
  if (token && !req.url.includes('/refreshToken')) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // 🚫 If refresh API itself fails — clear and redirect
      if (req.url.includes('/refreshToken')) {
        loginService.clearTokens();
        loginService.redirectToSessionExpired();
        return throwError(() => error);
      }

      // Public API calls and login endpoint — do not redirect to session-expired
      const isPublicApi = req.url.includes('/public/') || req.url.includes('/password/');
      if (error.status === 403) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        if (isPublicApi || req.url.includes('/login')) {
          return throwError(() => error);
        }

        // 🔵 First 401 triggers refresh
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          const refreshToken = loginService.getRefreshToken();
          if (!refreshToken) {
            loginService.clearTokens();
            loginService.redirectToSessionExpired();
            return throwError(() => error);
          }

          return loginService.refreshAccessToken(refreshToken).pipe(
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

        // 🟡 Other requests wait for refresh to complete then retry
        return refreshTokenSubject.pipe(
          filter(token => token !== null),
          take(1),
          switchMap(token =>
            next(
              req.clone({
                setHeaders: { Authorization: `Bearer ${token!}` }
              })
            )
          )
        );
      }

      return throwError(() => error);
    })
  );
};
