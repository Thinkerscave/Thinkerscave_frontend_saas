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
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { Menu, MenuModule } from 'primeng/menu';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas';
import { TcAcademicYearSelectorComponent } from '../../../../shared/ui/academic-year-selector';
import { AppListResultsComponent, AppListToolbarComponent, AppListViewMode, AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { ListContextService } from '../../../../core/services/list-context.service';
import { ViewPreferenceService } from '../../../services/view-preference.service';
import { CounselorPickerComponent } from '../../components/counselor-picker/counselor-picker.component';
import {
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  formatAdmissionsLabel
} from '../../data/admissions-workspace.config';
import {
  CounselorOption,
  LeadCreateRequest,
  LeadRecord,
  LeadSearchRequest,
  LeadSource,
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
  imports: [
    AppToastComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    ConfirmDialogModule,
    DialogModule,
    MenuModule,
    SaasPageHeaderComponent,
    TcAcademicYearSelectorComponent,
    SaasPanelComponent,
    TcPageSkeletonComponent,
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

  readonly inquirySourceOptions: SelectOption<LeadSource>[] = LEAD_SOURCE_OPTIONS.map(s => ({
    label: formatAdmissionsLabel(s),
    value: s as LeadSource
  }));
  readonly statusSelectOptions: SelectOption[] = [
    ...LEAD_STATUS_OPTIONS.map(s => ({ label: formatAdmissionsLabel(s), value: s }))
  ];
  readonly sourceSelectOptions: SelectOption[] = [
    ...LEAD_SOURCE_OPTIONS.map(s => ({ label: formatAdmissionsLabel(s), value: s }))
  ];
  /** Both scopes are available to every Leads-page user — no role/privilege gating. */
  readonly scopeOptions: SelectOption<'MY' | 'ALL'>[] = [
    { label: 'My Leads', value: 'MY' },
    { label: 'All Leads', value: 'ALL' }
  ];

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly hasLoaded = signal(false);
  readonly searching = signal(false);
  readonly error = signal<string | null>(null);
  readonly leads = signal<LeadRecord[]>([]);
  readonly totalElements = signal(0);
  readonly viewMode = signal<'table' | 'card'>(this.viewPrefs.globalDefault() === 'grid' ? 'card' : 'table');
  leadDialogVisible = false;
  moreFiltersVisible = false;
  rowMenuItems: MenuItem[] = [];
  readonly saving = signal(false);
  readonly editingLead = signal<LeadRecord | null>(null);
  readonly counselorPickerOpen = signal(false);
  readonly counselorTarget = signal<LeadRecord | null>(null);
  readonly years = signal<LookupOption[]>([]);
  readonly classes = signal<LookupOption[]>([]);
  readonly filterClasses = signal<LookupOption[]>([]);
  readonly counselorOptions = signal<SelectOption<number | null>[]>([]);
  filterYearId: number | null = null;
  /** Default tab: My Leads (created by current user). */
  leadScope: 'MY' | 'ALL' = 'MY';

  pageIndex = 0;
  pageSize = UI_PAGINATION.defaultSize;

  /** Hint only — backend enforces scope sort before pagination. */
  get sort(): string {
    return this.leadScope === 'ALL'
      ? 'nextFollowUpDate,asc'
      : 'createdOn,desc';
  }

  filter: LeadSearchRequest = {};
  private applied: LeadSearchRequest = { scope: 'MY' };

  readonly leadForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentContactName: ['', [Validators.required, Validators.minLength(2)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^(?:\+91[\s-]?)?[6-9]\d{9}$/)]],
    classInterestedIn: [''],
    academicYearId: [null as number | null, Validators.required],
    classId: [null as number | null, Validators.required],
    inquirySource: [null as LeadSource | null, Validators.required],
    referredBy: [''],
    comments: [''],
    allowPotentialDuplicate: [false]
  });

  ngOnInit(): void {
    const saved = this.listContext.consume(LIST_KEY);
    if (saved) {
      this.pageIndex = saved.page ?? this.pageIndex;
      this.pageSize = saved.size ?? this.pageSize;
      this.viewMode.set(saved.view === 'grid' ? 'card' : 'table');
      if (saved.search) {
        this.filter = { ...this.filter, keyword: saved.search };
      }
    }

    this.api.academicYears().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: years => {
        this.years.set(years);
        if (this.leadDialogVisible && !this.editingLead() && !this.leadForm.value.academicYearId) {
          this.applyDefaultAcademicYear(years);
        }
      }
    });
    this.api.searchCounselors('', 0, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => this.counselorOptions.set(
        (page.content ?? []).map(c => ({ label: c.fullName, value: c.staffId }))
      )
    });

    this.leadForm.controls.inquirySource.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(source => {
        const referred = this.leadForm.controls.referredBy;
        if (source === 'REFERRAL') {
          referred.setValidators([Validators.required, Validators.minLength(2)]);
        } else {
          referred.clearValidators();
          referred.setValue('');
        }
        referred.updateValueAndValidity({ emitEvent: false });
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const status = params.get('status');
      const openCreate = params.get('openCreate') ?? params.get('openDrawer');
      if (status) {
        this.filter = { ...this.filter, status: status as LeadStatus };
        this.applied = { ...this.applied, status: status as LeadStatus };
      }
      if (openCreate === '1') {
        this.openLeadDialog();
      }
      this.loadInitial();
    });
  }

  loadInitial(): void {
    this.reloadLeads(true);
  }

  onAcademicYearChange(yearId: number | null): void {
    this.onFilterYearChange(yearId);
    this.applied = { ...this.filter, academicYearId: this.filterYearId, scope: this.leadScope };
    this.pageIndex = 0;
    this.reloadLeads(!this.hasLoaded());
  }

  runSearch(): void {
    this.applied = { ...this.filter, academicYearId: this.filterYearId, scope: this.leadScope };
    this.pageIndex = 0;
    this.reloadLeads(false);
  }

  applyQuery(): void {
    this.pageIndex = 0;
    this.applied = { ...this.filter, academicYearId: this.filterYearId, scope: this.leadScope };
    this.reloadLeads(false);
  }

  setLeadScope(scope: 'MY' | 'ALL'): void {
    if (this.leadScope === scope) return;
    this.leadScope = scope;
    this.applyQuery();
  }

  openMoreFilters(): void {
    this.moreFiltersVisible = true;
  }

  applyMoreFilters(): void {
    this.moreFiltersVisible = false;
    this.runSearch();
  }

  clearMoreFilters(): void {
    this.filterClasses.set([]);
    this.filter = {
      ...this.filter,
      classId: null,
      followUpFrom: null,
      followUpTo: null
    };
  }

  get moreFiltersActiveCount(): number {
    let count = 0;
    if (this.filter.classId) count += 1;
    if (this.filter.followUpFrom) count += 1;
    if (this.filter.followUpTo) count += 1;
    return count;
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
    this.filter = { academicYearId: this.filterYearId };
    this.applied = { scope: this.leadScope, academicYearId: this.filterYearId };
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
      followUpTo: this.applied.followUpTo,
      scope: this.applied.scope ?? this.leadScope
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

  get leadDialogTitle(): string {
    return this.editingLead() ? 'Edit Lead' : 'Create Lead';
  }

  get showReferredBy(): boolean {
    return this.leadForm.controls.inquirySource.value === 'REFERRAL';
  }

  openDialog(lead?: LeadRecord): void {
    this.openLeadDialog(lead);
  }

  openLeadDialog(lead?: LeadRecord): void {
    this.editingLead.set(lead ?? null);
    this.leadForm.markAsUntouched();
    this.leadForm.markAsPristine();

    if (lead) {
      this.leadForm.reset({
        name: lead.studentName || lead.name,
        parentContactName: lead.parentContactName || '',
        mobileNumber: lead.mobileNumber,
        classInterestedIn: lead.classInterestedIn,
        academicYearId: lead.academicYearId ?? null,
        classId: lead.classId ?? null,
        inquirySource: lead.inquirySource ?? null,
        referredBy: lead.referredBy ?? '',
        comments: lead.comments ?? '',
        allowPotentialDuplicate: false
      });
      if (lead.academicYearId) {
        this.onYearChange(lead.academicYearId, lead.classId ?? null);
      } else {
        this.classes.set([]);
      }
    } else {
      this.leadForm.reset({
        name: '',
        parentContactName: '',
        mobileNumber: '',
        classInterestedIn: '',
        academicYearId: null,
        classId: null,
        inquirySource: null,
        referredBy: '',
        comments: '',
        allowPotentialDuplicate: false
      });
      this.classes.set([]);
      this.applyDefaultAcademicYear();
    }

    this.leadDialogVisible = true;
  }

  closeLeadDialog(): void {
    if (!this.leadDialogVisible && !this.editingLead()) {
      return;
    }
    this.leadDialogVisible = false;
    this.editingLead.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { openDrawer: null, openCreate: null },
      queryParamsHandling: 'merge'
    });
  }

  saveLead(): void {
    if (this.saving()) {
      return;
    }
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }
    const className = this.classes().find(c => c.id === this.leadForm.value.classId)?.name
      ?? this.leadForm.value.classInterestedIn
      ?? '';
    const raw = this.leadForm.getRawValue();
    const payload: LeadCreateRequest = {
      name: (raw.name || '').trim(),
      parentContactName: (raw.parentContactName || '').trim(),
      mobileNumber: (raw.mobileNumber || '').trim(),
      classInterestedIn: className,
      academicYearId: raw.academicYearId,
      classId: raw.classId,
      inquirySource: raw.inquirySource,
      referredBy: raw.inquirySource === 'REFERRAL' ? (raw.referredBy || '').trim() : null,
      comments: (raw.comments || '').trim() || null,
      allowPotentialDuplicate: !!raw.allowPotentialDuplicate
    };
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
        this.closeLeadDialog();
        this.runSearch();
      },
      error: (err: unknown) => {
        if (!editing && this.isDuplicateLeadError(err) && !payload.allowPotentialDuplicate) {
          this.confirmDuplicateOverride(payload);
          return;
        }
        this.messages.add({
          severity: 'error',
          summary: 'Save failed',
          detail: this.errorDetail(err, 'Could not save lead.')
        });
      }
    });
  }

  private applyDefaultAcademicYear(years: LookupOption[] = this.years()): void {
    const defaultYear = years[0];
    if (!defaultYear) return;
    this.leadForm.patchValue({ academicYearId: defaultYear.id }, { emitEvent: false });
    this.onYearChange(defaultYear.id);
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
    if (lead.assignedCounselorId === person.staffId) {
      this.messages.add({
        severity: 'info',
        summary: 'No change',
        detail: `${person.fullName} is already assigned to this lead.`
      });
      return;
    }

    const wasAssigned = !!lead.assignedCounselorId;
    let reason: string | null = null;
    if (wasAssigned) {
      const promptValue = window.prompt('Reason for reassignment (optional):', '');
      if (promptValue === null) {
        this.messages.add({ severity: 'info', summary: 'Cancelled', detail: 'Counselor reassignment cancelled.' });
        return;
      }
      reason = promptValue.trim() || null;
    }

    this.api.assignCounselor(lead.inquiryId, person.staffId, reason).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: wasAssigned ? 'Reassigned' : 'Assigned',
          detail: wasAssigned
            ? `${person.fullName} reassigned as counselor.`
            : `${person.fullName} assigned as counselor.`
        });
        this.runSearch();
      },
      error: (err: unknown) => this.messages.add({
        severity: 'error',
        summary: 'Error',
        detail: this.errorDetail(err, 'Assignment failed.')
      })
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
    const payload = this.searchPayload();
    this.api.exportLeadsCsv(payload).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admissions-leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Export failed', detail: 'Could not export leads.' })
    });
  }

  formatStatus(status: string): string {
    return formatAdmissionsLabel(status);
  }

  statusTone(status: LeadStatus): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'NEW':
      case 'CONTACTED':
        return 'info';
      case 'INTERESTED':
      case 'APPLICATION_STARTED':
      case 'APPLICATION_SUBMITTED':
        return 'success';
      case 'LOST':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  sourceTone(source: LeadSource | string | null | undefined): 'info' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (source) {
      case 'WEBSITE':
      case 'SOCIAL_MEDIA':
        return 'info';
      case 'WALK_IN':
      case 'WHATSAPP':
        return 'success';
      case 'PHONE':
      case 'CAMPAIGN':
        return 'warning';
      case 'REFERRAL':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  isFollowUpOverdue(lead: LeadRecord): boolean {
    if (!lead.nextFollowUpDate) return false;
    const next = new Date(lead.nextFollowUpDate);
    if (Number.isNaN(next.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);
    return next < today;
  }

  followUpLabel(lead: LeadRecord): string {
    if (!lead.nextFollowUpDate) return 'No follow-up';
    const next = new Date(lead.nextFollowUpDate);
    if (Number.isNaN(next.getTime())) return lead.nextFollowUpDate;
    const formatted = next.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    if (!this.isFollowUpOverdue(lead)) return formatted;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);
    const days = Math.max(1, Math.round((today.getTime() - next.getTime()) / 86_400_000));
    return `Overdue · ${days}d · ${formatted}`;
  }

  openRowMenu(event: Event, lead: LeadRecord, menu: Menu): void {
    event.stopPropagation();
    this.rowMenuItems = [
      {
        label: 'Open Lead 360',
        icon: 'pi pi-eye',
        command: () => this.openLead(lead)
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.openDialog(lead)
      },
      {
        label: lead.assignedCounselorId ? 'Reassign counselor' : 'Assign counselor',
        icon: 'pi pi-user-plus',
        command: () => this.assignCounselor(lead, event)
      },
      {
        label: 'Email',
        icon: 'pi pi-envelope',
        disabled: !lead.email,
        command: () => this.emailContact(lead, event)
      },
      { separator: true },
      {
        label: 'Archive',
        icon: 'pi pi-trash',
        styleClass: 'adm-row-menu__danger',
        command: () => this.deleteLead(lead, event)
      }
    ];
    menu.toggle(event);
  }

  private persistListContext(): void {
    this.listContext.save(LIST_KEY, {
      page: this.pageIndex,
      size: this.pageSize,
      search: this.filter.keyword ?? '',
      view: this.listViewMode
    });
  }

  private confirmDuplicateOverride(payload: LeadCreateRequest): void {
    this.confirm.confirm({
      header: 'Possible duplicate found',
      message: 'A lead with this mobile number already exists. Do you want to continue and create this lead anyway? Use this when the same parent is enquiring for another child.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Create anyway',
      rejectLabel: 'Review',
      accept: () => {
        this.saving.set(true);
        this.api.createLead({ ...payload, allowPotentialDuplicate: true })
          .pipe(finalize(() => this.saving.set(false)))
          .subscribe({
            next: created => {
              this.messages.add({
                severity: 'warn',
                summary: 'Created with duplicate override',
                detail: `Lead created${created.inquiryNumber ? ` as ${created.inquiryNumber}` : ''}.`
              });
              this.closeLeadDialog();
              this.runSearch();
            },
            error: (err: unknown) => this.messages.add({
              severity: 'error',
              summary: 'Save failed',
              detail: this.errorDetail(err, 'Could not save lead.')
            })
          });
      }
    });
  }

  private isDuplicateLeadError(err: unknown): boolean {
    const message = this.errorMessage(err);
    return message.includes('already exists') || message.includes('duplicate');
  }

  private errorDetail(err: unknown, fallback: string): string {
    const message = this.errorMessage(err);
    return message || fallback;
  }

  private errorMessage(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) {
      return '';
    }
    const payload = err.error as { message?: string } | string | null;
    if (typeof payload === 'string' && payload.trim()) {
      return payload.trim();
    }
    if (payload && typeof payload === 'object' && typeof payload.message === 'string') {
      return payload.message.trim();
    }
    return typeof err.message === 'string' ? err.message.trim() : '';
  }
}
