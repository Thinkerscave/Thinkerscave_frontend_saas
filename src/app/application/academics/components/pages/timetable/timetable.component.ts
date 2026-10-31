import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, exhaustMap, finalize, takeUntil, takeWhile, timer } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { TimetableApiService } from '../../../services/timetable-api.service';
import {
  ACADEMICS_TIMETABLE_RESOURCE,
  DAY_LABELS,
  DAY_ORDER,
  DAY_SHORT,
  DayOfWeek,
  GenerationProgress,
  GridView,
  PlacementSubjectOption,
  SetupItem,
  TimetableCell,
  TimetableConflict,
  TimetableEntryRequest,
  TimetableGrid,
  TimetablePeriod,
  TimetableVersion,
  TimetableWorkspace,
  WorkspaceIssue
} from '../../../models/timetable.model';

interface PeriodRow {
  key: string;
  name: string;
  startTime: string;
  endTime: string;
  kind: string;
  periodIds: number[];
  sessions: number;
}

interface GridSection {
  key: string;
  label: string;
  days: DayOfWeek[];
  rows: PeriodRow[];
}

interface EditForm {
  mode: 'place' | 'edit';
  entryId: number | null;
  sectionId: number | null;
  mappingId: number | null;
  dayOfWeek: DayOfWeek;
  periodId: number | null;
  locked: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  READY_FOR_REVIEW: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  SUPERSEDED: 'Superseded',
  ARCHIVED: 'Archived',
  GENERATED: 'Generated',
  GENERATED_WITH_CONFLICTS: 'Generated with issues',
  FAILED: 'Failed'
};

const SUBJECT_TONES = ['sky', 'violet', 'rose', 'emerald', 'amber', 'teal', 'indigo', 'orange'];

