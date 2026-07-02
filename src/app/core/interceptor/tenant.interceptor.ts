import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from '../../core/services/login.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';

/**
 * Adds X-Tenant-ID and X-Organization-ID headers to outgoing requests.
 */
export const tenantInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const loginService = inject(LoginService);
  const orgContext = inject(OrganizationContextService);

  const tenantId = loginService.isLoggedIn()
    ? loginService.getTenant()
    : orgContext.resolveTenantId();
  const orgId = loginService.getCurrentOrganizationId() ?? orgContext.resolveOrganizationId();

  let headers = req.headers.set('X-Tenant-ID', tenantId || '');

  if (orgId) {
    headers = headers.set('X-Organization-ID', orgId);
  }

  return next(req.clone({ headers }));
};

