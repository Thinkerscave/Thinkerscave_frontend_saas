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
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { TimetableApiService } from '../../../services/timetable-api.service';
import {
  DAY_LABELS,
  DAY_ORDER,
  DAY_SHORT,
  DayOfWeek,
  FixedActivity,
  FixedActivityGroupOption,
  FixedActivityOptions,
  FixedActivityRequest,
  FixedActivitySchedule,
  FixedActivitySectionOption,
  FixedActivitySubjectOption,
  FixedActivityTeacherOption,
  GroupAssignmentCell,
  GroupAssignmentMatrix,
  GroupAssignmentRequest,
  GroupAssignmentRow,
  SchedulePattern,
  SchedulePatternRequest,
  SlotKind
} from '../../../models/timetable.model';
import { SubjectType, subjectTypeLabel } from '../../../models/subjects-mapping.model';

type ConfigTab = 'patterns' | 'assignments' | 'fixed';
type PickerSectionScope = 'ALL' | 'SELECTED';
type ActivitySectionScope = 'ALL' | 'SELECTED';
type ActivityGroupScope = 'ALL' | 'SELECTED';

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
  subjectId: number | null;
  groupScope: ActivityGroupScope;
  groupSelections: ActivityGroupSelection[];
  description: string;
  active: boolean;
  days: DayOfWeek[];
  periodName: string | null;
}

interface ActivityGroupSelection {
  academicGroupId: number;
  sectionScope: ActivitySectionScope;
  sectionIds: number[];
}

interface ActivityUnavailableSection {
  groupId: number;
  sectionId: number;
  name: string;
}

interface ActivityUnavailableGroup {
  groupId: number;
  name: string;
}

const ACTIVITY_GROUP_SCOPES: { key: ActivityGroupScope; label: string; hint: string }[] = [
  {
    key: 'ALL',
    label: 'All Groups',
    hint: 'Applies to every active academic group and all of their sections.'
  },
  {
    key: 'SELECTED',
    label: 'Specific Groups',
    hint: 'Choose one or more groups, then choose all or specific sections for each.'
  }
];

