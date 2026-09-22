import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { UI_PAGINATION, UI_SEARCH } from '../../../../shared/config/ui-standards';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi/kpi-card.component';
import { finalizeBusy, TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import {
  AppGridTableToggleComponent,
  AppListViewMode,
  AppPaginatorComponent
} from '../../../../shared/ui/app-list';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { environment } from '../../../../../environments/environment';
import { FeesApiService } from '../../services/fees-api.service';
import {
  BillingPeriodOption,
  BillingPeriodStatus,
  LinkedStudentOption,
  StudentFeeListItem,
  StudentFeeSummary
} from '../../models/fees.model';

interface LookupOption {
  id: number;
  name: string;
  status?: string;
}

@Component({
  selector: 'app-student-fee-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppToastComponent,
    KpiCardComponent,
    KpiGroupComponent,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    TcPageSkeletonComponent,
    AppGridTableToggleComponent,
    AppPaginatorComponent
  ],
  templateUrl: './student-fee-page.component.html',
  styleUrls: ['./student-fee-page.component.scss', '../../fees.shared.scss']
})
export class StudentFeePageComponent implements OnInit {
  private readonly api = inject(FeesApiService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewPrefs = inject(ViewPreferenceService);

  readonly pageSizeOptions = UI_PAGINATION.options;
  readonly statusOptions: { label: string; value: '' | BillingPeriodStatus }[] = [
    { label: 'All', value: '' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
    { label: 'Due', value: 'DUE' },
    { label: 'Overdue', value: 'OVERDUE' }
  ];

  private readonly search$ = new Subject<string>();

  classes: LookupOption[] = [];
  sections: LookupOption[] = [];
  periodOptions: BillingPeriodOption[] = [];
  linked: LinkedStudentOption[] = [];

  academicYearId: number | null = null;
  canSearch = true;
  linkedMode = false;
  loading = true;
  summaryLoading = false;
  error: string | null = null;

  q = '';
  classId: number | null = null;
  sectionId: number | null = null;
  status: '' | BillingPeriodStatus = '';
  periodKey = '';
  outstandingOnly = false;
  viewMode: AppListViewMode = this.viewPrefs.globalDefault();
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: StudentFeeListItem[] = [];
  summary: StudentFeeSummary | null = null;

  get hasActiveFilters(): boolean {
    return (
      !!this.q.trim() ||
      this.classId != null ||
      this.sectionId != null ||
      !!this.status ||
      !!this.periodKey ||
      this.outstandingOnly
    );
  }

  get isFilterEmptyState(): boolean {
    return this.hasActiveFilters && !this.rows.length && !this.loading && !this.error;
  }

  ngOnInit(): void {
    const outstandingParam = this.route.snapshot.queryParamMap.get('outstandingOnly');
    this.outstandingOnly = outstandingParam === 'true' || outstandingParam === '1';

    this.http
      .get<{ success: boolean; data: LookupOption[] }>(`${environment.baseUrl}/students/classes`)
      .pipe(map(r => r.data ?? []))
      .subscribe({
        next: classes => {
          this.classes = classes;
          this.cdr.markForCheck();
        },
        error: () => {
          this.classes = [];
          this.cdr.markForCheck();
        }
      });

    this.search$
      .pipe(debounceTime(UI_SEARCH.debounceMs), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.load({ soft: true });
      });
  }

  onAcademicYearChange(yearId: number | null): void {
    this.academicYearId = yearId;
    this.page = 0;
    this.periodKey = '';
    this.periodOptions = [];
    if (yearId == null) {
      this.rows = [];
      this.total = 0;
      this.summary = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.rows = [];
    this.total = 0;
    this.summary = null;
    this.loading = true;
    this.cdr.markForCheck();
    this.loadPeriodOptions(yearId);
    this.bootstrapAndLoad();
  }

  private bootstrapAndLoad(): void {
    this.api.linkedStudents().subscribe({
      next: linked => {
        this.linked = linked ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.linked = [];
      }
    });
    this.load();
  }

  private loadPeriodOptions(yearId: number): void {
    this.api.billingPeriodOptions(yearId).subscribe({
      next: opts => {
        this.periodOptions = opts ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.periodOptions = [];
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(value: string): void {
    this.q = value ?? '';
    this.search$.next(this.q.trim());
  }

  onClassChange(value: number | null): void {
    this.classId = value;
    this.sectionId = null;
    this.sections = [];
    this.page = 0;
    if (value != null) {
      this.http
        .get<{ success: boolean; data: LookupOption[] }>(
          `${environment.baseUrl}/students/sections`,
          { params: { classId: String(value) } }
        )
        .pipe(map(r => r.data ?? []))
        .subscribe({
          next: sections => {
            this.sections = sections;
            this.cdr.markForCheck();
          },
          error: () => {
            this.sections = [];
            this.cdr.markForCheck();
          }
        });
    }
    this.load({ soft: true });
  }

  onSectionChange(value: number | null): void {
    this.sectionId = value;
    this.page = 0;
    this.load({ soft: true });
  }

  onStatusChange(value: '' | BillingPeriodStatus): void {
    this.status = value ?? '';
    this.page = 0;
    this.load({ soft: true });
  }

  onPeriodChange(value: string): void {
    this.periodKey = value ?? '';
    this.page = 0;
    this.load({ soft: true });
  }

  onOutstandingOnlyChange(value: boolean): void {
    this.outstandingOnly = !!value;
    this.page = 0;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { outstandingOnly: this.outstandingOnly ? true : null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.load({ soft: true });
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.size) {
      this.size = event.rows;
      this.page = 0;
    }
    this.load({ soft: true });
  }

  clearFilters(): void {
    this.q = '';
    this.classId = null;
    this.sectionId = null;
    this.sections = [];
    this.status = '';
    this.periodKey = '';
    this.outstandingOnly = false;
    this.page = 0;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { outstandingOnly: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.load({ soft: true });
  }

  openLinkedStudent(id: number): void {
    void this.router.navigate(['/app/fees/students', id]);
  }

  load(opts?: { soft?: boolean }): void {
    if (this.academicYearId == null) return;

    const soft = !!opts?.soft && this.rows.length > 0;
    if (!soft) {
      this.loading = true;
      this.rows = [];
    } else {
      this.loading = true;
    }
    this.error = null;

    const filter = this.buildFilter();
    this.loadSummary(filter);

    this.api
      .listStudents(filter, this.page, this.size)
      .pipe(
        finalizeBusy(v => {
          this.loading = v;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: page => {
          this.canSearch = true;
          this.linkedMode = false;
          this.rows = page?.content ?? [];
          this.total = page?.totalElements ?? 0;
          this.cdr.markForCheck();
        },
        error: err => {
          if (err?.status === 403) {
            this.canSearch = false;
            this.linkedMode = true;
            this.rows = [];
            this.total = 0;
            this.summary = null;
            this.error = null;
            if (this.linked.length === 1) {
              this.openLinkedStudent(this.linked[0].studentId);
            }
          } else {
            this.error = extractApiError(err, 'Request failed').message || 'Failed to load student fees';
          }
          this.cdr.markForCheck();
        }
      });
  }

  private loadSummary(filter: ReturnType<StudentFeePageComponent['buildFilter']>): void {
    this.summaryLoading = true;
    this.api.studentFeeSummary(filter).subscribe({
      next: summary => {
        this.summary = summary;
        this.summaryLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.summary = null;
        this.summaryLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private buildFilter() {
    return {
      academicYearId: this.academicYearId ?? undefined,
      q: this.q.trim() || undefined,
      classId: this.classId ?? undefined,
      sectionId: this.sectionId ?? undefined,
      status: this.status || undefined,
      periodKey: this.periodKey || undefined,
      outstandingOnly: this.outstandingOnly ? true : undefined
    };
  }

  formatMoney(v: number | null | undefined): string {
    return Number(v ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  classLabel(row: StudentFeeListItem): string {
    const cls = row.className?.trim();
    const sec = row.sectionName?.trim();
    if (cls && sec) return `${cls} - ${sec}`;
    return cls || sec || '—';
  }

  initials(name: string | null | undefined): string {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  statusLabel(status: BillingPeriodStatus | string | null | undefined): string {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'PARTIALLY_PAID':
        return 'Partially Paid';
      case 'OVERDUE':
        return 'Overdue';
      case 'DUE':
        return 'Due';
      default:
        return status ? String(status) : '—';
    }
  }

  statusTone(status: BillingPeriodStatus | string | null | undefined): string {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'info';
      case 'OVERDUE':
        return 'danger';
      case 'DUE':
        return 'warning';
      default:
        return 'muted';
    }
  }
}
