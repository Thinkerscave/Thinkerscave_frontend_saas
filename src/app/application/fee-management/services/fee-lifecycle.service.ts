import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FeeContractStatus } from '../enums';
import { FeeContract, FeePolicy, FeeStructure } from '../models';

/**
 * Fee Lifecycle Service
 * 
 * Enforces the canonical fee lifecycle order:
 * Setup → Contract → Ledger → Payment → Adjustment → Controls → Reports → Audit
 * 
 * CRITICAL: No steps may be skipped or reordered
 */

/**
 * Fee Lifecycle Stages - Strict order enforcement
 */
export enum FeeLifecycleStage {
    SETUP = 'SETUP',                 // 1. Academic session, Fee policy, Fee heads, Fee groups, Fee structure
    CONTRACT = 'CONTRACT',           // 2. Student fee contract generation
    LEDGER = 'LEDGER',               // 3. Ledger auto-creation (happens with contract)
    PAYMENT = 'PAYMENT',             // 4. Payment collection
    ADJUSTMENT = 'ADJUSTMENT',       // 5. Discounts, Waivers, Penalties
    CONTROLS = 'CONTROLS',           // 6. Academic restrictions
    REPORTS = 'REPORTS',             // 7. Reporting & Analytics
    AUDIT = 'AUDIT'                  // 8. Audit logs
}

/**
 * Setup sub-stages
 */
export enum SetupSubStage {
    ACADEMIC_SESSION = 'ACADEMIC_SESSION',
    FEE_POLICY = 'FEE_POLICY',
    FEE_HEADS = 'FEE_HEADS',
    FEE_GROUPS = 'FEE_GROUPS',
    FEE_STRUCTURE = 'FEE_STRUCTURE'
}

/**
 * Lifecycle validation result
 */
