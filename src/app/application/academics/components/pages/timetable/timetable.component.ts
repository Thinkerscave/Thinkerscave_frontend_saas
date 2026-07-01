import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicsWorkspaceData, TimetableSlotModel, TimetableConflictModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { ACADEMICS_DAY_OPTIONS } from '../../../data/academics-workspace.config';

@Component({
  selector: 'app-academic-timetable-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, TableModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class AcademicTimetablePageComponent implements OnInit {
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() dataChanged = new EventEmitter<void>();

  readonly days = ACADEMICS_DAY_OPTIONS;
  viewMode: 'class' | 'teacher' | 'room' = 'class';
  showDialog = false;
  editingSlot: TimetableSlotModel | null = null;
  saving = false;
  loadingSlots = false;
  localSlots: TimetableSlotModel[] = [];

  filterYearId: number | null = null;
  filterClassId: number | null = null;
  filterSectionId: number | null = null;
  filterShiftId: number | null = null;

  formModel: {
    classId?: number;
    sectionId?: number;
    dayOfWeek?: string;
    periodNumber?: number;
    subjectAssignmentId?: number;
    periodTemplateId?: number;
  } = {};

  readonly subjectColors: Record<string, string> = {};

  ngOnInit() {
    this.buildSubjectColorMap();
    this.localSlots = [...this.data.timetableSlots];
    if (this.data.classes.length) {
      this.filterClassId = Number(this.data.classes[0].classId);
      const section = this.data.sections.find(s => Number(s.classId) === this.filterClassId);
      this.filterSectionId = section ? Number(section.sectionId) : null;
      this.loadSlots();
    }
  }

  get classOptions() { return this.data.classes.map(c => ({ label: c.className, value: c.classId })); }
  get sectionOptions() {
    const classId = this.filterClassId ?? this.formModel.classId;
    return this.data.sections
      .filter(s => !classId || Number(s.classId) === Number(classId))
      .map(s => ({ label: s.sectionName, value: s.sectionId }));
  }
  get shiftOptions() { return this.data.shifts.map(s => ({ label: s.shiftName, value: s.shiftId })); }
  get yearOptions() { return this.data.academicYears.map(y => ({ label: y.yearCode || y.yearName || `Year ${y.academicYearId}`, value: y.academicYearId ?? y.id })); }
  get dayOptions() { return this.days.map(d => ({ label: this.formatDay(d), value: d })); }

  get assignmentOptions() {
    const classId = this.formModel.classId ?? this.filterClassId;
    const sectionId = this.formModel.sectionId ?? this.filterSectionId;
    return this.data.teacherAllocations
      .filter(a => (!classId || Number(a.classId) === Number(classId)) && (!sectionId || Number(a.sectionId) === Number(sectionId)))
      .map(a => ({
        label: `${a.subjectName} — ${a.className}${a.sectionName ? ' ' + a.sectionName : ''}`,
        value: a.allocationId
      }));
  }

  get periodNumbers() {
    const templates = this.filterShiftId
      ? this.data.periodTemplates.filter(t => Number(t.shiftId) === Number(this.filterShiftId))
      : this.data.periodTemplates;
    const nums = new Set(templates.map(t => t.periodNumber).filter(n => n != null));
    return Array.from(nums).sort((a, b) => a - b).map(n => ({ label: `Period ${n}`, value: n }));
  }

  get uniqueSubjects(): { name: string; color: string }[] {
    const subjects = new Set(this.localSlots.map(s => s.subjectName).filter(Boolean));
    return Array.from(subjects).map(name => ({ name: name!, color: this.subjectColors[name!] || this.getSubjectColor(name!) }));
  }

  get filteredSlots() {
    return this.localSlots;
  }

  private buildSubjectColorMap() {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#84CC16'];
    this.data.subjects.forEach((s, i) => {
      if (s.subjectName) this.subjectColors[s.subjectName] = colors[i % colors.length];
    });
  }

  formatDay(day: string): string { return day.charAt(0) + day.slice(1).toLowerCase(); }

  getSlot(day: string, periodNum: number): TimetableSlotModel | undefined {
    return this.filteredSlots.find(s => s.dayOfWeek === day && s.periodNumber === periodNum);
  }

  hasConflict(slot: TimetableSlotModel): boolean {
    return this.data.timetableConflicts.some(c => c.slotIds.includes(Number(slot.slotId)));
  }

  getSubjectColor(subjectName: string): string {
    return this.subjectColors[subjectName] || '#6366F1';
  }

  onFilterChange() {
    this.loadSlots();
  }

  private loadSlots(): void {
    if (!this.filterClassId) return;
    this.loadingSlots = true;
    this.workspaceService.loadTimetable(Number(this.filterClassId), this.filterSectionId ?? undefined)
      .pipe(finalize(() => this.loadingSlots = false), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: slots => this.localSlots = slots,
        error: () => this.messageService.add({ severity: 'error', summary: 'Failed to load timetable' })
      });
  }

  private resolvePeriodTemplateId(periodNumber?: number): number | undefined {
    if (!periodNumber) return undefined;
    const templates = this.filterShiftId
      ? this.data.periodTemplates.filter(t => Number(t.shiftId) === Number(this.filterShiftId))
      : this.data.periodTemplates;
    return templates.find(t => t.periodNumber === periodNumber)?.templateId;
  }

  openAddDialog() {
    this.editingSlot = null;
    this.formModel = {
      classId: this.filterClassId ?? undefined,
      sectionId: this.filterSectionId ?? undefined
    };
    this.showDialog = true;
  }

  openEditDialog(slot: TimetableSlotModel | undefined) {
    if (!slot) return;
    this.editingSlot = slot;
    this.formModel = {
      classId: slot.classId,
      sectionId: slot.sectionId,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber
    };
    this.showDialog = true;
  }

  saveSlot() {
    const classId = Number(this.formModel.classId ?? this.filterClassId);
    const sectionId = this.formModel.sectionId ?? this.filterSectionId;
    const periodTemplateId = this.resolvePeriodTemplateId(this.formModel.periodNumber);
    if (!classId || !this.formModel.dayOfWeek || !periodTemplateId || !this.formModel.subjectAssignmentId) {
      this.messageService.add({ severity: 'warn', summary: 'Complete all required fields' });
      return;
    }
    this.saving = true;
    const payload = {
      classId,
      sectionId: sectionId ? Number(sectionId) : undefined,
      dayOfWeek: this.formModel.dayOfWeek,
      periodTemplateId,
      subjectAssignmentId: Number(this.formModel.subjectAssignmentId)
    };
    const obs = this.editingSlot
      ? this.workspaceService.updateTimetableSlot(Number(this.editingSlot.slotId), payload)
      : this.workspaceService.createTimetableSlot(payload);
    obs.pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: this.editingSlot ? 'Updated' : 'Added' });
          this.loadSlots();
          this.dataChanged.emit();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Failed' })
      });
  }

  deleteSlot() {
    const slotId = this.editingSlot?.slotId;
    if (!slotId) return;
    this.confirmationService.confirm({
      message: 'Delete this period?', header: 'Confirm', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.deleteTimetableSlot(Number(slotId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deleted' }); this.showDialog = false; this.loadSlots(); this.dataChanged.emit(); } });
      }
    });
  }

  autoGenerate() {
    this.messageService.add({ severity: 'info', summary: 'Auto generate', detail: 'Automatic timetable generation will be available in a future release.' });
  }

  publish() {
    this.messageService.add({ severity: 'info', summary: 'Publish', detail: 'Timetable slots are active once saved. Publishing workflow coming soon.' });
  }

  resolveConflict(conflict: TimetableConflictModel) {
    this.messageService.add({ severity: 'info', summary: 'Auto Fix', detail: conflict.suggestion || 'Resolving...' });
  }
}