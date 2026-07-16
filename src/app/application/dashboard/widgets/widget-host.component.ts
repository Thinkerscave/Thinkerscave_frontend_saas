import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { WidgetDTO } from '../models/dashboard.model';
import { chromeFor } from './widget-registry';
import { WidgetCardComponent } from './widget-card/widget-card.component';
import { WelcomeHeaderWidgetComponent } from './welcome-header/welcome-header.widget';
import { KpiGridWidgetComponent } from './kpi-grid/kpi-grid.widget';
import { ChartWidgetComponent } from './chart/chart.widget';
import { StatListWidgetComponent } from './stat-list/stat-list.widget';
import { RecentActivityWidgetComponent } from './recent-activity/recent-activity.widget';
import { PendingTasksWidgetComponent } from './pending-tasks/pending-tasks.widget';
import { NotificationsWidgetComponent } from './notifications/notifications.widget';
import { AnnouncementsWidgetComponent } from './announcements/announcements.widget';
import { CalendarWidgetComponent } from './calendar/calendar.widget';
import { AttendanceSummaryWidgetComponent } from './attendance-summary/attendance-summary.widget';
import { StaffAttendanceToggleWidgetComponent } from './staff-attendance-toggle/staff-attendance-toggle.widget';
import { FeeSummaryWidgetComponent } from './fee-summary/fee-summary.widget';
import { TimetableWidgetComponent } from './timetable/timetable.widget';
import { ProfileSummaryWidgetComponent } from './profile-summary/profile-summary.widget';
import { ChildProfileWidgetComponent } from './child-profile/child-profile.widget';
import { QuickActionsWidgetComponent } from './quick-actions/quick-actions.widget';
import { RecentRecordsWidgetComponent } from './recent-records/recent-records.widget';
import { SystemHealthWidgetComponent } from './system-health/system-health.widget';
import { TopOrganizationsWidgetComponent } from './top-organizations/top-organizations.widget';
import { LeaveSummaryWidgetComponent } from './leave-summary/leave-summary.widget';
import { LibrarySummaryWidgetComponent } from './library-summary/library-summary.widget';
import { TransportSummaryWidgetComponent } from './transport-summary/transport-summary.widget';
import { SupportTicketsWidgetComponent } from './support-tickets/support-tickets.widget';

/**
 * The dashboard shell's ONLY switch-like construct — and it is keyed
 * exclusively by `WidgetType`, never by user role. Adding a new widget
 * later means: one new `WidgetType` enum value (backend), one provider
 * method (backend), and one new `*ngSwitchCase` line here.
 */
@Component({
  selector: 'tc-widget-host',
  standalone: true,
  imports: [
    CommonModule,
    WidgetCardComponent,
    WelcomeHeaderWidgetComponent,
    KpiGridWidgetComponent,
    ChartWidgetComponent,
    StatListWidgetComponent,
    RecentActivityWidgetComponent,
    PendingTasksWidgetComponent,
    NotificationsWidgetComponent,
    AnnouncementsWidgetComponent,
    CalendarWidgetComponent,
    AttendanceSummaryWidgetComponent,
    StaffAttendanceToggleWidgetComponent,
    FeeSummaryWidgetComponent,
    TimetableWidgetComponent,
    ProfileSummaryWidgetComponent,
    ChildProfileWidgetComponent,
    QuickActionsWidgetComponent,
    RecentRecordsWidgetComponent,
    SystemHealthWidgetComponent,
    TopOrganizationsWidgetComponent,
    LeaveSummaryWidgetComponent,
    LibrarySummaryWidgetComponent,
    TransportSummaryWidgetComponent,
    SupportTicketsWidgetComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-host.component.html'
})
export class WidgetHostComponent {
  @Input({ required: true }) widget!: WidgetDTO<any>;
  @Output() retry = new EventEmitter<WidgetDTO<any>>();

  get chrome() {
    return chromeFor(this.widget.widgetType);
  }
}
