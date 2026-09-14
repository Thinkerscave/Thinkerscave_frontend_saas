/** Finance → Payroll frontend models — aligned with backend / DB enums. */

export type PayrollMasterStatus = 'ACTIVE' | 'INACTIVE';
export type PaymentType = 'SALARY' | 'STIPEND';
export type SalaryComponentType = 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
export type CalculationMethod =
  | 'FIXED_AMOUNT'
  | 'PERCENTAGE_OF_BASIC'
  | 'PERCENTAGE_OF_GROSS'
  | 'MANUAL_ENTRY';
export type StatutoryCode = 'PF' | 'ESI' | 'PT' | 'TDS';

export type EmployeePayrollStatus =
  | 'NOT_GENERATED'
  | 'GENERATED'
  | 'PROCESSING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PARTIALLY_PAID'
  | 'PAID';

export type WorkingDaysBasis = 'CALENDAR' | 'WORKING_DAYS';
export type LopHandling = 'DEDUCT_FROM_BASIC' | 'PRORATE_GROSS';
export type SalaryRounding = 'NEAREST_RUPEE' | 'NONE';
export type GenerateScopeType = 'ALL' | 'EMPLOYMENT_CATEGORY' | 'CUSTOM';

export const PAYMENT_TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'SALARY', label: 'Salary' },
  { value: 'STIPEND', label: 'Stipend' }
];

export const COMPONENT_TYPE_LABELS: Record<SalaryComponentType, string> = {
  EARNING: 'Earning',
  DEDUCTION: 'Deduction',
  EMPLOYER_CONTRIBUTION: 'Employer Contribution'
};

export const CALC_METHOD_LABELS: Record<CalculationMethod, string> = {
  FIXED_AMOUNT: 'Fixed Amount',
  PERCENTAGE_OF_BASIC: '% of Basic',
  PERCENTAGE_OF_GROSS: '% of Gross',
  MANUAL_ENTRY: 'Manual Entry'
};

export const EMPLOYEE_PAYROLL_STATUS_LABELS: Record<EmployeePayrollStatus, string> = {
  NOT_GENERATED: 'Not generated',
  GENERATED: 'Generated',
  PROCESSING: 'Processing',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid'
};

export const EMPLOYMENT_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'VISITING_FACULTY', label: 'Visiting Faculty' }
];

