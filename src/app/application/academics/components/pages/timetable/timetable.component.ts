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
import { ActivatedRoute, RouterLink } from '@angular/router';
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

type TimetableTab = 'readiness' | 'configuration' | 'timetable' | 'conflicts';

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
  activeTab: TimetableTab = 'readiness';

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

  get readOnly(): boolean {
    return !!this.dashboard?.yearReadOnly;
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource) && !this.readOnly;
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(this.resource);
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

  reload(): void {
    if (!this.selectedYearId) return;
    this.loading = true;
    this.api.getDashboard(this.selectedYearId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (dash) => {
          this.dashboard = dash;
          this.loadSupportingData();
          this.loadReadiness();
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
    this.grid = null;
    this.conflicts = [];
    this.stopPolling();
    this.reload();
  }

  switchTab(tab: TimetableTab): void {
    this.activeTab = tab;
    if (tab === 'configuration' && !this.config.timetableConfigurationId) {
      this.loadConfiguration();
    }
    if (tab === 'timetable') {
      this.loadVersions();
    }
    if (tab === 'conflicts') {
      this.loadConflictsForLatest();
    }
  }

  /* ═══ READINESS ═══ */

  loadReadiness(): void {
    if (!this.selectedYearId) return;
    this.loadingReadiness = true;
    this.api.getReadiness(this.selectedYearId)
      .pipe(finalize(() => { this.loadingReadiness = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (r) => this.readiness = r,
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
      this.reload();
      this.activeTab = 'timetable';
      this.selectedVersionId = progress.timetableVersionId;
      this.loadVersions();
      this.loadGrid();
    } else if (kind === 'BLOCKED') {
      this.messages.add({
        severity: 'warn',
        summary: 'Generation blocked',
        detail: result?.message || progress.message || 'Generation completed with blocking conflicts'
      });
      this.reload();
      this.activeTab = 'conflicts';
      this.selectedVersionId = progress.timetableVersionId;
      this.loadConflictsForLatest();
    } else {
      this.messages.add({
        severity: 'error',
        summary: 'Generation failed',
        detail: progress.message || `Generation ${progress.generationId} failed`
      });
      this.reload();
    }

    this.generationProgress = null;
    this.cdr.markForCheck();
  }

  submitVersion(versionId: number): void {
    this.saving = true;
    this.api.submitVersion(versionId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Version submitted' }); this.reload(); },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Submit failed', detail: err?.error?.message })
      });
  }

  approveVersion(versionId: number): void {
    this.saving = true;
    this.api.approveVersion(versionId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Version approved' }); this.reload(); },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Approval failed', detail: err?.error?.message })
      });
  }

  rejectVersion(versionId: number): void {
    this.saving = true;
    this.api.rejectVersion(versionId)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => { this.messages.add({ severity: 'success', summary: 'Version rejected' }); this.reload(); },
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
            next: () => { this.messages.add({ severity: 'success', summary: 'Timetable published' }); this.reload(); },
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
          this.selectedVersionId = list[0].timetableVersionId;
        }
        if (this.selectedVersionId) {
          this.loadGrid();
        }
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Unable to load versions' })
    });
  }

  loadGrid(): void {
    if (!this.selectedVersionId) { this.grid = null; return; }
    this.loadingGrid = true;
    const params: Record<string, any> = {};
    if (this.gridView === 'CLASS') {
      if (this.gridSectionId) params['sectionId'] = this.gridSectionId;
      else if (this.gridClassId) params['classId'] = this.gridClassId;
    }
    if (this.gridView === 'TEACHER' && this.gridStaffId) params['staffId'] = this.gridStaffId;
    if (this.gridView === 'ROOM' && this.gridResourceId) params['resourceId'] = this.gridResourceId;

    this.api.getGrid(this.selectedVersionId, this.gridView, params)
      .pipe(finalize(() => { this.loadingGrid = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (g) => this.grid = g,
        error: () => { this.grid = null; this.messages.add({ severity: 'error', summary: 'Unable to load grid' }); }
      });
  }

  onGridClassChange(): void {
    this.gridSectionId = null;
    if (this.gridClassId) {
      const cls = this.allClasses.find((c: any) => c.classId === this.gridClassId);
      this.sectionOptions = (cls?.sections || []).map((s: any) => ({ label: s.name, value: s.sectionId }));
    } else {
      this.sectionOptions = [];
    }
    this.loadGrid();
  }

  getCell(day: DayOfWeek, periodNumber: number): TimetableGridCell | undefined {
    return this.grid?.cells.find(c => c.dayOfWeek === day && c.periodNumber === periodNumber);
  }

  /* ═══ CONFLICTS ═══ */

  loadConflictsForLatest(): void {
    const versionId = this.selectedVersionId
      ?? this.dashboard?.latestVersion?.timetableVersionId;
    if (!versionId) { this.conflicts = []; return; }
    this.api.getConflicts(versionId).subscribe({
      next: (list) => { this.conflicts = list; this.cdr.markForCheck(); },
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
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  private loadSupportingData(): void {
    if (!this.selectedYearId) return;
    this.loadClasses();
    this.loadResources();
    this.loadStaffOptions();
  }

  private loadClasses(): void {
    if (!this.selectedYearId) return;
    this.classesApi.getDashboard(this.selectedYearId, { active: true }).subscribe({
      next: (dash) => {
        this.allClasses = dash.classes || [];
        this.classOptions = this.allClasses.map((c: any) => ({ label: c.name, value: c.classId }));
        this.cdr.markForCheck();
      },
      error: () => { this.classOptions = []; }
    });
  }

  private loadResources(): void {
    this.api.listResources().subscribe({
      next: (list) => {
        this.resources = list;
        this.refreshResourceOptions();
        this.cdr.markForCheck();
      },
      error: () => { this.resources = []; }
    });
  }

  private loadStaffOptions(): void {
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
        this.cdr.markForCheck();
      },
      error: () => { this.staffOptions = []; }
    });
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
