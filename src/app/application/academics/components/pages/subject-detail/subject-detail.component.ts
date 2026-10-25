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
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { Subject, debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';
import { BreadCrumbService } from '../../../../../core/services/bread-crumb.service';
import { PermissionService } from '../../../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { AppPaginatorComponent } from '../../../../../shared/ui/app-list';
import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';
import { AppPageChangeEvent } from '../../../../../shared/utils/paged-result.util';
import { extractApiError } from '../../../../../shared/utils/api-error.util';
import { SubjectFormDialogComponent } from '../../shared/subject-form-dialog/subject-form-dialog.component';
import { SubjectsMappingApiService } from '../../../services/subjects-mapping-api.service';
import { AcademicsNavService } from '../../../services/academics-nav.service';
import {
  ACADEMICS_SUBJECTS_RESOURCE,
  SubjectResponse,
  SubjectUsageResponse,
  subjectTypeIcon,
  subjectTypeLabel,
  subjectTypeTone
} from '../../../models/subjects-mapping.model';

@Component({
  selector: 'app-subject-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TcPageSkeletonComponent,
    ConfirmDialogModule,
    MenuModule,
    AppPaginatorComponent,
    HasPermissionDirective,
    SubjectFormDialogComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.scss']
})
export class SubjectDetailPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(SubjectsMappingApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly nav = inject(AcademicsNavService);
  readonly permissions = inject(PermissionService);

  readonly resource = ACADEMICS_SUBJECTS_RESOURCE;
  readonly pageSizeOptions = [10, 20, 50];
  readonly typeLabel = subjectTypeLabel;
  readonly typeIcon = subjectTypeIcon;
  readonly typeTone = subjectTypeTone;

  private readonly usageSearch$ = new Subject<string>();
  private subjectId: number | null = null;

  loading = true;
  loadError: string | null = null;
  notFound = false;
  subject: SubjectResponse | null = null;

  usageRows: SubjectUsageResponse[] = [];
  usageTotal = 0;
  usageLoading = false;
  usageError: string | null = null;
  usageQuery = '';
  usagePage = 0;
  usagePageSize = 10;

  editOpen = false;
  menuItems: MenuItem[] = [];
  usageMenuItems: MenuItem[] = [];

  get canManage(): boolean {
    return this.permissions.canManage(this.resource);
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('subjectId'))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => {
        this.subjectId = Number.isFinite(id) && id > 0 ? id : null;
        this.usageQuery = '';
        this.usagePage = 0;
        this.loadSubject();
        this.loadUsage();
      });

    this.usageSearch$
      .pipe(debounceTime(280), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.usagePage = 0;
        this.loadUsage();
      });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  back(): void {
    this.nav.back(this.route, ['/app/academics/subjects']);
  }

  loadSubject(): void {
    if (this.subjectId == null) {
      this.loading = false;
      this.notFound = true;
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.loadError = null;
    this.notFound = false;
    this.api.getSubject(this.subjectId)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (subject) => {
          this.subject = subject;
          this.pageHeader.setPageHeader({
            crumbs: [
              { label: 'Academics', link: ['/app/academics/overview'] },
              { label: 'Subjects', link: ['/app/academics/subjects'] },
              { label: subject.name }
            ]
          });
        },
        error: (err) => {
          this.subject = null;
          const parsed = extractApiError(err, 'Unable to load this subject. Please try again.');
          if (parsed.status === 404) {
            this.notFound = true;
          } else {
            this.loadError = parsed.message;
          }
        }
      });
  }

  loadUsage(): void {
    if (this.subjectId == null) return;
    this.usageLoading = true;
    this.usageError = null;
    this.api.listSubjectMappings(this.subjectId, {
      q: this.usageQuery.trim() || undefined,
      page: this.usagePage,
      size: this.usagePageSize
    })
      .pipe(finalize(() => {
        this.usageLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          this.usageRows = res.content ?? [];
          this.usageTotal = res.totalElements ?? 0;
        },
        error: (err) => {
          this.usageRows = [];
          this.usageTotal = 0;
          this.usageError = extractApiError(err, 'Unable to load mapped academic groups.').message;
        }
      });
  }

  onUsageQueryChange(value: string): void {
    this.usageSearch$.next(value ?? '');
  }

  onUsagePageChange(event: AppPageChangeEvent): void {
    this.usagePage = event.page;
    if (event.rows && event.rows !== this.usagePageSize) {
      this.usagePageSize = event.rows;
      this.usagePage = 0;
    }
    this.loadUsage();
  }

  sectionsLabel(row: SubjectUsageResponse): string {
    return row.sectionCount === row.totalSectionCount
      ? 'All'
      : `${row.sectionCount} of ${row.totalSectionCount}`;
  }

  openMapping(row?: SubjectUsageResponse): void {
    if (this.subjectId == null) return;
    void this.router.navigate(['/app/academics/subject-mapping'], {
      queryParams: row
        ? { academicYearId: row.academicYearId, academicGroupId: row.academicGroupId, subjectId: this.subjectId }
        : { subjectId: this.subjectId }
    });
  }

  buildUsageMenu(row: SubjectUsageResponse): void {
    this.usageMenuItems = [
      { label: 'Open in Subject Mapping', icon: 'pi pi-external-link', command: () => this.openMapping(row) }
    ];
  }

  onSaved(event: { subject: SubjectResponse; created: boolean }): void {
    this.messages.add({ severity: 'success', summary: 'Subject updated' });
    this.subject = event.subject;
    this.loadSubject();
    this.loadUsage();
  }

  buildMenu(subject: SubjectResponse): void {
    const items: MenuItem[] = [];
    if (this.canManage) {
      if (subject.active) {
        items.push({ label: 'Deactivate Subject', icon: 'pi pi-ban', command: () => this.confirmDeactivate(subject) });
      } else {
        items.push({ label: 'Reactivate Subject', icon: 'pi pi-check', command: () => this.activate(subject) });
      }
    }
    this.menuItems = items;
  }

  private confirmDeactivate(subject: SubjectResponse): void {
    const groups = subject.mappedAcademicGroupCount ?? 0;
    this.confirm.confirm({
      header: `Deactivate ${subject.name}?`,
      message: groups > 0
        ? `Existing mappings in ${groups} academic group${groups === 1 ? '' : 's'} will remain, but this subject cannot be added to new mappings.`
        : 'This subject cannot be added to new mappings until it is reactivated.',
      acceptLabel: 'Deactivate',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.deactivateSubject(subject.subjectId).subscribe({
          next: (updated) => {
            this.subject = updated;
            this.messages.add({ severity: 'success', summary: 'Subject deactivated', detail: subject.name });
            this.loadSubject();
          },
          error: (err) => this.showActionError(err, 'Unable to deactivate subject')
        });
      }
    });
  }

  private activate(subject: SubjectResponse): void {
    this.api.activateSubject(subject.subjectId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Subject reactivated', detail: subject.name });
        this.loadSubject();
      },
      error: (err) => this.showActionError(err, 'Unable to reactivate subject')
    });
  }

  private showActionError(err: unknown, summary: string): void {
    this.messages.add({ severity: 'error', summary, detail: extractApiError(err, 'Please try again.').message });
  }
}
