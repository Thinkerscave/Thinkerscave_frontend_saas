/** Shim of the backend AcademicsLookupController LookupDTO. */
export interface AcademicLookupItem {
  id: number;
  name: string;
  status?: string;
}

export type AttendanceMode = 'DAILY' | 'PERIOD_WISE';
export type StudentStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'ON_LEAVE';

export interface RosterStudent {
  studentId: number;
  studentName: string;
  rollNumber?: string | null;
  admissionNumber?: string | null;
  /** PHOTO document id; the image is fetched through the authenticated download endpoint. */
  photoDocumentId?: number | null;
  /** Client-only object URL created from the downloaded photo blob. */
  photoObjectUrl?: string | null;
  /** null means the student is not marked yet (Not Marked). */
  status: StudentStatus | null;
  remarks?: string | null;
}

export interface StudentRoster {
  attendanceDate: string;
  classId: number;
  className?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
  academicYearId?: number | null;
  attendanceMode: AttendanceMode;
  attendanceRequired: boolean;
  holiday: boolean;
  weekend: boolean;
  holidayName?: string | null;
  dayReason?: string | null;
  frozen: boolean;
  /** Backend decision from ATTENDANCE_EDITING_POLICY; false blocks all writes. */
  editable: boolean;
  editabilityReason?: string | null;
  students: RosterStudent[];
}

export interface StudentSession {
  date: string;
  classId: number;
  className: string;
  sectionId?: number | null;
  sectionName?: string | null;
  expectedStudents: number;
  totalMarked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercent: number;
  holiday: boolean;
  weekend: boolean;
  dayReason?: string | null;
  status: 'COMPLETED' | 'PARTIAL';
}

export interface AttendanceCalendarDay {
  date: string;
  attendancePercent?: number | null;
  /** GOOD | AVERAGE | LOW | NO_DATA | HOLIDAY | WEEKEND */
  status: string;
  dayType: 'WORKING' | 'HOLIDAY' | 'WEEKEND';
  holidayName?: string | null;
}

export interface AttendanceCalendarData {
  year: number;
  month: number;
  classId?: number | null;
  className?: string | null;
  sectionId?: number | null;
  days: AttendanceCalendarDay[];
}

export interface ClassAttendanceSummary {
  attendanceDate: string;
  classId: number;
  className?: string | null;
  sectionId?: number | null;
  sectionName?: string | null;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercent: number;
}

export interface MarkAttendanceEntry {
  studentId: number;
  studentName: string;
  rollNumber?: string | null;
  admissionNumber?: string | null;
  status: StudentStatus;
  remarks?: string | null;
}

export interface MarkDailyAttendanceRequest {
  academicYearId: number | null;
  classId: number;
  sectionId?: number | null;
  attendanceDate: string;
  entries: MarkAttendanceEntry[];
}

export interface MarkPeriodAttendanceRequest extends MarkDailyAttendanceRequest {
  periodId: number;
  periodNumber?: number | null;
  periodName?: string | null;
  subjectName?: string | null;
}

export interface AttendanceSummaryReportPayload {
  fromDate: string;
  toDate: string;
  classId?: number | null;
  sectionId?: number | null;
  defaulterThreshold?: number;
}