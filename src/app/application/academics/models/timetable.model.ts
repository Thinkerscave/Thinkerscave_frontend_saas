export const ACADEMICS_TIMETABLE_RESOURCE = 'ACADEMICS_TIMETABLE';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type SlotKind = 'TEACHING' | 'BREAK';
export type ReadinessCheckStatus = 'PASSED' | 'FAILED' | 'WARNING';
export type ReadinessCheckSeverity = 'BLOCKING' | 'WARNING';
export type GenerationStatus =
  | 'NOT_GENERATED'
  | 'GENERATING'
  | 'GENERATED'
  | 'GENERATED_WITH_CONFLICTS'
  | 'FAILED';
export type VersionStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'ARCHIVED';
export type TimetableState = 'NOT_GENERATED' | 'DRAFT' | 'PUBLISHED';
export type GridView = 'ACADEMIC_GROUP' | 'TEACHER';
export type GenerationResultKind = 'SUCCESS' | 'SUCCESS_WITH_WARNINGS' | 'BLOCKED' | 'FAILED';

export interface ReadinessSummary {
  sections: number;
  subjects: number;
  requirements: number;
  teachers: number;
  resources: number;
  weeklySlots: number;
  unscheduledSubjects: number;
}

export interface ReadinessCheckItem {
  code: string;
  title?: string;
  status: ReadinessCheckStatus;
  severity: ReadinessCheckSeverity;
  message: string;
  details?: string[];
  actionLabel?: string | null;
  actionRoute?: string | null;
}

export interface TimetableReadiness {
  ready: boolean;
  summary: ReadinessSummary;
  checks: ReadinessCheckItem[];
  blockingIssues: ReadinessCheckItem[];
  warnings: ReadinessCheckItem[];
  configurationId?: number | null;
  configurationName?: string | null;
}

export interface SetupItem {
  key: 'mapping' | 'allocation' | 'schedule' | string;
  label: string;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'INCOMPLETE' | string;
  summary: string;
  completed: number;
  total: number;
  actionLabel?: string;
  actionRoute?: string;
}

