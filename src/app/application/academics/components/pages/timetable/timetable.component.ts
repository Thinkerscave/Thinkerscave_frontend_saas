import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, exhaustMap, finalize, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { TimetableApiService } from '../../../services/timetable-api.service';
import {
  ACADEMICS_TIMETABLE_RESOURCE,
  AcademicResource,
  DayOfWeek,
  GenerationProgress,
  GridView,
  ReadinessCheckItem,
  ResourceType,
  TimetableConflict,
  TimetableConfiguration,
  TimetableDashboard,
  TimetableFilterClass,
  TimetableFilters,
  TimetableGrid,
  TimetableGridCell,
  TimetableReadiness,
  TimetableVersion
} from '../../../models/timetable.model';

type TimetableTab = 'overview' | 'timetable' | 'conflicts' | 'configuration';

interface Option<T> { label: string; value: T; }

const ALL_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DETAIL_PREVIEW = 5;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  READY_FOR_REVIEW: 'Ready for review',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  SUPERSEDED: 'Superseded',
  ARCHIVED: 'Archived',
  GENERATING: 'Generating',
  GENERATED: 'Generated',
  GENERATED_WITH_CONFLICTS: 'Generated with issues',
  FAILED: 'Failed',
  NOT_GENERATED: 'Not generated'
};

const CONFLICT_LABELS: Record<string, string> = {
  TEACHER_CONFLICT: 'Teacher clash',
  SECTION_CONFLICT: 'Section clash',
  CLASS_CONFLICT: 'Class clash',
  ROOM_CONFLICT: 'Room clash',
  RESOURCE_CONFLICT: 'Room clash',
  PERIOD_CAPACITY_CONFLICT: 'Periods not placed',
  WORKLOAD_CONFLICT: 'Teacher workload',
  SUBJECT_ALLOCATION_CONFLICT: 'No teacher assigned',
  TEACHER_AVAILABILITY_CONFLICT: 'Teacher availability',
  ROOM_CAPACITY_CONFLICT: 'Room capacity',
  SUBJECT_PREFERENCE_CONFLICT: 'Time-of-day preference'
};

