import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { StaffAttendanceApiService } from '../../../attendance/services/staff-attendance-api.service';
import {
  StaffAttendanceTodayResponse,
  StaffAttendanceToggleData,
  StaffAttendanceWidgetState
} from '../../models/dashboard.model';

/**
 * Reusable Staff Attendance dashboard widget.
 * Timer display is derived from server signInTime — never a local counter source of truth.
 */
@Component({
  selector: 'tc-staff-attendance-toggle-widget',
  standalone: true,
  imports: [AppToastComponent, CommonModule, MenuModule, DatePipe],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toast key="attendance"></app-toast>
    <article class="w-att" [attr.data-state]="widgetState">
      <header class="w-att__header">
        <h3>Today's Attendance</h3>
        <div class="w-att__header-actions">
          <button type="button" class="w-att__icon-btn" title="About attendance" aria-label="About attendance">
            <i class="pi pi-question-circle"></i>
          </button>
          <button
            type="button"
            class="w-att__icon-btn"
            title="More actions"
            aria-label="More actions"
            (click)="menu.toggle($event)">
            <i class="pi pi-ellipsis-v"></i>
          </button>
          <p-menu #menu [model]="menuItems" [popup]="true" appendTo="body"></p-menu>
        </div>
      </header>

      <div class="w-att__body" *ngIf="!loading; else loadingTpl">
        <!-- Status icon + title -->
        <div class="w-att__status">
          <div class="w-att__icon-wrap">
            <i class="pi" [ngClass]="statusIcon"></i>
          </div>
          <h4 class="w-att__title">{{ statusTitle }}</h4>
          <p class="w-att__subtitle">{{ statusSubtitle }}</p>
          <p class="w-att__detail" *ngIf="statusDetail">{{ statusDetail }}</p>
        </div>

        <!-- Timer (not started / active) -->
        <div class="w-att__timer" *ngIf="showTimer">
          <div class="w-att__timer-digits">
            <span>{{ elapsed.hours }}</span>
            <span class="w-att__timer-sep">:</span>
            <span>{{ elapsed.minutes }}</span>
            <span class="w-att__timer-sep">:</span>
            <span>{{ elapsed.seconds }}</span>
          </div>
          <div class="w-att__timer-labels">
            <span>Hours</span>
            <span>Minutes</span>
            <span>Seconds</span>
          </div>
        </div>

        <!-- Actions -->
        <button
          *ngIf="widgetState === 'NOT_STARTED'"
          type="button"
          class="w-att__btn w-att__btn--primary"
          [disabled]="submitting"
          (click)="onSignIn()">
          <i class="pi" [ngClass]="submitting ? 'pi-spin pi-spinner' : 'pi-play'"></i>
          {{ submitting ? 'Signing In...' : 'Sign In' }}
        </button>

        <button
          *ngIf="widgetState === 'ACTIVE'"
          type="button"
          class="w-att__btn w-att__btn--danger"
          [disabled]="submitting"
          (click)="onSignOut()">
          <i class="pi" [ngClass]="submitting ? 'pi-spin pi-spinner' : 'pi-stop'"></i>
          {{ submitting ? 'Signing Out...' : 'Sign Out' }}
        </button>

        <!-- Active meta -->
        <div class="w-att__live" *ngIf="widgetState === 'ACTIVE' && state.signInTime">
          <div class="w-att__live-row">
            <span class="w-att__muted">Signed In</span>
            <strong>{{ state.signInTime | date:'h:mm a' }}</strong>
          </div>
          <div class="w-att__live-badge">
            <span class="w-att__pulse"></span>
            Live tracking...
          </div>
        </div>

        <!-- Completed summary -->
        <div class="w-att__completed" *ngIf="widgetState === 'COMPLETED'">
          <div class="w-att__times">
            <div>
              <span class="w-att__muted">Sign In</span>
              <strong>{{ state.signInTime | date:'h:mm a' }}</strong>
            </div>
            <div>
              <span class="w-att__muted">Sign Out</span>
              <strong>{{ state.signOutTime | date:'h:mm a' }}</strong>
            </div>
          </div>
          <div class="w-att__total">
            <span class="w-att__muted">Total Working Hours</span>
            <strong>{{ formatWorkingHours(state.workingMinutesSoFar) }}</strong>
          </div>
          <div class="w-att__note w-att__note--info" *ngIf="!state.autoClosed">
            <i class="pi pi-chart-bar"></i>
            <span>Great job! Keep up the good work.</span>
          </div>
          <div class="w-att__note w-att__note--warn" *ngIf="state.autoClosed">
            <i class="pi pi-info-circle"></i>
            <span>Automatically signed out after 24 hours.</span>
          </div>
        </div>

        <!-- Non-working note -->
        <div class="w-att__note w-att__note--info" *ngIf="widgetState === 'WEEKEND' || widgetState === 'HOLIDAY' || widgetState === 'ON_LEAVE'">
          <i class="pi pi-info-circle"></i>
          <span>{{ nonWorkingMessage }}</span>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div class="w-att__loading">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading attendance…</span>
        </div>
      </ng-template>

      <footer class="w-att__footer">
        <span><i class="pi pi-calendar"></i>{{ footerDateLabel }}</span>
        <span *ngIf="state.organizationName"><i class="pi pi-map-marker"></i>{{ state.organizationName }}</span>
      </footer>
    </article>
  `
})
export class StaffAttendanceToggleWidgetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() data?: StaffAttendanceToggleData;

  private readonly api = inject(StaffAttendanceApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  state: StaffAttendanceToggleData = {
    signedIn: false,
    signedOut: false,
    state: 'NOT_STARTED',
    attendanceRequired: true,
    workingMinutesSoFar: 0
  };

  submitting = false;
  loading = false;
  elapsed = { hours: '00', minutes: '00', seconds: '00' };

  readonly menuItems: MenuItem[] = [
    {
      label: 'View Attendance',
      icon: 'pi pi-calendar',
      command: () => void this.router.navigateByUrl('/app/attendance/staff')
    }
  ];

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (this.data) {
      this.applyToggleData(this.data);
    }
    this.refreshFromApi(false);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && !this.submitting) {
      this.applyToggleData(this.data);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.refreshFromApi(true);
    }
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.refreshFromApi(true);
  }

  get widgetState(): StaffAttendanceWidgetState {
    return (this.state.state as StaffAttendanceWidgetState) || 'NOT_STARTED';
  }

  get showTimer(): boolean {
    return this.widgetState === 'NOT_STARTED' || this.widgetState === 'ACTIVE';
  }

  get statusIcon(): string {
    switch (this.widgetState) {
      case 'ACTIVE':
        return 'pi-user';
      case 'COMPLETED':
        return 'pi-check';
      case 'WEEKEND':
      case 'HOLIDAY':
        return 'pi-calendar';
      case 'ON_LEAVE':
        return 'pi-briefcase';
      default:
        return 'pi-clock';
    }
  }

  get statusTitle(): string {
    switch (this.widgetState) {
      case 'ACTIVE':
        return 'Present';
      case 'COMPLETED':
        return 'Attendance Completed';
      case 'WEEKEND':
        return 'Weekend';
      case 'HOLIDAY':
        return 'Holiday';
      case 'ON_LEAVE':
        return 'On Leave';
      default:
        return 'Not Signed In';
    }
  }

  get statusSubtitle(): string {
    switch (this.widgetState) {
      case 'ACTIVE':
        return 'You are currently signed in.';
      case 'COMPLETED':
        return 'Thank you for being here today!';
      case 'WEEKEND':
        return 'Today is a weekend. Attendance is not required.';
      case 'HOLIDAY':
        return 'Attendance is not required.';
      case 'ON_LEAVE':
        return 'Attendance is not required.';
      default:
        return 'Your attendance for today is not started yet.';
    }
  }

  get statusDetail(): string | null {
    if (this.widgetState === 'HOLIDAY') {
      return this.state.holidayName || null;
    }
    if (this.widgetState === 'ON_LEAVE') {
      return this.state.leaveLabel || 'Approved Leave';
    }
    return null;
  }

  get nonWorkingMessage(): string {
    if (this.widgetState === 'WEEKEND') {
      return 'Enjoy your day! Take time to rest and recharge.';
    }
    if (this.widgetState === 'HOLIDAY') {
      return this.state.holidayName
        ? `${this.state.holidayName} — enjoy your holiday.`
        : 'Enjoy your holiday.';
    }
    return this.state.leaveLabel || 'You are on approved leave today.';
  }

  get footerDateLabel(): string {
    const raw = this.state.date || new Date().toISOString().slice(0, 10);
    const d = new Date(raw + (raw.length === 10 ? 'T12:00:00' : ''));
    if (Number.isNaN(d.getTime())) {
      return raw;
    }
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatWorkingHours(minutes?: number | null): string {
    const total = Math.max(0, minutes ?? 0);
    const hrs = Math.floor(total / 60);
    const mins = total % 60;
    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  }

  onSignIn(): void {
    if (this.submitting || this.widgetState !== 'NOT_STARTED') return;
    this.submitting = true;
    this.cdr.markForCheck();
    this.api.signIn().subscribe({
      next: response => {
        this.applyTodayResponse(response);
        this.submitting = false;
        this.messages.add({
          key: 'attendance',
          severity: 'success',
          summary: 'Signed in',
          detail: 'Your attendance has been recorded.'
        });
        this.cdr.markForCheck();
      },
      error: err => {
        this.submitting = false;
        const code = err?.error?.code as string | undefined;
        if (code === 'ATTENDANCE_NOT_REQUIRED' || code === 'ATTENDANCE_ALREADY_COMPLETED') {
          this.refreshFromApi(true);
        }
        this.messages.add({
          key: 'attendance',
          severity: 'error',
          summary: 'Unable to sign in',
          detail: err?.error?.message || 'Please try again.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  onSignOut(): void {
    if (this.submitting || this.widgetState !== 'ACTIVE') return;
    this.submitting = true;
    this.cdr.markForCheck();
    this.api.signOut().subscribe({
      next: response => {
        this.applyTodayResponse(response);
        this.submitting = false;
        this.messages.add({
          key: 'attendance',
          severity: 'success',
          summary: 'Signed out',
          detail: 'Have a great rest of your day!'
        });
        this.cdr.markForCheck();
      },
      error: err => {
        // Keep timer running on failure — do not clear ACTIVE state.
        this.submitting = false;
        const code = err?.error?.code as string | undefined;
        if (code === 'ATTENDANCE_NOT_ACTIVE' || code === 'ATTENDANCE_ALREADY_COMPLETED') {
          this.refreshFromApi(true);
        }
        this.messages.add({
          key: 'attendance',
          severity: 'error',
          summary: 'Unable to sign out',
          detail: err?.error?.message || 'Please try again.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  private refreshFromApi(silent: boolean): void {
    if (!silent) {
      this.loading = !this.data;
    }
    this.api.getMyToday().subscribe({
      next: response => {
        this.applyTodayResponse(response);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        if (!silent) {
          this.messages.add({
            key: 'attendance',
            severity: 'warn',
            summary: 'Attendance',
            detail: 'Could not refresh attendance status.'
          });
        }
        this.cdr.markForCheck();
      }
    });
  }

  private applyTodayResponse(response: StaffAttendanceTodayResponse): void {
    this.applyToggleData({
      staffId: response.staffId,
      staffName: response.staffName,
      organizationName: response.organizationName,
      date: response.date,
      state: response.state,
      status: response.status as string | undefined,
      attendanceRequired: response.attendanceRequired,
      attendanceId: response.attendanceId,
      signedIn: !!response.signInTime,
      signedOut: !!response.signOutTime,
      active: response.active,
      autoClosed: response.autoClosed,
      signInTime: this.normalizeServerDateTime(response.signInTime),
      signOutTime: this.normalizeServerDateTime(response.signOutTime),
      workingMinutesSoFar: response.workingMinutes,
      holidayName: response.holidayName,
      leaveLabel: response.leaveLabel,
      reason: response.reason
    });
  }

  /**
   * Backend stores LocalDateTime in UTC (JVM) without an offset.
   * Append Z so Date / DatePipe treat it as UTC instead of local wall time.
   */
  private normalizeServerDateTime(value?: string | null): string | undefined {
    if (!value) return undefined;
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return value;
    return value + 'Z';
  }

  private parseServerDateTime(value: string): number | null {
    const normalized = this.normalizeServerDateTime(value) ?? value;
    const ms = Date.parse(normalized);
    return Number.isNaN(ms) ? null : ms;
  }

  private applyToggleData(data: StaffAttendanceToggleData): void {
    this.state = {
      ...data,
      state: data.state || this.deriveState(data),
      signInTime: this.normalizeServerDateTime(data.signInTime),
      signOutTime: this.normalizeServerDateTime(data.signOutTime),
      workingMinutesSoFar: data.workingMinutesSoFar ?? 0
    };
    this.syncTimer();
    this.cdr.markForCheck();
  }

  private deriveState(data: StaffAttendanceToggleData): StaffAttendanceWidgetState {
    if (data.signedOut && data.signOutTime) return 'COMPLETED';
    if (data.signedIn && data.signInTime && !data.signOutTime) return 'ACTIVE';
    return 'NOT_STARTED';
  }

  private syncTimer(): void {
    this.stopTimer();
    this.tickElapsed();
    if (this.widgetState === 'ACTIVE' && this.state.signInTime) {
      this.timerId = setInterval(() => {
        this.tickElapsed();
        this.cdr.markForCheck();
      }, 1000);
    } else if (this.widgetState === 'NOT_STARTED') {
      this.elapsed = { hours: '00', minutes: '00', seconds: '00' };
    }
  }

  private tickElapsed(): void {
    if (this.widgetState !== 'ACTIVE' || !this.state.signInTime) {
      if (this.widgetState === 'NOT_STARTED') {
        this.elapsed = { hours: '00', minutes: '00', seconds: '00' };
      }
      return;
    }
    const start = this.parseServerDateTime(this.state.signInTime);
    if (start == null) {
      this.elapsed = { hours: '00', minutes: '00', seconds: '00' };
      return;
    }
    const totalSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    this.elapsed = {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0')
    };
  }

  private stopTimer(): void {
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