@Component({
  selector: 'app-timetable-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TcPageSkeletonComponent,
    TcAcademicYearSelectorComponent,
    SaasPageHeaderComponent,
    DialogModule,
    ProgressBarModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetablePageComponent implements OnInit {
  private readonly api = inject(TimetableApiService);
  private readonly yearCtx = inject(AcademicYearContextService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_TIMETABLE_RESOURCE;
  readonly dayOrder = DAY_ORDER;
  readonly dayLabels = DAY_LABELS;
  readonly dayShort = DAY_SHORT;

  loading = true;
  refreshing = false;
  saving = false;
  generating = false;
  activeGenerationId: number | null = null;
  generationProgress: GenerationProgress | null = null;
  private readonly cancelPoll$ = new Subject<void>();

  selectedYearId: number | null = null;
  workspace: TimetableWorkspace | null = null;
  state: 'NOT_GENERATED' | 'DRAFT' | 'PUBLISHED' = 'NOT_GENERATED';
  view: GridView = 'ACADEMIC_GROUP';
  selectedVersionId: number | null = null;
  version: TimetableVersion | null = null;

  grid: TimetableGrid | null = null;
  loadingGrid = false;
  private cellIndex = new Map<string, TimetableCell[]>();
  private gridRequestId = 0;
  private readonly collapsedIssues = new Set<string>();

  academicGroupOptions: { label: string; value: number }[] = [];
  sectionOptions: { label: string; value: number }[] = [];
  teacherOptions: { label: string; value: number }[] = [];
  selectedGroupId: number | null = null;
  selectedSectionId: number | null = null;
  selectedStaffId: number | null = null;
  weekStart = this.monday(new Date());

  conflicts: TimetableConflict[] = [];
  loadingConflicts = false;
  showIssueDetails = false;
  conflictLoadError: string | null = null;

  showEditDialog = false;
  editForm: EditForm = this.emptyEditForm();
  editSubjectFallback: PlacementSubjectOption | null = null;
  menuEntryId: number | null = null;
  manualDrafting = false;

  ngOnInit(): void {
    this.yearCtx.ensureLoaded().subscribe();
    const stored = this.yearCtx.selectedYearId();
    if (stored) this.onYearChange(stored);
  }

  onYearChange(yearId: number | null): void {
    // The academic-year selector re-emits the stored year after it initialises. Ignore that
    // duplicate so the workspace and grid are not requested twice on first load.
    if (yearId != null && yearId === this.selectedYearId
        && (this.workspace != null || this.loading)) {
      return;
    }
    this.gridRequestId += 1;
    this.selectedYearId = yearId;
    this.workspace = null;
    this.grid = null;
    this.loadingGrid = false;
    this.version = null;
    this.selectedVersionId = null;
    this.view = 'ACADEMIC_GROUP';
    this.selectedGroupId = null;
    this.selectedSectionId = null;
    this.selectedStaffId = null;
    this.conflicts = [];
    this.showIssueDetails = false;
    this.conflictLoadError = null;
    this.stopPolling();
    this.generating = false;
    this.generationProgress = null;
    if (!yearId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.loadWorkspace();
  }

  loadWorkspace(): void {
    if (!this.selectedYearId) return;
    const yearId = this.selectedYearId;
    this.loading = !this.workspace;
    this.refreshing = !!this.workspace;
    this.api.getWorkspace(yearId, this.iso(this.weekStart)).pipe(
      finalize(() => {
        this.loading = false;
        this.refreshing = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (ws) => {
        if (yearId !== this.selectedYearId) return;
        this.workspace = ws;
        this.state = ws.state;
        this.applyFilters();
        this.resumeGeneration(ws);
        if (ws.state === 'NOT_GENERATED') {
          this.selectedVersionId = null;
          this.version = null;
          this.grid = null;
          this.conflicts = [];
          this.cdr.markForCheck();
          return;
        }
        const target = ws.state === 'PUBLISHED' && ws.currentVersion
          ? ws.currentVersion
          : (ws.workingVersion ?? ws.latestVersion ?? ws.currentVersion);
        if (target) {
          this.selectedVersionId = target.timetableVersionId;
          this.version = target;
          this.loadGrid();
          this.loadConflicts();
        }
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Unable to load the timetable',
        detail: err?.error?.message || 'Please try again',
        life: 8000
      })
    });
  }

  private applyFilters(): void {
    const filters = this.workspace?.filters;
    this.academicGroupOptions = (filters?.academicGroups ?? [])
      .map(g => ({ label: g.name, value: g.academicGroupId }));
    this.teacherOptions = (filters?.teachers ?? [])
      .map(t => ({ label: t.name, value: t.id }));
    if (!this.academicGroupOptions.some(o => o.value === this.selectedGroupId)) {
      this.selectedGroupId = this.academicGroupOptions[0]?.value ?? null;
    }
    this.refreshSections();
    if (!this.teacherOptions.some(o => o.value === this.selectedStaffId)) {
      this.selectedStaffId = this.teacherOptions[0]?.value ?? null;
    }
  }

  private refreshSections(): void {
    const group = this.workspace?.filters?.academicGroups
      ?.find(g => g.academicGroupId === this.selectedGroupId);
    this.sectionOptions = (group?.sections ?? [])
      .map(s => ({ label: s.name, value: s.id }));
    if (!this.sectionOptions.some(o => o.value === this.selectedSectionId)) {
      this.selectedSectionId = this.sectionOptions[0]?.value ?? null;
    }
  }

  onGroupChange(): void {
    this.refreshSections();
    this.loadGrid();
  }

  onSectionChange(): void {
    this.loadGrid();
  }

  onTeacherChange(): void {
    this.loadGrid();
  }

  setView(view: GridView): void {
    if (this.view === view) return;
    this.view = view;
    this.loadGrid();
  }

  loadGrid(): void {
    const requestId = ++this.gridRequestId;
    const versionId = this.selectedVersionId;
    const view = this.view;
    this.grid = null;
    this.cellIndex.clear();
    if (!versionId || this.state === 'NOT_GENERATED') {
      this.loadingGrid = false;
      this.cdr.markForCheck();
      return;
    }
    const params: Record<string, any> = { weekStartDate: this.iso(this.weekStart) };
    if (view === 'ACADEMIC_GROUP') {
      if (!this.selectedGroupId) {
        this.loadingGrid = false;
        this.cdr.markForCheck();
        return;
      }
      params['academicGroupId'] = this.selectedGroupId;
      if (this.selectedSectionId) params['sectionId'] = this.selectedSectionId;
    } else {
      if (!this.selectedStaffId) {
        this.loadingGrid = false;
        this.cdr.markForCheck();
        return;
      }
      params['staffId'] = this.selectedStaffId;
    }
    this.loadingGrid = true;
    this.cdr.markForCheck();
    this.api.getView(versionId, view, params).pipe(
      finalize(() => {
        if (requestId !== this.gridRequestId) return;
        this.loadingGrid = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (grid) => {
        if (requestId !== this.gridRequestId) return;
        this.grid = grid;
        this.buildCellIndex();
      },
      error: (err) => {
        if (requestId !== this.gridRequestId) return;
        this.grid = null;
        this.messages.add({
          severity: 'error',
          summary: 'Unable to load the timetable view',
          detail: err?.error?.message
        });
      }
    });
  }

  private buildCellIndex(): void {
    this.cellIndex = new Map();
    for (const cell of this.grid?.cells ?? []) {
      const key = `${cell.dayOfWeek}|${cell.periodId}`;
      const list = this.cellIndex.get(key);
      if (list) list.push(cell);
      else this.cellIndex.set(key, [cell]);
    }
  }

  get periodRows(): PeriodRow[] {
    return this.buildRows(this.grid?.periods ?? []);
  }

  private buildRows(periods: TimetablePeriod[]): PeriodRow[] {
    const groups = new Map<string, PeriodRow>();
    for (const period of periods) {
      const key = `${period.startTime}|${period.endTime}`;
      const row = groups.get(key);
      if (row) {
        row.periodIds.push(period.timetablePeriodId!);
        row.sessions += 1;
        if (period.slotKind === 'BREAK') row.kind = 'BREAK';
      } else {
        groups.set(key, {
          key,
          name: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          kind: period.slotKind,
          periodIds: [period.timetablePeriodId!],
          sessions: 1
        });
      }
    }
    return [...groups.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  /** Period rows for one day only, so days with different patterns never share columns. */
  rowsForDay(day: DayOfWeek): PeriodRow[] {
    const periods = this.grid?.periodsByDay?.[day];
    return this.buildRows(periods && periods.length ? periods : this.grid?.periods ?? []);
  }

  /**
   * Days grouped by their schedule signature. A weekday pattern and a Saturday pattern render
   * as separate tables instead of one table with duplicated "Period 1..N" columns.
   */
  get gridSections(): GridSection[] {
    const groups = new Map<string, GridSection>();
    for (const day of this.gridDays) {
      const rows = this.rowsForDay(day);
      const signature = rows.map(r => `${r.startTime}-${r.endTime}-${r.kind}`).join('|');
      const existing = groups.get(signature);
      if (existing) {
        existing.days.push(day);
        continue;
      }
      groups.set(signature, {
        key: signature,
        label: this.patternLabelForDay(day),
        days: [day],
        rows
      });
    }
    return [...groups.values()];
  }

  private patternLabelForDay(day: DayOfWeek): string {
    const periods = this.grid?.periodsByDay?.[day] ?? [];
    const named = periods.find(p => !!p.schedulePatternName)?.schedulePatternName;
    if (named) return named;
    return this.distinctScheduleCount > 1 ? 'Schedule' : 'Weekly schedule';
  }

  private get distinctScheduleCount(): number {
    const signatures = new Set<string>();
    for (const day of this.gridDays) {
      signatures.add(this.rowsForDay(day)
        .map(r => `${r.startTime}-${r.endTime}-${r.kind}`).join('|'));
    }
    return signatures.size;
  }

  get gridDays(): DayOfWeek[] {
    return this.grid?.workingDays ?? [];
  }

  getCellDate(day: DayOfWeek): string | null {
    return this.grid?.weekDates?.find(d => d.dayOfWeek === day)?.date ?? null;
  }

  cellsFor(row: PeriodRow, day: DayOfWeek): TimetableCell[] {
    const result: TimetableCell[] = [];
    for (const id of row.periodIds) {
      const cells = this.cellIndex.get(`${day}|${id}`);
      if (cells) result.push(...cells);
    }
    return result;
  }

  isBreak(row: PeriodRow): boolean {
    return row.kind === 'BREAK';
  }

  toneFor(cell: TimetableCell): string {
    if (cell.entryType === 'ACTIVITY') return 'activity';
    const name = cell.subjectName ?? '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return SUBJECT_TONES[hash % SUBJECT_TONES.length];
  }

  isEmptySlot(row: PeriodRow, day: DayOfWeek): boolean {
    return !this.isBreak(row) && this.cellsFor(row, day).length === 0;
  }

  get canEdit(): boolean {
    return !!this.grid?.editable && this.permissions.canManage(this.resource)
      && !this.workspace?.yearReadOnly;
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(this.resource);
  }

  get primaryVersion(): TimetableVersion | null {
    return this.state === 'PUBLISHED'
      ? (this.workspace?.currentVersion ?? null)
      : (this.workspace?.workingVersion ?? this.workspace?.latestVersion ?? null);
  }

  get statusLabel(): string {
    if (!this.primaryVersion) return this.state === 'PUBLISHED' ? 'Published' : 'Draft';
    return STATUS_LABELS[this.primaryVersion.status] ?? this.primaryVersion.status;
  }

  get canPublish(): boolean {
    return !!this.primaryVersion
      && ['DRAFT', 'READY_FOR_REVIEW', 'APPROVED'].includes(this.primaryVersion.status)
      && this.canApprove;
  }

  get canSubmit(): boolean {
    return !!this.primaryVersion
      && ['DRAFT', 'READY_FOR_REVIEW'].includes(this.primaryVersion.status)
      && !!this.primaryVersion.totalEntries
      && !this.primaryVersion.openBlockingConflicts
      && this.canEdit;
  }

  get blockingIssues(): WorkspaceIssue[] {
    return this.workspace?.issues?.filter(i => i.severity === 'BLOCKING') ?? [];
  }

  get warningIssues(): WorkspaceIssue[] {
    return this.workspace?.issues?.filter(i => i.severity === 'WARNING') ?? [];
  }

  get visibleIssues(): WorkspaceIssue[] {
    return [...this.blockingIssues, ...this.warningIssues];
  }

  get setupItems(): SetupItem[] {
    return this.workspace?.setup ?? [];
  }

  get unscheduledCount(): number {
    return this.workspace?.unscheduledLessonCount ?? 0;
  }

  get issueCount(): number {
    return (this.workspace?.blockingIssueCount ?? 0) + (this.workspace?.warningIssueCount ?? 0);
  }

  get openConflictCount(): number {
    return this.conflicts.filter(c => c.blocking && c.status === 'OPEN').length;
  }

  get hasOpenBlockingConflicts(): boolean {
    return this.openConflictCount > 0;
  }

  get generateLabel(): string {
    return this.state === 'NOT_GENERATED' ? 'Generate Timetable' : 'Regenerate';
  }

  get generateDisabled(): boolean {
    if (this.generating || this.workspace?.yearReadOnly) return true;
    if (this.state === 'NOT_GENERATED') return !this.workspace?.canGenerate;
    return !this.workspace?.readiness?.ready;
  }

  openConfiguration(): void {
    this.router.navigate(['/app/academics/timetable/configure'], {
      queryParams: this.selectedYearId ? { academicYearId: this.selectedYearId } : undefined
    });
  }

  goTo(route?: string | null): void {
    if (!route) return;
    if (route.startsWith('/app/academics/timetable/configure')) {
      this.openConfiguration();
      return;
    }
    this.router.navigate([route], {
      queryParams: this.selectedYearId ? { academicYearId: this.selectedYearId } : undefined
    });
  }

  toggleIssue(issue: WorkspaceIssue): void {
    const key = issue.code + '|' + issue.message;
    if (this.collapsedIssues.has(key)) this.collapsedIssues.delete(key);
    else this.collapsedIssues.add(key);
    this.cdr.markForCheck();
  }

  isIssueCollapsed(issue: WorkspaceIssue): boolean {
    return this.collapsedIssues.has(issue.code + '|' + issue.message);
  }

  generate(): void {
    if (!this.selectedYearId || this.generateDisabled) return;
    const run = () => this.runGeneration();
    if (this.state === 'DRAFT') {
      this.confirm.confirm({
        header: 'Regenerate timetable?',
        message: 'This replaces the current draft with a new generated version. The published timetable, if any, is preserved until you publish again.',
        acceptLabel: 'Regenerate',
        accept: run
      });
    } else {
      run();
    }
  }

  private runGeneration(): void {
    if (!this.selectedYearId) return;
    this.generating = true;
    this.generationProgress = null;
    this.api.startGeneration(this.selectedYearId, {
      referenceDate: this.iso(this.weekStart),
      preserveLocked: true,
      replaceExistingDraft: true
    }).subscribe({
      next: (resp) => {
        this.activeGenerationId = resp.generationId;
        this.generationProgress = {
          generationId: resp.generationId,
          timetableVersionId: resp.timetableVersionId,
          versionNumber: resp.versionNumber,
          status: resp.status,
          progressPercent: 0,
          phaseLabel: 'Starting generation…'
        };
        this.cdr.markForCheck();
        this.startPolling(resp.generationId);
      },
      error: (err) => {
        this.generating = false;
        this.cdr.markForCheck();
        this.messages.add({
          severity: 'error',
          summary: 'Could not start generation',
          detail: err?.error?.message || 'Unable to start timetable generation',
          life: 10000
        });
      }
    });
  }

  private resumeGeneration(ws: TimetableWorkspace): void {
    if (this.generating) return;
    const latest = ws.latestVersion;
    if (!latest || latest.generationStatus !== 'GENERATING') return;
    this.generating = true;
    this.activeGenerationId = latest.timetableVersionId;
    this.generationProgress = {
      generationId: latest.timetableVersionId,
      timetableVersionId: latest.timetableVersionId,
      versionNumber: latest.versionNumber,
      status: 'GENERATING',
      progressPercent: 0,
      phaseLabel: 'Checking generation progress…'
    };
    this.startPolling(latest.timetableVersionId);
  }

  private startPolling(generationId: number): void {
    this.cancelPoll$.next();
    timer(0, 1500).pipe(
      takeUntil(this.cancelPoll$),
      exhaustMap(() => this.api.getGenerationProgress(generationId)),
      takeWhile((p) => p.status === 'GENERATING', true)
    ).subscribe({
      next: (progress) => {
        this.generationProgress = progress;
        this.cdr.markForCheck();
        if (progress.status !== 'GENERATING') this.onGenerationComplete(progress);
      },
      error: (err) => {
        this.generating = false;
        this.generationProgress = null;
        this.activeGenerationId = null;
        this.cdr.markForCheck();
        this.messages.add({
          severity: 'error',
          summary: 'Lost track of the generation',
          detail: err?.error?.message || 'Refresh the page to see the latest status'
        });
      }
    });
  }

  private stopPolling(): void {
    this.cancelPoll$.next();
  }

  openIssueDetails(): void {
    this.showIssueDetails = true;
    this.loadConflicts();
  }

  closeIssueDetails(): void {
    this.showIssueDetails = false;
    this.cdr.markForCheck();
  }

  private onGenerationComplete(progress: GenerationProgress): void {
    this.generating = false;
    this.activeGenerationId = null;
    const result = progress.result;
    const kind = result?.resultKind;
    const detail = result?.message || progress.message;
    if (kind === 'SUCCESS') {
      this.messages.add({ severity: 'success', summary: 'Timetable generated', detail, life: 8000 });
    } else if (kind === 'SUCCESS_WITH_WARNINGS' || kind === 'BLOCKED') {
      this.messages.add({
        severity: 'warn',
        summary: kind === 'BLOCKED' ? 'Generated with unresolved issues' : 'Generated with warnings',
        detail,
        life: 10000
      });
    } else {
      this.messages.add({ severity: 'error', summary: 'Generation failed', detail, life: 10000 });
    }
    this.generationProgress = null;
    this.loadWorkspace();
  }

  cancelGeneration(): void {
    if (!this.activeGenerationId) return;
    this.api.cancelGeneration(this.activeGenerationId).subscribe({
      next: () => this.messages.add({ severity: 'info', summary: 'Cancelling generation…' }),
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Cancel failed',
        detail: err?.error?.message
      })
    });
  }

  validate(): void {
    if (!this.selectedVersionId) return;
    this.saving = true;
    this.api.validateVersion(this.selectedVersionId).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: (conflicts) => {
        const blocking = conflicts.filter(c => c.blocking && c.status === 'OPEN').length;
        this.messages.add({
          severity: blocking ? 'warn' : 'success',
          summary: blocking ? `${blocking} issue(s) found` : 'Timetable validated',
          detail: blocking ? 'Review the validation issues below.' : 'No hard-constraint conflicts were found.',
          life: 8000
        });
        this.conflicts = conflicts;
        this.loadWorkspace();
      },
      error: (err) => this.messages.add({
        severity: 'error', summary: 'Validation failed', detail: err?.error?.message
      })
    });
  }

  showUnscheduledNotice(): void {
    this.messages.add({
      severity: this.unscheduledCount ? 'warn' : 'info',
      summary: this.unscheduledCount ? 'Unscheduled lessons' : 'No unscheduled lessons',
      detail: this.unscheduledCount
        ? `${this.unscheduledCount} required lesson(s) could not be placed. Review Issues and regenerate after fixing the setup.`
        : 'Every required lesson is placed in the current draft.',
      life: 6000
    });
    this.loadConflicts();
  }

  submit(): void {
    if (!this.selectedVersionId) return;
    this.runLifecycle(this.api.submitVersion(this.selectedVersionId),
      'Submitted for approval', 'Submit failed');
  }

  approve(): void {
    if (!this.selectedVersionId) return;
    this.runLifecycle(this.api.approveVersion(this.selectedVersionId),
      'Timetable approved', 'Approval failed');
  }

  reject(): void {
    if (!this.selectedVersionId) return;
    this.runLifecycle(this.api.rejectVersion(this.selectedVersionId),
      'Sent back for review', 'Rejection failed');
  }

  publish(): void {
    if (!this.selectedVersionId || !this.primaryVersion) return;
    this.confirm.confirm({
      header: 'Publish timetable?',
      message: 'Teachers and students will see this timetable. Any previously published version is preserved as superseded.',
      acceptLabel: 'Publish',
      accept: () => this.runLifecycle(this.api.publishVersion(this.selectedVersionId!),
        'Timetable published', 'Publish failed')
    });
  }

  private runLifecycle(call: ReturnType<TimetableApiService['submitVersion']>,
                       success: string, failure: string): void {
    this.saving = true;
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); })).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: success });
        this.loadWorkspace();
      },
      error: (err) => this.messages.add({
        severity: 'error', summary: failure, detail: err?.error?.message, life: 10000
      })
    });
  }

  loadConflicts(): void {
    const versionId = this.primaryVersion?.timetableVersionId ?? null;
    if (!versionId) {
      this.conflicts = [];
      this.conflictLoadError = null;
      return;
    }
    this.conflictLoadError = null;
    this.loadingConflicts = true;
    this.api.getConflicts(versionId).pipe(
      finalize(() => { this.loadingConflicts = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: (list) => {
        this.conflicts = list;
        this.conflictLoadError = null;
      },
      error: (err) => {
        this.conflicts = [];
        this.conflictLoadError = err?.error?.message || 'Unable to load timetable issues. Please try again.';
        this.messages.add({
          severity: 'error',
          summary: 'Could not load timetable issues',
          detail: this.conflictLoadError ?? 'Unable to load timetable issues. Please try again.'
        });
      }
    });
  }

  // ─── Week navigation ──────────────────────────────────────────────────

  moveWeek(delta: number): void {
    const next = new Date(this.weekStart);
    next.setDate(next.getDate() + delta * 7);
    this.weekStart = next;
    this.loadGrid();
  }

  goToday(): void {
    this.weekStart = this.monday(new Date());
    this.loadGrid();
  }

  get weekLabel(): string {
    const start = new Date(this.weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`;
  }

  // ─── Manual editing ──────────────────────────────────────────────────

  get canManualEntry(): boolean {
    if (!this.workspace || this.workspace.yearReadOnly) return false;
    const schedule = this.workspace.setup?.find(item => item.key === 'schedule');
    return schedule ? schedule.status === 'COMPLETE' : true;
  }

  get canDiscardDraft(): boolean {
    const version = this.primaryVersion;
    return !!version && !this.workspace?.yearReadOnly
      && this.permissions.canManage(this.resource)
      && ['DRAFT', 'READY_FOR_REVIEW'].includes(version.status);
  }

  get subjectOptions(): PlacementSubjectOption[] {
    return this.grid?.subjectOptions ?? [];
  }

  get editSubjectChoices(): PlacementSubjectOption[] {
    const options = [...this.subjectOptions];
    const fallback = this.editSubjectFallback;
    if (fallback && !options.some(option => option.mappingId === fallback.mappingId)) {
      options.unshift(fallback);
    }
    return options;
  }

  get selectedSubject(): PlacementSubjectOption | null {
    const selected = this.editSubjectChoices.find(
      option => option.mappingId === this.editForm.mappingId);
    return selected ?? null;
  }

  get editSlotLabel(): string {
    const periodId = this.editForm.periodId;
    if (!periodId) return '—';
    const period = (this.grid?.periods ?? [])
      .find(p => p.timetablePeriodId === periodId);
    if (!period) return '—';
    return `${this.timeLabel(period.startTime)} – ${this.timeLabel(period.endTime)} (${period.name})`;
  }

  get editClassLabel(): string {
    const group = this.grid?.academicGroupName
      ?? this.academicGroupOptions.find(o => o.value === this.selectedGroupId)?.label;
    const section = this.grid?.sectionName;
    return [group, section].filter(Boolean).join(' • ') || 'Selected class';
  }

  get canSaveEntry(): boolean {
    return !!this.editForm.mappingId && !!this.editForm.periodId && !this.saving
      && (this.selectedSubject?.available ?? false);
  }

  openPlace(day: DayOfWeek, row: PeriodRow): void {
    if (!this.canEdit || this.view !== 'ACADEMIC_GROUP'
        || this.isBreak(row) || row.periodIds.length !== 1) return;
    this.editSubjectFallback = null;
    this.editForm = {
      mode: 'place', entryId: null, sectionId: this.selectedSectionId,
      mappingId: null, dayOfWeek: day, periodId: row.periodIds[0], locked: false
    };
    this.showEditDialog = true;
    this.cdr.markForCheck();
  }

  openEdit(cell: TimetableCell): void {
    if (!this.canEdit) return;
    if (cell.entryType === 'ACTIVITY') {
      this.messages.add({
        severity: 'info',
        summary: 'Fixed activity',
        detail: 'Fixed activities are managed from Timetable Configuration → Fixed Activities.',
        life: 5000
      });
      return;
    }
    const mappingId = cell.academicGroupSubjectMappingId ?? null;
    this.editSubjectFallback = mappingId == null ? null : {
      mappingId,
      subjectId: cell.subjectId ?? null,
      subjectName: cell.subjectName ?? 'Current subject',
      staffId: cell.staffId ?? null,
      teacherName: cell.staffName ?? null,
      teacherAllocationId: cell.teacherAllocationId ?? null,
      choiceGroupName: cell.choiceGroupName ?? null,
      available: true,
      unavailableReason: null
    };
    this.editForm = {
      mode: 'edit',
      entryId: cell.entryId ?? null,
      sectionId: cell.sectionId ?? this.selectedSectionId,
      mappingId,
      dayOfWeek: cell.dayOfWeek,
      periodId: cell.periodId,
      locked: !!cell.locked
    };
    this.showEditDialog = true;
    this.cdr.markForCheck();
  }

  get editSlots(): PeriodRow[] {
    return this.rowsForDay(this.editForm.dayOfWeek)
      .filter(r => !this.isBreak(r) && r.periodIds.length === 1);
  }

  get editDayOptions(): DayOfWeek[] {
    const days = this.grid?.workingDays ?? [];
    return days.length ? days : this.dayOrder;
  }

  onEditDayChange(): void {
    const slots = this.editSlots;
    const current = this.editForm.periodId;
    if (!slots.some(row => current != null && row.periodIds.includes(current))) {
      this.editForm.periodId = slots[0]?.periodIds[0] ?? null;
    }
    this.cdr.markForCheck();
  }

  saveEntry(): void {
    if (!this.selectedVersionId || !this.canEdit || !this.canSaveEntry) return;
    const form = this.editForm;
    const body: TimetableEntryRequest = {
      academicGroupId: this.grid?.academicGroupId ?? this.selectedGroupId,
      sectionId: form.sectionId,
      academicGroupSubjectMappingId: form.mappingId,
      dayOfWeek: form.dayOfWeek,
      periodId: form.periodId
    };
    let call;
    if (form.mode === 'place') {
      call = this.api.addEntry(this.selectedVersionId, body);
    } else if (form.entryId) {
      call = this.api.updateEntry(form.entryId, { ...body, locked: form.locked });
    } else {
      return;
    }
    this.saving = true;
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); })).subscribe({
      next: () => {
        this.showEditDialog = false;
        this.messages.add({
          severity: 'success',
          summary: form.mode === 'place' ? 'Lesson added' : 'Lesson updated'
        });
        this.loadWorkspace();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Could not save this change',
        detail: err?.error?.message || 'The change conflicts with the current timetable.',
        life: 10000
      })
    });
  }

  deleteEntry(): void {
    if (!this.editForm.entryId) return;
    this.confirmDeleteEntry(this.editForm.entryId, true);
  }

  private confirmDeleteEntry(entryId: number, closeDialog = false): void {
    this.confirm.confirm({
      header: 'Remove this lesson?',
      message: 'The lesson is removed from the draft. You can place it again later.',
      acceptLabel: 'Remove',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.saving = true;
        this.api.deleteEntry(entryId).pipe(
          finalize(() => { this.saving = false; this.cdr.markForCheck(); })
        ).subscribe({
          next: () => {
            if (closeDialog) this.showEditDialog = false;
            this.messages.add({ severity: 'success', summary: 'Lesson removed' });
            this.loadWorkspace();
          },
          error: (err) => this.messages.add({
            severity: 'error', summary: 'Could not remove the lesson', detail: err?.error?.message
          })
        });
      }
    });
  }

  @HostListener('document:click')
  closeLessonMenu(): void {
    if (this.menuEntryId == null) return;
    this.menuEntryId = null;
    this.cdr.markForCheck();
  }

  toggleLessonMenu(event: MouseEvent, cell: TimetableCell): void {
    event.stopPropagation();
    if (cell.entryType === 'ACTIVITY') {
      this.openEdit(cell);
      return;
    }
    this.menuEntryId = this.menuEntryId === cell.entryId ? null : (cell.entryId ?? null);
    this.cdr.markForCheck();
  }

  editFromMenu(event: MouseEvent, cell: TimetableCell): void {
    event.stopPropagation();
    this.menuEntryId = null;
    this.openEdit(cell);
  }

  deleteFromMenu(event: MouseEvent, cell: TimetableCell): void {
    event.stopPropagation();
    this.menuEntryId = null;
    if (cell.entryId) this.confirmDeleteEntry(cell.entryId);
  }

  createManualDraft(): void {
    if (!this.selectedYearId || this.manualDrafting) return;
    this.manualDrafting = true;
    this.api.createManualDraft(this.selectedYearId).pipe(
      finalize(() => { this.manualDrafting = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: (version) => {
        this.messages.add({
          severity: 'success',
          summary: 'Manual entry ready',
          detail: `Version ${version.versionNumber} created. Click an empty slot to add a lesson.`,
          life: 7000
        });
        this.loadWorkspace();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Could not start manual entry',
        detail: err?.error?.message,
        life: 10000
      })
    });
  }

  discardDraft(): void {
    const version = this.primaryVersion;
    if (!version) return;
    this.confirm.confirm({
      header: 'Delete this draft?',
      message: `Version ${version.versionNumber} and all of its lessons will be permanently removed.`,
      acceptLabel: 'Delete draft',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.saving = true;
        this.api.discardVersion(version.timetableVersionId).pipe(
          finalize(() => { this.saving = false; this.cdr.markForCheck(); })
        ).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Draft deleted' });
            this.workspace = null;
            this.grid = null;
            this.version = null;
            this.selectedVersionId = null;
            this.conflicts = [];
            this.loadWorkspace();
          },
          error: (err) => this.messages.add({
            severity: 'error',
            summary: 'Could not delete the draft',
            detail: err?.error?.message,
            life: 10000
          })
        });
      }
    });
  }

  toggleLock(): void {
    if (!this.editForm.entryId) return;
    this.saving = true;
    this.api.lockEntry(this.editForm.entryId, !this.editForm.locked).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: () => {
        this.editForm.locked = !this.editForm.locked;
        this.messages.add({ severity: 'success', summary: this.editForm.locked ? 'Lesson locked' : 'Lesson unlocked' });
        this.loadWorkspace();
      },
      error: (err) => this.messages.add({
        severity: 'error', summary: 'Could not update the lock', detail: err?.error?.message
      })
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  dayDateLabel(day: DayOfWeek): string {
    const date = this.getCellDate(day);
    return date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
  }

  statusTone(): string {
    const status = this.primaryVersion?.status;
    if (this.primaryVersion?.openBlockingConflicts) return 'danger';
    if (status === 'PUBLISHED') return 'success';
    if (status === 'PENDING_APPROVAL') return 'warning';
    if (status === 'APPROVED') return 'info';
    return 'neutral';
  }

  timeLabel(value?: string | null): string {
    if (!value) return '';
    return value.substring(0, 5);
  }

  conflictLabel(conflict: TimetableConflict): string {
    return (conflict.conflictType || 'Issue')
      .toLowerCase()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  durationLabel(row: PeriodRow): string {
    const start = this.toMinutes(row.startTime);
    const end = this.toMinutes(row.endTime);
    return `${Math.max(0, end - start)} mins`;
  }

  private toMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private monday(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  private iso(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private emptyEditForm(): EditForm {
    return {
      mode: 'place', entryId: null, sectionId: null, mappingId: null,
      dayOfWeek: 'MONDAY', periodId: null, locked: false
    };
  }
}
