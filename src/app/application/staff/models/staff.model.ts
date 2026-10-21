/**
 * Staff Module — TypeScript Models
 * Mirrors the new backend Staff DTOs exactly.
 * File: staff.model.ts
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type StaffType = 'TEACHING' | 'NON_TEACHING';
export type EmploymentCategory = 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME' | 'VISITING_FACULTY';
export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'RESIGNED' | 'RETIRED' | 'CONTRACT_COMPLETED';
export type SalaryType = 'MONTHLY' | 'DAILY_WAGE';
export type PayrollStatus = 'GENERATED' | 'PAID' | 'PENDING' | 'CANCELLED';

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ─── Staff Dashboard ─────────────────────────────────────────────────────────

export interface StaffDashboard {
  totalStaff: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  activeStaff: number;
  temporaryStaff: number;
  contractStaff: number;
}

// ─── Staff Summary (list view) ───────────────────────────────────────────────

export interface StaffSummary {
  staffId: number;
  staffCode: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  photoUrl?: string;
  staffType: StaffType;
  designation: string;
  employmentCategory: EmploymentCategory;
  employmentStatus: EmploymentStatus;
  joiningDate: string;
  active: boolean;
}

// ─── Staff Detail (360 profile) ──────────────────────────────────────────────

export interface SalarySummary {
  salaryStructureId: number;
  salaryType: SalaryType;
  grossSalary: number;
  effectiveFrom: string;
}

export interface PayrollSummaryDetail {
  lastPayrollMonth: string;
  lastNetSalary: number;
  lastPayrollStatus: PayrollStatus;
}

export interface StaffDetail {
  staffId: number;
  staffCode: string;
  userId?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  mobileNumber: string;
  email: string;
  photoUrl?: string;

  staffType: StaffType;
  designation: string;
  employmentCategory: EmploymentCategory;
  employmentStatus: EmploymentStatus;
  joiningDate: string;
  contractStartDate?: string;
  contractEndDate?: string;
  highestQualification?: string;
  experienceYears?: number;

  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;

  active: boolean;
  remarks?: string;

  createdOn?: string;
  updatedOn?: string;

  presentAddress?: StaffAddress;
  permanentAddress?: StaffAddress;
  sameAsPresentAddress?: boolean;
  /** Masked bank details (account number is never returned). */
  bankDetails?: StaffBankDetails | null;

  salarySummary?: SalarySummary;
  responsibilities?: ResponsibilityAssignment[];
  payrollSummary?: PayrollSummaryDetail;
  documents?: StaffDocumentResponse[];
}

// ─── Address / Bank ──────────────────────────────────────────────────────────

export interface StaffAddress {
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface StaffBankDetailsRequest {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
}

/** Masked view returned by GET /staff/{id}/bank-details. Account number is never returned in full. */
export interface StaffBankDetails {
  staffId: number;
  bankName?: string;
  accountHolderName?: string;
  maskedAccountNumber?: string;
  ifscCode?: string;
  updatedOn?: string;
}

// ─── Staff Create / Update Requests ─────────────────────────────────────────

export interface StaffCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  mobileNumber: string;
  email: string;
  staffType: StaffType;
  designation: string;
  employmentCategory: EmploymentCategory;
  employmentStatus: EmploymentStatus;
  joiningDate: string;
  highestQualification?: string;
  experienceYears?: number;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  remarks?: string;
  presentAddress?: StaffAddress;
  permanentAddress?: StaffAddress;
  sameAsPresentAddress?: boolean;
  bankDetails?: StaffBankDetailsRequest;
}

export type StaffUpdateRequest = StaffCreateRequest;

// ─── Responsibility ───────────────────────────────────────────────────────────

export interface Responsibility {
  responsibilityId: number;
  responsibilityCode: string;
  responsibilityName: string;
  description?: string;
  displayOrder?: number;
  systemDefined?: boolean;
  organizationEditable?: boolean;
  definitionLocked?: boolean;
  active: boolean;
  remarks?: string;
  createdOn?: string;
  updatedOn?: string;
}

