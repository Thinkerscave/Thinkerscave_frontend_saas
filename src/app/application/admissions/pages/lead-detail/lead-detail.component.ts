import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { Menu, MenuModule } from 'primeng/menu';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import {
  SaasPillComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { CounselorPickerComponent } from '../../components/counselor-picker/counselor-picker.component';
import {
  CONTACT_RELATIONSHIP_OPTIONS,
  FOLLOW_UP_TYPES,
  GENDER_OPTIONS,
  LOST_REASON_OPTIONS,
  TRISTATE_OPTIONS,
  formatAdmissionsLabel
} from '../../data/admissions-workspace.config';
import {
  CounselingNote,
  CounselorOption,
  FollowUpRecord,
  FollowUpType,
  LeadFullDetail,
  LeadRecord,
  LeadStatus,
  LeadTimelineItem,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';

type DetailTab = 'overview' | 'activity' | 'counseling';
const PERMISSION_RESOURCE = 'ADMISSIONS_LEADS';

interface AttentionItem {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  action?: () => void;
}

@Component({
  selector: 'app-lead-detail',
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
    SaasTabsComponent,
    SaasPillComponent,
    CounselorPickerComponent
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './lead-detail.component.html'
})
export class LeadDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdmissionsCrmService);
  private readonly nav = inject(AdmissionsNavService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageHeader = inject(BreadCrumbService);
  readonly permissions = inject(PermissionService);

  readonly followUpTypeOptions = FOLLOW_UP_TYPES.map(t => ({ label: formatAdmissionsLabel(t), value: t }));
  readonly counselingModeOptions = this.followUpTypeOptions;
  readonly genderOptions = GENDER_OPTIONS;
  readonly relationshipOptions = CONTACT_RELATIONSHIP_OPTIONS;
  readonly tristateOptions = TRISTATE_OPTIONS;
  readonly lostReasonOptions = LOST_REASON_OPTIONS;
  readonly leadStatusOptions = [
    { label: 'New', value: 'NEW' },
    { label: 'Contacted', value: 'CONTACTED' },
    { label: 'Interested', value: 'INTERESTED' },
    { label: 'Application Started', value: 'APPLICATION_STARTED' },
    { label: 'Application Submitted', value: 'APPLICATION_SUBMITTED' }
  ];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly detail = signal<LeadFullDetail | null>(null);
  readonly activeTab = signal<DetailTab>('overview');
  readonly showLostDialog = signal(false);
  readonly reopening = signal(false);
  readonly counselorPickerOpen = signal(false);
  readonly scheduleFollowUpOpen = signal(false);
  readonly scheduleTarget = signal<FollowUpRecord | null>(null);
  readonly counselingFollowUpId = signal<number | null>(null);
  readonly editLeadOpen = signal(false);
  readonly addCounselingOpen = signal(false);
  readonly years = signal<LookupOption[]>([]);
  readonly classes = signal<LookupOption[]>([]);
  readonly eligibleCounselors = signal<CounselorOption[]>([]);

  readonly activityItems = signal<LeadTimelineItem[]>([]);
  readonly activityLoading = signal(false);

  leadId = 0;

  get lostVisible(): boolean {
    return this.showLostDialog();
  }
  set lostVisible(value: boolean) {
    this.showLostDialog.set(value);
  }

  get d(): LeadFullDetail {
    return this.detail()!;
  }

  readonly tabs: SaasTab[] = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-user' },
    { key: 'activity', label: 'Activity', icon: 'pi pi-history' },
    { key: 'counseling', label: 'Counseling', icon: 'pi pi-comments' }
  ];

  readonly lifecycleOrder: { key: LeadStatus | 'ENROLLED'; label: string }[] = [
    { key: 'NEW', label: 'Lead Created' },
    { key: 'CONTACTED', label: 'Contacted' },
    { key: 'INTERESTED', label: 'Interested' },
    { key: 'APPLICATION_STARTED', label: 'Application' },
    { key: 'APPLICATION_SUBMITTED', label: 'Approved' },
    { key: 'ENROLLED', label: 'Enrolled' }
  ];

  readonly followUpForm = this.fb.group({
    followUpType: ['CALL', Validators.required],
    followUpDate: ['', Validators.required],
    remarks: ['']
  });

  readonly counselingForm = this.fb.group({
    sessionAt: ['', Validators.required],
    mode: ['CALL', Validators.required],
    counselorStaffId: [null as number | null, Validators.required],
    studentRequirements: [''],
    parentConcerns: [''],
    campusVisitInfo: [''],
    recommendations: [''],
    notes: ['', [Validators.required, Validators.minLength(3)]],
    leadStatus: [null as LeadStatus | null],
    nextFollowUpAt: ['']
  });

  readonly lostForm = this.fb.group({
    reasonCategory: ['', Validators.required],
    reasonDetail: ['']
  });

  readonly editLeadForm = this.fb.group({
    name: ['', Validators.required],
    dateOfBirth: [''],
    gender: [''],
    currentClass: [''],
    classId: [null as number | null, Validators.required],
    academicYearId: [null as number | null, Validators.required],
    previousSchool: [''],
    parentContactName: ['', Validators.required],
    contactRelationship: [''],
    mobileNumber: ['', Validators.required],
    alternateMobileNumber: [''],
    email: [''],
    address: [''],
    campusPreference: [''],
    transportRequired: [''],
    hostelRequired: [''],
    otherRequirements: [''],
    comments: ['']
  });

  ngOnInit(): void {
    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.leadId) {
      this.nav.back(this.route, '/app/admissions/leads');
      return;
    }
    this.load();
    // Permissions can arrive after the lead payload; rebuild overflow actions when ready.
    if (!this.permissions.isLoaded()) {
      this.permissions
        .loadPermissions()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.rebuildMoreMenu());
    }
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .leadFullDetail(this.leadId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: d => {
          this.detail.set(d);
          this.activityItems.set(d.timeline ?? []);
          this.rebuildMoreMenu();
          const leadNo = d.inquiry.inquiryNumber || `LEAD-${d.inquiry.inquiryId}`;
          const student = d.inquiry.studentName || d.inquiry.name || 'Lead';
          this.pageHeader.setPageHeader({
            title: leadNo,
            subtitle: `${student} · ${this.headerStatusLabel()}`
          });
        },
        error: () => {
          const msg = 'Unable to load lead detail.';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: msg });
        }
      });
  }

  onTabChange(key: string): void {
    this.activeTab.set(key as DetailTab);
    if (key === 'activity' && !this.activityItems().length) {
      this.loadActivity();
    }
  }

  goBack(): void {
    this.nav.back(this.route, '/app/admissions/leads');
  }

  // ─── Identity / header helpers ──────────────────────────────────────────

  initials(name: string | null | undefined): string {
    if (!name) return '—';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '—';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  statusTone(status: LeadStatus): 'info' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'INTERESTED':
      case 'APPLICATION_STARTED':
      case 'APPLICATION_SUBMITTED':
        return 'success';
      case 'LOST':
        return 'danger';
      default:
        return 'info';
    }
  }

  statusLabel(status: LeadStatus | string | null | undefined): string {
    return formatAdmissionsLabel(status);
  }

  /** Header pill reflects enrollment/application progress, not only raw inquiry.status. */
  headerStatusLabel(): string {
    const d = this.detail();
    if (!d) return '—';
    if (d.studentId) return 'Enrolled';
    if (d.applicationStatus === 'APPROVED') return 'Approved';
    if (d.applicationStatus === 'SUBMITTED' || d.applicationStatus === 'UNDER_REVIEW') return 'Submitted';
    if (d.applicationStatus === 'DRAFT' || d.inquiry.status === 'APPLICATION_STARTED') return 'Application';
    return this.statusLabel(d.inquiry.status);
  }

  headerStatusTone(): 'info' | 'success' | 'warning' | 'danger' {
    const d = this.detail();
    if (!d) return 'info';
    if (d.studentId || d.applicationStatus === 'APPROVED') return 'success';
    if (d.inquiry.status === 'LOST') return 'danger';
    if (d.applicationStatus === 'DRAFT' || d.inquiry.status === 'APPLICATION_STARTED') return 'warning';
    return this.statusTone(d.inquiry.status);
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  // ─── Permissions ─────────────────────────────────────────────────────────

  get canManage(): boolean {
    return this.permissions.canManage(PERMISSION_RESOURCE);
  }

  // ─── Lifecycle indicator ────────────────────────────────────────────────

  get isLost(): boolean {
    return this.detail()?.inquiry.status === 'LOST';
  }

  currentLifecycleIndex(): number {
    const status = this.detail()?.inquiry.status;
    if (!status) return 0;
    const map: Record<string, number> = {
      NEW: 0,
      CONTACTED: 1,
      INTERESTED: 2,
      APPLICATION_STARTED: 3,
      APPLICATION_SUBMITTED: 4,
      LOST: -1
    };
    const enrolled = this.detail()?.studentId;
    if (enrolled) return 5;
    return map[status] ?? 0;
  }

  stepState(index: number): 'done' | 'active' | 'pending' {
    const current = this.currentLifecycleIndex();
    if (current < 0) return 'pending';
    if (index < current) return 'done';
    if (index === current) return 'active';
    return 'pending';
  }

  isLast(index: number, total: number): boolean {
    return index >= total - 1;
  }

  // ─── Header contextual actions ──────────────────────────────────────────

  applicationActionLabel(): string {
    const d = this.detail();
    if (!d) return 'Start Application';
    if (d.studentId) return 'View Student';
    if (!d.applicationId) return 'Start Application';
    if (d.applicationStatus === 'DRAFT') return 'Continue Application';
    return 'View Application';
  }

  canProceedToApplication(): boolean {
    const d = this.detail();
    const status = d?.inquiry.status;
    return !!status && status !== 'LOST' && !d?.applicationId;
  }

  primaryAction(): void {
    const d = this.detail();
    if (!d) return;
    if (d.studentId) {
      void this.router.navigate(['/app/students/profile', d.studentId]);
      return;
    }
    if (d.applicationId) {
      this.nav.toApplication(d.applicationId);
      return;
    }
    this.proceedToApplication();
  }

  continueApplication(): void {
    const id = this.detail()?.applicationId;
    if (id) this.nav.toApplication(id);
  }

  get contactMobile(): string | null {
    return this.detail()?.inquiry.mobileNumber || null;
  }
  get contactEmail(): string | null {
    return this.detail()?.inquiry.email || null;
  }

  // ─── Next follow-up (authoritative Follow-up entity, not the denormalized Lead date) ────

  readonly nextFollowUp = computed<FollowUpRecord | null>(() => {
    const d = this.detail();
    if (!d) return null;
    const scheduled = d.followUps.filter(
      f => (f.lifecycleStatus === 'SCHEDULED' || f.lifecycleStatus === 'RESCHEDULED') && f.followUpDate
    );
    if (!scheduled.length) return null;
    return scheduled
      .slice()
      .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())[0];
  });

  isFollowUpOverdue(f: FollowUpRecord | null): boolean {
    if (!f?.followUpDate) return false;
    return new Date(f.followUpDate).getTime() < Date.now();
  }

  overdueDays(f: FollowUpRecord | null): number {
    if (!f?.followUpDate) return 0;
    const diff = Date.now() - new Date(f.followUpDate).getTime();
    return Math.max(0, Math.round(diff / 86400000));
  }

  // ─── Assignment date (derived from the audit trail — no dedicated column needed) ────────

  assignmentDate(): string | null {
    const item = this.detail()?.timeline?.find(t => t.category === 'ASSIGNMENT');
    return item?.performedAt || item?.performedOn || null;
  }

  // ─── More menu ───────────────────────────────────────────────────────────

  readonly moreMenuItems = signal<MenuItem[]>([]);

  private rebuildMoreMenu(): void {
    const d = this.detail();
    if (!d || !this.permissions.canManage(PERMISSION_RESOURCE)) {
      this.moreMenuItems.set([]);
      return;
    }
    const items: MenuItem[] = [
      { label: 'Edit Lead', icon: 'pi pi-pencil', command: () => this.openEditLead() },
      {
        label: d.inquiry.assignedCounselorId ? 'Reassign Counselor' : 'Assign Counselor',
        icon: 'pi pi-user-edit',
        command: () => this.submitAssign()
      }
    ];
    if (d.inquiry.status !== 'LOST') {
      items.push({ label: 'Mark Lost', icon: 'pi pi-times-circle', command: () => this.openLostDialog() });
    } else {
      items.push({ label: 'Reopen Lead', icon: 'pi pi-refresh', command: () => this.reopenLead() });
    }
    items.push({
      label: 'Archive Lead',
      icon: 'pi pi-trash',
      command: () => this.archiveLead()
    });
    this.moreMenuItems.set(items);
  }

  openRowMenu(event: Event, menu: Menu): void {
    menu.toggle(event);
  }

  // ─── Attention Required ─────────────────────────────────────────────────

  readonly attentionItems = computed<AttentionItem[]>(() => {
    const d = this.detail();
    if (!d) return [];
    const items: AttentionItem[] = [];
    const upcoming = this.nextFollowUp();
    if (upcoming && d.inquiry.status !== 'LOST' && this.isFollowUpOverdue(upcoming)) {
      const days = this.overdueDays(upcoming);
      items.push({
        icon: 'pi pi-exclamation-triangle',
        title: 'Follow-up Overdue',
        message: `This lead was scheduled for a follow-up on ${this.formatDateTime(upcoming.followUpDate)} (${days} day${days === 1 ? '' : 's'} ago). Please take action.`,
        actionLabel: 'Record Counseling',
        action: () => this.openAddCounseling(upcoming)
      });
    }
    if (!d.inquiry.assignedCounselorId && d.inquiry.status !== 'LOST' && this.canManage) {
      items.push({
        icon: 'pi pi-user-plus',
        title: 'No Counselor Assigned',
        message: 'This lead has no counselor yet. Assign one so follow-up ownership is clear.',
        actionLabel: 'Assign Counselor',
        action: () => this.submitAssign()
      });
    }
    if (d.applicationId && d.applicationStatus === 'DRAFT') {
      items.push({
        icon: 'pi pi-file-edit',
        title: 'Application Incomplete',
        message: 'An application has been started but not yet submitted.',
        actionLabel: 'Continue Application',
        action: () => this.nav.toApplication(d.applicationId!)
      });
    }
    return items;
  });

  // ─── Activity tab ───────────────────────────────────────────────────────

  activityStats() {
    const items = this.activityItems();
    return {
      total: items.length,
      followUps: items.filter(i => i.category === 'FOLLOW_UP').length,
      counseling: items.filter(i => i.category === 'COUNSELING').length,
      statusChanges: items.filter(i => i.category === 'STATUS').length
    };
  }

  loadActivity(): void {
    this.activityLoading.set(true);
    this.api
      .leadTimeline(this.leadId)
      .pipe(finalize(() => this.activityLoading.set(false)))
      .subscribe({
        next: items => this.activityItems.set(items),
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not load activity.' })
      });
  }

  // ─── Status / lost / reopen ──────────────────────────────────────────────

  openLostDialog(): void {
    this.lostForm.reset({ reasonCategory: '', reasonDetail: '' });
    this.showLostDialog.set(true);
  }

  closeLostDialog(): void {
    this.showLostDialog.set(false);
  }

  get lostReasonNeedsDetail(): boolean {
    return this.lostForm.value.reasonCategory === 'Other';
  }

  confirmMarkLost(): void {
    const category = (this.lostForm.value.reasonCategory || '').trim();
    const detail = (this.lostForm.value.reasonDetail || '').trim();
    if (!category || (category === 'Other' && !detail)) {
      this.lostForm.markAllAsTouched();
      return;
    }
    const reason = category === 'Other' ? detail : (detail ? `${category} — ${detail}` : category);
    this.saving.set(true);
    this.api
      .markLost(this.leadId, reason)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.showLostDialog.set(false);
          this.messages.add({ severity: 'warn', summary: 'Lost', detail: 'Lead closed as lost.' });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not mark lost.' })
      });
  }

  reopenLead(): void {
    this.confirm.confirm({
      header: 'Reopen Lead',
      message: 'Reopen this lost lead and resume follow-up? The lost history will be preserved.',
      accept: () => {
        this.reopening.set(true);
        this.api
          .reopenLead(this.leadId)
          .pipe(finalize(() => this.reopening.set(false)))
          .subscribe({
            next: () => {
              this.messages.add({ severity: 'success', summary: 'Reopened', detail: 'Lead reopened.' });
              this.load();
            },
            error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not reopen lead.' })
          });
      }
    });
  }

  archiveLead(): void {
    this.confirm.confirm({
      header: 'Archive Lead',
      message: 'Archive this lead? It will be hidden from active lead lists.',
      accept: () => {
        this.api.archiveLead(this.leadId).subscribe({
          next: () => {
            this.messages.add({ severity: 'success', summary: 'Archived', detail: 'Lead archived.' });
            this.goBack();
          },
          error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not archive lead.' })
        });
      }
    });
  }

  proceedToApplication(): void {
    if (!this.canProceedToApplication()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Cannot convert',
        detail: this.detail()?.applicationId
          ? 'An application already exists for this lead.'
          : 'Lost leads cannot be converted.'
      });
      return;
    }
    this.confirm.confirm({
      header: 'Proceed to Application',
      message: `Convert ${this.detail()?.inquiry.name} into an admission application?`,
      accept: () => {
        this.api.convertToApplication(this.leadId).subscribe({
          next: app => this.nav.toApplication(app.applicationId),
          error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not convert lead.' })
        });
      }
    });
  }

  // ─── Counselor assignment ───────────────────────────────────────────────

  submitAssign(): void {
    this.counselorPickerOpen.set(true);
  }

  onCounselorPicked(person: CounselorOption): void {
    this.counselorPickerOpen.set(false);
    this.api.assignCounselor(this.leadId, person.staffId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Assigned', detail: `${person.fullName} assigned.` });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Assignment failed.' })
    });
  }

  // ─── Follow-ups (planned actions) ────────────────────────────────────────

  openScheduleFollowUp(existing?: FollowUpRecord | null): void {
    this.scheduleTarget.set(existing ?? null);
    const seed = existing?.followUpDate
      ? this.toDateTimeLocal(existing.followUpDate)
      : this.toDateTimeLocal(new Date().toISOString());
    this.followUpForm.reset({
      followUpType: existing?.followUpType || 'CALL',
      followUpDate: seed,
      remarks: existing?.remarks || ''
    });
    this.scheduleFollowUpOpen.set(true);
  }

  closeScheduleFollowUp(): void {
    this.scheduleFollowUpOpen.set(false);
    this.scheduleTarget.set(null);
  }

  submitFollowUp(): void {
    if (this.followUpForm.invalid) {
      this.followUpForm.markAllAsTouched();
      return;
    }
    const raw = this.followUpForm.getRawValue();
    const followUpDate = raw.followUpDate ? new Date(raw.followUpDate).toISOString() : null;
    this.saving.set(true);
    const target = this.scheduleTarget();
    const request$ = target
      ? this.api.updateFollowUp(target.followUpId, {
          followUpType: raw.followUpType as FollowUpRecord['followUpType'],
          remarks: raw.remarks || null,
          followUpDate
        })
      : this.api.addFollowUp(this.leadId, {
          followUpType: raw.followUpType as FollowUpRecord['followUpType'],
          remarks: raw.remarks || null,
          followUpDate
        });

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.closeScheduleFollowUp();
        this.messages.add({
          severity: 'success',
          summary: target ? 'Rescheduled' : 'Scheduled',
          detail: target ? 'Follow-up rescheduled.' : 'Follow-up scheduled.'
        });
        this.load();
      },
      error: () =>
        this.messages.add({
          severity: 'error',
          summary: 'Error',
          detail: target ? 'Could not reschedule follow-up.' : 'Could not schedule follow-up.'
        })
    });
  }

  // ─── Counseling (actual interaction) ─────────────────────────────────────

  openAddCounseling(pendingFollowUp?: FollowUpRecord | null): void {
    const now = new Date();
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    // Only associate when opened from a specific pending follow-up (or overdue attention).
    this.counselingFollowUpId.set(pendingFollowUp?.followUpId ?? null);
    this.counselingForm.reset({
      sessionAt: iso,
      mode: pendingFollowUp?.followUpType || 'CALL',
      counselorStaffId: this.detail()?.inquiry.assignedCounselorId ?? null,
      studentRequirements: '',
      parentConcerns: '',
      campusVisitInfo: '',
      recommendations: '',
      notes: '',
      leadStatus: null,
      nextFollowUpAt: ''
    });
    if (!this.eligibleCounselors().length) {
      this.api.searchCounselors('', 0, 100).subscribe(page => this.eligibleCounselors.set(page.content));
    }
    this.addCounselingOpen.set(true);
  }

  closeAddCounseling(): void {
    this.addCounselingOpen.set(false);
    this.counselingFollowUpId.set(null);
  }

  submitCounseling(): void {
    if (this.counselingForm.invalid) {
      this.counselingForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.counselingForm.getRawValue();
    const nextFollowUpAt = raw.nextFollowUpAt ? new Date(raw.nextFollowUpAt).toISOString() : null;
    this.api
      .addCounselingNote(this.leadId, {
        sessionAt: raw.sessionAt || null,
        mode: raw.mode as FollowUpType,
        counselorStaffId: raw.counselorStaffId,
        studentRequirements: raw.studentRequirements,
        parentConcerns: raw.parentConcerns,
        campusVisitInfo: raw.campusVisitInfo,
        recommendations: raw.recommendations,
        notes: raw.notes!,
        leadStatus: (raw.leadStatus as LeadStatus | null) || null,
        nextFollowUpAt,
        followUpId: this.counselingFollowUpId()
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.closeAddCounseling();
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Counseling note added.' });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not save note.' })
      });
  }

  private toDateTimeLocal(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  // ─── Edit Lead ───────────────────────────────────────────────────────────

  openEditLead(): void {
    const lead = this.detail()?.inquiry;
    if (!lead) return;
    this.editLeadForm.reset({
      name: lead.studentName || lead.name,
      dateOfBirth: lead.dateOfBirth ?? '',
      gender: lead.gender ?? '',
      currentClass: lead.currentClass ?? '',
      classId: lead.classId ?? null,
      academicYearId: lead.academicYearId ?? null,
      previousSchool: lead.previousSchool ?? '',
      parentContactName: lead.parentContactName ?? '',
      contactRelationship: lead.contactRelationship ?? '',
      mobileNumber: lead.mobileNumber ?? '',
      alternateMobileNumber: lead.alternateMobileNumber ?? '',
      email: lead.email ?? '',
      address: lead.address ?? '',
      campusPreference: lead.campusPreference ?? '',
      transportRequired: lead.transportRequired ?? '',
      hostelRequired: lead.hostelRequired ?? '',
      otherRequirements: lead.otherRequirements ?? '',
      comments: lead.comments ?? ''
    });
    if (!this.years().length) {
      this.api.academicYears().subscribe(years => this.years.set(years));
    }
    if (lead.academicYearId) {
      this.api.academicClasses(lead.academicYearId).subscribe(classes => this.classes.set(classes));
    }
    this.editLeadOpen.set(true);
  }

  onEditYearChange(yearId: number): void {
    this.editLeadForm.patchValue({ classId: null });
    this.api.academicClasses(yearId).subscribe(classes => this.classes.set(classes));
  }

  closeEditLead(): void {
    this.editLeadOpen.set(false);
  }

  saveEditLead(): void {
    if (this.editLeadForm.invalid) {
      this.editLeadForm.markAllAsTouched();
      return;
    }
    const lead = this.detail()?.inquiry as LeadRecord;
    const raw = this.editLeadForm.getRawValue();
    const className = this.classes().find(c => c.id === raw.classId)?.name ?? lead.classInterestedIn;
    this.saving.set(true);
    this.api
      .updateLead(this.leadId, {
        name: (raw.name || '').trim(),
        parentContactName: (raw.parentContactName || '').trim(),
        mobileNumber: (raw.mobileNumber || '').trim(),
        classInterestedIn: className,
        academicYearId: raw.academicYearId,
        classId: raw.classId,
        inquirySource: lead.inquirySource,
        referredBy: lead.referredBy,
        comments: (raw.comments || '').trim() || null,
        email: raw.email || null,
        address: raw.address || null,
        dateOfBirth: raw.dateOfBirth || null,
        gender: raw.gender || null,
        currentClass: raw.currentClass || null,
        previousSchool: raw.previousSchool || null,
        alternateMobileNumber: raw.alternateMobileNumber || null,
        contactRelationship: raw.contactRelationship || null,
        campusPreference: raw.campusPreference || null,
        transportRequired: raw.transportRequired || null,
        hostelRequired: raw.hostelRequired || null,
        otherRequirements: raw.otherRequirements || null
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editLeadOpen.set(false);
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Lead updated.' });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not update lead.' })
      });
  }

  // ─── Track-by ────────────────────────────────────────────────────────────

  trackFollow(_i: number, f: FollowUpRecord): number {
    return f.followUpId;
  }

  trackNote(_i: number, n: CounselingNote): number {
    return n.noteId ?? _i;
  }

  trackTimeline(_i: number, t: LeadTimelineItem): string {
    return `${t.performedAt || t.performedOn || _i}-${t.action}`;
  }

  activityIcon(item: LeadTimelineItem): string {
    if (item.icon) return item.icon;
    const category = (item.category || '').toUpperCase();
    switch (category) {
      case 'FOLLOW_UP': return 'pi pi-phone';
      case 'ASSIGNMENT': return 'pi pi-user-edit';
      case 'COUNSELING': return 'pi pi-comments';
      case 'APPLICATION': return 'pi pi-file-edit';
      case 'STATUS': return 'pi pi-flag';
      case 'LEAD': return 'pi pi-user-plus';
      default: return 'pi pi-circle-fill';
    }
  }

  activityTone(item: LeadTimelineItem): string {
    if (item.tone) return item.tone;
    const action = (item.action || '').toUpperCase();
    if (action.includes('LOST')) return 'danger';
    if (action.includes('COMPLETED') || action.includes('APPROVED') || action.includes('ENROLLMENT')) return 'success';
    if (action.includes('OVERDUE') || action.includes('CANCELLED')) return 'warning';
    const category = (item.category || '').toUpperCase();
    switch (category) {
      case 'ASSIGNMENT': return 'info';
      case 'COUNSELING': return 'info';
      default: return 'neutral';
    }
  }
}
