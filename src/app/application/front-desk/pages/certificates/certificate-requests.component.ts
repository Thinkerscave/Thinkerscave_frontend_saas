import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { WorkspaceSwitcherService } from '../../../../core/services/workspace-switcher.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import {
  AppEmptyStateComponent,
  AppFormSectionComponent,
  AppInputComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption
} from '../../../../shared/ui/app-form';
import { AppListResultsComponent } from '../../../../shared/ui/app-list/app-list-results.component';
import { AppListToolbarComponent } from '../../../../shared/ui/app-list/app-list-toolbar.component';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { FrontDeskApiService, StudentDirectoryRow } from '../../front-desk-api.service';

const CERT_LABEL: Record<string, string> = {
  BONAFIDE: 'Bonafide',
  FEE_ESTIMATE: 'Fee estimate',
  CHARACTER: 'Character',
  TRANSFER_STATUS: 'Transfer status'
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ISSUED: 'Issued'
};

@Component({
  selector: 'app-certificate-requests',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent,
    AppEmptyStateComponent,
    AppFormSectionComponent,
    AppSectionHeaderComponent,
    AppInputComponent,
    AppSelectComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './certificate-requests.component.html',
  styleUrls: ['../../front-desk.shared.scss', './certificate-requests.component.scss']
})
export class CertificateRequestsComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly workspaces = inject(WorkspaceSwitcherService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly certificateOptions: AppSelectOption[] = [
    { value: 'BONAFIDE', label: 'Bonafide' },
    { value: 'FEE_ESTIMATE', label: 'Fee estimate' },
    { value: 'CHARACTER', label: 'Character' },
    { value: 'TRANSFER_STATUS', label: 'Transfer status' }
  ];

  lookup = '';
  students: StudentDirectoryRow[] = [];
  selected: StudentDirectoryRow | null = null;
  searching = false;
  certificateType = 'BONAFIDE';
  keyword = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: Record<string, unknown>[] = [];
  busy = false;
  printable: Record<string, unknown> | null = null;
  orgName = '';

  ngOnInit(): void {
    this.workspaces.listOrganizations().subscribe({
      next: rows => {
        this.orgName = rows.find(row => row.current)?.organizationName || '';
        this.cdr.markForCheck();
      }
    });
    this.load(0);
  }

  typeLabel(value: unknown): string {
    return CERT_LABEL[String(value ?? '')] || String(value ?? '');
  }

  statusLabel(value: unknown): string {
    return STATUS_LABEL[String(value ?? '')] || String(value ?? '');
  }

  search(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    const term = (value ?? '').trim();
    if (term.length < 2) {
      this.students = [];
      this.searching = false;
      this.cdr.markForCheck();
      return;
    }
    this.searching = true;
    this.searchTimer = setTimeout(() => {
      this.api.students(term).subscribe({
        next: rows => {
          this.students = rows;
          this.searching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.students = [];
          this.searching = false;
          this.cdr.markForCheck();
        }
      });
    }, 280);
  }

  pick(student: StudentDirectoryRow): void {
    this.selected = student;
    this.lookup = student.studentName;
    this.students = [];
    this.cdr.markForCheck();
  }

  clearStudent(): void {
    this.selected = null;
    this.lookup = '';
    this.cdr.markForCheck();
  }

  create(): void {
    if (!this.selected) {
      return;
    }
    this.api.create('certificate-requests', {
      studentId: this.selected.studentId,
      studentName: this.selected.studentName,
      className: this.selected.className,
      rollNumber: this.selected.rollNumber,
      certificateType: this.certificateType
    }).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Request saved' });
        this.load(0);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Request could not be saved' })
    });
  }

  load(page: number): void {
    this.page = page;
    this.busy = true;
    this.api.list('certificate-requests', page, this.size, this.keyword).subscribe({
      next: result => {
        this.rows = result.content ?? [];
        this.total = result.totalElements ?? 0;
        this.busy = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.busy = false;
        this.cdr.markForCheck();
      }
    });
  }

  onPage(event: AppPageChangeEvent): void {
    this.size = event.rows;
    this.load(event.page);
  }

  print(row: Record<string, unknown>): void {
    this.api.postAction(`certificate-requests/${row['id']}/print`).subscribe({
      next: saved => {
        this.printable = saved;
        this.cdr.markForCheck();
        setTimeout(() => window.print(), 50);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Print is available only after approval' })
    });
  }
}
