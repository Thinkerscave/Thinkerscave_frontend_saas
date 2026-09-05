/** Admissions CRM types aligned with backend DTOs under /api/v1/admissions */

export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'INTERESTED' | 'MEETING_SCHEDULED'
  | 'APPLICATION_STARTED' | 'APPLICATION_SUBMITTED' | 'COUNSELING'
  | 'DOCUMENTS_PENDING' | 'FOLLOW_UP_REQUIRED' | 'READY_FOR_ADMISSION'
  | 'CONVERTED' | 'LOST' | 'CLOSED';

export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENTS_PENDING' | 'FEE_PENDING'
  | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ENROLLED';

export type FollowUpType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'WALK_IN' | 'SMS' | 'OTHER';
export type FollowUpLifecycleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type DocumentCheckStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'MISSING';
export type FeePaymentStatus = 'PENDING' | 'PAID' | 'WAIVED';

export interface LookupOption {
  id: number;
  name: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LeadKpi {
  newInquiries: number;
  todaysFollowUps: number;
  interested: number;
  admissionReady: number;
  futureProspects: number;
  closed: number;
  applicationsStarted?: number;
  lostLeads?: number;
}

export interface LeadQuickActions {
  overdue?: number;
  dueToday?: number;
  dueTomorrow?: number;
  dueThisWeek?: number;
  todaysCalls: number;
  todaysMeetings: number;
  overdueFollowUps: number;
  admissionReady: number;
}

export interface LeadSearchRequest {
  keyword?: string | null;
  status?: LeadStatus | null;
  counselorId?: number | null;
  source?: string | null;
  inquirySource?: string | null;
  classInterestedIn?: string | null;
  classInterested?: string | null;
  academicYearId?: number | null;
  classId?: number | null;
  followUpFrom?: string | null;
  followUpTo?: string | null;
}

export interface LeadRecord {
  inquiryId: number;
  inquiryNumber?: string | null;
  name: string;
  mobileNumber: string;
  email?: string | null;
  classInterestedIn: string;
  academicYearId?: number | null;
  classId?: number | null;
  address?: string | null;
  inquirySource?: string | null;
  referredBy?: string | null;
  comments?: string | null;
  assignedCounselorId?: number | null;
  assignedCounselorName?: string | null;
  status: LeadStatus;
  lastFollowUpDate?: string | null;
  lastFollowUpType?: FollowUpType | null;
  nextFollowUpDate?: string | null;
  createdOn?: string | null;
  createdBy?: string | null;
}

export interface LeadCreateRequest {
  name: string;
  mobileNumber: string;
  email?: string | null;
  classInterestedIn: string;
  academicYearId?: number | null;
  classId?: number | null;
  address?: string | null;
  inquirySource?: string | null;
  referredBy?: string | null;
  comments?: string | null;
  assignedCounselorId?: number | null;
  nextFollowUpDate?: string | null;
}

export interface FollowUpRecord {
  followUpId: number;
  inquiryId: number;
  followUpType: FollowUpType;
  remarks?: string | null;
  statusAfter?: LeadStatus | null;
  followUpDate?: string | null;
  nextFollowUpDate?: string | null;
  lifecycleStatus?: FollowUpLifecycleStatus | null;
  outcome?: string | null;
  completedOn?: string | null;
  completedBy?: string | null;
  leadName?: string | null;
  inquiryNumber?: string | null;
  createdOn?: string | null;
  createdBy?: string | null;
}

export interface FollowUpCreateRequest {
  followUpType: FollowUpType;
  remarks?: string | null;
  statusAfter?: LeadStatus | null;
  followUpDate?: string | null;
  nextFollowUpDate?: string | null;
}

export interface CompleteFollowUpRequest {
  outcome?: string | null;
  remarks?: string | null;
  statusAfter?: LeadStatus | null;
  nextFollowUpDate?: string | null;
}

export interface CounselingNote {
  noteId?: number;
  inquiryId?: number;
  studentRequirements?: string | null;
  parentConcerns?: string | null;
  campusVisitInfo?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdOn?: string | null;
}

export interface CounselingNoteRequest {
  studentRequirements?: string | null;
  parentConcerns?: string | null;
  campusVisitInfo?: string | null;
  recommendations?: string | null;
  notes?: string | null;
}

export interface LeadTimelineItem {
  eventType?: string | null;
  action?: string | null;
  title?: string | null;
  description?: string | null;
  performedBy?: string | null;
  performedOn?: string | null;
  performedAt?: string | null;
  icon?: string | null;
  tone?: string | null;
}

export interface LeadFullDetail {
  inquiry: LeadRecord;
  followUps: FollowUpRecord[];
  counselingNotes: CounselingNote[];
  timeline: LeadTimelineItem[];
  applicationId?: number | null;
  applicationNumber?: string | null;
  applicationStatus?: string | null;
  studentId?: number | null;
  studentCode?: string | null;
  admissionNumber?: string | null;
}

export interface ApplicationProfileDetails {
  bloodGroup?: string | null;
  religion?: string | null;
  category?: string | null;
  nationality?: string | null;
  aadhaarNumber?: string | null;
  motherTongue?: string | null;
  placeOfBirth?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  previousSchoolName?: string | null;
  previousBoard?: string | null;
  previousClass?: string | null;
  lastPercentage?: string | null;
  tcNumber?: string | null;
  mediumOfInstruction?: string | null;
  firstLanguage?: string | null;
  siblingName?: string | null;
}

export interface ApplicationSearchRequest {
  keyword?: string | null;
  admissionId?: string | null;
  studentName?: string | null;
  mobileNumber?: string | null;
  parentName?: string | null;
  status?: ApplicationStatus | null;
  statuses?: ApplicationStatus[] | null;
  classApplied?: string | null;
}

export interface ApplicationDocument {
  documentId: number;
  applicationId: number;
  documentType: string;
  originalName?: string | null;
  status: DocumentCheckStatus;
  remarks?: string | null;
  createdOn?: string | null;
  createdBy?: string | null;
}

export interface ApplicationRecord {
  applicationId: number;
  applicationNumber?: string | null;
  inquiryId?: number | null;
  applicantName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  applyingForClass?: string | null;
  academicYearId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
  studentId?: number | null;
  studentCode?: string | null;
  admissionNumber?: string | null;
  email?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentContact?: string | null;
  parentEmail?: string | null;
  profile?: ApplicationProfileDetails | null;
  status: ApplicationStatus;
  internalComments?: string | null;
  uploadedDocuments?: string[] | null;
  documents?: ApplicationDocument[] | null;
  feeAmount?: number | null;
  feeReceiptNumber?: string | null;
  feePaymentMode?: string | null;
  feePaidOn?: string | null;
  feeReceivedBy?: string | null;
  feeRemarks?: string | null;
  feeStatus?: FeePaymentStatus | null;
  reviewedByUserId?: number | null;
  reviewedOn?: string | null;
  createdOn?: string | null;
  createdBy?: string | null;
}

export interface ApplicationCreateRequest {
  applicantName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  applyingForClass?: string | null;
  academicYearId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
  email?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentContact?: string | null;
  parentEmail?: string | null;
  internalComments?: string | null;
  inquiryId?: number | null;
  profile?: ApplicationProfileDetails | null;
}

export interface RecordFeeRequest {
  amount: number;
  receiptNumber: string;
  paymentMode: string;
  paidOn?: string | null;
  receivedBy?: string | null;
  remarks?: string | null;
  paymentStatus?: FeePaymentStatus | null;
}

export interface EnrollApplicationRequest {
  academicYearId: number;
  classId: number;
  sectionId?: number | null;
}

export interface EnrollmentResult {
  applicationId: number;
  applicationNumber?: string | null;
  studentId: number;
  studentCode?: string | null;
  admissionNumber?: string | null;
  studentName?: string | null;
  academicYearId?: number | null;
  classId?: number | null;
  sectionId?: number | null;
}

export interface ApplicationProgress {
  applicationId: number;
  applicationNumber?: string | null;
  status: ApplicationStatus;
  totalSteps: number;
  completedSteps: number;
  completionPercent: number;
}

export interface AdmissionsSettings {
  inquirySources: string[];
  inquiryStatuses: string[];
  requiredDocuments: string[];
  numbering: Record<string, string>;
  reminderRules: Record<string, string>;
  assignmentMode?: string | null;
}

export interface CounselorOption {
  staffId: number;
  fullName: string;
  designation?: string | null;
  staffType?: string | null;
  email?: string | null;
}

export type AdmissionsWorkspacePage =
  | 'overview' | 'leads' | 'follow-ups' | 'applications' | 'reports' | 'settings';

export interface AdmissionsPageConfig {
  page: AdmissionsWorkspacePage;
  label: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}
