import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { AppGridTableToggleComponent, AppListViewMode } from '../../../../shared/ui/app-list';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';

import {
  StudentDirectoryCard,
  StudentKpi,
  StudentSearchRequest
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService, PageEnvelope } from '../../services/students-workspace.service';
import { AddStudentDrawerComponent } from '../add-student/add-student-drawer.component';
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

@Component({
  selector: 'app-students-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    PaginatorModule,
    AppGridTableToggleComponent,
    AvatarComponent,
    SkeletonComponent,
    AddStudentDrawerComponent,
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

  loading = true;
  searching = false;
  errorMessage = '';

  view: AppListViewMode = 'grid';

  // ---- Add Student Drawer ----
  showAddDrawer = false;

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
  activeKpi: keyof StudentKpi | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = 20;
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
    this.loadAll();
  }

  loadAll(): void {
    this.pageIndex = 0;
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
    this.loading = true;
    this.searching = true;
    this.api.search(this.filter, this.pageIndex, this.pageSize, this.sortField)
      .pipe(finalize(() => {
        this.loading = false;
        this.searching = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (page: PageEnvelope<StudentDirectoryCard>) => {
          this.students = page.content;
          this.totalElements = page.totalElements;
          this.errorMessage = '';
        },
        error: () => { this.errorMessage = 'Search failed. Please retry.'; }
      });
  }

  onPageChange(event: any): void {
    this.pageIndex = event.page;
    this.pageSize = event.rows;
    this.runSearch();
  }

  onSortChange(field: string): void {
    this.sortField = field;
    this.pageIndex = 0;
    this.runSearch();
  }

  toggleKpiFilter(tile: KpiTile): void {
    if (tile.key === 'alumniCount') {
      this.router.navigate(['/app/students/alumni']);
      return;
    }
    if (this.activeKpi === tile.key) {
      this.activeKpi = null;
      this.filter = {};
    } else {
      this.activeKpi = tile.key;
      this.filter = { ...this.filter, ...(tile.filter ?? {}) };
    }
    this.runSearch();
  }

  clearFilters(): void {
    this.filter = {};
    this.activeKpi = null;
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
    this.pageIndex = 0;
    this.runSearch();
  }

  // ---- Profile navigation ----
  openProfile(s: StudentDirectoryCard, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/app/students/profile', s.studentId]);
  }

  // ---- Add Student Drawer ----
  openAddDrawer(): void {
    this.showAddDrawer = true;
  }

  closeAddDrawer(): void {
    this.showAddDrawer = false;
  }

  onStudentAdded(): void {
    this.showAddDrawer = false;
    this.loadAll();
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
}


