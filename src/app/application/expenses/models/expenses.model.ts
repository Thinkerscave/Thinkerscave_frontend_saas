export type ExpenseApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type ExpensePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type ExpenseHeadStatus = 'ACTIVE' | 'INACTIVE';
export type ExpenseDatePreset = 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_FY' | 'CUSTOM';

export const EXPENSE_RESOURCES = {
  EXPENSES: 'EXPENSES',
  HEADS: 'EXPENSE_HEADS',
  PAYMENT: 'EXPENSE_PAYMENT',
  APPROVAL: 'EXPENSE_APPROVAL',
  SETTINGS: 'EXPENSE_SETTINGS'
} as const;

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  page?: number;
  size: number;
  first?: boolean;
  last?: boolean;
  sort?: string | null;
}

export interface ExpenseFilter {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  datePreset?: ExpenseDatePreset;
  categoryId?: number;
  expenseHeadId?: number;
  approvalStatus?: ExpenseApprovalStatus;
  paymentStatus?: ExpensePaymentStatus;
}

export interface ExpenseCategory {
  expenseCategoryId: number;
  code: string;
  name: string;
  description?: string | null;
  sortOrder?: number | null;
}

export interface ExpenseHead {
  expenseHeadId: number;
  name: string;
  category: ExpenseCategory;
  defaultRequesterStaffId?: number | null;
  defaultRequesterName?: string | null;
  description?: string | null;
  status: ExpenseHeadStatus;
}

export interface ExpenseHeadRequest {
  name: string;
  expenseCategoryId: number;
  defaultRequesterStaffId?: number | null;
  description?: string | null;
  status: ExpenseHeadStatus;
}

export interface ExpenseOverview {
  totalExpenseAmount: number;
  pendingApprovalAmount: number;
  pendingApprovalCount: number;
  pendingPaymentAmount: number;
  pendingPaymentCount: number;
  paidAmount: number;
  paidCount: number;
  periodLabel: string;
}

export interface ExpenseListRow {
  expenseId: number;
  date: string;
  expenseNumber: string;
  headName: string;
  categoryName: string;
  vendorName?: string | null;
  amount: number;
  approvalStatus: ExpenseApprovalStatus;
  paymentStatus: ExpensePaymentStatus;
  paidAmount: number;
  remainingAmount: number;
}

export interface ExpenseStaff {
  staffId: number;
  staffCode?: string | null;
  name: string;
}

export interface ExpensePaymentRequest {
  amount: number;
  paidOn: string;
  paymentMethodId?: number | null;
  referenceNumber?: string | null;
  remarks?: string | null;
}

export interface ExpensePayment {
  expensePaymentId: number;
  amount: number;
  paidOn: string;
  paymentMethodId?: number | null;
  paymentMethodName?: string | null;
  referenceNumber?: string | null;
  remarks?: string | null;
  createdOn?: string | null;
}

export interface ExpenseApprovalEvent {
  id: number;
  eventType: string;
  fromStatus?: ExpenseApprovalStatus | null;
  toStatus?: ExpenseApprovalStatus | null;
  actor?: string | null;
  remarks?: string | null;
  occurredOn?: string | null;
}

export interface ExpenseAttachment {
  managedDocumentId: number;
  fileName: string;
  contentType: string;
  kind?: string | null;
  uploadedOn?: string | null;
  byteSize?: number | null;
}

export interface ExpenseDetail {
  expenseId: number;
  expenseNumber: string;
  expenseDate: string;
  expenseHeadId: number;
  headName: string;
  expenseCategoryId: number;
  categoryCode: string;
  categoryName: string;
  amount: number;
  vendorName?: string | null;
  vendorInvoiceNumber?: string | null;
  requester: ExpenseStaff;
  remarks?: string | null;
  approvalStatus: ExpenseApprovalStatus;
  paymentStatus: ExpensePaymentStatus;
  paidAmount: number;
  remainingAmount: number;
  payments: ExpensePayment[];
  approvalEvents: ExpenseApprovalEvent[];
  attachments: ExpenseAttachment[];
}

export interface ExpenseCreateRequest {
  expenseHeadId: number;
  expenseDate: string;
  amount: number;
  vendorName?: string | null;
  vendorInvoiceNumber?: string | null;
  requesterStaffId: number;
  remarks?: string | null;
  saveAsDraft: boolean;
  initialPayment?: ExpensePaymentRequest | null;
}

export type ExpenseUpdateRequest = Partial<Omit<ExpenseCreateRequest, 'saveAsDraft' | 'initialPayment'>>;

export interface ExpensePaymentResult {
  payment: ExpensePayment;
  paymentStatus: ExpensePaymentStatus;
  paidAmount: number;
  remainingAmount: number;
}

export interface ExpenseSettings {
  approvalRequired: boolean;
  numberPrefix: string;
  numberYearFormat: string;
  numberPadWidth: number;
  numberStart: number;
  numberSequencePerYear: boolean;
  defaultPaymentMethodId?: number | null;
  maxAttachmentBytes: number;
  allowedAttachmentContentTypes: string;
}

export interface PaymentMethodOption {
  feePaymentMethodId: number;
  name: string;
  status?: string;
  requiresReference?: boolean;
}

export function expenseStatusLabel(status?: string | null): string {
  return status ? status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
}

export function expenseStatusTone(status?: string | null): string {
  if (status === 'APPROVED' || status === 'PAID') return 'success';
  if (status === 'PENDING_APPROVAL') return 'warning';
  if (status === 'REJECTED' || status === 'UNPAID') return 'danger';
  if (status === 'PARTIALLY_PAID') return 'info';
  return 'muted';
}
