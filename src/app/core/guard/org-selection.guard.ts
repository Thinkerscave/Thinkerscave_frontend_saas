import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OrganizationContextService } from '../services/organization-context.service';

/** Ensures an organization is selected before showing the login form (dev only). */
export const orgSelectionGuard: CanActivateFn = () => {
  const orgContext = inject(OrganizationContextService);
  const router = inject(Router);

  if (!orgContext.requiresSelection) {
    return true;
  }

  if (orgContext.getSelectedOrganization()) {
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
