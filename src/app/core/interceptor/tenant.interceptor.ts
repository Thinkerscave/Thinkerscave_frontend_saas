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

  // Public organization list must always be fetched from the public tenant context.
  // Otherwise, returning via "Change Institution" can leak the previously selected tenant
  // and produce empty/incorrect results.
  const isPublicOrganizationsRequest =
    req.url.includes('/public/organizations') ||
    req.url.includes('/auth/organizations') ||
    req.url.includes('/public/subscription-plans');

  if (isPublicOrganizationsRequest) {
    const headers = req.headers
      .set('X-Tenant-ID', 'public')
      .set('X-Login-Context', 'TENANT')
      .delete('X-Organization-ID');

    return next(req.clone({ headers }));
  }

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
