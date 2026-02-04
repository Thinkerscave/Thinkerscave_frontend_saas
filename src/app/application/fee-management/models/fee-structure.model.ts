/**
 * Fee Structure - Maps fee groups/heads to academic units
 * 
 * This is the template used to generate student fee contracts.
 * Maps: Academic Session + Class/Program + Category → Fee Amount
 * 
 * IMMUTABILITY: Once used to generate contracts, structure becomes read-only
 */
export interface FeeStructure {
    id: string;
    code: string;                    // Unique identifier
    name: string;                    // Display name
    description?: string;

    // Academic mapping
    academicSessionId: string;
    academicSessionName?: string;

    // Platform-specific mapping (one will be populated based on org type)
    // School
    classId?: string;
    className?: string;
    sectionId?: string;
    sectionName?: string;

    // College
    programId?: string;
    programName?: string;
    branchId?: string;
    branchName?: string;
    semesterId?: string;
    semesterName?: string;

    // Category-based (e.g., General, SC/ST, OBC, EWS)
    categoryId?: string;
    categoryName?: string;

    // Admission type (New, Lateral Entry, Transfer)
    admissionType?: string;

    // Fee composition
    feeGroupId?: string;             // Use a predefined group
    feeGroupName?: string;
    feeItems: FeeStructureItem[];    // Individual fee items with amounts

    // Installment configuration
    allowInstallments: boolean;
    installmentPlan?: InstallmentPlan;

    // Financial summary
    totalAmount: number;

    // Validity
    effectiveFrom: Date;
    effectiveTo?: Date;

    // Status
    status: FeeStructureStatus;
    isLocked: boolean;               // True once contracts generated

    // Audit fields
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
    lockedAt?: Date;
    lockedBy?: string;
    version: number;
}

/**
 * Individual fee item within a structure
 */
export interface FeeStructureItem {
    feeHeadId: string;
    feeHeadCode?: string;
    feeHeadName?: string;
    amount: number;
    dueDate?: Date;                  // When this particular fee is due
    sequence: number;
    isMandatory: boolean;
    lateFeeAmount?: number;          // Late fee if not paid by due date
    lateFeePerDay?: number;          // Daily late fee
    maxLateFee?: number;             // Cap on late fee
}

/**
 * Installment Plan Configuration
 */
export interface InstallmentPlan {
    numberOfInstallments: number;
    installments: Installment[];
}

export interface Installment {
    installmentNumber: number;
    name: string;                    // "First Installment", "Q1", etc.
    percentage: number;              // % of total amount
    amount?: number;                 // Calculated amount
    dueDate: Date;
    feeHeadIds?: string[];           // Specific heads in this installment
}

/**
 * Fee Structure Status
 */
export enum FeeStructureStatus {
    DRAFT = 'DRAFT',                 // Being created
    ACTIVE = 'ACTIVE',               // Available for use
    LOCKED = 'LOCKED',               // Used in contracts, immutable
    DEPRECATED = 'DEPRECATED',       // No longer in use
    ARCHIVED = 'ARCHIVED'            // Historical record
}

/**
 * Payload for creating a new Fee Structure
 */
export interface CreateFeeStructurePayload {
    code: string;
    name: string;
    description?: string;
    academicSessionId: string;
    classId?: string;
    sectionId?: string;
    programId?: string;
    branchId?: string;
    semesterId?: string;
    categoryId?: string;
    admissionType?: string;
    feeGroupId?: string;
    feeItems: Omit<FeeStructureItem, 'feeHeadCode' | 'feeHeadName'>[];
    allowInstallments: boolean;
    installmentPlan?: InstallmentPlan;
    effectiveFrom: Date;
    effectiveTo?: Date;
}

/**
 * Payload for updating a Fee Structure (only if not locked)
 */
export interface UpdateFeeStructurePayload extends Partial<CreateFeeStructurePayload> {
    id: string;
}
