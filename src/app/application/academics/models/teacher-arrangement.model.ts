export interface TeacherOption {
  staffId: number;
  name: string;
}

export interface EligibleArrangementSlot {
  timetableEntryId: number;
  className: string;
  sectionName: string;
  subjectName: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  candidates: TeacherOption[];
  substituteStaffId: number | null;
}

export interface TeacherArrangementRequest {
  academicYearId: number;
  absenceDate: string;
  absentTeacherId: number;
  reason: string;
  slots: { timetableEntryId: number; substituteStaffId: number }[];
}

export interface TeacherArrangement {
  arrangementId: number;
  academicYearId: number;
  academicYearName: string;
  absenceDate: string;
  absentTeacherId: number;
  absentTeacherName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  slots: {
    timetableEntryId: number;
    className: string;
    sectionName: string;
    subjectName: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    substituteStaffId: number;
    substituteTeacherName: string;
  }[];
}