export const ACADEMICS_TIMETABLE_RESOURCE = 'ACADEMICS_TIMETABLE';

export type ShiftType = 'MORNING' | 'REGULAR' | 'AFTERNOON';
export type SlotKind = 'TEACHING' | 'BREAK';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type ReadinessItemStatus = 'PASS' | 'FAIL' | 'WARN';
export type OverallReadinessStatus = 'READY' | 'BLOCKED';
export type GenerationStatus =
  | 'NOT_GENERATED'
  | 'GENERATING'
  | 'GENERATED'
  | 'GENERATED_WITH_CONFLICTS'
  | 'FAILED';

export type ReadinessCheckStatus = 'PASSED' | 'FAILED' | 'WARNING';
export type ReadinessCheckSeverity = 'BLOCKING' | 'WARNING';
export type GenerationResultKind = 'SUCCESS' | 'SUCCESS_WITH_WARNINGS' | 'BLOCKED' | 'FAILED';

export interface ReadinessSummary {
  sections: number;
  subjects: number;
  requirements: number;
  teachers: number;
  resources: number;
}

export interface ReadinessCheckItem {
  code: string;
  status: ReadinessCheckStatus;
  severity: ReadinessCheckSeverity;
  message: string;
  reference?: string;
}

export interface TimetableReadiness {
  ready: boolean;
  summary: ReadinessSummary;
  checks: ReadinessCheckItem[];
  blockingIssues: ReadinessCheckItem[];
  warnings: ReadinessCheckItem[];
}

export interface GenerationStartResponse {
  generationId: string;
  timetableVersionId: number;
  versionNumber: number;
  status: GenerationStatus;
  algorithmVersion?: string;
}

export interface GenerationResult {
  timetableVersionId: number;
  versionNumber: number;
  generationStatus: GenerationStatus;
  totalEntries: number;
  totalConflicts: number;
  openBlockingConflicts: number;
  message?: string;
  algorithmVersion?: string;
  resultKind: GenerationResultKind;
}

export interface GenerationProgress {
  generationId: string;
  timetableVersionId: number;
  versionNumber: number;
  status: GenerationStatus;
  phase?: string;
  phaseLabel?: string;
  progressPercent?: number;
  result?: GenerationResult;
  message?: string;
  algorithmVersion?: string;
}
export type VersionStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'ARCHIVED';
export type ConflictStatus = 'OPEN' | 'RESOLVED' | 'IGNORED';
export type ConflictType =
  | 'TEACHER_CONFLICT'
  | 'CLASS_CONFLICT'
  | 'SECTION_CONFLICT'
  | 'ROOM_CONFLICT'
  | 'RESOURCE_CONFLICT'
  | 'TEACHER_AVAILABILITY_CONFLICT'
  | 'ROOM_CAPACITY_CONFLICT'
  | 'PERIOD_CAPACITY_CONFLICT'
  | 'WORKLOAD_CONFLICT'
  | 'SUBJECT_ALLOCATION_CONFLICT'
  | string;
export type GridView = 'CLASS' | 'TEACHER' | 'ROOM';
export type ResourceType = 'CLASSROOM' | 'LABORATORY' | 'ACTIVITY_ROOM' | 'AUDITORIUM' | 'OTHER';

export interface ReadinessCheck {
  key: string;
  label: string;
  status: ReadinessItemStatus;
  message: string;
  blocking: boolean;
}

export interface TimetableVersionSummary {
  timetableVersionId: number;
  academicYearId: number;
  timetableConfigurationId: number;
  versionNumber: number;
  generationStatus: GenerationStatus;
  status: VersionStatus;
  generatedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  supersededAt?: string;
  totalEntries?: number;
  totalConflicts?: number;
  openBlockingConflicts?: number;
}

export interface TimetableDashboard {
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: string;
  yearReadOnly: boolean;
  readinessChecks: ReadinessCheck[];
  overallStatus: OverallReadinessStatus;
  canGenerate: boolean;
  configurationSummary?: TimetableConfiguration | null;
  currentVersion?: TimetableVersionSummary | null;
  latestVersion?: TimetableVersionSummary | null;
  totalConflicts: number;
  openBlockingConflicts: number;
}

export interface TimetableWorkingDay {
  timetableWorkingDayId?: number;
  dayOfWeek: DayOfWeek;
  working: boolean;
}

export interface TimetablePeriod {
  timetablePeriodId?: number;
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  slotKind: SlotKind;
}

export interface TimetableConfiguration {
  timetableConfigurationId?: number;
  academicYearId?: number;
  name: string;
  shiftType: ShiftType;
  schoolStartTime: string;
  schoolEndTime: string;
  defaultPeriodDurationMin: number;
  maxTeacherWeeklyPeriods: number;
  status?: string;
  isLocked?: boolean;
  active?: boolean;
  workingDays: TimetableWorkingDay[];
  periods: TimetablePeriod[];
}

export interface TimetableVersion {
  timetableVersionId: number;
  academicYearId: number;
  timetableConfigurationId: number;
  versionNumber: number;
  generationStatus: GenerationStatus;
  status: VersionStatus;
  generatedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  supersededAt?: string;
  totalEntries?: number;
  totalConflicts?: number;
  openBlockingConflicts?: number;
}

export interface TimetableGridCell {
  dayOfWeek: DayOfWeek;
  periodId: number;
  periodNumber: number;
  entryId?: number;
  entryType?: string;
  sectionId?: number;
  sectionName?: string;
  className?: string;
  subjectName?: string;
  staffId?: number;
  staffName?: string;
  resourceId?: number;
  resourceName?: string;
}

export interface TimetableGrid {
  timetableVersionId?: number;
  view: GridView;
  periods: TimetablePeriod[];
  workingDays: DayOfWeek[];
  cells: TimetableGridCell[];
}

export interface TimetableConflict {
  timetableConflictId: number;
  timetableVersionId?: number;
  conflictType: ConflictType;
  blocking: boolean;
  status: ConflictStatus;
  message: string;
  sectionId?: number;
  sectionName?: string;
  dayOfWeek?: DayOfWeek;
  periodId?: number;
  timetablePeriodId?: number;
}

export interface TimetableGenerateResult {
  timetableVersionId: number;
  versionNumber: number;
  generationStatus: GenerationStatus;
  totalEntries: number;
  totalConflicts: number;
  openBlockingConflicts: number;
  message?: string;
}

export interface AcademicResource {
  academicResourceId?: number;
  name: string;
  code: string;
  resourceType: ResourceType;
  capacity?: number | null;
  active?: boolean;
}

export interface TimetableConfigurationRequest {
  name: string;
  shiftType: ShiftType;
  schoolStartTime: string;
  schoolEndTime: string;
  defaultPeriodDurationMin: number;
  maxTeacherWeeklyPeriods: number;
  workingDays: TimetableWorkingDay[];
  periods: TimetablePeriod[];
}
