/**
 * Fee Contract Status - Immutable after first payment
 * Follows audit-first principle: statuses are append-only, never overwritten
 */
export enum FeeContractStatus {
  DRAFT = 'DRAFT',               // Initial creation, editable
  ACTIVE = 'ACTIVE',             // Approved and ready for payment
  LOCKED = 'LOCKED',             // First payment made - fully immutable
  COMPLETED = 'COMPLETED',       // All dues cleared
  CANCELLED = 'CANCELLED',       // Contract voided (with audit trail)
  SUSPENDED = 'SUSPENDED'        // Temporarily halted (e.g., student inactive)
}

/**
 * Payment Status - Each payment entry is immutable
 */
export enum PaymentStatus {
  PENDING = 'PENDING',           // Payment initiated but not confirmed
  SUCCESS = 'SUCCESS',           // Payment confirmed
  FAILED = 'FAILED',             // Payment failed
  REFUNDED = 'REFUNDED',         // Refund processed (new entry, original unchanged)
  CANCELLED = 'CANCELLED'        // Cancelled before processing
}

/**
 * Payment Mode - How the payment was made
 */
export enum PaymentMode {
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  DEMAND_DRAFT = 'DEMAND_DRAFT',
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
  SCHOLARSHIP = 'SCHOLARSHIP',
  WAIVER = 'WAIVER'
}

/**
 * Adjustment Type - All adjustments are append-only
 * Original records are NEVER modified
 */
export enum AdjustmentType {
  DISCOUNT = 'DISCOUNT',         // Fee reduction
  WAIVER = 'WAIVER',             // Complete waiver of fee head
  SCHOLARSHIP = 'SCHOLARSHIP',   // Merit/need-based reduction
  PENALTY = 'PENALTY',           // Late fee, fine
  REFUND = 'REFUND',             // Money returned
  CONCESSION = 'CONCESSION',     // Institution-granted reduction
  TRANSFER_CREDIT = 'TRANSFER_CREDIT', // Credit from sibling/previous term
  CORRECTION = 'CORRECTION'      // Error correction (requires approval)
}

/**
 * Adjustment Status - Approval workflow
 */
export enum AdjustmentStatus {
  PENDING = 'PENDING',           // Awaiting approval
  APPROVED = 'APPROVED',         // Approved by authorized role
  REJECTED = 'REJECTED',         // Rejected with reason
  APPLIED = 'APPLIED'            // Adjustment applied to ledger
}

/**
 * Fee Head Category - Classification of fee types
 */
export enum FeeHeadCategory {
  ACADEMIC = 'ACADEMIC',         // Tuition, Lab, Library
  FACILITY = 'FACILITY',         // Hostel, Transport, Canteen
  EXAMINATION = 'EXAMINATION',   // Exam fees, re-evaluation
  ACTIVITY = 'ACTIVITY',         // Sports, Cultural, Events
  MISCELLANEOUS = 'MISCELLANEOUS', // ID card, Certificate, etc.
  DEPOSIT = 'DEPOSIT',           // Refundable deposits (caution money)
  PENALTY = 'PENALTY'            // Late fees, fines
}

/**
 * Fee Frequency - How often the fee is charged
 */
export enum FeeFrequency {
  ONE_TIME = 'ONE_TIME',         // Admission fee, Deposit
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  YEARLY = 'YEARLY',
  PER_SEMESTER = 'PER_SEMESTER',
  PER_TERM = 'PER_TERM',
  CUSTOM = 'CUSTOM'              // Custom schedule
}

/**
 * Ledger Entry Type - For audit trail
 */
export enum LedgerEntryType {
  CHARGE = 'CHARGE',             // Fee charged to student
  PAYMENT = 'PAYMENT',           // Payment received
  ADJUSTMENT = 'ADJUSTMENT',     // Discount/Waiver/Penalty
  REFUND = 'REFUND',             // Refund processed
  REVERSAL = 'REVERSAL',         // System reversal (with reason)
  OPENING_BALANCE = 'OPENING_BALANCE', // Carried forward from previous term
  CLOSING_BALANCE = 'CLOSING_BALANCE'  // End of term snapshot
}

/**
 * Receipt Status
 */
export enum ReceiptStatus {
  GENERATED = 'GENERATED',
  PRINTED = 'PRINTED',
  EMAILED = 'EMAILED',
  CANCELLED = 'CANCELLED'        // Cancelled receipt (new entry, original preserved)
}

/**
 * Academic Restriction Type - Automatic controls based on dues
 */
export enum AcademicRestrictionType {
  EXAM_BLOCK = 'EXAM_BLOCK',                 // Cannot appear in exams
  RESULT_WITHHOLD = 'RESULT_WITHHOLD',       // Results not released
  LIBRARY_BLOCK = 'LIBRARY_BLOCK',           // Library access revoked
  ID_CARD_BLOCK = 'ID_CARD_BLOCK',           // ID card not issued
  CERTIFICATE_BLOCK = 'CERTIFICATE_BLOCK',   // Certificate issuance blocked
  RE_ADMISSION_BLOCK = 'RE_ADMISSION_BLOCK', // Cannot re-admit to next term
  FULL_ACCESS_BLOCK = 'FULL_ACCESS_BLOCK'    // Complete access revocation
}
