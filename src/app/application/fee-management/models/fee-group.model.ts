/**
 * Fee Group - Collection of fee heads packaged together
 * Example: "Regular Admission Package" = Tuition + Lab + Library + Exam
 * 
 * Groups simplify fee structure creation by bundling related heads
 */
export interface FeeGroup {
    id: string;
    code: string;                    // Unique identifier (e.g., "GRP001")
    name: string;                    // Display name (e.g., "Regular Admission Package")
    description?: string;

    // Composition
    feeHeadIds: string[];            // List of fee head IDs in this group
    feeHeads?: FeeGroupHead[];       // Populated fee heads with group-specific amounts

    // Applicability
    academicSessionId?: string;      // If session-specific
    programIds?: string[];           // Applicable programs
    classIds?: string[];             // Applicable classes (for schools)

    // Financial summary (calculated)
    totalAmount?: number;

    // Audit fields
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
    isActive: boolean;
    version: number;
}

/**
 * Fee Head within a Group - Can override default amount
 */
export interface FeeGroupHead {
    feeHeadId: string;
    feeHeadCode?: string;
    feeHeadName?: string;

    // Override the default amount for this group
    amount: number;

    // Override behavioral flags
    isMandatory?: boolean;
    sequence: number;                // Display order
}

/**
 * Payload for creating a new Fee Group
 */
export interface CreateFeeGroupPayload {
    code: string;
    name: string;
    description?: string;
    feeHeads: FeeGroupHead[];
    academicSessionId?: string;
    programIds?: string[];
    classIds?: string[];
}

/**
 * Payload for updating a Fee Group
 */
export interface UpdateFeeGroupPayload extends Partial<CreateFeeGroupPayload> {
    id: string;
}
