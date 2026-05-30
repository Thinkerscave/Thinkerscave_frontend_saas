import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { finalize, Observable } from 'rxjs';
import { LoginService } from '../../core/services/login.service';

/**
 * A functional HTTP interceptor that adds the X-Tenant-ID header to outgoing requests.
 * @param req The outgoing request object to handle.
 * @param next The next interceptor in the chain, or the backend if no others remain.
 * @returns An Observable of the event stream.
 */
export const tenantInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const loader = inject(NgxUiLoaderService);
  const loginService = inject(LoginService);

  // Start loader
  loader.start();

  // Get tenant ID from current user context
  const tenantId = loginService.getTenant();
  const orgId = loginService.getCurrentOrganizationId();

  // Clone the request to add the new header.
  let headers = req.headers.set('X-Tenant-ID', tenantId || ''); // Should we send 'public' or empty? existing code sent tenantId.toString()

  if (orgId) {
    headers = headers.set('X-Organization-ID', orgId);
  }

  const modifiedRequest = req.clone({
    headers: headers
  });

  // Pass the cloned request to the next handler in the chain.
  return next(modifiedRequest).pipe(
    finalize(() => loader.stop())
  );
};

