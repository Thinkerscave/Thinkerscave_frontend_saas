import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { OrganizationContextService } from '../services/organization-context.service';

/**
 * Ensures an organization or Thinkers Department is selected before login (dev only).
 * An `org` query param (sent in onboarding emails) selects that organization directly.
 */
export const orgSelectionGuard: CanActivateFn = (route) => {
  const orgContext = inject(OrganizationContextService);
  const router = inject(Router);

  if (!orgContext.requiresSelection) {
    return true;
  }

  const requestedOrgId = Number(route.queryParamMap.get('org'));
  if (requestedOrgId > 0) {
    return orgContext.loadOrganizations().pipe(
      map((orgs) => {
        const org = orgs.find((o) => o.id === requestedOrgId);
        if (!org) {
          return router.createUrlTree(['/auth/select-organization']);
        }
        orgContext.setSelectedOrganization(org);
        return true;
      })
    );
  }

  if (orgContext.hasLoginTarget()) {
    return true;
  }

  router.navigate(['/auth/select-organization']);
  return false;
};

/** Redirects to login when org selection is not required (production). */
export const orgSelectPageGuard: CanActivateFn = () => {
  const orgContext = inject(OrganizationContextService);
  const router = inject(Router);

  if (!orgContext.requiresSelection) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};
