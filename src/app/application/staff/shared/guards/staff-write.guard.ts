import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../../../../core/services/permission.service';
import { canWriteStaff } from '../permissions/staff-permissions';

/**
 * Blocks create and edit routes for view-only users.
 * Permissions not yet loaded are allowed through; the backend still enforces access.
 */
export const staffWriteGuard: CanActivateFn = () => {
  const permissions = inject(PermissionService);
  if (!permissions.isLoaded() || canWriteStaff(permissions)) {
    return true;
  }
  return inject(Router).createUrlTree(['/app/staff/directory']);
};
