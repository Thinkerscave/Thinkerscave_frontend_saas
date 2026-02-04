import { FeeContractStatus } from '../enums';

/**
 * Fee Contract - THE SINGLE SOURCE OF TRUTH for student fees
 * 
 * CRITICAL RULES:
 * 1. A student MUST have a contract before ANY payment action
 * 2. Contract becomes FULLY READ-ONLY after first payment
 * 3. All modifications after first payment are via Adjustments only
 * 4. Contract cannot be deleted - only cancelled (with audit trail)
 */
export interface FeeContract {
    id: string;
    contractNumber: string;          // Unique contract identifier (e.g., "FC-2024-00001")

    // Student reference
    studentId: string;
    studentName?: string;
    enrollmentNumber?: string;

    // Academic context
    academicSessionId: string;
    academicSessionName?: string;

    // Source structure (what this contract was generated from)
    feeStructureId: string;
    feeStructureName?: string;
    feeStructureVersion: number;     // Snapshot of structure version

    // Contract items (snapshot from structure at creation time)
    items: FeeContractItem[];

    // Financial summary
    grossAmount: number;             // Total before adjustments
    totalDiscount: number;           // Sum of all discounts/waivers
    totalPenalty: number;            // Sum of penalties/late fees
    netAmount: number;               // grossAmount - totalDiscount + totalPenalty
    paidAmount: number;              // Total paid so far
    outstandingAmount: number;       // netAmount - paidAmount

    // Installment tracking
    hasInstallments: boolean;
    currentInstallment?: number;
    totalInstallments?: number;

    // Status
    status: FeeContractStatus;

    // Category/Concession
    categoryId?: string;
    categoryName?: string;
    concessionId?: string;
    concessionName?: string;

    // Important dates
    contractDate: Date;              // When contract was created
    effectiveFrom: Date;             // When fees become applicable
    validUntil?: Date;               // Contract validity period
    firstPaymentDate?: Date;         // When first payment was made (locks contract)
    lastPaymentDate?: Date;          // Most recent payment

    // Audit trail
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
    lockedAt?: Date;                 // When contract was locked (first payment)
    lockedBy?: string;
    cancelledAt?: Date;
    cancelledBy?: string;
    cancellationReason?: string;

    // Version control
    version: number;
}

/**
 * Individual item in a contract
 * This is a SNAPSHOT - does not change even if fee head changes
 */
export interface FeeContractItem {
    id: string;
    feeHeadId: string;
    feeHeadCode: string;
    feeHeadName: string;

    // Amounts (snapshot at contract creation)
    originalAmount: number;          // Amount from structure
    discountAmount: number;          // Any discounts applied
    penaltyAmount: number;           // Any penalties
    netAmount: number;               // originalAmount - discountAmount + penaltyAmount
    paidAmount: number;              // Amount paid for this item
    outstandingAmount: number;       // netAmount - paidAmount

    // Due date for this specific item
    dueDate?: Date;

    // Status
    isPaid: boolean;
    isWaived: boolean;

    // Display
    sequence: number;
}

/**
 * Contract Summary - For list views
 */
export interface FeeContractSummary {
    id: string;
    contractNumber: string;
    studentId: string;
    studentName: string;
    enrollmentNumber?: string;
    className?: string;
    academicSessionName: string;
    grossAmount: number;
    netAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    status: FeeContractStatus;
    contractDate: Date;
}

/**
 * Payload for generating contracts
 */
export interface GenerateContractPayload {
    feeStructureId: string;
    studentIds: string[];            // Can generate for multiple students
    effectiveFrom: Date;
    validUntil?: Date;
    applyDefaultConcessions?: boolean;
}

/**
 * Result of contract generation
 */
export interface GenerateContractResult {
    totalRequested: number;
    successCount: number;
    failureCount: number;
    contracts: FeeContractSummary[];
    errors: ContractGenerationError[];
}

export interface ContractGenerationError {
    studentId: string;
    studentName?: string;
    reason: string;
}
