import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import { APPLICATION_STATUS_GROUPS, APPLICATION_STATUS_TABS, APPLICATION_STATUS_TABS_COUNSELOR } from '../../data/admissions-workspace.config';
import {
  ApplicationRecord,
  ApplicationSearchRequest,
  ApplicationStatus,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import {
  SaasPageHeaderComponent,
  SaasPillComponent,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import {
  AppListResultsComponent,
  AppListToolbarComponent,
  AppListViewMode,
  AppPaginatorComponent
} from '../../../../shared/ui/app-list';
import { defaultPageSizeForView, pageSizeOptionsForView } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { PermissionService } from '../../../../core/services/permission.service';
import { LoginService } from '../../../../core/services/login.service';

const LIST_KEY = 'tc.applications.list';
const APPLICATIONS_RESOURCE = 'ADMISSIONS_APPLICATIONS';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    HasPermissionDirective,
    SaasPageHeaderComponent,
    SaasPillComponent,
    SaasTabsComponent,
    TcPageSkeletonComponent,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent
  ],
  providers: [ConfirmationService, MessageService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './applications-list.component.html'
})
export class ApplicationsListComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly nav = inject(AdmissionsNavService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);
  private readonly permissions = inject(PermissionService);
  private readonly loginService = inject(LoginService);

  loading = false;
  searching = false;
  errorMessage = '';
  view: AppListViewMode = this.viewPrefs.globalDefault();

  applications: ApplicationRecord[] = [];
  filter: ApplicationSearchRequest = {};
  activeStatusTab = 'ALL';
  selectedClassName: string | null = null;
  classOptions: { label: string; value: string }[] = [];

  pageIndex = 0;
  pageSize = defaultPageSizeForView(this.view);
  totalElements = 0;
  enrollVisible = false;
  enrolling = false;
  selected: ApplicationRecord | null = null;
  enrollmentForm = { academicYearId: null as number | null, classId: null as number | null, sectionId: null as number | null };
  years: LookupOption[] = [];
  classes: LookupOption[] = [];
  sections: LookupOption[] = [];

  readonly applicationsResource = APPLICATIONS_RESOURCE;

  /** Approvers / org admins see full org tabs; counselors see limited own-app tabs. */
  get canSeeOrgApplications(): boolean {
    if (this.permissions.canApprove(APPLICATIONS_RESOURCE)) {
      return true;
    }
    const roles = this.loginService.getUserRole() ?? [];
    return roles.some(role => {
      const token = String(role).toUpperCase().replace(/^ROLE_/, '');
      return token === 'ORGANIZATION_ADMIN'
        || token === 'ORGANIZATION_OWNER'
        || token === 'SUPER_ADMIN';
    });
  }

  get statusTabs(): { key: string; label: string }[] {
    const source = this.canSeeOrgApplications
      ? APPLICATION_STATUS_TABS
      : APPLICATION_STATUS_TABS_COUNSELOR;
    return source.map(t => ({ key: t.key, label: t.label }));
  }

  get pageSizeOptions(): number[] {
    return pageSizeOptionsForView(this.view);
  }

  get canApprove(): boolean {
    return this.permissions.canApprove(APPLICATIONS_RESOURCE);
  }

  ngOnInit(): void {
    this.api.academicYears().subscribe({
      next: years => {
        this.years = years;
        const current = years.find(y => (y.status || '').toUpperCase() === 'CURRENT')
          ?? years[0];
        if (current?.id) {
          this.api.academicClasses(current.id).subscribe({
            next: classes => {
              this.classOptions = classes.map(c => ({ label: c.name, value: c.name }));
              this.cdr.markForCheck();
            }
          });
        }
        this.cdr.markForCheck();
      }
    });

    const tab = this.route.snapshot.queryParamMap.get('tab');
    const knownTabs = new Set(this.statusTabs.map(t => t.key));
    // Map legacy tab keys
    const legacyMap: Record<string, string> = {
      SUBMITTED: this.canSeeOrgApplications ? 'IN_REVIEW' : 'SUBMITTED',
      UNDER_REVIEW: this.canSeeOrgApplications ? 'IN_REVIEW' : 'SUBMITTED',
      IN_REVIEW: this.canSeeOrgApplications ? 'IN_REVIEW' : 'SUBMITTED',
      APPROVED: this.canSeeOrgApplications ? 'APPROVED' : 'ALL',
      ENROLLED: this.canSeeOrgApplications ? 'ENROLLED' : 'ALL'
    };
    if (tab && knownTabs.has(tab)) {
      this.activeStatusTab = tab;
    } else if (tab && legacyMap[tab] && knownTabs.has(legacyMap[tab])) {
      this.activeStatusTab = legacyMap[tab];
    }

    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.pageIndex = saved.page ?? this.pageIndex;
      this.pageSize = saved.size ?? this.pageSize;
      if (saved.search) {
        this.filter = { ...this.filter, keyword: saved.search };
      }
      if (!tab && saved.tab) {
        const mapped = legacyMap[saved.tab] || saved.tab;
        if (knownTabs.has(mapped)) {
          this.activeStatusTab = mapped;
        } else {
          this.activeStatusTab = 'ALL';
        }
      }
    }
    this.applyStatusFilter();
    this.loadApplications();
  }

  onViewModeChange(mode: AppListViewMode): void {
    this.view = mode;
    this.pageSize = defaultPageSizeForView(mode);
    this.pageIndex = 0;
    this.loadApplications();
  }

  onSearchTermChange(term: string): void {
    this.filter = { ...this.filter, keyword: term };
  }

  onClassFilterChange(): void {
    this.filter = {
      ...this.filter,
      applyingForClass: this.selectedClassName || null
    };
    this.pageIndex = 0;
    this.loadApplications();
  }

  onStatusTabChange(key: string): void {
    this.activeStatusTab = key;
    this.pageIndex = 0;
    this.applyStatusFilter();
    this.loadApplications();
  }

  private applyStatusFilter(): void {
    const group = APPLICATION_STATUS_GROUPS[this.activeStatusTab];
    this.filter = {
      ...this.filter,
      status: null,
      statuses: group ? (group as ApplicationStatus[]) : null,
      scope: this.canSeeOrgApplications ? 'ALL' : 'MY'
    };
  }

  clearFilters(): void {
    this.filter = { scope: this.canSeeOrgApplications ? 'ALL' : 'MY' };
    this.selectedClassName = null;
    this.activeStatusTab = 'ALL';
    this.pageIndex = 0;
    this.applyStatusFilter();
    this.loadApplications();
  }

  canEditForm(record: ApplicationRecord): boolean {
    // Align with backend EDITABLE — never after APPROVED / ENROLLED / closed.
    return this.permissions.canManage(APPLICATIONS_RESOURCE)
      && ['DRAFT', 'ACTION_REQUIRED', 'DOCUMENTS_PENDING'].includes(record.status);
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadApplications();
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.pageIndex = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.pageIndex = 0;
    }
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = this.applications.length === 0;
    this.searching = true;
    this.filter = {
      ...this.filter,
      scope: this.canSeeOrgApplications ? 'ALL' : 'MY'
    };
    this.api
      .searchApplications(this.filter, this.pageIndex, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.searching = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: page => {
          this.applications = page.content;
          this.totalElements = page.totalElements;
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Unable to load applications. Please retry.';
          this.messages.add({
            severity: 'error',
            summary: 'Load failed',
            detail: this.errorMessage
          });
        }
      });
  }

  canOpenReview(record: ApplicationRecord): boolean {
    return ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'FEE_PENDING', 'APPROVED', 'ENROLLED', 'REJECTED', 'ACTION_REQUIRED'].includes(record.status);
  }

  openPrimary(record: ApplicationRecord): void {
    if (this.canEditForm(record) && !this.canApprove) {
      this.openForm(record);
      return;
    }
    if (this.canOpenReview(record)) {
      this.openReview(record);
      return;
    }
    this.openForm(record);
  }

  openForm(record: ApplicationRecord): void {
    this.persistListContext();
    this.nav.toApplication(record.applicationId, 'applications');
  }

  openReview(record: ApplicationRecord, event?: Event): void {
    event?.stopPropagation();
    this.persistListContext();
    this.nav.toApplicationReview(record.applicationId, 'applications');
  }

  newApplication(): void {
    this.nav.toApplication('new', 'applications');
  }

  openEnroll(record: ApplicationRecord, event: Event): void {
    event.stopPropagation();
    this.selected = record;
    this.enrollmentForm = {
      academicYearId: record.academicYearId ?? null,
      classId: record.classId ?? null,
      sectionId: record.sectionId ?? null
    };
    this.enrollVisible = true;
    if (this.enrollmentForm.academicYearId) {
      this.onYearChange(this.enrollmentForm.academicYearId, this.enrollmentForm.classId);
    }
  }

  closeEnroll(): void {
    this.enrollVisible = false;
    this.selected = null;
  }

  enroll(): void {
    if (!this.selected || !this.enrollmentForm.academicYearId || !this.enrollmentForm.classId) return;
    this.enrolling = true;
    this.api
      .enrollApplication(this.selected.applicationId, {
        academicYearId: this.enrollmentForm.academicYearId,
        classId: this.enrollmentForm.classId,
        sectionId: this.enrollmentForm.sectionId
      })
      .pipe(finalize(() => {
        this.enrolling = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: result => {
          const enrolledId = this.selected!.applicationId;
          const enrolledName = result.studentName || this.selected?.applicantName;
          this.messages.add({
            severity: 'success',
            summary: 'Enrolled',
            detail: `${enrolledName} is now in Students.`
          });
          this.applications = this.applications.map(app =>
            app.applicationId === enrolledId
              ? {
                  ...app,
                  status: 'ENROLLED',
                  studentId: result.studentId,
                  studentCode: result.studentCode,
                  admissionNumber: result.admissionNumber
                }
              : app
          );
          this.closeEnroll();
          this.cdr.markForCheck();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Enrollment failed', detail: 'Could not create the student.' })
      });
  }

  onYearChange(yearId: number | null, keepClassId: number | null = null): void {
    this.classes = [];
    this.sections = [];
    this.enrollmentForm.classId = keepClassId;
    this.enrollmentForm.sectionId = null;
    if (!yearId) return;
    this.api.academicClasses(yearId).subscribe({
      next: classes => {
        this.classes = classes;
        if (keepClassId) this.onClassChange(keepClassId);
        this.cdr.markForCheck();
      }
    });
  }

  onClassChange(classId: number | null): void {
    this.sections = [];
    this.enrollmentForm.sectionId = null;
    if (!classId) return;
    this.api.academicSections(classId).subscribe({
      next: sections => {
        this.sections = sections;
        this.cdr.markForCheck();
      }
    });
  }

  exportCsv(): void {
    if (!this.applications.length) {
      this.messages.add({
        severity: 'info',
        summary: 'Nothing to export',
        detail: 'No applications on the current page.'
      });
      return;
    }

    const headers = [
      'Application #',
      'Applicant',
      'Class',
      'Status',
      'Contact',
      'Email',
      'Parent',
      'Created'
    ];
    const rows = this.applications.map(a => [
      a.applicationNumber ?? a.applicationId,
      a.applicantName,
      a.applyingForClass ?? '',
      a.status,
      a.contactNumber ?? '',
      a.email ?? '',
      a.parentName ?? '',
      a.createdOn ?? ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `applications-page-${this.pageIndex + 1}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.messages.add({
      severity: 'success',
      summary: 'Exported',
      detail: `${this.applications.length} row(s) exported.`
    });
  }

  statusLabel(status: ApplicationStatus): string {
    return status.replace(/_/g, ' ');
  }

  statusTone(status: ApplicationStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' {
    switch (status) {
      case 'DRAFT':
        return 'neutral';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'info';
      case 'DOCUMENTS_PENDING':
      case 'FEE_PENDING':
      case 'ACTION_REQUIRED':
        return 'warning';
      case 'APPROVED':
      case 'ENROLLED':
        return 'success';
      case 'REJECTED':
      case 'CANCELLED':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.pageIndex,
      size: this.pageSize,
      search: this.filter.keyword ?? '',
      tab: this.activeStatusTab
    });
  }
}
