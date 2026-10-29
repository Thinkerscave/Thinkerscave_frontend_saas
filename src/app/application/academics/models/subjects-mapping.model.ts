export type SubjectType = 'ACADEMIC_SUBJECT' | 'PRACTICAL_LAB' | 'ACTIVITY';
export type SubjectStatusFilter = 'ACTIVE' | 'INACTIVE';
export type SubjectRequirement = 'COMPULSORY' | 'OPTIONAL';
export type SubjectTimetablePreference = 'ANY' | 'FIRST_HALF' | 'SECOND_HALF';

/** Reusable catalog subject. No year, group, or weekly periods. */
export interface SubjectResponse {
  subjectId: number;
  name: string;
  code: string;
  subjectType: SubjectType;
  description?: string | null;
  defaultTimetablePreference?: SubjectTimetablePreference | null;
  active: boolean;
  /** Active curriculum mappings across all academic years. */
  mappedAcademicGroupCount: number;
  /** Sections covered by active mappings. */
  mappedSectionCount: number;
  createdBy?: string | null;
  createdOn?: string | null;
  updatedBy?: string | null;
  updatedOn?: string | null;
}

export interface SubjectRequest {
  name: string;
  subjectType: SubjectType;
  description?: string;
  defaultTimetablePreference?: SubjectTimetablePreference | null;
}

export interface SubjectListQuery {
  q?: string;
  subjectType?: SubjectType | null;
  status?: SubjectStatusFilter;
  page?: number;
  size?: number;
}

export interface SubjectChoiceGroupSubject {
  subjectId: number;
  name: string;
  code: string;
  active: boolean;
}

export interface SubjectChoiceGroup {
  subjectChoiceGroupId: number;
  name: string;
  subjectType: SubjectType;
  active: boolean;
  subjects: SubjectChoiceGroupSubject[];
  createdOn?: string | null;
}

export interface SubjectChoiceGroupRequest {
  name: string;
  subjectType: SubjectType;
  subjectIds: number[];
}

export interface SubjectOption {
  subjectId: number;
  name: string;
  code: string;
  subjectType: SubjectType;
}

/** One active curriculum mapping of a subject (all years). */
export interface SubjectUsageResponse {
  mappingId: number;
  academicGroupId: number;
  academicGroupName: string;
  academicGroupCode: string;
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: string;
  requirement: SubjectRequirement;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  sectionCount: number;
  totalSectionCount: number;
  active: boolean;
}

export interface SubjectMappingRow {
  mappingId: number;
  choiceMappingId?: number | null;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectType: SubjectType;
  subjectActive: boolean;
  requirement: SubjectRequirement;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  choiceGroup?: string | null;
  consecutivePeriods?: number;
  teacherAllocationCount: number;
  timetableEntryCount: number;
}

export interface SubjectMappingBoard {
  academicGroupId: number;
  academicGroupName: string;
  academicGroupCode: string;
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: string;
  yearReadOnly: boolean;
  mappings: SubjectMappingRow[];
  choiceMappings?: SubjectChoiceMapping[];
  mappedCount: number;
  compulsoryCount: number;
  optionalCount: number;
  teacherPendingCount: number;
}

export interface AvailableSubjectResponse {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectType: SubjectType;
  defaultTimetablePreference?: SubjectTimetablePreference | null;
  subjectActive: boolean;
  mapped: boolean;
  mappingId: number | null;
}

export interface SubjectMappingUpsert {
  subjectId: number;
  requirement: SubjectRequirement;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  choiceGroup?: string | null;
  consecutivePeriods?: number;
}

export interface SubjectMappingSaveRequest {
  academicYearId: number;
  upserts: SubjectMappingUpsert[];
  removedSubjectIds: number[];
  choiceGroupUpserts?: SubjectChoiceMappingUpsert[];
  removedChoiceGroupIds?: number[];
  confirmImpact: boolean;
}

export interface SubjectChoiceMapping {
  academicGroupChoiceMappingId: number;
  choiceGroupId: number;
  name: string;
  subjectType: SubjectType;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  active: boolean;
  subjects: SubjectMappingRow[];
}

