/**
 * Frontend mirror of the backend `com.thinkerscave.dashboard` DTO contract.
 * The dashboard shell never branches on user role — it resolves a
 * `DashboardType` purely for display purposes and renders `widgets` in the
 * order the backend returns them, keyed only by `WidgetType`.
 */

export type DashboardType =
  | 'SUPER_ADMIN'
  | 'ORG_OWNER'
  | 'ORG_ADMIN'
  | 'STAFF'
  | 'STUDENT'
  | 'PARENT'
  | 'DEFAULT';

export type WidgetType =
  | 'WELCOME_HEADER'
  | 'KPI_GRID'
  | 'CHART'
  | 'STAT_LIST'
  | 'RECENT_ACTIVITY'
  | 'PENDING_TASKS'
  | 'NOTIFICATIONS'
  | 'ANNOUNCEMENTS'
  | 'CALENDAR'
  | 'EVENTS'
  | 'ATTENDANCE_SUMMARY'
  | 'STAFF_ATTENDANCE_TOGGLE'
  | 'FEE_SUMMARY'
  | 'ACADEMIC_SUMMARY'
  | 'TIMETABLE'
  | 'PROFILE_SUMMARY'
  | 'CHILD_PROFILE'
  | 'QUICK_ACTIONS'
  | 'RECENT_RECORDS'
  | 'REPORTS'
  | 'SYSTEM_HEALTH'
  | 'TOP_ORGANIZATIONS'
  | 'LEAVE_SUMMARY'
  | 'EXAMINATION_SUMMARY'
  | 'LIBRARY_SUMMARY'
  | 'TRANSPORT_SUMMARY'
  | 'SUPPORT_TICKETS'
  | 'PROMOTION_BANNER';

export type DataMode = 'LIVE' | 'SAMPLE';

/** `LOADING` is a purely client-side state used before the API response arrives. */
export type WidgetState = 'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR';

export interface WidgetDTO<T = unknown> {
  widgetKey: string;
  widgetType: WidgetType;
  title?: string;
  subtitle?: string;
  /** Layout hint: how many of the 4 desktop grid columns this widget should span (1-4). */
  span?: number;
  dataMode: DataMode;
  state: WidgetState;
  errorMessage?: string;
  data: T;
}

export interface DashboardResponse {
  dashboardType: DashboardType;
  generatedAt: string;
  /** Payload shape varies per `widgetType` (see `WidgetHostComponent`'s switch) — mirrors the backend's `WidgetDTO<?>`. */
  widgets: WidgetDTO<any>[];
}

/* ───────────────────────── Widget payload shapes ───────────────────────── */

export interface WelcomeHeaderData {
  displayName?: string;
  roleLabel?: string;
  organizationName?: string;
  greeting?: string;
  avatarUrl?: string;
  todayLabel?: string;
}

export interface KpiItem {
  label: string;
  value: string;
  icon?: string;
  tone?: string;
  trendPercent?: number | null;
  trendLabel?: string;
  sample?: boolean;
}

