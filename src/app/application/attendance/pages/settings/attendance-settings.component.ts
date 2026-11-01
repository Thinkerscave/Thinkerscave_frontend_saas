import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';

import { PermissionService } from '../../../../core/services/permission.service';
import { UiConfirmService } from '../../../../core/feedback/ui-confirm.service';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import { AttendanceOrgSettings } from '../../../school-operations/models/school-operations.model';

import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';

const ATTENDANCE_RESOURCE = 'ATTENDANCE';

@Component({
  selector: 'app-attendance-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, SaasPageHeaderComponent, TcPageSkeletonComponent],
  templateUrl: './attendance-settings.component.html',
  styleUrl: './attendance-settings.component.scss'
})
export class AttendanceSettingsComponent implements OnInit {
  private readonly dataService = inject(SchoolOperationsDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogs = inject(UiConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly permissions = inject(PermissionService);

  settings: AttendanceOrgSettings = {
    attendanceMode: 'DAILY',
    attendanceEditingPolicy: 'SAME_DAY',
    windowStartTime: '09:00',
    windowEndTime: '17:00',
    allowCopyPrevious: true,
    minStudentAttendancePercent: 75,
    minStaffWorkingHours: 8,
    staffLateGraceMinutes: 15,
    freezeAfterDays: 0
  };

  readonly editingPolicyOptions = [
    { label: 'Same day', value: 'SAME_DAY' },
    { label: 'Same week', value: 'SAME_WEEK' },
    { label: 'Same month', value: 'SAME_MONTH' }
  ];

  loading = true;
  loaded = false;
  saving = false;
  saved = false;
  errorMessage = '';

  get canManageSettings(): boolean {
    return this.permissions.canManage(ATTENDANCE_RESOURCE);
  }

  ngOnInit(): void {
    this.load();
  }

  isValid(): boolean {
    const minAttendance = this.settings.minStudentAttendancePercent;
    const graceMinutes = this.settings.staffLateGraceMinutes;
    const minimumHours = this.settings.minStaffWorkingHours;
    return Number.isFinite(minAttendance) && minAttendance >= 0 && minAttendance <= 100
      && Number.isFinite(graceMinutes) && graceMinutes >= 0 && graceMinutes <= 120
      && Number.isFinite(minimumHours) && minimumHours >= 1 && minimumHours <= 24;
  }

  load(): void {
    this.loading = true;
    this.loaded = false;
    this.errorMessage = '';
    this.dataService.getAttendanceSettings()
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: data => {
          this.settings = { ...data };
          this.loaded = true;
        },
        error: () => { this.errorMessage = 'Unable to load attendance settings.'; }
      });
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    this.saved = false;
    this.errorMessage = '';
    const payload: Partial<AttendanceOrgSettings> = {
      attendanceMode: this.settings.attendanceMode,
      attendanceEditingPolicy: this.settings.attendanceEditingPolicy,
      minStudentAttendancePercent: this.settings.minStudentAttendancePercent,
      minStaffWorkingHours: this.settings.minStaffWorkingHours,
      staffLateGraceMinutes: this.settings.staffLateGraceMinutes
    };
    this.dataService.saveAttendanceSettings(payload)
      .pipe(
        finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: data => {
          this.settings = { ...data };
          this.saved = true;
          setTimeout(() => { this.saved = false; this.cdr.markForCheck(); }, 2400);
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Unable to save attendance settings.';
        }
      });
  }

  async reset(): Promise<void> {
    if (this.saving) return;
    const ok = await this.dialogs.confirm({
      header: 'Reset attendance settings?',
      message: 'All attendance settings for this school go back to platform defaults. Your current values will be replaced.',
      acceptLabel: 'Reset',
      tone: 'warn'
    });
    if (!ok || this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    this.dataService.resetAttendanceSettings()
      .pipe(
        finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: data => {
          this.settings = { ...data };
          this.saved = true;
          setTimeout(() => { this.saved = false; this.cdr.markForCheck(); }, 2400);
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Unable to reset attendance settings.';
        }
      });
  }
}
