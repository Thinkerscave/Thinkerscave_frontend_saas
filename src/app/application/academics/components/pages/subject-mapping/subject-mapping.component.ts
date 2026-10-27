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
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';
import { extractApiError } from '../../../../../shared/utils/api-error.util';
import { AcademicYearDto } from '../../../models/academic-year.model';
import { AcademicYearApiService } from '../../../services/academic-year-api.service';
import { AcademicYearContextService } from '../../../../../shared/services/academic-year-context.service';
import { AcademicGroupsApiService } from '../../../services/academic-groups-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import {
  ACADEMICS_SUBJECTS_RESOURCE,
  AvailableSubjectResponse,
  REQUIREMENT_OPTIONS,
  SUBJECT_TYPE_FILTER_OPTIONS,
  SUBJECT_WEEKLY_PERIODS_MAX,
  SUBJECT_WEEKLY_PERIODS_MIN,
  SubjectMappingBoard,
  SubjectMappingImpact,
  SubjectMappingSaveRequest,
  SubjectMappingScope,
  SubjectType,
  TIMETABLE_PREFERENCE_OPTIONS,
  subjectTypeIcon,
  subjectTypeLabel,
  subjectTypeTone
} from '../../../models/subjects-mapping.model';
import {
  DraftRow,
  SubjectRef,
  buildSaveRequest,
  countChanges,
  draftFromSaved,
  draftStatus,
  isValidWeeklyPeriods,
  newDraftRow,
  normalizeSectionIds,
  requirementLabel,
  sectionsLabel,
  validateDraft
} from './subject-mapping.util';

interface ContextOption {
  label: string;
  value: number;
}

const SCOPE_ALL: SubjectMappingScope = 'ALL_SECTIONS';
const SCOPE_SELECTED: SubjectMappingScope = 'SELECTED_SECTIONS';

function toPositiveId(value: string | null): number | null {
  const n = Number(value);
  return value && Number.isInteger(n) && n > 0 ? n : null;
}

