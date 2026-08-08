import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';

import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import { AttendanceOrgSettings } from '../../../school-operations/models/school-operations.model';

@Component({
  selector: 'app-attendance-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, SaasPageHeaderComponent, SaasPanelComponent],
  templateUrl: './attendance-settings.component.html',
  styleUrl: './attendance-settings.component.scss'
})
export class AttendanceSettingsComponent implements OnInit {
  private readonly dataService = inject(SchoolOperationsDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  settings: AttendanceOrgSettings = {
    attendanceMode: 'DAILY',
    lateAfterTime: '08:15',
    windowStartTime: '07:00',
    windowEndTime: '09:00',
    allowCopyPrevious: true,
    minStudentAttendancePercent: 75,
    studentAlertThresholdPercent: 80,
    sendSmsOnAbsent: false,
    sendEmailOnAbsent: false,
    freezeAfterDays: 0
  };

  readonly freezeAfterOptions = [
    { label: 'No automatic freeze', value: 0 },
    { label: '3 days', value: 3 },
    { label: '7 days', value: 7 },
    { label: '15 days', value: 15 },
    { label: '30 days', value: 30 }
  ];

  loading = true;
  saving = false;
  saved = false;
  errorMessage = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.dataService.getAttendanceSettings()
      .pipe(
        finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: data => { this.settings = { ...data }; },
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
      lateAfterTime: this.toApiTime(this.settings.lateAfterTime),
      windowStartTime: this.toApiTime(this.settings.windowStartTime),
      windowEndTime: this.toApiTime(this.settings.windowEndTime),
      allowCopyPrevious: this.settings.allowCopyPrevious,
      minStudentAttendancePercent: this.settings.minStudentAttendancePercent,
      studentAlertThresholdPercent: this.settings.studentAlertThresholdPercent,
      sendSmsOnAbsent: this.settings.sendSmsOnAbsent,
      sendEmailOnAbsent: this.settings.sendEmailOnAbsent,
      freezeAfterDays: this.settings.freezeAfterDays
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

  reset(): void {
    if (this.saving) return;
    if (!window.confirm('Reset attendance settings to platform defaults?')) return;
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

  private toApiTime(value: string): string {
    if (!value) return value;
    return value.length === 5 ? `${value}:00` : value;
  }
}
