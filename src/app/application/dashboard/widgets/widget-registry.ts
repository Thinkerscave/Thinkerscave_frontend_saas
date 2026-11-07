import { WidgetType } from '../models/dashboard.model';

export interface WidgetChrome {
  icon: string;
  emptyIcon: string;
  emptyMessage: string;
}

const DEFAULT_CHROME: WidgetChrome = {
  icon: 'pi pi-th-large',
  emptyIcon: 'pi pi-inbox',
  emptyMessage: 'Nothing to show here yet.'
};

/**
 * Single lookup table the dashboard shell uses to decorate each widget's
 * card chrome (icon + empty-state copy). The component that actually
 * *renders* is chosen by `WidgetHostComponent`'s `[ngSwitch]`, keyed off
 * the same `WidgetType` — this is the only "switch"-like construct in the
 * whole module, and it is keyed by widget type, never by user role.
 */
export const WIDGET_CHROME: Record<WidgetType, WidgetChrome> = {
  WELCOME_HEADER: { icon: 'pi pi-sun', emptyIcon: 'pi pi-sun', emptyMessage: 'Welcome!' },
  KPI_GRID: { icon: 'pi pi-chart-bar', emptyIcon: 'pi pi-chart-bar', emptyMessage: 'No metrics available yet.' },
  CHART: { icon: 'pi pi-chart-line', emptyIcon: 'pi pi-chart-line', emptyMessage: 'Not enough data to chart yet.' },
  STAT_LIST: { icon: 'pi pi-list', emptyIcon: 'pi pi-list', emptyMessage: 'Nothing to show here yet.' },
  RECENT_ACTIVITY: { icon: 'pi pi-history', emptyIcon: 'pi pi-history', emptyMessage: 'No recent activity.' },
  PENDING_TASKS: { icon: 'pi pi-check-square', emptyIcon: 'pi pi-check-circle', emptyMessage: "You're all caught up!" },
  NOTIFICATIONS: { icon: 'pi pi-bell', emptyIcon: 'pi pi-bell', emptyMessage: 'No notifications right now.' },
  ANNOUNCEMENTS: { icon: 'pi pi-megaphone', emptyIcon: 'pi pi-megaphone', emptyMessage: 'No announcements yet.' },
  CALENDAR: { icon: 'pi pi-calendar', emptyIcon: 'pi pi-calendar', emptyMessage: 'No calendar events scheduled.' },
  EVENTS: { icon: 'pi pi-calendar-plus', emptyIcon: 'pi pi-calendar-plus', emptyMessage: 'No upcoming events.' },
  ATTENDANCE_SUMMARY: { icon: 'pi pi-calendar-check', emptyIcon: 'pi pi-calendar-check', emptyMessage: 'No attendance recorded yet.' },
  STAFF_ATTENDANCE_TOGGLE: { icon: 'pi pi-clock', emptyIcon: 'pi pi-clock', emptyMessage: 'Attendance is unavailable right now.' },
  STAFF_ATTENDANCE_WEEK: { icon: 'pi pi-chart-bar', emptyIcon: 'pi pi-chart-bar', emptyMessage: 'No weekly attendance summary is available.' },
  TIMETABLE: { icon: 'pi pi-clock', emptyIcon: 'pi pi-clock', emptyMessage: 'No classes scheduled.' },
  PROFILE_SUMMARY: { icon: 'pi pi-user', emptyIcon: 'pi pi-user', emptyMessage: 'Profile unavailable.' },
  CHILD_PROFILE: { icon: 'pi pi-users', emptyIcon: 'pi pi-users', emptyMessage: 'No linked children found.' },
  QUICK_ACTIONS: { icon: 'pi pi-bolt', emptyIcon: 'pi pi-bolt', emptyMessage: 'No quick actions available.' },
  RECENT_RECORDS: { icon: 'pi pi-table', emptyIcon: 'pi pi-table', emptyMessage: 'No recent records found.' },
  TOP_ORGANIZATIONS: { icon: 'pi pi-trophy', emptyIcon: 'pi pi-trophy', emptyMessage: 'No organizations to rank yet.' }
};

export function chromeFor(type: WidgetType): WidgetChrome {
  return WIDGET_CHROME[type] ?? DEFAULT_CHROME;
}
