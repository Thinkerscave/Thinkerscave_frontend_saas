/**
 * Spec-aligned admissions workspace types.
 * Mirror of the backend DTOs returned by
 * `/api/v1/admissions/workspace/*` and `/api/v1/admissions/*`.
 */

export type CanonicalInquiryStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'COUNSELING'
  | 'DOCUMENTS_PENDING'
  | 'FOLLOW_UP_REQUIRED'
  | 'READY_FOR_ADMISSION'
  | 'CONVERTED'
  | 'LOST'
  | 'CLOSED';

export type FollowUpType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'WALK_IN' | 'SMS' | 'OTHER';

export type ApplicationStatusCode =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_REVIEW';

export interface InquiryKpi {
  newInquiries: number;
  todaysFollowUps: number;
  interested: number;
  admissionReady: number;
  futureProspects: number;
  closed: number;
}

export interface InquiryQuickActions {
  todaysCalls: number;
  todaysMeetings: number;
  overdueFollowUps: number;
  admissionReady: number;
}

export interface InquirySearchRequest {
  keyword?: string | null;
  status?: CanonicalInquiryStatus | null;
  counselorId?: number | null;
  inquirySource?: string | null;
  classInterested?: string | null;
  followUpFrom?: string | null;
  followUpTo?: string | null;
}

export interface InquiryRecord {
  inquiryId: number;
  name: string;
  mobileNumber: string;
  email?: string | null;
  classInterested: string;
  address?: string | null;
  inquirySource: string;
  referredBy?: string | null;
  comments?: string | null;
  assignedCounselor?: string | null;
  status: CanonicalInquiryStatus;
  lastFollowUpDate?: string | null;
  lastFollowUpType?: FollowUpType | null;
  nextFollowUpDate?: string | null;
}

export interface FollowUpRecord {
  id: number;
  inquiryId: number;
  followUpType: FollowUpType;
  remarks: string;
  statusAfterFollowUp: CanonicalInquiryStatus;
  followUpDate: string;
  nextFollowUpDate?: string | null;
  createdBy?: string | null;
}

export interface CounselingNote {
  id: number;
  inquiryId: number;
  studentRequirements?: string | null;
  parentConcerns?: string | null;
  campusVisitInfo?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface CounselingNoteRequest {
  studentRequirements?: string | null;
  parentConcerns?: string | null;
  campusVisitInfo?: string | null;
  recommendations?: string | null;
  notes?: string | null;
}

export interface InquiryTimelineEntry {
  action: string;
  description?: string | null;
  performedBy: string;
  performedAt: string;
  icon?: string | null;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' | null;
}

export interface InquiryFullDetail {
  overview: InquiryRecord;
  followUps: FollowUpRecord[];
  counselingNotes: CounselingNote[];
  uploadedDocuments: string[];
  missingDocuments: string[];
  timeline: InquiryTimelineEntry[];
}

export interface AdmissionKpi {
  inProgress: number;
  documentsPending: number;
  verificationPending: number;
  readyToEnroll: number;
  completed: number;
}

export interface AdmissionSearchRequest {
  keyword?: string | null;
  admissionId?: string | null;
  studentName?: string | null;
  mobileNumber?: string | null;
  parentName?: string | null;
  status?: ApplicationStatusCode | null;
  classApplied?: string | null;
}

export interface AdmissionAddressDto {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
}

export interface AdmissionEmergencyContactDto {
  name?: string | null;
  number?: string | null;
}

export interface AdmissionRecord {
  applicationId: string;
  applicantName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  applyingForSchoolOrCollege?: string | null;
  parentName?: string | null;
  guardianName?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  address?: AdmissionAddressDto | null;
  emergencyContact?: AdmissionEmergencyContactDto | null;
  uploadedDocuments?: string[] | null;
  status?: ApplicationStatusCode | null;
  internalComments?: string | null;
}

export interface AdmissionProgress {
  applicationId: string;
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  completedSteps: number[];
  pendingFields: string[];
  status: string;
}

export interface SettingsOption {
  code: string;
  label: string;
  description?: string | null;
  active: boolean;
}

export interface AdmissionConfig {
  autoInquiryNumber: boolean;
  autoAdmissionNumber: boolean;
  admissionNumberPattern: string;
  studentIdPattern: string;
  defaultAdmissionStatus: string;
}

export interface CounselorAssignmentRules {
  strategy: string;
  balanceWorkload: boolean;
  considerLocation: boolean;
}

export interface AdmissionsSettings {
  inquirySources: SettingsOption[];
  inquiryStatuses: SettingsOption[];
  requiredDocuments: SettingsOption[];
  admissionConfig: AdmissionConfig;
  counselorRules: CounselorAssignmentRules;
}

export interface AdmissionWizardPayload {
  applicationId?: string;
  applicantName?: string;
  dateOfBirth?: string;
  gender?: string;
  applyingForSchoolOrCollege?: string;
  parentName?: string;
  guardianName?: string;
  contactNumber?: string;
  email?: string;
  address?: AdmissionAddressDto;
  emergencyContact?: AdmissionEmergencyContactDto;
  uploadedDocuments?: string[];
  internalComments?: string;
  status?: ApplicationStatusCode;
}
