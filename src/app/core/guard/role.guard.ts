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

    const normalizeRole = (role: string): string => role
        .toString()
        .trim()
        .replace(/^ROLE_/i, '')
        .replace(/[\s-]+/g, '_')
        .toUpperCase();

    const rawRoles = loginService.getUserRole() as any;
    const roleList = Array.isArray(rawRoles) ? rawRoles : [rawRoles].filter(Boolean);

    const userRoles: string[] = roleList
        .flatMap((r: any) => [r?.roleCode, r?.roleName, r?.name, r])
        .filter(Boolean)
        .map((role: any) => normalizeRole(role));

    const normalizedAllowedRoles = allowedRoles.map(role => normalizeRole(role));

    const hasRole = normalizedAllowedRoles.some(required => userRoles.includes(required));

    if (!hasRole) {
        router.navigate(['/unauthorized']);
        return false;
    }

    return true;
};
