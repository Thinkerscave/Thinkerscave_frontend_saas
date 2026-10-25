export type TeacherAllocationStatus = 'UNASSIGNED' | 'ASSIGNED' | 'CONFLICT';

export type AcademicYearStatusLite =
  | 'DRAFT'
  | 'PREPARING'
  | 'READY_FOR_APPROVAL'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CURRENT'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'REJECTED';

export interface TeacherAllocationRow {
  teacherAllocationId?: number | null;
  academicYearId: number;
  academicGroupId: number;
  academicGroupName: string;
  academicGroupCode?: string;
  sectionId: number;
  sectionName: string;
  academicGroupSubjectMappingId: number;
  subjectId: number;
  subjectName: string;
  subjectCode?: string;
  subjectCategory?: string;
  weeklyPeriods: number;
  primaryStaffId?: number | null;
  primaryStaffName?: string | null;
  primaryWorkloadAssigned?: number | null;
  primaryWorkloadMax?: number | null;
  primaryWorkloadStatus?: string | null;
  status: TeacherAllocationStatus;
  active?: boolean;
}

export interface TeacherWorkload {
  staffId: number;
  staffName: string;
  academicYearId: number;
  assignedWeeklyPeriods: number;
  maxWeeklyPeriods: number;
  status: 'AVAILABLE' | 'LIMITED' | 'AT_CAPACITY' | 'EXCEEDS_LIMIT' | string;
}

export interface TeacherRecommendation {
  staffId: number;
  staffName: string;
  assignedWeeklyPeriods: number;
  maxWeeklyPeriods: number;
  workloadStatus: string;
  recommended: boolean;
  reason?: string;
}

export interface TeacherAllocationDashboard {
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: AcademicYearStatusLite;
  yearReadOnly: boolean;
  maxWeeklyPeriods: number;
  maxWeeklyPeriodsFromConfig: boolean;
  totalSlots: number;
  assignedSlots: number;
  missingSlots: number;
  conflictSlots: number;
  page?: number;
  size?: number;
  totalPages?: number;
  totalRows?: number;
  rows: TeacherAllocationRow[];
  subjectOptions?: { id: number; name: string }[];
  workloads: TeacherWorkload[];
}

export interface TeacherAllocationAssignRequest {
  sectionId: number;
  academicGroupSubjectMappingId: number;
  staffId: number;
  role?: 'PRIMARY' | 'SECONDARY';
}

export const ACADEMICS_TEACHER_ALLOCATION_RESOURCE = 'ACADEMICS_TEACHER_ALLOCATION';
