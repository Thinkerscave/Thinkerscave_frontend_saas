import { LedgerEntryType } from '../enums';

/**
 * Fee Ledger - Chronological, append-only record of all financial transactions
 * 
 * CRITICAL AUDIT RULES:
 * 1. Entries are NEVER edited or deleted
 * 2. All entries must reference a valid contract
 * 3. Corrections are made via new reversal entries
 * 4. Every entry has a permanent audit trail
 */
export interface FeeLedger {
    id: string;
    ledgerNumber: string;            // Unique ledger identifier

    // References
    contractId: string;
    contractNumber?: string;
    studentId: string;
    studentName?: string;
    enrollmentNumber?: string;

    // Academic context
    academicSessionId: string;
    financialYearId?: string;

    // Entries
    entries: LedgerEntry[];

    // Running totals
    totalCharges: number;
    totalPayments: number;
    totalAdjustments: number;
    currentBalance: number;          // What student owes

    // Audit
    tenantId: string;
    createdAt: Date;
    lastEntryAt?: Date;
}

/**
 * Individual ledger entry - IMMUTABLE once created
 */
export interface LedgerEntry {
    id: string;
    entryNumber: string;             // Unique entry identifier
    sequenceNumber: number;          // Order in ledger

    // Classification
    entryType: LedgerEntryType;

    // Financial
    debitAmount: number;             // Amount owed (charges, penalties)
    creditAmount: number;            // Amount received (payments, waivers)
    balanceAfter: number;            // Running balance after this entry

    // Reference to source
    feeHeadId?: string;
    feeHeadName?: string;
    paymentId?: string;              // If this is a payment entry
    receiptNumber?: string;
    adjustmentId?: string;           // If this is an adjustment entry

    // Details
    description: string;
    narration?: string;              // Additional notes

    // Reversal tracking
    isReversal: boolean;
    reversedEntryId?: string;        // If this reverses another entry
    reversedByEntryId?: string;      // If this was reversed by another entry
    reversalReason?: string;

    // Timestamps
    entryDate: Date;
    valueDate: Date;                 // Effective date for accounting

    // Audit
    createdAt: Date;
    createdBy: string;
    createdByName?: string;
}

/**
 * Ledger Summary - For dashboard views
 */
export interface LedgerSummary {
    contractId: string;
    studentId: string;
    studentName: string;
    totalCharges: number;
    totalPayments: number;
    totalAdjustments: number;
    currentBalance: number;
    lastPaymentDate?: Date;
    lastPaymentAmount?: number;
    oldestDueDate?: Date;
    daysOverdue?: number;
}

/**
 * Ledger Entry Creation Payload
 * Used internally by system - not directly by users
 */
export interface CreateLedgerEntryPayload {
    ledgerId: string;
    entryType: LedgerEntryType;
    debitAmount: number;
    creditAmount: number;
    feeHeadId?: string;
    paymentId?: string;
    adjustmentId?: string;
    description: string;
    narration?: string;
    valueDate: Date;
}

/**
 * Ledger Statement Request
 */
export interface LedgerStatementRequest {
    contractId?: string;
    studentId?: string;
    fromDate?: Date;
    toDate?: Date;
    entryTypes?: LedgerEntryType[];
    includeReversals?: boolean;
}

/**
 * Ledger Statement Response
 */
export interface LedgerStatement {
    studentId: string;
    studentName: string;
    enrollmentNumber?: string;
    contractId: string;
    contractNumber: string;

    // Period
    fromDate: Date;
    toDate: Date;

    // Opening and closing
    openingBalance: number;
    closingBalance: number;

    // Entries in period
    entries: LedgerEntry[];

    // Summary
    totalDebits: number;
    totalCredits: number;

    // Generated info
    generatedAt: Date;
    generatedBy: string;
}
