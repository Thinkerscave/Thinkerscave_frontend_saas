import { StaffAttendanceStatus } from '../../dashboard/models/dashboard.model';

export type RegularizationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type HistoryDisplayStatus =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'WEEKEND'
  | 'HOLIDAY'
  | 'HALF_DAY'
  | 'WFH'
  | 'NOT_STARTED'
  | 'FUTURE';

export interface StaffAttendanceHistoryDay {
  date: string;
  dayOfWeek?: string;
  displayStatus: HistoryDisplayStatus | string;
  status?: StaffAttendanceStatus | string;
  attendanceId?: number;
  signInTime?: string;
  signOutTime?: string;
  workingMinutes?: number | null;
  attendanceRequired?: boolean;
  autoClosed?: boolean;
  holidayName?: string;
  leaveLabel?: string;
  regularizationStatus?: RegularizationRequestStatus | null;
  regularizationRequestId?: number | null;
  canRegularize?: boolean;
}

export interface RegularizationRequest {
  requestId: number;
  staffId?: number;
  staffName?: string;
  department?: string;
  attendanceId?: number;
  attendanceDate: string;
  requestedStatus: StaffAttendanceStatus | string;
  requestedSignInTime?: string;
  requestedSignOutTime?: string;
  requestedWorkingMinutes?: number;
  reason?: string;
  remarks?: string;
  status: RegularizationRequestStatus;
  requestedBy?: string;
  requestedAt?: string;
  decisionBy?: string;
  decisionAt?: string;
  decisionComment?: string;
  previousStatus?: StaffAttendanceStatus | string;
  previousSignInTime?: string;
  previousSignOutTime?: string;
  previousWorkingMinutes?: number;
  currentStatus?: StaffAttendanceStatus | string;
  currentSignInTime?: string;
  currentSignOutTime?: string;
  currentWorkingMinutes?: number;
}

export interface CreateRegularizationPayload {
  attendanceDate: string;
  requestedStatus: string;
  requestedSignInTime?: string | null;
  requestedSignOutTime?: string | null;
  reason: string;
  remarks?: string;
}

export interface RegularizationDecisionPayload {
  comment: string;
}
