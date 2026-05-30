import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../../core/services/login.service';

/**
 * Functional role guard that restricts routes to users with specific roles.
 *
 * Usage in routes:
 *   canActivate: [authGuard, roleGuard(['SUPER_ADMIN', 'ADMIN'])]
 *
 * Redirects unauthorised users to '/unauthorized'.
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
    const loginService = inject(LoginService);
    const router = inject(Router);

    const userRoles: string[] = (loginService.getUserRole() as any[])
        .map((r: any) => (r?.roleCode ?? r?.roleName ?? r ?? '').toString().trim());

    const hasRole = allowedRoles.some(required =>
        userRoles.some(userRole =>
            userRole === required || userRole === `ROLE_${required}` || `ROLE_${userRole}` === required
        )
    );

    if (!hasRole) {
        router.navigate(['/unauthorized']);
        return false;
    }

    return true;
};
