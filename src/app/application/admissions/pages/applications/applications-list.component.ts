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

import { APPLICATION_STATUS_GROUPS, APPLICATION_STATUS_TABS } from '../../data/admissions-workspace.config';
import {
  ApplicationRecord,
  ApplicationSearchRequest,
  ApplicationStatus,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { defaultPageSizeForView, pageSizeOptionsForView } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';

const LIST_KEY = 'tc.applications.list';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    DialogModule,
    DropdownModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent,
    SaasTabsComponent,
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
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);
  private readonly listContext = inject(ListContextService);

  loading = false;
  searching = false;
  errorMessage = '';

  applications: ApplicationRecord[] = [];
  filter: ApplicationSearchRequest = {};
  activeStatusTab = 'ALL';

  pageIndex = 0;
  pageSize = defaultPageSizeForView('grid');
  totalElements = 0;
  rejectDialogOpen = false;
  rejectRemarks = '';
  rejectTarget: ApplicationRecord | null = null;
  enrollVisible = false;
  enrolling = false;
  selected: ApplicationRecord | null = null;
  enrollmentForm = { academicYearId: null as number | null, classId: null as number | null, sectionId: null as number | null };
  years: LookupOption[] = [];
  classes: LookupOption[] = [];
  sections: LookupOption[] = [];

  readonly statusTabs = APPLICATION_STATUS_TABS.map(t => ({
    key: t.key,
    label: t.label
  }));

  get pageSizeOptions(): number[] {
    return pageSizeOptionsForView('grid');
  }

  ngOnInit(): void {
    this.api.academicYears().subscribe({
      next: years => {
        this.years = years;
        this.cdr.markForCheck();
      }
    });
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'READY' || tab === 'IN_PROGRESS' || tab === 'CLOSED' || tab === 'ALL') {
      this.activeStatusTab = tab;
    }
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.pageIndex = saved.page ?? this.pageIndex;
      this.pageSize = saved.size ?? this.pageSize;
      if (saved.search) {
        this.filter = { ...this.filter, keyword: saved.search };
      }
      if (!tab && saved.tab && (saved.tab === 'READY' || saved.tab === 'IN_PROGRESS' || saved.tab === 'CLOSED' || saved.tab === 'ALL')) {
        this.activeStatusTab = saved.tab;
      }
    }
    this.applyStatusFilter();
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
      statuses: group ? (group as ApplicationStatus[]) : null
    };
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadApplications();
  }

  clearFilters(): void {
    this.filter = {};
    this.activeStatusTab = 'ALL';
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

  openApplication(record: ApplicationRecord): void {
    this.persistListContext();
    this.nav.toApplication(record.applicationId, 'applications');
  }

  newApplication(): void {
    this.nav.toApplication('new', 'applications');
  }

  approve(record: ApplicationRecord, event: Event): void {
    event.stopPropagation();
    this.confirmation.confirm({
      message: `Approve application for ${record.applicantName}?`,
      header: 'Confirm Approval',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.api.approveApplication(record.applicationId).subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: 'Approved',
              detail: `${record.applicantName} has been approved.`
            });
            this.loadApplications();
          },
          error: () =>
            this.messages.add({
              severity: 'error',
              summary: 'Approval failed',
              detail: 'Could not approve this application.'
            })
        });
      }
    });
  }

  reject(record: ApplicationRecord, event: Event): void {
    event.stopPropagation();
    this.rejectTarget = record;
    this.rejectRemarks = '';
    this.rejectDialogOpen = true;
    this.cdr.markForCheck();
  }

  closeRejectDialog(): void {
    this.rejectDialogOpen = false;
    this.rejectTarget = null;
    this.cdr.markForCheck();
  }

  confirmReject(): void {
    if (!this.rejectTarget) return;
    const remarks = this.rejectRemarks.trim();
    if (!remarks) {
      this.messages.add({ severity: 'warn', summary: 'Reason required', detail: 'Enter a rejection reason.' });
      return;
    }
    const record = this.rejectTarget;
    this.api.rejectApplication(record.applicationId, remarks).subscribe({
      next: () => {
        this.messages.add({
          severity: 'warn',
          summary: 'Rejected',
          detail: `${record.applicantName} has been rejected.`
        });
        this.closeRejectDialog();
        this.loadApplications();
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Rejection failed',
          detail: 'Could not reject this application.'
        })
    });
  }

  canReview(record: ApplicationRecord): boolean {
    return ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'FEE_PENDING'].includes(record.status);
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
          this.messages.add({
            severity: 'success',
            summary: 'Enrolled',
            detail: `${result.studentName || this.selected?.applicantName} is now in Students.`
          });
          this.closeEnroll();
          this.loadApplications();
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
