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
import { ActivatedRoute } from '@angular/router';
import { Subject, finalize, switchMap, timer, takeWhile, tap } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../../core/services/permission.service';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { ClassesSectionsApiService } from '../../../services/classes-sections-api.service';
import { TeacherAllocationApiService } from '../../../services/teacher-allocation-api.service';
import { TimetableApiService } from '../../../services/timetable-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { ClassSectionDto } from '../../../models/classes-sections.model';
import {
  ACADEMICS_TIMETABLE_RESOURCE,
  AcademicResource,
  DayOfWeek,
  GenerationProgress,
  GridView,
  ResourceType,
  TimetableConflict,
  TimetableConfiguration,
  TimetableDashboard,
  TimetableGrid,
  TimetableGridCell,
  TimetablePeriod,
  TimetableReadiness,
  TimetableVersion,
  TimetableWorkingDay
} from '../../../models/timetable.model';

@Component({
  selector: 'app-timetable-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
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
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly workloadsApi = inject(TeacherAllocationApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(AcademicsNavService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_TIMETABLE_RESOURCE;

  loading = true;
  saving = false;
  showBack = false;
  generating = false;
  savingConfig = false;
  savingResource = false;
  loadingGrid = false;
  loadingReadiness = false;

  years: AcademicYearDto[] = [];
  selectedYearId: number | null = null;
  dashboard: TimetableDashboard | null = null;
  readiness: TimetableReadiness | null = null;
  configOpen = false;
  readinessOpen = false;

  generationProgress: GenerationProgress | null = null;
  activeGenerationId: string | null = null;
  private cancelPoll$ = new Subject<void>();

  config: TimetableConfiguration = this.emptyConfig();
  resources: AcademicResource[] = [];

  versions: TimetableVersion[] = [];
  selectedVersionId: number | null = null;
  versionOptions: { label: string; value: number }[] = [];
  gridView: GridView = 'CLASS';
  grid: TimetableGrid | null = null;
  conflicts: TimetableConflict[] = [];
  conflictPage = 1;
  conflictPageSize = 8;

  classOptions: { label: string; value: number }[] = [];
  sectionOptions: { label: string; value: number }[] = [];
  staffOptions: { label: string; value: number }[] = [];
  resourceOptions: { label: string; value: number }[] = [];
  gridClassId: number | null = null;
  gridSectionId: number | null = null;
  gridStaffId: number | null = null;
  gridResourceId: number | null = null;

  showResourceDialog = false;
  resourceForm: { name: string; code: string; resourceType: ResourceType; capacity: number } = {
    name: '', code: '', resourceType: 'CLASSROOM', capacity: 40
  };

  private allClasses: any[] = [];
  private cellIndex = new Map<string, TimetableGridCell[]>();
  loadingSections = false;

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(this.resource);
  }

  get gridFill(): { filled: number; slots: number } {
    const teaching = (this.grid?.periods || []).filter((p) => p.slotKind !== 'BREAK').length;
    const days = this.grid?.workingDays?.length ?? 0;
    const slots = teaching * days;
    const filled = new Set(
      (this.grid?.cells || [])
        .filter((c) => !!c.subjectName)
        .map((c) => `${this.normalizeDay(c.dayOfWeek)}-${c.periodNumber ?? c.periodId}`)
    ).size;
    return { filled, slots };
  }

  get gridSubjects(): string[] {
    const names = (this.grid?.cells || [])
      .map((c) => (c.subjectName || '').trim())
      .filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }

  get gridLooksSingleSubject(): boolean {
    return this.gridSubjects.length === 1 && this.gridFill.filled > 3;
  }

  get canGenerateNow(): boolean {
    if (!this.canManage || this.generating || this.loadingReadiness) return false;
    return !!this.readiness?.ready;
  }

  get openBlockingCount(): number {
    return this.conflicts.filter((c) => c.status === 'OPEN' && c.blocking).length;
  }

  get pagedConflicts(): TimetableConflict[] {
    const start = (this.conflictPage - 1) * this.conflictPageSize;
    return this.conflicts.slice(start, start + this.conflictPageSize);
  }

  get conflictPages(): number {
    return Math.max(1, Math.ceil(this.conflicts.length / this.conflictPageSize));
  }

  get classHasNoSections(): boolean {
    return this.gridView === 'CLASS'
      && !!this.gridClassId
      && !this.gridSectionId
      && !this.loadingSections;
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.showBack = !!qp.get('from');
    const qpYear = qp.get('academicYearId');

    this.yearApi.search().subscribe({
      next: (years) => {
        this.years = years;
        const preferred = qpYear ? years.find(y => y.academicYearId === Number(qpYear)) : null;
        const current = preferred ?? years.find(y => y.status === 'CURRENT') ?? years[0] ?? null;
        this.selectedYearId = current?.academicYearId ?? null;
        if (this.selectedYearId) {
          this.reload();
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.messages.add({ severity: 'error', summary: 'Unable to load academic years' });
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.nav.back(this.route);
  }

  ngOnDestroy(): void {
    this.cancelPoll$.next();
    this.cancelPoll$.complete();
  }

  reload(showPageLoader = true): void {
    if (!this.selectedYearId) return;
    if (showPageLoader) this.loading = true;
    this.api.getDashboard(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
          this.loadReadiness();
          this.loadClasses();
          this.loadVersions();
          this.loadConflictsForLatest();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to load timetable dashboard',
          detail: err?.error?.message || 'Please try again'
        })
      });
  }

  onYearChange(): void {
    this.dashboard = null;
    this.readiness = null;
    this.config = this.emptyConfig();
    this.versions = [];
    this.selectedVersionId = null;
    this.grid = null;
    this.indexGrid(null);
    this.gridClassId = null;
    this.gridSectionId = null;
    this.sectionOptions = [];
    this.staffOptions = [];
    this.gridStaffId = null;
    this.gridResourceId = null;
    this.conflicts = [];
    this.configOpen = false;
    this.readinessOpen = false;
    this.stopPolling();
    this.reload();
  }

  toggleReadiness(): void {
    this.readinessOpen = !this.readinessOpen;
    if (this.readinessOpen && !this.readiness) this.loadReadiness();
  }

  openConfigure(): void {
    this.configOpen = true;
    if (!this.config.timetableConfigurationId) this.loadConfiguration();
    if (!this.resources.length) this.loadResources();
  }

  closeConfigure(): void {
    this.configOpen = false;
  }

  /* ═══ READINESS ═══ */

  loadReadiness(): void {
    if (!this.selectedYearId) return;
    this.loadingReadiness = true;
    this.api.getReadiness(this.selectedYearId)
      .pipe(finalize(() => { this.loadingReadiness = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (r) => {
          this.readiness = r;
          if (!r.ready) this.readinessOpen = true;
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Unable to load readiness checks' })
      });
  }

  readinessColor(status: string): string {
    if (status === 'PASSED' || status === 'PASS' || status === 'READY' || status === 'COMPLETE') return '#059669';
    if (status === 'WARNING' || status === 'WARN') return '#D97706';
    return '#DC2626';
  }

  readinessIcon(status: string): string {
    if (status === 'PASSED') return 'pi-check-circle';
    if (status === 'WARNING') return 'pi-exclamation-triangle';
    return 'pi-times-circle';
  }

  /* ═══ GENERATION (async) ═══ */

  generateTimetable(): void {
    if (!this.selectedYearId || !this.canManage || this.generating) return;
    this.generating = true;
    this.generationProgress = null;
    this.api.startGeneration(this.selectedYearId).subscribe({
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
          summary: 'Generation failed to start',
          detail: err?.error?.message || 'Unable to start timetable generation'
        });
      }
    });
  }

  cancelGeneration(): void {
    if (!this.activeGenerationId) return;
    this.api.cancelGeneration(this.activeGenerationId).subscribe({
      next: () => {
        this.stopPolling();
        this.generating = false;
        this.generationProgress = null;
        this.activeGenerationId = null;
        this.messages.add({ severity: 'info', summary: 'Generation cancelled' });
        this.cdr.markForCheck();
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Cancel failed',
        detail: err?.error?.message || 'Unable to cancel generation'
      })
    });
  }

  private startPolling(generationId: string): void {
    this.cancelPoll$.next();
    timer(0, 1500).pipe(
      takeUntilDestroyed(this.destroyRef),
      takeWhile(() => this.generating),
      switchMap(() => this.api.getGenerationProgress(generationId)),
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
          summary: 'Polling error',
          detail: err?.error?.message || 'Lost connection while checking generation progress'
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
    const result = progress.result;
    const kind = result?.resultKind;

    if (kind === 'SUCCESS' || kind === 'SUCCESS_WITH_WARNINGS') {
      this.messages.add({
        severity: 'success',
        summary: 'Timetable generated',
        detail: `Version ${progress.versionNumber} · ${result?.totalConflicts ?? 0} conflicts`
      });
      this.selectedVersionId = progress.timetableVersionId;
      this.reload(false);
    } else if (kind === 'BLOCKED') {
      this.messages.add({
        severity: 'warn',
        summary: 'Generation blocked',
        detail: result?.message || progress.message || 'Generation completed with blocking conflicts'
      });
      this.selectedVersionId = progress.timetableVersionId;
      this.readinessOpen = true;
      this.reload(false);
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Generation failed',
        detail: progress.message || `Generation ${progress.generationId} failed`
      });
      this.reload(false);
    }

    this.generationProgress = null;
    this.cdr.markForCheck();
  }

  submitVersion(versionId: number): void {
    this.saving = true;
    this.api.submitVersion(versionId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Version submitted' }); this.reload(false); },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Submit failed', detail: err?.error?.message })
      });
  }

  approveVersion(versionId: number): void {
    this.saving = true;
    this.api.approveVersion(versionId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Version approved' }); this.reload(false); },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Approval failed', detail: err?.error?.message })
      });
  }

  rejectVersion(versionId: number): void {
    this.saving = true;
    this.api.rejectVersion(versionId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Version rejected' }); this.reload(false); },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Rejection failed', detail: err?.error?.message })
      });
  }

  publishVersion(versionId: number): void {
    this.confirm.confirm({
      header: 'Publish timetable?',
      message: 'This will make the timetable visible to all stakeholders. Continue?',
      acceptLabel: 'Publish',
      accept: () => {
        this.saving = true;
        this.api.publishVersion(versionId)
          .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
          .subscribe({
            next: () => { this.messages.add({ severity: 'success', summary: 'Timetable published' }); this.reload(false); },
            error: (err) => this.messages.add({ severity: 'error', summary: 'Publish failed', detail: err?.error?.message })
          });
      }
    });
  }

  /* ═══ CONFIGURATION ═══ */

  loadConfiguration(): void {
    if (!this.selectedYearId) return;
    this.api.getConfiguration(this.selectedYearId).subscribe({
      next: (cfg) => {
        if (cfg) {
          this.config = cfg;
        } else {
          this.config = this.seedDefaults();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.config = this.seedDefaults();
        this.cdr.markForCheck();
      }
    });
  }

  saveConfiguration(): void {
    if (!this.selectedYearId || !this.canManage) return;
    this.savingConfig = true;
    this.api.saveConfiguration(this.selectedYearId, {
      name: this.config.name,
      shiftType: this.config.shiftType,
      schoolStartTime: this.config.schoolStartTime,
      schoolEndTime: this.config.schoolEndTime,
      defaultPeriodDurationMin: this.config.defaultPeriodDurationMin,
      maxTeacherWeeklyPeriods: this.config.maxTeacherWeeklyPeriods,
      workingDays: this.config.workingDays,
      periods: this.config.periods
    }).pipe(finalize(() => { this.savingConfig = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (saved) => {
          this.config = saved;
          this.messages.add({ severity: 'success', summary: 'Configuration saved' });
          this.loadReadiness();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: err?.error?.message || 'Unable to save configuration'
        })
      });
  }

  addPeriod(): void {
    const lastPeriod = this.config.periods[this.config.periods.length - 1];
    const nextNum = lastPeriod ? lastPeriod.periodNumber + 1 : 1;
    const startTime = lastPeriod?.endTime || this.config.schoolStartTime || '07:30';
    const endMinutes = this.timeToMinutes(startTime) + (this.config.defaultPeriodDurationMin || 45);
    this.config.periods.push({
      periodNumber: nextNum,
      name: `Period ${nextNum}`,
      startTime,
      endTime: this.minutesToTime(endMinutes),
      slotKind: 'TEACHING'
    });
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
          this.messages.add({ severity: 'success', summary: 'Resource created' });
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Failed', detail: err?.error?.message })
      });
  }

  deactivateResource(id: number): void {
    this.confirm.confirm({
      header: 'Deactivate resource?',
      message: 'This resource will be marked inactive.',
      acceptLabel: 'Deactivate',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deactivateResource(id).subscribe({
          next: () => {
            const item = this.resources.find(r => r.academicResourceId === id);
            if (item) item.active = false;
            this.refreshResourceOptions();
            this.messages.add({ severity: 'success', summary: 'Resource deactivated' });
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
    this.api.listVersions(this.selectedYearId).subscribe({
      next: (list) => {
        this.versions = list;
        this.versionOptions = list.map(v => ({
          label: `V${v.versionNumber} · ${v.status}`,
          value: v.timetableVersionId
        }));
        if (!this.selectedVersionId && list.length) {
          const sorted = [...list].sort((a, b) => b.versionNumber - a.versionNumber);
          const preferred = sorted.find((v) => v.status === 'PUBLISHED') ?? sorted[0];
          this.selectedVersionId = preferred.timetableVersionId;
        }
        if (this.selectedVersionId) {
          this.loadGrid();
          this.loadConflictsForLatest();
        }
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Unable to load versions' })
    });
  }

  loadGrid(): void {
    if (!this.selectedVersionId) {
      this.grid = null;
      this.indexGrid(null);
      return;
    }
    if (this.gridView === 'CLASS' && !this.gridSectionId) {
      this.grid = null;
      this.indexGrid(null);
      return;
    }
    if (this.gridView === 'TEACHER' && !this.gridStaffId) {
      this.grid = null;
      this.indexGrid(null);
      return;
    }
    if (this.gridView === 'ROOM' && !this.gridResourceId) {
      this.grid = null;
      this.indexGrid(null);
      return;
    }
    this.loadingGrid = true;
    const params: Record<string, any> = {};
    if (this.gridView === 'CLASS' && this.gridSectionId) {
      params['sectionId'] = this.gridSectionId;
      if (this.gridClassId) params['classId'] = this.gridClassId;
    }
    if (this.gridView === 'TEACHER' && this.gridStaffId) params['staffId'] = this.gridStaffId;
    if (this.gridView === 'ROOM' && this.gridResourceId) params['resourceId'] = this.gridResourceId;

    this.api.getGrid(this.selectedVersionId, this.gridView, params)
      .pipe(finalize(() => { this.loadingGrid = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (g) => {
          this.grid = g;
          this.indexGrid(g);
        },
        error: () => {
          this.grid = null;
          this.indexGrid(null);
          this.messages.add({ severity: 'error', summary: 'Unable to load grid' });
        }
      });
  }

  onVersionChange(): void {
    this.conflictPage = 1;
    this.loadGrid();
    this.loadConflictsForLatest();
  }

  setGridView(view: GridView): void {
    if (this.gridView === view) {
      this.loadGrid();
      return;
    }
    this.gridView = view;
    this.grid = null;
    this.indexGrid(null);
    if (view === 'CLASS') {
      if (this.gridClassId && this.gridSectionId) this.loadGrid();
      else if (this.gridClassId) this.onGridClassChange();
      else this.loadClasses();
      return;
    }
    if (view === 'TEACHER') {
      this.ensureStaffThenLoad();
      return;
    }
    this.ensureRoomThenLoad();
  }

  onGridClassChange(): void {
    this.gridSectionId = null;
    this.sectionOptions = [];
    this.grid = null;
    this.indexGrid(null);
    if (!this.gridClassId) return;

    const cached = this.allClasses.find((c: any) => c.classId === this.gridClassId);
    const local = this.activeSections(cached?.sections);
    if (local.length) {
      this.applyGridSections(local);
      return;
    }

    this.loadingSections = true;
    this.classesApi.getClass(this.gridClassId).subscribe({
      next: (cls) => {
        this.loadingSections = false;
        const sections = this.activeSections(cls.sections);
        const idx = this.allClasses.findIndex((c: any) => c.classId === cls.classId);
        if (idx >= 0) this.allClasses[idx] = { ...this.allClasses[idx], sections: cls.sections };
        this.applyGridSections(sections);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingSections = false;
        this.messages.add({ severity: 'warn', summary: 'Unable to load sections for this class' });
        this.cdr.markForCheck();
      }
    });
  }

  cellsFor(day: DayOfWeek | string, periodNumber: number): TimetableGridCell[] {
    const key = this.cellKey(day, periodNumber);
    let list = this.cellIndex.get(key) ?? [];
    if (!list.length && this.grid?.cells?.length) {
      list = this.grid.cells.filter((c) =>
        this.normalizeDay(c.dayOfWeek) === this.normalizeDay(day)
        && (c.periodNumber === periodNumber || c.periodId === periodNumber)
      );
    }
    if (this.gridView === 'CLASS' && this.gridSectionId) {
      const scoped = list.filter((c) => c.sectionId == null || c.sectionId === this.gridSectionId);
      if (scoped.length) list = scoped;
    }
    return list;
  }

  /* ═══ CONFLICTS ═══ */

  loadConflictsForLatest(): void {
    const versionId = this.selectedVersionId
      ?? this.dashboard?.latestVersion?.timetableVersionId;
    if (!versionId) { this.conflicts = []; return; }
    this.api.getConflicts(versionId).subscribe({
      next: (list) => {
        this.conflicts = [...list].sort((a, b) => {
          const aOpen = a.status === 'OPEN' ? 0 : 1;
          const bOpen = b.status === 'OPEN' ? 0 : 1;
          if (aOpen !== bOpen) return aOpen - bOpen;
          if (!!a.blocking !== !!b.blocking) return a.blocking ? -1 : 1;
          return 0;
        });
        this.conflictPage = 1;
        this.cdr.markForCheck();
      },
      error: () => { this.conflicts = []; this.messages.add({ severity: 'error', summary: 'Unable to load conflicts' }); }
    });
  }

  resolveConflict(c: TimetableConflict): void {
    this.saving = true;
    this.api.resolveConflict(c.timetableConflictId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (updated) => {
          const idx = this.conflicts.findIndex(x => x.timetableConflictId === c.timetableConflictId);
          if (idx >= 0) this.conflicts[idx] = updated;
          this.messages.add({ severity: 'success', summary: 'Conflict resolved' });
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Resolve failed', detail: err?.error?.message })
      });
  }

  ignoreConflict(c: TimetableConflict): void {
    this.saving = true;
    this.api.ignoreConflict(c.timetableConflictId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (updated) => {
          const idx = this.conflicts.findIndex(x => x.timetableConflictId === c.timetableConflictId);
          if (idx >= 0) this.conflicts[idx] = updated;
          this.messages.add({ severity: 'info', summary: 'Conflict ignored' });
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Ignore failed', detail: err?.error?.message })
      });
  }

  /* ═══ HELPERS ═══ */

  formatDay(day: string): string {
    const n = this.normalizeDay(day);
    return n.charAt(0) + n.slice(1).toLowerCase();
  }

  private loadClasses(): void {
    if (!this.selectedYearId) return;
    this.classesApi.getDashboard(this.selectedYearId, { active: true }).subscribe({
      next: (dash) => {
        this.allClasses = dash.classes || [];
        this.classOptions = this.allClasses.map((c: any) => ({ label: c.name, value: c.classId }));
        if (!this.gridClassId && this.allClasses.length) {
          this.gridClassId = this.allClasses[0].classId;
        }
        if (this.gridClassId && (!this.sectionOptions.length || !this.gridSectionId)) {
          this.onGridClassChange();
        } else if (this.gridView === 'CLASS') {
          this.loadGrid();
        }
        this.cdr.markForCheck();
      },
      error: () => { this.classOptions = []; }
    });
  }

  private applyGridSections(sections: ClassSectionDto[]): void {
    this.sectionOptions = sections.map((s) => ({ label: s.name, value: s.sectionId }));
    const stillValid = this.sectionOptions.some((s) => s.value === this.gridSectionId);
    if (!stillValid) this.gridSectionId = this.sectionOptions[0]?.value ?? null;
    this.loadGrid();
  }

  private activeSections(sections?: ClassSectionDto[] | null): ClassSectionDto[] {
    return (sections || []).filter((s) => s.active !== false);
  }

  private indexGrid(grid: TimetableGrid | null): void {
    this.cellIndex.clear();
    if (!grid?.cells?.length) return;
    for (const cell of grid.cells) {
      const key = this.cellKey(cell.dayOfWeek, cell.periodNumber ?? cell.periodId);
      const list = this.cellIndex.get(key) ?? [];
      list.push(cell);
      this.cellIndex.set(key, list);
    }
  }

  private cellKey(day: string, periodNumber: number): string {
    return `${this.normalizeDay(day)}|${periodNumber}`;
  }

  private normalizeDay(day: string): string {
    const raw = String(day || '').toUpperCase().replace(/[^A-Z]/g, '');
    const short: Record<string, string> = {
      MON: 'MONDAY',
      TUE: 'TUESDAY',
      TUES: 'TUESDAY',
      WED: 'WEDNESDAY',
      THU: 'THURSDAY',
      THUR: 'THURSDAY',
      THURS: 'THURSDAY',
      FRI: 'FRIDAY',
      SAT: 'SATURDAY',
      SUN: 'SUNDAY'
    };
    return short[raw] || raw;
  }

  private loadResources(selectAndLoad = false): void {
    this.api.listResources().subscribe({
      next: (list) => {
        this.resources = list;
        this.refreshResourceOptions();
        if (selectAndLoad) {
          if (!this.gridResourceId && this.resourceOptions.length) {
            this.gridResourceId = this.resourceOptions[0].value;
          }
          this.loadGrid();
        }
        this.cdr.markForCheck();
      },
      error: () => { this.resources = []; }
    });
  }

  private loadStaffOptions(selectAndLoad = false): void {
    if (!this.selectedYearId) return;
    this.workloadsApi.workloads(this.selectedYearId).subscribe({
      next: (list) => {
        const seen = new Set<number>();
        this.staffOptions = [];
        for (const w of list) {
          if (!seen.has(w.staffId)) {
            seen.add(w.staffId);
            this.staffOptions.push({ label: w.staffName, value: w.staffId });
          }
        }
        if (selectAndLoad) {
          if (!this.gridStaffId && this.staffOptions.length) {
            this.gridStaffId = this.staffOptions[0].value;
          }
          this.loadGrid();
        }
        this.cdr.markForCheck();
      },
      error: () => { this.staffOptions = []; }
    });
  }

  private ensureStaffThenLoad(): void {
    if (this.staffOptions.length) {
      if (!this.gridStaffId) this.gridStaffId = this.staffOptions[0].value;
      this.loadGrid();
      return;
    }
    this.loadStaffOptions(true);
  }

  private ensureRoomThenLoad(): void {
    if (this.resourceOptions.length) {
      if (!this.gridResourceId) this.gridResourceId = this.resourceOptions[0].value;
      this.loadGrid();
      return;
    }
    this.loadResources(true);
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
      schoolStartTime: '07:30',
      schoolEndTime: '14:00',
      defaultPeriodDurationMin: 45,
      maxTeacherWeeklyPeriods: 30,
      workingDays: [],
      periods: []
    };
  }

  private seedDefaults(): TimetableConfiguration {
    const allDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const workingDays: TimetableWorkingDay[] = allDays.map(d => ({
      dayOfWeek: d,
      working: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(d)
    }));

    const periods: TimetablePeriod[] = [];
    let startMin = this.timeToMinutes('07:30');
    const duration = 45;
    for (let i = 1; i <= 8; i++) {
      if (i === 4) {
        periods.push({
          periodNumber: i,
          name: 'Break',
          startTime: this.minutesToTime(startMin),
          endTime: this.minutesToTime(startMin + 20),
          slotKind: 'BREAK'
        });
        startMin += 20;
        continue;
      }
      const num = i > 4 ? i - 1 : i;
      periods.push({
        periodNumber: i,
        name: `Period ${num}`,
        startTime: this.minutesToTime(startMin),
        endTime: this.minutesToTime(startMin + duration),
        slotKind: 'TEACHING'
      });
      startMin += duration;
    }

    return {
      academicYearId: this.selectedYearId ?? 0,
      name: 'Regular Timetable',
      shiftType: 'REGULAR',
      schoolStartTime: '07:30',
      schoolEndTime: this.minutesToTime(startMin),
      defaultPeriodDurationMin: duration,
      maxTeacherWeeklyPeriods: 30,
      workingDays,
      periods
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
