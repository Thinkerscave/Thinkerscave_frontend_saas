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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import {
  SaasPageHeaderComponent,
  SaasPillComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { CounselorPickerComponent } from '../../components/counselor-picker/counselor-picker.component';
import { FOLLOW_UP_TYPES, formatAdmissionsLabel } from '../../data/admissions-workspace.config';
import {
  CounselingNote,
  CounselorOption,
  FollowUpRecord,
  LeadFullDetail,
  LeadStatus,
  LeadTimelineItem
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';

type DetailTab = 'overview' | 'activity' | 'counseling';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    ConfirmDialogModule,
    DialogModule,
    SaasPageHeaderComponent,
    SaasTabsComponent,
    SaasPillComponent,
    CounselorPickerComponent
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './lead-detail.component.html'
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdmissionsCrmService);
  private readonly nav = inject(AdmissionsNavService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly followUpTypeOptions = FOLLOW_UP_TYPES.map(t => ({ label: formatAdmissionsLabel(t), value: t }));
  readonly statusAfterOptions = [
    { label: 'CONTACTED', value: 'CONTACTED' },
    { label: 'INTERESTED', value: 'INTERESTED' },
    { label: 'COUNSELING', value: 'COUNSELING' },
    { label: 'DOCUMENTS_PENDING', value: 'DOCUMENTS_PENDING' },
    { label: 'FOLLOW_UP_REQUIRED', value: 'FOLLOW_UP_REQUIRED' },
    { label: 'READY_FOR_ADMISSION', value: 'READY_FOR_ADMISSION' },
    { label: 'LOST', value: 'LOST' }
  ];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly detail = signal<LeadFullDetail | null>(null);
  readonly activeTab = signal<DetailTab>('overview');
  readonly showLostDialog = signal(false);
  readonly counselorPickerOpen = signal(false);
  readonly completeTarget = signal<FollowUpRecord | null>(null);
  completeOutcome = '';
  completeRemarks = '';

  get completeVisible(): boolean {
    return !!this.completeTarget();
  }
  set completeVisible(value: boolean) {
    if (!value) this.completeTarget.set(null);
  }

  get lostVisible(): boolean {
    return this.showLostDialog();
  }
  set lostVisible(value: boolean) {
    this.showLostDialog.set(value);
  }

  leadId = 0;

  get d(): LeadFullDetail {
    return this.detail()!;
  }

  readonly tabs: SaasTab[] = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-user' },
    { key: 'activity', label: 'Activity', icon: 'pi pi-history' },
    { key: 'counseling', label: 'Counseling', icon: 'pi pi-comments' }
  ];

  readonly followUpForm = this.fb.group({
    followUpType: ['CALL', Validators.required],
    statusAfter: ['CONTACTED' as LeadStatus, Validators.required],
    followUpDate: [''],
    nextFollowUpDate: [''],
    remarks: ['', [Validators.required, Validators.minLength(3)]]
  });

  readonly counselingForm = this.fb.group({
    studentRequirements: [''],
    parentConcerns: [''],
    campusVisitInfo: [''],
    recommendations: [''],
    notes: ['', [Validators.required, Validators.minLength(3)]]
  });

  readonly lostForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit(): void {
    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.leadId) {
      this.nav.back(this.route, '/app/admissions/leads');
      return;
    }
    this.load();
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
        next: d => this.detail.set(d),
        error: () => {
          const msg = 'Unable to load lead detail.';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: msg });
        }
      });
  }

  onTabChange(key: string): void {
    this.activeTab.set(key as DetailTab);
  }

  goBack(): void {
    this.nav.back(this.route, '/app/admissions/leads');
  }

  canMarkInterested(): boolean {
    const status = this.detail()?.inquiry.status;
    return !!status && !['INTERESTED', 'LOST', 'CLOSED', 'CONVERTED'].includes(status);
  }

  canMarkLost(): boolean {
    const d = this.detail();
    const status = d?.inquiry.status;
    return !!status && !['LOST', 'CLOSED', 'CONVERTED'].includes(status) && !d?.studentId;
  }

  canProceedToApplication(): boolean {
    const d = this.detail();
    const status = d?.inquiry.status;
    return !!status && !['LOST', 'CLOSED'].includes(status) && !d?.applicationId;
  }

  markInterested(): void {
    if (!this.canMarkInterested()) return;
    this.api.markInterested(this.leadId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Lead marked interested.' });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not update lead.' })
    });
  }

  openLostDialog(): void {
    if (!this.canMarkLost()) return;
    this.lostForm.reset({ reason: '' });
    this.showLostDialog.set(true);
  }

  closeLostDialog(): void {
    this.showLostDialog.set(false);
  }

  confirmMarkLost(): void {
    if (this.lostForm.invalid) {
      this.lostForm.markAllAsTouched();
      return;
    }
    this.api.markLost(this.leadId, this.lostForm.value.reason!).subscribe({
      next: () => {
        this.showLostDialog.set(false);
        this.messages.add({ severity: 'warn', summary: 'Lost', detail: 'Lead closed as lost.' });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not mark lost.' })
    });
  }

  proceedToApplication(): void {
    if (!this.canProceedToApplication()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Cannot convert',
        detail: this.detail()?.applicationId
          ? 'An application already exists for this lead.'
          : 'Lost or closed inquiries cannot be converted.'
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

  submitFollowUp(): void {
    if (this.followUpForm.invalid) {
      this.followUpForm.markAllAsTouched();
      return;
    }
    const raw = this.followUpForm.getRawValue();
    this.saving.set(true);
    this.api
      .addFollowUp(this.leadId, {
        followUpType: raw.followUpType as FollowUpRecord['followUpType'],
        remarks: raw.remarks,
        statusAfter: raw.statusAfter as LeadStatus,
        followUpDate: raw.followUpDate || null,
        nextFollowUpDate: raw.nextFollowUpDate || null
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.followUpForm.reset({
            followUpType: 'CALL',
            statusAfter: 'CONTACTED',
            followUpDate: '',
            nextFollowUpDate: '',
            remarks: ''
          });
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Follow-up logged.' });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not log follow-up.' })
      });
  }

  completeFollowUp(item: FollowUpRecord): void {
    this.completeOutcome = '';
    this.completeRemarks = '';
    this.completeTarget.set(item);
  }

  closeCompleteDialog(): void {
    this.completeTarget.set(null);
  }

  confirmCompleteFollowUp(): void {
    const item = this.completeTarget();
    if (!item || !this.completeOutcome.trim()) return;
    this.api.completeFollowUp(item.followUpId, {
      outcome: this.completeOutcome.trim(),
      remarks: this.completeRemarks || null
    }).subscribe({
      next: () => {
        this.completeTarget.set(null);
        this.messages.add({ severity: 'success', summary: 'Completed', detail: 'Follow-up completed.' });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not complete follow-up.' })
    });
  }

  submitCounseling(): void {
    if (this.counselingForm.invalid) {
      this.counselingForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api
      .addCounselingNote(this.leadId, this.counselingForm.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.counselingForm.reset({
            studentRequirements: '',
            parentConcerns: '',
            campusVisitInfo: '',
            recommendations: '',
            notes: ''
          });
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Counseling note added.' });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not save note.' })
      });
  }

  trackFollow(_i: number, f: FollowUpRecord): number {
    return f.followUpId;
  }

  trackNote(_i: number, n: CounselingNote): number {
    return n.noteId ?? _i;
  }

  trackTimeline(_i: number, t: LeadTimelineItem): string {
    return `${t.performedAt || t.performedOn || _i}-${t.action}`;
  }

  statusTone(status: LeadStatus): 'info' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'INTERESTED':
      case 'CONVERTED':
      case 'READY_FOR_ADMISSION':
        return 'success';
      case 'FOLLOW_UP_REQUIRED':
      case 'DOCUMENTS_PENDING':
        return 'warning';
      case 'LOST':
      case 'CLOSED':
        return 'danger';
      default:
        return 'info';
    }
  }
}
