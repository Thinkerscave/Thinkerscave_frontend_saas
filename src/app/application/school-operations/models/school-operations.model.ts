export type StaffWorkspacePage = 'dashboard' | 'directory' | 'operations';
export type AttendanceWorkspacePage = 'dashboard' | 'students' | 'staff' | 'reports' | 'settings';
export type StaffViewMode = 'card' | 'table' | 'compact';
export type StaffOperationTab = 'departments' | 'branches' | 'leave' | 'payroll';
export type StaffProfileTab = 'overview' | 'attendance' | 'leave' | 'payroll' | 'documents' | 'activity';

export type AttendanceType = 'CLASS' | 'STAFF' | 'HOSTEL';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'WFH' | 'ON_LEAVE' | 'NIGHT_OUT' | 'HALF_DAY';
export type StaffRosterStatus = 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'WFH' | 'HALF_DAY';

export interface StaffRecord {
  id?: number;
  staffId?: number;
  staffCode?: string;
  userId?: number;
  userName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: number;
  gender?: string;
  dateOfBirth?: string;
  hireDate?: string;
  photoUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  remarks?: string;
  isActive?: boolean;
  organizationId?: number;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
  departmentId?: number;
  departmentCode?: string;
  departmentName?: string;
}

export interface DepartmentRecord {
  id?: number;
  departmentName: string;
  description?: string;
  departmentCode: string;
  isActive?: boolean;
  organizationId?: number;
}

export interface BranchRecord {
  id?: number;
  branchName: string;
  location?: string;
  branchCode: string;
  isActive?: boolean;
  organizationId?: number;
}

export interface AttendanceRecord {
  id?: number;
  organizationId?: number;
  attendanceType: AttendanceType;
  referenceId?: number;
  referenceName: string;
  attendanceDate: string;
  status: AttendanceStatus;
  classId?: number;
  className?: string;
  sectionName?: string;
  shift?: string;
  department?: string;
  roomNumber?: string;
  remarks?: string;
  markedBy?: string;
  createdAt?: string;
}

export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'COMPENSATORY' | 'CASUAL';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRecord {
  id: number;
  organizationId?: number;
  staffId?: number;
  staffName: string;
  department?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  appliedBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface PayrollRecord {
  id?: number;
  organizationId?: number;
  staffId?: number;
  staffName: string;
  department?: string;
  designation?: string;
  basic?: number;
  hra?: number;
  specialAllowance?: number;
  academicAllowance?: number;
  medicalAllowance?: number;
  travelAllowance?: number;
  dearnessAllowance?: number;
  otherAllowance?: number;
  professionalTax?: number;
  incomeTax?: number;
  providentFund?: number;
  grossSalary?: number;
  totalDeductions?: number;
  netSalary?: number;
  ctcAnnual?: number;
  effectiveFrom?: string;
}

export interface StudentRecord {
  studentId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  mobileNumber?: number;
  gender?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  rollNumber?: string;
  remarks?: string;
  isActive?: boolean;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  parentName?: string;
}

export interface ClassRecord {
  classId: number | string;
  className: string;
}

export interface SectionRecord {
  sectionId: number | string;
  sectionName: string;
  classEntity?: ClassRecord;
}

export interface ActivityItem {
  title: string;
  description: string;
  meta: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

export interface KpiMetric {
  label: string;
  value: string | number;
  helper: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

export interface StaffProfile extends StaffRecord {
  fullName: string;
  initials: string;
  designation: string;
  staffType: 'Teaching' | 'Non Teaching';
  experienceYears: number;
  attendanceStatus: AttendanceStatus | 'NOT_MARKED';
  attendanceRecord?: AttendanceRecord;
  payroll?: PayrollRecord;
  leaveRequests: LeaveRecord[];
  activities: ActivityItem[];
}

export interface StaffWorkspaceData {
  today: string;
  staff: StaffRecord[];
  departments: DepartmentRecord[];
  branches: BranchRecord[];
  todayStaffAttendance: AttendanceRecord[];
  todayClassAttendance: AttendanceRecord[];
  leaveRequests: LeaveRecord[];
  payroll: PayrollRecord[];
}

export interface AttendanceTrendPoint {
  date: string;
  label: string;
  studentRate: number;
  staffRate: number;
  studentAbsent: number;
  staffAbsent: number;
  lateEntries: number;
}

export interface AttendanceWorkspaceData {
  today: string;
  students: StudentRecord[];
  staff: StaffRecord[];
  classes: ClassRecord[];
  sections: SectionRecord[];
  departments: DepartmentRecord[];
  branches: BranchRecord[];
  todayClassAttendance: AttendanceRecord[];
  todayStaffAttendance: AttendanceRecord[];
  trends: AttendanceTrendPoint[];
}

export interface AttendanceClassSummaryRow {
  classId: number;
  className: string;
  sectionId?: number | null;
  sectionName?: string | null;
  totalStudents: number;
  avgAttendancePercent: number;
}

export interface AttendanceMonthlyTrendRow {
  year: number;
  month: number;
  avgAttendancePercent: number;
  statusBreakdown?: Record<string, number>;
}

export interface AttendanceDefaulterRow {
  studentId: number;
  studentName: string;
  rollNumber?: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
  totalDays: number;
  presentDays: number;
  attendancePercent: number;
}

export interface AttendanceSummaryReport {
  fromDate: string;
  toDate: string;
  totalStudents: number;
  overallPercent: number;
  classWiseSummary: AttendanceClassSummaryRow[];
  monthlyTrend: AttendanceMonthlyTrendRow[];
  defaulters: AttendanceDefaulterRow[];
}

export interface StaffAttendanceReportRow {
  staffId: number;
  staffName: string;
  staffCode?: string | null;
  department?: string | null;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  onLeaveDays: number;
  attendancePercent: number;
  avgWorkingHours: number;
}

/** Org-scoped attendance configuration (GET/PUT /api/v1/attendance/settings). */
export interface AttendanceOrgSettings {
  settingId?: number | null;
  organizationId?: number | null;
  attendanceMode: 'DAILY' | 'PERIOD';
  lateAfterTime: string;
  windowStartTime: string;
  windowEndTime: string;
  allowCopyPrevious: boolean;
  minStudentAttendancePercent: number;
  studentAlertThresholdPercent?: number;
  sendSmsOnAbsent: boolean;
  sendEmailOnAbsent: boolean;
  minStaffWorkingHours?: number;
  staffLateGraceMinutes?: number;
  freezeAfterDays: number;
  active?: boolean;
}

export interface RosterAttendanceRow {
  selected: boolean;
  attendanceId?: number;
  referenceId: number;
  referenceName: string;
  classId?: number;
  className?: string;
  sectionName?: string;
  department?: string;
  branchName?: string;
  shift?: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface StaffCreatePayload {
  staffCode?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: number | null;
  gender?: string;
  dateOfBirth?: string;
  hireDate?: string;
  address?: string;
  city?: string;
  state?: string;
  remarks?: string;
  branchCode: string;
  departmentCode: string;
  userName?: string;
}

export interface PayrollRunResult {
  month: string;
  totalStaff: number;
  totalGross: number;
  totalNet: number;
  runBy: string;
  status: string;
  processedAt: string;
}
