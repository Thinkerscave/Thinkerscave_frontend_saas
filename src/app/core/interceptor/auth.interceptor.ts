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
import { LoginService } from '../../services/login.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const loginService = inject(LoginService);
  const token = loginService.getAccessToken();

  let authReq = req;
  if (token && !req.url.includes('/refreshToken')) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // 🚫 If refresh API itself fails
      if (req.url.includes('/refreshToken')) {
        loginService.clearTokens();
        loginService.redirectToSessionExpired();
        return throwError(() => error);
      }

      if (error.status === 401 || error.status === 403) {

        // 🔵 First request triggers refresh
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

        // 🟡 Other requests WAIT here
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
