import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../../../core/services/login.service';
import { LoggerService } from '../../../core/services/logger.service';
import {
    FeeRole,
    FeePermission,
    hasPermission,
    hasAnyPermission
} from '../enums';

/**
 * Fee Permission Guard
 * 
 * Enforces role-based access control for fee management routes.
 * 
 * CRITICAL: This guard BLOCKS unauthorized access.
 * It does not merely warn - it PREVENTS navigation.
 */

/**
 * Guard factory for single permission check
 */
export function feePermissionGuard(requiredPermission: FeePermission): CanActivateFn {
    return (route, state) => {
        const loginService = inject(LoginService);
        const router = inject(Router);

        const user = loginService.getUser();
        if (!user) {
            router.navigate(['/auth/login']);
            return false;
        }

        const userRoles = resolveFeeRoles(user.roles as any[] || []);

        // Check if any of user's roles have the required permission
        const hasAccess = userRoles.some(role => {
            const feeRole = role as FeeRole;
            return hasPermission(feeRole, requiredPermission);
        });

        if (!hasAccess) {
            inject(LoggerService).warn(`Fee access denied: missing permission '${requiredPermission}'`);
            router.navigate(['/app'], {
                queryParams: {
                    error: 'access_denied',
                    reason: `Required permission: ${requiredPermission}`
                }
            });
            return false;
        }

        return true;
    };
}

/**
 * Guard factory for multiple permissions (ANY)
 */
export function feeAnyPermissionGuard(requiredPermissions: FeePermission[]): CanActivateFn {
    return (route, state) => {
        const loginService = inject(LoginService);
        const router = inject(Router);

        const user = loginService.getUser();
        if (!user) {
            router.navigate(['/auth/login']);
            return false;
        }

        const userRoles = resolveFeeRoles(user.roles as any[] || []);

        // Check if any of user's roles have ANY of the required permissions
        const hasAccess = userRoles.some(role => {
            const feeRole = role as FeeRole;
            return hasAnyPermission(feeRole, requiredPermissions);
        });

        if (!hasAccess) {
            inject(LoggerService).warn(`Fee access denied: missing any of permissions: ${requiredPermissions.join(', ')}`);
            router.navigate(['/app'], {
                queryParams: {
                    error: 'access_denied',
                    reason: `Required permissions: ${requiredPermissions.join(' or ')}`
                }
            });
            return false;
        }

        return true;
    };
}

/**
 * Guard factory for role-based access
 */
export function feeRoleGuard(allowedRoles: FeeRole[]): CanActivateFn {
    return (route, state) => {
        const loginService = inject(LoginService);
        const router = inject(Router);

        const user = loginService.getUser();
        if (!user) {
            router.navigate(['/auth/login']);
            return false;
        }

        const userRoles = resolveFeeRoles(user.roles as any[] || []);

        // Check if user has any of the allowed roles
        const hasRole = userRoles.some(role =>
            allowedRoles.includes(role as FeeRole)
        );

        if (!hasRole) {
            inject(LoggerService).warn(`Fee access denied: role not in allowed list: ${allowedRoles.join(', ')}`);
            router.navigate(['/app'], {
                queryParams: {
                    error: 'access_denied',
                    reason: `Required role: ${allowedRoles.join(' or ')}`
                }
            });
            return false;
        }

        return true;
    };
}

function resolveFeeRoles(roles: any[]): FeeRole[] {
    const resolved = new Set<FeeRole>();

    roles.forEach(role => {
        const roleCode = (role?.roleCode ?? role?.roleName ?? role ?? '').toString().trim().toUpperCase();
        const normalized = roleCode.replace(/^ROLE_/, '').replace(/\s+/g, '_');

        if (normalized === 'ADMIN') {
            resolved.add(FeeRole.INSTITUTION_ADMIN);
        }

        if (normalized === 'SUPER_ADMIN') {
            resolved.add(FeeRole.SUPER_ADMIN);
            resolved.add(FeeRole.INSTITUTION_ADMIN);
        }

        if (normalized === 'ACCOUNTANT') {
            resolved.add(FeeRole.ACCOUNTANT);
        }

        if (normalized === 'PARENT') {
            resolved.add(FeeRole.PARENT);
        }

        if (normalized === 'GUARDIAN') {
            resolved.add(FeeRole.GUARDIAN);
        }

        if (normalized === 'STUDENT') {
            resolved.add(FeeRole.STUDENT);
        }

        if (Object.values(FeeRole).includes(normalized as FeeRole)) {
            resolved.add(normalized as FeeRole);
        }
    });

    return Array.from(resolved);
}

// ============================================
// PRE-DEFINED GUARDS FOR COMMON SCENARIOS
// ============================================

/**
 * Guard: Fee Dashboard Access
 * Allowed: All fee roles except Student (student has limited view)
 */
export const canAccessFeeDashboard: CanActivateFn = feeAnyPermissionGuard([
    'VIEW_DASHBOARD',
    'VIEW_FEE_DETAILS'
]);

/**
 * Guard: Fee Configuration Access
 * Allowed: Institution Admin only
 */
export const canConfigureFees: CanActivateFn = feeRoleGuard([
    FeeRole.INSTITUTION_ADMIN
]);

/**
 * Guard: Payment Collection Access
 * Allowed: Accountant, Finance Officer, Front Desk, Cashier
 */
export const canCollectPayment: CanActivateFn = feePermissionGuard('COLLECT_PAYMENT');

/**
 * Guard: Online Payment Access
 * Allowed: Parent, Guardian
 */
export const canMakeOnlinePayment: CanActivateFn = feePermissionGuard('MAKE_ONLINE_PAYMENT');

/**
 * Guard: Adjustment Creation
 * Allowed: Accountant, Finance Officer
 */
export const canCreateAdjustment: CanActivateFn = feePermissionGuard('CREATE_ADJUSTMENT');

/**
 * Guard: Adjustment Approval
 * Allowed: Accountant, Finance Officer
 */
export const canApproveAdjustment: CanActivateFn = feePermissionGuard('APPROVE_ADJUSTMENT');

/**
 * Guard: View Reports
 * Allowed: Owner, Admin, Accountant, Finance Officer, Super Admin
 */
export const canViewReports: CanActivateFn = feePermissionGuard('VIEW_REPORTS');

/**
 * Guard: View Audit Logs
 * Allowed: Super Admin, Auditor
 */
export const canViewAuditLogs: CanActivateFn = feePermissionGuard('VIEW_AUDIT_LOGS');

/**
 * Guard: Ledger Access (Read-only)
 * Allowed: All roles with VIEW_LEDGER permission
 */
export const canViewLedger: CanActivateFn = feePermissionGuard('VIEW_LEDGER');

/**
 * Guard: Contract Generation
 * Allowed: Institution Admin only
 */
export const canGenerateContracts: CanActivateFn = feePermissionGuard('GENERATE_CONTRACTS');
