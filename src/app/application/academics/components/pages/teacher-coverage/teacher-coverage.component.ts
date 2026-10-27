import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { PermissionService } from '../../../../../core/services/permission.service';
import { extractApiError } from '../../../../../shared/utils/api-error.util';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { AcademicGroupDto } from '../../../models/academic-groups.model';
import {
  CoverageBoard,
  CoverageCandidate,
  CoverageChange,
  CoveragePreview,
  CoverageRow,
  CoverageRowStatus,
  CoverageScope
} from '../../../models/teacher-coverage.model';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicGroupsApiService } from '../../../services/academic-groups-api.service';
import { TeacherCoverageApiService } from '../../../services/teacher-coverage-api.service';

export const TEACHER_COVERAGE_RESOURCE = 'ACADEMICS_TEACHER_ALLOCATION';

type MetricFilter = 'NONE' | 'REQUIRING' | 'FULL' | 'WARNINGS';

@Component({
  selector: 'app-teacher-coverage-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DialogModule, DropdownModule, SaasPageHeaderComponent],
  templateUrl: './teacher-coverage.component.html',
  styleUrls: ['./teacher-coverage.component.scss']
})
export class TeacherCoveragePageComponent implements OnInit, OnDestroy {
  private readonly api = inject(TeacherCoverageApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly groupsApi = inject(AcademicGroupsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly permissions = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = 10;
  readonly resource = TEACHER_COVERAGE_RESOURCE;

  yearOptions: { label: string; value: number }[] = [];
  groupOptions: { label: string; value: number }[] = [];
  yearId: number | null = null;
  groupId: number | null = null;

  board: CoverageBoard | null = null;
  loading = false;
  boardError: string | null = null;

  scope: CoverageScope = 'ALL_SECTIONS';
  selectedSectionIds: number[] = [];

  searchTerm = '';
  subjectFilter: number | null = null;
  statusFilter: CoverageRowStatus | 'ALL' = 'ALL';
  teacherFilter: number | null = null;
  metricFilter: MetricFilter = 'NONE';
  page = 1;

  pending: CoverageChange[] = [];
  /** Human-readable pending label per subject, shown in the table until the change is saved. */
  pendingLabels = new Map<number, string>();
  saving = false;
  formError: string | null = null;

  assignRow: CoverageRow | null = null;
  assignOpen = false;
  candidates: CoverageCandidate[] = [];
  candidatesLoading = false;
  selectedCandidateId: number | null = null;
  assignScope: CoverageScope = 'ALL_SECTIONS';
  assignSectionIds: number[] = [];
  replaceOverrides = false;
  assignError: string | null = null;

  preview: CoveragePreview | null = null;
  previewOpen = false;

  ngOnInit(): void {
    this.pageHeader.setPageHeader({
      subtitle: 'Assign teachers to subjects for academic groups and manage workload and conflicts.',
      crumbs: [
        { label: 'Academics', link: ['/app/academics/overview'] },
        { label: 'Teacher Allocation' }
      ]
    });

    const params = this.route.snapshot.queryParamMap;
    const yearParam = Number(params.get('academicYearId')) || null;
    const groupParam = Number(params.get('academicGroupId')) || null;

    this.yearApi.search().subscribe({
      next: (years: AcademicYearDto[]) => {
        this.yearOptions = years.map((y) => ({ label: y.name, value: y.academicYearId }));
        this.yearId = yearParam ?? years[0]?.academicYearId ?? null;
        this.loadGroups(groupParam);
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Unable to load academic years' })
    });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  get canManage(): boolean {
    return this.permissions.canManage(this.resource);
  }

  get editable(): boolean {
    return this.canManage && !!this.board && !this.board.yearReadOnly && !this.saving;
  }

  get hasPending(): boolean {
    return this.pending.length > 0;
  }

  get sectionOptions() {
    return this.board?.sections ?? [];
  }

  get subjectOptions(): { label: string; value: number }[] {
    return (this.board?.rows ?? []).map((r) => ({ label: r.subjectName, value: r.mappingId }));
  }

  get teacherOptions(): { label: string; value: number }[] {
    const seen = new Map<number, string>();
    for (const row of this.board?.rows ?? []) {
      for (const section of row.sections) {
        if (section.teacher) seen.set(section.teacher.staffId, section.teacher.name);
      }
      if (row.assignedTeacher) seen.set(row.assignedTeacher.staffId, row.assignedTeacher.name);
    }
    return [...seen.entries()].map(([value, label]) => ({ label, value }));
  }

  get filteredRows(): CoverageRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    return (this.board?.rows ?? []).filter((row) => {
      if (term && !`${row.subjectName} ${row.subjectCode}`.toLowerCase().includes(term)) return false;
      if (this.subjectFilter !== null && row.mappingId !== this.subjectFilter) return false;
      if (this.statusFilter !== 'ALL' && row.status !== this.statusFilter) return false;
      if (this.teacherFilter !== null && !row.sections.some((s) => s.teacher?.staffId === this.teacherFilter)) return false;
      switch (this.metricFilter) {
        case 'REQUIRING': return row.status !== 'ASSIGNED';
        case 'FULL': return row.status === 'ASSIGNED';
        case 'WARNINGS': return row.workloadStatus === 'EXCEEDS_LIMIT';
        default: return true;
      }
    });
  }

  get pagedRows(): CoverageRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get hasFilters(): boolean {
    return !!this.searchTerm.trim() || this.subjectFilter !== null || this.statusFilter !== 'ALL'
      || this.teacherFilter !== null || this.metricFilter !== 'NONE';
  }

  get changeCount(): number {
    return this.pending.length;
  }

  // ───── Context ─────

  onYearChange(): void {
    this.groupId = null;
    this.board = null;
    this.pending = [];
    this.groupOptions = [];
    this.loadGroups(null);
  }

  onGroupChange(): void {
    this.pending = [];
    this.metricFilter = 'NONE';
    this.page = 1;
    this.loadBoard();
  }

  setScope(scope: CoverageScope): void {
    if (scope === this.scope) return;
    if (this.pending.length > 0 && !window.confirm('Switching the section scope discards unsaved teacher changes. Continue?')) {
      return;
    }
    this.pending = [];
    this.scope = scope;
  }

  toggleSelectedSection(sectionId: number): void {
    this.selectedSectionIds = this.selectedSectionIds.includes(sectionId)
      ? this.selectedSectionIds.filter((id) => id !== sectionId)
      : [...this.selectedSectionIds, sectionId];
  }

  private loadGroups(preselectGroupId: number | null): void {
    if (!this.yearId) return;
    this.groupsApi.getDashboard(this.yearId).subscribe({
      next: (dash) => {
        this.groupOptions = (dash.academicGroups ?? [])
          .filter((g: AcademicGroupDto) => g.active !== false)
          .map((g: AcademicGroupDto) => ({
            label: `${g.name}${g.code ? ` (${g.code})` : ''}`,
            value: g.academicGroupId
          }));
        if (preselectGroupId && this.groupOptions.some((g) => g.value === preselectGroupId)) {
          this.groupId = preselectGroupId;
          this.loadBoard();
        } else if (this.groupId == null && this.groupOptions.length) {
          this.groupId = this.groupOptions[0].value;
          this.loadBoard();
        }
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Unable to load academic groups' })
    });
  }

  private loadBoard(): void {
    if (!this.yearId || !this.groupId) {
      this.board = null;
      return;
    }
    this.pendingLabels.clear();
    this.loading = true;
    this.boardError = null;
    this.api.board(this.yearId, this.groupId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (board) => {
        this.board = board;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.boardError = extractApiError(err, 'Unable to load teacher allocation.').message;
        this.cdr.markForCheck();
      }
    });
  }

  // ───── Metrics and filters ─────

  selectMetric(metric: MetricFilter): void {
    this.metricFilter = this.metricFilter === metric ? 'NONE' : metric;
    this.page = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.subjectFilter = null;
    this.statusFilter = 'ALL';
    this.teacherFilter = null;
    this.metricFilter = 'NONE';
    this.page = 1;
  }

  onFilterChange(): void {
    this.page = 1;
  }

  // ───── Assignment ─────

  openAssign(row: CoverageRow): void {
    if (!this.yearId || !this.groupId) return;
    this.assignRow = row;
    this.assignScope = this.scope;
    this.assignSectionIds = this.scope === 'SELECTED_SECTIONS' ? [...this.selectedSectionIds] : [];
    this.selectedCandidateId = row.assignedTeacher?.staffId ?? null;
    this.replaceOverrides = false;
    this.assignError = null;
    this.candidates = [];
    this.assignOpen = true;
    this.candidatesLoading = true;
    this.api.candidates(this.yearId, this.groupId, row.mappingId).subscribe({
      next: (list) => {
        this.candidates = list;
        this.candidatesLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.candidatesLoading = false;
        this.assignError = extractApiError(err, 'Unable to load teachers.').message;
        this.cdr.markForCheck();
      }
    });
  }

  toggleAssignSection(sectionId: number): void {
    this.assignSectionIds = this.assignSectionIds.includes(sectionId)
      ? this.assignSectionIds.filter((id) => id !== sectionId)
      : [...this.assignSectionIds, sectionId];
  }

  get overriddenSectionsForAssign(): string[] {
    if (!this.assignRow) return [];
    return this.assignRow.sections.filter((s) => s.source === 'OVERRIDE').map((s) => s.sectionName);
  }

  confirmAssign(): void {
    if (!this.assignRow) return;
    if (this.selectedCandidateId === null) {
      this.assignError = 'Select a teacher.';
      return;
    }
    if (this.assignScope === 'SELECTED_SECTIONS' && this.assignSectionIds.length === 0) {
      this.assignError = 'Select at least one section.';
      return;
    }
    const mappingId = this.assignRow.mappingId;
    const change: CoverageChange = this.assignScope === 'ALL_SECTIONS'
      ? { mappingId, action: 'ASSIGN_GROUP', staffId: this.selectedCandidateId, sectionIds: [], replaceOverrides: this.replaceOverrides }
      : { mappingId, action: 'ASSIGN_SECTIONS', staffId: this.selectedCandidateId, sectionIds: [...this.assignSectionIds], replaceOverrides: false };
    this.pending = [...this.pending.filter((c) => !(c.mappingId === mappingId && c.action === change.action
      && (change.action === 'ASSIGN_GROUP' || JSON.stringify(c.sectionIds) === JSON.stringify(change.sectionIds)))), change];
    const name = this.candidates.find((c) => c.staffId === this.selectedCandidateId)?.name ?? 'Teacher';
    this.pendingLabels.set(mappingId, change.action === 'ASSIGN_GROUP' ? `${name} · all sections` : `${name} · ${change.sectionIds.length} section(s)`);
    this.assignOpen = false;
    this.messages.add({ severity: 'info', summary: 'Change staged', detail: 'Save Allocation to apply it.' });
  }

  clearGroupTeacher(row: CoverageRow): void {
    this.pending = [...this.pending.filter((c) => c.mappingId !== row.mappingId), {
      mappingId: row.mappingId, action: 'CLEAR_GROUP', staffId: null, sectionIds: [], replaceOverrides: false
    }];
    this.pendingLabels.set(row.mappingId, 'Teacher will be cleared');
  }

  pendingLabel(mappingId: number): string | null {
    return this.pendingLabels.get(mappingId) ?? null;
  }

  removePending(index: number): void {
    const removed = this.pending[index];
    if (removed) this.pendingLabels.delete(removed.mappingId);
    this.pending = this.pending.filter((_, i) => i !== index);
  }

  describeChange(change: CoverageChange): string {
    const row = this.board?.rows.find((r) => r.mappingId === change.mappingId);
    const subject = row?.subjectName ?? `Subject ${change.mappingId}`;
    const teacher = this.candidates.find((c) => c.staffId === change.staffId)?.name ?? '';
    switch (change.action) {
      case 'ASSIGN_GROUP': return `${subject}: ${teacher} for all sections${change.replaceOverrides ? ' (replacing section teachers)' : ''}`;
      case 'ASSIGN_SECTIONS': return `${subject}: ${teacher} for ${change.sectionIds.length} selected section(s)`;
      case 'CLEAR_GROUP': return `${subject}: clear the group teacher`;
      default: return `${subject}: clear section teachers`;
    }
  }

  // ───── Save ─────

  discardPending(): void {
    this.pending = [];
    this.pendingLabels.clear();
    this.formError = null;
  }

  requestSave(): void {
    if (!this.yearId || !this.groupId || this.pending.length === 0) return;
    this.formError = null;
    this.saving = true;
    const request = { academicGroupId: this.groupId, changes: this.pending, confirmImpact: false };
    this.api.preview(this.yearId, request).subscribe({
      next: (preview) => {
        this.saving = false;
        this.preview = preview;
        this.previewOpen = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extractApiError(err, 'The changes could not be checked. Your edits are still here.').message;
        this.cdr.markForCheck();
      }
    });
  }

  confirmPreview(): void {
    this.previewOpen = false;
    this.commit(true);
  }

  private commit(confirmImpact: boolean): void {
    if (!this.yearId || !this.groupId) return;
    this.saving = true;
    this.formError = null;
    this.api.save(this.yearId, { academicGroupId: this.groupId, changes: this.pending, confirmImpact }).subscribe({
      next: (board) => {
        this.saving = false;
        this.board = board;
        this.pending = [];
        this.pendingLabels.clear();
        this.messages.add({ severity: 'success', summary: 'Teacher allocation saved' });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extractApiError(err, 'The allocation was not saved. Your edits are still here.').message;
        this.cdr.markForCheck();
      }
    });
  }

  statusLabel(status: CoverageRowStatus): string {
    return status === 'ASSIGNED' ? 'Assigned' : status === 'PARTIAL' ? 'Partially assigned' : 'Unassigned';
  }

  workloadLabel(status: string | null): string {
    switch (status) {
      case 'EXCEEDS_LIMIT': return 'Over capacity';
      case 'AT_CAPACITY': return 'At capacity';
      case 'LIMITED': return 'Near capacity';
      case 'AVAILABLE': return 'Available';
      default: return '';
    }
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  sectionScopeLabel(row: CoverageRow): string {
    if (!this.board?.hasSections) return 'Whole group';
    if (row.status === 'PARTIAL') return `${row.sectionsAssigned} of ${row.sectionsTotal} sections assigned`;
    if (row.sectionsTotal === this.board.sections.length) return 'All Sections';
    return `${row.sectionsTotal} of ${this.board.sections.length} sections`;
  }

  trackRow(_: number, row: CoverageRow): number {
    return row.mappingId;
  }

  setPage(page: number): void {
    this.page = Math.min(Math.max(1, page), this.pageCount);
  }
}