export interface LifecycleValidation {
    isValid: boolean;
    currentStage: FeeLifecycleStage;
    requiredStage: FeeLifecycleStage;
    missingPrerequisites: string[];
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class FeeLifecycleService {

    // Current tenant's lifecycle state
    private currentStageSubject = new BehaviorSubject<FeeLifecycleStage>(FeeLifecycleStage.SETUP);
    public currentStage$ = this.currentStageSubject.asObservable();

    // Setup completion tracking
    private setupCompletion = new Map<SetupSubStage, boolean>();

    constructor() {
        this.initializeSetupStages();
    }

    private initializeSetupStages(): void {
        Object.values(SetupSubStage).forEach(stage => {
            this.setupCompletion.set(stage, false);
        });
    }

    /**
     * STAGE ORDER - Defines valid sequence
     */
    private readonly STAGE_ORDER: FeeLifecycleStage[] = [
        FeeLifecycleStage.SETUP,
        FeeLifecycleStage.CONTRACT,
        FeeLifecycleStage.LEDGER,
        FeeLifecycleStage.PAYMENT,
        FeeLifecycleStage.ADJUSTMENT,
        FeeLifecycleStage.CONTROLS,
        FeeLifecycleStage.REPORTS,
        FeeLifecycleStage.AUDIT
    ];

    /**
     * SETUP ORDER - Defines valid sequence within setup
     */
    private readonly SETUP_ORDER: SetupSubStage[] = [
        SetupSubStage.ACADEMIC_SESSION,
        SetupSubStage.FEE_POLICY,
        SetupSubStage.FEE_HEADS,
        SetupSubStage.FEE_GROUPS,
        SetupSubStage.FEE_STRUCTURE
    ];

    // ============================================
    // STAGE VALIDATION
    // ============================================

    /**
     * Validate if an action is allowed based on current lifecycle stage
     */
    validateStageAccess(requiredStage: FeeLifecycleStage): LifecycleValidation {
        const currentStage = this.currentStageSubject.value;
        const currentIndex = this.STAGE_ORDER.indexOf(currentStage);
        const requiredIndex = this.STAGE_ORDER.indexOf(requiredStage);

        // Can access current stage or earlier stages (for viewing)
        if (requiredIndex <= currentIndex) {
            return {
                isValid: true,
                currentStage,
                requiredStage,
                missingPrerequisites: [],
                message: 'Access granted'
            };
        }

        // Cannot skip ahead
        const missing = this.getMissingPrerequisites(currentStage, requiredStage);
        return {
            isValid: false,
            currentStage,
            requiredStage,
            missingPrerequisites: missing,
            message: `Cannot access ${requiredStage}. Complete ${missing.join(', ')} first.`
        };
    }

    private getMissingPrerequisites(
        current: FeeLifecycleStage,
        required: FeeLifecycleStage
    ): string[] {
        const currentIndex = this.STAGE_ORDER.indexOf(current);
        const requiredIndex = this.STAGE_ORDER.indexOf(required);

        return this.STAGE_ORDER.slice(currentIndex + 1, requiredIndex);
    }

    // ============================================
    // SETUP VALIDATION
    // ============================================

    /**
     * Check if a setup sub-stage can be accessed
     */
    validateSetupAccess(subStage: SetupSubStage): LifecycleValidation {
        const subStageIndex = this.SETUP_ORDER.indexOf(subStage);

        // Check all previous stages are complete
        for (let i = 0; i < subStageIndex; i++) {
            const prevStage = this.SETUP_ORDER[i];
            if (!this.setupCompletion.get(prevStage)) {
                const missing = this.SETUP_ORDER.slice(0, subStageIndex)
                    .filter(s => !this.setupCompletion.get(s));

                return {
                    isValid: false,
                    currentStage: FeeLifecycleStage.SETUP,
                    requiredStage: FeeLifecycleStage.SETUP,
                    missingPrerequisites: missing,
                    message: `Complete ${missing.join(', ')} before accessing ${subStage}`
                };
            }
        }

        return {
            isValid: true,
            currentStage: FeeLifecycleStage.SETUP,
            requiredStage: FeeLifecycleStage.SETUP,
            missingPrerequisites: [],
            message: 'Access granted'
        };
    }

    /**
     * Mark a setup sub-stage as complete
     */
    completeSetupStage(subStage: SetupSubStage): void {
        this.setupCompletion.set(subStage, true);

        // Check if all setup stages are complete
        const allComplete = this.SETUP_ORDER.every(s => this.setupCompletion.get(s));
        if (allComplete) {
            this.currentStageSubject.next(FeeLifecycleStage.CONTRACT);
        }
    }

    /**
     * Get setup completion status
     */
    getSetupCompletion(): Map<SetupSubStage, boolean> {
        return new Map(this.setupCompletion);
    }

    // ============================================
    // CONTRACT VALIDATION
    // ============================================

    /**
     * Validate if payment is allowed on a contract
     */
    validatePaymentAllowed(contract: FeeContract): LifecycleValidation {
        if (!contract) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.SETUP,
                requiredStage: FeeLifecycleStage.PAYMENT,
                missingPrerequisites: ['Valid Fee Contract'],
                message: 'No valid fee contract found. Contract is required for payment.'
            };
        }

