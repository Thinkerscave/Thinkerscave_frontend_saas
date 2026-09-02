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
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { CounselorPickerComponent } from '../../components/counselor-picker/counselor-picker.component';
import {
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  admissionsPageConfig,
  formatAdmissionsLabel
} from '../../data/admissions-workspace.config';
import {
  CounselorOption,
  LeadCreateRequest,
  LeadRecord,
  LeadSearchRequest,
  LeadStatus,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';

interface SelectOption<T = string | null> {
  label: string;
  value: T;
}

const LIST_KEY = 'tc.leads.view.v2';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    ConfirmDialogModule,
    DialogModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppListToolbarComponent,
    AppListResultsComponent,
    AppPaginatorComponent,
    CounselorPickerComponent
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['../../../students/students.shared.scss', '../../admissions.shared.scss'],
  templateUrl: './leads-list.component.html'
})
export class LeadsListComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly nav = inject(AdmissionsNavService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly listContext = inject(ListContextService);
  private readonly viewPrefs = inject(ViewPreferenceService);

  readonly pageConfig = admissionsPageConfig('leads');
  readonly statusOptions = LEAD_STATUS_OPTIONS;
  readonly sourceOptions = LEAD_SOURCE_OPTIONS;
  readonly statusSelectOptions: SelectOption[] = [
    { label: 'All', value: null },
    ...LEAD_STATUS_OPTIONS.map(s => ({ label: formatAdmissionsLabel(s), value: s }))
  ];
  readonly sourceSelectOptions: SelectOption[] = [
    { label: 'All', value: null },
    ...LEAD_SOURCE_OPTIONS.map(s => ({ label: s, value: s }))
  ];
  readonly inquirySourceOptions: SelectOption[] = [
    { label: 'Select source', value: '' },
    ...LEAD_SOURCE_OPTIONS.map(s => ({ label: s, value: s }))
  ];

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly hasLoaded = signal(false);
  readonly searching = signal(false);
  readonly error = signal<string | null>(null);
  readonly leads = signal<LeadRecord[]>([]);
  readonly totalElements = signal(0);
  readonly viewMode = signal<'table' | 'card'>(this.viewPrefs.globalDefault() === 'grid' ? 'card' : 'table');
  dialogVisible = false;
  readonly saving = signal(false);
  readonly editingLead = signal<LeadRecord | null>(null);
  readonly counselorPickerOpen = signal(false);
  readonly counselorTarget = signal<LeadRecord | null>(null);
  readonly years = signal<LookupOption[]>([]);
  readonly classes = signal<LookupOption[]>([]);
  readonly filterClasses = signal<LookupOption[]>([]);
  readonly counselorOptions = signal<SelectOption<number | null>[]>([{ label: 'All counselors', value: null }]);
  filterYearId: number | null = null;

  pageIndex = 0;
  pageSize = UI_PAGINATION.defaultSize;
  readonly sort = 'createdOn,desc';

  filter: LeadSearchRequest = {};
  private applied: LeadSearchRequest = {};

  readonly leadForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^(?:\+91[\s-]?)?[6-9]\d{9}$/)]],
    email: ['', [Validators.email]],
    classInterestedIn: [''],
    academicYearId: [null as number | null, Validators.required],
    classId: [null as number | null, Validators.required],
    address: [''],
    inquirySource: [''],
    referredBy: [''],
    comments: [''],
    assignedCounselorId: [null as number | null],
    nextFollowUpDate: ['']
  });

  ngOnInit(): void {
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.pageIndex = saved.page ?? this.pageIndex;
      this.pageSize = saved.size ?? this.pageSize;
      if (saved.search) {
        this.filter = { ...this.filter, keyword: saved.search };
      }
    }

    this.api.academicYears().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: years => this.years.set(years)
    });
    this.api.searchCounselors('', 0, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => this.counselorOptions.set([
        { label: 'All counselors', value: null },
        ...(page.content ?? []).map(c => ({ label: c.fullName, value: c.staffId }))
      ])
    });

    this.leadForm.controls.academicYearId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(yearId => this.onYearChange(yearId));

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const status = params.get('status');
      const openCreate = params.get('openCreate') ?? params.get('openDrawer');
      if (status) {
        this.filter = { ...this.filter, status: status as LeadStatus };
        this.applied = { ...this.applied, status: status as LeadStatus };
      }
      if (openCreate === '1') {
        this.openDialog();
      }
      this.loadInitial();
    });
  }

  loadInitial(): void {
    this.reloadLeads(true);
  }

  runSearch(): void {
    this.applied = { ...this.filter, academicYearId: this.filterYearId };
    this.pageIndex = 0;
    this.reloadLeads(false);
  }

  applyQuery(): void {
    this.pageIndex = 0;
    this.reloadLeads(false);
  }

  private reloadLeads(first: boolean): void {
    if (first || !this.hasLoaded()) {
      this.loading.set(true);
    }
    this.refreshing.set(true);
    this.searching.set(true);
    this.error.set(null);
    this.api
      .searchLeads(this.searchPayload(), this.pageIndex, this.pageSize, this.sort)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
          this.searching.set(false);
          this.hasLoaded.set(true);
        })
      )
      .subscribe({
        next: page => {
          this.leads.set(page.content);
          this.totalElements.set(page.totalElements);
          this.error.set(null);
        },
        error: () => {
          const msg = first ? 'Unable to load leads. Please retry.' : 'Search failed. Please retry.';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: first ? 'Load failed' : 'Search failed', detail: msg });
        }
      });
  }

  onPageChange(event: { page?: number; rows?: number }): void {
    this.pageIndex = event.page ?? 0;
    if (event.rows && event.rows !== this.pageSize) {
      this.pageSize = event.rows;
      this.pageIndex = 0;
    }
    this.reloadLeads(false);
  }

  onKeywordChange(value: string): void {
    this.filter = { ...this.filter, keyword: value };
  }

  clearFilters(): void {
    this.filter = {};
    this.applied = {};
    this.filterYearId = null;
    this.filterClasses.set([]);
    this.pageIndex = 0;
    this.reloadLeads(false);
  }

  onFilterYearChange(yearId: number | null): void {
    this.filterYearId = yearId;
    this.filter.classId = null;
    this.filter.academicYearId = yearId;
    this.filterClasses.set([]);
    if (!yearId) return;
    this.api.academicClasses(yearId).subscribe({
      next: classes => this.filterClasses.set(classes)
    });
  }

  private searchPayload(): LeadSearchRequest {
    const className = this.filterClasses().find(c => c.id === this.applied.classId)?.name
      ?? this.filter.classInterestedIn
      ?? this.filter.classInterested
      ?? null;
    return {
      keyword: this.filter.keyword,
      status: this.applied.status,
      counselorId: this.applied.counselorId,
      source: this.applied.source ?? this.applied.inquirySource,
      classInterestedIn: className,
      academicYearId: this.applied.academicYearId ?? this.filterYearId,
      classId: this.applied.classId,
      followUpFrom: this.applied.followUpFrom,
      followUpTo: this.applied.followUpTo
    };
  }

  get listViewMode(): AppListViewMode {
    return this.viewMode() === 'card' ? 'grid' : 'table';
  }

  get pageSizeOptions(): number[] {
    return UI_PAGINATION.options;
  }

  onListViewModeChange(mode: AppListViewMode): void {
    this.viewMode.set(mode === 'grid' ? 'card' : 'table');
  }

  setView(mode: 'table' | 'card'): void {
    this.viewMode.set(mode);
  }

  openDialog(lead?: LeadRecord): void {
    this.editingLead.set(lead ?? null);
    if (lead) {
      this.leadForm.patchValue({
        name: lead.name,
        mobileNumber: lead.mobileNumber,
        email: lead.email ?? '',
        classInterestedIn: lead.classInterestedIn,
        academicYearId: lead.academicYearId ?? null,
        classId: lead.classId ?? null,
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
        academicYearId: null,
        classId: null,
        address: '',
        inquirySource: '',
        referredBy: '',
        comments: '',
        assignedCounselorId: null,
        nextFollowUpDate: ''
      });
    }
    this.dialogVisible = true;
    if (lead?.academicYearId) {
      this.onYearChange(lead.academicYearId, lead.classId ?? null);
    }
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingLead.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openDrawer: null, openCreate: null },
      queryParamsHandling: 'merge'
    });
  }

  saveLead(): void {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }
    const className = this.classes().find(c => c.id === this.leadForm.value.classId)?.name
      ?? this.leadForm.value.classInterestedIn
      ?? '';
    const payload = {
      ...this.leadForm.getRawValue(),
      classInterestedIn: className
    } as LeadCreateRequest;
    const editing = this.editingLead();
    this.saving.set(true);

    const req$ = editing
      ? this.api.updateLead(editing.inquiryId, payload)
      : this.api.createLead(payload);

    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: created => {
        this.messages.add({
          severity: 'success',
          summary: editing ? 'Lead updated' : 'Lead created',
          detail: editing
            ? 'Changes saved successfully.'
            : `Lead created${created.inquiryNumber ? ` as ${created.inquiryNumber}` : ''}.`
        });
        this.closeDialog();
        this.runSearch();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save lead.' })
    });
  }

  openLead(lead: LeadRecord): void {
    this.persistListContext();
    this.nav.toLead(lead.inquiryId, 'leads');
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
    this.openDialog(lead);
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
    this.counselorTarget.set(lead);
    this.counselorPickerOpen.set(true);
  }

  onCounselorPicked(person: CounselorOption): void {
    const lead = this.counselorTarget();
    this.counselorPickerOpen.set(false);
    if (!lead) return;
    this.api.assignCounselor(lead.inquiryId, person.staffId).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: 'Assigned',
          detail: `${person.fullName} assigned as counselor.`
        });
        this.runSearch();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Assignment failed.' })
    });
  }

  onYearChange(yearId: number | null, keepClassId: number | null = null): void {
    this.classes.set([]);
    if (!yearId) {
      this.leadForm.patchValue({ classId: null, classInterestedIn: '' });
      return;
    }
    this.api.academicClasses(yearId).subscribe({
      next: classes => {
        this.classes.set(classes);
        this.leadForm.patchValue({ classId: keepClassId });
      }
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

  formatStatus(status: LeadStatus): string {
    return formatAdmissionsLabel(status);
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

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.pageIndex,
      size: this.pageSize,
      search: this.filter.keyword ?? ''
    });
  }
}
