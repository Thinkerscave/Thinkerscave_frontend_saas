export type AcademicYearStatus =
  | 'DRAFT'
  | 'PREPARING'
  | 'READY_FOR_APPROVAL'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CURRENT'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'REJECTED';

export type AcademicYearPattern = 'ANNUAL' | 'SEMESTER' | 'TRIMESTER' | 'TERM' | 'CUSTOM';

export type ReadinessState = 'COMPLETE' | 'PENDING' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface YearStructureStats {
  classesTotal: number;
  classesActive: number;
  sectionsTotal: number;
  sectionsActive: number;
  subjectsTotal: number;
  subjectsActive: number;
  studentsActive: number;
}

export interface ReadinessStep {
  code: string;
  label: string;
  state: ReadinessState;
  detail?: string | null;
}

export interface AcademicYearDto {
  academicYearId: number;
  name: string;
  startDate: string;
  endDate: string;
  pattern: AcademicYearPattern;
  status: AcademicYearStatus;
  active: boolean;
  progressPercent?: number;
  daysCompleted?: number;
  daysRemaining?: number;
  structureStats?: YearStructureStats;
  readinessSteps?: ReadinessStep[];
  readinessPercent?: number;
  readinessCompletedSteps?: number;
  readinessTotalSteps?: number;
  rejectionReason?: string | null;
  updatedBy?: string | null;
  updatedOn?: string | null;
  createdBy?: string | null;
  createdOn?: string | null;
}

export interface AcademicYearDashboard {
  currentYear: AcademicYearDto | null;
  upcomingYear: AcademicYearDto | null;
  history: AcademicYearDto[];
  totalYears: number;
}

export interface AcademicYearCreateRequest {
  name: string;
  startDate: string;
  endDate: string;
  pattern: AcademicYearPattern;
}

export const ACADEMIC_YEAR_RESOURCE = 'ACADEMICS_ACADEMIC_YEAR';