@Component({
  selector: 'app-timetable-configuration-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TcAcademicYearSelectorComponent,
    SaasPageHeaderComponent,
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
  readonly activityGroupScopes = ACTIVITY_GROUP_SCOPES;
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
  assignPickerScope: PickerSectionScope = 'ALL';
  assignPickerSectionIds: number[] = [];
  editingAssignmentId: number | null = null;

  showActivityDialog = false;
  activityForm: ActivityForm = this.emptyActivityForm();
  activityOptions: FixedActivityOptions | null = null;
  activitySchedule: FixedActivitySchedule | null = null;
  activityIssues: string[] = [];
  activityRestoreIssues: string[] = [];
  activityResolving = false;
  activitySubjectSearch = '';
  activityGroupSearch = '';
  activityExpandedGroupIds: number[] = [];
  activityUnavailableGroups: ActivityUnavailableGroup[] = [];
  activityUnavailableSections: ActivityUnavailableSection[] = [];
  private activityResolveToken = 0;

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
    this.loadActivityOptions();
  }

  private loadActivityOptions(onLoaded?: () => void): void {
    if (!this.selectedYearId) {
      onLoaded?.();
      return;
    }
    const yearId = this.selectedYearId;
    this.api.getFixedActivityOptions(yearId).subscribe({
      next: (options) => {
        if (yearId !== this.selectedYearId) return;
        this.activityOptions = options;
        onLoaded?.();
        if (!onLoaded && this.showActivityDialog) this.resolveActivitySchedule();
        this.cdr.markForCheck();
      },
      error: () => {
        this.activityOptions = null;
        this.messages.add({ severity: 'error', summary: 'Unable to load subjects and groups' });
        onLoaded?.();
      }
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
        || (row.scopeLabel ?? '').toLowerCase().includes(q)
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
    if (row.sectionId != null) return `${row.academicGroupName} - ${row.sectionName}`;
    return row.scopeLabel ? `${row.academicGroupName} - ${row.scopeLabel}` : row.academicGroupName;
  }

  rowCode(row: GroupAssignmentRow): string {
    return `${row.academicGroupCode}${row.sectionId != null && row.sectionName ? '-' + row.sectionName : ''}`;
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
    this.assignPickerScope = first?.sectionId != null ? 'SELECTED' : 'ALL';
    this.assignPickerSectionIds = first?.sectionId != null ? [first.sectionId] : [];
    this.showAssignDialog = true;
    this.cdr.markForCheck();
  }

  addAssignUnit(): void {
    if (!this.assignPickerGroupId) return;
    const units = this.pickerUnitsForGroup(
      this.assignPickerGroupId,
      this.assignPickerScope,
      this.assignPickerSectionIds
    );
    if (!units.length) {
      this.messages.add({ severity: 'warn', summary: 'Select at least one section' });
      return;
    }
    for (const unit of units) {
      if (!this.assignForm.units.some(u => u.academicGroupId === unit.academicGroupId && u.sectionId === unit.sectionId)) {
        this.assignForm.units.push(unit);
      }
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

  get activityGroupOptions(): FixedActivityGroupOption[] {
    return this.activityOptions?.groups ?? [];
  }

  get filteredActivitySubjects(): FixedActivitySubjectOption[] {
    const q = this.activitySubjectSearch.trim().toLowerCase();
    return (this.activityOptions?.subjects ?? []).filter(subject => !q
      || subject.name.toLowerCase().includes(q)
      || subject.code.toLowerCase().includes(q));
  }

  get activitySelectedSubject(): FixedActivitySubjectOption | null {
    const id = this.activityForm.subjectId;
    if (!id) return null;
    return (this.activityOptions?.subjects ?? [])
      .find(subject => subject.subjectId === id) ?? null;
  }

  get filteredActivityGroups(): FixedActivityGroupOption[] {
    const q = this.activityGroupSearch.trim().toLowerCase();
    return this.activityGroupOptions.filter(group => !q
      || group.name.toLowerCase().includes(q)
      || group.code.toLowerCase().includes(q));
  }

  get activityGroupsInScope(): FixedActivityGroupOption[] {
    if (this.activityForm.groupScope === 'ALL') return this.activityGroupOptions;
    const ids = new Set(this.activityForm.groupSelections.map(selection => selection.academicGroupId));
    return this.activityGroupOptions.filter(group => ids.has(group.academicGroupId));
  }

  get activitySelectedGroupCount(): number {
    return this.activityGroupsInScope.length;
  }

  get activityGroupSelectionMissing(): boolean {
    return this.activityForm.groupScope === 'SELECTED'
      && this.activityForm.groupSelections.length === 0;
  }

  get activitySectionSelectionInvalid(): boolean {
    if (this.activityForm.groupScope === 'ALL') return false;
    return this.activityForm.groupSelections.some(selection => {
      const group = this.activityGroupOptions
        .find(candidate => candidate.academicGroupId === selection.academicGroupId);
      return !!group && group.sections.length > 0
        && selection.sectionScope === 'SELECTED' && selection.sectionIds.length === 0;
    });
  }

  activityGroupSelection(groupId: number): ActivityGroupSelection | null {
    return this.activityForm.groupSelections
      .find(selection => selection.academicGroupId === groupId) ?? null;
  }

  isActivityGroupSelected(groupId: number): boolean {
    return !!this.activityGroupSelection(groupId);
  }

  isActivityGroupExpanded(groupId: number): boolean {
    return this.activityExpandedGroupIds.includes(groupId);
  }

  toggleActivityGroupExpanded(groupId: number): void {
    const index = this.activityExpandedGroupIds.indexOf(groupId);
    if (index >= 0) this.activityExpandedGroupIds.splice(index, 1);
    else this.activityExpandedGroupIds.push(groupId);
    this.cdr.markForCheck();
  }

  activityGroupSummary(group: FixedActivityGroupOption): string {
    const selection = this.activityGroupSelection(group.academicGroupId);
    if (!selection) return group.name;
    if (!group.sections.length || selection.sectionScope === 'ALL') {
      return `${group.name} – All Sections`;
    }
    const names = group.sections
      .filter(section => selection.sectionIds.includes(section.sectionId))
      .map(section => section.name);
    if (!names.length) return `${group.name} – No sections`;
    if (names.length <= 2) return `${group.name} – ${names.join(', ')}`;
    return `${group.name} – ${names.length} sections`;
  }

  activityGroupSectionSelectionInvalid(group: FixedActivityGroupOption): boolean {
    const selection = this.activityGroupSelection(group.academicGroupId);
    return !!selection && group.sections.length > 0
      && selection.sectionScope === 'SELECTED' && selection.sectionIds.length === 0;
  }

  get activitySelectedUnitCount(): number {
    return this.activityGroupsInScope.reduce((total, group) => {
      const selection = this.activityGroupSelection(group.academicGroupId);
      if (!group.sections.length || !selection || selection.sectionScope === 'ALL') {
        return total + Math.max(1, group.sections.length);
      }
      return total + selection.sectionIds.length;
    }, 0);
  }

  get activityIsAcademicSubject(): boolean {
    const type = this.activitySelectedSubject?.subjectType;
    return type === 'ACADEMIC_SUBJECT' || type === 'PRACTICAL_LAB';
  }

  get activityTeacherRequired(): boolean {
    return this.activityIsAcademicSubject;
  }

  get activityEligibleTeachers(): FixedActivityTeacherOption[] {
    return [...(this.activitySchedule?.teachers ?? [])]
      .filter(teacher => teacher.eligibleForAllUnits)
      .sort((a, b) => a.staffName.localeCompare(b.staffName));
  }

  get activityResolvedTeacherNames(): string {
    return this.activityEligibleTeachers.map(teacher => teacher.staffName).join(', ');
  }

  get activityTeacherMissing(): boolean {
    return this.activityTeacherRequired
      && !!this.activityForm.subjectId
      && this.activitySelectedUnitCount > 0
      && this.activityEligibleTeachers.length === 0;
  }

  get activityTeacherNotShared(): boolean {
    return this.activityTeacherMissing
      && (this.activitySchedule?.teachers.length ?? 0) > 0;
  }

  get activityCommonPeriods(): { name: string; displayTime: string; timesVary: boolean; times: string[] }[] {
    return this.activitySchedule?.commonPeriods ?? [];
  }

  get activityPeriodSelectionInvalid(): boolean {
    const name = this.activityForm.periodName;
    if (!name || !this.activityCommonPeriods.length) return false;
    return !this.activityCommonPeriods.some(period => period.name === name);
  }

  get activityDisplayIssues(): string[] {
    return [...this.activityRestoreIssues, ...this.activityIssues];
  }

  get activitySaveDisabled(): boolean {
    return this.saving
      || this.activityResolving
      || !this.activityForm.subjectId
      || this.activityGroupSelectionMissing
      || this.activitySelectedGroupCount === 0
      || !this.activityForm.days.length
      || !this.activityForm.periodName
      || this.activityPeriodSelectionInvalid
      || this.activitySectionSelectionInvalid
      || this.activitySelectedUnitCount === 0
      || this.activityTeacherMissing
      || this.activityDisplayIssues.length > 0;
  }

  activitySubjectTypeLabel(subject: FixedActivitySubjectOption | null): string {
    return subjectTypeLabel(subject?.subjectType as SubjectType | undefined);
  }

  activityTypeLabel(activity: FixedActivity): string {
    return subjectTypeLabel((activity.subjectType ?? activity.activityType) as SubjectType | undefined);
  }

  get filteredActivities(): FixedActivity[] {
    const q = this.activitySearch.trim().toLowerCase();
    return this.fixedActivities.filter(activity => {
      const matchesQuery = !q
        || (activity.subjectName ?? activity.name ?? '').toLowerCase().includes(q)
        || (activity.description ?? '').toLowerCase().includes(q)
        || (activity.periodName ?? '').toLowerCase().includes(q);
      const matchesStatus = this.activityStatus === 'ALL'
        || (this.activityStatus === 'ACTIVE' ? activity.active : !activity.active);
      const matchesGroup = !this.activityGroupFilter
        || activity.appliesToAllGroups
        || activity.groups.some(group => group.academicGroupId === this.activityGroupFilter);
      return matchesQuery && matchesStatus && matchesGroup;
    });
  }

  activityAppliesTo(activity: FixedActivity): string {
    if (!activity.groups?.length) return activity.appliesToAllGroups ? 'All groups' : 'No groups';
    const grouped = new Map<number, { name: string; sections: string[]; allSections: boolean }>();
    for (const unit of activity.groups) {
      const entry = grouped.get(unit.academicGroupId)
        ?? { name: unit.academicGroupName ?? 'Group', sections: [], allSections: false };
      if (unit.sectionId == null) entry.allSections = true;
      else if (unit.sectionName) entry.sections.push(unit.sectionName);
      grouped.set(unit.academicGroupId, entry);
    }
    return [...grouped.entries()].map(([groupId, group]) => {
      if (group.allSections) return `${group.name} (all sections)`;
      if (!group.sections.length) return group.name;
      const option = this.activityGroupOptions
        .find(candidate => candidate.academicGroupId === groupId);
      const coversEverySection = !!option && option.sections.length > 0
        && group.sections.length === option.sections.length;
      return coversEverySection
        ? `${group.name} (all sections)`
        : `${group.name} · ${group.sections.join(', ')}`;
    }).join('; ');
  }

  activityPeriodLabel(activity: FixedActivity): string {
    const label = activity.periodName || activity.periods?.[0]?.periodName;
    if (!label) return this.activityTime(activity);
    const times = new Set((activity.periods ?? [])
      .filter(row => row.periodName === label)
      .map(row => `${this.hhmm(row.startTime)} – ${this.hhmm(row.endTime)}`));
    if (!times.size) return label;
    if (times.size === 1) return `${label} · ${[...times][0]}`;
    return `${label} · varies by day`;
  }

  activityTime(activity: FixedActivity): string {
    if (!activity.startTime || !activity.endTime) return 'Not configured';
    return `${this.hhmm(activity.startTime)} – ${this.hhmm(activity.endTime)}`;
  }

  openCreateActivity(): void {
    this.activityForm = this.emptyActivityForm();
    this.activitySubjectSearch = '';
    this.activityGroupSearch = '';
    this.activitySchedule = null;
    this.activityIssues = [];
    this.activityRestoreIssues = [];
    this.activityUnavailableGroups = [];
    this.activityUnavailableSections = [];
    this.showActivityDialog = true;
    this.loadActivityOptions();
    this.cdr.markForCheck();
  }

  openEditActivity(activity: FixedActivity): void {
    const groups = activity.groups ?? [];
    const groupIds = [...new Set(groups.map(group => group.academicGroupId))];
    const selections: ActivityGroupSelection[] = groupIds.map(groupId => {
      const units = groups.filter(group => group.academicGroupId === groupId);
      const sectionIds = units
        .filter(unit => unit.sectionId != null)
        .map(unit => unit.sectionId!);
      const allSections = units.some(unit => unit.sectionId == null);
      return {
        academicGroupId: groupId,
        sectionScope: allSections || !sectionIds.length ? 'ALL' : 'SELECTED',
        sectionIds: allSections ? [] : sectionIds
      };
    });
    const legacyAllGroups = activity.appliesToAllGroups && !groupIds.length;
    this.activityForm = {
      fixedActivityId: activity.fixedActivityId ?? null,
      subjectId: activity.subjectId ?? null,
      groupScope: legacyAllGroups ? 'ALL' : 'SELECTED',
      groupSelections: selections,
      description: activity.description ?? '',
      active: activity.active,
      days: [...activity.days],
      periodName: activity.periodName ?? activity.periods?.[0]?.periodName ?? null
    };
    this.activitySubjectSearch = '';
    this.activityGroupSearch = '';
    this.activityExpandedGroupIds = [];
    this.activitySchedule = null;
    this.activityIssues = [];
    this.activityRestoreIssues = [];
    this.activityUnavailableGroups = [];
    this.activityUnavailableSections = [];
    this.showActivityDialog = true;
    this.loadActivityOptions(() => this.restoreActivityDependentState(activity));
    this.cdr.markForCheck();
  }

  /**
   * Runs only after options are loaded so saved groups and sections can be matched against
   * the current configuration. Never silently replaces a saved subject, group or section.
   */
  private restoreActivityDependentState(activity: FixedActivity): void {
    const availableGroups = new Set(this.activityGroupOptions
      .map(group => group.academicGroupId));
    this.activityUnavailableGroups = this.activityForm.groupSelections
      .filter(selection => !availableGroups.has(selection.academicGroupId))
      .map(selection => ({
        groupId: selection.academicGroupId,
        name: activity.groups.find(unit =>
          unit.academicGroupId === selection.academicGroupId)?.academicGroupName
          ?? `Group ${selection.academicGroupId}`
      }));
    this.activityUnavailableSections = [];
    for (const selection of this.activityForm.groupSelections) {
      const group = this.activityGroupOptions
        .find(candidate => candidate.academicGroupId === selection.academicGroupId);
      if (!group) continue;
      const availableSections = new Set(group.sections.map(section => section.sectionId));
      for (const sectionId of selection.sectionIds) {
        if (availableSections.has(sectionId)) continue;
        this.activityUnavailableSections.push({
          groupId: group.academicGroupId,
          sectionId,
          name: activity.groups.find(unit => unit.academicGroupId === group.academicGroupId
            && unit.sectionId === sectionId)?.sectionName ?? `Section ${sectionId}`
        });
      }
    }
    this.refreshActivityRestoreIssues();
    const coversEveryGroup = this.activityForm.groupScope !== 'ALL'
      && !this.activityUnavailableGroups.length
      && !this.activityUnavailableSections.length
      && !!this.activityGroupOptions.length
      && this.activityForm.groupSelections.length === this.activityGroupOptions.length
      && this.activityForm.groupSelections.every(selection => selection.sectionScope === 'ALL');
    if (coversEveryGroup) this.activityForm.groupScope = 'ALL';
    this.resolveActivitySchedule();
  }

  private refreshActivityRestoreIssues(): void {
    const issues: string[] = [];
    if (this.activityForm.subjectId && this.activityOptions && !this.activitySelectedSubject) {
      issues.push('The saved subject is no longer active or available. Select another subject.');
    }
    const usesSpecificGroups = this.activityForm.groupScope === 'SELECTED';
    if (usesSpecificGroups && this.activityUnavailableGroups.length) {
      issues.push('These saved academic groups are no longer active: '
        + this.activityUnavailableGroups.map(group => group.name).join(', ')
        + '. Remove them or choose different groups.');
    }
    if (usesSpecificGroups && this.activityUnavailableSections.length) {
      issues.push('These saved sections are no longer active: '
        + this.activityUnavailableSections.map(section => section.name).join(', ')
        + '. Choose different sections or switch that group to All Sections.');
    }
    this.activityRestoreIssues = issues;
  }

  selectActivitySubject(subjectId: number): void {
    this.activityForm.subjectId = subjectId;
    this.onActivitySubjectChange();
  }

  onActivitySubjectChange(): void {
    this.refreshActivityRestoreIssues();
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  onActivityPeriodChange(): void {
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  setActivityGroupScope(scope: ActivityGroupScope): void {
    this.activityForm.groupScope = scope;
    this.refreshActivityRestoreIssues();
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  clearActivityGroups(): void {
    this.activityForm.groupSelections = [];
    this.activityUnavailableGroups = [];
    this.activityUnavailableSections = [];
    this.refreshActivityRestoreIssues();
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  removeUnavailableActivityGroups(): void {
    const available = new Set(this.activityGroupOptions.map(group => group.academicGroupId));
    this.activityForm.groupSelections = this.activityForm.groupSelections
      .filter(selection => available.has(selection.academicGroupId));
    this.activityUnavailableGroups = [];
    this.activityUnavailableSections = [];
    this.refreshActivityRestoreIssues();
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  toggleActivityGroup(group: FixedActivityGroupOption): void {
    const index = this.activityForm.groupSelections
      .findIndex(selection => selection.academicGroupId === group.academicGroupId);
    if (index >= 0) {
      this.activityForm.groupSelections.splice(index, 1);
      this.activityUnavailableGroups = this.activityUnavailableGroups
        .filter(unavailable => unavailable.groupId !== group.academicGroupId);
      this.activityUnavailableSections = this.activityUnavailableSections
        .filter(unavailable => unavailable.groupId !== group.academicGroupId);
    } else {
      this.activityForm.groupSelections.push({
        academicGroupId: group.academicGroupId,
        sectionScope: 'ALL',
        sectionIds: []
      });
    }
    this.refreshActivityRestoreIssues();
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  onActivityAllSectionsChange(group: FixedActivityGroupOption, checked: boolean): void {
    const selection = this.activityGroupSelection(group.academicGroupId);
    if (!selection) return;
    selection.sectionScope = checked ? 'ALL' : 'SELECTED';
    selection.sectionIds = [];
    if (checked) {
      this.activityUnavailableSections = this.activityUnavailableSections
        .filter(unavailable => unavailable.groupId !== group.academicGroupId);
    }
    this.refreshActivityRestoreIssues();
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  isActivitySectionSelected(groupId: number, section: FixedActivitySectionOption): boolean {
    const selection = this.activityGroupSelection(groupId);
    if (!selection) return false;
    return selection.sectionScope === 'ALL' || selection.sectionIds.includes(section.sectionId);
  }

  toggleActivitySection(group: FixedActivityGroupOption, section: FixedActivitySectionOption): void {
    const selection = this.activityGroupSelection(group.academicGroupId);
    if (!selection) return;
    if (selection.sectionScope === 'ALL') {
      // Switching from All Sections to a specific set: keep every other section selected.
      selection.sectionScope = 'SELECTED';
      selection.sectionIds = group.sections
        .map(candidate => candidate.sectionId)
        .filter(sectionId => sectionId !== section.sectionId);
    } else {
      const index = selection.sectionIds.indexOf(section.sectionId);
      if (index >= 0) selection.sectionIds.splice(index, 1);
      else selection.sectionIds.push(section.sectionId);
      if (group.sections.length && selection.sectionIds.length === group.sections.length) {
        selection.sectionScope = 'ALL';
        selection.sectionIds = [];
      }
    }
    this.activityUnavailableSections = this.activityUnavailableSections.filter(
      unavailable => unavailable.groupId !== group.academicGroupId
        || unavailable.sectionId !== section.sectionId);
    this.refreshActivityRestoreIssues();
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  toggleActivityDay(day: DayOfWeek): void {
    const index = this.activityForm.days.indexOf(day);
    if (index >= 0) this.activityForm.days.splice(index, 1);
    else this.activityForm.days.push(day);
    this.resolveActivitySchedule();
    this.cdr.markForCheck();
  }

  private buildActivityGroups(): { academicGroupId: number; sectionId: number | null }[] {
    if (this.activityForm.groupScope === 'ALL') {
      return this.activityGroupOptions
        .map(group => ({ academicGroupId: group.academicGroupId, sectionId: null }));
    }
    const units: { academicGroupId: number; sectionId: number | null }[] = [];
    for (const selection of this.activityForm.groupSelections) {
      const group = this.activityGroupOptions
        .find(candidate => candidate.academicGroupId === selection.academicGroupId);
      if (!group) continue;
      if (!group.sections.length || selection.sectionScope === 'ALL') {
        units.push({ academicGroupId: group.academicGroupId, sectionId: null });
        continue;
      }
      for (const sectionId of selection.sectionIds) {
        units.push({ academicGroupId: group.academicGroupId, sectionId });
      }
    }
    return units;
  }

  resolveActivitySchedule(): void {
    if (!this.selectedYearId || !this.showActivityDialog) return;
    const groups = this.buildActivityGroups();
    if (!groups.length || !this.activityForm.days.length) {
      this.activityResolveToken++;
      this.activitySchedule = null;
      this.activityIssues = [];
      this.cdr.markForCheck();
      return;
    }
    const token = ++this.activityResolveToken;
    const form = this.activityForm;
    this.activityResolving = true;
    this.api.resolveFixedActivitySchedule(this.selectedYearId, {
      subjectId: form.subjectId,
      groups,
      days: [...form.days],
      periodName: form.periodName
    }).pipe(finalize(() => {
      if (token === this.activityResolveToken) this.activityResolving = false;
    })).subscribe({
      next: (schedule) => {
        if (token !== this.activityResolveToken) return;
        this.activitySchedule = schedule;
        this.activityIssues = schedule.issues.map(issue => issue.message);
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (token !== this.activityResolveToken) return;
        this.activitySchedule = null;
        this.activityIssues = [err?.error?.message
          || 'Unable to resolve the timetable period for the selected group, sections and days.'];
        this.cdr.markForCheck();
      }
    });
  }

  saveActivity(): void {
    if (!this.selectedYearId) return;
    const form = this.activityForm;
    const groups = this.buildActivityGroups();
    if (!form.subjectId) {
      this.messages.add({ severity: 'warn', summary: 'Select a subject' });
      return;
    }
    if (this.activityGroupSelectionMissing) {
      this.messages.add({ severity: 'warn', summary: 'Select at least one academic group' });
      return;
    }
    if (this.activityForm.groupScope === 'SELECTED' && this.activityUnavailableGroups.length) {
      this.messages.add({
        severity: 'warn',
        summary: 'Remove inactive academic groups',
        detail: 'One or more saved groups are no longer active. Remove them or choose different groups.'
      });
      return;
    }
    if (!groups.length) {
      this.messages.add({
        severity: 'warn',
        summary: 'Select at least one group or section',
        detail: 'Every selected group needs All Sections or at least one specific section.'
      });
      return;
    }
    if (!form.days.length) {
      this.messages.add({ severity: 'warn', summary: 'Select at least one applicable day' });
      return;
    }
    if (!form.periodName) {
      this.messages.add({ severity: 'warn', summary: 'Select a period available on every selected day' });
      return;
    }
    if (this.activitySectionSelectionInvalid) {
      this.messages.add({
        severity: 'warn',
        summary: 'Select at least one section for each group',
        detail: 'Groups set to Specific Sections need at least one section selected.'
      });
      return;
    }
    if (this.activityPeriodSelectionInvalid) {
      this.messages.add({
        severity: 'warn',
        summary: 'Choose a period available on every selected day and section'
      });
      return;
    }
    if (this.activityTeacherMissing) {
      this.messages.add({
        severity: 'warn',
        summary: this.activityTeacherNotShared
          ? 'No common teacher for the selected groups'
          : 'No teacher is allocated for this subject',
        detail: this.activityTeacherNotShared
          ? 'No single teacher is allocated to every selected group and section. Choose groups that share a '
            + 'teacher, or save separate fixed activities per group.'
          : 'Assign a teacher in Teacher Allocation for the selected groups or sections before saving.',
        life: 9000
      });
      return;
    }
    if (this.activityDisplayIssues.length) {
      this.messages.add({
        severity: 'warn',
        summary: 'Resolve the schedule issues before saving',
        detail: this.activityDisplayIssues[0],
        life: 8000
      });
      return;
    }
    const body: FixedActivityRequest = {
      subjectId: form.subjectId,
      description: form.description.trim() || null,
      days: [...form.days],
      groups,
      periodName: form.periodName
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
      error: (err) => {
        const detail = err?.error?.message;
        if (detail) this.activityIssues = [detail];
        this.messages.add({
          severity: 'error',
          summary: 'Could not save the fixed activity',
          detail,
          life: 10000
        });
        this.cdr.markForCheck();
      }
    });
  }

  toggleActivityActive(activity: FixedActivity): void {
    if (!activity.fixedActivityId) return;
    if (activity.active) {
      this.confirm.confirm({
        header: 'Deactivate fixed activity?',
        message: `"${activity.subjectName ?? activity.name}" will stop being reserved in future timetable `
          + 'generations. Published timetables are protected and existing entries keep their references.',
        acceptLabel: 'Deactivate',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => this.setActivityActive(activity, false)
      });
      return;
    }
    this.setActivityActive(activity, true);
  }

  private setActivityActive(activity: FixedActivity, active: boolean): void {
    if (!activity.fixedActivityId) return;
    this.api.setFixedActivityActive(activity.fixedActivityId, active).subscribe({
      next: (updated) => {
        const index = this.fixedActivities
          .findIndex(candidate => candidate.fixedActivityId === updated.fixedActivityId);
        if (index >= 0) {
          this.fixedActivities = [
            ...this.fixedActivities.slice(0, index),
            updated,
            ...this.fixedActivities.slice(index + 1)
          ];
        }
        this.messages.add({
          severity: 'success',
          summary: active ? 'Fixed activity activated' : 'Fixed activity deactivated'
        });
        this.cdr.markForCheck();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: active ? 'Could not activate the activity' : 'Could not deactivate the activity',
        detail: err?.error?.message,
        life: 9000
      })
    });
  }

  deleteActivity(activity: FixedActivity): void {
    if (!activity.fixedActivityId) return;
    const label = activity.subjectName ?? activity.name;
    this.confirm.confirm({
      header: 'Delete fixed activity?',
      message: `"${label}" will be removed from the configuration. Existing published timetables are not changed.`,
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
    const groupId = this.assignPickerGroupId;
    const sections = new Map<number, string>();
    for (const row of this.matrix?.rows ?? []) {
      if (row.academicGroupId === groupId && row.sectionId != null && row.sectionName
        && !sections.has(row.sectionId)) {
        sections.set(row.sectionId, row.sectionName);
      }
    }
    return [...sections.entries()].map(([value, label]) => ({ value, label }));
  }

  get pickerGroupId(): number | null {
    return this.assignPickerGroupId;
  }

  set pickerGroupId(value: number | null) {
    this.assignPickerGroupId = value;
  }

  onPickerGroupChange(value: number | null): void {
    this.pickerGroupId = value;
    this.pickerScope = 'ALL';
    this.pickerSelectedSectionIds = [];
    this.cdr.markForCheck();
  }

  get pickerScope(): PickerSectionScope {
    return this.assignPickerScope;
  }

  set pickerScope(value: PickerSectionScope) {
    this.assignPickerScope = value;
  }

  get pickerSelectedSectionIds(): number[] {
    return this.assignPickerSectionIds;
  }

  set pickerSelectedSectionIds(value: number[]) {
    this.assignPickerSectionIds = value;
  }

  isPickerSectionSelected(sectionId: number): boolean {
    return this.pickerSelectedSectionIds.includes(sectionId);
  }

  togglePickerSection(sectionId: number): void {
    this.pickerSelectedSectionIds = this.pickerSelectedSectionIds.includes(sectionId)
      ? this.pickerSelectedSectionIds.filter(id => id !== sectionId)
      : [...this.pickerSelectedSectionIds, sectionId];
    this.cdr.markForCheck();
  }

  private pickerUnitsForGroup(
    groupId: number,
    scope: PickerSectionScope,
    selectedSectionIds: number[]
  ): AssignUnit[] {
    const groupLabel = this.groupOptions.find(group => group.value === groupId)?.label;
    if (!groupLabel) return [];

    const sectionsById = new Map(this.sectionOptions.map(section => [section.value, section.label]));
    if (scope === 'SELECTED') {
      return selectedSectionIds.flatMap(sectionId => {
        const sectionName = sectionsById.get(sectionId);
        return sectionName
          ? [{ academicGroupId: groupId, sectionId, label: `${groupLabel} - ${sectionName}` }]
          : [];
      });
    }

    return [{
      academicGroupId: groupId,
      sectionId: null,
      label: sectionsById.size ? `${groupLabel} - All sections` : groupLabel
    }];
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
      subjectId: null,
      groupScope: 'ALL',
      groupSelections: [],
      description: '',
      active: true,
      days: [],
      periodName: null
    };
  }
}
