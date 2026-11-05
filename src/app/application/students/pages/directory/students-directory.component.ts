import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { UiConfirmService } from '../../../../core/feedback/ui-confirm.service';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { ListQuerySession } from '../../../../shared/utils/list-query.session';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { KpiCardComponent, KpiGroupComponent } from '../../../../shared/ui/kpi';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { SoftRefreshKeys, SoftRefreshService, TcPageSkeletonComponent, ListSnapshotCache } from '../../../../shared/ui/loading';

import {
  StudentDirectoryCard,
  StudentKpi,
  StudentSearchRequest
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService, PageEnvelope, StudentImportPreview } from '../../services/students-workspace.service';
import { TcTranslatePipe } from '../../../../shared/pipes/tc-translate.pipe';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

interface KpiTile {
  key: keyof StudentKpi;
  label: string;
  icon: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  filter?: Partial<StudentSearchRequest>;
}

interface SelectOption {
  id: number;
  label: string;
}

interface FilterOption<T = string | null> {
  label: string;
  value: T;
}

const LIST_KEY = 'students.directory.view';

interface StudentsDirectorySnapshot {
  students: StudentDirectoryCard[];
  totalElements: number;
  kpi: StudentKpi;
}

@Component({
  selector: 'app-students-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent,
    AvatarComponent,
    TcPageSkeletonComponent,
    TcTranslatePipe,
    EmptyStateComponent,
    KpiCardComponent,
    KpiGroupComponent,
    SaasPageHeaderComponent
  ],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './students-directory.component.html'
})
export class StudentsDirectoryComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogs = inject(UiConfirmService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly softRefresh = inject(SoftRefreshService);
  private readonly snapshots = inject(ListSnapshotCache);
  private readonly query = new ListQuerySession();

  loading = true;
  refreshing = false;
  hasLoaded = false;
  searching = false;
  errorMessage = '';

  view: AppListViewMode = this.viewPrefs.globalDefault();

  // ---- Bulk Import ----
  showImport = false;
  importStep: 'upload' | 'preview' | 'result' = 'upload';
  importFile: File | null = null;
  importLoading = false;
  importPreview: StudentImportPreview | null = null;
  importResult: { total: number; success: number; failed: number } | null = null;
  importJobId = '';
  importError = '';

  // ---- More menu per card ----
  openMoreMenuId: number | null = null;

  kpi: StudentKpi = {
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    unassignedStudents: 0
  };

  students: StudentDirectoryCard[] = [];
  academicYearOptions: SelectOption[] = [];
  classOptions: SelectOption[] = [];
  sectionOptions: SelectOption[] = [];

  filter: StudentSearchRequest = {};
  private appliedFilter: StudentSearchRequest = {};
  private appliedSort = 'firstName,asc';
  activeKpi: keyof StudentKpi | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly pageSizeOptions = UI_PAGINATION.options;
  totalElements = 0;
  sortField = 'firstName,asc';

  readonly sortOptions: FilterOption<string>[] = [
    { label: 'Name A–Z', value: 'firstName,asc' },
    { label: 'Name Z–A', value: 'firstName,desc' },
    { label: 'Newest First', value: 'enrollmentDate,desc' }
  ];

  readonly statusOptions: FilterOption<'ACTIVE' | 'INACTIVE'>[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
  ];

  readonly assignedOptions: FilterOption<boolean | null>[] = [
    { label: 'All placements', value: null },
    { label: 'Assigned', value: true },
    { label: 'Unassigned', value: false }
  ];

  readonly kpiTiles: KpiTile[] = [
    { key: 'totalStudents',         label: 'Total Students',  icon: 'pi-users',           hint: 'Across all classes',     tone: 'info' },
    { key: 'activeStudents',        label: 'Active',          icon: 'pi-check-circle',    hint: 'Currently enrolled',     tone: 'success', filter: { status: 'ACTIVE' } },
    { key: 'inactiveStudents',      label: 'Inactive',        icon: 'pi-times-circle',    hint: 'Disabled or left',       tone: 'warning', filter: { status: 'INACTIVE' } },
    { key: 'unassignedStudents',    label: 'Unassigned',      icon: 'pi pi-user-minus',   hint: 'No active enrollment',   tone: 'neutral', filter: { assigned: false } }
  ];

  get classSelectOptions(): FilterOption<string>[] {
    return this.classOptions.map(option => ({ label: option.label, value: String(option.id) }));
  }

  get sectionSelectOptions(): FilterOption<string>[] {
    return this.sectionOptions.map(option => ({ label: option.label, value: String(option.id) }));
  }

  get hasContextualQuery(): boolean {
    return !!(
      this.filter.keyword?.trim() ||
      this.appliedFilter.academicYearId ||
      this.appliedFilter.classId ||
      this.appliedFilter.sectionId ||
      this.appliedFilter.status ||
      this.appliedFilter.assigned != null ||
      this.activeKpi
    );
  }

  get contextualResultText(): string {
    if (this.totalElements <= 0) {
      return 'No students found';
    }
    const suffix = this.totalElements === 1 ? 'student' : 'students';
    if (this.students.length >= this.totalElements) {
      return `${this.totalElements} ${suffix} found`;
    }
    return `Showing ${this.students.length} of ${this.totalElements} ${suffix}`;
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const classId = qp.get('classId');
    const sectionId = qp.get('sectionId');
    if (classId) this.filter.classId = classId;
    if (sectionId) this.filter.sectionId = sectionId;
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.pageIndex = saved.page ?? this.pageIndex;
      this.pageSize = saved.size ?? this.pageSize;
      this.view = this.viewPrefs.initialView(saved.view);
      if (saved.search) this.filter = { ...this.filter, keyword: saved.search };
      if (saved.sort) {
        this.sortField = saved.sort;
        this.appliedSort = saved.sort;
      }
    }
    this.appliedFilter = {
      academicYearId: this.filter.academicYearId,
      classId: this.filter.classId,
      sectionId: this.filter.sectionId,
      status: this.filter.status,
      assigned: this.filter.assigned
    };

    // Soft return from Add Student (or other mutations): restore snapshot + refresh in place.
    const soft = this.softRefresh.consume(SoftRefreshKeys.studentsDirectory);
    const snap = this.snapshots.get<StudentsDirectorySnapshot>(LIST_KEY);
    if (soft && snap) {
      this.students = snap.students;
      this.totalElements = snap.totalElements;
      this.kpi = snap.kpi;
      this.hasLoaded = true;
      this.loading = false;
      this.loadAll(true);
      return;
    }

    this.loadAll(!saved);
  }

  loadAll(resetPage = true): void {
    if (resetPage) this.pageIndex = 0;
    this.api.kpi().subscribe(kpi => {
      this.kpi = kpi;
      const snap = this.snapshots.get<StudentsDirectorySnapshot>(LIST_KEY);
      if (snap) {
        this.snapshots.set<StudentsDirectorySnapshot>(LIST_KEY, { ...snap, kpi });
      }
      this.cdr.markForCheck();
    });
    this.api.listAcademicYears().subscribe(years => {
      this.academicYearOptions = years.map(year => ({ id: year.id, label: year.label }));
      this.cdr.markForCheck();
    });
    if (this.filter.academicYearId) {
      this.loadClassesForYear(Number(this.filter.academicYearId));
    } else if (this.filter.classId) {
      this.api.listClasses().subscribe(classes => {
        this.classOptions = classes.map(c => ({ id: c.id, label: c.label }));
        this.loadSectionsForClass(Number(this.filter.classId));
      });
    }
    this.runSearch();
  }

  runSearch(): void {
    const requestId = this.query.beginRequest();
    this.refreshing = true;
    this.searching = true;
    if (!this.hasLoaded) {
      this.loading = true;
    }
    const request: StudentSearchRequest = {
      ...this.appliedFilter,
      keyword: this.filter.keyword
    };
    this.api.search(request, this.pageIndex, this.pageSize, this.appliedSort)
      .pipe(finalize(() => {
        if (!this.query.isCurrent(requestId)) {
          return;
        }
        this.loading = false;
        this.refreshing = false;
        this.searching = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (page: PageEnvelope<StudentDirectoryCard>) => {
          if (!this.query.isCurrent(requestId)) {
            return;
          }
          this.students = page.content;
          this.totalElements = page.totalElements;
          this.errorMessage = '';
          this.snapshots.set<StudentsDirectorySnapshot>(LIST_KEY, {
            students: this.students,
            totalElements: this.totalElements,
            kpi: this.kpi
          });
        },
        error: () => {
          if (!this.query.isCurrent(requestId)) {
            return;
          }
          this.errorMessage = 'Search failed. Please retry.';
        }
      });
  }

  applyQuery(): void {
    this.pageIndex = 0;
    this.runSearch();
  }

  applyFilters(): void {
    this.appliedFilter = {
      academicYearId: this.filter.academicYearId,
      classId: this.filter.classId,
      sectionId: this.filter.sectionId,
      status: this.filter.status,
      assigned: this.filter.assigned
    };
    this.appliedSort = this.sortField;
    this.pageIndex = 0;
    this.runSearch();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.pageIndex = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.pageIndex = 0;
    }
    this.runSearch();
  }

  onSearchTermChange(value: string): void {
    this.filter = { ...this.filter, keyword: value };
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.view = mode;
    this.cdr.markForCheck();
  }

  onSortChange(field: string): void {
    this.sortField = field;
  }

  toggleKpiFilter(tile: KpiTile): void {
    if (this.activeKpi === tile.key) {
      this.activeKpi = null;
      this.filter = { keyword: this.filter.keyword };
      this.appliedFilter = {};
    } else {
      this.activeKpi = tile.key;
      this.filter = { ...this.filter, ...(tile.filter ?? {}) };
      this.appliedFilter = { ...this.appliedFilter, ...(tile.filter ?? {}) };
    }
    this.pageIndex = 0;
    this.runSearch();
  }

  clearFilters(): void {
    this.filter = {};
    this.appliedFilter = {};
    this.classOptions = [];
    this.sectionOptions = [];
    this.sortField = 'firstName,asc';
    this.appliedSort = this.sortField;
    this.activeKpi = null;
    this.pageIndex = 0;
    this.runSearch();
  }

  onClassChanged(): void {
    this.filter.sectionId = null;
    this.sectionOptions = [];
    if (this.filter.classId) {
      this.api.listSectionsByClass(Number(this.filter.classId)).subscribe(sections => {
        this.sectionOptions = sections.map(s => ({ id: s.id, label: s.label }));
        this.cdr.markForCheck();
      });
    }
  }

  onAcademicYearChanged(): void {
    this.filter.classId = null;
    this.filter.sectionId = null;
    this.classOptions = [];
    this.sectionOptions = [];
    if (this.filter.academicYearId) {
      this.loadClassesForYear(Number(this.filter.academicYearId));
    }
  }

  private loadClassesForYear(academicYearId: number): void {
    this.api.listClasses(academicYearId).subscribe(classes => {
      this.classOptions = classes.map(c => ({ id: c.id, label: c.label }));
      this.cdr.markForCheck();
    });
  }

  private loadSectionsForClass(classId: number): void {
    this.api.listSectionsByClass(classId).subscribe(sections => {
      this.sectionOptions = sections.map(s => ({ id: s.id, label: s.label }));
      const incoming = this.filter.sectionId;
      if (incoming && !this.sectionOptions.some(s => String(s.id) === String(incoming))) {
        this.filter.sectionId = null;
      }
      this.cdr.markForCheck();
    });
  }

  // ---- Profile navigation ----
  openProfile(s: StudentDirectoryCard, event?: Event): void {
    event?.stopPropagation();
    this.persistListContext();
    this.router.navigate(['/app/students/profile', s.studentId]);
  }

  openAddStudent(): void {
    this.router.navigate(['/app/students/add-student']);
  }

  // ---- Bulk Import ----
  openImport(): void {
    this.showImport = true;
    this.importStep = 'upload';
    this.importFile = null;
    this.importError = '';
    this.importResult = null;
    this.importPreview = null;
  }

  closeImport(): void { this.showImport = false; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        this.importFile = null;
        this.importError = 'Choose an .xlsx workbook downloaded from the template action.';
        input.value = '';
        return;
      }
      this.importFile = file;
      this.importError = '';
    }
  }

  downloadTemplate(): void {
    this.api.downloadImportTemplate().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_import_template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.importError = 'Unable to download the Excel template. Check your connection and retry.'; }
    });
  }

  uploadImport(): void {
    if (!this.importFile) {
      this.importError = 'Please select a file to upload.';
      return;
    }
    this.importLoading = true;
    this.api.importStudents(this.importFile)
      .pipe(finalize(() => { this.importLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: result => {
          this.importResult = { total: result.total, success: result.success, failed: result.failed };
          this.importJobId = result.jobId;
          this.importStep = 'result';
          if (result.success > 0) this.loadAll();
        },
        error: () => { this.importError = 'Import failed. Please check the file format and retry.'; }
      });
  }

  previewImport(): void {
    if (!this.importFile) {
      this.importError = 'Choose an .xlsx workbook first.';
      return;
    }
    this.importLoading = true;
    this.importError = '';
    this.api.previewStudentImport(this.importFile)
      .pipe(finalize(() => { this.importLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: preview => {
          this.importPreview = preview;
          this.importStep = 'preview';
        },
        error: err => {
          this.importError = err?.error?.message || 'Unable to preview this workbook.';
        }
      });
  }

  downloadErrorReport(): void {
    if (!this.importJobId) {
      this.importError = 'The import job is unavailable. Re-run the import to retrieve its error report.';
      return;
    }
    this.api.downloadImportErrors(this.importJobId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_import_errors_${this.importJobId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  // ---- Export ----
  exportStudents(): void {
    this.api.exportStudents({ ...this.appliedFilter, keyword: this.filter.keyword })
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = 'students.csv';
          anchor.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.feedback.error('Export failed', 'Unable to export students. Please try again.')
      });
  }

  // ---- More menu ----
  toggleMoreMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.openMoreMenuId = this.openMoreMenuId === id ? null : id;
  }

  closeMoreMenu(): void { this.openMoreMenuId = null; }

  async deactivateStudent(s: StudentDirectoryCard, event: Event): Promise<void> {
    event.stopPropagation();
    this.openMoreMenuId = null;
    const ok = await this.dialogs.confirm({
      header: 'Deactivate student?',
      message: `${s.fullName} will be marked inactive.`,
      acceptLabel: 'Deactivate',
      tone: 'danger'
    });
    if (!ok) return;
    this.api.updateStudentStatus(s.studentId, 'INACTIVE').subscribe({
      next: () => this.loadAll(),
      error: () => { this.errorMessage = 'Could not deactivate student.'; this.cdr.markForCheck(); }
    });
  }

  viewTimeline(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    this.openMoreMenuId = null;
    this.persistListContext();
    this.router.navigate(['/app/students/profile', s.studentId], { queryParams: { tab: 'TIMELINE' } });
  }

  // ---- Contact actions ----
  callPhone(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    if (s.mobile) window.open(`tel:${s.mobile}`, '_self');
  }

  whatsapp(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    if (s.mobile) window.open(`https://wa.me/${(s.mobile || '').replace(/\D/g, '')}`, '_blank');
  }

  emailContact(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    if (s.email) window.open(`mailto:${s.email}`, '_self');
  }

  // ---- Helpers ----
  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
  }

  statusLabel(s: StudentDirectoryCard): string {
    if (s.status) return s.status;
    return s.active ? 'ACTIVE' : 'INACTIVE';
  }

  statusTone(s: StudentDirectoryCard): string {
    const st = this.statusLabel(s);
    switch (st) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'neutral';
      case 'ALUMNI': return 'info';
      default: return 'neutral';
    }
  }

  presenceLabel(s: import('../../models/students-workspace.model').AttendanceStatusToday): string {
    return s === 'PRESENT_TODAY' ? 'Present today'
         : s === 'ABSENT_TODAY'  ? 'Absent today'
         : 'Not marked';
  }

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.pageIndex,
      size: this.pageSize,
      search: this.filter.keyword ?? '',
      sort: this.sortField,
      view: this.view
    });
  }
}