        if (contract.status === FeeContractStatus.CANCELLED) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.CONTRACT,
                requiredStage: FeeLifecycleStage.PAYMENT,
                missingPrerequisites: ['Active Contract'],
                message: 'Contract is cancelled. Payment not allowed.'
            };
        }

        if (contract.status === FeeContractStatus.SUSPENDED) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.CONTRACT,
                requiredStage: FeeLifecycleStage.PAYMENT,
                missingPrerequisites: ['Active Contract'],
                message: 'Contract is suspended. Payment not allowed until reactivated.'
            };
        }

        if (contract.outstandingAmount <= 0) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.PAYMENT,
                requiredStage: FeeLifecycleStage.PAYMENT,
                missingPrerequisites: [],
                message: 'No outstanding balance. All dues have been cleared.'
            };
        }

        return {
            isValid: true,
            currentStage: FeeLifecycleStage.PAYMENT,
            requiredStage: FeeLifecycleStage.PAYMENT,
            missingPrerequisites: [],
            message: 'Payment allowed'
        };
    }

    /**
     * Validate if contract can be modified
     */
    validateContractModifiable(contract: FeeContract): LifecycleValidation {
        if (!contract) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.SETUP,
                requiredStage: FeeLifecycleStage.CONTRACT,
                missingPrerequisites: ['Contract'],
                message: 'Contract not found.'
            };
        }

        if (contract.status === FeeContractStatus.LOCKED) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.CONTRACT,
                requiredStage: FeeLifecycleStage.CONTRACT,
                missingPrerequisites: [],
                message: 'Contract is locked after first payment. Use adjustments for modifications.'
            };
        }

        if (contract.paidAmount > 0) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.PAYMENT,
                requiredStage: FeeLifecycleStage.CONTRACT,
                missingPrerequisites: [],
                message: 'Payment has been made. Contract cannot be modified. Use adjustments.'
            };
        }

        if (contract.status === FeeContractStatus.CANCELLED) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.CONTRACT,
                requiredStage: FeeLifecycleStage.CONTRACT,
                missingPrerequisites: [],
                message: 'Contract is cancelled and cannot be modified.'
            };
        }

        return {
            isValid: true,
            currentStage: FeeLifecycleStage.CONTRACT,
            requiredStage: FeeLifecycleStage.CONTRACT,
            missingPrerequisites: [],
            message: 'Contract can be modified'
        };
    }

    // ============================================
    // STRUCTURE VALIDATION
    // ============================================

    /**
     * Validate if structure can be modified
     */
    validateStructureModifiable(structure: FeeStructure): LifecycleValidation {
        if (!structure) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.SETUP,
                requiredStage: FeeLifecycleStage.SETUP,
                missingPrerequisites: ['Structure'],
                message: 'Structure not found.'
            };
        }

        if (structure.isLocked) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.CONTRACT,
                requiredStage: FeeLifecycleStage.SETUP,
                missingPrerequisites: [],
                message: 'Structure is locked after being used in contracts. Create a new version for changes.'
            };
        }

        return {
            isValid: true,
            currentStage: FeeLifecycleStage.SETUP,
            requiredStage: FeeLifecycleStage.SETUP,
            missingPrerequisites: [],
            message: 'Structure can be modified'
        };
    }

    // ============================================
    // POLICY VALIDATION
    // ============================================

    /**
     * Validate if policy can be modified
     */
    validatePolicyModifiable(policy: FeePolicy): LifecycleValidation {
        if (!policy) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.SETUP,
                requiredStage: FeeLifecycleStage.SETUP,
                missingPrerequisites: ['Policy'],
                message: 'Policy not found.'
            };
        }

        if (policy.isLocked) {
            return {
                isValid: false,
                currentStage: FeeLifecycleStage.SETUP,
                requiredStage: FeeLifecycleStage.SETUP,
                missingPrerequisites: [],
                message: 'Policy is locked after session start. Limited modifications allowed.'
            };
        }

        return {
            isValid: true,
            currentStage: FeeLifecycleStage.SETUP,
            requiredStage: FeeLifecycleStage.SETUP,
            missingPrerequisites: [],
            message: 'Policy can be modified'
        };
    }

    // ============================================
    // LIFECYCLE STATE MANAGEMENT
    // ============================================

    /**
     * Advance to next lifecycle stage
     */
    advanceStage(): void {
        const currentIndex = this.STAGE_ORDER.indexOf(this.currentStageSubject.value);
        if (currentIndex < this.STAGE_ORDER.length - 1) {
            this.currentStageSubject.next(this.STAGE_ORDER[currentIndex + 1]);
        }
    }

    /**
     * Get current lifecycle stage
     */
    getCurrentStage(): FeeLifecycleStage {
        return this.currentStageSubject.value;
    }

    /**
     * Check if a stage is completed
     */
    isStageCompleted(stage: FeeLifecycleStage): boolean {
        const currentIndex = this.STAGE_ORDER.indexOf(this.currentStageSubject.value);
        const stageIndex = this.STAGE_ORDER.indexOf(stage);
        return stageIndex < currentIndex;
    }

    /**
     * Check if a stage is current
     */
    isStageCurrent(stage: FeeLifecycleStage): boolean {
        return this.currentStageSubject.value === stage;
    }

    /**
     * Check if a stage is upcoming (not yet accessible)
     */
    isStageUpcoming(stage: FeeLifecycleStage): boolean {
        const currentIndex = this.STAGE_ORDER.indexOf(this.currentStageSubject.value);
        const stageIndex = this.STAGE_ORDER.indexOf(stage);
        return stageIndex > currentIndex;
    }

    /**
     * Reset lifecycle (for testing or new session)
     */
    resetLifecycle(): void {
        this.currentStageSubject.next(FeeLifecycleStage.SETUP);
        this.initializeSetupStages();
    }
}
