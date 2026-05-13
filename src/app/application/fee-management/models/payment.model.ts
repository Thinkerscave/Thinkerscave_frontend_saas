import { PaymentStatus, PaymentMode, ReceiptStatus } from '../enums';

/**
 * Payment - Record of money received
 * 
 * CRITICAL RULES:
 * 1. Payments MUST reference outstanding dues from a contract
 * 2. Payment records are IMMUTABLE
 * 3. Refunds are new entries, not edits to original
 */
export interface Payment {
    id: string;
    paymentNumber: string;           // Unique payment identifier

    // References
    contractId: string;
    contractNumber?: string;
    ledgerId: string;
    studentId: string;
    studentName?: string;
    enrollmentNumber?: string;

    // Financial
    amount: number;
    paymentMode: PaymentMode;

    // Payment details based on mode
    transactionReference?: string;   // Bank/Gateway reference
    chequeNumber?: string;
    chequeDate?: Date;
    chequeBankName?: string;
    upiId?: string;
    cardLastFourDigits?: string;

    // Allocation - how payment was distributed
    allocations: PaymentAllocation[];

    // Status
    status: PaymentStatus;

    // Receipt
    receiptId?: string;
    receiptNumber?: string;

    // Dates
    paymentDate: Date;
    valueDate: Date;                 // Date for accounting
    receivedAt: Date;

    // Gateway info (for online payments)
    gatewayName?: string;
    gatewayTransactionId?: string;
    gatewayStatus?: string;
    gatewayResponse?: string;

    // Collected by
    collectedBy: string;
    collectedByName?: string;
    collectionPoint?: string;        // Counter, Online, etc.

    // Audit
    tenantId: string;
    createdAt: Date;
    createdBy: string;

    // Refund tracking
    isRefunded: boolean;
    refundedAmount?: number;
    refundPaymentId?: string;
}

/**
 * How a payment was allocated across fee heads
 */
export interface PaymentAllocation {
    feeHeadId: string;
    feeHeadCode?: string;
    feeHeadName?: string;
    contractItemId: string;
    allocatedAmount: number;
}

/**
 * Receipt - Proof of payment
 * IMMUTABLE - can only be cancelled (new entry)
 */
export interface Receipt {
    id: string;
    receiptNumber: string;           // Unique receipt number

    // Source
    paymentId: string;
    paymentNumber?: string;

    // Student
    studentId: string;
    studentName: string;
    enrollmentNumber?: string;
    className?: string;

    // Financial
    amount: number;
    amountInWords: string;
    paymentMode: PaymentMode;

    // Details
    items: ReceiptLineItem[];

    // Status
    status: ReceiptStatus;

    // Dates
    receiptDate: Date;
    printedAt?: Date;
    emailedAt?: Date;

    // Cancellation
    cancelledAt?: Date;
    cancelledBy?: string;
    cancellationReason?: string;
    replacementReceiptId?: string;

    // Audit
    tenantId: string;
    createdAt: Date;
    createdBy: string;
    createdByName?: string;
}

/**
 * Line item on a receipt
 */
export interface ReceiptLineItem {
    feeHeadName: string;
    amount: number;
    description?: string;
}

/**
 * Payload for collecting payment
 */
export interface CollectPaymentPayload {
    contractId: string;
    amount: number;
    paymentMode: PaymentMode;
    paymentDate: Date;

    // Mode-specific details
    transactionReference?: string;
    chequeNumber?: string;
    chequeDate?: Date;
    chequeBankName?: string;
    upiId?: string;

    // Allocation (optional - system can auto-allocate)
    allocations?: PaymentAllocation[];

    // Auto-generate receipt
    generateReceipt?: boolean;

    // Notes
    remarks?: string;
}

/**
 * Online Payment Initiation
 */
export interface InitiateOnlinePaymentPayload {
    contractId: string;
    amount: number;
    paymentGateway: string;
    returnUrl: string;

    // Payer details (for gateway)
    payerName: string;
    payerEmail: string;
    payerPhone: string;
}

export interface OnlinePaymentResponse {
    orderId: string;
    paymentUrl: string;
    expiresAt: Date;
}

/**
 * Payment Summary - For reports
 */
export interface PaymentSummary {
    totalCollected: number;
    totalCash: number;
    totalCheque: number;
    totalOnline: number;
    totalOther: number;
    transactionCount: number;
    collectionDate: Date;
}

/**
 * Daily Collection Report
 */
export interface DailyCollectionReport {
    date: Date;
    collections: PaymentSummary;
    byCollector: CollectorSummary[];
    byMode: PaymentModeSummary[];
    receipts: ReceiptSummary[];
}

export interface CollectorSummary {
    collectorId: string;
    collectorName: string;
    totalAmount: number;
    transactionCount: number;
}

export interface PaymentModeSummary {
    mode: PaymentMode;
    totalAmount: number;
    transactionCount: number;
}

export interface ReceiptSummary {
    receiptNumber: string;
    studentName: string;
    amount: number;
    paymentMode: PaymentMode;
    collectedBy: string;
}
