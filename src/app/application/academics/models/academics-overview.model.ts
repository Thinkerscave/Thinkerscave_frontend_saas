export const ACADEMICS_OVERVIEW_RESOURCE = 'ACADEMICS_OVERVIEW';

export interface AcademicsOverview {
  yearHeader: {
    academicYearId: number;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    yearReadOnly: boolean;
    progressPercent: number;
    daysCompleted?: number;
    daysRemaining?: number;
    totalDays?: number;
  };
  structureCounts: {
    academicGroupsActive: number;
    academicGroupsTotal: number;
    sectionsActive: number;
    sectionsTotal: number;
    subjectsActive: number;
    subjectsTotal: number;
    studentsActive: number;
  };
  mapping: {
    subjectsMapped: number;
    subjectsTotal: number;
    pendingMappings: number;
  };
  allocation: {
    assignedSlots: number;
    totalSlots: number;
    missingSlots: number;
  };
  timetable: {
    publishedVersion?: number | null;
    latestVersion?: number | null;
    generationStatus?: string | null;
    status?: string | null;
    openBlockingConflicts: number;
  };
  readinessSteps: { code: string; label: string; state: string; detail?: string }[];
  alerts: { severity: string; code: string; message: string; route?: string }[];
  topAcademicGroups: {
    academicGroupId: number;
    academicGroupName: string;
    sectionCount: number;
    studentCount?: number;
    sectionTeacherName?: string | null;
  }[];
  topSubjects: {
    subjectId: number;
    subjectName: string;
    code?: string;
    category?: string;
    mappedAcademicGroupCount?: number;
    defaultWeeklyPeriods?: number;
    teacherStatus?: string;
  }[];
  setupCompletePercent?: number;
  importantDates?: { label: string; date: string; endDate?: string; code?: string }[];
  studentsByAcademicGroup?: { academicGroupId?: number | null; academicGroupName: string; studentCount: number; percent: number }[];
}
