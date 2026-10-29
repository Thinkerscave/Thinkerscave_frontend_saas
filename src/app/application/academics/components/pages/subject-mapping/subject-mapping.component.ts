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
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { EMPTY, Subject, debounceTime, distinctUntilChanged, expand, finalize, reduce } from 'rxjs';
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
  SubjectChoiceMapping,
  SubjectChoiceMappingUpsert,
  SubjectChoiceGroup,
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
  requirementLabel,
  validateDraft
} from './subject-mapping.util';

interface ContextOption {
  label: string;
  value: number;
}

interface ChoiceMappingDraft extends SubjectChoiceMapping {
  saved: SubjectChoiceMapping | null;
  removed: boolean;
  expanded: boolean;
}

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
  readonly typeLabel = subjectTypeLabel;
  readonly typeIcon = subjectTypeIcon;
  readonly typeTone = subjectTypeTone;
  readonly requirementLabel = requirementLabel;

  private readonly availableSearch$ = new Subject<string>();
  choiceGroupOptions: SubjectChoiceGroup[] = [];
  choiceGroupLoading = false;
  choiceGroupError: string | null = null;
  choiceGroupQuery = '';
  selectedChoiceGroupIds = new Set<number>();
  choiceMappings: ChoiceMappingDraft[] = [];
  choiceImpactWarning = false;

  // Context
  yearOptions: AcademicYearDto[] = [];
  groupOptions: ContextOption[] = [];
  yearId: number | null = null;
  groupId: number | null = null;
  private lastYearId: number | null = null;
  private lastGroupId: number | null = null;
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
  selectingAllAvailable = false;
  private allAvailableFilterKey: string | null = null;
  private allAvailableSubjectIds = new Set<number>();
  private allAvailableSelectedIds = new Set<number>();

  // Save
  saving = false;
  impactDialogOpen = false;
  impacts: SubjectMappingImpact[] = [];
  private pendingSave: SubjectMappingSaveRequest | null = null;

  onChoiceGroupToggle(choiceGroupId: number, checked: boolean): void {
    if (checked) this.selectedChoiceGroupIds.add(choiceGroupId);
    else this.selectedChoiceGroupIds.delete(choiceGroupId);
    this.cdr.markForCheck();
  }

  isChoiceGroupSelected(choiceGroupId: number): boolean {
    return this.selectedChoiceGroupIds.has(choiceGroupId);
  }

  get availableChoiceGroups(): SubjectChoiceGroup[] {
    const query = this.choiceGroupQuery.trim().toLowerCase();
    return this.choiceGroupOptions.filter((choiceGroup) =>
      choiceGroup.active
      && (!this.availableType || choiceGroup.subjectType === this.availableType)
      && !this.choiceMappings.some((mapping) => !mapping.removed
        && mapping.choiceGroupId === choiceGroup.subjectChoiceGroupId)
      && (!query || choiceGroup.name.toLowerCase().includes(query)
        || choiceGroup.subjects.some((subject) =>
          subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query))));
  }

  choiceGroupSummary(group: SubjectChoiceGroup): string {
    return group.subjects.slice(0, 3).map((subject) => subject.name).join(', ');
  }

  choiceMappingSummary(mapping: ChoiceMappingDraft): string {
    return mapping.subjects.slice(0, 3).map((subject) => subject.subjectName).join(', ');
  }

  addSelectedChoiceGroups(): void {
    if (!this.editable || !this.selectedChoiceGroupIds.size) return;
    const selected = this.choiceGroupOptions.filter((group) =>
      this.selectedChoiceGroupIds.has(group.subjectChoiceGroupId));
    for (const group of selected) {
      if (this.choiceMappings.some((mapping) => !mapping.removed
        && mapping.choiceGroupId === group.subjectChoiceGroupId)) continue;
      const subjects = group.subjects.map((subject) => ({
        mappingId: 0,
        choiceMappingId: null,
        subjectId: subject.subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectType: group.subjectType,
        subjectActive: subject.active,
        requirement: 'OPTIONAL' as const,
        weeklyPeriods: 1,
        timetablePreference: 'ANY' as const,
        teacherAllocationCount: 0,
        timetableEntryCount: 0
      }));
      this.choiceMappings.push({
        academicGroupChoiceMappingId: 0,
        choiceGroupId: group.subjectChoiceGroupId,
        name: group.name,
        subjectType: group.subjectType,
        weeklyPeriods: 1,
        timetablePreference: 'ANY',
        active: true,
        subjects,
        saved: null,
        removed: false,
        expanded: true
      });
      for (const subject of subjects) this.staged.delete(subject.subjectId);
    }
    this.selectedChoiceGroupIds.clear();
    this.markRowChanged();
  }

  toggleChoiceMapping(mapping: ChoiceMappingDraft): void {
    mapping.expanded = !mapping.expanded;
    this.cdr.markForCheck();
  }

  removeChoiceMapping(mapping: ChoiceMappingDraft): void {
    if (mapping.saved) mapping.removed = true;
    else this.choiceMappings = this.choiceMappings.filter((item) => item !== mapping);
    this.markRowChanged();
  }

  undoChoiceMappingRemoval(mapping: ChoiceMappingDraft): void {
    mapping.removed = false;
    this.markRowChanged();
  }

  isValidChoiceWeekly(mapping: ChoiceMappingDraft): boolean {
    return isValidWeeklyPeriods(mapping.weeklyPeriods);
  }

  isChoiceMappingChanged(mapping: ChoiceMappingDraft): boolean {
    if (!mapping.saved) return true;
    // Members inherit the group workload, so only the group-level fields are editable.
    return Number(mapping.weeklyPeriods) !== Number(mapping.saved.weeklyPeriods)
      || mapping.timetablePreference !== mapping.saved.timetablePreference;
  }

  loadChoiceGroupOptions(): void {
    this.choiceGroupLoading = true;
    this.choiceGroupError = null;
    this.subjectsApi.listSubjectChoiceGroups({ status: 'ACTIVE', page: 0, size: 100 }).pipe(
      expand((result) => result.last ? EMPTY : this.subjectsApi.listSubjectChoiceGroups({
        status: 'ACTIVE', page: result.page + 1, size: 100
      })),
      reduce((all, result) => [...all, ...(result.content ?? [])], [] as SubjectChoiceGroup[]),
      finalize(() => {
        this.choiceGroupLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (groups) => {
        this.choiceGroupOptions = groups;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.choiceGroupError = extractApiError(error, 'Unable to load choice groups.').message;
        this.cdr.markForCheck();
      }
    });
  }

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
    this.loadChoiceGroupOptions();

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

  get mappedCount(): number {
    return this.rows.filter((row) => !row.removed).length
      + this.choiceMappings.filter((mapping) => !mapping.removed).length;
  }

  get totalWeeklyPeriods(): number {
    const standalone = this.rows
      .filter((row) => !row.removed)
      .reduce((total, row) => total + (Number(row.weeklyPeriods) || 0), 0);
    const shared = this.choiceMappings
      .filter((mapping) => !mapping.removed)
      .reduce((total, mapping) => total + (Number(mapping.weeklyPeriods) || 0), 0);
    return standalone + shared;
  }

  get stagedCount(): number {
    return this.staged.size + this.selectedChoiceGroupIds.size;
  }

  get changeCount(): number {
    return countChanges(this.rows, this.staged.size) + this.choiceMappings.filter((mapping) =>
      mapping.removed ? !!mapping.saved : this.isChoiceMappingChanged(mapping)).length;
  }

  get canSave(): boolean {
    return this.editable && this.contextReady && this.changeCount > 0;
  }

  get allAvailableSelected(): boolean {
    return this.allAvailableFilterKey === this.availableFilterKey
      && this.allAvailableSubjectIds.size > 0
      && this.allAvailableSelectedIds.size === this.allAvailableSubjectIds.size;
  }

  get someAvailableSelected(): boolean {
    if (this.allAvailableFilterKey === this.availableFilterKey && this.allAvailableSubjectIds.size > 0) {
      return this.allAvailableSelectedIds.size > 0 && !this.allAvailableSelected;
    }
    return this.availableRows.some((item) => this.isChecked(item));
  }

  private get availableFilterKey(): string {
    return `${this.groupId ?? ''}|${this.availableQuery.trim().toLowerCase()}|${this.availableType ?? ''}`;
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

  /** Replaces the baseline with the server board. */
  private applyBoard(board: SubjectMappingBoard, fresh: boolean): void {
    this.board = board;
    this.rows = (board.mappings ?? []).filter((row) => !row.choiceMappingId).map(draftFromSaved);
    this.choiceMappings = (board.choiceMappings ?? []).map((mapping) => ({
      ...mapping,
      saved: mapping,
      removed: false,
      expanded: false
    }));
    this.selectedChoiceGroupIds.clear();
    if (fresh) {
      this.stagePreselectedSubject();
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
          defaultTimetablePreference: subject.defaultTimetablePreference,
          subjectActive: subject.active
        });
        this.cdr.markForCheck();
      },
      error: () => undefined
    });
  }

  loadAvailable(reset = false): void {
    if (reset) {
      this.availablePage = 0;
      this.clearAllAvailableSelection();
    }
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

  /** One search box drives both the paginated subjects and the client-side choice groups. */
  onAvailableSearchChange(value: string): void {
    this.availableQuery = value ?? '';
    this.choiceGroupQuery = this.availableQuery;
    this.onAvailableQueryChange(this.availableQuery);
    this.cdr.markForCheck();
  }

  onAvailablePageChange(event: AppPageChangeEvent): void {
    this.availablePage = event.page;
    if (event.rows && event.rows !== this.availablePageSize) {
      this.availablePageSize = event.rows;
      this.availablePage = 0;
    }
    this.loadAvailable(false);
  }

  toggleAllAvailable(checked: boolean): void {
    if (!this.editable || this.selectingAllAvailable || this.groupId == null) return;
    const groupId = this.groupId;
    const filterKey = this.availableFilterKey;
    this.selectingAllAvailable = true;
    this.cdr.markForCheck();
    this.loadAllAvailableSubjects(groupId)
      .pipe(finalize(() => {
        this.selectingAllAvailable = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (subjects) => {
          if (groupId !== this.groupId || filterKey !== this.availableFilterKey) return;
          const eligible = subjects.filter((item) => this.canToggle(item));
          this.allAvailableFilterKey = filterKey;
          this.allAvailableSubjectIds = new Set(eligible.map((item) => item.subjectId));
          this.allAvailableSelectedIds = new Set(checked ? this.allAvailableSubjectIds : []);
          for (const item of eligible) {
            if (this.isChecked(item) !== checked) {
              this.applyAvailableToggle(item, checked);
            }
          }
          this.cdr.markForCheck();
        },
        error: (err) => this.messages.add({
          severity: 'error',
          summary: 'Unable to select subjects',
          detail: extractApiError(err, 'Could not load all subjects matching the current filters.').message
        })
      });
  }

  private loadAllAvailableSubjects(groupId: number) {
    const query = {
      q: this.availableQuery.trim() || undefined,
      subjectType: this.availableType
    };
    return this.subjectsApi.listAvailableSubjects(groupId, {
      ...query,
      page: 0,
      size: 100
    }).pipe(
      expand((response) => {
        const nextPage = (response.page ?? response.number ?? 0) + 1;
        return nextPage < response.totalPages
          ? this.subjectsApi.listAvailableSubjects(groupId, { ...query, page: nextPage, size: 100 })
          : EMPTY;
      }),
      reduce((subjects, response) => [...subjects, ...(response.content ?? [])], [] as AvailableSubjectResponse[])
    );
  }

  private clearAllAvailableSelection(): void {
    this.allAvailableFilterKey = null;
    this.allAvailableSubjectIds.clear();
    this.allAvailableSelectedIds.clear();
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
    return this.editable && !this.isChoiceSubject(item.subjectId) && (item.subjectActive || item.mapped);
  }

  isChoiceSubject(subjectId: number): boolean {
    return this.choiceMappings.some((mapping) =>
      mapping.subjects.some((subject) => subject.subjectId === subjectId));
  }

  onAvailableToggle(item: AvailableSubjectResponse, checked: boolean): void {
    if (!this.canToggle(item)) return;
    this.applyAvailableToggle(item, checked);
    if (this.allAvailableFilterKey === this.availableFilterKey && this.allAvailableSubjectIds.has(item.subjectId)) {
      if (checked) this.allAvailableSelectedIds.add(item.subjectId);
      else this.allAvailableSelectedIds.delete(item.subjectId);
    }
    this.cdr.markForCheck();
  }

  private applyAvailableToggle(item: AvailableSubjectResponse, checked: boolean): void {
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
          defaultTimetablePreference: item.defaultTimetablePreference,
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
  }

  addSelectedSubjects(): void {
    if (!this.editable || this.stagedCount === 0) return;
    this.commitStaged();
    this.addSelectedChoiceGroups();
    this.cdr.markForCheck();
  }

  /** Moves staged subjects into the mapped table with curriculum defaults. */
  private commitStaged(): void {
    if (this.staged.size === 0) return;
    const added = [...this.staged.values()].map((ref) => newDraftRow(ref));
    this.rows = [...this.rows, ...added];
    this.staged.clear();
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

  markRowChanged(): void {
    this.cdr.markForCheck();
  }

  onRequirementChanged(row: DraftRow, value: DraftRow['requirement']): void {
    row.requirement = value;
    if (value !== 'OPTIONAL') row.choiceGroup = null;
    this.markRowChanged();
  }

  removeRow(row: DraftRow): void {
    if (row.saved) {
      row.removed = true;
    } else {
      this.rows = this.rows.filter((r) => r !== row);
    }
    if (this.allAvailableFilterKey === this.availableFilterKey && this.allAvailableSubjectIds.has(row.subjectId)) {
      this.allAvailableSelectedIds.delete(row.subjectId);
    }
    this.cdr.markForCheck();
  }

  undoRemoval(row: DraftRow): void {
    row.removed = false;
    if (this.allAvailableFilterKey === this.availableFilterKey && this.allAvailableSubjectIds.has(row.subjectId)) {
      this.allAvailableSelectedIds.add(row.subjectId);
    }
    this.cdr.markForCheck();
  }

  // ───── Save ─────

  save(): void {
    if (!this.showMutations || this.saving || !this.contextReady || !this.board) return;
    this.commitStaged();
    if (this.changeCount === 0) return;

    const errors = validateDraft({
      academicYearId: this.yearId,
      academicGroupId: this.groupId,
      rows: this.rows
    });
    for (const mapping of this.choiceMappings.filter((item) => !item.removed)) {
      if (!this.isValidChoiceWeekly(mapping)) {
        errors.push(`${mapping.name}: weekly periods must be a whole number from ${this.weeklyMin} to ${this.weeklyMax}.`);
      }
    }
    if (errors.length) {
      this.messages.add({
        severity: 'error',
        summary: 'Subject mapping needs attention',
        detail: errors.length === 1 ? errors[0] : `${errors[0]} (${errors.length - 1} more issue${errors.length > 2 ? 's' : ''})`
      });
      return;
    }

    const request = buildSaveRequest(this.yearId!, this.rows);
    const changedChoiceMappings = this.choiceMappings.filter((mapping) =>
      mapping.removed ? !!mapping.saved : this.isChoiceMappingChanged(mapping));
    request.choiceGroupUpserts = changedChoiceMappings
      .filter((mapping) => !mapping.removed)
      .map((mapping): SubjectChoiceMappingUpsert => ({
        choiceGroupId: mapping.choiceGroupId,
        weeklyPeriods: Number(mapping.weeklyPeriods),
        timetablePreference: mapping.timetablePreference
      }));
    request.removedChoiceGroupIds = changedChoiceMappings
      .filter((mapping) => mapping.removed && mapping.saved)
      .map((mapping) => mapping.choiceGroupId);
    const groupImpactNeedsConfirmation = changedChoiceMappings.some((mapping) =>
      !!mapping.saved && (mapping.removed || this.isChoiceMappingChanged(mapping)));
    const groupId = this.groupId!;
    this.saving = true;
    this.cdr.markForCheck();
    this.subjectsApi.previewMappings(groupId, request).subscribe({
      next: (preview) => {
        if (preview.requiresConfirmation || groupImpactNeedsConfirmation) {
          this.saving = false;
          this.pendingSave = request;
          this.impacts = preview.impacts ?? [];
          this.choiceImpactWarning = groupImpactNeedsConfirmation;
          this.impactDialogOpen = true;
          this.cdr.markForCheck();
          return;
        }
        this.persist(groupId, request);
      },
      error: (err) => {
        this.saving = false;
        this.messages.add({
          severity: 'error',
          summary: 'Unable to validate subject mapping',
          detail: extractApiError(err, 'Your changes are still here.').message
        });
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
    this.choiceImpactWarning = false;
    this.persist(groupId, request);
  }

  cancelImpact(): void {
    this.impactDialogOpen = false;
    this.pendingSave = null;
    this.impacts = [];
    this.cdr.markForCheck();
  }

  private persist(groupId: number, request: SubjectMappingSaveRequest): void {
    const changes = request.upserts.length + request.removedSubjectIds.length
      + (request.choiceGroupUpserts?.length ?? 0) + (request.removedChoiceGroupIds?.length ?? 0);
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
        this.messages.add({
          severity: 'error',
          summary: 'Unable to save subject mapping',
          detail: extractApiError(err, 'Your changes are still here.').message
        });
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
    this.choiceMappings = [];
    this.selectedChoiceGroupIds.clear();
    this.impactDialogOpen = false;
    this.pendingSave = null;
    this.choiceImpactWarning = false;
    this.cdr.markForCheck();
  }
}
