/**
 * Staff Workspace TypeScript models.
 * Mirrors backend StaffWorkspaceDtos exactly.
 */

export interface StaffKpi {
  totalEmployees: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  onLeaveToday: number;
  newJoinersThisMonth: number;
}

export interface StaffSearchRequest {
  query?: string;
  department?: string;
  branch?: string;
  staffType?: 'TEACHING' | 'NON_TEACHING' | string;
  status?: 'ACTIVE' | 'INACTIVE' | string;
}

export interface StaffDirectoryCard {
  staffId: number;
  staffCode: string;
  fullName: string;
  email: string;
  contact: string;
  designation: string;
  department: string;
  branch: string;
  joinedDate: string;
  active: boolean;
  staffType: 'TEACHING' | 'NON_TEACHING';
  availabilityStatus: 'PRESENT' | 'ON_LEAVE' | 'ABSENT';
}

export interface KeyResponsibility {
  responsibilityName: string;
  type: string;
  status: string;
}

export interface SubjectLoad {
  className: string;
  subject: string;
}

export interface StaffOverview {
  designation: string;
  department: string;
  branch: string;
  joinedDate: string;
  email: string;
  attendancePercent: number;
  keyResponsibilities: KeyResponsibility[];
  subjectLoad: SubjectLoad[];
}

export interface StaffPersonal {
  firstName: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  mobile?: string;
  email?: string;
}

export interface StaffEmployment {
  staffCode: string;
  designation?: string;
  department?: string;
  branch?: string;
  hireDate?: string;
  yearsOfService?: number;
  remarks?: string;
}

export interface StaffTeachingSnapshot {
  subjectsCanTeach?: string;
  preferredSubjects?: string;
  teachingLevels?: string;
  canSubstituteFor?: string;
  cannotSubstituteFor?: string;
  qualification?: string;
  experienceYears?: number;
  remarks?: string;
}

export interface StaffLeaveSnapshot {
  used: number;
  balance: number;
  nextLeave?: string;
  recent: TodayLeaveEntry[];
}

export interface StaffPayrollSnapshot {
  designation?: string;
  basic?: number;
  hra?: number;
  specialAllowance?: number;
  totalEarnings?: number;
  professionalTax?: number;
  incomeTax?: number;
  providentFund?: number;
  totalDeductions?: number;
  netPay?: number;
  effectiveFrom?: string;
}

export interface StaffTimelineEntry {
  type: string;
  title: string;
  detail: string;
  occurredOn?: string;
}

export interface StaffProfile360 {
  staffId: number;
  fullName: string;
  staffCode: string;
  designation: string;
  department: string;
  email: string;
  contact: string;
  joinedDate: string;
  active: boolean;
  staffType: 'TEACHING' | 'NON_TEACHING';
  overview: StaffOverview;
  personal: StaffPersonal;
  employment: StaffEmployment;
  teaching?: StaffTeachingSnapshot;
  leave: StaffLeaveSnapshot;
  payroll?: StaffPayrollSnapshot;
}

export interface ResponsibilityRequest {
  staffId?: number;
  responsibilityName: string;
  responsibilityType: string;
  scope?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: string;
  remarks?: string;
}

export interface ResponsibilityResponse {
  responsibilityId: number;
  staffId?: number;
  staffName?: string;
  responsibilityName: string;
  responsibilityType: string;
  scope?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: string;
  remarks?: string;
}

export interface ResponsibilityKpi {
  total: number;
  assigned: number;
  unassigned: number;
  custom: number;
}

export interface LeaveAvailabilityKpi {
  presentToday: number;
  onLeaveToday: number;
  absentToday: number;
  upcomingLeaves: number;
}

export interface TodayLeaveEntry {
  leaveId: number;
  staffId: number;
  staffName: string;
  department?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
}

export interface StaffDocumentKpi {
  total: number;
  verified: number;
  pending: number;
  missing: number;
  expired: number;
}

export interface StaffDocumentRequest {
  staffId: number;
  category: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  expiresOn?: string;
  remarks?: string;
}

export interface StaffDocumentEntry {
  documentId: number;
  staffId: number;
  staffName: string;
  category: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  status: string;
  verifiedBy?: string;
  verifiedOn?: string;
  expiresOn?: string;
  remarks?: string;
  uploadedOn?: string;
}

export interface AlumniStaffKpi {
  total: number;
  retired: number;
  resigned: number;
  contractCompleted: number;
}

export interface AlumniStaffRequest {
  staffId?: number;
  fullName: string;
  staffCode?: string;
  lastDesignation?: string;
  department?: string;
  exitType: string;
  exitDate: string;
  joinedDate?: string;
  email?: string;
  contact?: string;
  remarks?: string;
}

export interface AlumniStaffResponse {
  alumniStaffId: number;
  staffId?: number;
  fullName: string;
  staffCode?: string;
  lastDesignation?: string;
  department?: string;
  exitType: string;
  exitDate: string;
  joinedDate?: string;
  yearsOfService?: number;
  email?: string;
  contact?: string;
  remarks?: string;
}

export interface TeachingProfileRequest {
  staffId: number;
  subjectsCanTeach?: string;
  preferredSubjects?: string;
  teachingLevels?: string;
  canSubstituteFor?: string;
  cannotSubstituteFor?: string;
  qualification?: string;
  experienceYears?: number;
  remarks?: string;
}
