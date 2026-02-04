/**
 * Fee Policy - Top-level configuration for fee management
 * 
 * Defines the overall fee behavior for an academic session/financial year
 * This is the FIRST thing to be configured in the fee lifecycle
 */
export interface FeePolicy {
    id: string;
    name: string;
    description?: string;

    // Scope
    academicSessionId: string;
    academicSessionName?: string;
    financialYearId?: string;
    financialYearName?: string;

    // General settings
    defaultPaymentDueDays: number;   // Days after which payment is due
    allowPartialPayments: boolean;
    minimumPartialPaymentPercentage?: number;

    // Late fee settings
    lateFeeEnabled: boolean;
    defaultLateFeeConfigId?: string;
    lateFeeGracePeriodDays: number;

    // Installment settings
    installmentsAllowed: boolean;
    maxInstallments?: number;
    defaultInstallmentPlanId?: string;

    // Advance payment settings
    allowAdvancePayment: boolean;
    advancePaymentDiscountPercentage?: number;

    // Refund settings
    refundsAllowed: boolean;
    defaultRefundPolicyId?: string;
    refundRequestDeadlineDays?: number;

    // Restriction settings
    autoApplyRestrictions: boolean;
    defaultRestrictionThreshold?: number;

    // Notification settings
    sendPaymentReminders: boolean;
    reminderDaysBeforeDue: number[];
    sendOverdueNotifications: boolean;
    overdueDaysForNotification: number[];

    // Receipt settings
    receiptPrefix: string;
    receiptStartNumber: number;
    currentReceiptNumber: number;

    // Contract settings
    contractPrefix: string;
    contractStartNumber: number;
    currentContractNumber: number;

    // Status
    status: FeePolicyStatus;
    isLocked: boolean;               // Locked once session starts

    // Validity
    effectiveFrom: Date;
    effectiveTo: Date;

    // Audit
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
    lockedAt?: Date;
    lockedBy?: string;
}

export enum FeePolicyStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED',
    ARCHIVED = 'ARCHIVED'
}

/**
 * Refund Policy Configuration
 */
export interface RefundPolicy {
    id: string;
    name: string;
    description?: string;

    // Rules
    rules: RefundRule[];

    // Default behavior
    defaultRefundPercentage: number;
    requiresApproval: boolean;
    approvalLevels: number;

    // Validity
    effectiveFrom: Date;
    effectiveTo?: Date;

    // Audit
    tenantId: string;
    isActive: boolean;
    createdAt: Date;
    createdBy: string;
}

export interface RefundRule {
    daysFromAdmission: number;       // Within N days of admission
    refundPercentage: number;        // X% refund
    deductionHeadIds?: string[];     // Heads to deduct (e.g., processing fee)
}

/**
 * Payload for creating fee policy
 */
export interface CreateFeePolicyPayload {
    name: string;
    description?: string;
    academicSessionId: string;
    financialYearId?: string;

    defaultPaymentDueDays: number;
    allowPartialPayments: boolean;
    minimumPartialPaymentPercentage?: number;

    lateFeeEnabled: boolean;
    lateFeeGracePeriodDays?: number;

    installmentsAllowed: boolean;
    maxInstallments?: number;

    allowAdvancePayment: boolean;
    advancePaymentDiscountPercentage?: number;

    refundsAllowed: boolean;
    refundRequestDeadlineDays?: number;

    autoApplyRestrictions: boolean;
    defaultRestrictionThreshold?: number;

    sendPaymentReminders: boolean;
    reminderDaysBeforeDue?: number[];
    sendOverdueNotifications: boolean;
    overdueDaysForNotification?: number[];

    receiptPrefix: string;
    receiptStartNumber: number;
    contractPrefix: string;
    contractStartNumber: number;

    effectiveFrom: Date;
    effectiveTo: Date;
}

/**
 * Payload for updating fee policy (only if not locked)
 */
export interface UpdateFeePolicyPayload extends Partial<CreateFeePolicyPayload> {
    id: string;
}

/**
 * Fee Policy Summary - For list view
 */
export interface FeePolicySummary {
    id: string;
    name: string;
    academicSessionName: string;
    status: FeePolicyStatus;
    effectiveFrom: Date;
    effectiveTo: Date;
    isLocked: boolean;
    contractCount?: number;
}
