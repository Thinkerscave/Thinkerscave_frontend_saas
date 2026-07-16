import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoggerService } from '../../../core/services/logger.service';
import { FeeLifecycleService, FeeLifecycleStage, SetupSubStage } from '../services/fee-lifecycle.service';

/**
 * Fee Lifecycle Guard
 * 
 * Enforces the canonical fee lifecycle order.
 * Prevents navigation to stages that require completion of prior stages.
 */

/**
 * Guard factory for lifecycle stage access
 */
export function feeLifecycleGuard(requiredStage: FeeLifecycleStage): CanActivateFn {
    return (route, state) => {
        const lifecycleService = inject(FeeLifecycleService);
        const router = inject(Router);

        const validation = lifecycleService.validateStageAccess(requiredStage);

        if (!validation.isValid) {
            inject(LoggerService).warn(validation.message);

            // Redirect to appropriate stage
            const redirectRoute = getStageRoute(validation.currentStage);
            router.navigate([redirectRoute], {
                queryParams: {
                    error: 'lifecycle_violation',
                    message: validation.message,
                    missing: validation.missingPrerequisites.join(',')
                }
            });
            return false;
        }

        return true;
    };
}

/**
 * Guard factory for setup sub-stage access
 */
export function feeSetupGuard(requiredSubStage: SetupSubStage): CanActivateFn {
    return (route, state) => {
        const lifecycleService = inject(FeeLifecycleService);
        const router = inject(Router);

        const validation = lifecycleService.validateSetupAccess(requiredSubStage);

        if (!validation.isValid) {
            inject(LoggerService).warn(validation.message);

            // Redirect to the first incomplete stage
            const firstMissing = validation.missingPrerequisites[0] as SetupSubStage;
            const redirectRoute = getSetupStageRoute(firstMissing);
            router.navigate([redirectRoute], {
                queryParams: {
                    error: 'setup_incomplete',
                    message: validation.message,
                    missing: validation.missingPrerequisites.join(',')
                }
            });
            return false;
        }

        return true;
    };
}

/**
 * Get route for a lifecycle stage
 */
function getStageRoute(stage: FeeLifecycleStage): string {
    const routes: Record<FeeLifecycleStage, string> = {
        [FeeLifecycleStage.SETUP]: '/app/fees/setup',
        [FeeLifecycleStage.CONTRACT]: '/app/fees/contracts',
        [FeeLifecycleStage.LEDGER]: '/app/fees/ledger',
        [FeeLifecycleStage.PAYMENT]: '/app/fees/payments',
        [FeeLifecycleStage.ADJUSTMENT]: '/app/fees/adjustments',
        [FeeLifecycleStage.CONTROLS]: '/app/fees/controls',
        [FeeLifecycleStage.REPORTS]: '/app/fees/reports',
        [FeeLifecycleStage.AUDIT]: '/app/fees/audit'
    };
    return routes[stage] || '/app/fees';
}

/**
 * Get route for a setup sub-stage
 */
function getSetupStageRoute(subStage: SetupSubStage): string {
    const routes: Record<SetupSubStage, string> = {
        [SetupSubStage.ACADEMIC_SESSION]: '/app/fees/setup/session',
        [SetupSubStage.FEE_POLICY]: '/app/fees/setup/policy',
        [SetupSubStage.FEE_HEADS]: '/app/fees/setup/heads',
        [SetupSubStage.FEE_GROUPS]: '/app/fees/setup/groups',
        [SetupSubStage.FEE_STRUCTURE]: '/app/fees/setup/structure'
    };
    return routes[subStage] || '/app/fees/setup';
}

// ============================================
// PRE-DEFINED LIFECYCLE GUARDS
// ============================================

/**
 * Guard: Setup Stage Access
 */
export const canAccessSetup: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.SETUP);

/**
 * Guard: Contract Stage Access
 */
export const canAccessContracts: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.CONTRACT);

/**
 * Guard: Ledger Stage Access
 */
export const canAccessLedger: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.LEDGER);

/**
 * Guard: Payment Stage Access
 */
export const canAccessPayments: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.PAYMENT);

/**
 * Guard: Adjustment Stage Access
 */
export const canAccessAdjustments: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.ADJUSTMENT);

/**
 * Guard: Controls Stage Access
 */
export const canAccessControls: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.CONTROLS);

/**
 * Guard: Reports Stage Access
 */
export const canAccessReports: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.REPORTS);

/**
 * Guard: Audit Stage Access
 */
export const canAccessAudit: CanActivateFn = feeLifecycleGuard(FeeLifecycleStage.AUDIT);

// ============================================
// SETUP SUB-STAGE GUARDS
// ============================================

/**
 * Guard: Fee Policy Configuration
 */
export const canConfigurePolicy: CanActivateFn = feeSetupGuard(SetupSubStage.FEE_POLICY);

/**
 * Guard: Fee Heads Configuration
 */
export const canConfigureHeads: CanActivateFn = feeSetupGuard(SetupSubStage.FEE_HEADS);

/**
 * Guard: Fee Groups Configuration
 */
export const canConfigureGroups: CanActivateFn = feeSetupGuard(SetupSubStage.FEE_GROUPS);

/**
 * Guard: Fee Structure Configuration
 */
export const canConfigureStructure: CanActivateFn = feeSetupGuard(SetupSubStage.FEE_STRUCTURE);
