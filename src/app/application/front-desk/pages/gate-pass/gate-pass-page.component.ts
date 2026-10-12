import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { WorkspaceSwitcherService } from '../../../../core/services/workspace-switcher.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { FrontDeskApiService, StudentDirectoryRow } from '../../front-desk-api.service';

@Component({
  selector: 'app-gate-pass-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, AppPaginatorComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        <button type="button" class="tc-btn tc-btn--primary" title="Issues an early-exit pass only when today's attendance is Present" [disabled]="!canIssue" (click)="issue()">Issue gate pass</button>
      </tc-saas-page-header>
      <tc-saas-panel title="Early exit">
        <div class="desk-form">
        <label>Student <input [(ngModel)]="lookup" name="lookup" (ngModelChange)="search($event)" /></label>
        <ul>
          @for (student of students; track student.studentId) {
            <li><button type="button" class="tc-btn" (click)="pick(student)">{{ student.studentName }} · {{ student.className }} · {{ student.sectionName }} · {{ student.rollNumber }}</button></li>
          }
        </ul>
        @if (attendance) { <p>Attendance today: {{ attendance }}</p> }
        <label>Reason <input [(ngModel)]="reason" name="reason" /></label>
        <label>Pickup person <input [(ngModel)]="pickupPerson" name="pickupPerson" /></label>
        <label>Verification
          <select [(ngModel)]="verificationMode" name="verificationMode">
            <option value="CALL">Call</option>
            <option value="OTP">OTP</option>
          </select>
        </label>
        @if (verificationMode === 'OTP' && selected) {
          <button type="button" class="tc-btn" (click)="sendOtp()">Send OTP</button>
          <label>Code <input [(ngModel)]="otp" name="otp" /></label>
          <button type="button" class="tc-btn" (click)="verifyOtp()">Verify</button>
        }
        </div>
      </tc-saas-panel>
      <tc-saas-panel [title]="'Issued · ' + total">
        <div class="tc-table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Reason</th><th>Pickup</th><th>Verification</th><th></th></tr></thead>
            <tbody>
              @for (row of rows; track row['id']) {
                <tr>
                  <td>{{ row['studentName'] }} · {{ row['className'] }} · {{ row['sectionName'] }}</td>
                  <td>{{ row['reason'] }}</td>
                  <td>{{ row['pickupPerson'] }}</td>
                  <td>{{ row['verificationMode'] }} · {{ row['issuedAt'] }}</td>
                  <td><button type="button" class="tc-btn" (click)="print(row)">Print</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-paginator [page]="page" [rows]="size" [totalRecords]="total" (pageChange)="onPage($event)" />
      </tc-saas-panel>
      @if (printable) {
        <article class="desk-print">
          <h1>{{ orgName }}</h1>
          <p>{{ printable['studentName'] }} · {{ printable['className'] }} · {{ printable['sectionName'] }}</p>
          <p>{{ printable['reason'] }}</p>
          <p>Pickup: {{ printable['pickupPerson'] }}</p>
          <p>Verification: {{ printable['verificationMode'] }}</p>
          <p>{{ printable['issuedAt'] }}</p>
        </article>
      }
      <app-toast />
    </section>
  `,
  styles: [`@media print { .tc-page-shell > :not(.desk-print) { display: none; } }`]
})
export class GatePassPageComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly workspaces = inject(WorkspaceSwitcherService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  lookup = '';
  students: StudentDirectoryRow[] = [];
  selected: StudentDirectoryRow | null = null;
  attendance = '';
  reason = '';
  pickupPerson = '';
  verificationMode = 'CALL';
  otp = '';
  otpVerified = false;
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: Record<string, unknown>[] = [];
  printable: Record<string, unknown> | null = null;
  orgName = '';

  ngOnInit(): void {
    this.workspaces.listOrganizations().subscribe({ next: rows => { this.orgName = rows.find(row => row.current)?.organizationName || ''; } });
    this.load(0);
  }

  get canIssue(): boolean {
    return !!this.selected && this.attendance === 'PRESENT' && !!this.reason.trim() && !!this.pickupPerson.trim()
      && (this.verificationMode === 'CALL' || this.otpVerified);
  }

  search(value: string): void {
    this.api.students(value).subscribe(rows => { this.students = rows; this.cdr.markForCheck(); });
  }

  pick(student: StudentDirectoryRow): void {
    this.selected = student;
    this.lookup = student.studentName;
    this.otpVerified = false;
    this.api.attendanceCheck(student.studentId).subscribe({
      next: result => { this.attendance = result.status || 'NOT_MARKED'; this.cdr.markForCheck(); },
      error: () => { this.attendance = 'NOT_MARKED'; this.cdr.markForCheck(); }
    });
  }

  sendOtp(): void {
    if (!this.selected) return;
    this.api.postAction('gate-passes/otp/send', { studentId: String(this.selected.studentId) }).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'OTP sent' }),
      error: () => this.messages.add({ severity: 'error', summary: 'OTP could not be sent. Use call verification.' })
    });
  }

  verifyOtp(): void {
    if (!this.selected || !this.otp.trim()) return;
    this.api.postAction('gate-passes/otp/verify', { studentId: String(this.selected.studentId), code: this.otp.trim() }).subscribe({
      next: () => { this.otpVerified = true; this.messages.add({ severity: 'success', summary: 'OTP verified' }); this.cdr.markForCheck(); },
      error: () => this.messages.add({ severity: 'error', summary: 'OTP did not match' })
    });
  }

  issue(): void {
    if (!this.selected || !this.canIssue || !confirm('Issue this early-exit pass?')) return;
    this.api.create('gate-passes', {
      studentId: this.selected.studentId,
      studentName: this.selected.studentName,
      className: this.selected.className,
      sectionName: this.selected.sectionName,
      reason: this.reason,
      pickupPerson: this.pickupPerson,
      verificationMode: this.verificationMode,
      attendanceStatus: this.attendance
    }).subscribe({
      next: saved => { this.printable = saved; this.messages.add({ severity: 'success', summary: 'Gate pass issued' }); this.load(0); },
      error: () => this.messages.add({ severity: 'error', summary: 'Gate pass was not issued' })
    });
  }

  load(page: number): void {
    this.page = page;
    this.api.list('gate-passes', page, this.size, '').subscribe({
      next: result => { this.rows = result.content ?? []; this.total = result.totalElements ?? 0; this.cdr.markForCheck(); }
    });
  }

  onPage(event: AppPageChangeEvent): void {
    this.size = event.rows;
    this.load(event.page);
  }

  print(row: Record<string, unknown>): void {
    this.printable = row;
    this.cdr.markForCheck();
    setTimeout(() => window.print(), 50);
  }
}
