/** Finance → Fees frontend models — aligned with Java DTO field names. */

export type FeeMasterStatus = 'ACTIVE' | 'INACTIVE';
export type FeeHeadCategory =
  | 'ACADEMIC'
  | 'ADMISSION_AND_REGISTRATION'
  | 'FACILITIES_AND_SERVICES'
  | 'MISCELLANEOUS';
export type FeeFrequency = 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
export type FeeItemType = 'MANDATORY' | 'OPTIONAL';
export type FeeServiceKey = 'NONE' | 'TRANSPORT' | 'HOSTEL';
export type BillingPeriodStatus = 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export const FEE_HEAD_CATEGORY_LABELS: Record<FeeHeadCategory, string> = {
  ACADEMIC: 'Academic',
  ADMISSION_AND_REGISTRATION: 'Admission & Registration',
  FACILITIES_AND_SERVICES: 'Facilities & Services',
  MISCELLANEOUS: 'Miscellaneous'
};

export const FEE_FREQUENCY_OPTIONS: { value: FeeFrequency; label: string }[] = [
  { value: 'ONE_TIME', label: 'One Time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly' },
  { value: 'YEARLY', label: 'Yearly' }
];

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

export interface FeeHead {
  feeHeadId: number;
  name: string;
  category: FeeHeadCategory;
  description?: string | null;
  status: FeeMasterStatus;
}

export interface FeeHeadRequest {
  name: string;
  category: FeeHeadCategory;
  description?: string | null;
  status: FeeMasterStatus;
}

export interface FeeStructureItem {
  feeStructureItemId?: number;
  feeHeadId: number;
  feeHeadName?: string;
  amount: number;
  frequency: FeeFrequency;
  type: FeeItemType;
  serviceKey: FeeServiceKey;
}

export interface FeeStructure {
  feeStructureId: number;
  name: string;
  academicYearId: number;
  academicYearName?: string;
  classId: number;
  className?: string;
  dueDay: number;
  status: FeeMasterStatus;
  mandatorySum?: number;
  optionalSum?: number;
  configuredMonthlyAmount?: number | null;
  items?: FeeStructureItem[];
}

export interface FeeStructureRequest {
  name: string;
  academicYearId: number;
  classId: number;
  dueDay: number;
  status: FeeMasterStatus;
  items: FeeStructureItem[];
}

export interface CloneFeeStructureRequest {
  targetAcademicYearId: number;
  targets: { classId: number; name?: string; dueDay?: number; items?: FeeStructureItem[] }[];
  onConflict: 'CANCEL_CLASS' | 'REPLACE_DEACTIVATE';
}

export interface StudentFeeKpis {
  totalFee: number;
  paid: number;
  outstanding: number;
  advance: number;
}

export interface StudentFeeListItem {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className?: string;
  sectionName?: string;
  totalFee: number;
  paid: number;
  outstanding: number;
  advance?: number;
  canCollectFee?: boolean;
}

export interface StudentFeeDetail {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className?: string;
  sectionName?: string;
  academicYearId: number;
  academicYearName?: string;
  kpis: StudentFeeKpis;
  canCollectFee?: boolean;
}

export interface BillingPeriodRow {
  studentBillingPeriodId: number;
  periodKey: string;
  periodLabel: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillingPeriodStatus;
}

export interface PaymentMethod {
  feePaymentMethodId: number;
  name: string;
  description?: string | null;
  status: FeeMasterStatus;
  requiresReference: boolean;
  sortOrder?: number;
}

export interface CollectFeeRequest {
  studentId: number;
  academicYearId: number;
  amount: number;
  paymentMethodId: number;
  paidOn: string;
  referenceNumber?: string | null;
  remarks?: string | null;
}

export interface AllocationPreviewLine {
  studentBillingPeriodId: number;
  periodKey?: string;
  periodLabel: string;
  allocatedAmount: number;
}

export interface AllocationPreview {
  amount: number;
  allocatedAmount: number;
  advanceRemaining: number;
  allocations: AllocationPreviewLine[];
}

export interface CollectFeeResult {
  feePaymentId: number;
  feeReceiptId?: number;
  receiptNumber?: string;
  amount: number;
  allocatedAmount: number;
  advanceRemaining: number;
  allocations: AllocationPreviewLine[];
}

export interface FeeDashboardKpis {
  generated: number;
  collected: number;
  outstanding: number;
  overdue: number;
  canCollectFee?: boolean;
}

export interface OutstandingItem {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className?: string;
  sectionName?: string;
  studentBillingPeriodId: number;
  periodKey: string;
  periodLabel: string;
  dueDate: string;
  balanceAmount: number;
  status: BillingPeriodStatus;
  canCollectFee?: boolean;
}

export interface OutstandingSummary {
  totalOutstanding?: number;
  overdueCount?: number;
  dueCount?: number;
  partiallyPaidCount?: number;
}

export interface FinanceSettings {
  autoGenerateDues: boolean;
  generationLeadDays: number;
  defaultDueDayForNewStructures: number;
  reminderRules?: {
    ruleKey: string;
    enabled: boolean;
    offsetDays: number;
    channelsCsv: string;
  }[];
}

export interface LinkedStudentOption {
  studentId: number;
  studentName: string;
  admissionNumber?: string;
  relationship?: string;
}

export interface FeeReceiptLine {
  feeReceiptLineId: number;
  studentBillingPeriodId?: number;
  periodKey?: string;
  periodLabel: string;
  amount: number;
}

export interface FeeReceipt {
  feeReceiptId: number;
  feePaymentId?: number;
  receiptNumber: string;
  issuedOn: string;
  status: string;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  className?: string;
  sectionName?: string;
  academicYearId?: number;
  academicYearName?: string;
  amount: number;
  paymentMethodName?: string;
  referenceNumber?: string | null;
  remarks?: string | null;
  schoolName?: string;
  schoolLogoUrl?: string | null;
  schoolAddress?: string | null;
  schoolContact?: string | null;
  currencyCode?: string;
  lines?: FeeReceiptLine[];
}

export interface FeePayment {
  feePaymentId: number;
  studentId: number;
  studentName?: string | null;
  admissionNumber?: string | null;
  academicYearId?: number;
  paymentMethodId?: number;
  paymentMethodName?: string;
  amount: number;
  paidOn: string;
  referenceNumber?: string | null;
  remarks?: string | null;
  status: string;
  receiptId?: number | null;
  receiptNumber?: string | null;
  allocations?: AllocationPreviewLine[];
}

export interface CollectionTrendPoint {
  month: string;
  collected: number;
  due: number;
}

export interface PaymentStatusSlice {
  status: string;
  amount: number;
}

export interface AcademicYearOption {
  academicYearId: number;
  name: string;
}

export const FEES_RESOURCES = {
  MANAGEMENT: 'FEES_MANAGEMENT',
  HEADS: 'FEES_HEADS',
  STRUCTURES: 'FEES_STRUCTURES',
  RECEIPTS: 'FEES_RECEIPTS',
  OUTSTANDING: 'FEES_OUTSTANDING',
  COLLECTION: 'FEES_COLLECTION',
  STUDENT_DETAILS: 'FEES_STUDENT_DETAILS',
  SETTINGS: 'FEES_SETTINGS'
} as const;
