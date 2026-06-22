import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AcademicsActionMode, AcademicsWorkspaceData, TimetableSlotModel, TimetableConflictModel } from '../../../models/academics-workspace.model';
import { AcademicsWorkspaceService } from '../../../services/academics-workspace.service';
import { ACADEMICS_DAY_OPTIONS, ACADEMICS_PERIODS } from '../../../data/academics-workspace.config';
import { finalize } from 'rxjs';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-academic-timetable-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, TableModule, ToastModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timetable-page">
      <!-- Header -->
      <div class="timetable-header">
        <div>
          <div class="timetable-eyebrow">Timetable Management</div>
          <h1 class="timetable-title">Weekly Schedule</h1>
        </div>
        <div class="timetable-actions">
          <p-dropdown [options]="classOptions" [(ngModel)]="filterClassId" optionLabel="label" optionValue="value" placeholder="Select Class" (onChange)="onFilterChange()" styleClass="timetable-filter"></p-dropdown>
          <p-dropdown [options]="sectionOptions" [(ngModel)]="filterSectionId" optionLabel="label" optionValue="value" placeholder="Select Section" (onChange)="onFilterChange()" styleClass="timetable-filter"></p-dropdown>
          <p-dropdown [options]="shiftOptions" [(ngModel)]="filterShiftId" optionLabel="label" optionValue="value" placeholder="Select Shift" (onChange)="onFilterChange()" styleClass="timetable-filter"></p-dropdown>
          <button class="timetable-btn timetable-btn-primary" (click)="autoGenerate()">
            <i class="pi pi-sparkles"></i> Auto Generate
          </button>
          <button class="timetable-btn timetable-btn-outline" (click)="publishTimetable()">
            <i class="pi pi-send"></i> Publish
          </button>
          <button class="timetable-btn timetable-btn-ghost" (click)="openAddPeriodDialog()">
            <i class="pi pi-plus"></i> Add Period
          </button>
        </div>
      </div>

      <!-- Main Content: Grid + Conflicts -->
      <div class="timetable-content">
        <!-- Weekly Grid -->
        <div class="timetable-grid-panel">
          <div class="timetable-grid">
            <div class="timetable-grid-header"></div>
            <div class="timetable-grid-header" *ngFor="let day of days">{{ formatDay(day) }}</div>

            <ng-container *ngFor="let period of periods">
              <div class="timetable-period-label">
                <strong>P{{ period.periodNumber }}</strong>
                <small>{{ period.startTime }}-{{ period.endTime }}</small>
              </div>
              <div class="timetable-period-cell" *ngFor="let day of days" (click)="openEditSlotDialog(getSlot(day, period.periodNumber))">
                <div class="timetable-slot" *ngIf="getSlot(day, period.periodNumber) as slot" [class.has-conflict]="hasConflict(slot)">
                  <strong>{{ slot.subjectName }}</strong>
                  <span>{{ slot.teacherName }}</span>
                  <small>{{ slot.roomName || 'No room' }}</small>
                </div>
                <div class="timetable-slot timetable-slot-empty" *ngIf="!getSlot(day, period.periodNumber)">
                  <i class="pi pi-plus"></i>
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Conflicts Panel -->
        <div class="timetable-conflicts-panel">
          <div class="timetable-conflicts-header">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Conflicts & Warnings</span>
          </div>
          <div class="timetable-conflicts-list">
            <div class="timetable-conflict-card" *ngFor="let conflict of data.timetableConflicts" [class.high]="conflict.severity === 'HIGH'" [class.medium]="conflict.severity === 'MEDIUM'">
              <div class="timetable-conflict-type">
                <span class="timetable-conflict-badge">{{ conflict.type }}</span>
                <span class="timetable-conflict-severity">{{ conflict.severity }}</span>
              </div>
              <p>{{ conflict.description }}</p>
              <div class="timetable-conflict-actions" *ngIf="conflict.suggestion">
                <button class="timetable-btn timetable-btn-sm" (click)="resolveConflict(conflict)">Resolve</button>
                <button class="timetable-btn timetable-btn-ghost timetable-btn-sm">Ignore</button>
              </div>
            </div>
            <div class="timetable-conflicts-empty" *ngIf="!data.timetableConflicts.length">
              <i class="pi pi-check-circle"></i>
              <p>No conflicts detected. Your timetable is well-structured.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Period Dialog -->
    <p-dialog header="{{ editingSlot ? 'Edit Period' : 'Add Period' }}" [(visible)]="showPeriodDialog" [modal]="true" [style]="{width: '800px'}" [draggable]="false" [resizable]="false">
      <div class="timetable-dialog-form">
        <div class="timetable-form-row">
          <label>Class <span class="required">*</span></label>
          <p-dropdown [options]="classOptions" [(ngModel)]="periodForm.classId" optionLabel="label" optionValue="value" placeholder="Select Class" styleClass="timetable-form-dropdown"></p-dropdown>
        </div>
        <div class="timetable-form-row">
          <label>Section</label>
          <p-dropdown [options]="sectionOptions" [(ngModel)]="periodForm.sectionId" optionLabel="label" optionValue="value" placeholder="Select Section" styleClass="timetable-form-dropdown"></p-dropdown>
        </div>
        <div class="timetable-form-row">
          <label>Day <span class="required">*</span></label>
          <p-dropdown [options]="dayOptions" [(ngModel)]="periodForm.dayOfWeek" optionLabel="label" optionValue="value" placeholder="Select Day" styleClass="timetable-form-dropdown"></p-dropdown>
        </div>
        <div class="timetable-form-row">
          <label>Period Number <span class="required">*</span></label>
          <p-dropdown [options]="periodNumberOptions" [(ngModel)]="periodForm.periodNumber" optionLabel="label" optionValue="value" placeholder="Select Period" styleClass="timetable-form-dropdown"></p-dropdown>
        </div>
        <div class="timetable-form-row">
          <label>Subject <span class="required">*</span></label>
          <p-dropdown [options]="subjectOptions" [(ngModel)]="periodForm.subjectId" optionLabel="label" optionValue="value" placeholder="Select Subject" styleClass="timetable-form-dropdown"></p-dropdown>
        </div>
        <div class="timetable-form-row">
          <label>Teacher <span class="required">*</span></label>
          <p-dropdown [options]="teacherOptions" [(ngModel)]="periodForm.teacherId" optionLabel="label" optionValue="value" placeholder="Select Teacher" styleClass="timetable-form-dropdown"></p-dropdown>
        </div>
        <div class="timetable-form-row">
          <label>Room</label>
          <input pInputText [(ngModel)]="periodForm.roomName" placeholder="e.g., Room 201" class="timetable-form-input">
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button class="timetable-btn timetable-btn-ghost" (click)="showPeriodDialog = false">Cancel</button>
        <button class="timetable-btn timetable-btn-danger" *ngIf="editingSlot" (click)="deleteSlot()">Delete</button>
        <button class="timetable-btn timetable-btn-primary" (click)="savePeriod()" [disabled]="saving">
          <i class="pi pi-check"></i> {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>

    <p-confirmDialog [style]="{width: '500px'}"></p-confirmDialog>
    <p-toast position="top-right"></p-toast>
  `,
  styles: [`
    :host { display: block; }
    .timetable-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.25rem; }
    .timetable-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
    .timetable-eyebrow { font-size: 0.8rem; color: var(--tc-text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .timetable-title { font-size: 1.5rem; font-weight: 700; color: var(--tc-heading); margin: 0.25rem 0 0; }
    .timetable-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .timetable-filter { min-width: 140px; }
    .timetable-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
    .timetable-btn-primary { background: var(--tc-primary-600); color: #fff; border-color: var(--tc-primary-600); }
    .timetable-btn-primary:hover { opacity: 0.9; }
    .timetable-btn-outline { background: transparent; color: var(--tc-text); border-color: var(--tc-border); }
    .timetable-btn-outline:hover { background: var(--tc-bg-muted); }
    .timetable-btn-ghost { background: transparent; color: var(--tc-text-muted); border-color: transparent; }
    .timetable-btn-ghost:hover { background: var(--tc-bg-muted); }
    .timetable-btn-danger { background: #EF4444; color: #fff; }
    .timetable-btn-sm { padding: 0.3rem 0.6rem; font-size: 0.8rem; }
    .timetable-content { display: grid; grid-template-columns: 1fr 320px; gap: 1rem; }
    .timetable-grid-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: auto; }
    .timetable-grid { display: grid; grid-template-columns: 100px repeat(6, minmax(140px, 1fr)); min-width: 940px; }
    .timetable-grid-header { padding: 0.75rem; font-weight: 600; color: var(--tc-text); background: var(--tc-bg-muted); border-bottom: 1px solid var(--tc-border); border-right: 1px solid var(--tc-border); text-align: center; }
    .timetable-period-label { padding: 0.75rem; border-bottom: 1px solid var(--tc-border); border-right: 1px solid var(--tc-border); background: var(--tc-bg-muted); }
    .timetable-period-label strong { display: block; font-size: 0.9rem; }
    .timetable-period-label small { color: var(--tc-text-muted); font-size: 0.75rem; }
    .timetable-period-cell { padding: 0.35rem; border-bottom: 1px solid var(--tc-border); border-right: 1px solid var(--tc-border); min-height: 80px; cursor: pointer; transition: background 0.2s; }
    .timetable-period-cell:hover { background: var(--tc-bg-muted); }
    .timetable-slot { padding: 0.5rem; border-radius: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); }
    .timetable-slot.has-conflict { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); }
    .timetable-slot strong { display: block; font-size: 0.85rem; color: var(--tc-heading); }
    .timetable-slot span { display: block; font-size: 0.75rem; color: var(--tc-text); }
    .timetable-slot small { display: block; font-size: 0.7rem; color: var(--tc-text-muted); }
    .timetable-slot-empty { display: flex; align-items: center; justify-content: center; min-height: 60px; border: 1px dashed var(--tc-border); background: transparent; }
    .timetable-slot-empty i { color: var(--tc-text-muted); opacity: 0.5; }
    .timetable-conflicts-panel { background: var(--tc-surface-card); border: 1px solid var(--tc-border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .timetable-conflicts-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-bottom: 1px solid var(--tc-border); font-weight: 600; color: var(--tc-heading); }
    .timetable-conflicts-header i { color: #F59E0B; }
    .timetable-conflicts-list { flex: 1; overflow: auto; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .timetable-conflict-card { padding: 0.75rem; border-radius: 8px; border: 1px solid var(--tc-border); background: var(--tc-bg); }
    .timetable-conflict-card.high { border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05); }
    .timetable-conflict-card.medium { border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05); }
    .timetable-conflict-type { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; }
    .timetable-conflict-badge { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 4px; background: var(--tc-bg-muted); color: var(--tc-text-muted); }
    .timetable-conflict-severity { font-size: 0.7rem; color: var(--tc-text-muted); }
    .timetable-conflict-card p { margin: 0; font-size: 0.8rem; color: var(--tc-text); }
    .timetable-conflict-actions { display: flex; gap: 0.35rem; margin-top: 0.5rem; }
    .timetable-conflicts-empty { text-align: center; padding: 2rem 1rem; color: var(--tc-text-muted); }
    .timetable-conflicts-empty i { font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5; }
    .timetable-conflicts-empty p { margin: 0; font-size: 0.85rem; }
    .timetable-dialog-form { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0; }
    .timetable-form-row { display: flex; flex-direction: column; gap: 0.35rem; }
    .timetable-form-row label { font-size: 0.85rem; font-weight: 500; color: var(--tc-text); }
    .required { color: #EF4444; }
    .timetable-form-input { padding: 0.6rem 0.75rem; border: 1px solid var(--tc-border); border-radius: 8px; background: var(--tc-bg); color: var(--tc-text); }
    .timetable-form-input:focus { outline: none; border-color: var(--tc-primary-600); }
    .timetable-form-dropdown { width: 100%; }
    @media (max-width: 1024px) { .timetable-content { grid-template-columns: 1fr; } }
  `]
})
export class AcademicTimetablePageComponent implements OnInit {
  private readonly workspaceService = inject(AcademicsWorkspaceService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();
  @Output() dataChanged = new EventEmitter<void>();

  readonly days = ACADEMICS_DAY_OPTIONS;
  readonly periods = ACADEMICS_PERIODS;

  filterClassId: any = null;
  filterSectionId: any = null;
  filterShiftId: any = null;
  showPeriodDialog = false;
  editingSlot: any = null;
  saving = false;

  periodForm: any = { classId: null, sectionId: null, dayOfWeek: null, periodNumber: null, subjectId: null, teacherId: null, roomName: '' };

  get classOptions() { return this.data.classes.map(c => ({ label: c.className, value: c.classId })); }
  get sectionOptions() { return this.data.sections.map(s => ({ label: `${s.sectionName}`, value: s.sectionId })); }
  get shiftOptions() { return this.data.shifts.map(s => ({ label: s.shiftName, value: s.shiftId })); }
  get subjectOptions() { return this.data.subjects.map(s => ({ label: `${s.subjectName} (${s.subjectCode})`, value: s.subjectId })); }
  get teacherOptions() { return this.data.staff.map(t => ({ label: `${t.firstName || ''} ${t.lastName || ''}`.trim(), value: t.staffId ?? t.id })); }
  get dayOptions() { return this.days.map(d => ({ label: this.formatDay(d), value: d })); }
  get periodNumberOptions() { return this.periods.map(p => ({ label: `Period ${p.periodNumber}`, value: p.periodNumber })); }

  ngOnInit() {}

  formatDay(day: string): string { return day.charAt(0) + day.slice(1).toLowerCase(); }

  getSlot(day: string, periodNumber: number): TimetableSlotModel | undefined {
    return this.data.timetableSlots.find(s => s.dayOfWeek === day && s.periodNumber === periodNumber);
  }

  hasConflict(slot: TimetableSlotModel): boolean {
    return this.data.timetableConflicts.some(c => c.slotIds.includes(Number(slot.slotId)));
  }

  onFilterChange() { this.dataChanged.emit(); }

  openAddPeriodDialog() {
    this.editingSlot = null;
    this.periodForm = { classId: null, sectionId: null, dayOfWeek: null, periodNumber: null, subjectId: null, teacherId: null, roomName: '' };
    this.showPeriodDialog = true;
  }

  openEditSlotDialog(slot: any) {
    if (!slot) return;
    this.editingSlot = slot;
    this.periodForm = {
      classId: slot.classId,
      sectionId: slot.sectionId,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      roomName: slot.roomName || ''
    };
    this.showPeriodDialog = true;
  }

  savePeriod() {
    if (!this.periodForm.dayOfWeek || !this.periodForm.periodNumber || !this.periodForm.subjectId || !this.periodForm.teacherId) return;
    this.saving = true;
    const obs = this.editingSlot
      ? this.workspaceService.updateTimetableSlot(Number(this.editingSlot.slotId), this.periodForm)
      : this.workspaceService.createTimetableSlot(this.periodForm);

    obs.pipe(finalize(() => { this.saving = false; this.showPeriodDialog = false; }), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: this.editingSlot ? 'Period updated' : 'Period added' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Failed' }) });
  }

  deleteSlot() {
    if (!this.editingSlot) return;
    this.confirmationService.confirm({
      message: 'Delete this timetable period?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.workspaceService.deleteTimetableSlot(Number(this.editingSlot.slotId))
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Deleted' }); this.showPeriodDialog = false; this.dataChanged.emit(); } });
      }
    });
  }

  autoGenerate() {
    if (!this.filterClassId || !this.filterSectionId) {
      this.messageService.add({ severity: 'warn', summary: 'Select Class & Section', detail: 'Please select a class and section to auto-generate.' });
      return;
    }
    this.saving = true;
    const yearId = this.data.currentYear?.academicYearId ?? this.data.currentYear?.id;
    if (!yearId) { this.messageService.add({ severity: 'error', summary: 'No active year' }); this.saving = false; return; }
    this.workspaceService.autoGenerateTimetable(Number(yearId), Number(this.filterClassId), Number(this.filterSectionId))
      .pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.messageService.add({ severity: 'success', summary: 'Timetable generated' }); this.dataChanged.emit(); }, error: () => this.messageService.add({ severity: 'error', summary: 'Generation failed' }) });
  }

  publishTimetable() {
    if (!this.filterClassId || !this.filterSectionId) {
      this.messageService.add({ severity: 'warn', summary: 'Select Class & Section' });
      return;
    }
    const yearId = this.data.currentYear?.academicYearId ?? this.data.currentYear?.id;
    if (!yearId) return;
    this.workspaceService.publishTimetable(Number(yearId), Number(this.filterClassId), Number(this.filterSectionId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.messageService.add({ severity: 'success', summary: 'Timetable published' }), error: () => this.messageService.add({ severity: 'error', summary: 'Publish failed' }) });
  }

  resolveConflict(conflict: TimetableConflictModel) {
    this.messageService.add({ severity: 'info', summary: 'Auto Fix', detail: conflict.suggestion || 'Attempting to resolve...' });
  }
}