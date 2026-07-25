import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginService } from '../../core/services/login.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';

/**
 * Adds tenant, organization, and login-context headers to outgoing requests.
 */
export const tenantInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const loginService = inject(LoginService);
  const orgContext = inject(OrganizationContextService);

  const tenantId = loginService.isLoggedIn()
    ? loginService.getTenant()
    : orgContext.resolveTenantId();
  const rawOrgId = loginService.getCurrentOrganizationId() ?? orgContext.resolveOrganizationId();
  // Never send "0" — it is a frontend missing-org sentinel, not a real organization.
  const orgId = loginService.toPositiveOrgId(rawOrgId);
  const loginContext = loginService.isLoggedIn()
    ? loginService.getLoginContext()
    : orgContext.resolveLoginContext();

  let headers = req.headers
    .set('X-Tenant-ID', tenantId || '')
    .set('X-Login-Context', loginContext);

  if (orgId) {
    headers = headers.set('X-Organization-ID', String(orgId));
  }

  return next(req.clone({ headers }));
};
