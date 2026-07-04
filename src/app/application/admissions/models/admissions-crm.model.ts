/** Admissions CRM types aligned with backend DTOs under /api/v1/admissions */

export type LeadStatus =
  | 'NEW' | 'CONTACTED' | 'INTERESTED' | 'COUNSELING' | 'DOCUMENTS_PENDING'
  | 'FOLLOW_UP_REQUIRED' | 'READY_FOR_ADMISSION' | 'CONVERTED' | 'LOST' | 'CLOSED';

export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENTS_PENDING' | 'FEE_PENDING'
  | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ENROLLED';

export type FollowUpType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'WALK_IN' | 'SMS' | 'OTHER';

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
}

export interface LeadQuickActions {
  todaysCalls: number;
  todaysMeetings: number;
  overdueFollowUps: number;
  admissionReady: number;
}

export interface LeadSearchRequest {
  keyword?: string | null;
  status?: LeadStatus | null;
  counselorId?: number | null;
  inquirySource?: string | null;
  classInterested?: string | null;
  followUpFrom?: string | null;
  followUpTo?: string | null;
}

export interface LeadRecord {
  inquiryId: number;
  name: string;
  mobileNumber: string;
  email?: string | null;
  classInterestedIn: string;
  address?: string | null;
  inquirySource?: string | null;
  referredBy?: string | null;
  comments?: string | null;
  assignedCounselorId?: number | null;
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
  action: string;
  description?: string | null;
  performedBy: string;
  performedAt: string;
  icon?: string | null;
  tone?: string | null;
}

export interface LeadFullDetail {
  inquiry: LeadRecord;
  followUps: FollowUpRecord[];
  counselingNotes: CounselingNote[];
  timeline: LeadTimelineItem[];
}

export interface ApplicationKpi {
  totalApplications?: number;
  draftApplications?: number;
  pendingApplications?: number;
  approvedApplications?: number;
  rejectedApplications?: number;
  inProgress?: number;
  documentsPending?: number;
  verificationPending?: number;
  readyToEnroll?: number;
  completed?: number;
}

export interface ApplicationSearchRequest {
  keyword?: string | null;
  admissionId?: string | null;
  studentName?: string | null;
  mobileNumber?: string | null;
  parentName?: string | null;
  status?: ApplicationStatus | null;
  classApplied?: string | null;
}

export interface ApplicationRecord {
  applicationId: number;
  applicationNumber?: string | null;
  inquiryId?: number | null;
  applicantName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  applyingForClass?: string | null;
  email?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentContact?: string | null;
  parentEmail?: string | null;
  status: ApplicationStatus;
  internalComments?: string | null;
  uploadedDocuments?: string[] | null;
  createdOn?: string | null;
  createdBy?: string | null;
}

export interface ApplicationCreateRequest {
  applicantName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  applyingForClass: string;
  email?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentContact?: string | null;
  parentEmail?: string | null;
  internalComments?: string | null;
  inquiryId?: number | null;
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
}

export type AdmissionsWorkspacePage =
  | 'overview' | 'leads' | 'follow-ups' | 'applications'
  | 'enrollment' | 'reports' | 'settings';

export interface AdmissionsPageConfig {
  page: AdmissionsWorkspacePage;
  label: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}
