import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { TimetableApiService } from '../../../services/timetable-api.service';
import {
  DAY_LABELS,
  DAY_ORDER,
  DAY_SHORT,
  DayOfWeek,
  FixedActivity,
  FixedActivityRequest,
  GroupAssignmentCell,
  GroupAssignmentMatrix,
  GroupAssignmentRequest,
  GroupAssignmentRow,
  SchedulePattern,
  SchedulePatternRequest,
  SlotKind
} from '../../../models/timetable.model';

type ConfigTab = 'patterns' | 'assignments' | 'fixed';

interface PatternSlotForm {
  name: string;
  slotType: SlotKind;
  startTime: string;
  endTime: string;
}

interface PatternForm {
  name: string;
  description: string;
  active: boolean;
  teachingCount: number;
  duration: number;
  startTime: string;
  shortBreakAfter: number | null;
  shortBreakMinutes: number;
  lunchAfter: number | null;
  lunchMinutes: number;
  slots: PatternSlotForm[];
}

interface AssignUnit {
  academicGroupId: number;
  sectionId: number | null;
  label: string;
}

interface AssignForm {
  patternId: number | null;
  units: AssignUnit[];
  days: DayOfWeek[];
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

interface ActivityForm {
  fixedActivityId: number | null;
  name: string;
  description: string;
  activityType: string;
  appliesToAllGroups: boolean;
  units: AssignUnit[];
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  recurrence: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  active: boolean;
}

const ACTIVITY_TYPES = ['GENERAL', 'ASSEMBLY', 'EXERCISE', 'SPORTS', 'LIBRARY', 'COUNSELING', 'MEDITATION', 'OTHER'];

@Component({
  selector: 'app-timetable-configuration-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TcAcademicYearSelectorComponent,
    TcPageSkeletonComponent,
    DialogModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './timetable-configuration.component.html',
  styleUrls: ['./timetable-configuration.component.scss']
})
export class TimetableConfigurationPageComponent implements OnInit {
  private readonly api = inject(TimetableApiService);
  private readonly yearCtx = inject(AcademicYearContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly dayOrder = DAY_ORDER;
  readonly dayLabels = DAY_LABELS;
  readonly dayShort = DAY_SHORT;
  readonly activityTypes = ACTIVITY_TYPES;
  readonly tabs: { key: ConfigTab; label: string; icon: string }[] = [
    { key: 'patterns', label: 'Schedule Patterns', icon: 'pi pi-clock' },
    { key: 'assignments', label: 'Group Assignments', icon: 'pi pi-users' },
    { key: 'fixed', label: 'Fixed Activities', icon: 'pi pi-calendar-plus' }
  ];

  selectedYearId: number | null = null;
  activeTab: ConfigTab = 'patterns';
  loading = true;
  saving = false;

  patterns: SchedulePattern[] = [];
  selectedPatternId: number | null = null;
  patternSearch = '';
  patternStatus = 'ALL';

  matrix: GroupAssignmentMatrix | null = null;
  assignmentSearch = '';
  assignmentStatus = 'ALL';

  fixedActivities: FixedActivity[] = [];
  activitySearch = '';
  activityStatus = 'ALL';
  activityGroupFilter: number | null = null;

  showPatternDialog = false;
  patternForm: PatternForm = this.emptyPatternForm();
  editingPatternId: number | null = null;

  showAssignDialog = false;
  assignForm: AssignForm = this.emptyAssignForm();
  assignPickerGroupId: number | null = null;
  assignPickerSectionId: number | null = null;
  editingAssignmentId: number | null = null;

  showActivityDialog = false;
  activityForm: ActivityForm = this.emptyActivityForm();
  activityPickerGroupId: number | null = null;
  activityPickerSectionId: number | null = null;

  ngOnInit(): void {
    const qpYear = Number(this.route.snapshot.queryParamMap.get('academicYearId'));
    if (Number.isFinite(qpYear) && qpYear > 0) this.yearCtx.selectYear(qpYear);
    this.yearCtx.ensureLoaded().subscribe(() => {
      const id = this.yearCtx.selectedYearId();
      if (id) this.onYearChange(id);
      else { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  onYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (!yearId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.loadAll();
  }

  loadAll(): void {
    if (!this.selectedYearId) return;
    const yearId = this.selectedYearId;
    this.loading = !this.patterns.length && !this.matrix;
    this.api.listPatterns(yearId).subscribe({
      next: (patterns) => {
        if (yearId !== this.selectedYearId) return;
        this.patterns = patterns;
        if (!patterns.some(p => p.schedulePatternId === this.selectedPatternId)) {
          this.selectedPatternId = patterns[0]?.schedulePatternId ?? null;
        }
        this.loadMatrix();
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Unable to load schedule patterns' });
      }
    });
    this.api.listFixedActivities(yearId).subscribe({
      next: (list) => { this.fixedActivities = list; this.cdr.markForCheck(); },
      error: () => { this.fixedActivities = []; }
    });
  }

  private loadMatrix(): void {
    if (!this.selectedYearId) return;
    const yearId = this.selectedYearId;
    this.api.getAssignmentMatrix(yearId).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: (matrix) => {
        if (yearId !== this.selectedYearId) return;
        this.matrix = matrix;
        this.cdr.markForCheck();
      },
      error: () => {
        this.matrix = null;
        this.messages.add({ severity: 'error', summary: 'Unable to load group assignments' });
      }
    });
  }

  switchTab(tab: ConfigTab): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  backToTimetable(): void {
    this.router.navigate(['/app/academics/timetable'], {
      queryParams: this.selectedYearId ? { academicYearId: this.selectedYearId } : undefined
    });
  }

  // ─── Patterns ──────────────────────────────────────────────────────────

  get selectedPattern(): SchedulePattern | null {
    return this.patterns.find(p => p.schedulePatternId === this.selectedPatternId) ?? null;
  }

  get filteredPatterns(): SchedulePattern[] {
    const q = this.patternSearch.trim().toLowerCase();
    return this.patterns.filter(p => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q)
        || (p.description ?? '').toLowerCase().includes(q);
      const matchesStatus = this.patternStatus === 'ALL'
        || (this.patternStatus === 'ACTIVE' ? p.active : !p.active);
      return matchesQuery && matchesStatus;
    });
  }

  selectPattern(id: number): void {
    this.selectedPatternId = id;
    this.cdr.markForCheck();
  }

  patternSummary(pattern: SchedulePattern): string {
    const firstTeaching = pattern.slots.find(s => s.slotType === 'TEACHING');
    const duration = firstTeaching
      ? this.duration(firstTeaching.startTime, firstTeaching.endTime)
      : 0;
    return `${pattern.teachingSlotCount} periods · ${duration || 0} mins · ${pattern.assignedGroupCount} groups`;
  }

  patternDayRange(pattern: SchedulePattern): string {
    return pattern.assignedGroupCount > 0 ? 'Days set per group' : 'Not assigned';
  }

  openCreatePattern(): void {
    this.editingPatternId = null;
    this.patternForm = this.emptyPatternForm();
    this.generateSlots();
    this.showPatternDialog = true;
    this.cdr.markForCheck();
  }

  openEditPattern(pattern: SchedulePattern): void {
    this.editingPatternId = pattern.schedulePatternId ?? null;
    this.patternForm = {
      name: pattern.name,
      description: pattern.description ?? '',
      active: pattern.active,
      teachingCount: pattern.teachingSlotCount,
      duration: pattern.slots.find(s => s.slotType === 'TEACHING')
        ? this.duration(pattern.slots.find(s => s.slotType === 'TEACHING')!.startTime,
          pattern.slots.find(s => s.slotType === 'TEACHING')!.endTime)
        : 40,
      startTime: pattern.dayStartTime?.substring(0, 5) ?? '08:00',
      shortBreakAfter: null,
      shortBreakMinutes: 15,
      lunchAfter: null,
      lunchMinutes: 30,
      slots: pattern.slots.map(s => ({
        name: s.name,
        slotType: s.slotType,
        startTime: s.startTime?.substring(0, 5) ?? '08:00',
        endTime: s.endTime?.substring(0, 5) ?? '08:40'
      }))
    };
    this.showPatternDialog = true;
    this.cdr.markForCheck();
  }

  generateSlots(): void {
    const form = this.patternForm;
    const slots: PatternSlotForm[] = [];
    let t = this.toMinutes(form.startTime || '08:00');
    let teaching = 0;
    const total = Math.max(1, Number(form.teachingCount) || 1);
    const duration = Math.max(5, Number(form.duration) || 40);
    while (teaching < total) {
      if (form.shortBreakAfter && teaching === Number(form.shortBreakAfter)) {
        const mins = Math.max(1, Number(form.shortBreakMinutes) || 15);
        slots.push(this.slot('Short Break', 'BREAK', t, mins));
        t += mins;
      }
      if (form.lunchAfter && teaching === Number(form.lunchAfter)) {
        const mins = Math.max(1, Number(form.lunchMinutes) || 30);
        slots.push(this.slot('Lunch Break', 'BREAK', t, mins));
        t += mins;
      }
      teaching++;
      slots.push(this.slot(`Period ${teaching}`, 'TEACHING', t, duration));
      t += duration;
    }
    form.slots = slots;
    this.cdr.markForCheck();
  }

  addSlot(): void {
    const last = this.patternForm.slots[this.patternForm.slots.length - 1];
    const start = last ? this.fromMinutes(this.toMinutes(last.endTime)) : (this.patternForm.startTime || '08:00');
    this.patternForm.slots.push({
      name: `Period ${this.patternForm.slots.filter(s => s.slotType === 'TEACHING').length + 1}`,
      slotType: 'TEACHING',
      startTime: start,
      endTime: this.fromMinutes(this.toMinutes(start) + (Number(this.patternForm.duration) || 40))
    });
    this.cdr.markForCheck();
  }

  removeSlot(index: number): void {
    this.patternForm.slots.splice(index, 1);
    this.cdr.markForCheck();
  }

  savePattern(): void {
    if (!this.selectedYearId) return;
    const form = this.patternForm;
    if (!form.name.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Give the pattern a name' });
      return;
    }
    if (!form.slots.length) {
      this.messages.add({ severity: 'warn', summary: 'Add at least one time slot' });
      return;
    }
    const invalid = form.slots.find(s => !s.name.trim() || !s.startTime || !s.endTime || s.startTime >= s.endTime);
    if (invalid) {
      this.messages.add({ severity: 'warn', summary: 'Every slot needs a name and valid start/end times' });
      return;
    }
    const sorted = [...form.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startTime < sorted[i - 1].endTime) {
        this.messages.add({ severity: 'warn', summary: `"${sorted[i - 1].name}" overlaps "${sorted[i].name}"` });
        return;
      }
    }
    const body: SchedulePatternRequest = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      active: form.active,
      slots: form.slots.map(s => ({
        name: s.name.trim(),
        slotType: s.slotType,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    };
    this.saving = true;
    const call = this.editingPatternId
      ? this.api.updatePattern(this.editingPatternId, body)
      : this.api.createPattern(this.selectedYearId, body);
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); })).subscribe({
      next: (saved) => {
        this.showPatternDialog = false;
        this.messages.add({ severity: 'success', summary: this.editingPatternId ? 'Pattern updated' : 'Pattern created' });
        this.loadAll();
        if (saved.schedulePatternId) this.selectedPatternId = saved.schedulePatternId;
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Could not save the pattern',
        detail: err?.error?.message,
        life: 10000
      })
    });
  }

  duplicatePattern(pattern: SchedulePattern): void {
    if (!pattern.schedulePatternId) return;
    this.api.duplicatePattern(pattern.schedulePatternId, `${pattern.name} (copy)`).subscribe({
      next: (copy) => {
        this.messages.add({ severity: 'success', summary: 'Pattern duplicated' });
        this.loadAll();
        this.selectedPatternId = copy.schedulePatternId ?? null;
      },
      error: (err) => this.messages.add({
        severity: 'error', summary: 'Could not duplicate the pattern', detail: err?.error?.message
      })
    });
  }

  togglePatternActive(pattern: SchedulePattern): void {
    if (!pattern.schedulePatternId) return;
    const next = !pattern.active;
    const run = () => this.api.setPatternActive(pattern.schedulePatternId!, next).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: next ? 'Pattern activated' : 'Pattern deactivated' });
        this.loadAll();
      },
      error: (err) => this.messages.add({
        severity: 'error', summary: 'Could not update the pattern', detail: err?.error?.message
      })
    });
    if (!next) {
      this.confirm.confirm({
        header: 'Deactivate pattern?',
        message: pattern.assignedGroupCount
          ? `This pattern is assigned to ${pattern.assignedGroupCount} group/section unit(s). Deactivating it will make those assignments invalid until another pattern is assigned.`
          : 'This pattern will no longer be available for new group assignments.',
        acceptLabel: 'Deactivate',
        acceptButtonStyleClass: 'p-button-danger',
        accept: run
      });
    } else run();
  }

  // ─── Assignments ──────────────────────────────────────────────────────

  get filteredRows(): GroupAssignmentRow[] {
    const q = this.assignmentSearch.trim().toLowerCase();
    return (this.matrix?.rows ?? []).filter(row => {
      const matchesQuery = !q
        || row.academicGroupName.toLowerCase().includes(q)
        || row.academicGroupCode.toLowerCase().includes(q)
        || (row.sectionName ?? '').toLowerCase().includes(q);
      const matchesStatus = this.assignmentStatus === 'ALL'
        || (this.assignmentStatus === 'ACTIVE' ? row.active : !row.active);
      return matchesQuery && matchesStatus;
    });
  }

  cellsFor(row: GroupAssignmentRow, day: DayOfWeek): GroupAssignmentCell[] {
    return row.cells.filter(c => c.dayOfWeek === day);
  }

  rowLabel(row: GroupAssignmentRow): string {
    return row.sectionId ? `${row.academicGroupName} - ${row.sectionName}` : row.academicGroupName;
  }

  rowCode(row: GroupAssignmentRow): string {
    return `${row.academicGroupCode}${row.sectionName ? '-' + row.sectionName : ''}`;
  }

  openAssign(row?: GroupAssignmentRow, day?: DayOfWeek, cell?: GroupAssignmentCell): void {
    if (!this.matrix) return;
    this.editingAssignmentId = cell?.groupScheduleAssignmentId ?? null;
    const first = row ?? this.filteredRows[0];
    this.assignForm = {
      patternId: cell?.schedulePatternId ?? this.patterns.find(p => p.active)?.schedulePatternId ?? null,
      units: first ? [this.unitOf(first)] : [],
      days: day ? [day] : [day ?? 'MONDAY'],
      effectiveFrom: cell?.effectiveFrom ?? null,
      effectiveTo: cell?.effectiveTo ?? null
    };
    this.assignPickerGroupId = first?.academicGroupId ?? null;
    this.assignPickerSectionId = first?.sectionId ?? null;
    this.showAssignDialog = true;
    this.cdr.markForCheck();
  }

  addAssignUnit(): void {
    if (!this.assignPickerGroupId) return;
    const unit = this.findUnit(this.assignPickerGroupId, this.assignPickerSectionId);
    if (!unit) return;
    if (!this.assignForm.units.some(u => u.academicGroupId === unit.academicGroupId && u.sectionId === unit.sectionId)) {
      this.assignForm.units.push(unit);
    }
    this.cdr.markForCheck();
  }

  removeAssignUnit(index: number): void {
    this.assignForm.units.splice(index, 1);
    this.cdr.markForCheck();
  }

  toggleAssignDay(day: DayOfWeek): void {
    const index = this.assignForm.days.indexOf(day);
    if (index >= 0) this.assignForm.days.splice(index, 1);
    else this.assignForm.days.push(day);
    this.cdr.markForCheck();
  }

  toggleActivityDay(day: DayOfWeek): void {
    const index = this.activityForm.days.indexOf(day);
    if (index >= 0) this.activityForm.days.splice(index, 1);
    else this.activityForm.days.push(day);
    this.cdr.markForCheck();
  }

  saveAssignment(): void {
    if (!this.selectedYearId) return;
    const form = this.assignForm;
    if (!form.patternId || !form.units.length || !form.days.length) {
      this.messages.add({ severity: 'warn', summary: 'Choose a pattern, at least one group and at least one day' });
      return;
    }
    const body: GroupAssignmentRequest = {
      schedulePatternId: form.patternId,
      units: form.units.map(u => ({ academicGroupId: u.academicGroupId, sectionId: u.sectionId })),
      days: form.days,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null
    };
    this.saving = true;
    const call = this.api.assignPattern(this.selectedYearId, body);
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); })).subscribe({
      next: () => {
        this.showAssignDialog = false;
        this.messages.add({ severity: 'success', summary: 'Schedule assignment saved' });
        this.loadAll();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Could not assign the pattern',
        detail: err?.error?.message,
        life: 10000
      })
    });
  }

  deleteAssignmentCell(cell: GroupAssignmentCell): void {
    this.confirm.confirm({
      header: 'Remove assignment?',
      message: `Remove "${cell.schedulePatternName}" from this day?`,
      acceptLabel: 'Remove',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.deleteAssignment(cell.groupScheduleAssignmentId).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Assignment removed' });
          this.loadAll();
        },
        error: (err) => this.messages.add({
          severity: 'error', summary: 'Could not remove the assignment', detail: err?.error?.message
        })
      })
    });
  }

  // ─── Fixed activities ─────────────────────────────────────────────────

  get filteredActivities(): FixedActivity[] {
    const q = this.activitySearch.trim().toLowerCase();
    return this.fixedActivities.filter(a => {
      const matchesQuery = !q || a.name.toLowerCase().includes(q)
        || (a.description ?? '').toLowerCase().includes(q);
      const matchesStatus = this.activityStatus === 'ALL'
        || (this.activityStatus === 'ACTIVE' ? a.active : !a.active);
      const matchesGroup = !this.activityGroupFilter
        || a.appliesToAllGroups
        || a.groups.some(g => g.academicGroupId === this.activityGroupFilter);
      return matchesQuery && matchesStatus && matchesGroup;
    });
  }

  activityAppliesTo(activity: FixedActivity): string {
    if (activity.appliesToAllGroups) return 'All Classes';
    return activity.groups
      .map(g => g.sectionName ? `${g.academicGroupName} - ${g.sectionName}` : g.academicGroupName)
      .join(', ') || 'Selected groups';
  }

  activityTime(activity: FixedActivity): string {
    return `${this.hhmm(activity.startTime)} – ${this.hhmm(activity.endTime)}`;
  }

  openCreateActivity(): void {
    this.activityForm = this.emptyActivityForm();
    this.activityPickerGroupId = this.groupOptions[0]?.value ?? null;
    this.activityPickerSectionId = null;
    this.showActivityDialog = true;
    this.cdr.markForCheck();
  }

  openEditActivity(activity: FixedActivity): void {
    this.activityForm = {
      fixedActivityId: activity.fixedActivityId ?? null,
      name: activity.name,
      description: activity.description ?? '',
      activityType: activity.activityType || 'GENERAL',
      appliesToAllGroups: activity.appliesToAllGroups,
      units: activity.groups.map(g => ({
        academicGroupId: g.academicGroupId,
        sectionId: g.sectionId ?? null,
        label: g.sectionName ? `${g.academicGroupName} - ${g.sectionName}` : (g.academicGroupName ?? 'Group')
      })),
      days: [...activity.days],
      startTime: this.hhmm(activity.startTime),
      endTime: this.hhmm(activity.endTime),
      recurrence: activity.recurrence || 'WEEKLY',
      effectiveFrom: activity.effectiveFrom ?? null,
      effectiveTo: activity.effectiveTo ?? null,
      active: activity.active
    };
    this.activityPickerGroupId = this.groupOptions[0]?.value ?? null;
    this.activityPickerSectionId = null;
    this.showActivityDialog = true;
    this.cdr.markForCheck();
  }

  addActivityUnit(): void {
    if (!this.activityPickerGroupId) return;
    const unit = this.findUnit(this.activityPickerGroupId, this.activityPickerSectionId);
    if (!unit) return;
    if (!this.activityForm.units.some(u => u.academicGroupId === unit.academicGroupId && u.sectionId === unit.sectionId)) {
      this.activityForm.units.push(unit);
    }
    this.cdr.markForCheck();
  }

  removeActivityUnit(index: number): void {
    this.activityForm.units.splice(index, 1);
    this.cdr.markForCheck();
  }

  saveActivity(): void {
    if (!this.selectedYearId) return;
    const form = this.activityForm;
    if (!form.name.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Give the activity a name' });
      return;
    }
    if (!form.days.length) {
      this.messages.add({ severity: 'warn', summary: 'Select at least one day' });
      return;
    }
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) {
      this.messages.add({ severity: 'warn', summary: 'The activity must start before it ends' });
      return;
    }
    if (!form.appliesToAllGroups && !form.units.length) {
      this.messages.add({ severity: 'warn', summary: 'Select at least one academic group' });
      return;
    }
    const body: FixedActivityRequest = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      activityType: form.activityType,
      appliesToAllGroups: form.appliesToAllGroups,
      startTime: form.startTime + ':00',
      endTime: form.endTime + ':00',
      recurrence: form.recurrence,
      effectiveFrom: form.effectiveFrom || null,
      effectiveTo: form.effectiveTo || null,
      active: form.active,
      days: form.days,
      groups: form.units.map(u => ({ academicGroupId: u.academicGroupId, sectionId: u.sectionId }))
    };
    this.saving = true;
    const call = form.fixedActivityId
      ? this.api.updateFixedActivity(form.fixedActivityId, body)
      : this.api.createFixedActivity(this.selectedYearId, body);
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); })).subscribe({
      next: () => {
        this.showActivityDialog = false;
        this.messages.add({ severity: 'success', summary: 'Fixed activity saved' });
        this.loadAll();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Could not save the fixed activity',
        detail: err?.error?.message,
        life: 10000
      })
    });
  }

  toggleActivityActive(activity: FixedActivity): void {
    if (!activity.fixedActivityId) return;
    this.api.setFixedActivityActive(activity.fixedActivityId, !activity.active).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: activity.active ? 'Activity deactivated' : 'Activity activated' });
        this.loadAll();
      },
      error: (err) => this.messages.add({
        severity: 'error', summary: 'Could not update the activity', detail: err?.error?.message
      })
    });
  }

  deleteActivity(activity: FixedActivity): void {
    if (!activity.fixedActivityId) return;
    this.confirm.confirm({
      header: 'Delete fixed activity?',
      message: `"${activity.name}" will be removed from the configuration. Existing published timetables are not changed.`,
      acceptLabel: 'Delete',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.deleteFixedActivity(activity.fixedActivityId!).subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Fixed activity deleted' });
          this.loadAll();
        },
        error: (err) => this.messages.add({
          severity: 'error', summary: 'Could not delete the activity', detail: err?.error?.message
        })
      })
    });
  }

  // ─── Units / pickers ──────────────────────────────────────────────────

  get groupOptions(): { label: string; value: number }[] {
    const seen = new Map<number, string>();
    for (const row of this.matrix?.rows ?? []) {
      if (!seen.has(row.academicGroupId)) seen.set(row.academicGroupId, row.academicGroupName);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }

  get sectionOptions(): { label: string; value: number }[] {
    const groupId = this.activeTab === 'fixed' ? this.activityPickerGroupId : this.assignPickerGroupId;
    return (this.matrix?.rows ?? [])
      .filter(r => r.academicGroupId === groupId && r.sectionId)
      .map(r => ({ value: r.sectionId!, label: r.sectionName! }));
  }

  get pickerGroupId(): number | null {
    return this.activeTab === 'fixed' ? this.activityPickerGroupId : this.assignPickerGroupId;
  }

  set pickerGroupId(value: number | null) {
    if (this.activeTab === 'fixed') this.activityPickerGroupId = value;
    else this.assignPickerGroupId = value;
  }

  get pickerSectionId(): number | null {
    return this.activeTab === 'fixed' ? this.activityPickerSectionId : this.assignPickerSectionId;
  }

  set pickerSectionId(value: number | null) {
    if (this.activeTab === 'fixed') this.activityPickerSectionId = value;
    else this.assignPickerSectionId = value;
  }

  private findUnit(groupId: number, sectionId: number | null): AssignUnit | null {
    const row = (this.matrix?.rows ?? []).find(r => r.academicGroupId === groupId
      && (sectionId ? r.sectionId === sectionId : !r.sectionId));
    if (!row) return null;
    return this.unitOf(row);
  }

  private unitOf(row: GroupAssignmentRow): AssignUnit {
    return {
      academicGroupId: row.academicGroupId,
      sectionId: row.sectionId ?? null,
      label: row.sectionId ? `${row.academicGroupName} - ${row.sectionName}` : row.academicGroupName
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  hhmm(value?: string | null): string {
    return value ? value.substring(0, 5) : '';
  }

  formatTime(value?: string | null): string {
    if (!value) return '';
    const [h, m] = value.substring(0, 5).split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  slotDuration(pattern: SchedulePattern): number {
    const first = pattern.slots.find(s => s.slotType === 'TEACHING');
    return first ? this.duration(first.startTime, first.endTime) : 0;
  }

  patternTone(name: string): string {
    const lower = (name || '').toLowerCase();
    if (lower.includes('exam')) return 'rose';
    if (lower.includes('short')) return 'amber';
    if (lower.includes('activity')) return 'violet';
    if (lower.includes('morning') || lower.includes('coaching')) return 'emerald';
    return 'sky';
  }

  activityIcon(type: string): string {
    switch ((type || '').toUpperCase()) {
      case 'ASSEMBLY': return 'pi-users';
      case 'EXERCISE': return 'pi-heart';
      case 'SPORTS': return 'pi-bolt';
      case 'LIBRARY': return 'pi-book';
      case 'COUNSELING': return 'pi-heart-fill';
      case 'MEDITATION': return 'pi-sparkles';
      default: return 'pi-calendar';
    }
  }

  private duration(start: string, end: string): number {
    return Math.max(0, this.toMinutes(end) - this.toMinutes(start));
  }

  private toMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private fromMinutes(value: number): string {
    const h = Math.floor(value / 60) % 24;
    const m = value % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private slot(name: string, type: SlotKind, startMinutes: number, duration: number): PatternSlotForm {
    return {
      name,
      slotType: type,
      startTime: this.fromMinutes(startMinutes),
      endTime: this.fromMinutes(startMinutes + duration)
    };
  }

  private emptyPatternForm(): PatternForm {
    return {
      name: '', description: '', active: true,
      teachingCount: 8, duration: 40, startTime: '08:00',
      shortBreakAfter: 3, shortBreakMinutes: 15,
      lunchAfter: 5, lunchMinutes: 30,
      slots: []
    };
  }

  private emptyAssignForm(): AssignForm {
    return {
      patternId: null, units: [], days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      effectiveFrom: null, effectiveTo: null
    };
  }

  private emptyActivityForm(): ActivityForm {
    return {
      fixedActivityId: null,
      name: '',
      description: '',
      activityType: 'GENERAL',
      appliesToAllGroups: true,
      units: [],
      days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      startTime: '08:00',
      endTime: '08:20',
      recurrence: 'WEEKLY',
      effectiveFrom: null,
      effectiveTo: null,
      active: true
    };
  }
}