export interface ResponsibilityRequest {
  responsibilityCode: string;
  responsibilityName: string;
  description?: string;
  displayOrder?: number;
  remarks?: string;
}

// ─── Responsibility Assignment ────────────────────────────────────────────────

export interface ResponsibilityAssignment {
  assignmentId: number;
  staffId: number;
  staffName?: string;
  staffCode?: string;
  userId?: number | null;
  responsibilityId: number;
  responsibilityCode?: string;
  responsibilityName: string;
  scope?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  remarks?: string;
  createdOn?: string;
}

export interface ResponsibilityAssignmentRequest {
  staffId: number;
  responsibilityId: number;
  scope?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  remarks?: string;
}

// ─── Salary Structure ─────────────────────────────────────────────────────────

export interface SalaryStructure {
  salaryStructureId: number;
  staffId: number;
  staffName?: string;
  staffCode?: string;
  salaryType: SalaryType;
  basicPay?: number;
  hra?: number;
  da?: number;
  specialAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  pfEmployee?: number;
  esiEmployee?: number;
  professionalTax?: number;
  otherDeduction?: number;
  totalStatutoryDeductions?: number;
  grossSalary: number;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  createdOn?: string;
}

export interface SalaryStructureRequest {
  staffId: number;
  salaryType: SalaryType;
  basicPay?: number;
  hra?: number;
  da?: number;
  specialAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  pfEmployee?: number;
  esiEmployee?: number;
  professionalTax?: number;
  otherDeduction?: number;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  effectiveFrom: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface StaffActivity {
  activityId: number;
  actionType: string;
  section?: string;
  description: string;
  performedBy?: string;
  performedOn: string;
}

/** Document types accepted by POST /staff/{id}/documents. Profile photo is managed separately. */
export const STAFF_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'AADHAR', label: 'Aadhaar' },
  { value: 'PAN', label: 'PAN' },
  { value: 'RESUME', label: 'Resume / CV' },
  { value: 'QUALIFICATION', label: 'Qualification Certificate' },
  { value: 'EXPERIENCE', label: 'Experience Letter' },
  { value: 'OTHER', label: 'Other' }
];

export interface StaffDocumentResponse {
  documentId: number;
  ownerType: string;
  ownerId: number;
  documentType: string;
  documentName: string;
  fileName: string;
  fileExtension?: string;
  fileSize?: number;
  mimeType?: string;
  active: boolean;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export interface PayrollDashboard {
  currentMonth?: string;
  totalStaff: number;
  generatedPayroll: number;
  pendingPayroll: number;
  paidPayroll: number;
  /** Computed client-side from payroll list when not returned by API */
  totalAmount?: number;
}

export interface Payroll {
  payrollId: number;
  staffId: number;
  staffName: string;
  staffCode: string;
  payrollYear: number;
  payrollMonth: number;
  workingDays?: number;
  presentDays?: number;
  leaveWithoutPayDays?: number;
  grossSalary: number;
  pfAmount?: number;
  esiAmount?: number;
  professionalTaxAmount?: number;
  otherDeductionAmount?: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  generatedOn?: string;
  paidOn?: string;
  remarks?: string;
}

export interface PayrollGenerateRequest {
  year: number;
  month: number;
}

export interface PayrollGenerateResult {
  generatedRecords: number;
  skippedAlreadyExists: number;
  skippedNoSalaryStructure: string[];
  tenantIdentifier?: string;
}

export interface BulkMarkPaidRequest {
  payrollIds: number[];
}

// ─── Filter/Search Params ─────────────────────────────────────────────────────

export interface StaffFilterParams {
  staffType?: StaffType;
  employmentCategory?: EmploymentCategory;
  employmentStatus?: EmploymentStatus;
  designation?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface PayrollFilterParams {
  year?: number;
  month?: number;
  status?: PayrollStatus;
  staffId?: number;
  page?: number;
  size?: number;
}

// ─── Create Response ──────────────────────────────────────────────────────────

export interface StaffCreateResponse {
  staffId: number;
  staffCode: string;
}