export interface KpiGridData {
  items: KpiItem[];
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartData {
  /** "line" | "bar" | "donut" | "area" */
  chartType: string;
  labels: string[];
  series: ChartSeries[];
  unit?: string;
}

export interface StatListItem {
  label: string;
  value: string;
  icon?: string;
  tone?: string;
  secondaryLabel?: string;
}

export interface StatListData {
  items: StatListItem[];
}

export interface ActivityItem {
  title: string;
  description?: string;
  actorName?: string;
  occurredAt?: string;
  icon?: string;
}

export interface RecentActivityData {
  items: ActivityItem[];
}

export interface TaskItem {
  title: string;
  dueLabel?: string;
  /** "high" | "medium" | "low" */
  priority?: string;
  completed?: boolean;
  link?: string;
  sample?: boolean;
}

export interface PendingTasksData {
  items: TaskItem[];
}

export interface NotificationItem {
  title: string;
  message?: string;
  date?: string;
  category?: string;
  pinned?: boolean;
}

export interface NotificationsData {
  items: NotificationItem[];
  unreadCount: number;
}

export interface AnnouncementItem {
  title: string;
  summary?: string;
  category?: string;
  publishedAt?: string;
  pinned?: boolean;
}

export interface AnnouncementsData {
  items: AnnouncementItem[];
}

export interface CalendarEventItem {
  title: string;
  startDate: string;
  endDate?: string;
  eventType?: string;
  allDay?: boolean;
}

/** Shared payload shape for both the CALENDAR and EVENTS widget types. */
export interface CalendarData {
  items: CalendarEventItem[];
}

export interface AttendanceSummaryData {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalCount: number;
  percentage: number;
  date?: string;
}

export interface StaffAttendanceToggleData {
  staffId: number;
  signedIn: boolean;
  signedOut: boolean;
  signInTime?: string;
  signOutTime?: string;
  workingMinutesSoFar?: number;
  status?: string;
}

export interface FeeSummaryData {
  totalDue: number;
  totalPaid: number;
  pendingAmount: number;
  nextDueDate?: string;
  pendingInvoices: number;
  currency?: string;
}

export interface TimetableSlotItem {
  periodNumber?: number;
  periodName?: string;
  startTime?: string;
  endTime?: string;
  subjectName?: string;
  teacherName?: string;
  className?: string;
  roomLabel?: string;
}

export interface TimetableData {
  dayLabel?: string;
  slots: TimetableSlotItem[];
}

export interface ProfileSummaryData {
  displayName?: string;
  email?: string;
  mobileNumber?: string;
  roleLabel?: string;
  organizationName?: string;
  avatarUrl?: string;
}

export interface ChildItem {
  studentId: number;
  displayName: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;
  photoUrl?: string;
  selected?: boolean;
}

/** List-based, future-ready for multiple children per parent. */
export interface ChildProfileData {
  children: ChildItem[];
}

export interface QuickActionItem {
  label: string;
  icon?: string;
  route?: string;
  tone?: string;
}

export interface QuickActionsData {
  items: QuickActionItem[];
}

export interface RecordItem {
  primaryLabel: string;
  secondaryLabel?: string;
  statusLabel?: string;
  statusTone?: string;
  timestampLabel?: string;
  extra?: Record<string, string>;
}

export interface RecentRecordsData {
  columns: string[];
  items: RecordItem[];
}

export interface SystemHealthData {
  overallStatus: string;
  checks: StatListItem[];
}

export interface TopOrgItem {
  organizationName: string;
  institutionType?: string;
  activeUsers: number;
  planName?: string;
}

export interface TopOrganizationsData {
  items: TopOrgItem[];
}

export interface LeaveSummaryData {
  availableDays: number;
  usedDays: number;
  pendingRequests: number;
  lastRequestStatus?: string;
}

export interface ExaminationSummaryData {
  upcoming: StatListItem[];
}

export interface LibrarySummaryData {
  booksIssued: number;
  booksOverdue: number;
  fineDue: number;
}

export interface TransportSummaryData {
  routeName?: string;
  vehicleNumber?: string;
  pickupTime?: string;
  dropTime?: string;
  liveStatus?: string;
}

export interface TicketItem {
  subject: string;
  status?: string;
  priority?: string;
  raisedAgo?: string;
}

export interface SupportTicketsData {
  openCount: number;
  items: TicketItem[];
}

/* ───────────────────────── Staff attendance passthrough ───────────────────────── */

export type StaffAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' | 'HALF_DAY' | 'WFH';

export interface StaffAttendanceResponse {
  attendanceId?: number;
  staffId: number;
  staffName?: string;
  staffCode?: string;
  department?: string;
  designation?: string;
  attendanceDate?: string;
  signInTime?: string;
  signOutTime?: string;
  workingMinutes?: number;
  shift?: string;
  status?: StaffAttendanceStatus;
  remarks?: string;
  markedBy?: string;
}