@Component({
  selector: 'app-subject-mapping-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    AppPaginatorComponent,
    DropdownModule,
    DialogModule,
    MenuModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './subject-mapping.component.html',
  styleUrls: ['./subject-mapping.component.scss']
})
export class SubjectMappingPageComponent implements OnInit, OnDestroy {
  private readonly subjectsApi = inject(SubjectsMappingApiService);
  private readonly groupsApi = inject(AcademicGroupsApiService);
  private readonly yearApi = inject(AcademicYearApiService);
  private readonly yearCtx = inject(AcademicYearContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly nav = inject(AcademicsNavService);
  private readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_SUBJECTS_RESOURCE;
  readonly requirementOptions = REQUIREMENT_OPTIONS;
  readonly preferenceOptions = TIMETABLE_PREFERENCE_OPTIONS;
  readonly typeOptions = SUBJECT_TYPE_FILTER_OPTIONS;
  readonly pageSizeOptions = [10, 20, 50];
  readonly weeklyMin = SUBJECT_WEEKLY_PERIODS_MIN;
  readonly weeklyMax = SUBJECT_WEEKLY_PERIODS_MAX;
  readonly scopeAll = SCOPE_ALL;
  readonly scopeSelected = SCOPE_SELECTED;
  readonly typeLabel = subjectTypeLabel;
  readonly typeIcon = subjectTypeIcon;
  readonly typeTone = subjectTypeTone;
  readonly requirementLabel = requirementLabel;
  readonly sectionsLabel = sectionsLabel;

  private readonly availableSearch$ = new Subject<string>();

  // Context
  yearOptions: AcademicYearDto[] = [];
  groupOptions: ContextOption[] = [];
  yearId: number | null = null;
  groupId: number | null = null;
  private lastYearId: number | null = null;
  private lastGroupId: number | null = null;
  scope: SubjectMappingScope = SCOPE_ALL;
  selectedSectionIds: number[] = [];
  private preselectedSubjectId: number | null = null;

  // Board and draft
  board: SubjectMappingBoard | null = null;
  boardLoading = false;
  boardError: string | null = null;
  rows: DraftRow[] = [];
  /** Subjects checked in the available list but not yet moved into the mapped table. */
  staged = new Map<number, SubjectRef>();

  // Available subjects
  availableRows: AvailableSubjectResponse[] = [];
  availableTotal = 0;
  availablePage = 0;
  availablePageSize = 10;
  availableQuery = '';
  availableType: SubjectType | null = null;
  availableLoading = false;
  availableError: string | null = null;

  // Save
  saving = false;
  formError: string | null = null;
  impactDialogOpen = false;
  impacts: SubjectMappingImpact[] = [];
  private pendingSave: SubjectMappingSaveRequest | null = null;

  // Row menu and section dialog
  rowMenuItems: MenuItem[] = [];
  sectionsDialogOpen = false;
  private sectionsEditingSubjectId: number | null = null;
  sectionsDraftScope: SubjectMappingScope = SCOPE_ALL;
  sectionsDraftIds: number[] = [];
  sectionsError: string | null = null;

  ngOnInit(): void {
    this.pageHeader.setPageHeader({
      subtitle: 'Assign subjects to an academic group and configure curriculum details.',
      crumbs: [
        { label: 'Academics', link: ['/app/academics/overview'] },
        { label: 'Subjects', link: ['/app/academics/subjects'] },
        { label: 'Subject Mapping' }
      ]
    });
    this.availableSearch$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAvailable(true));

    const params = this.route.snapshot.queryParamMap;
    const yearParam = toPositiveId(params.get('academicYearId'));
    const groupParam = toPositiveId(params.get('academicGroupId'));
    this.preselectedSubjectId = toPositiveId(params.get('subjectId'));

    this.yearApi.search().subscribe({
      next: (years: AcademicYearDto[]) => {
        this.yearOptions = years;
        this.cdr.markForCheck();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Unable to load academic years' })
    });

    if (groupParam) {
      this.groupsApi.getAcademicGroup(groupParam).subscribe({
        next: (group) => {
          this.yearId = yearParam ?? group.academicYearId;
          this.groupId = groupParam;
          this.afterYearChanged(true);
        },
        error: () => {
          this.boardError = 'The requested academic group could not be found.';
          this.cdr.markForCheck();
        }
      });
    } else if (yearParam) {
      this.yearId = yearParam;
      this.afterYearChanged(false);
    } else {
      const contextYear = this.yearCtx.selectedYearId();
      if (contextYear) {
        this.yearId = contextYear;
        this.afterYearChanged(false);
      }
    }
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  // ───── Permissions and gating ─────

  get canManage(): boolean {
    return this.permissions.canManage(this.resource);
  }

  get yearReadOnly(): boolean {
    return !!this.board?.yearReadOnly;
  }

  /** True when the user can change the mapping (board loaded, writable year, write role). */
  get editable(): boolean {
    return this.canManage && !!this.board && !this.yearReadOnly && !this.saving;
  }

  get showMutations(): boolean {
    return this.canManage && !this.yearReadOnly;
  }

  get contextReady(): boolean {
    return this.yearId != null && this.groupId != null;
  }

  get hasSections(): boolean {
    return !!this.board?.hasSections;
  }

  get activeSections() {
    return this.board?.sections ?? [];
  }

  get totalSections(): number {
    return this.activeSections.length;
  }

  get mappedCount(): number {
    return this.rows.filter((row) => !row.removed).length;
  }

  get stagedCount(): number {
    return this.staged.size;
  }

  get changeCount(): number {
    return countChanges(this.rows, this.staged.size);
  }

  get canSave(): boolean {
    return this.editable && this.contextReady && this.changeCount > 0;
  }

  // ───── Context selection ─────

  onYearChange(value: number | null): void {
    if (value === this.lastYearId) return;
    this.guardUnsaved('Change academic year?', () => {
      this.yearId = value;
      this.lastYearId = value;
      this.groupId = null;
      this.lastGroupId = null;
      this.groupOptions = [];
      this.resetDraft();
      this.afterYearChanged(false);
    }, () => {
      this.yearId = this.lastYearId;
      this.cdr.markForCheck();
    });
  }

  onGroupChange(value: number | null): void {
    if (value === this.lastGroupId) return;
    this.guardUnsaved('Change academic group?', () => {
      this.groupId = value;
      this.lastGroupId = value;
      this.resetDraft();
      this.board = null;
      this.boardError = null;
      this.scope = SCOPE_ALL;
      this.selectedSectionIds = [];
      if (value != null) {
        this.loadBoard();
      }
      this.loadAvailable(true);
      this.cdr.markForCheck();
    }, () => {
      this.groupId = this.lastGroupId;
      this.cdr.markForCheck();
    });
  }

  onScopeSelect(next: SubjectMappingScope): void {
    if (!this.editable || next === this.scope) return;
    if (this.changeCount === 0) {
      this.scope = next;
      this.cdr.markForCheck();
      return;
    }
    this.confirm.confirm({
      header: 'Change section scope?',
      message: 'Your unsaved changes stay on this page. The new section scope applies to subjects you add from now on, and existing subject sections are not changed.',
      acceptLabel: 'Change scope',
      accept: () => {
        this.scope = next;
        this.cdr.markForCheck();
      }
    });
  }

  toggleSelectedSection(sectionId: number): void {
    if (!this.editable) return;
    this.selectedSectionIds = this.selectedSectionIds.includes(sectionId)
      ? this.selectedSectionIds.filter((id) => id !== sectionId)
      : normalizeSectionIds([...this.selectedSectionIds, sectionId]);
    this.cdr.markForCheck();
  }

  isSectionSelected(sectionId: number): boolean {
    return this.selectedSectionIds.includes(sectionId);
  }

  backToDirectory(): void {
    this.guardUnsaved('Leave subject mapping?', () => {
      this.nav.back(this.route, ['/app/academics/subjects']);
    }, () => undefined);
  }

  // ───── Loading ─────

  private afterYearChanged(keepGroup: boolean): void {
    this.lastYearId = this.yearId;
    if (this.yearId == null) {
      this.groupOptions = [];
      this.cdr.markForCheck();
      return;
    }
    this.groupsApi.getDashboard(this.yearId).subscribe({
      next: (dash) => {
        this.groupOptions = (dash.academicGroups ?? [])
          .filter((g) => g.active !== false
            || (this.groupId != null && g.academicGroupId === this.groupId))
          .map((g) => ({
            label: `${g.name}${g.code ? ` (${g.code})` : ''}`,
            value: g.academicGroupId
          }));
        if (this.groupId != null && !this.groupOptions.some((o) => o.value === this.groupId)) {
          this.groupId = null;
          this.lastGroupId = null;
        }
        this.cdr.markForCheck();
        if (keepGroup && this.groupId != null) {
          this.lastGroupId = this.groupId;
          this.loadBoard();
          this.loadAvailable(true);
        } else if (this.groupId == null && this.groupOptions.length) {
          this.groupId = this.groupOptions[0].value;
          this.lastGroupId = this.groupId;
          this.loadBoard();
          this.loadAvailable(true);
        }
      },
      error: (err) => this.messages.add({
        severity: 'error',
        summary: 'Unable to load academic groups',
        detail: extractApiError(err, 'Please try again.').message
      })
    });
  }

  loadBoard(): void {
    if (this.groupId == null) return;
    const groupId = this.groupId;
    this.boardLoading = true;
    this.boardError = null;
    this.cdr.markForCheck();
    this.subjectsApi.getMappingBoard(groupId)
      .pipe(finalize(() => {
        this.boardLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (board) => {
          if (groupId !== this.groupId) return;
          this.applyBoard(board, true);
        },
        error: (err) => {
          this.board = null;
          this.boardError = extractApiError(err, 'Unable to load subject mapping. Please try again.').message;
        }
      });
  }

  /** Replaces the baseline with the server board. `fresh` resets the section scope for a new context. */
  private applyBoard(board: SubjectMappingBoard, fresh: boolean): void {
    this.board = board;
    this.rows = (board.mappings ?? []).map(draftFromSaved);
    if (fresh) {
      this.scope = SCOPE_ALL;
      this.selectedSectionIds = [];
      this.stagePreselectedSubject();
    }
    if (!board.hasSections) {
      this.scope = SCOPE_ALL;
    }
    this.cdr.markForCheck();
  }

  /** Preselection from Subject Details: stage the subject once the group is known. */
  private stagePreselectedSubject(): void {
    const subjectId = this.preselectedSubjectId;
    this.preselectedSubjectId = null;
    if (subjectId == null || !this.canManage || this.yearReadOnly) return;
    if (this.rows.some((row) => row.subjectId === subjectId)) return;
    this.subjectsApi.getSubject(subjectId).subscribe({
      next: (subject) => {
        if (!subject.active) {
          this.messages.add({
            severity: 'warn',
            summary: 'Subject is inactive',
            detail: `${subject.name} cannot be added to new mappings.`
          });
          return;
        }
        this.staged.set(subject.subjectId, {
          subjectId: subject.subjectId,
          subjectName: subject.name,
          subjectCode: subject.code,
          subjectType: subject.subjectType,
          subjectActive: subject.active
        });
        this.cdr.markForCheck();
      },
      error: () => undefined
    });
  }

  loadAvailable(reset = false): void {
    if (reset) this.availablePage = 0;
    if (this.groupId == null) {
      this.availableRows = [];
      this.availableTotal = 0;
      this.cdr.markForCheck();
      return;
    }
    const groupId = this.groupId;
    this.availableLoading = true;
    this.availableError = null;
    this.cdr.markForCheck();
    this.subjectsApi.listAvailableSubjects(groupId, {
      q: this.availableQuery.trim() || undefined,
      subjectType: this.availableType,
      page: this.availablePage,
      size: this.availablePageSize
    })
      .pipe(finalize(() => {
        this.availableLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          if (groupId !== this.groupId) return;
          this.availableRows = res.content ?? [];
          this.availableTotal = res.totalElements ?? 0;
        },
        error: (err) => {
          this.availableRows = [];
          this.availableTotal = 0;
          this.availableError = extractApiError(err, 'Unable to load available subjects.').message;
        }
      });
  }

  onAvailableQueryChange(value: string): void {
    this.availableSearch$.next(value ?? '');
  }

  onAvailablePageChange(event: AppPageChangeEvent): void {
    this.availablePage = event.page;
    if (event.rows && event.rows !== this.availablePageSize) {
      this.availablePageSize = event.rows;
      this.availablePage = 0;
    }
    this.loadAvailable(false);
  }

  // ───── Available list staging ─────

  private rowFor(subjectId: number): DraftRow | undefined {
    return this.rows.find((row) => row.subjectId === subjectId);
  }

  isChecked(item: AvailableSubjectResponse): boolean {
    if (this.staged.has(item.subjectId)) return true;
    const row = this.rowFor(item.subjectId);
    return !!row && !row.removed;
  }

  canToggle(item: AvailableSubjectResponse): boolean {
    return this.editable && (item.subjectActive || item.mapped);
  }

  onAvailableToggle(item: AvailableSubjectResponse, checked: boolean): void {
    if (!this.canToggle(item)) return;
    const row = this.rowFor(item.subjectId);
    if (checked) {
      if (row) {
        row.removed = false;
      } else {
        this.staged.set(item.subjectId, {
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          subjectCode: item.subjectCode,
          subjectType: item.subjectType,
          subjectActive: item.subjectActive
        });
      }
    } else if (this.staged.delete(item.subjectId)) {
      // Unstaged before it was ever added.
    } else if (row) {
      if (row.saved) {
        row.removed = true;
      } else {
        this.rows = this.rows.filter((r) => r !== row);
      }
    }
    this.cdr.markForCheck();
  }

  addSelectedSubjects(): void {
    if (!this.editable || this.staged.size === 0) return;
    this.commitStaged();
    this.cdr.markForCheck();
  }

  /** Moves staged subjects into the mapped table with defaults. Returns false when the scope is incomplete. */
  private commitStaged(): boolean {
    if (this.staged.size === 0) return true;
    const sectionIds = this.scope === SCOPE_SELECTED ? normalizeSectionIds(this.selectedSectionIds) : [];
    if (this.scope === SCOPE_SELECTED && sectionIds.length === 0) {
      this.formError = 'Select at least one section for Selected Sections, or switch to All Sections, before adding subjects.';
      this.cdr.markForCheck();
      return false;
    }
    const added = [...this.staged.values()].map((ref) => newDraftRow(ref, this.scope, sectionIds));
    this.rows = [...this.rows, ...added];
    this.staged.clear();
    this.formError = null;
    return true;
  }

  // ───── Mapped table ─────

  isValidWeekly(row: DraftRow): boolean {
    return isValidWeeklyPeriods(row.weeklyPeriods);
  }

  statusLabel(row: DraftRow): string {
    switch (draftStatus(row)) {
      case 'REMOVED': return 'Will be removed';
      case 'NEW': return 'New';
      case 'MODIFIED': return 'Modified';
      default: return 'Mapped';
    }
  }

  statusClass(row: DraftRow): string {
    switch (draftStatus(row)) {
      case 'REMOVED': return 'sub-badge--removed';
      case 'NEW': return 'sub-badge--new';
      case 'MODIFIED': return 'sub-badge--modified';
      default: return 'sub-badge--mapped';
    }
  }

  sectionNamesFor(row: DraftRow): string {
    return this.activeSections
      .filter((section) => row.sectionIds.includes(section.sectionId))
      .map((section) => section.name)
      .join(', ');
  }

  markRowChanged(): void {
    this.cdr.markForCheck();
  }

  onRequirementChanged(row: DraftRow, value: DraftRow['requirement']): void {
    row.requirement = value;
    if (value !== 'OPTIONAL') row.choiceGroup = null;
    this.markRowChanged();
  }

  buildRowMenu(row: DraftRow): void {
    if (!this.showMutations) {
      this.rowMenuItems = [];
      return;
    }
    if (row.removed) {
      this.rowMenuItems = [{ label: 'Undo removal', icon: 'pi pi-undo', command: () => this.undoRemoval(row) }];
      return;
    }
    const items: MenuItem[] = [];
    if (this.hasSections) {
      items.push({ label: 'Edit sections', icon: 'pi pi-th-large', command: () => this.openSectionsDialog(row) });
    }
    items.push({
      label: 'Scheduling preference',
      icon: 'pi pi-clock',
      items: this.preferenceOptions.map((option) => ({
        label: option.label,
        icon: row.timetablePreference === option.value ? 'pi pi-check' : 'pi pi-circle',
        command: () => {
          row.timetablePreference = option.value;
          this.cdr.markForCheck();
        }
      }))
    });
    items.push({ label: 'Remove from mapping', icon: 'pi pi-trash', command: () => this.removeRow(row) });
    this.rowMenuItems = items;
  }

  private removeRow(row: DraftRow): void {
    if (row.saved) {
      row.removed = true;
    } else {
      this.rows = this.rows.filter((r) => r !== row);
    }
    this.cdr.markForCheck();
  }

  private undoRemoval(row: DraftRow): void {
    row.removed = false;
    this.cdr.markForCheck();
  }

  // ───── Section dialog (per subject) ─────

  openSectionsDialog(row: DraftRow): void {
    this.sectionsEditingSubjectId = row.subjectId;
    this.sectionsDraftScope = row.scope;
    this.sectionsDraftIds = [...row.sectionIds];
    this.sectionsError = null;
    this.sectionsDialogOpen = true;
  }

  get sectionsEditingRow(): DraftRow | undefined {
    return this.sectionsEditingSubjectId == null ? undefined : this.rowFor(this.sectionsEditingSubjectId);
  }

  setSectionsDraftScope(scope: SubjectMappingScope): void {
    this.sectionsDraftScope = scope;
    this.sectionsError = null;
    this.cdr.markForCheck();
  }

  toggleSectionsDraft(sectionId: number): void {
    this.sectionsDraftIds = this.sectionsDraftIds.includes(sectionId)
      ? this.sectionsDraftIds.filter((id) => id !== sectionId)
      : normalizeSectionIds([...this.sectionsDraftIds, sectionId]);
    this.sectionsError = null;
    this.cdr.markForCheck();
  }

  isSectionsDraftSelected(sectionId: number): boolean {
    return this.sectionsDraftIds.includes(sectionId);
  }

  applySectionsDraft(): void {
    const row = this.sectionsEditingRow;
    if (!row) return;
    if (this.sectionsDraftScope === SCOPE_SELECTED && this.sectionsDraftIds.length === 0) {
      this.sectionsError = 'Select at least one section, or choose All Sections.';
      this.cdr.markForCheck();
      return;
    }
    row.scope = this.sectionsDraftScope;
    row.sectionIds = this.sectionsDraftScope === SCOPE_SELECTED ? normalizeSectionIds(this.sectionsDraftIds) : [];
    this.sectionsDialogOpen = false;
    this.cdr.markForCheck();
  }

  // ───── Save ─────

  save(): void {
    if (!this.showMutations || this.saving || !this.contextReady || !this.board) return;
    this.formError = null;
    if (!this.commitStaged()) return;
    if (this.changeCount === 0) return;

    const errors = validateDraft({
      academicYearId: this.yearId,
      academicGroupId: this.groupId,
      rows: this.rows,
      activeSectionIds: this.activeSections.map((s) => s.sectionId)
    });
    if (errors.length) {
      this.formError = errors.length === 1 ? errors[0] : `${errors[0]} (${errors.length - 1} more issue${errors.length > 2 ? 's' : ''})`;
      this.cdr.markForCheck();
      return;
    }

    const request = buildSaveRequest(this.yearId!, this.rows);
    const groupId = this.groupId!;
    this.saving = true;
    this.cdr.markForCheck();
    this.subjectsApi.previewMappings(groupId, request).subscribe({
      next: (preview) => {
        if (preview.requiresConfirmation) {
          this.saving = false;
          this.pendingSave = request;
          this.impacts = preview.impacts ?? [];
          this.impactDialogOpen = true;
          this.cdr.markForCheck();
          return;
        }
        this.persist(groupId, request);
      },
      error: (err) => {
        this.saving = false;
        this.formError = extractApiError(err, 'Unable to validate subject mapping. Your changes are still here.').message;
        this.cdr.markForCheck();
      }
    });
  }

  confirmImpactSave(): void {
    if (!this.pendingSave || this.saving || this.groupId == null) return;
    const request: SubjectMappingSaveRequest = { ...this.pendingSave, confirmImpact: true };
    const groupId = this.groupId;
    this.impactDialogOpen = false;
    this.pendingSave = null;
    this.persist(groupId, request);
  }

  cancelImpact(): void {
    this.impactDialogOpen = false;
    this.pendingSave = null;
    this.impacts = [];
    this.cdr.markForCheck();
  }

  private persist(groupId: number, request: SubjectMappingSaveRequest): void {
    const changes = request.upserts.length + request.removedSubjectIds.length;
    this.saving = true;
    this.cdr.markForCheck();
    this.subjectsApi.saveMappings(groupId, request).subscribe({
      next: (board) => {
        this.saving = false;
        if (groupId === this.groupId) {
          this.applyBoard(board, false);
          this.loadAvailable(false);
        }
        this.messages.add({
          severity: 'success',
          summary: 'Subject mapping saved',
          detail: `${changes} change${changes === 1 ? '' : 's'} saved.`
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.formError = extractApiError(err, 'Unable to save subject mapping. Your changes are still here.').message;
        this.cdr.markForCheck();
      }
    });
  }

  // ───── Unsaved-change guard ─────

  private guardUnsaved(header: string, proceed: () => void, revert: () => void): void {
    const count = this.changeCount;
    if (count === 0) {
      proceed();
      return;
    }
    this.confirm.confirm({
      header,
      message: `You have ${count} unsaved change${count === 1 ? '' : 's'}. Continuing will discard ${count === 1 ? 'it' : 'them'}.`,
      acceptLabel: 'Discard changes',
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: 'Keep editing',
      accept: () => {
        this.resetDraft();
        proceed();
      },
      reject: revert
    });
  }

  private resetDraft(): void {
    this.rows = [];
    this.staged.clear();
    this.formError = null;
    this.impactDialogOpen = false;
    this.pendingSave = null;
    this.cdr.markForCheck();
  }
}