@Component({
  selector: 'app-timetable-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TcPageSkeletonComponent,
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    DialogModule,
    DropdownModule,
    ProgressBarModule,
    ConfirmDialogModule,
    HasPermissionDirective
  ],
  providers: [ConfirmationService],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetablePageComponent implements OnInit, OnDestroy {
  private readonly api = inject(TimetableApiService);
  private readonly yearCtx = inject(AcademicYearContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_TIMETABLE_RESOURCE;

  loading = true;
  refreshing = false;
  saving = false;
  generating = false;
  savingConfig = false;
  savingResource = false;
  loadingGrid = false;
  loadingConfig = false;

  selectedYearId: number | null = null;
  dashboard: TimetableDashboard | null = null;
  readiness: TimetableReadiness | null = null;
  activeTab: TimetableTab = 'overview';
  showPassedChecks = false;
  private readonly expandedChecks = new Set<string>();

  generationProgress: GenerationProgress | null = null;
  activeGenerationId: string | null = null;
  private readonly cancelPoll$ = new Subject<void>();

  config: TimetableConfiguration = this.emptyConfig();
  configLoaded = false;
  configIsTemplate = false;
  resources: AcademicResource[] = [];

  versions: TimetableVersion[] = [];
  selectedVersionId: number | null = null;
  versionOptions: Option<number>[] = [];
  gridView: GridView = 'CLASS';
  grid: TimetableGrid | null = null;
  private cellIndex = new Map<string, TimetableGridCell[]>();
  conflicts: TimetableConflict[] = [];
  conflictsVersionId: number | null = null;
  loadingConflicts = false;

  classOptions: Option<number>[] = [];
  sectionOptions: Option<number>[] = [];
  staffOptions: Option<number>[] = [];
  resourceOptions: Option<number>[] = [];
  gridClassId: number | null = null;
  gridSectionId: number | null = null;
  gridStaffId: number | null = null;
  gridResourceId: number | null = null;

  showResourceDialog = false;
  resourceForm: { name: string; code: string; resourceType: ResourceType; capacity: number } = {
    name: '', code: '', resourceType: 'CLASSROOM', capacity: 40
  };

  private filterClasses: TimetableFilterClass[] = [];
  private supportingDataYearId: number | null = null;

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(this.resource);
  }

  get blockingChecks(): ReadinessCheckItem[] {
    return this.readiness?.checks.filter(c => c.status === 'FAILED') ?? [];
  }

  get warningChecks(): ReadinessCheckItem[] {
    return this.readiness?.checks.filter(c => c.status === 'WARNING') ?? [];
  }

  get passedChecks(): ReadinessCheckItem[] {
    return this.readiness?.checks.filter(c => c.status === 'PASSED') ?? [];
  }

  /** Why the Generate button is disabled, or null when generation can start. */
  get generateBlockedReason(): string | null {
    if (this.readOnly) return 'This academic year is read-only.';
    if (!this.permissions.canManage(this.resource)) return 'You do not have permission to generate timetables.';
    if (this.generating) return 'A generation is already running.';
    if (!this.readiness) return 'Checking the academic setup…';
    const blocking = this.blockingChecks.length;
    if (blocking) return `Fix the ${blocking} issue${blocking > 1 ? 's' : ''} marked in red first.`;
    return null;
  }

  get teachingPeriodCount(): number {
    return this.config.periods.filter(p => p.slotKind === 'TEACHING').length;
  }

  get workingDayCount(): number {
    return this.config.workingDays.filter(d => d.working).length;
  }

  get blockingConflicts(): TimetableConflict[] {
    return this.conflicts.filter(c => c.blocking);
  }

  get warningConflicts(): TimetableConflict[] {
    return this.conflicts.filter(c => !c.blocking);
  }

  get openConflictCount(): number {
    return this.dashboard?.latestVersion?.totalConflicts ?? 0;
  }

  get selectedVersion(): TimetableVersion | undefined {
    return this.versions.find(v => v.timetableVersionId === this.selectedVersionId);
  }

  ngOnInit(): void {
    const qpYear = this.route.snapshot.queryParamMap.get('academicYearId');
    if (qpYear) {
      const id = Number(qpYear);
      if (Number.isFinite(id)) {
        this.yearCtx.selectYear(id);
      }
    }
  }

  ngOnDestroy(): void {
    this.cancelPoll$.next();
    this.cancelPoll$.complete();
  }

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    this.dashboard = null;
    this.readiness = null;
    this.config = this.emptyConfig();
    this.configLoaded = false;
    this.configIsTemplate = false;
    this.versions = [];
    this.versionOptions = [];
    this.selectedVersionId = null;
    this.setGrid(null);
    this.conflicts = [];
    this.conflictsVersionId = null;
    this.gridClassId = this.gridSectionId = this.gridStaffId = null;
    this.expandedChecks.clear();
    this.stopPolling();
    this.generating = false;
    this.generationProgress = null;
    if (yearId == null) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    const yearId = this.selectedYearId;
    if (!this.dashboard) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }
    this.api.getDashboard(yearId)
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (dash) => {
          if (yearId !== this.selectedYearId) return;
          this.dashboard = dash;
          this.readiness = dash.readiness ?? null;
          this.applyFilters(dash.filters);
          if (this.supportingDataYearId !== yearId) {
            this.supportingDataYearId = yearId;
            this.loadResources();
          }
          this.resumeRunningGeneration(dash);
          if (this.activeTab === 'timetable') this.loadVersions();
          if (this.activeTab === 'conflicts') this.loadConflicts();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load the timetable',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  switchTab(tab: TimetableTab): void {
    this.activeTab = tab;
    if (tab === 'configuration' && !this.configLoaded) this.loadConfiguration();
    if (tab === 'timetable') this.loadVersions();
    if (tab === 'conflicts') this.loadConflicts();
    this.cdr.markForCheck();
  }

  /* ═══ OVERVIEW ═══ */

  checkTitle(check: ReadinessCheckItem): string {
    return check.title || check.code;
  }

  visibleDetails(check: ReadinessCheckItem): string[] {
    const details = check.details ?? [];
    return this.expandedChecks.has(check.code) ? details : details.slice(0, DETAIL_PREVIEW);
  }

  hiddenDetailCount(check: ReadinessCheckItem): number {
    const total = check.details?.length ?? 0;
    return this.expandedChecks.has(check.code) ? 0 : Math.max(0, total - DETAIL_PREVIEW);
  }

  isExpanded(check: ReadinessCheckItem): boolean {
    return this.expandedChecks.has(check.code);
  }

  toggleDetails(check: ReadinessCheckItem): void {
    if (this.expandedChecks.has(check.code)) {
      this.expandedChecks.delete(check.code);
    } else {
      this.expandedChecks.add(check.code);
    }
    this.cdr.markForCheck();
  }

  runCheckAction(check: ReadinessCheckItem): void {
    const target = check.actionRoute;
    if (!target) return;
    if (target.startsWith('tab:')) {
      this.switchTab(target.substring(4) as TimetableTab);
      return;
    }
    this.navigateWithYear(target);
  }

  goToTeacherAllocation(): void {
    this.navigateWithYear('/app/academics/teacher-allocation');
  }

  private navigateWithYear(path: string): void {
    this.router.navigate([path], {
      queryParams: this.selectedYearId ? { academicYearId: this.selectedYearId } : undefined
    });
  }

  /* ═══ GENERATION ═══ */

  generateTimetable(): void {
    if (!this.selectedYearId || this.generateBlockedReason) return;
    this.generating = true;
    this.generationProgress = null;
    this.api.startGeneration(this.selectedYearId).subscribe({
      next: (resp) => {
        this.activeGenerationId = String(resp.generationId);
        this.generationProgress = {
          generationId: String(resp.generationId),
          timetableVersionId: resp.timetableVersionId,
          versionNumber: resp.versionNumber,
          status: resp.status,
          progressPercent: 0,
          phaseLabel: 'Starting generation…'
        };
        this.cdr.markForCheck();
        this.startPolling(String(resp.generationId));
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
        this.reload();
      }
    });
  }

  cancelGeneration(): void {
    if (!this.activeGenerationId) return;
    this.api.cancelGeneration(this.activeGenerationId).subscribe({
      next: () => this.messages.add({ severity: 'info', summary: 'Cancelling generation…' }),
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Cancel failed',
        detail: err?.error?.message || 'Unable to cancel generation'
      })
    });
  }

  private resumeRunningGeneration(dash: TimetableDashboard): void {
    const latest = dash.latestVersion;
    if (this.generating || !latest || latest.generationStatus !== 'GENERATING') return;
    this.generating = true;
    this.activeGenerationId = String(latest.timetableVersionId);
    this.generationProgress = {
      generationId: this.activeGenerationId,
      timetableVersionId: latest.timetableVersionId,
      versionNumber: latest.versionNumber,
      status: 'GENERATING',
      progressPercent: 0,
      phaseLabel: 'Checking generation progress…'
    };
    this.startPolling(this.activeGenerationId);
  }

  private startPolling(generationId: string): void {
    this.cancelPoll$.next();
    timer(0, 1500).pipe(
      takeUntil(this.cancelPoll$),
      takeUntilDestroyed(this.destroyRef),
      // A progress call can outlast the poll interval; it must finish rather than be cancelled by the next tick.
      exhaustMap(() => this.api.getGenerationProgress(generationId)),
      tap((progress) => {
        this.generationProgress = progress;
        this.cdr.markForCheck();
      }),
      takeWhile((p) => p.status === 'GENERATING', true)
    ).subscribe({
      next: (progress) => {
        if (progress.status !== 'GENERATING') {
          this.onGenerationComplete(progress);
        }
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

  private onGenerationComplete(progress: GenerationProgress): void {
    this.generating = false;
    this.activeGenerationId = null;
    this.generationProgress = null;
    const result = progress.result;
    const kind = result?.resultKind;
    const detail = result?.message || progress.message;

    if (kind === 'SUCCESS' || kind === 'SUCCESS_WITH_WARNINGS') {
      this.messages.add({
        severity: 'success',
        summary: `Timetable version ${progress.versionNumber} generated`,
        detail,
        life: 8000
      });
      this.selectedVersionId = progress.timetableVersionId;
      this.activeTab = 'timetable';
    } else if (kind === 'BLOCKED') {
      this.messages.add({ severity: 'warn', summary: 'Generated with unresolved issues', detail, life: 10000 });
      this.selectedVersionId = progress.timetableVersionId;
      this.activeTab = 'conflicts';
    } else {
      this.messages.add({ severity: 'error', summary: 'Generation failed', detail, life: 10000 });
    }
    this.reload();
    this.cdr.markForCheck();
  }

  /* ═══ LIFECYCLE ═══ */

  submitVersion(versionId: number): void {
    this.runLifecycle(this.api.submitVersion(versionId), 'Submitted for approval', 'Submit failed');
  }

  approveVersion(versionId: number): void {
    this.runLifecycle(this.api.approveVersion(versionId), 'Timetable approved', 'Approval failed');
  }

  rejectVersion(versionId: number): void {
    this.runLifecycle(this.api.rejectVersion(versionId), 'Sent back for review', 'Rejection failed');
  }

  publishVersion(versionId: number): void {
    this.confirm.confirm({
      header: 'Publish timetable?',
      message: 'Teachers and students will see this timetable. Any previously published version is replaced, '
        + 'and the school day setup (periods and working days) becomes locked for this year.',
      acceptLabel: 'Publish',
      accept: () => this.runLifecycle(this.api.publishVersion(versionId), 'Timetable published', 'Publish failed')
    });
  }

  private runLifecycle(call: ReturnType<TimetableApiService['submitVersion']>, success: string, failure: string): void {
    this.saving = true;
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: success });
          this.configLoaded = false;
          this.reload();
        },
        error: (err) => this.messages.add({ severity: 'error', summary: failure, detail: err?.error?.message, life: 10000 })
      });
  }

  /* ═══ CONFIGURATION ═══ */

  loadConfiguration(): void {
    if (!this.selectedYearId) return;
    const yearId = this.selectedYearId;
    this.loadingConfig = true;
    this.api.getConfiguration(yearId).subscribe({
      next: (cfg) => {
        if (cfg) {
          this.applyConfig(cfg, false);
        } else {
          this.loadTemplate();
        }
      },
      error: () => this.loadTemplate()
    });
  }

  private loadTemplate(): void {
    if (!this.selectedYearId) return;
    this.api.getConfigurationTemplate(this.selectedYearId)
      .pipe(finalize(() => { this.loadingConfig = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (tpl) => this.applyConfig(tpl, true),
        error: () => this.messages.add({ severity: 'error', summary: 'Unable to load the school day setup' })
      });
  }

  private applyConfig(cfg: TimetableConfiguration, isTemplate: boolean): void {
    const byDay = new Map((cfg.workingDays ?? []).map(d => [d.dayOfWeek, d]));
    this.config = {
      ...cfg,
      schoolStartTime: this.hhmm(cfg.schoolStartTime),
      schoolEndTime: this.hhmm(cfg.schoolEndTime),
      workingDays: ALL_DAYS.map(day => ({ dayOfWeek: day, working: !!byDay.get(day)?.working })),
      periods: [...(cfg.periods ?? [])]
        .sort((a, b) => a.periodNumber - b.periodNumber)
        .map(p => ({ ...p, startTime: this.hhmm(p.startTime), endTime: this.hhmm(p.endTime) }))
    };
    this.configIsTemplate = isTemplate;
    this.configLoaded = true;
    this.loadingConfig = false;
    this.cdr.markForCheck();
  }

  saveConfiguration(): void {
    if (!this.selectedYearId || !this.canManage) return;
    const problem = this.validateConfig();
    if (problem) {
      this.messages.add({ severity: 'warn', summary: 'Check the school day setup', detail: problem, life: 8000 });
      return;
    }
    this.savingConfig = true;
    this.api.saveConfiguration(this.selectedYearId, {
      name: this.config.name.trim(),
      shiftType: this.config.shiftType,
      schoolStartTime: this.config.schoolStartTime,
      schoolEndTime: this.config.schoolEndTime,
      defaultPeriodDurationMin: this.config.defaultPeriodDurationMin,
      maxTeacherWeeklyPeriods: this.config.maxTeacherWeeklyPeriods,
      workingDays: this.config.workingDays.map(d => ({ dayOfWeek: d.dayOfWeek, working: d.working })),
      periods: this.config.periods.map(p => ({
        periodNumber: p.periodNumber,
        name: p.name.trim(),
        startTime: p.startTime,
        endTime: p.endTime,
        slotKind: p.slotKind
      }))
    }).pipe(finalize(() => { this.savingConfig = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (saved) => {
          this.applyConfig(saved, false);
          this.messages.add({ severity: 'success', summary: 'School day setup saved' });
          this.reload();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: err?.error?.message || 'Unable to save the school day setup',
          life: 10000
        })
      });
  }

  private validateConfig(): string | null {
    const c = this.config;
    if (!c.name?.trim()) return 'Give the setup a name, e.g. "Regular Shift".';
    if (!c.schoolStartTime || !c.schoolEndTime || c.schoolStartTime >= c.schoolEndTime) {
      return 'School start time must be before the end time.';
    }
    if (!this.workingDayCount) return 'Select at least one working day.';
    if (!this.teachingPeriodCount) return 'Add at least one teaching period.';
    if (!c.maxTeacherWeeklyPeriods || c.maxTeacherWeeklyPeriods < 1) return 'Set the maximum periods a teacher can take per week.';
    const sorted = [...c.periods].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      if (!p.name?.trim()) return `Period ${p.periodNumber} needs a name.`;
      if (!p.startTime || !p.endTime || p.startTime >= p.endTime) return `"${p.name}" must start before it ends.`;
      if (p.startTime < c.schoolStartTime || p.endTime > c.schoolEndTime) {
        return `"${p.name}" (${p.startTime}–${p.endTime}) is outside school hours ${c.schoolStartTime}–${c.schoolEndTime}.`;
      }
      if (i > 0 && p.startTime < sorted[i - 1].endTime) {
        return `"${sorted[i - 1].name}" overlaps "${p.name}".`;
      }
    }
    return null;
  }

  addPeriod(): void {
    const last = this.config.periods[this.config.periods.length - 1];
    const nextNum = last ? last.periodNumber + 1 : 1;
    const startTime = last?.endTime || this.config.schoolStartTime || '08:00';
    const endTime = this.minutesToTime(this.timeToMinutes(startTime) + (this.config.defaultPeriodDurationMin || 40));
    const teachingCount = this.teachingPeriodCount + 1;
    this.config.periods.push({
      periodNumber: nextNum,
      name: `Period ${teachingCount}`,
      startTime,
      endTime,
      slotKind: 'TEACHING'
    });
    if (endTime > this.config.schoolEndTime) this.config.schoolEndTime = endTime;
    this.cdr.markForCheck();
  }

  removePeriod(index: number): void {
    this.config.periods.splice(index, 1);
    this.config.periods.forEach((p, i) => p.periodNumber = i + 1);
    this.cdr.markForCheck();
  }

  /* ═══ RESOURCES ═══ */

  openResourceDialog(): void {
    this.resourceForm = { name: '', code: '', resourceType: 'CLASSROOM', capacity: 40 };
    this.showResourceDialog = true;
  }

  saveResource(): void {
    if (!this.resourceForm.name || !this.resourceForm.code) {
      this.messages.add({ severity: 'warn', summary: 'Name and code are required' });
      return;
    }
    this.savingResource = true;
    this.api.createResource({
      name: this.resourceForm.name,
      code: this.resourceForm.code,
      resourceType: this.resourceForm.resourceType,
      capacity: this.resourceForm.capacity,
      active: true
    }).pipe(finalize(() => { this.savingResource = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (r) => {
          this.resources.push(r);
          this.refreshResourceOptions();
          this.showResourceDialog = false;
          this.messages.add({ severity: 'success', summary: 'Room added' });
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Failed', detail: err?.error?.message })
      });
  }

  deactivateResource(id: number): void {
    this.confirm.confirm({
      header: 'Deactivate room?',
      message: 'This room will no longer be used for new timetables.',
      acceptLabel: 'Deactivate',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deactivateResource(id).subscribe({
          next: () => {
            const item = this.resources.find(r => r.academicResourceId === id);
            if (item) item.active = false;
            this.refreshResourceOptions();
            this.messages.add({ severity: 'success', summary: 'Room deactivated' });
            this.cdr.markForCheck();
          },
          error: (err) => this.messages.add({ severity: 'error', summary: 'Failed', detail: err?.error?.message })
        });
      }
    });
  }

  /* ═══ TIMETABLE GRID ═══ */

  loadVersions(): void {
    if (!this.selectedYearId) return;
    const yearId = this.selectedYearId;
    this.api.listVersions(yearId).subscribe({
      next: (list) => {
        if (yearId !== this.selectedYearId) return;
        this.versions = list;
        this.versionOptions = list.map(v => ({
          label: `Version ${v.versionNumber} · ${this.statusLabel(v.status)}`
            + (v.totalEntries ? ` · ${v.totalEntries} periods` : ''),
          value: v.timetableVersionId
        }));
        const keep = list.some(v => v.timetableVersionId === this.selectedVersionId);
        if (!keep) {
          const published = list.find(v => v.status === 'PUBLISHED');
          const generated = list.find(v => v.generationStatus === 'GENERATED' || v.generationStatus === 'GENERATED_WITH_CONFLICTS');
          this.selectedVersionId = (published ?? generated ?? list[0])?.timetableVersionId ?? null;
        }
        this.ensureGridSelection();
        this.loadGrid();
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Unable to load timetable versions' })
    });
  }

  onVersionChange(): void {
    this.loadGrid();
  }

  setGridView(view: GridView): void {
    this.gridView = view;
    this.ensureGridSelection();
    this.loadGrid();
  }

  onGridClassChange(): void {
    this.refreshSectionOptions();
    this.gridSectionId = this.sectionOptions[0]?.value ?? null;
    this.loadGrid();
  }

  loadGrid(): void {
    if (!this.selectedVersionId) { this.setGrid(null); return; }
    const params: Record<string, number> = {};
    if (this.gridView === 'CLASS') {
      if (!this.gridSectionId) { this.setGrid(null); return; }
      params['sectionId'] = this.gridSectionId;
    } else if (this.gridView === 'TEACHER') {
      if (!this.gridStaffId) { this.setGrid(null); return; }
      params['staffId'] = this.gridStaffId;
    } else {
      if (!this.gridResourceId) { this.setGrid(null); return; }
      params['resourceId'] = this.gridResourceId;
    }

    this.loadingGrid = true;
    this.cdr.markForCheck();
    this.api.getGrid(this.selectedVersionId, this.gridView, params)
      .pipe(finalize(() => { this.loadingGrid = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (g) => this.setGrid(g),
        error: (err) => {
          this.setGrid(null);
          this.messages.add({ severity: 'error', summary: 'Unable to load the timetable', detail: err?.error?.message });
        }
      });
  }

  getCells(day: DayOfWeek, periodNumber: number): TimetableGridCell[] {
    return this.cellIndex.get(`${day}|${periodNumber}`) ?? [];
  }

  get gridEmptyMessage(): string {
    if (!this.versions.length) return 'No timetable has been generated for this year yet. Generate one from the Overview tab.';
    if (this.gridView === 'CLASS' && !this.gridSectionId) return 'Choose a class and section.';
    if (this.gridView === 'TEACHER' && !this.gridStaffId) {
      return this.staffOptions.length ? 'Choose a teacher.' : 'No teachers are allocated for this year.';
    }
    if (this.gridView === 'ROOM' && !this.gridResourceId) {
      return this.resourceOptions.length ? 'Choose a room.' : 'No rooms are set up. Add rooms on the School day tab.';
    }
    return 'Nothing to show.';
  }

  private setGrid(grid: TimetableGrid | null): void {
    this.grid = grid;
    this.cellIndex = new Map();
    for (const cell of grid?.cells ?? []) {
      const key = `${cell.dayOfWeek}|${cell.periodNumber}`;
      const list = this.cellIndex.get(key);
      if (list) list.push(cell); else this.cellIndex.set(key, [cell]);
    }
  }

  private ensureGridSelection(): void {
    if (!this.gridClassId && this.classOptions.length) {
      this.gridClassId = this.classOptions[0].value;
    }
    this.refreshSectionOptions();
    if (!this.sectionOptions.some(o => o.value === this.gridSectionId)) {
      this.gridSectionId = this.sectionOptions[0]?.value ?? null;
    }
    if (!this.gridStaffId && this.staffOptions.length) {
      this.gridStaffId = this.staffOptions[0].value;
    }
    if (!this.gridResourceId && this.resourceOptions.length) {
      this.gridResourceId = this.resourceOptions[0].value;
    }
  }

  private refreshSectionOptions(): void {
    const cls = this.filterClasses.find(c => c.classId === this.gridClassId);
    this.sectionOptions = (cls?.sections ?? []).map(s => ({ label: s.name, value: s.id }));
  }

  /* ═══ CONFLICTS ═══ */

  /** Issues always describe the latest version: the one being reviewed and counted on the tab badge. */
  loadConflicts(): void {
    const versionId = this.dashboard?.latestVersion?.timetableVersionId ?? null;
    if (!versionId) { this.conflicts = []; this.conflictsVersionId = null; return; }
    this.loadingConflicts = true;
    this.cdr.markForCheck();
    this.api.getConflicts(versionId)
      .pipe(finalize(() => { this.loadingConflicts = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (list) => {
          this.conflicts = list;
          this.conflictsVersionId = versionId;
        },
        error: () => {
          this.conflicts = [];
          this.messages.add({ severity: 'error', summary: 'Unable to load conflicts' });
        }
      });
  }

  get conflictsVersionNumber(): number | null {
    return this.dashboard?.latestVersion?.timetableVersionId === this.conflictsVersionId
      ? this.dashboard?.latestVersion?.versionNumber ?? null
      : null;
  }

  conflictTypeLabel(type: string): string {
    return CONFLICT_LABELS[type] ?? type.replace(/_/g, ' ').toLowerCase();
  }

  conflictScope(c: TimetableConflict): string {
    const parts: string[] = [];
    if (c.className || c.sectionName) parts.push([c.className, c.sectionName].filter(Boolean).join(' - '));
    if (c.dayOfWeek) parts.push(this.formatDay(c.dayOfWeek));
    if (c.periodName) parts.push(c.periodName);
    return parts.join(' · ');
  }

  resolveConflict(c: TimetableConflict): void {
    this.updateConflict(this.api.resolveConflict(c.timetableConflictId), 'Marked as resolved');
  }

  ignoreConflict(c: TimetableConflict): void {
    this.updateConflict(this.api.ignoreConflict(c.timetableConflictId), 'Conflict ignored');
  }

  private updateConflict(call: ReturnType<TimetableApiService['resolveConflict']>, success: string): void {
    this.saving = true;
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (updated) => {
          const idx = this.conflicts.findIndex(x => x.timetableConflictId === updated.timetableConflictId);
          if (idx >= 0) this.conflicts = this.conflicts.map((x, i) => i === idx ? updated : x);
          this.messages.add({ severity: 'success', summary: success });
          this.reload();
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Update failed', detail: err?.error?.message })
      });
  }

  /* ═══ HELPERS ═══ */

  statusLabel(status?: string | null): string {
    return status ? (STATUS_LABELS[status] ?? status) : '';
  }

  formatDay(day: string): string {
    return day.charAt(0) + day.slice(1, 3).toLowerCase();
  }

  formatDayLong(day: string): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  /** Backend LocalDateTime is UTC without offset — append Z for correct local display. */
  serverTime(value?: string | null): string | null {
    if (!value) return null;
    return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : value + 'Z';
  }

  hhmm(time?: string | null): string {
    return time ? time.substring(0, 5) : '';
  }

  /** Class, section and teacher selectors come from the year's timetable planning data. */
  private applyFilters(filters: TimetableFilters | null | undefined): void {
    this.filterClasses = filters?.classes ?? [];
    this.classOptions = this.filterClasses.map(c => ({ label: c.name, value: c.classId }));
    if (!this.classOptions.some(o => o.value === this.gridClassId)) this.gridClassId = null;
    this.staffOptions = (filters?.teachers ?? []).map(t => ({ label: t.name, value: t.id }));
    if (!this.staffOptions.some(o => o.value === this.gridStaffId)) this.gridStaffId = null;
    this.onSelectorDataLoaded();
  }

  private loadResources(): void {
    this.api.listResources().subscribe({
      next: (list) => {
        this.resources = list;
        this.refreshResourceOptions();
        this.onSelectorDataLoaded();
      },
      error: () => { this.resources = []; }
    });
  }

  /** Selector lists arrive after the versions; fill in the default selection and show the grid. */
  private onSelectorDataLoaded(): void {
    const before = [this.gridSectionId, this.gridStaffId, this.gridResourceId].join('|');
    this.ensureGridSelection();
    const after = [this.gridSectionId, this.gridStaffId, this.gridResourceId].join('|');
    if (this.activeTab === 'timetable' && before !== after && !this.loadingGrid) this.loadGrid();
    this.cdr.markForCheck();
  }

  private refreshResourceOptions(): void {
    this.resourceOptions = this.resources
      .filter(r => r.active !== false)
      .map(r => ({ label: `${r.name} (${r.code})`, value: r.academicResourceId! }));
  }

  private emptyConfig(): TimetableConfiguration {
    return {
      academicYearId: this.selectedYearId ?? 0,
      name: '',
      shiftType: 'REGULAR',
      schoolStartTime: '08:00',
      schoolEndTime: '14:00',
      defaultPeriodDurationMin: 40,
      maxTeacherWeeklyPeriods: 30,
      workingDays: ALL_DAYS.map(d => ({ dayOfWeek: d, working: false })),
      periods: []
    };
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
