export type InquiryStatus =
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

export type ApplicationStatus = 'DRAFT' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface WorkspaceMetric {
  label: string;
  value: string | number;
  trend?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon: string;
}

export interface WorkspaceNavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  description: string;
}

export interface PipelineStage {
  id: InquiryStatus;
  label: string;
  description: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface InquiryRecord {
  inquiryId: number;
  name: string;
  mobileNumber: string;
  email: string;
  classInterested: string;
  address: string;
  inquirySource: string;
  referredBy?: string;
  comments?: string;
  assignedCounselor?: string;
  status: InquiryStatus;
  lastFollowUpDate?: string;
  lastFollowUpType?: string;
  nextFollowUpDate?: string;
}

export interface FollowUpRecord {
  id: number;
  inquiryId: number;
  followUpType: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'WALK_IN' | 'SMS' | 'OTHER';
  remarks: string;
  statusAfterFollowUp: InquiryStatus;
  followUpDate: string;
  nextFollowUpDate?: string;
  createdBy?: string;
}

export interface AddressDto {
  street?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  pincode?: string;
}

export interface AdmissionApplication {
  applicationId: string;
  applicantName: string;
  dateOfBirth?: string;
  gender?: string;
  applyingForSchoolOrCollege?: string;
  parentName?: string;
  guardianName?: string;
  contactNumber?: string;
  email?: string;
  address?: AddressDto;
  uploadedDocuments?: string[];
  status: ApplicationStatus;
  internalComments?: string;
}

export interface StudentRecord {
  studentId: number;
  firstName: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: number;
  gender?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  rollNumber?: string;
  remarks?: string;
  active?: boolean;
  isActive?: boolean;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  parentName?: string;
}

export interface StudentDocumentRecord {
  documentId: number;
  documentName: string;
  documentType: string;
  studentId?: number;
}

export interface ClassRecord {
  classId: string | number;
  className: string;
}

export interface SectionRecord {
  sectionId: string | number;
  sectionName: string;
  classEntity?: ClassRecord;
}

export interface InquiryWorkspaceData {
  inquiries: InquiryRecord[];
  followUps: FollowUpRecord[];
  admissions: AdmissionApplication[];
}

export interface StudentWorkspaceData {
  students: StudentRecord[];
  classes: ClassRecord[];
  sections: SectionRecord[];
  documents: StudentDocumentRecord[];
  inquiries: InquiryRecord[];
  admissions: AdmissionApplication[];
}