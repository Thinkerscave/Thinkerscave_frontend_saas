import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ToastModule } from 'primeng/toast';
import { debounceTime, finalize, Subject } from 'rxjs';

import { SaasPanelComponent } from '../../../../shared/ui/saas';
import {
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  admissionsPageConfig
} from '../../data/admissions-workspace.config';
import {
  LeadCreateRequest,
  LeadRecord,
  LeadSearchRequest,
  LeadStatus
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginatorModule,
    ToastModule,
    ConfirmDialogModule,
    SaasPanelComponent
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['../../admissions.shared.scss', '../../../students/students.shared.scss'],
  templateUrl: './leads-list.component.html',
  styles: [`
    .stu-chip-bar {
      display: inline-flex; gap: 4px; padding: 4px; border-radius: 12px;
      background: var(--tc-surface-50); border: 1px solid var(--tc-border);
    }
    .stu-chip-bar button {
      border: none; background: transparent; padding: 6px 12px; border-radius: 8px;
      font-size: 0.82rem; font-weight: 600; color: var(--tc-text-muted); cursor: pointer; font-family: inherit;
    }
    .stu-chip-bar button.is-active {
      background: var(--tc-surface-0); color: var(--tc-primary-600);
      box-shadow: var(--tc-shadow-sm, 0 1px 2px rgba(0,0,0,0.06));
    }
  `]
})
export class LeadsListComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTrigger$ = new Subject<void>();

  readonly pageConfig = admissionsPageConfig('leads');
  readonly statusOptions = LEAD_STATUS_OPTIONS;
  readonly sourceOptions = LEAD_SOURCE_OPTIONS;

  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly error = signal<string | null>(null);
  readonly leads = signal<LeadRecord[]>([]);
  readonly totalElements = signal(0);
  readonly viewMode = signal<'table' | 'card'>('table');
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly editingLead = signal<LeadRecord | null>(null);

  pageIndex = 0;
  pageSize = 20;
  readonly sort = 'createdOn,desc';

  filter: LeadSearchRequest = {};

  readonly leadForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[\d+\-\s()]{7,15}$/)]],
    email: [''],
    classInterestedIn: ['', Validators.required],
    address: [''],
    inquirySource: [''],
    referredBy: [''],
    comments: [''],
    assignedCounselorId: [null as number | null],
    nextFollowUpDate: ['']
  });

  ngOnInit(): void {
    this.searchTrigger$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.runSearch());

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const status = params.get('status');
      const openDrawer = params.get('openDrawer');
      if (status) {
        this.filter = { ...this.filter, status: status as LeadStatus };
      }
      if (openDrawer === '1') {
        this.openDrawer();
      }
      this.loadInitial();
    });
  }

  loadInitial(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .searchLeads(this.filter, this.pageIndex, this.pageSize, this.sort)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: page => {
          this.leads.set(page.content);
          this.totalElements.set(page.totalElements);
        },
        error: () => {
          const msg = 'Unable to load leads. Please retry.';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: msg });
        }
      });
  }

  runSearch(): void {
    this.searching.set(true);
    this.pageIndex = 0;
    this.api
      .searchLeads(this.filter, this.pageIndex, this.pageSize, this.sort)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.searching.set(false))
      )
      .subscribe({
        next: page => {
          this.leads.set(page.content);
          this.totalElements.set(page.totalElements);
          this.error.set(null);
        },
        error: () => {
          const msg = 'Search failed. Please retry.';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: 'Search failed', detail: msg });
        }
      });
  }

  onPageChange(event: PaginatorState): void {
    this.pageIndex = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    this.searching.set(true);
    this.api
      .searchLeads(this.filter, this.pageIndex, this.pageSize, this.sort)
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        next: page => {
          this.leads.set(page.content);
          this.totalElements.set(page.totalElements);
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Failed to load page.' })
      });
  }

  clearFilters(): void {
    this.filter = {};
    this.runSearch();
  }

  setView(mode: 'table' | 'card'): void {
    this.viewMode.set(mode);
  }

  openDrawer(lead?: LeadRecord): void {
    this.editingLead.set(lead ?? null);
    if (lead) {
      this.leadForm.patchValue({
        name: lead.name,
        mobileNumber: lead.mobileNumber,
        email: lead.email ?? '',
        classInterestedIn: lead.classInterestedIn,
        address: lead.address ?? '',
        inquirySource: lead.inquirySource ?? '',
        referredBy: lead.referredBy ?? '',
        comments: lead.comments ?? '',
        assignedCounselorId: lead.assignedCounselorId ?? null,
        nextFollowUpDate: lead.nextFollowUpDate ?? ''
      });
    } else {
      this.leadForm.reset({
        name: '',
        mobileNumber: '',
        email: '',
        classInterestedIn: '',
        address: '',
        inquirySource: '',
        referredBy: '',
        comments: '',
        assignedCounselorId: null,
        nextFollowUpDate: ''
      });
    }
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingLead.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openDrawer: null },
      queryParamsHandling: 'merge'
    });
  }

  saveLead(): void {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }
    const payload = this.leadForm.getRawValue() as LeadCreateRequest;
    const editing = this.editingLead();
    this.saving.set(true);

    const req$ = editing
      ? this.api.updateLead(editing.inquiryId, payload)
      : this.api.createLead(payload);

    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: editing ? 'Lead updated' : 'Lead created',
          detail: editing ? 'Changes saved successfully.' : 'New lead added to pipeline.'
        });
        this.closeDrawer();
        this.runSearch();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save lead.' })
    });
  }

  openLead(lead: LeadRecord): void {
    this.router.navigate(['/app/admissions/lead', lead.inquiryId]);
  }

  callPhone(lead: LeadRecord, event: Event): void {
    event.stopPropagation();
    if (lead.mobileNumber) window.open(`tel:${lead.mobileNumber}`, '_self');
  }

  whatsapp(lead: LeadRecord, event: Event): void {
    event.stopPropagation();
    if (lead.mobileNumber) {
      window.open(`https://wa.me/${lead.mobileNumber.replace(/\D/g, '')}`, '_blank');
    }
  }

  emailContact(lead: LeadRecord, event: Event): void {
    event.stopPropagation();
    if (lead.email) window.open(`mailto:${lead.email}`, '_self');
  }

  editLead(lead: LeadRecord, event: Event): void {
    event.stopPropagation();
    this.openDrawer(lead);
  }

  deleteLead(lead: LeadRecord, event: Event): void {
    event.stopPropagation();
    this.confirm.confirm({
      message: `Archive lead "${lead.name}"? This action can be reversed from admin tools.`,
      header: 'Confirm Archive',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'adm-btn adm-btn--danger',
      accept: () => {
        this.api.archiveLead(lead.inquiryId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Archived', detail: 'Lead archived successfully.' });
            this.runSearch();
          },
          error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not archive lead.' })
        });
      }
    });
  }

  assignCounselor(lead: LeadRecord, event: Event): void {
    event.stopPropagation();
    const raw = window.prompt('Enter counselor user ID to assign:');
    if (!raw?.trim()) return;
    const counselorId = Number(raw);
    if (!Number.isFinite(counselorId) || counselorId <= 0) {
      this.messages.add({ severity: 'warn', summary: 'Invalid ID', detail: 'Please enter a valid counselor ID.' });
      return;
    }
    this.api.assignCounselor(lead.inquiryId, counselorId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Assigned', detail: 'Counselor assigned successfully.' });
        this.runSearch();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Assignment failed.' })
    });
  }

  exportCsv(): void {
    const rows = this.leads();
    if (!rows.length) {
      this.messages.add({ severity: 'info', summary: 'Nothing to export', detail: 'No leads on current page.' });
      return;
    }
    const headers = ['ID', 'Name', 'Mobile', 'Email', 'Class', 'Source', 'Status', 'Next Follow-up'];
    const csvRows = rows.map(l => [
      l.inquiryId,
      this.csvEscape(l.name),
      this.csvEscape(l.mobileNumber),
      this.csvEscape(l.email ?? ''),
      this.csvEscape(l.classInterestedIn),
      this.csvEscape(l.inquirySource ?? ''),
      l.status,
      this.csvEscape(l.nextFollowUpDate ?? '')
    ].join(','));
    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-page-${this.pageIndex + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  statusTone(status: LeadStatus): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'NEW':
      case 'CONTACTED':
        return 'info';
      case 'INTERESTED':
      case 'COUNSELING':
      case 'READY_FOR_ADMISSION':
      case 'CONVERTED':
        return 'success';
      case 'FOLLOW_UP_REQUIRED':
      case 'DOCUMENTS_PENDING':
        return 'warning';
      case 'LOST':
      case 'CLOSED':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private csvEscape(value: string): string {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  }
}
