export type AcademicStage =
  | 'PRE_PRIMARY'
  | 'PRIMARY'
  | 'MIDDLE'
  | 'SECONDARY'
  | 'HIGHER_SECONDARY';

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

export interface AcademicSectionDto {
  sectionId: number;
  academicGroupId: number;
  academicGroupName?: string;
  academicGroupCode?: string;
  name: string;
  code: string;
  capacity?: number | null;
  displayOrder?: number;
  defaultResourceId?: number | null;
  active: boolean;
  studentCount?: number;
  sectionTeacherName?: string | null;
  sectionTeacherStaffId?: number | null;
}

export interface AcademicGroupDto {
  academicGroupId: number;
  academicYearId: number;
  academicYearName?: string;
  academicYearStatus?: AcademicYearStatusLite;
  yearReadOnly?: boolean;
  name: string;
  code: string;
  /** Optional classification; null for organizations that do not use stages. */
  stage?: AcademicStage | null;
  description?: string | null;
  displayOrder?: number;
  active: boolean;
  sectionCount?: number;
  sectionsActive?: number;
  studentCount?: number;
  subjectCount?: number;
  teacherCount?: number;
  timetableStatus?: 'PUBLISHED' | 'DRAFT' | 'NOT_GENERATED';
  sectionTeacherName?: string | null;
  sectionTeacherStaffId?: number | null;
  sections?: AcademicSectionDto[];
}

export interface AcademicGroupSummary {
  academicGroupId: number;
  sectionCount: number;
  activeSectionCount: number;
  studentCount: number;
  subjectCount: number;
  teacherCount: number;
  /** Year-level timetable state. */
  timetableStatus: 'PUBLISHED' | 'DRAFT' | 'NOT_GENERATED';
}

export interface AcademicGroupsDashboard {
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: AcademicYearStatusLite;
  yearReadOnly: boolean;
  academicGroupCount: number;
  academicGroupsActive: number;
  sectionCount: number;
  sectionsActive: number;
  studentCount: number;
  academicGroups: AcademicGroupDto[];
}

export interface AcademicGroupCreateRequest {
  academicYearId: number;
  name: string;
  code?: string;
  stage?: AcademicStage | null;
  description?: string;
  displayOrder?: number;
  /** Sections created in the same request as the group. Omit for a group without sections. */
  sections?: AcademicSectionCreateRequest[];
}

export interface AcademicSectionCreateRequest {
  name: string;
  code?: string;
  /** Optional section capacity. */
  capacity?: number | null;
  displayOrder?: number;
  defaultResourceId?: number | null;
  sectionTeacherStaffId?: number | null;
}

export const ACADEMICS_ACADEMIC_GROUPS_RESOURCE = 'ACADEMICS_CLASSES';

export const ACADEMIC_STAGE_OPTIONS: { label: string; value: AcademicStage }[] = [
  { label: 'Pre-Primary', value: 'PRE_PRIMARY' },
  { label: 'Primary', value: 'PRIMARY' },
  { label: 'Middle', value: 'MIDDLE' },
  { label: 'Secondary', value: 'SECONDARY' },
  { label: 'Higher Secondary', value: 'HIGHER_SECONDARY' }
];
