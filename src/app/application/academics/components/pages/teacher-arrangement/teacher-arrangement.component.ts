import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PermissionService } from '../../../../../core/services/permission.service';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { ACADEMICS_TIMETABLE_RESOURCE } from '../../../models/timetable.model';
import { TeacherArrangementApiService } from '../../../services/teacher-arrangement-api.service';
import {
  EligibleArrangementSlot,
  TeacherArrangement,
  TeacherArrangementRequest,
  TeacherOption
} from '../../../models/teacher-arrangement.model';

@Component({
  selector: 'app-teacher-arrangement-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, TcAcademicYearSelectorComponent],
  templateUrl: './teacher-arrangement.component.html',
  styleUrls: ['./teacher-arrangement.component.scss']
})
export class TeacherArrangementPageComponent {
  private readonly api = inject(TeacherArrangementApiService);
  private readonly permissions = inject(PermissionService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly resource = ACADEMICS_TIMETABLE_RESOURCE;
  selectedYearId: number | null = null;
  selectedDate = '';
  selectedTeacherId: number | null = null;
  reason = '';
  reviewNotes: Record<number, string> = {};
  teachers: TeacherOption[] = [];
  slots: EligibleArrangementSlot[] = [];
  arrangements: TeacherArrangement[] = [];
  approvedForDate: TeacherArrangement[] = [];
  loading = false;
  loadingSlots = false;
  saving = false;
  reviewingId: number | null = null;

  get canManage(): boolean {
    return this.permissions.canManage(this.resource);
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(this.resource);
  }

  get canSubmit(): boolean {
    return this.canManage && !this.saving && !!this.reason.trim() && this.slots.length > 0
      && this.slots.every(slot => slot.substituteStaffId != null);
  }

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    this.selectedTeacherId = null;
    this.slots = [];
    this.arrangements = [];
    this.approvedForDate = [];
    this.teachers = [];
    if (yearId == null) return;

    this.loading = true;
    this.api.teachers(yearId).pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: teachers => {
        this.teachers = teachers;
        this.cdr.markForCheck();
      },
      error: error => this.showError(error)
    });
    this.reloadArrangements();
  }

  onDateChange(): void {
    this.slots = [];
    this.approvedForDate = [];
    this.loadApprovedForDate();
  }

  checkSchedule(): void {
    if (!this.selectedYearId || !this.selectedDate || !this.selectedTeacherId) return;
    this.loadingSlots = true;
    this.slots = [];
    this.api.eligibleSlots(this.selectedYearId, this.selectedDate, this.selectedTeacherId)
      .pipe(finalize(() => {
        this.loadingSlots = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: slots => {
          this.slots = slots.map(slot => ({ ...slot, substituteStaffId: null }));
          if (!slots.length) this.messages.add({ severity: 'warn', summary: 'No periods', detail: 'This teacher has no scheduled teaching periods on the selected date.' });
          this.cdr.markForCheck();
        },
        error: error => this.showError(error)
      });
  }

  submit(): void {
    if (!this.canSubmit || !this.selectedYearId || !this.selectedDate || !this.selectedTeacherId) return;
    const request: TeacherArrangementRequest = {
      academicYearId: this.selectedYearId,
      absenceDate: this.selectedDate,
      absentTeacherId: this.selectedTeacherId,
      reason: this.reason.trim(),
      slots: this.slots.map(slot => ({
        timetableEntryId: slot.timetableEntryId,
        substituteStaffId: slot.substituteStaffId!
      }))
    };
    if (!request.reason) {
      this.messages.add({ severity: 'warn', summary: 'Reason required', detail: 'Enter a reason for the absence.' });
      return;
    }
    this.saving = true;
    this.api.create(request)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Submitted', detail: 'The arrangement is pending approval.' });
          this.reason = '';
          this.slots = [];
          this.reloadArrangements();
          this.loadApprovedForDate();
          this.cdr.markForCheck();
        },
        error: error => this.showError(error)
      });
  }

  approve(arrangement: TeacherArrangement): void {
    this.reviewingId = arrangement.arrangementId;
    this.api.approve(arrangement.arrangementId)
      .pipe(finalize(() => {
        this.reviewingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Approved', detail: 'The substitute arrangement is approved.' });
          this.reloadArrangements();
          this.loadApprovedForDate();
        },
        error: error => this.showError(error)
      });
  }

  reject(arrangement: TeacherArrangement, note: string): void {
    this.reviewingId = arrangement.arrangementId;
    this.api.reject(arrangement.arrangementId, note.trim())
      .pipe(finalize(() => {
        this.reviewingId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'info', summary: 'Rejected', detail: 'The arrangement was rejected.' });
          delete this.reviewNotes[arrangement.arrangementId];
          this.reloadArrangements();
          this.loadApprovedForDate();
        },
        error: error => this.showError(error)
      });
  }

  statusLabel(status: TeacherArrangement['status']): string {
    return status === 'PENDING' ? 'Pending approval' : status === 'APPROVED' ? 'Approved' : 'Rejected';
  }

  trackByArrangement(_index: number, arrangement: TeacherArrangement): number {
    return arrangement.arrangementId;
  }

  trackBySlot(_index: number, slot: EligibleArrangementSlot): number {
    return slot.timetableEntryId;
  }

  private reloadArrangements(): void {
    if (!this.selectedYearId) return;
    this.api.list(this.selectedYearId).subscribe({
      next: arrangements => {
        this.arrangements = arrangements;
        this.cdr.markForCheck();
      },
      error: error => this.showError(error)
    });
  }

  private loadApprovedForDate(): void {
    if (!this.selectedYearId || !this.selectedDate) return;
    this.api.listByDate(this.selectedYearId, this.selectedDate).subscribe({
      next: arrangements => {
        this.approvedForDate = arrangements;
        this.cdr.markForCheck();
      },
      error: error => this.showError(error)
    });
  }

  private showError(error: any): void {
    const detail = error?.error?.message ?? error?.error?.detail ?? 'The request could not be completed.';
    this.messages.add({ severity: 'error', summary: 'Unable to load arrangements', detail });
  }
}