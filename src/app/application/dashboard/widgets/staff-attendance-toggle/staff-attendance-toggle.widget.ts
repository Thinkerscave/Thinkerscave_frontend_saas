import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DashboardService } from '../../services/dashboard.service';
import { StaffAttendanceToggleData } from '../../models/dashboard.model';

/**
 * Prominent, live sign-in/sign-out control for the Staff dashboard. Seeded
 * from the workspace payload on load; sign-in/out actions call the real
 * attendance endpoints directly (no workspace re-fetch needed).
 */
@Component({
  selector: 'tc-staff-attendance-toggle-widget',
  standalone: true,
  imports: [CommonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" key="attendance"></p-toast>
    <div class="w-attendance-toggle">
      <div class="w-attendance-toggle__status">
        <span class="w-attendance-toggle__dot" [attr.data-active]="state.signedIn && !state.signedOut" [attr.data-done]="state.signedOut"></span>
        <div class="w-attendance-toggle__label">
          <h4>{{ statusHeadline() }}</h4>
          <p>
            <ng-container *ngIf="state.signInTime">Signed in at {{ state.signInTime | date:'h:mm a' }}</ng-container>
            <ng-container *ngIf="state.signOutTime"> · Signed out at {{ state.signOutTime | date:'h:mm a' }}</ng-container>
            <ng-container *ngIf="!state.signInTime">You haven't signed in yet today.</ng-container>
            <ng-container *ngIf="state.workingMinutesSoFar && !state.signOutTime"> · {{ minutesLabel(state.workingMinutesSoFar) }} so far</ng-container>
          </p>
        </div>
      </div>
      <div class="w-attendance-toggle__actions">
        <button type="button" class="w-btn w-btn--primary" [disabled]="submitting || (state.signedIn && !!state.signInTime)" (click)="onSignIn()">
          <i class="pi" [ngClass]="submitting ? 'pi-spin pi-spinner' : 'pi-sign-in'"></i>Sign In
        </button>
        <button type="button" class="w-btn w-btn--danger" [disabled]="submitting || !state.signInTime || !!state.signOutTime" (click)="onSignOut()">
          <i class="pi" [ngClass]="submitting ? 'pi-spin pi-spinner' : 'pi-sign-out'"></i>Sign Out
        </button>
      </div>
    </div>
  `
})
export class StaffAttendanceToggleWidgetComponent implements OnChanges {
  @Input({ required: true }) data!: StaffAttendanceToggleData;

  private readonly dashboardService = inject(DashboardService);
  private readonly messages = inject(MessageService);

  state!: StaffAttendanceToggleData;
  submitting = false;

  ngOnChanges(): void {
    // The workspace call is the single source of truth for this widget's
    // seed state; re-syncing on every incoming `data` change (e.g. a manual
    // dashboard refresh) keeps it correct across tabs/devices without an
    // extra round trip on initial load.
    if (!this.submitting) {
      this.state = { ...this.data };
    }
  }

  statusHeadline(): string {
    if (this.state.signedOut) return "You've signed out for today";
    if (this.state.signedIn && this.state.signInTime) return "You're signed in";
    return 'Ready to start your day?';
  }

  minutesLabel(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  onSignIn(): void {
    if (this.submitting || !this.state.staffId) return;
    this.submitting = true;
    this.dashboardService.signIn(this.state.staffId).subscribe({
      next: response => {
        this.state = {
          ...this.state,
          signedIn: true,
          signInTime: response.signInTime,
          status: response.status
        };
        this.submitting = false;
        this.messages.add({ key: 'attendance', severity: 'success', summary: 'Signed in', detail: 'Your attendance has been recorded.' });
      },
      error: () => {
        this.submitting = false;
        this.messages.add({ key: 'attendance', severity: 'error', summary: 'Sign-in failed', detail: 'Please try again in a moment.' });
      }
    });
  }

  onSignOut(): void {
    if (this.submitting || !this.state.staffId) return;
    this.submitting = true;
    this.dashboardService.signOut(this.state.staffId).subscribe({
      next: response => {
        this.state = {
          ...this.state,
          signedOut: true,
          signOutTime: response.signOutTime,
          workingMinutesSoFar: response.workingMinutes,
          status: response.status
        };
        this.submitting = false;
        this.messages.add({ key: 'attendance', severity: 'success', summary: 'Signed out', detail: 'Have a great rest of your day!' });
      },
      error: () => {
        this.submitting = false;
        this.messages.add({ key: 'attendance', severity: 'error', summary: 'Sign-out failed', detail: 'Please try again in a moment.' });
      }
    });
  }
}
