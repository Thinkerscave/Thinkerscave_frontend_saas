import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { extractApiError } from '../../../../../shared/utils/api-error.util';
import { AcademicYearDto } from '../../../models/academic-year.model';
import {
  TeacherWorkloadDashboard,
  TeacherWorkloadRow,
  TeacherWorkloadStatus
} from '../../../models/teacher-workload.model';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { TeacherWorkloadApiService } from '../../../services/teacher-workload-api.service';

export const TEACHER_WORKLOAD_RESOURCE = 'ACADEMICS_TEACHER_ALLOCATION';

type WorkloadStatusFilter = TeacherWorkloadStatus | 'ALL';
type SummaryFilter = 'NONE' | 'OVERLOADED' | 'BELOW_TARGET';
type DetailsTab = 'BREAKDOWN' | 'SUBJECTS' | 'CONFLICTS';

interface SubjectSummaryRow {
  subjectName: string;
  periods: number;
  allocations: number;
}

@Component({
  selector: 'app-teacher-workload-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    DialogModule,
    DropdownModule,
    TooltipModule,
    SaasPageHeaderComponent
  ],
  templateUrl: './teacher-workload.component.html',
  styleUrls: ['./teacher-workload.component.scss']
})
export class TeacherWorkloadPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(TeacherWorkloadApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = 10;
  readonly resource = TEACHER_WORKLOAD_RESOURCE;
  readonly targetTooltip =
    'Estimated target calculated as 80% of the weekly teaching-period capacity from the active timetable '
    + 'schedule pattern. The remaining 20% is a planning buffer.';

  readonly statusOptions: { label: string; value: WorkloadStatusFilter }[] = [
    { label: 'All Workload Status', value: 'ALL' },
    { label: 'Overloaded', value: 'OVERLOADED' },
    { label: 'Near Maximum', value: 'NEAR_MAXIMUM' },
    { label: 'At Target', value: 'AT_TARGET' },
    { label: 'Below Target', value: 'BELOW_TARGET' },
    { label: 'Target Unavailable', value: 'TARGET_UNAVAILABLE' }
  ];

  yearOptions: { label: string; value: number }[] = [];
  yearId: number | null = null;

  dashboard: TeacherWorkloadDashboard | null = null;
  loading = false;
  error: string | null = null;

  searchTerm = '';
  subjectFilter: number | null = null;
  groupFilter: number | null = null;
  statusFilter: WorkloadStatusFilter = 'ALL';
  summaryFilter: SummaryFilter = 'NONE';
  page = 1;

  detailsOpen = false;
  detailsRow: TeacherWorkloadRow | null = null;
  detailsTab: DetailsTab = 'BREAKDOWN';

  ngOnInit(): void {
    this.pageHeader.setPageHeader({
      subtitle: 'View teacher-wise workload, teaching periods and capacity for the selected academic year.',
      crumbs: [
        { label: 'Academics', link: ['/app/academics/overview'] },
        { label: 'Teacher Workload' }
      ]
    });

    const yearParam = Number(this.route.snapshot.queryParamMap.get('academicYearId')) || null;
    this.yearApi.search().subscribe({
      next: (years: AcademicYearDto[]) => {
        this.yearOptions = years.map((y) => ({ label: y.name, value: y.academicYearId }));
        this.yearId = yearParam ?? years[0]?.academicYearId ?? null;
        this.loadDashboard();
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Unable to load academic years' })
    });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  // ───── Data ─────

  onYearChange(): void {
    this.clearFilters();
    this.loadDashboard();
  }

  loadDashboard(): void {
    if (!this.yearId) {
      this.dashboard = null;
      return;
    }
    this.loading = true;
    this.error = null;
    this.api.dashboard(this.yearId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.loading = false;
        this.page = 1;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = extractApiError(err, 'Unable to load teacher workload.').message;
        this.cdr.markForCheck();
      }
    });
  }

  refresh(): void {
    this.loadDashboard();
  }

  // ───── Summary and filters ─────

  selectSummary(filter: Exclude<SummaryFilter, 'NONE'>): void {
    if (this.summaryFilter === filter) {
      this.summaryFilter = 'NONE';
      this.statusFilter = 'ALL';
    } else {
      this.summaryFilter = filter;
      this.statusFilter = filter;
    }
    this.page = 1;
  }

  openUnassignedSubjects(): void {
    this.router.navigate(['/app/academics/teacher-allocation'], {
      queryParams: this.yearId ? { academicYearId: this.yearId } : {}
    });
  }

  onFilterChange(): void {
    this.page = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.subjectFilter = null;
    this.groupFilter = null;
    this.statusFilter = 'ALL';
    this.summaryFilter = 'NONE';
    this.page = 1;
  }

  get hasFilters(): boolean {
    return !!this.searchTerm.trim()
      || this.subjectFilter !== null
      || this.groupFilter !== null
      || this.statusFilter !== 'ALL';
  }

  get filteredRows(): TeacherWorkloadRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    return (this.dashboard?.rows ?? []).filter((row) => {
      if (term && !`${row.staffName} ${row.employeeId ?? ''}`.toLowerCase().includes(term)) return false;
      if (this.statusFilter !== 'ALL' && row.status !== this.statusFilter) return false;
      if (this.subjectFilter !== null
        && !row.breakdown.some((b) => b.subjectId === this.subjectFilter)) return false;
      if (this.groupFilter !== null
        && !row.breakdown.some((b) => b.academicGroupId === this.groupFilter)) return false;
      return true;
    });
  }

  get pagedRows(): TeacherWorkloadRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  setPage(page: number): void {
    this.page = Math.min(Math.max(1, page), this.pageCount);
  }

  // ───── Details modal ─────

  openDetails(row: TeacherWorkloadRow): void {
    this.detailsRow = row;
    this.detailsTab = 'BREAKDOWN';
    this.detailsOpen = true;
  }

  closeDetails(): void {
    this.detailsOpen = false;
    this.detailsRow = null;
  }

  setDetailsTab(tab: DetailsTab): void {
    this.detailsTab = tab;
  }

  get detailsBreakdownTotal(): number {
    return (this.detailsRow?.breakdown ?? []).reduce((sum, b) => sum + b.weeklyPeriods, 0);
  }

  get detailsSubjectSummary(): SubjectSummaryRow[] {
    const bySubject = new Map<string, SubjectSummaryRow>();
    for (const row of this.detailsRow?.breakdown ?? []) {
      const current = bySubject.get(row.subjectName);
      if (current) {
        current.periods += row.weeklyPeriods;
        current.allocations += 1;
      } else {
        bySubject.set(row.subjectName, {
          subjectName: row.subjectName,
          periods: row.weeklyPeriods,
          allocations: 1
        });
      }
    }
    return [...bySubject.values()].sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }

  // ───── Display helpers ─────

  statusLabel(status: TeacherWorkloadStatus): string {
    switch (status) {
      case 'OVERLOADED': return 'Overloaded';
      case 'NEAR_MAXIMUM': return 'Near Maximum';
      case 'AT_TARGET': return 'At Target';
      case 'BELOW_TARGET': return 'Below Target';
      default: return 'Target Unavailable';
    }
  }

  statusIcon(status: TeacherWorkloadStatus): string {
    switch (status) {
      case 'OVERLOADED': return 'pi pi-exclamation-triangle';
      case 'NEAR_MAXIMUM': return 'pi pi-chart-line';
      case 'AT_TARGET': return 'pi pi-check-circle';
      case 'BELOW_TARGET': return 'pi pi-arrow-down';
      default: return 'pi pi-question-circle';
    }
  }

  statusClass(status: TeacherWorkloadStatus): string {
    switch (status) {
      case 'OVERLOADED': return 'tw-status--overloaded';
      case 'NEAR_MAXIMUM': return 'tw-status--near';
      case 'AT_TARGET': return 'tw-status--at';
      case 'BELOW_TARGET': return 'tw-status--below';
      default: return 'tw-status--unavailable';
    }
  }

  barPercent(row: TeacherWorkloadRow): number {
    if (!row.maximumPeriods || row.maximumPeriods <= 0) return 0;
    return Math.min(100, Math.round((row.assignedPeriods / row.maximumPeriods) * 100));
  }

  barClass(row: TeacherWorkloadRow): string {
    return this.statusClass(row.status);
  }

  targetText(row: TeacherWorkloadRow): string {
    return row.expectedTarget == null ? 'Unavailable' : String(row.expectedTarget);
  }

  maximumText(row: TeacherWorkloadRow): string {
    return row.maximumPeriods == null ? 'Unavailable' : String(row.maximumPeriods);
  }

  remainingText(row: TeacherWorkloadRow): string {
    if (row.remainingCapacity == null) return 'Unavailable';
    return row.remainingCapacity > 0 ? `+${row.remainingCapacity}` : String(row.remainingCapacity);
  }

  remainingClass(row: TeacherWorkloadRow): string {
    if (row.remainingCapacity == null) return 'tw-muted';
    return row.remainingCapacity < 0 ? 'tw-negative' : 'tw-positive';
  }

  subjectLabel(row: TeacherWorkloadRow): string {
    return row.subjects.length ? row.subjects.join(', ') : 'No subjects assigned';
  }

  groupSectionLabel(academicGroupName: string, sectionName: string | null): string {
    return sectionName ? `${academicGroupName} · ${sectionName}` : `${academicGroupName} · Whole group`;
  }

  sourceLabel(source: string): string {
    switch (source) {
      case 'CHOICE_GROUP': return 'Choice group';
      case 'FIXED_ACTIVITY': return 'Fixed activity';
      default: return 'Allocation';
    }
  }

  dayLabel(day: string | null): string {
    if (!day) return '';
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  trackRow(_: number, row: TeacherWorkloadRow): number {
    return row.staffId;
  }
}
