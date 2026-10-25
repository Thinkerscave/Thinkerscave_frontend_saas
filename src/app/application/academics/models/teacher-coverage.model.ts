export type CoverageSource = 'INHERITED' | 'OVERRIDE' | 'NONE';
export type CoverageRowStatus = 'ASSIGNED' | 'PARTIAL' | 'UNASSIGNED';
export type CoverageScope = 'ALL_SECTIONS' | 'SELECTED_SECTIONS';
export type CoverageAction = 'ASSIGN_GROUP' | 'CLEAR_GROUP' | 'ASSIGN_SECTIONS' | 'CLEAR_SECTIONS';

export interface CoverageTeacher {
  staffId: number;
  name: string;
  staffCode: string | null;
}

export interface CoverageSection {
  sectionId: number;
  sectionName: string;
  teacher: CoverageTeacher | null;
  source: CoverageSource;
}

export interface CoverageRow {
  mappingId: number;
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  subjectType: string;
  weeklyPeriods: number;
  requirement: string;
  scope: CoverageScope;
  sectionsTotal: number;
  sectionsAssigned: number;
  groupTeacher: CoverageTeacher | null;
  assignedTeacher: CoverageTeacher | null;
  multipleTeachers: boolean;
  status: CoverageRowStatus;
  workloadStatus: string | null;
  sections: CoverageSection[];
}

export interface CoverageSectionOption {
  sectionId: number;
  name: string;
  code: string | null;
}

export interface CoverageBoard {
  academicYearId: number;
  academicYearName: string;
  yearReadOnly: boolean;
  academicGroupId: number;
  academicGroupName: string;
  academicGroupCode: string | null;
  hasSections: boolean;
  sections: CoverageSectionOption[];
  summary: {
    subjectsRequiringTeachers: number;
    fullyAllocated: number;
    workloadWarnings: number;
    timetableConflicts: number | null;
    timetableConflictStatus: string;
  };
  rows: CoverageRow[];
}

export interface CoverageCandidate {
  staffId: number;
  name: string;
  staffCode: string | null;
  primarySubjectName: string | null;
  secondarySubjectName: string | null;
  preferenceRank: number;
  currentPeriods: number;
  projectedPeriods: number;
  maxPeriods: number;
  workloadStatus: string;
}

export interface CoverageChange {
  mappingId: number;
  action: CoverageAction;
  staffId: number | null;
  sectionIds: number[];
  replaceOverrides: boolean;
}

export interface CoverageSaveRequest {
  academicGroupId: number;
  changes: CoverageChange[];
  confirmImpact: boolean;
}

export interface CoveragePreview {
  valid: boolean;
  requiresConfirmation: boolean;
  affectedSections: { mappingId: number; subjectName: string; sectionName: string; fromTeacher: string | null; toTeacher: string | null }[];
  workloadWarnings: { staffId: number; staffName: string; projectedPeriods: number; maxPeriods: number }[];
  impacts: { mappingId: number; subjectName: string; type: string; count: number; message: string }[];
}
