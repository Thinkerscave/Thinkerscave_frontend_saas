/** Admissions CRM types aligned with backend DTOs under /api/v1/admissions */

export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'INTERESTED'
  | 'APPLICATION_STARTED' | 'APPLICATION_SUBMITTED'
  | 'LOST';

export type LeadSource =
  | 'WEBSITE' | 'PHONE' | 'WALK_IN' | 'REFERRAL' | 'WHATSAPP'
  | 'SOCIAL_MEDIA' | 'CAMPAIGN' | 'AFFILIATE' | 'IMPORT' | 'OTHER';

export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACTION_REQUIRED'
  | 'DOCUMENTS_PENDING' | 'FEE_PENDING'
  | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ENROLLED';

export type FollowUpType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'WALK_IN' | 'SMS' | 'OTHER';
export type FollowUpLifecycleStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type DocumentCheckStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'MISSING';
export type FeePaymentStatus = 'PENDING' | 'PAID' | 'WAIVED';

export interface LookupOption {
  id: number;
  name: string;
  /** Academic year status when present (e.g. CURRENT). */
  status?: string | null;
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
  source?: LeadSource | null;
  inquirySource?: LeadSource | null;
  classInterestedIn?: string | null;
  classInterested?: string | null;
  academicYearId?: number | null;
  classId?: number | null;
  followUpFrom?: string | null;
  followUpTo?: string | null;
  scope?: 'MY' | 'ALL' | null;
}

export interface LeadRecord {
  inquiryId: number;
  inquiryNumber?: string | null;
  name: string;
  studentName?: string | null;
  parentContactName?: string | null;
  mobileNumber: string;
  email?: string | null;
  classInterestedIn: string;
  academicYearId?: number | null;
  classId?: number | null;
  address?: string | null;
  inquirySource?: LeadSource | null;
  referredBy?: string | null;
  comments?: string | null;
  assignedCounselorId?: number | null;
  assignedCounselorName?: string | null;
  assignedOn?: string | null;
  status: LeadStatus;
  lastFollowUpDate?: string | null;
  lastFollowUpType?: FollowUpType | null;
  nextFollowUpDate?: string | null;
  createdOn?: string | null;
  createdBy?: string | null;
  // Progressive enrichment — filled in later via Lead 360, never required at creation.
  dateOfBirth?: string | null;
  gender?: string | null;
  currentClass?: string | null;
  previousSchool?: string | null;
  alternateMobileNumber?: string | null;
  contactRelationship?: string | null;
  campusPreference?: string | null;
  transportRequired?: string | null;
  hostelRequired?: string | null;
  otherRequirements?: string | null;
}

export interface LeadCreateRequest {
  name: string;
  parentContactName: string;
  mobileNumber: string;
  email?: string | null;
  classInterestedIn: string;
  academicYearId?: number | null;
  classId?: number | null;
  address?: string | null;
  inquirySource?: LeadSource | null;
  referredBy?: string | null;
  comments?: string | null;
  assignedCounselorId?: number | null;
  nextFollowUpDate?: string | null;
  allowPotentialDuplicate?: boolean | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  currentClass?: string | null;
  previousSchool?: string | null;
  alternateMobileNumber?: string | null;
  contactRelationship?: string | null;
  campusPreference?: string | null;
  transportRequired?: string | null;
  hostelRequired?: string | null;
  otherRequirements?: string | null;
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
  sessionAt?: string | null;
  mode?: FollowUpType | null;
  counselorStaffId?: number | null;
  counselorName?: string | null;
  studentRequirements?: string | null;
  parentConcerns?: string | null;
  campusVisitInfo?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdOn?: string | null;
}

export interface CounselingNoteRequest {
  sessionAt?: string | null;
  mode: FollowUpType;
  counselorStaffId?: number | null;
  studentRequirements?: string | null;
  parentConcerns?: string | null;
  campusVisitInfo?: string | null;
  recommendations?: string | null;
  notes: string;
  /** Optional lead status update applied with this counseling note. */
  leadStatus?: LeadStatus | null;
  /** Optional next planned follow-up datetime; creates a scheduled follow-up. */
  nextFollowUpAt?: string | null;
  /** Optional pending follow-up to mark completed with this note. */
  followUpId?: number | null;
}

export type LeadActivityCategory = 'LEAD' | 'ASSIGNMENT' | 'FOLLOW_UP' | 'COUNSELING' | 'APPLICATION' | 'STATUS' | 'OTHER';

export interface LeadTimelineItem {
  eventType?: string | null;
  action?: string | null;
  category?: LeadActivityCategory | string | null;
  title?: string | null;
  description?: string | null;
  performedBy?: string | null;
  performedOn?: string | null;
  performedAt?: string | null;
  icon?: string | null;
  tone?: string | null;
}

export interface LeadActivityFilter {
  type?: string | null;
  from?: string | null;
  to?: string | null;
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
  identityDocumentType?: string | null;
  identityDocumentNumber?: string | null;
  /** @deprecated prefer identityDocumentNumber */
  aadhaarNumber?: string | null;
  motherTongue?: string | null;
  placeOfBirth?: string | null;

