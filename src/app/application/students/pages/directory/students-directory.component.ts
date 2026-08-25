import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { ListQuerySession } from '../../../../shared/utils/list-query.session';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';

import {
  StudentDirectoryCard,
  StudentKpi,
  StudentSearchRequest
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService, PageEnvelope } from '../../services/students-workspace.service';
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
    SkeletonComponent,
    TcTranslatePipe,
    EmptyStateComponent
  ],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './students-directory.component.html'
})
export class StudentsDirectoryComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly query = new ListQuerySession();

  loading = true;
  refreshing = false;
  hasLoaded = false;
  searching = false;
  errorMessage = '';

  view: AppListViewMode = this.viewPrefs.globalDefault();

  // ---- Bulk Import ----
  showImport = false;
  importStep: 'upload' | 'result' = 'upload';
  importFile: File | null = null;
  importLoading = false;
  importResult: { total: number; success: number; failed: number } | null = null;
  importJobId = '';
  importError = '';

  // ---- More menu per card ----
  openMoreMenuId: number | null = null;

  kpi: StudentKpi = {
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    newAdmissionsThisYear: 0,
    alumniCount: 0
  };

  students: StudentDirectoryCard[] = [];
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

  readonly kpiTiles: KpiTile[] = [
    { key: 'totalStudents',         label: 'Total Students',  icon: 'pi-users',           hint: 'Across all classes',     tone: 'info' },
    { key: 'activeStudents',        label: 'Active',          icon: 'pi-check-circle',    hint: 'Currently enrolled',     tone: 'success', filter: { status: 'ACTIVE' } },
    { key: 'inactiveStudents',      label: 'Inactive',        icon: 'pi-times-circle',    hint: 'Disabled or left',       tone: 'warning', filter: { status: 'INACTIVE' } },
    { key: 'alumniCount',           label: 'Alumni',          icon: 'pi-graduation-cap',  hint: 'Past graduates',         tone: 'neutral' }
  ];

  get classSelectOptions(): FilterOption<string>[] {
    return this.classOptions.map(option => ({ label: option.label, value: String(option.id) }));
  }

  get sectionSelectOptions(): FilterOption<string>[] {
    return this.sectionOptions.map(option => ({ label: option.label, value: String(option.id) }));
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
      classId: this.filter.classId,
      sectionId: this.filter.sectionId,
      status: this.filter.status
    };
    this.loadAll(!saved);
  }

  loadAll(resetPage = true): void {
    if (resetPage) this.pageIndex = 0;
    this.api.kpi().subscribe(kpi => {
      this.kpi = kpi;
      this.cdr.markForCheck();
    });
    this.api.listClasses().subscribe(classes => {
      this.classOptions = classes.map(c => ({ id: c.id, label: c.label }));
      this.cdr.markForCheck();
    });
    if (this.filter.classId) {
      this.api.listSectionsByClass(Number(this.filter.classId)).subscribe(sections => {
        this.sectionOptions = sections.map(s => ({ id: s.id, label: s.label }));
        const incoming = this.filter.sectionId;
        if (incoming && !this.sectionOptions.some(s => String(s.id) === String(incoming))) {
          this.filter.sectionId = null;
        }
        this.runSearch();
        this.cdr.markForCheck();
      });
      return;
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
      classId: this.filter.classId,
      sectionId: this.filter.sectionId,
      status: this.filter.status
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
    if (tile.key === 'alumniCount') {
      this.router.navigate(['/app/students/alumni']);
      return;
    }
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
  }

  closeImport(): void { this.showImport = false; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.importFile = input.files[0];
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
      error: () => {
        const headers = [
          'Admission Number', 'First Name', 'Middle Name', 'Last Name',
          'Gender', 'Date Of Birth', 'Mobile', 'Email',
          'Academic Year', 'Class Code', 'Section Code', 'Roll Number',
          'Father Name', 'Father Mobile', 'Mother Name', 'Mother Mobile',
          'Address', 'Blood Group', 'Remarks'
        ].join(',');
        const sample = ['ADM001', 'Rahul', '', 'Sharma', 'Male', '2010-05-15',
          '9876543210', 'rahul@example.com', '2025-2026', 'CLS6', 'SEC-A', '1',
          'Rajesh Sharma', '9876543211', 'Priya Sharma', '9876543212',
          '45 Green Park, New Delhi', 'B+', ''].join(',');
        const blob = new Blob([headers + '\n' + sample], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Student_Import_Template.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
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
          if (result.failed > 0) this.loadAll();
        },
        error: () => { this.importError = 'Import failed. Please check the file format and retry.'; }
      });
  }

  downloadErrorReport(): void {
    if (!this.importJobId) {
      const content = 'Row,Error\n5,Invalid date of birth format\n18,Class code not found';
      const blob = new Blob([content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Import_Error_Report.csv';
      a.click();
      URL.revokeObjectURL(url);
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
    // MOCK: Trigger download with current filter params
    const params = new URLSearchParams();
    if (this.filter.keyword) params.set('keyword', this.filter.keyword);
    if (this.filter.classId) params.set('classId', this.filter.classId);
    if (this.filter.status) params.set('status', this.filter.status);
    // In production, this would call a backend export endpoint
    alert('Export triggered. File will be downloaded shortly.');
  }

  // ---- More menu ----
  toggleMoreMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.openMoreMenuId = this.openMoreMenuId === id ? null : id;
  }

  closeMoreMenu(): void { this.openMoreMenuId = null; }

  transferStudent(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    this.openMoreMenuId = null;
    this.router.navigate(['/app/students/transfers']);
  }

  deactivateStudent(s: StudentDirectoryCard, event: Event): void {
    event.stopPropagation();
    this.openMoreMenuId = null;
    if (confirm(`Deactivate ${s.fullName}?`)) {
      this.api.updateStudentStatus(s.studentId, 'INACTIVE').subscribe({
        next: () => this.loadAll(),
        error: () => { this.errorMessage = 'Could not deactivate student.'; this.cdr.markForCheck(); }
      });
    }
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