export interface SubjectChoiceMappingUpsert {
  choiceGroupId: number;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  /** Omitted on purpose: every member inherits the group's weekly periods. */
  subjectPeriods?: Record<number, number>;
}

export interface SubjectMappingImpact {
  subjectId: number;
  subjectName: string;
  type: 'REMOVAL' | 'SCHEDULE_CHANGE';
  teacherAllocationCount: number;
  timetableEntryCount: number;
  message: string;
}

export interface SubjectMappingImpactResponse {
  valid: boolean;
  requiresConfirmation: boolean;
  impacts: SubjectMappingImpact[];
}

export const ACADEMICS_SUBJECTS_RESOURCE = 'ACADEMICS_SUBJECTS';

export const SUBJECT_NAME_MAX = 150;
export const SUBJECT_DESCRIPTION_MAX = 300;
export const SUBJECT_WEEKLY_PERIODS_MIN = 1;
export const SUBJECT_WEEKLY_PERIODS_MAX = 40;

export const SUBJECT_TYPE_OPTIONS: { label: string; value: SubjectType }[] = [
  { label: 'Academic Subject', value: 'ACADEMIC_SUBJECT' },
  { label: 'Practical / Lab', value: 'PRACTICAL_LAB' },
  { label: 'Activity', value: 'ACTIVITY' }
];

export const SUBJECT_TYPE_FILTER_OPTIONS: { label: string; value: SubjectType | null }[] = [
  { label: 'All Types', value: null },
  ...SUBJECT_TYPE_OPTIONS
];

const SUBJECT_TYPE_RANK = new Map<string, number>(
  SUBJECT_TYPE_OPTIONS.map((option, index) => [option.value, index])
);

/**
 * Display rank from the shared type option order: teaching subjects, then practical labs,
 * then activities. Derived from {@link SUBJECT_TYPE_OPTIONS} so no screen repeats the list.
 */
export function subjectTypeRank(type: SubjectType | string | null | undefined): number {
  if (!type) return Number.MAX_SAFE_INTEGER;
  return SUBJECT_TYPE_RANK.get(type) ?? Number.MAX_SAFE_INTEGER;
}

export interface SubjectDisplayItem {
  name?: string | null;
  subjectName?: string | null;
  subjectType?: SubjectType | string | null;
}

/** Shared subject order: type rank first, then case-insensitive name. */
export function compareSubjectDisplayOrder(a: SubjectDisplayItem, b: SubjectDisplayItem): number {
  const byType = subjectTypeRank(a.subjectType) - subjectTypeRank(b.subjectType);
  if (byType !== 0) return byType;
  const left = (a.name ?? a.subjectName ?? '').trim();
  const right = (b.name ?? b.subjectName ?? '').trim();
  return left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true });
}

export function sortSubjects<T extends SubjectDisplayItem>(items: readonly T[]): T[] {
  return [...items].sort(compareSubjectDisplayOrder);
}

export const SUBJECT_STATUS_OPTIONS: { label: string; value: SubjectStatusFilter }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
];

export const REQUIREMENT_OPTIONS: { label: string; value: SubjectRequirement }[] = [
  { label: 'Compulsory', value: 'COMPULSORY' },
  { label: 'Optional', value: 'OPTIONAL' }
];

export const TIMETABLE_PREFERENCE_OPTIONS: { label: string; value: SubjectTimetablePreference }[] = [
  { label: 'No Preference', value: 'ANY' },
  { label: 'First Half', value: 'FIRST_HALF' },
  { label: 'Second Half', value: 'SECOND_HALF' }
];

export function subjectTypeLabel(type: SubjectType | null | undefined): string {
  return SUBJECT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? '';
}

/** Subjects have no icon field: the icon and tint are derived from the type so every view matches. */
export function subjectTypeIcon(type: SubjectType | null | undefined): string {
  switch (type) {
    case 'PRACTICAL_LAB': return 'pi pi-bolt';
    case 'ACTIVITY': return 'pi pi-star';
    default: return 'pi pi-book';
  }
}

export function subjectTypeTone(type: SubjectType | null | undefined): 'academic' | 'lab' | 'activity' {
  switch (type) {
    case 'PRACTICAL_LAB': return 'lab';
    case 'ACTIVITY': return 'activity';
    default: return 'academic';
  }
}
