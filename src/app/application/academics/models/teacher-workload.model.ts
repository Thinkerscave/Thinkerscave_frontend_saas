/**
 * View-only Teacher Workload dashboard.
 *
 * Workload is an allocation-based estimate: assigned periods come from persisted
 * teacher allocations and fixed activities, while the target and maximum come from
 * the persisted timetable schedule pattern. When no valid pattern exists the backend
 * returns `targetAvailable: false` and null target values instead of a fallback.
 */
export type TeacherWorkloadStatus =
  | 'OVERLOADED'
  | 'NEAR_MAXIMUM'
  | 'AT_TARGET'
  | 'BELOW_TARGET'
  | 'TARGET_UNAVAILABLE';

export interface WorkloadFilterOption {
  id: number;
  label: string;
}

export interface WorkloadBreakdown {
  subjectId: number;
  subjectName: string;
  subjectCode: string | null;
  academicGroupId: number;
  academicGroupName: string;
  sectionId: number | null;
  sectionName: string | null;
  weeklyPeriods: number;
  /** ALLOCATION | CHOICE_GROUP | FIXED_ACTIVITY */
  source: string;
  choiceGroupName: string | null;
}

export interface WorkloadConflict {
  conflictId: number;
  conflictType: string | null;
  message: string | null;
  blocking: boolean;
  status: string | null;
  dayOfWeek: string | null;
  periodName: string | null;
  sectionName: string | null;
}

export interface TeacherWorkloadRow {
  staffId: number;
  staffName: string;
  employeeId: string | null;
  email: string | null;
  assignedPeriods: number;
  expectedTarget: number | null;
  remainingCapacity: number | null;
  maximumPeriods: number | null;
  overloadPeriods: number;
  status: TeacherWorkloadStatus;
  workloadBasis: string;
  scheduledPeriods: number | null;
  timetableConflicts: number;
  subjects: string[];
  breakdown: WorkloadBreakdown[];
  conflicts: WorkloadConflict[];
}

export interface TeacherWorkloadWarning {
  code: string;
  severity: 'WARNING' | 'INFO' | string;
  message: string;
}

export interface TeacherWorkloadUnassignedSubject {
  subjectId: number;
  subjectName: string;
  academicGroupId: number;
  academicGroupName: string;
  sectionId: number | null;
  sectionName: string | null;
  weeklyPeriods: number;
  reason: string;
}

export interface TeacherWorkloadSummary {
  totalTeachers: number;
  overloaded: number;
  nearMaximum: number;
  atTarget: number;
  belowTarget: number;
  unassignedSubjects: number;
}

export interface TeacherWorkloadDashboard {
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: string | null;
  targetAvailable: boolean;
  benchmarkWeeklyCapacity: number | null;
  expectedTarget: number | null;
  maximumWeeklyCapacity: number | null;
  nearMaximumThreshold: number | null;
  bufferPercentage: number;
  targetBasis: string;
  targetExplanation: string;
  workloadBasis: string;
  timetableStatus: string;
  timetableVersionId: number | null;
  timetableVersionNumber: number | null;
  timetableVersionStatus: string | null;
  timetableConflictCount: number;
  summary: TeacherWorkloadSummary;
  warnings: TeacherWorkloadWarning[];
  rows: TeacherWorkloadRow[];
  subjectOptions: WorkloadFilterOption[];
  academicGroupOptions: WorkloadFilterOption[];
  unassignedSubjects: TeacherWorkloadUnassignedSubject[];
}
