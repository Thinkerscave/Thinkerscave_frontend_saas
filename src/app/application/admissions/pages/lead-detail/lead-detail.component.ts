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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';

import {
  SaasPillComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { FOLLOW_UP_TYPES } from '../../data/admissions-workspace.config';
import {
  CounselingNote,
  FollowUpRecord,
  LeadFullDetail,
  LeadStatus,
  LeadTimelineItem
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';

type DetailTab = 'overview' | 'activities' | 'counseling' | 'timeline';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    ToastModule,
    ConfirmDialogModule,
    SaasTabsComponent,
    SaasPillComponent
  ],
  providers: [MessageService, ConfirmationService],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './lead-detail.component.html',
  styles: [`
    .adm-lost-dialog {
      position: fixed; inset: 0; z-index: 400;
      display: flex; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, 0.48); backdrop-filter: blur(4px);
    }
    .adm-lost-dialog__panel {
      width: min(480px, 92vw);
      background: var(--tc-surface-0);
      border: 1px solid var(--tc-border);
      border-radius: 16px;
      padding: 22px;
      display: flex; flex-direction: column; gap: 14px;
      box-shadow: var(--tc-shadow-lg, 0 20px 40px rgba(15,23,42,0.15));
    }
  `]
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdmissionsCrmService);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly followUpTypes = FOLLOW_UP_TYPES;
  readonly followUpTypeOptions = FOLLOW_UP_TYPES.map(t => ({ label: t, value: t }));
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

  leadId = 0;

  readonly tabs: SaasTab[] = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-user' },
    { key: 'activities', label: 'Activities', icon: 'pi pi-history' },
    { key: 'counseling', label: 'Counseling', icon: 'pi pi-comments' },
    { key: 'timeline', label: 'Timeline', icon: 'pi pi-clock' }
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

  readonly assignForm = this.fb.group({
    counselorId: [null as number | null, Validators.required]
  });

  readonly lostForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit(): void {
    this.leadId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.leadId) {
      this.router.navigate(['/app/admissions/leads']);
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
    this.router.navigate(['/app/admissions/leads']);
  }

  statusTone(status: LeadStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' {
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

  markInterested(): void {
    this.api.markInterested(this.leadId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: 'Lead marked as interested.' });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Action failed.' })
    });
  }

  openLostDialog(): void {
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
    const reason = this.lostForm.value.reason!;
    this.api.markLost(this.leadId, reason).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Marked lost', detail: 'Lead marked as lost.' });
        this.closeLostDialog();
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not mark lead as lost.' })
    });
  }

  proceedToApplication(): void {
    this.confirm.confirm({
      message: 'Convert this lead to an admission application? You will be taken to the application wizard.',
      header: 'Proceed to Application',
      icon: 'pi pi-arrow-right',
      accept: () => {
        this.api.convertToApplication(this.leadId).subscribe({
          next: app => {
            this.messages.add({ severity: 'success', summary: 'Converted', detail: 'Application created successfully.' });
            this.router.navigate(['/app/admissions/wizard', app.applicationId]);
          },
          error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Conversion failed.' })
        });
      }
    });
  }

  submitAssign(): void {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }
    const counselorId = this.assignForm.value.counselorId!;
    this.api.assignCounselor(this.leadId, counselorId).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Assigned', detail: 'Counselor assigned.' });
        this.assignForm.reset();
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
    this.saving.set(true);
    const raw = this.followUpForm.getRawValue();
    this.api
      .addFollowUp(this.leadId, {
        followUpType: raw.followUpType as FollowUpRecord['followUpType'],
        statusAfter: raw.statusAfter,
        followUpDate: raw.followUpDate || null,
        nextFollowUpDate: raw.nextFollowUpDate || null,
        remarks: raw.remarks
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Follow-up logged.' });
          this.followUpForm.reset({
            followUpType: 'CALL',
            statusAfter: 'CONTACTED',
            followUpDate: '',
            nextFollowUpDate: '',
            remarks: ''
          });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not log follow-up.' })
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
          this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Counseling note saved.' });
          this.counselingForm.reset();
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Error', detail: 'Could not save note.' })
      });
  }

  trackFollow(_: number, item: FollowUpRecord): number {
    return item.followUpId;
  }

  trackNote(_: number, item: CounselingNote): number {
    return item.noteId ?? 0;
  }

  trackTimeline(_: number, item: LeadTimelineItem): string {
    return item.performedAt;
  }
}
