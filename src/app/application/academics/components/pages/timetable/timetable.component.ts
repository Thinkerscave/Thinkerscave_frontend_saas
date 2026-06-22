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
  editingSlot: any = null;
  saving = false;

  filterYearId: any = null;
  filterClassId: any = null;
  filterSectionId: any = null;
  filterShiftId: any = null;

  formModel: any = {};

  readonly subjectColors: Record<string, string> = {};

  ngOnInit() {
    this.buildSubjectColorMap();
  }

  get classOptions() { return this.data.classes.map(c => ({ label: c.className, value: c.classId })); }
  get sectionOptions() { return this.data.sections.map(s => ({ label: s.sectionName, value: s.sectionId })); }
  get shiftOptions() { return this.data.shifts.map(s => ({ label: s.shiftName, value: s.shiftId })); }
  get subjectOptions() { return this.data.subjects.map(s => ({ label: `${s.subjectName} (${s.subjectCode})`, value: s.subjectId })); }
  get teacherOptions() { return this.data.staff.map(t => ({ label: `${t.firstName || ''} ${t.lastName || ''}`.trim(), value: t.staffId ?? t.id })); }
  get yearOptions() { return this.data.academicYears.map(y => ({ label: y.yearCode || y.yearName || `Year ${y.academicYearId}`, value: y.academicYearId ?? y.id })); }
  get dayOptions() { return this.days.map(d => ({ label: this.formatDay(d), value: d })); }

  get periodNumbers() {
    const nums = new Set(this.data.periodTemplates.map(t => t.periodNumber).filter(n => n != null));
    return Array.from(nums).sort((a, b) => a - b).map(n => ({ label: `Period ${n}`, value: n }));
  }

  get uniqueSubjects(): { name: string; color: string }[] {
    const subjects = new Set(this.data.timetableSlots.map(s => s.subjectName).filter(Boolean));
    return Array.from(subjects).map(name => ({ name: name!, color: this.subjectColors[name!] || this.getSubjectColor(name!) }));
  }

  get filteredSlots() {
    let slots = this.data.timetableSlots;
    if (this.filterClassId) slots = slots.filter(s => Number(s.classId) === Number(this.filterClassId));
    if (this.filterSectionId) slots = slots.filter(s => Number(s.sectionId) === Number(this.filterSectionId));
    return slots;
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

  onFilterChange() { this.dataChanged.emit(); }

  openAddDialog() {
    this.editingSlot = null;
    this.formModel = {};
    this.showDialog = true;
  }

  openEditDialog(slot: any) {
    if (!slot) return;
    this.editingSlot = slot;
    this.formModel = { ...slot };
    this.showDialog = true;
  }

  saveSlot() {
    if (!this.formModel.dayOfWeek || !this.formModel.periodNumber || !this.formModel.subjectId || !this.formModel.teacherId) return;
    this.saving = true;
    const obs = this.editingSlot
      ? this.workspaceService.updateTimetableSlot(Number(this.editingSlot.slotId), this.formModel)
      : this.workspaceService.createTimetableSlot(this.formModel);
    obs.pipe(finalize(() => { this.saving = false; this.showDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: this.editingSlot ? 'Updated' : 'Added' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  deleteSlot() {
    if (!this.editingSlot) return;
    this.confirmationService.confirm({
      message: 'Delete this period?', header: 'Confirm', icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.deleteTimetableSlot(Number(this.editingSlot.slotId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deleted' }); this.showDialog = false; this.dataChanged.emit(); } });
      }
    });
  }

  autoGenerate() {
    if (!this.filterClassId || !this.filterSectionId) {
      this.messageService.add({ severity: 'warn', summary: 'Select Class & Section' }); return;
    }
    const yearId = this.data.currentYear?.academicYearId ?? this.data.currentYear?.id;
    if (!yearId) { this.messageService.add({ severity: 'error', summary: 'No active year' }); return; }
    this.saving = true;
    this.workspaceService.autoGenerateTimetable(Number(yearId), Number(this.filterClassId), Number(this.filterSectionId))
      .pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Timetable generated' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Generation failed' }) });
  }

  publish() {
    if (!this.filterClassId || !this.filterSectionId) return;
    const yearId = this.data.currentYear?.academicYearId ?? this.data.currentYear?.id;
    if (!yearId) return;
    this.workspaceService.publishTimetable(Number(yearId), Number(this.filterClassId), Number(this.filterSectionId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.messageService.add({ severity: 'success', summary: 'Published' }), error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  resolveConflict(conflict: TimetableConflictModel) {
    this.messageService.add({ severity: 'info', summary: 'Auto Fix', detail: conflict.suggestion || 'Resolving...' });
  }
}