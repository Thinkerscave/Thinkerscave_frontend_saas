export type SubjectType = 'ACADEMIC_SUBJECT' | 'PRACTICAL_LAB' | 'ACTIVITY';
export type SubjectStatusFilter = 'ACTIVE' | 'INACTIVE';
export type SubjectRequirement = 'COMPULSORY' | 'OPTIONAL';
export type SubjectMappingScope = 'ALL_SECTIONS' | 'SELECTED_SECTIONS';
export type SubjectTimetablePreference = 'ANY' | 'FIRST_HALF' | 'SECOND_HALF';

/** Reusable catalog subject. No year, group, or weekly periods. */
export interface SubjectResponse {
  subjectId: number;
  name: string;
  code: string;
  subjectType: SubjectType;
  description?: string | null;
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
  code?: string;
  subjectType: SubjectType;
  description?: string;
}

export interface SubjectListQuery {
  q?: string;
  subjectType?: SubjectType | null;
  status?: SubjectStatusFilter;
  page?: number;
  size?: number;
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
  scope: SubjectMappingScope;
  /** Covered sections. */
  sectionCount: number;
  /** Active sections in the group. */
  totalSectionCount: number;
  active: boolean;
}

export interface SubjectMappingSection {
  sectionId: number;
  name: string;
  code?: string | null;
  active: boolean;
}

export interface SubjectMappingRow {
  mappingId: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectType: SubjectType;
  subjectActive: boolean;
  requirement: SubjectRequirement;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  scope: SubjectMappingScope;
  sectionIds: number[];
  sectionNames: string[];
  totalSectionCount: number;
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
  hasSections: boolean;
  sections: SubjectMappingSection[];
  mappings: SubjectMappingRow[];
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
  subjectActive: boolean;
  mapped: boolean;
  mappingId: number | null;
}

export interface SubjectMappingUpsert {
  subjectId: number;
  requirement: SubjectRequirement;
  weeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  scope: SubjectMappingScope;
  sectionIds: number[];
}

export interface SubjectMappingSaveRequest {
  academicYearId: number;
  upserts: SubjectMappingUpsert[];
  removedSubjectIds: number[];
  confirmImpact: boolean;
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
export const SUBJECT_CODE_MAX = 50;
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
