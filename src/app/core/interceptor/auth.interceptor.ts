import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { LoginService } from '../../services/login.service';

let isRefreshing = false; // global flag to avoid multiple refresh attempts

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
      // 🚫 Skip refresh logic if this is the refreshToken call itself
      if (req.url.includes('/refreshToken')) {
        return throwError(() => error);
      }

      if ((error.status === 401 || error.status === 403) && !isRefreshing) {
        isRefreshing = true;

        const refreshToken = loginService.getRefreshToken();
        if (refreshToken) {
          return loginService.refreshAccessToken(refreshToken).pipe(
            switchMap((newToken: string) => {
              isRefreshing = false;

              // save the new token
              loginService.setAccessToken(newToken);

              // retry original request with new token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(retryReq);
            }),
            catchError(err => {
              isRefreshing = false;
              loginService.logOut();
              return throwError(() => err);
            })
          );
        } else {
          loginService.logOut();
        }
      }

      return throwError(() => error);
    })
  );
};
