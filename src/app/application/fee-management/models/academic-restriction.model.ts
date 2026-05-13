import { AcademicRestrictionType } from '../enums';

/**
 * Academic Restriction - Automatic controls based on fee dues
 * 
 * These are ledger-driven and automatic:
 * - System checks outstanding balance
 * - Applies restrictions based on configured rules
 * - Removes restrictions when dues are cleared
 */
export interface AcademicRestriction {
    id: string;

    // Student
    studentId: string;
    studentName?: string;
    enrollmentNumber?: string;

    // Contract reference
    contractId: string;
    contractNumber?: string;

    // Restriction details
    restrictionType: AcademicRestrictionType;

    // Financial context
    outstandingAmount: number;
    thresholdAmount: number;         // Amount that triggered restriction

    // Status
    isActive: boolean;

    // Dates
    appliedAt: Date;
    appliedBy?: string;              // 'SYSTEM' for auto, or user ID for manual
    appliedReason: string;

    removedAt?: Date;
    removedBy?: string;
    removalReason?: string;

    // Override (manual removal before dues cleared)
    isOverridden: boolean;
    overriddenBy?: string;
    overriddenAt?: Date;
    overrideReason?: string;
    overrideValidUntil?: Date;

    // Audit
    tenantId: string;
    createdAt: Date;
}

/**
 * Restriction Rule Configuration - Admin-defined rules
 */
export interface RestrictionRule {
    id: string;
    name: string;
    description?: string;

    // Trigger conditions
    restrictionType: AcademicRestrictionType;
    triggerType: RestrictionTriggerType;

    // Threshold configuration
    thresholdAmount?: number;        // For amount-based trigger
    thresholdPercentage?: number;    // For percentage-based trigger
    daysOverdue?: number;            // For due-date-based trigger

    // Scope
    academicSessionId?: string;
    classIds?: string[];
    programIds?: string[];

    // Behavior
    isAutoApply: boolean;
    isAutoRemove: boolean;           // Auto-remove when dues cleared
    requiresApprovalForOverride: boolean;

    // Notification
    sendNotificationOnApply: boolean;
    notificationTemplate?: string;

    // Status
    isActive: boolean;
    priority: number;                // For rule ordering

    // Audit
    tenantId: string;
    createdAt: Date;
    createdBy: string;
}

export enum RestrictionTriggerType {
    AMOUNT_EXCEEDS = 'AMOUNT_EXCEEDS',           // Balance > threshold
    PERCENTAGE_EXCEEDS = 'PERCENTAGE_EXCEEDS',   // Balance > X% of total
    DAYS_OVERDUE = 'DAYS_OVERDUE',               // Due date + N days
    SPECIFIC_HEAD_UNPAID = 'SPECIFIC_HEAD_UNPAID', // Particular fee head unpaid
    ANY_BALANCE = 'ANY_BALANCE'                  // Any outstanding balance
}

/**
 * Restriction Override Request
 */
export interface RestrictionOverrideRequest {
    restrictionId: string;
    reason: string;
    validUntil?: Date;
    supportingDocuments?: File[];
}

/**
 * Active Restrictions Summary - For dashboard
 */
export interface RestrictionsSummary {
    totalActive: number;
    byType: RestrictionTypeSummary[];
    criticalCount: number;           // Full access blocks
    pendingOverrides: number;
}

export interface RestrictionTypeSummary {
    type: AcademicRestrictionType;
    count: number;
    totalOutstanding: number;
}

/**
 * Late Fee Configuration
 */
export interface LateFeeConfig {
    id: string;
    name: string;

    // Applicability
    feeHeadIds?: string[];           // Specific heads, or all if empty
    academicSessionId?: string;

    // Calculation
    calculationType: LateFeeCalculationType;
    flatAmount?: number;             // For flat fee
    percentagePerDay?: number;       // For daily percentage
    percentagePerMonth?: number;     // For monthly percentage

    // Grace period
    gracePeriodDays: number;

    // Caps
    maxLateFee?: number;             // Maximum late fee amount
    maxLateFeePercentage?: number;   // Maximum as % of original

    // Status
    isActive: boolean;

    // Audit
    tenantId: string;
    createdAt: Date;
    createdBy: string;
}

export enum LateFeeCalculationType {
    FLAT = 'FLAT',
    PERCENTAGE_PER_DAY = 'PERCENTAGE_PER_DAY',
    PERCENTAGE_PER_MONTH = 'PERCENTAGE_PER_MONTH',
    SLAB_BASED = 'SLAB_BASED'
}

/**
 * Late Fee Slab (for slab-based calculation)
 */
export interface LateFeeSlab {
    fromDay: number;
    toDay: number;
    amount?: number;
    percentage?: number;
}
