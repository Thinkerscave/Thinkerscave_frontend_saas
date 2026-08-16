export const ACADEMICS_MY_CLASSES_RESOURCE = 'ACADEMICS_MY_CLASSES';
export const ACADEMICS_MY_TIMETABLE_RESOURCE = 'ACADEMICS_MY_TIMETABLE';
export const ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE = 'ACADEMICS_ACADEMIC_STRUCTURE';
export const ACADEMICS_MY_ACADEMICS_RESOURCE = 'ACADEMICS_MY_ACADEMICS';

export interface TeacherMyClasses {
  summary: {
    classCount: number;
    sectionCount: number;
    subjectCount: number;
    weeklyPeriods: number;
    studentCount?: number;
  };
  classes: {
    classId: number;
    className: string;
    classCode?: string;
    sectionId: number;
    sectionName: string;
    studentCount?: number;
    roomName?: string;
    subjects: {
      subjectId: number;
      subjectName: string;
      weeklyPeriods: number;
      allocationId?: number;
    }[];
    classTeacher: boolean;
  }[];
}

export interface TeacherAcademicStructure {
  academicYearId: number;
  academicYearName: string;
  classes: {
    classId: number;
    className: string;
    classCode?: string;
    sections: {
      sectionId: number;
      sectionName: string;
      sectionCode?: string;
      subjects: {
        subjectId: number;
        subjectName: string;
        subjectCode?: string;
        weeklyPeriods: number;
      }[];
    }[];
  }[];
}

export interface StudentMyAcademics {
  studentName: string;
  admissionNumber?: string;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  rollNumber?: string;
  academicYearId?: number;
  academicYearName?: string;
  subjects: {
    subjectId: number;
    subjectName: string;
    subjectCode?: string;
    weeklyPeriods: number;
  }[];
  classTeacher?: { staffId: number; staffName: string } | null;
  publishedTimetableExists: boolean;
}

export interface MyTimetable {
  role: string;
  academicYearId: number;
  grid?: {
    timetableVersionId?: number;
    view?: string;
    periods: { periodNumber: number; name: string; startTime?: string; endTime?: string; slotKind?: string }[];
    workingDays: string[];
    cells: {
      dayOfWeek: string;
      periodId: number;
      periodNumber: number;
      subjectName?: string;
      className?: string;
      sectionName?: string;
      staffName?: string;
      resourceName?: string;
      entryType?: string;
    }[];
  } | null;
  todaySchedule: {
    periodNumber: number;
    periodLabel?: string;
    startTime?: string;
    endTime?: string;
    subjectName?: string;
    className?: string;
    sectionName?: string;
    roomName?: string;
  }[];
  message?: string;
}