export const PAYROLL_RESOURCES = {
  OVERVIEW: 'PAYROLL',
  COMPONENTS: 'PAYROLL_COMPONENTS',
  STRUCTURES: 'PAYROLL_STRUCTURES',
  EMPLOYEE_SALARY: 'PAYROLL_EMPLOYEE_SALARY',
  RUN: 'PAYROLL_RUN',
  PAYMENT: 'PAYROLL_PAYMENT',
  PAYSLIP: 'PAYROLL_PAYSLIP',
  SETTINGS: 'PAYROLL_SETTINGS',
  MY: 'PAYROLL_MY'
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

export interface PayrollOverviewKpis {
  /** Backend fields */
  totalStaff?: number;
  generatedCount?: number;
  pendingApprovalCount?: number;
  approvedCount?: number;
  partiallyPaidCount?: number;
  paidCount?: number;
  notGeneratedCount?: number;
  totalNetAmount?: number;
  totalPaidAmount?: number;
  runId?: number | null;
  runStatus?: string | null;
  periodLabel?: string;
  year?: number;
  month?: number;
  /** UI aliases (optional) */
  totalEmployees?: number;
  generated?: number;
  pendingApproval?: number;
  paymentPending?: number;
  paid?: number;
}

export interface PayrollActivityItem {
  activityId?: number | string;
  action?: string;
  description?: string;
  actorName?: string;
  occurredOn?: string;
}

export interface PayrollEmployeeListItem {
  staffId: number;
  staffName?: string;
  staffCode?: string | null;
  employeeName?: string;
  employeeCode?: string | null;
  designation?: string | null;
  employmentCategory?: string | null;
  paymentType?: PaymentType | null;
  employeePayrollId?: number | null;
  payrollRunId?: number | null;
  grossAmount?: number | null;
  totalDeductions?: number | null;
  netAmount?: number | null;
  status: EmployeePayrollStatus | 'NOT_GENERATED' | string;
  payslipDocumentId?: number | null;
  salaryConfigured?: boolean;
}

export interface SalaryComponent {
  salaryComponentId: number;
  code: string;
  name: string;
  componentType: SalaryComponentType;
  calculationMethod: CalculationMethod;
  defaultValue?: number | null;
  statutoryCode?: StatutoryCode | null;
  status: PayrollMasterStatus;
  sortOrder?: number;
}

export interface SalaryComponentRequest {
  code: string;
  name: string;
  componentType: SalaryComponentType;
  calculationMethod: CalculationMethod;
  defaultValue?: number | null;
  statutoryCode?: StatutoryCode | null;
  status: PayrollMasterStatus;
  sortOrder?: number;
}

export interface SalaryStructureItem {
  salaryStructureItemId?: number;
  salaryComponentId: number;
  salaryComponentName?: string;
  componentType?: SalaryComponentType;
  calculationMethod: CalculationMethod;
  value: number;
}

export interface SalaryStructure {
  salaryStructureId: number;
  name: string;
  description?: string | null;
  applicableStaffType?: string | null;
  status: PayrollMasterStatus;
  items?: SalaryStructureItem[];
}

export interface SalaryStructureRequest {
  name: string;
  description?: string | null;
  applicableStaffType?: string | null;
  status: PayrollMasterStatus;
  items: SalaryStructureItem[];
}

export interface EmployeeSalaryLine {
  employeeSalaryComponentId?: number;
  salaryComponentId: number;
  salaryComponentCode?: string;
  salaryComponentName?: string;
  componentType: SalaryComponentType;
  calculationMethod: CalculationMethod;
  value: number;
  applicable: boolean;
}

export interface EmployeeSalary {
  employeeSalaryId: number;
  staffId: number;
  employeeName?: string;
  employeeCode?: string | null;
  designation?: string | null;
  paymentType: PaymentType;
  salaryStructureId?: number | null;
  salaryStructureName?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  active: boolean;
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  remarks?: string | null;
  lines?: EmployeeSalaryLine[];
  grossPreview?: number | null;
}

export interface EmployeeSalaryRequest {
  paymentType: PaymentType;
  salaryStructureId?: number | null;
  effectiveFrom: string;
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  remarks?: string | null;
  lines: EmployeeSalaryLine[];
}

export interface EmployeePayrollLine {
  employeePayrollLineId?: number;
  salaryComponentId?: number | null;
  componentCode: string;
  componentName: string;
  componentType: SalaryComponentType;
  calculationMethod?: CalculationMethod;
  rateOrPercent?: number | null;
  amount: number;
  sortOrder?: number;
}

export interface PayrollPayment {
  payrollPaymentId: number;
  employeePayrollId: number;
  amount: number;
  paidOn: string;
  paymentMethodId?: number | null;
  paymentMethodCode?: string | null;
  paymentMethodName?: string | null;
  reference?: string | null;
  remarks?: string | null;
}

export interface EmployeePayrollDetail {
  employeePayrollId: number;
  payrollRunId: number;
  staffId: number;
  employeeName?: string;
  employeeCode?: string | null;
  designation?: string | null;
  employmentCategory?: string | null;
  payrollYear: number;
  payrollMonth: number;
  paymentType: PaymentType;
  workingDays?: number | null;
  presentDays?: number | null;
  paidLeaveDays?: number | null;
  lopDays?: number | null;
  grossAmount: number;
  totalDeductions: number;
  netAmount: number;
  paidAmount?: number | null;
  remainingAmount?: number | null;
  status: EmployeePayrollStatus;
  payslipDocumentId?: number | null;
  payslipNumber?: string | null;
  lines?: EmployeePayrollLine[];
  payments?: PayrollPayment[];
}

export interface PayrollRunSummary {
  totalEmployees?: number;
  totalGross?: number;
  totalDeductions?: number;
  totalNet?: number;
  pendingApproval?: number;
  approved?: number;
  paid?: number;
  partiallyPaid?: number;
}

export interface PayrollApprovalEvent {
  eventId?: number | string;
  action: string;
  actorName?: string;
  remarks?: string | null;
  occurredOn?: string;
}

export interface PayrollRunDetail {
  payrollRunId: number;
  payrollYear: number;
  payrollMonth: number;
  status: EmployeePayrollStatus | string;
  generatedOn?: string | null;
  approvedOn?: string | null;
  approvedBy?: string | null;
  returnedOn?: string | null;
  notes?: string | null;
  summary?: PayrollRunSummary | null;
  employees?: EmployeePayrollDetail[];
  approvalHistory?: PayrollApprovalEvent[];
  paymentHistory?: PayrollPayment[];
}

export interface LopOverride {
  staffId: number;
  lopDays: number;
}

export interface GeneratePayrollRequest {
  year: number;
  month: number;
  notes?: string | null;
  scopeType: GenerateScopeType;
  employmentCategories?: string[];
  staffIds?: number[];
  lopOverrides?: LopOverride[];
}

export interface GeneratePayrollResult {
  payrollRunId: number;
  year: number;
  month: number;
  generatedCount: number;
  skippedCount: number;
  skipped?: { staffId: number; employeeName?: string; reason?: string }[];
  summary?: PayrollRunSummary;
}

export interface RecordPaymentRequest {
  amount: number;
  paidOn: string;
  paymentMethodId?: number | null;
  paymentMethodCode?: string | null;
  reference?: string | null;
  remarks?: string | null;
}

export interface PayrollSettings {
  payrollConfigurationId?: number;
  frequency: 'MONTHLY';
  defaultGenerationDay: number;
  approvalRequired: boolean;
  defaultPaymentMethodId?: number | null;
  pfEnabled: boolean;
  esiEnabled: boolean;
  professionalTaxEnabled: boolean;
  tdsEnabled: boolean;
  workingDaysBasis: WorkingDaysBasis;
  includePaidLeave: boolean;
  lopHandling: LopHandling;
  salaryRounding: SalaryRounding;
  payslipNumberFormat?: string | null;
  payslipOrgName?: string | null;
  showOrgLogo: boolean;
  showAuthorizedSignatory: boolean;
}

export interface MyPayrollSummary {
  staffId: number;
  employeeName?: string;
  salaryConfigured: boolean;
  current?: {
    employeePayrollId?: number | null;
    year: number;
    month: number;
    status: EmployeePayrollStatus;
    grossAmount?: number | null;
    totalDeductions?: number | null;
    netAmount?: number | null;
    paidOn?: string | null;
    paymentMethodName?: string | null;
    payslipDocumentId?: number | null;
    payslipAvailable?: boolean;
  } | null;
  latestPayslip?: {
    employeePayrollId: number;
    year: number;
    month: number;
    payslipNumber?: string | null;
  } | null;
  adminContactEmail?: string | null;
}

export interface MyPayrollHistoryItem {
  employeePayrollId: number;
  year: number;
  month: number;
  status: EmployeePayrollStatus;
  paidOn?: string | null;
  payslipDocumentId?: number | null;
  payslipAvailable?: boolean;
  netAmount?: number | null;
}

export interface PaymentMethodOption {
  feePaymentMethodId: number;
  name: string;
  status?: string;
  requiresReference?: boolean;
}

export function payrollStatusTone(status: string | null | undefined): string {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'APPROVED':
      return 'primary';
    case 'PENDING_APPROVAL':
    case 'PARTIALLY_PAID':
      return 'warning';
    case 'GENERATED':
      return 'info';
    case 'NOT_GENERATED':
    default:
      return 'muted';
  }
}

export function payrollStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return EMPLOYEE_PAYROLL_STATUS_LABELS[status as EmployeePayrollStatus] ?? status.replace(/_/g, ' ');
}

export function monthLabel(year: number, month: number): string {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[month - 1] || month} ${year}`;
}
