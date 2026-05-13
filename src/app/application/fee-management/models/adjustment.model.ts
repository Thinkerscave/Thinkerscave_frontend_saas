import { AdjustmentType, AdjustmentStatus } from '../enums';

/**
 * Fee Adjustment - Modifications to fee amounts
 * 
 * CRITICAL RULES:
 * 1. Adjustments are NEW entries - they do NOT modify original records
 * 2. Every adjustment requires a reason and approval reference
 * 3. All adjustments create corresponding ledger entries
 * 4. Adjustments are fully auditable
 */
export interface FeeAdjustment {
    id: string;
    adjustmentNumber: string;        // Unique identifier

    // Reference
    contractId: string;
    contractNumber?: string;
    studentId: string;
    studentName?: string;
    enrollmentNumber?: string;

    // Ledger reference (created when applied)
    ledgerEntryId?: string;

    // Classification
    adjustmentType: AdjustmentType;

    // Financial
    amount: number;                  // Positive for discount/waiver, negative for penalty

    // Scope - what fee head(s) this applies to
    feeHeadId?: string;              // Specific head, or all if null
    feeHeadName?: string;
    contractItemId?: string;

    // Reason & Documentation
    reason: string;
    description?: string;
    supportingDocuments?: DocumentReference[];

    // Approval workflow
    status: AdjustmentStatus;
    requestedBy: string;
    requestedByName?: string;
    requestedAt: Date;

    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
    approvalRemarks?: string;

    rejectedBy?: string;
    rejectedByName?: string;
    rejectedAt?: Date;
    rejectionReason?: string;

    // Application
    appliedAt?: Date;
    appliedBy?: string;

    // Validity
    effectiveFrom?: Date;
    effectiveTo?: Date;

    // Audit
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
}

/**
 * Document reference for adjustment proof
 */
export interface DocumentReference {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
}

/**
 * Concession Master - Predefined discounts (e.g., Staff Ward, Sibling)
 */
export interface FeeConcession {
    id: string;
    code: string;
    name: string;
    description?: string;

    // Type
    concessionType: ConcessionType;

    // Value
    discountType: DiscountType;
    discountValue: number;           // Percentage or absolute based on discountType

    // Applicability
    applicableFeeHeadIds?: string[]; // Specific heads, or all if empty
    applicableCategoryIds?: string[];

    // Auto-apply rules
    isAutoApply: boolean;
    autoApplyCondition?: string;     // Expression for auto-apply

    // Validity
    effectiveFrom: Date;
    effectiveTo?: Date;

    // Limits
    maxBeneficiaries?: number;       // Max students who can avail
    currentBeneficiaries?: number;

    // Audit
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    isActive: boolean;
}

export enum ConcessionType {
    STAFF_WARD = 'STAFF_WARD',
    SIBLING = 'SIBLING',
    MERIT = 'MERIT',
    SPORTS = 'SPORTS',
    ECONOMICALLY_WEAKER = 'ECONOMICALLY_WEAKER',
    MANAGEMENT_QUOTA = 'MANAGEMENT_QUOTA',
    ALUMNI = 'ALUMNI',
    CUSTOM = 'CUSTOM'
}

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    ABSOLUTE = 'ABSOLUTE'
}

/**
 * Payload for creating an adjustment
 */
export interface CreateAdjustmentPayload {
    contractId: string;
    adjustmentType: AdjustmentType;
    amount: number;
    feeHeadId?: string;
    contractItemId?: string;
    reason: string;
    description?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    supportingDocuments?: File[];
}

/**
 * Payload for approving/rejecting adjustment
 */
export interface AdjustmentApprovalPayload {
    adjustmentId: string;
    action: 'APPROVE' | 'REJECT';
    remarks: string;
}

/**
 * Adjustment Summary - For reports
 */
export interface AdjustmentSummary {
    totalDiscounts: number;
    totalWaivers: number;
    totalScholarships: number;
    totalPenalties: number;
    totalRefunds: number;
    netAdjustment: number;
    pendingApprovals: number;
}
