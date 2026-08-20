import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import { APPLICATION_STATUS_TABS } from '../../data/admissions-workspace.config';
import {
  ApplicationRecord,
  ApplicationSearchRequest,
  ApplicationStatus
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasTabsComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    FormsModule,
    PaginatorModule,
    ConfirmDialogModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent,
    SaasTabsComponent
  ],
  providers: [ConfirmationService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './applications-list.component.html',
  styles: [`
    .adm-table-wrap { overflow-x: auto; }
    .adm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .adm-table th, .adm-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--tc-border);
    }
    .adm-table th {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--tc-text-muted);
      font-weight: 700;
    }
    .adm-table tbody tr {
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .adm-table tbody tr:hover { background: var(--tc-surface-50); }
    .adm-row-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .adm-row-actions button { padding: 6px 10px; font-size: 0.78rem; }
    .adm-pagination {
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
      border-top: 1px solid var(--tc-border);
    }
  `]
})
export class ApplicationsListComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  loading = false;
  searching = false;
  errorMessage = '';

  applications: ApplicationRecord[] = [];
  filter: ApplicationSearchRequest = {};
  activeStatusTab = 'ALL';

  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;

  readonly statusTabs = APPLICATION_STATUS_TABS.map(t => ({
    key: t.key,
    label: t.label
  }));

  ngOnInit(): void {
    this.loadApplications();
  }

  onStatusTabChange(key: string): void {
    this.activeStatusTab = key;
    this.filter = {
      ...this.filter,
      status: key === 'ALL' ? null : (key as ApplicationStatus)
    };
    this.pageIndex = 0;
    this.loadApplications();
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

  onPageChange(event: PaginatorState): void {
    this.pageIndex = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
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
    this.router.navigate(['/app/admissions/wizard', record.applicationId]);
  }

  newApplication(): void {
    this.router.navigate(['/app/admissions/wizard', 'new']);
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
    const remarks = window.prompt('Rejection remarks (optional):') ?? undefined;
    if (remarks === null) return;

    this.api.rejectApplication(record.applicationId, remarks || undefined).subscribe({
      next: () => {
        this.messages.add({
          severity: 'warn',
          summary: 'Rejected',
          detail: `${record.applicantName} has been rejected.`
        });
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
}
