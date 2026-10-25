export const ACADEMICS_MY_ACADEMIC_GROUPS_RESOURCE = 'ACADEMICS_MY_CLASSES';
export const ACADEMICS_MY_TIMETABLE_RESOURCE = 'ACADEMICS_MY_TIMETABLE';
export const ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE = 'ACADEMICS_ACADEMIC_STRUCTURE';
export const ACADEMICS_MY_ACADEMICS_RESOURCE = 'ACADEMICS_MY_ACADEMICS';

export interface TeacherMyAcademicGroups {
  summary: {
    academicGroupCount: number;
    sectionCount: number;
    subjectCount: number;
    weeklyPeriods: number;
    studentCount?: number;
  };
  academicGroups: {
    academicGroupId: number;
    academicGroupName: string;
    academicGroupCode?: string;
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
    sectionTeacher: boolean;
  }[];
}

export interface TeacherAcademicStructure {
  academicYearId: number;
  academicYearName: string;
  academicGroups: {
    academicGroupId: number;
    academicGroupName: string;
    academicGroupCode?: string;
    sections: {
      sectionId: number;
      sectionName: string;
      sectionCode?: string;
      capacity?: number;
      subjects: {
        subjectId: number;
        subjectName: string;
        subjectCode?: string;
        weeklyPeriods: number;
      }[];
    }[];
  }[];
}

export interface AcademicStructureTreeStage {
  stage: string;
  academicGroups: {
    academicGroupId: number;
    academicGroupName: string;
    academicGroupCode?: string;
    active?: boolean;
    sections: {
      sectionId: number;
      sectionName: string;
      sectionCode?: string;
      capacity?: number;
      active?: boolean;
    }[];
  }[];
}

export interface StudentMyAcademics {
  studentName: string;
  admissionNumber?: string;
  academicGroupId?: number;
  academicGroupName?: string;
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
  sectionTeacher?: { staffId: number; staffName: string } | null;
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
      academicGroupName?: string;
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
    academicGroupName?: string;
    sectionName?: string;
    roomName?: string;
  }[];
  message?: string;
}
