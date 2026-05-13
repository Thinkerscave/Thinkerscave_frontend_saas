import { FeeHeadCategory, FeeFrequency } from '../enums';

/**
 * Fee Head - Individual fee component (e.g., Tuition Fee, Lab Fee)
 * 
 * IMMUTABILITY RULE: Once a fee head is used in a contract, 
 * it becomes read-only. Create new version for changes.
 */
export interface FeeHead {
    id: string;
    code: string;                    // Unique identifier (e.g., "TUI001")
    name: string;                    // Display name (e.g., "Tuition Fee")
    description?: string;
    category: FeeHeadCategory;
    frequency: FeeFrequency;

    // Financial attributes
    defaultAmount: number;           // Base amount (can be overridden in structure)
    isRefundable: boolean;           // For deposits
    isTaxable: boolean;
    taxPercentage?: number;

    // Behavioral flags
    isMandatory: boolean;            // Must be included in all structures
    allowPartialPayment: boolean;    // Can be paid in installments
    lateFeeApplicable: boolean;      // Subject to late fee

    // Platform-specific settings
    applicableTo: string[];          // Platform types where applicable

    // Audit fields
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    updatedAt?: Date;
    updatedBy?: string;
    isActive: boolean;
    version: number;                 // For versioning when locked
}

/**
 * Payload for creating a new Fee Head
 */
export interface CreateFeeHeadPayload {
    code: string;
    name: string;
    description?: string;
    category: FeeHeadCategory;
    frequency: FeeFrequency;
    defaultAmount: number;
    isRefundable?: boolean;
    isTaxable?: boolean;
    taxPercentage?: number;
    isMandatory?: boolean;
    allowPartialPayment?: boolean;
    lateFeeApplicable?: boolean;
    applicableTo?: string[];
}

/**
 * Payload for updating a Fee Head (only if not locked)
 */
export interface UpdateFeeHeadPayload extends Partial<CreateFeeHeadPayload> {
    id: string;
}
