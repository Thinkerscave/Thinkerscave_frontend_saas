import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiConfirmService } from '../../../../core/feedback/ui-confirm.service';
import { WorkspaceSwitcherService } from '../../../../core/services/workspace-switcher.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import {
  AppEmptyStateComponent,
  AppFormSectionComponent,
  AppInputComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption
} from '../../../../shared/ui/app-form';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { FrontDeskApiService, StudentDirectoryRow } from '../../front-desk-api.service';

@Component({
  selector: 'app-gate-pass-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppPaginatorComponent,
    AppEmptyStateComponent,
    AppFormSectionComponent,
    AppSectionHeaderComponent,
    AppInputComponent,
    AppSelectComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './gate-pass-page.component.html',
  styleUrls: ['../../front-desk.shared.scss', './gate-pass-page.component.scss']
})
export class GatePassPageComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly workspaces = inject(WorkspaceSwitcherService);
  private readonly messages = inject(MessageService);
  private readonly dialogs = inject(UiConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly verificationOptions: AppSelectOption[] = [
    { value: 'CALL', label: 'Phone call to parent' },
    { value: 'OTP', label: 'OTP to registered mobile' }
  ];

  lookup = '';
  students: StudentDirectoryRow[] = [];
  selected: StudentDirectoryRow | null = null;
  searching = false;
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
    this.workspaces.listOrganizations().subscribe({
      next: rows => {
        this.orgName = rows.find(row => row.current)?.organizationName || '';
        this.cdr.markForCheck();
      }
    });
    this.load(0);
  }

  get canIssue(): boolean {
    return !!this.selected && this.attendance === 'PRESENT' && !!this.reason.trim() && !!this.pickupPerson.trim()
      && (this.verificationMode === 'CALL' || this.otpVerified);
  }

  attendanceLabel(code: string): string {
    if (code === 'PRESENT') return 'Present';
    if (code === 'ABSENT') return 'Absent';
    if (code === 'NOT_MARKED') return 'Not marked';
    return code;
  }

  onVerificationModeChange(): void {
    this.otpVerified = false;
    this.otp = '';
    this.cdr.markForCheck();
  }

  search(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    const term = (value ?? '').trim();
    if (term.length < 2) {
      this.students = [];
      this.searching = false;
      this.cdr.markForCheck();
      return;
    }
    this.searching = true;
    this.searchTimer = setTimeout(() => {
      this.api.students(term).subscribe({
        next: rows => {
          this.students = rows;
          this.searching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.students = [];
          this.searching = false;
          this.cdr.markForCheck();
        }
      });
    }, 280);
  }

  pick(student: StudentDirectoryRow): void {
    this.selected = student;
    this.lookup = student.studentName;
    this.students = [];
    this.otpVerified = false;
    this.api.attendanceCheck(student.studentId).subscribe({
      next: result => {
        this.attendance = result.status || 'NOT_MARKED';
        this.cdr.markForCheck();
      },
      error: () => {
        this.attendance = 'NOT_MARKED';
        this.cdr.markForCheck();
      }
    });
  }

  clearStudent(): void {
    this.selected = null;
    this.lookup = '';
    this.attendance = '';
    this.otpVerified = false;
    this.cdr.markForCheck();
  }

  sendOtp(): void {
    if (!this.selected) {
      return;
    }
    this.api.postAction('gate-passes/otp/send', { studentId: String(this.selected.studentId) }).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'OTP sent' }),
      error: () => this.messages.add({ severity: 'error', summary: 'OTP could not be sent. Use call verification.' })
    });
  }

  verifyOtp(): void {
    if (!this.selected || !this.otp.trim()) {
      return;
    }
    this.api.postAction('gate-passes/otp/verify', { studentId: String(this.selected.studentId), code: this.otp.trim() }).subscribe({
      next: () => {
        this.otpVerified = true;
        this.messages.add({ severity: 'success', summary: 'OTP verified' });
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'OTP did not match' })
    });
  }

  async issue(): Promise<void> {
    if (!this.selected || !this.canIssue) {
      return;
    }
    const ok = await this.dialogs.confirm({
      header: 'Issue gate pass?',
      message: `${this.selected.studentName} will be released early to ${this.pickupPerson.trim()}.`,
      acceptLabel: 'Issue pass'
    });
    if (!ok || !this.selected) {
      return;
    }
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
      next: saved => {
        this.printable = saved;
        this.messages.add({ severity: 'success', summary: 'Gate pass issued' });
        this.reason = '';
        this.pickupPerson = '';
        this.clearStudent();
        this.load(0);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Gate pass was not issued' })
    });
  }

  load(page: number): void {
    this.page = page;
    this.api.list('gate-passes', page, this.size, '').subscribe({
      next: result => {
        this.rows = result.content ?? [];
        this.total = result.totalElements ?? 0;
        this.cdr.markForCheck();
      }
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
