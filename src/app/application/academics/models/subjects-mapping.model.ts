export type SubjectCategory = 'CORE' | 'LANGUAGE' | 'ACTIVITY' | 'LAB' | 'PRACTICAL';

export type SubjectTimetablePreference = 'FIRST_HALF' | 'SECOND_HALF' | 'ANY';

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

export interface ClassSubjectMappingDto {
  classSubjectMappingId?: number | null;
  classId: number;
  className?: string;
  classCode?: string;
  classStage?: string;
  sectionCount?: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  category: SubjectCategory;
  included: boolean;
  weeklyPeriods: number;
  defaultWeeklyPeriods: number;
  periodsOverridden: boolean;
  timetablePreference: SubjectTimetablePreference;
  active?: boolean | null;
  teacherStatus: 'ASSIGNED' | 'MISSING' | 'NONE';
  teacherAllocationCount?: number;
}

export interface ClassMappingBoard {
  classId: number;
  className: string;
  classCode: string;
  stage: string;
  sectionNames: string[];
  mappings: ClassSubjectMappingDto[];
  includedCount: number;
  missingTeacherCount: number;
}

export interface SubjectDto {
  subjectId: number;
  academicYearId: number;
  academicYearName?: string;
  academicYearStatus?: AcademicYearStatusLite;
  yearReadOnly?: boolean;
  name: string;
  code: string;
  category: SubjectCategory;
  defaultWeeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  description?: string | null;
  active: boolean;
  mappedClassCount?: number;
  teacherAllocationCount?: number;
  mappings?: ClassSubjectMappingDto[];
}

export interface SubjectsMappingDashboard {
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: AcademicYearStatusLite;
  yearReadOnly: boolean;
  classCount: number;
  sectionCount: number;
  subjectCount: number;
  subjectsActive: number;
  unmappedSubjectCount: number;
  subjects: SubjectDto[];
}

export interface SubjectCreateRequest {
  academicYearId: number;
  name: string;
  code?: string;
  category: SubjectCategory;
  defaultWeeklyPeriods: number;
  timetablePreference: SubjectTimetablePreference;
  description?: string;
}

export interface ClassSubjectMappingUpsertRequest {
  subjectId: number;
  included: boolean;
  weeklyPeriods?: number;
  timetablePreference?: SubjectTimetablePreference;
}

export const ACADEMICS_SUBJECTS_RESOURCE = 'ACADEMICS_SUBJECTS';

export const SUBJECT_CATEGORY_OPTIONS: { label: string; value: SubjectCategory }[] = [
  { label: 'Core', value: 'CORE' },
  { label: 'Language', value: 'LANGUAGE' },
  { label: 'Activity', value: 'ACTIVITY' },
  { label: 'Lab', value: 'LAB' },
  { label: 'Practical', value: 'PRACTICAL' }
];

export const TIMETABLE_PREFERENCE_OPTIONS: { label: string; value: SubjectTimetablePreference }[] = [
  { label: 'No Preference', value: 'ANY' },
  { label: 'First half', value: 'FIRST_HALF' },
  { label: 'Second half', value: 'SECOND_HALF' }
];
