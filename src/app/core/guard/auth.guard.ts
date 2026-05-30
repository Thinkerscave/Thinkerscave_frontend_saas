import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../../core/services/login.service';

/**
 * Functional auth guard that protects routes requiring authentication.
 * - Redirects unauthenticated users to the login page.
 * - Redirects first-time login users to the change-password screen.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const loginService = inject(LoginService);
    const router = inject(Router);

    if (!loginService.isLoggedIn()) {
        // Not authenticated — redirect to login
        router.navigate(['/auth/login']);
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
