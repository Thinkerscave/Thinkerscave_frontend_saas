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
    classesActive: number;
    classesTotal: number;
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
  topClasses: {
    classId: number;
    className: string;
    sectionCount: number;
    studentCount?: number;
    classTeacherName?: string | null;
  }[];
  topSubjects: {
    subjectId: number;
    subjectName: string;
    code?: string;
    category?: string;
    mappedClassCount?: number;
    defaultWeeklyPeriods?: number;
    teacherStatus?: string;
  }[];
  setupCompletePercent?: number;
  importantDates?: { label: string; date: string; endDate?: string; code?: string }[];
  studentsByClass?: { classId?: number | null; className: string; studentCount: number; percent: number }[];
}
