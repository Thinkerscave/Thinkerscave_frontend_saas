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
import { MessageService } from 'primeng/api';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import {
  ApplicationRecord,
  ApplicationSearchRequest
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

interface EnrollmentForm {
  academicYear: string;
  className: string;
  section: string;
}

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    FormsModule,
    PaginatorModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent
  ],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './enrollment-list.component.html',
  styles: [`
    .adm-view-toggle {
      display: flex;
      gap: 6px;
    }
    .adm-view-toggle button.is-active {
      border-color: var(--tc-primary-600);
      color: var(--tc-primary-600);
    }
    .adm-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
    }
    .adm-drawer {
      width: min(420px, 100%);
      height: 100%;
      background: var(--tc-surface-0, #fff);
      border-left: 1px solid var(--tc-border);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
    }
    .adm-drawer__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .adm-drawer__header h2 {
      margin: 0;
      font-size: 1.1rem;
    }
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
    .adm-pagination {
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
      border-top: 1px solid var(--tc-border);
    }
  `]
})
export class EnrollmentListComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  loading = false;
  enrolling = false;
  errorMessage = '';

  applications: ApplicationRecord[] = [];
  filter: ApplicationSearchRequest = { status: 'APPROVED' };

  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;

  view: 'grid' | 'table' = 'grid';

  drawerOpen = false;
  selected: ApplicationRecord | null = null;
  enrollmentForm: EnrollmentForm = {
    academicYear: '',
    className: '',
    section: ''
  };

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading = true;
    this.api
      .searchApplications(this.filter, this.pageIndex, this.pageSize)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: page => {
          this.applications = page.content;
          this.totalElements = page.totalElements;
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Unable to load approved applications.';
          this.messages.add({
            severity: 'error',
            summary: 'Load failed',
            detail: this.errorMessage
          });
        }
      });
  }

  onPageChange(event: PaginatorState): void {
    this.pageIndex = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    this.loadApplications();
  }

  openEnrollmentDrawer(record: ApplicationRecord, event?: Event): void {
    event?.stopPropagation();
    this.selected = record;
    this.enrollmentForm = {
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      className: record.applyingForClass ?? '',
      section: ''
    };
    this.drawerOpen = true;
    this.cdr.markForCheck();
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.selected = null;
    this.cdr.markForCheck();
  }

  enroll(): void {
    if (!this.selected) return;

    const applicantName = this.selected.applicantName;
    const applicationId = this.selected.applicationId;
    const { academicYear, className, section } = this.enrollmentForm;
    const remarks = [
      'Enrollment details:',
      `Academic year: ${academicYear || '—'}`,
      `Class: ${className || '—'}`,
      `Section: ${section || '—'}`
    ].join(' | ');

    this.enrolling = true;
    this.api
      .updateApplicationStatus(applicationId, 'ENROLLED', remarks)
      .pipe(finalize(() => {
        this.enrolling = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.closeDrawer();
          this.messages.add({
            severity: 'success',
            summary: 'Enrolled',
            detail: `${applicantName} enrolled successfully.`
          });
          this.router.navigate(['/app/students/directory']);
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Enrollment failed',
            detail: 'Could not enroll this application.'
          })
      });
  }

  initials(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }
}
