import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasTabsComponent,
  SaasFilterRowComponent,
  SaasTab
} from '../../../../shared/ui/saas';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { PermissionService } from '../../../../core/services/permission.service';
import { StaffAttendanceApiService } from '../../services/staff-attendance-api.service';
import { StaffAttendanceTodayResponse } from '../../../dashboard/models/dashboard.model';
import {
  CreateRegularizationPayload,
  RegularizationRequest,
  StaffAttendanceHistoryDay
} from '../../models/staff-attendance.model';
import { extractApiError } from '../../../../shared/utils/api-error.util';

type HistoryView = 'calendar' | 'list';
type PageTab = 'my' | 'regularization' | 'approvers';

interface DayCell {
  date: string | null;
  day: number;
  otherMonth: boolean;
  record?: StaffAttendanceHistoryDay;
}

@Component({
  selector: 'app-attendance-staff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    InputTextarea,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent,
    SaasTabsComponent,
    SaasFilterRowComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './attendance-staff.component.html',
  styleUrl: './attendance-staff.component.scss'
})
export class AttendanceStaffComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(StaffAttendanceApiService);
  private readonly permissions = inject(PermissionService);
  private readonly messages = inject(MessageService);

  readonly menuCode = 'ATTENDANCE_STAFF';
  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly statusOptions = [
    { label: 'Present', value: 'PRESENT' },
    { label: 'Late', value: 'LATE' },
    { label: 'Half Day', value: 'HALF_DAY' },
    { label: 'WFH', value: 'WFH' },
    { label: 'Absent', value: 'ABSENT' }
  ];
  readonly regStatusFilters = [
    { label: 'All statuses', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' }
  ];

  activeTab: PageTab = 'my';
  historyView: HistoryView = 'calendar';
  monthCursor = new Date();
  selectedDate: string | null = null;

  today: StaffAttendanceTodayResponse | null = null;
  history: StaffAttendanceHistoryDay[] = [];
  historyLoading = false;
  todayBusy = false;
  elapsed = { hours: '00', minutes: '00', seconds: '00' };
  private timerId: ReturnType<typeof setInterval> | null = null;

  myRequests: RegularizationRequest[] = [];
  pendingRequests: RegularizationRequest[] = [];
  pendingCount = 0;
  regSearch = '';
  regStatusFilter = '';
  regLoading = false;
  approverLoading = false;

  // Regularization modal
  regModalVisible = false;
  regSubmitting = false;
  regForm = this.emptyRegForm();
  regFormDate: Date | null = null;
  regFormSignIn: Date | null = null;
  regFormSignOut: Date | null = null;

  // Detail / review modals
  detailVisible = false;
  detailDay: StaffAttendanceHistoryDay | null = null;
  reviewVisible = false;
  reviewRequest: RegularizationRequest | null = null;
  decisionVisible = false;
  decisionMode: 'APPROVE' | 'REJECT' = 'APPROVE';
  decisionComment = '';
  decisionSubmitting = false;

  ngOnInit(): void {
    this.refreshToday();
    this.loadHistory();
    if (this.canApprove) {
      this.loadPendingCount();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  @HostListener('document:visibilitychange')
  onVisibility(): void {
    if (document.visibilityState === 'visible' && this.activeTab === 'my') {
      this.refreshToday(true);
    }
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(this.menuCode);
  }

  get tabs(): SaasTab[] {
    const tabs: SaasTab[] = [
      { key: 'my', label: 'My Attendance' },
      { key: 'regularization', label: 'Regularization' }
    ];
    if (this.canApprove) {
      tabs.push({
        key: 'approvers',
        label: 'Approvers',
        badge: this.pendingCount > 0 ? this.pendingCount : null
      });
    }
    return tabs;
  }

  get monthLabel(): string {
    return this.monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  get selectedDay(): StaffAttendanceHistoryDay | null {
    if (!this.selectedDate) return null;
    return this.history.find(d => d.date === this.selectedDate) || null;
  }

  get calendarCells(): DayCell[] {
    const year = this.monthCursor.getFullYear();
    const month = this.monthCursor.getMonth();
    const first = new Date(year, month, 1);
    // Monday-first
    const mondayOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDate = new Map(this.history.map(d => [d.date, d]));
    const cells: DayCell[] = [];
    for (let i = 0; i < mondayOffset; i++) {
      cells.push({ date: null, day: 0, otherMonth: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: iso, day: d, otherMonth: false, record: byDate.get(iso) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, day: 0, otherMonth: true });
    }
    return cells;
  }

  get listRows(): StaffAttendanceHistoryDay[] {
    return [...this.history].sort((a, b) => b.date.localeCompare(a.date));
  }

  get filteredMyRequests(): RegularizationRequest[] {
    const q = this.regSearch.trim().toLowerCase();
    return this.myRequests.filter(r => {
      if (this.regStatusFilter && r.status !== this.regStatusFilter) return false;
      if (!q) return true;
      return (
        (r.reason || '').toLowerCase().includes(q) ||
        (r.attendanceDate || '').includes(q) ||
        (r.requestedStatus || '').toLowerCase().includes(q)
      );
    });
  }

  get computedWorkingHoursLabel(): string {
    if (!this.regFormSignIn || !this.regFormSignOut) return '—';
    const mins = Math.max(0, Math.round((this.regFormSignOut.getTime() - this.regFormSignIn.getTime()) / 60000));
    return this.formatMinutes(mins);
  }

  onTabChange(key: string): void {
    this.activeTab = key as PageTab;
    if (key === 'my') {
      this.refreshToday();
      this.loadHistory();
    } else if (key === 'regularization') {
      this.loadMyRegularizations();
    } else if (key === 'approvers') {
      this.loadPendingApprovals();
    }
    this.cdr.markForCheck();
  }

  setHistoryView(view: HistoryView): void {
    this.historyView = view;
    this.cdr.markForCheck();
  }

  prevMonth(): void {
    this.monthCursor = new Date(this.monthCursor.getFullYear(), this.monthCursor.getMonth() - 1, 1);
    this.selectedDate = null;
    this.loadHistory();
  }

  nextMonth(): void {
    this.monthCursor = new Date(this.monthCursor.getFullYear(), this.monthCursor.getMonth() + 1, 1);
    this.selectedDate = null;
    this.loadHistory();
  }

  selectDay(cell: DayCell): void {
    if (!cell.date || cell.otherMonth) return;
    this.selectedDate = cell.date;
    this.cdr.markForCheck();
  }

  refreshToday(silent = false): void {
    this.api.getMyToday().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        this.today = {
          ...response,
          signInTime: this.normalizeServerDateTime(response.signInTime) ?? response.signInTime,
          signOutTime: this.normalizeServerDateTime(response.signOutTime) ?? response.signOutTime
        };
        this.syncTimer();
        this.cdr.markForCheck();
      },
      error: err => {
        if (!silent) {
          this.toastError('Unable to load today\'s attendance', err);
        }
        this.cdr.markForCheck();
      }
    });
  }

  loadHistory(): void {
    const year = this.monthCursor.getFullYear();
    const month = this.monthCursor.getMonth();
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    this.historyLoading = true;
    this.api.getMyHistory(from, to)
      .pipe(finalize(() => { this.historyLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: days => {
          this.history = days;
          if (!this.selectedDate) {
            const todayIso = this.toIsoDate(new Date());
            if (days.some(d => d.date === todayIso)) {
              this.selectedDate = todayIso;
            }
          }
        },
        error: err => {
          this.history = [];
          this.toastError('Unable to load attendance history', err);
        }
      });
  }

  onSignIn(): void {
    if (this.todayBusy) return;
    this.todayBusy = true;
    this.api.signIn()
      .pipe(finalize(() => { this.todayBusy = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.today = response;
          this.syncTimer();
          this.messages.add({ severity: 'success', summary: 'Signed in', detail: 'Your attendance has been recorded.' });
          this.loadHistory();
        },
        error: err => {
          this.toastError('Unable to sign in', err);
          this.refreshToday(true);
        }
      });
  }

  onSignOut(): void {
    if (this.todayBusy) return;
    this.todayBusy = true;
    this.api.signOut()
      .pipe(finalize(() => { this.todayBusy = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.today = response;
          this.syncTimer();
          this.messages.add({ severity: 'success', summary: 'Signed out', detail: 'Have a great rest of your day!' });
          this.loadHistory();
        },
        error: err => {
          this.toastError('Unable to sign out', err);
        }
      });
  }

  openRegularizeForDay(day: StaffAttendanceHistoryDay | null): void {
    if (!day || !day.canRegularize) return;
    this.openRegModal(day.date);
  }

  openRegModal(dateIso?: string): void {
    this.regForm = this.emptyRegForm();
    this.regFormDate = dateIso ? new Date(dateIso + 'T12:00:00') : new Date();
    this.regFormSignIn = null;
    this.regFormSignOut = null;
    this.regModalVisible = true;
    this.cdr.markForCheck();
  }

  submitRegularization(): void {
    if (!this.regFormDate || !this.regForm.reason.trim()) return;
    const payload: CreateRegularizationPayload = {
      attendanceDate: this.toIsoDate(this.regFormDate),
      requestedStatus: this.regForm.requestedStatus,
      requestedSignInTime: this.regFormSignIn
        ? this.combineDateAndTime(this.regFormDate, this.regFormSignIn)
        : null,
      requestedSignOutTime: this.regFormSignOut
        ? this.combineDateAndTime(this.regFormDate, this.regFormSignOut)
        : null,
      reason: this.regForm.reason.trim(),
      remarks: this.regForm.remarks?.trim() || undefined
    };
    this.regSubmitting = true;
    this.api.createRegularization(payload)
      .pipe(finalize(() => { this.regSubmitting = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.regModalVisible = false;
          this.messages.add({
            severity: 'success',
            summary: 'Request submitted',
            detail: 'Your regularization request is pending approval.'
          });
          this.loadMyRegularizations();
          this.loadHistory();
          if (this.canApprove) this.loadPendingCount();
        },
        error: err => this.toastError('Unable to submit regularization', err)
      });
  }

  loadMyRegularizations(): void {
    this.regLoading = true;
    this.api.listMyRegularizations()
      .pipe(finalize(() => { this.regLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rows => { this.myRequests = rows; },
        error: err => {
          this.myRequests = [];
          this.toastError('Unable to load regularization requests', err);
        }
      });
  }

  loadPendingApprovals(): void {
    this.approverLoading = true;
    this.api.listPendingRegularizations()
      .pipe(finalize(() => { this.approverLoading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: rows => {
          this.pendingRequests = rows;
          this.pendingCount = rows.length;
        },
        error: err => {
          this.pendingRequests = [];
          this.toastError('Unable to load pending requests', err);
        }
      });
  }

  loadPendingCount(): void {
    this.api.pendingRegularizationCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: count => { this.pendingCount = count; this.cdr.markForCheck(); },
        error: () => { /* badge is optional */ }
      });
  }

  openDayDetail(day: StaffAttendanceHistoryDay): void {
    this.detailDay = day;
    this.detailVisible = true;
    this.cdr.markForCheck();
  }

  openReview(request: RegularizationRequest): void {
    this.api.getRegularization(request.requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: full => {
          this.reviewRequest = full;
          this.reviewVisible = true;
          this.cdr.markForCheck();
        },
        error: err => this.toastError('Unable to load request', err)
      });
  }

  openDecision(mode: 'APPROVE' | 'REJECT'): void {
    this.decisionMode = mode;
    this.decisionComment = '';
    this.decisionVisible = true;
    this.cdr.markForCheck();
  }

  confirmDecision(): void {
    if (!this.reviewRequest || !this.decisionComment.trim()) return;
    this.decisionSubmitting = true;
    const id = this.reviewRequest.requestId;
    const payload = { comment: this.decisionComment.trim() };
    const call = this.decisionMode === 'APPROVE'
      ? this.api.approveRegularization(id, payload)
      : this.api.rejectRegularization(id, payload);
    call.pipe(finalize(() => { this.decisionSubmitting = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.decisionVisible = false;
          this.reviewVisible = false;
          this.messages.add({
            severity: 'success',
            summary: this.decisionMode === 'APPROVE' ? 'Approved' : 'Rejected',
            detail: this.decisionMode === 'APPROVE'
              ? 'Attendance has been updated.'
              : 'Attendance was left unchanged.'
          });
          this.loadPendingApprovals();
          this.loadHistory();
        },
        error: err => this.toastError(
          this.decisionMode === 'APPROVE' ? 'Unable to approve' : 'Unable to reject',
          err
        )
      });
  }

  viewMyRequest(request: RegularizationRequest): void {
    this.reviewRequest = request;
    this.reviewVisible = true;
    this.cdr.markForCheck();
  }

  todayStateLabel(): string {
    switch (this.today?.state) {
      case 'ACTIVE': return 'Present';
      case 'COMPLETED': return 'Attendance Completed';
      case 'WEEKEND': return 'Weekend';
      case 'HOLIDAY': return 'Holiday';
      case 'ON_LEAVE': return 'On Leave';
      default: return 'Not Signed In';
    }
  }

  statusTone(status?: string | null): 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary' {
    switch ((status || '').toUpperCase()) {
      case 'PRESENT': return 'success';
      case 'LATE':
      case 'HALF_DAY': return 'warning';
      case 'ABSENT': return 'danger';
      case 'ON_LEAVE':
      case 'HOLIDAY':
      case 'WEEKEND': return 'info';
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  }

  formatTime(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value.length === 10 ? value + 'T12:00:00' : value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDay(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value.length === 10 ? value + 'T12:00:00' : value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }

  formatMinutes(minutes?: number | null): string {
    if (minutes == null) return '—';
    const hrs = Math.floor(Math.max(0, minutes) / 60);
    const mins = Math.max(0, minutes) % 60;
    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  }

  formatTimeRange(inTime?: string | null, outTime?: string | null): string {
    if (!inTime && !outTime) return '—';
    return `${this.formatTime(inTime)}–${this.formatTime(outTime)}`;
  }

  actionLabel(day: StaffAttendanceHistoryDay): string {
    if (day.regularizationStatus === 'PENDING') return 'Pending';
    if (day.regularizationStatus === 'APPROVED') return 'Approved';
    if (day.canRegularize && day.displayStatus === 'ABSENT') return 'Regularize';
    if (day.canRegularize) return 'View';
    if (day.displayStatus === 'WEEKEND' || day.displayStatus === 'HOLIDAY' || day.displayStatus === 'ON_LEAVE') {
      return '—';
    }
    return 'View';
  }

  onListAction(day: StaffAttendanceHistoryDay): void {
    const label = this.actionLabel(day);
    if (label === 'Regularize') {
      this.openRegularizeForDay(day);
    } else if (label === 'View' || label === 'Pending' || label === 'Approved') {
      this.openDayDetail(day);
    }
  }

  private syncTimer(): void {
    this.stopTimer();
    this.tickElapsed();
    if (this.today?.state === 'ACTIVE' && this.today.signInTime) {
      this.timerId = setInterval(() => {
        this.tickElapsed();
        this.cdr.markForCheck();
      }, 1000);
    }
  }

  private tickElapsed(): void {
    if (this.today?.state !== 'ACTIVE' || !this.today.signInTime) {
      this.elapsed = { hours: '00', minutes: '00', seconds: '00' };
      return;
    }
    const start = this.parseServerDateTime(this.today.signInTime);
    if (start == null) {
      this.elapsed = { hours: '00', minutes: '00', seconds: '00' };
      return;
    }
    const total = Math.max(0, Math.floor((Date.now() - start) / 1000));
    this.elapsed = {
      hours: String(Math.floor(total / 3600)).padStart(2, '0'),
      minutes: String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
      seconds: String(total % 60).padStart(2, '0')
    };
  }

  private parseServerDateTime(value: string): number | null {
    const normalized = this.normalizeServerDateTime(value) ?? value;
    const ms = Date.parse(normalized);
    return Number.isNaN(ms) ? null : ms;
  }

  /** Backend LocalDateTime is UTC without offset — append Z for correct local display. */
  private normalizeServerDateTime(value?: string | null): string | undefined {
    if (!value) return undefined;
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return value;
    return value + 'Z';
  }

  private stopTimer(): void {
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private emptyRegForm(): { requestedStatus: string; reason: string; remarks: string } {
    return { requestedStatus: 'PRESENT', reason: '', remarks: '' };
  }

  private toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private combineDateAndTime(date: Date, time: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  }

  private toastError(summary: string, err: unknown): void {
    const parsed = extractApiError(err, 'Please try again.');
    this.messages.add({ severity: 'error', summary, detail: parsed.message });
  }
}