  parentRelationship?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  motherContact?: string | null;
  motherEmail?: string | null;
  motherRelationship?: string | null;
  secondaryGuardianName?: string | null;
  secondaryGuardianRelationship?: string | null;
  secondaryGuardianMobile?: string | null;
  secondaryGuardianEmail?: string | null;
  secondaryGuardianOccupation?: string | null;
  secondaryIdentityDocumentType?: string | null;
  secondaryIdentityDocumentNumber?: string | null;

  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pinCode?: string | null;
  sameAsPresentAddress?: boolean | null;
  permanentAddressLine1?: string | null;
  permanentAddressLine2?: string | null;
  permanentCity?: string | null;
  permanentState?: string | null;
  permanentCountry?: string | null;
  permanentPinCode?: string | null;

  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactMobile?: string | null;
  emergencyContactAlternateMobile?: string | null;

  hasPreviousSchooling?: boolean | null;
  previousSchoolName?: string | null;
  previousBoard?: string | null;
  previousClass?: string | null;
  previousAcademicYear?: string | null;
  lastPercentage?: string | null;
  tcNumber?: string | null;
  tcDate?: string | null;
  mediumOfInstruction?: string | null;
  firstLanguage?: string | null;
  secondLanguage?: string | null;
  linkedParentId?: number | null;
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
  /** Matches backend ApplicationSearchRequest.applyingForClass */
  applyingForClass?: string | null;
  /** MY = own apps; ALL = org-wide (approvers). Server may force MY. */
  scope?: 'MY' | 'ALL' | null;
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

export interface FamilyMatchResult {
  matched: boolean;
  parentId?: number | null;
  parentName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  students?: Array<{
    studentId: number;
    studentName: string;
    className?: string | null;
    studentCode?: string | null;
  }>;
}

export interface AdmissionsSettings {
  inquirySources: string[];
  inquiryStatuses: string[];
  requiredDocuments: string[];
  optionalDocuments?: string[] | null;
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
  | 'leads' | 'follow-ups' | 'applications' | 'reports' | 'settings';

export interface AdmissionsPageConfig {
  page: AdmissionsWorkspacePage;
  label: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

export interface AdmissionReportFilter {
  academicYearId?: number | null;
  classId?: number | null;
  source?: string | null;
  counselorId?: number | null;
  leadStatus?: string | null;
  applicationStatus?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  trendGranularity?: 'WEEKLY' | 'MONTHLY' | null;
  recentLimit?: number | null;
}

export interface AdmissionReportNamedCount {
  key: string;
  label: string;
  count: number;
  percentOfTotal?: number | null;
}

export interface AdmissionReportKpis {
  totalInquiries: number;
  totalLeads: number;
  applicationsStarted: number;
  applicationsSubmitted: number;
  applicationsApproved: number;
  enrolledStudents: number;
  leadToEnrollmentConversionRate: number;
  pendingActions: number;
  totalInquiriesDeltaPct?: number | null;
  totalLeadsDeltaPct?: number | null;
  applicationsStartedDeltaPct?: number | null;
  applicationsSubmittedDeltaPct?: number | null;
  applicationsApprovedDeltaPct?: number | null;
  enrolledStudentsDeltaPct?: number | null;
  conversionDeltaPts?: number | null;
  pendingActionsDeltaPct?: number | null;
}

export interface AdmissionReportSourceRow {
  key: string;
  label: string;
  leads: number;
  applications: number;
  enrolled: number;
  conversionRate: number;
  percentOfLeads?: number | null;
}

export interface AdmissionReportCounselorRow {
  counselorId?: number | null;
  counselorName: string;
  leads: number;
  applications: number;
  enrolled: number;
  conversionRate: number;
  overdueFollowUps: number;
  dueTodayFollowUps: number;
}

export interface AdmissionReportFollowUpHealth {
  dueToday: number;
  overdue: number;
  upcoming: number;
  completed: number;
  noFollowUp: number;
}

export interface AdmissionReportTrend {
  granularity: string;
  labels: string[];
  inquiries: number[];
  leads: number[];
  applications: number[];
  approved: number[];
  enrolled: number[];
}

export interface AdmissionReportRecentRow {
  applicationId: number;
  applicantName: string;
  applyingForClass?: string | null;
  source?: string | null;
  counselorName?: string | null;
  applicationDate?: string | null;
  status: string;
  documentsUploaded: number;
  documentsVerified: number;
  inquiryId?: number | null;
}

export interface AdmissionReportDashboard {
  generatedAt?: string | null;
  kpis: AdmissionReportKpis;
  funnel: AdmissionReportNamedCount[];
  trend: AdmissionReportTrend;
  leadsBySource: AdmissionReportSourceRow[];
  leadsByStatus: AdmissionReportNamedCount[];
  applicationsByClass: AdmissionReportNamedCount[];
  counselorPerformance: AdmissionReportCounselorRow[];
  followUpHealth: AdmissionReportFollowUpHealth;
  applicationStatus: AdmissionReportNamedCount[];
  documentVerification: AdmissionReportNamedCount[];
  lostReasonAnalysisSupported: boolean;
  recentApplications: AdmissionReportRecentRow[];
}
