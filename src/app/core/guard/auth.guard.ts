import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../../core/services/login.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';

/**
 * Functional auth guard that protects routes requiring authentication.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const loginService = inject(LoginService);
    const orgContext = inject(OrganizationContextService);
    const router = inject(Router);

    if (!loginService.isLoggedIn()) {
        const target = orgContext.requiresSelection
            ? ['/auth/select-organization']
            : ['/auth/login'];
        router.navigate(target);
        return false;
    }

    // Check if this is a first-time login — enforce password change
    const user = loginService.getUser();
    if (user?.firstTimeLogin) {
        // Allow access to the first-time-login route itself to avoid redirect loop
        if (state.url.includes('/auth/first-time-login')) {
            return true;
        }
        router.navigate(['/auth/first-time-login']);
        return false;
    }

    return true;
};
