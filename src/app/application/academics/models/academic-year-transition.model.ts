export type AcademicTransitionStatus =
  | 'NOT_STARTED'
  | 'PREPARING'
  | 'READY'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVATED'
  | 'BLOCKED'
  | 'FAILED';

/** Transitions are managed under Academic Year privileges. */
export const ACADEMICS_TRANSITION_RESOURCE = 'ACADEMICS_ACADEMIC_YEAR';

export interface AcademicYearTransition {
  academicYearTransitionId: number;
  sourceAcademicYearId: number;
  sourceAcademicYearName?: string;
  targetAcademicYearId: number;
  targetAcademicYearName?: string;
  status: AcademicTransitionStatus;
  copyClasses: boolean;
  copySections: boolean;
  copySubjects: boolean;
  copyMappings: boolean;
  copyAllocations: boolean;
  startedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  failureReason?: string;
}

/** @deprecated Prefer AcademicYearTransition */
export type AcademicYearTransitionDto = AcademicYearTransition;

export interface AcademicYearTransitionRequest {
  targetAcademicYearId: number;
  copyClasses?: boolean;
  copySections?: boolean;
  copySubjects?: boolean;
  copyMappings?: boolean;
  copyAllocations?: boolean;
}
