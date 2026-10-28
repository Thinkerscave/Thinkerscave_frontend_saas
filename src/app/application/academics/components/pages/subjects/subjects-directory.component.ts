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
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { PermissionService } from '../../../../../core/services/permission.service';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { AppGridTableToggleComponent, AppListViewMode, AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { UI_PAGINATION } from '../../../../../shared/config/ui-standards';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';
import { extractApiError } from '../../../../../shared/utils/api-error.util';
import { SubjectFormDialogComponent } from '../../shared/subject-form-dialog/subject-form-dialog.component';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import {
  ACADEMICS_SUBJECTS_RESOURCE,
  SUBJECT_STATUS_OPTIONS,
  SUBJECT_TYPE_FILTER_OPTIONS,
  SubjectResponse,
  SubjectStatusFilter,
  SubjectType,
  subjectTypeIcon,
  subjectTypeLabel,
  subjectTypeTone
} from '../../../models/subjects-mapping.model';

@Component({
  selector: 'app-subjects-directory-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TcPageSkeletonComponent,
    SaasPageHeaderComponent,
    AppGridTableToggleComponent,
    AppPaginatorComponent,
    DropdownModule,
    MenuModule,
    ConfirmDialogModule,
    HasPermissionDirective,
    SubjectFormDialogComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './subjects-directory.component.html',
  styleUrls: ['./subjects-directory.component.scss']
})
export class SubjectsDirectoryPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageHeader = inject(BreadCrumbService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_SUBJECTS_RESOURCE;
  readonly typeOptions = SUBJECT_TYPE_FILTER_OPTIONS;
  readonly statusOptions = SUBJECT_STATUS_OPTIONS;
  readonly pageSizeOptions = [10, 20, 50];

  private readonly search$ = new Subject<string>();

  loading = true;
  refreshing = false;
  loadError: string | null = null;
  loadedOnce = false;

  subjects: SubjectResponse[] = [];
  totalElements = 0;

  searchTerm = '';
  typeFilter: SubjectType | null = null;
  statusFilter: SubjectStatusFilter = 'ACTIVE';
  viewMode: AppListViewMode = 'grid';
  page = 0;
  pageSize = UI_PAGINATION.defaultSize;

  formOpen = false;
  editingSubject: SubjectResponse | null = null;
  menuItems: MenuItem[] = [];

  readonly typeLabel = subjectTypeLabel;
  readonly typeIcon = subjectTypeIcon;
  readonly typeTone = subjectTypeTone;

  get canManage(): boolean {
    return this.permissions.canManage(this.resource);
  }

  get hasFilters(): boolean {
    return !!this.searchTerm.trim() || this.typeFilter !== null || this.statusFilter !== 'ACTIVE';
  }

  ngOnInit(): void {
    this.pageHeader.setPageSubtitle('Manage reusable subjects and learning activities.');
    this.search$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 0;
        this.reload();
      });
    this.reload();
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value ?? '';
    this.search$.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.page = 0;
    this.reload();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = null;
    this.statusFilter = 'ACTIVE';
    this.page = 0;
    this.reload();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.page = 0;
    }
    this.reload();
  }

  reload(): void {
    const initial = !this.loadedOnce;
    this.loading = initial;
    this.refreshing = !initial;
    this.loadError = null;
    this.cdr.markForCheck();
    this.api
      .listSubjects({
        q: this.searchTerm.trim() || undefined,
        subjectType: this.typeFilter,
        status: this.statusFilter,
        page: this.page,
        size: this.pageSize
      })
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshing = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.loadedOnce = true;
          this.subjects = res.content ?? [];
          this.totalElements = res.totalElements ?? 0;
          const lastPage = Math.max(0, Math.ceil(this.totalElements / this.pageSize) - 1);
          if (this.page > lastPage) {
            this.page = lastPage;
            this.reload();
          }
        },
        error: (err) => {
          this.loadError = extractApiError(err, 'Unable to load subjects. Please try again.').message;
          this.cdr.markForCheck();
        }
      });
  }

  openCreate(): void {
    this.editingSubject = null;
    this.formOpen = true;
  }

  onFormSaved(event: { subject: SubjectResponse; created: boolean }): void {
    if (event.created) {
      this.messages.add({ severity: 'success', summary: 'Subject created', detail: `${event.subject.name} is ready to map.` });
      void this.router.navigate(['/app/academics/subjects', event.subject.subjectId]);
      return;
    }
    this.messages.add({ severity: 'success', summary: 'Subject updated' });
    this.reload();
  }

  openDetails(subject: SubjectResponse): void {
    void this.router.navigate(['/app/academics/subjects', subject.subjectId]);
  }

  openMapping(subject?: SubjectResponse): void {
    void this.router.navigate(
      ['/app/academics/subject-mapping'],
      { queryParams: subject ? { subjectId: subject.subjectId } : undefined }
    );
  }

  openChoiceGroups(): void {
    void this.router.navigate(['/app/academics/choice-groups']);
  }

  usageLabel(count: number): string {
    return count === 1 ? 'Used by 1 academic group' : `Used by ${count ?? 0} academic groups`;
  }

  buildMenu(subject: SubjectResponse): void {
    const items: MenuItem[] = [];
    if (this.canManage) {
      items.push({
        label: 'Edit Subject',
        icon: 'pi pi-pencil',
        command: () => {
          this.editingSubject = subject;
          this.formOpen = true;
          this.cdr.markForCheck();
        }
      });
      if (subject.active) {
        items.push({ label: 'Deactivate', icon: 'pi pi-ban', command: () => this.confirmDeactivate(subject) });
      } else {
        items.push({ label: 'Reactivate', icon: 'pi pi-check', command: () => this.activate(subject) });
      }
    }
    this.menuItems = items;
  }

  confirmDeactivate(subject: SubjectResponse): void {
    const groups = subject.mappedAcademicGroupCount ?? 0;
    const impact = groups > 0
      ? `Existing mappings in ${groups} academic group${groups === 1 ? '' : 's'} will remain, but this subject cannot be added to new mappings.`
      : 'This subject cannot be added to new mappings until it is reactivated.';
    this.confirm.confirm({
      header: `Deactivate ${subject.name}?`,
      message: impact,
      acceptLabel: 'Deactivate',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deactivate(subject)
    });
  }

  private deactivate(subject: SubjectResponse): void {
    this.api.deactivateSubject(subject.subjectId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Subject deactivated', detail: subject.name });
        this.reload();
      },
      error: (err) => this.showActionError(err, 'Unable to deactivate subject')
    });
  }

  private activate(subject: SubjectResponse): void {
    this.api.activateSubject(subject.subjectId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Subject reactivated', detail: subject.name });
        this.reload();
      },
      error: (err) => this.showActionError(err, 'Unable to reactivate subject')
    });
  }

  private showActionError(err: unknown, summary: string): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail: extractApiError(err, 'Please try again.').message
    });
  }
}
