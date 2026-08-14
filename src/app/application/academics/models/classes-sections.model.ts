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

export interface ClassSectionDto {
  sectionId: number;
  classId: number;
  className?: string;
  classCode?: string;
  name: string;
  code: string;
  capacity?: number | null;
  displayOrder?: number;
  defaultResourceId?: number | null;
  active: boolean;
  studentCount?: number;
  classTeacherName?: string | null;
  classTeacherStaffId?: number | null;
}

export interface AcademicClassDto {
  classId: number;
  academicYearId: number;
  academicYearName?: string;
  academicYearStatus?: AcademicYearStatusLite;
  yearReadOnly?: boolean;
  name: string;
  code: string;
  stage: AcademicStage;
  displayOrder?: number;
  active: boolean;
  sectionCount?: number;
  sectionsActive?: number;
  studentCount?: number;
  classTeacherName?: string | null;
  classTeacherStaffId?: number | null;
  sections?: ClassSectionDto[];
}

export interface ClassesSectionsDashboard {
  academicYearId: number;
  academicYearName: string;
  academicYearStatus: AcademicYearStatusLite;
  yearReadOnly: boolean;
  classCount: number;
  classesActive: number;
  sectionCount: number;
  sectionsActive: number;
  studentCount: number;
  classes: AcademicClassDto[];
}

export interface AcademicClassCreateRequest {
  academicYearId: number;
  name: string;
  code?: string;
  stage: AcademicStage;
  displayOrder?: number;
}

export interface AcademicSectionCreateRequest {
  name: string;
  code?: string;
  capacity?: number | null;
  displayOrder?: number;
  defaultResourceId?: number | null;
  classTeacherStaffId?: number | null;
}

export const ACADEMICS_CLASSES_RESOURCE = 'ACADEMICS_CLASSES';

export const ACADEMIC_STAGE_OPTIONS: { label: string; value: AcademicStage }[] = [
  { label: 'Pre-Primary', value: 'PRE_PRIMARY' },
  { label: 'Primary', value: 'PRIMARY' },
  { label: 'Middle', value: 'MIDDLE' },
  { label: 'Secondary', value: 'SECONDARY' },
  { label: 'Higher Secondary', value: 'HIGHER_SECONDARY' }
];
