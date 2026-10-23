/**
 * Staff Module — TypeScript Models
 * Mirrors the new backend Staff DTOs exactly.
 * File: staff.model.ts
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type StaffType = 'TEACHING' | 'NON_TEACHING';
export type EmploymentCategory = 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'PART_TIME' | 'VISITING_FACULTY';
export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'RESIGNED' | 'RETIRED' | 'CONTRACT_COMPLETED';

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

  createdOn?: string;
  updatedOn?: string;

  presentAddress?: StaffAddress;
  permanentAddress?: StaffAddress;
  sameAsPresentAddress?: boolean;
  /** Masked bank details (account number is never returned). */
  bankDetails?: StaffBankDetails | null;

  responsibilities?: ResponsibilityAssignment[];
  documents?: StaffDocumentResponse[];
  primarySubject?: StaffSubjectRef | null;
  secondarySubject?: StaffSubjectRef | null;
}

export interface StaffSubjectRef {
  subjectId: number;
  name: string;
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
  presentAddress?: StaffAddress;
  permanentAddress?: StaffAddress;
  sameAsPresentAddress?: boolean;
  bankDetails?: StaffBankDetailsRequest;
  primarySubjectId?: number;
  secondarySubjectId?: number;
}

/** Religion stays on existing records for edits even though the create form no longer shows it. */
export interface StaffUpdateRequest extends StaffCreateRequest {
  religion?: string;
}

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

// ─── Create Response ───────────────────────────────────────────────────────────────

export interface StaffCreateResponse {
  staffId: number;
  staffCode: string;
}