export interface WorkspaceIssue {
  code: string;
  title: string;
  severity: 'BLOCKING' | 'WARNING' | string;
  type?: string;
  academicGroupName?: string;
  sectionName?: string;
  subjectName?: string;
  teacherName?: string;
  timeSlot?: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface TimetableFilterOption { id: number; name: string; }
export interface TimetableFilterGroup {
  academicGroupId: number;
  name: string;
  sections: TimetableFilterOption[];
}
export interface TimetableFilters {
  academicGroups: TimetableFilterGroup[];
  teachers: TimetableFilterOption[];
  rooms: TimetableFilterOption[];
}

export interface TimetableVersion {
  timetableVersionId: number;
  academicYearId: number;
  timetableConfigurationId?: number | null;
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
  unplacedLessonCount?: number;
  editable?: boolean;
  events?: VersionEvent[];
}

export interface VersionEvent {
  eventId: number;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  at?: string;
  actorUserId?: number;
}

export interface TimetableWorkspace {
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: string;
  yearReadOnly: boolean;
  state: TimetableState;
  overallStatus: 'READY' | 'BLOCKED' | string;
  canGenerate: boolean;
  generateBlockedReason?: string | null;
  readiness?: TimetableReadiness;
  filters?: TimetableFilters;
  setup: SetupItem[];
  issues: WorkspaceIssue[];
  blockingIssueCount: number;
  warningIssueCount: number;
  unscheduledLessonCount: number;
  currentVersion?: TimetableVersion | null;
  latestVersion?: TimetableVersion | null;
  workingVersion?: TimetableVersion | null;
  versions: TimetableVersion[];
  referenceDate?: string;
}

export interface SchedulePatternSlot {
  periodId?: number;
  slotOrder: number;
  name: string;
  slotType: SlotKind;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
}

export interface SchedulePattern {
  schedulePatternId?: number;
  academicYearId?: number;
  name: string;
  description?: string | null;
  active: boolean;
  teachingSlotCount: number;
  breakSlotCount: number;
  dayStartTime?: string | null;
  dayEndTime?: string | null;
  totalDurationMinutes?: number;
  assignedGroupCount: number;
  assignedGroups: SchedulePatternGroup[];
  slots: SchedulePatternSlot[];
}

export interface SchedulePatternGroup {
  academicGroupId: number;
  academicGroupName: string;
  sectionId?: number | null;
  sectionName?: string | null;
}

export interface SchedulePatternRequest {
  name: string;
  description?: string | null;
  active: boolean;
  slots: { name: string; slotType: SlotKind; startTime: string; endTime: string }[];
}

export interface GroupAssignmentCell {
  dayOfWeek: DayOfWeek;
  groupScheduleAssignmentId: number;
  schedulePatternId: number;
  schedulePatternName: string;
  startTime?: string | null;
  endTime?: string | null;
  active: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface GroupAssignmentRow {
  academicGroupId: number;
  academicGroupName: string;
  academicGroupCode: string;
  sectionId?: number | null;
  sectionName?: string | null;
  scopeLabel?: string | null;
  active: boolean;
  cells: GroupAssignmentCell[];
}

export interface GroupAssignmentMatrix {
  academicYearId: number;
  days: DayOfWeek[];
  rows: GroupAssignmentRow[];
}

export interface GroupAssignmentRequest {
  schedulePatternId: number;
  units?: { academicGroupId: number; sectionId?: number | null }[];
  academicGroupIds?: number[];
  days: DayOfWeek[];
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface FixedActivityGroup {
  academicGroupId: number;
  academicGroupName?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
}

export interface FixedActivityPeriod {
  timetablePeriodId: number;
  academicGroupId: number;
  sectionId?: number | null;
  dayOfWeek: DayOfWeek;
  periodName: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  schedulePatternId?: number | null;
  schedulePatternName?: string | null;
}

export interface FixedActivity {
  fixedActivityId?: number;
  academicYearId?: number;
  name: string;
  description?: string | null;
  activityType: string;
  appliesToAllGroups: boolean;
  startTime?: string | null;
  endTime?: string | null;
  recurrence?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  active: boolean;
  subjectId?: number | null;
  subjectName?: string | null;
  subjectCode?: string | null;
  subjectType?: string | null;
  periodName?: string | null;
  staffId?: number | null;
  staffName?: string | null;
  days: DayOfWeek[];
  groups: FixedActivityGroup[];
  periods: FixedActivityPeriod[];
}

export interface FixedActivityRequest {
  subjectId: number;
  description?: string | null;
  /** Ignored by the server; status changes use the activate/deactivate actions. */
  active?: boolean;
  days: DayOfWeek[];
  groups: { academicGroupId: number; sectionId?: number | null }[];
  periodName: string;
}

export interface FixedActivitySubjectOption {
  subjectId: number;
  name: string;
  code: string;
  subjectType: 'ACADEMIC_SUBJECT' | 'PRACTICAL_LAB' | 'ACTIVITY';
}

export interface FixedActivitySectionOption {
  sectionId: number;
  name: string;
  code: string;
}

export interface FixedActivityGroupOption {
  academicGroupId: number;
  name: string;
  code: string;
  sections: FixedActivitySectionOption[];
}

export interface FixedActivityOptions {
  academicYearId: number;
  subjects: FixedActivitySubjectOption[];
  groups: FixedActivityGroupOption[];
}

export interface FixedActivityResolveRequest {
  subjectId?: number | null;
  groups: { academicGroupId: number; sectionId?: number | null }[];
  days: DayOfWeek[];
  periodName?: string | null;
}

export interface FixedActivitySchedulePeriod {
  timetablePeriodId: number;
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface FixedActivityCombination {
  academicGroupId: number;
  academicGroupName: string;
  sectionId?: number | null;
  sectionName?: string | null;
  unitLabel: string;
  dayOfWeek: DayOfWeek;
  schedulePatternId?: number | null;
  schedulePatternName?: string | null;
  periods: FixedActivitySchedulePeriod[];
}

export interface FixedActivityPeriodOption {
  name: string;
  displayTime: string;
  timesVary: boolean;
  times: string[];
}

export interface FixedActivityTeacherOption {
  staffId: number;
  staffName: string;
  eligibleForAllUnits: boolean;
  unitLabels: string[];
}

export interface FixedActivityValidationIssue {
  code: string;
  message: string;
  academicGroupId?: number | null;
  sectionId?: number | null;
  dayOfWeek?: DayOfWeek | null;
}

export interface FixedActivitySchedule {
  academicYearId: number;
  combinations: FixedActivityCombination[];
  commonPeriods: FixedActivityPeriodOption[];
  teachers: FixedActivityTeacherOption[];
  issues: FixedActivityValidationIssue[];
}

export interface TimetablePeriod {
  timetablePeriodId?: number;
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  slotKind: SlotKind;
  schedulePatternId?: number;
  schedulePatternName?: string;
  durationMinutes?: number;
}

export interface TimetableCell {
  dayOfWeek: DayOfWeek;
  periodId: number;
  periodNumber: number;
  entryId?: number;
  entryType: 'SUBJECT' | 'FREE_PERIOD' | 'ACTIVITY' | string;
  sectionId?: number;
  sectionName?: string;
  academicGroupName?: string;
  subjectId?: number;
  subjectName?: string;
  academicGroupSubjectMappingId?: number;
  academicGroupChoiceMappingId?: number;
  choiceGroupName?: string;
  staffId?: number;
  staffName?: string;
  teacherAllocationId?: number;
  fixedActivityId?: number;
  fixedActivityType?: string;
  resourceId?: number;
  resourceName?: string;
  locked?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface TimetableGrid {
  timetableVersionId: number;
  view: GridView;
  periods: TimetablePeriod[];
  /** Periods that actually belong to each working day (days may use different patterns). */
  periodsByDay?: Record<string, TimetablePeriod[]>;
  workingDays: DayOfWeek[];
  cells: TimetableCell[];
  academicGroupId?: number;
  academicGroupName?: string;
  sectionId?: number;
  sectionName?: string;
  staffId?: number;
  staffName?: string;
  editable: boolean;
  weekStartDate?: string;
  weekDates: { dayOfWeek: DayOfWeek; date: string }[];
}

export interface TimetableConflict {
  timetableConflictId: number;
  timetableVersionId?: number;
  conflictType: string;
  blocking: boolean;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  message: string;
  sectionId?: number;
  sectionName?: string;
  academicGroupName?: string;
  dayOfWeek?: DayOfWeek;
  periodId?: number;
  periodName?: string;
}

export interface GenerationStartResponse {
  generationId: number;
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
  totalPlacements?: number;
  totalConflicts: number;
  openBlockingConflicts: number;
  message?: string;
  algorithmVersion?: string;
  resultKind: GenerationResultKind;
  unplacedLessons?: string[];
  warnings?: string[];
}

export interface GenerationProgress {
  generationId: number;
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

export interface TimetableEntryRequest {
  sectionId?: number | null;
  academicGroupSubjectMappingId?: number | null;
  teacherAllocationId?: number | null;
  staffId?: number | null;
  dayOfWeek?: DayOfWeek | null;
  periodId?: number | null;
  locked?: boolean | null;
}

export interface SubjectOption {
  mappingId: number;
  academicGroupId: number;
  subjectId?: number;
  subjectName: string;
  weeklyPeriods: number;
}

export interface TeacherOption {
  staffId: number;
  name: string;
}

export const DAY_ORDER: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday',
  FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday'
};

export const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};
