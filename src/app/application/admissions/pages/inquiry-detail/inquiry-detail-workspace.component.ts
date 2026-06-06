import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CanonicalInquiryStatus, CounselingNote, FollowUpRecord, InquiryFullDetail } from '../../models/admissions-workspace.model';
import { AdmissionsWorkspaceService } from '../../services/admissions-workspace.service';

type Tab = 'overview' | 'activities' | 'counseling' | 'documents' | 'timeline';

@Component({
  selector: 'app-inquiry-detail-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './inquiry-detail-workspace.component.html'
})
export class InquiryDetailWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdmissionsWorkspaceService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  message = '';
  isError = false;

  detail?: InquiryFullDetail;
  activeTab: Tab = 'overview';
  inquiryId!: number;

  readonly tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'overview',   label: 'Overview',   icon: 'pi pi-user' },
    { id: 'activities', label: 'Activities', icon: 'pi pi-history' },
    { id: 'counseling', label: 'Counseling', icon: 'pi pi-comments' },
    { id: 'documents',  label: 'Documents',  icon: 'pi pi-file' },
    { id: 'timeline',   label: 'Timeline',   icon: 'pi pi-clock' }
  ];

  readonly followUpForm = this.fb.group({
    followUpType: ['CALL', Validators.required],
    statusAfterFollowUp: ['CONTACTED' as CanonicalInquiryStatus, Validators.required],
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

  ngOnInit(): void {
    this.inquiryId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.inquiryId) {
      this.router.navigate(['/app/admissions/inquiry-center']);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.fullDetail(this.inquiryId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: detail => { this.detail = detail; },
        error: () => { this.toast('Unable to load inquiry detail.', true); }
      });
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
  }

  // ---- Actions ----

  markInterested(): void {
    this.api.markInterested(this.inquiryId).subscribe({
      next: () => { this.toast('Marked as Interested.'); this.load(); },
      error: () => this.toast('Action failed.', true)
    });
  }

  markClosed(): void {
    const reason = window.prompt('Reason for closing (optional)') ?? '';
    this.api.markClosed(this.inquiryId, reason).subscribe({
      next: () => { this.toast('Inquiry closed.'); this.load(); },
      error: () => this.toast('Action failed.', true)
    });
  }

  proceedToAdmission(): void {
    this.api.proceedToAdmission(this.inquiryId).subscribe({
      next: () => { this.toast('Promoted to admission.'); this.router.navigate(['/app/admissions/admission-center']); },
      error: () => this.toast('Promotion failed. Verify status & documents.', true)
    });
  }

  submitAssign(): void {
    if (this.assignForm.invalid) return;
    const counselorId = this.assignForm.value.counselorId!;
    this.api.assignCounselor(this.inquiryId, counselorId).subscribe({
      next: () => { this.toast('Counselor assigned.'); this.assignForm.reset(); this.load(); },
      error: () => this.toast('Assignment failed.', true)
    });
  }

  submitFollowUp(): void {
    if (this.followUpForm.invalid) { this.followUpForm.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.followUpForm.getRawValue() as {
      followUpType: string;
      statusAfterFollowUp: string;
      nextFollowUpDate: string;
      remarks: string;
    };
    this.api.addFollowUp(this.inquiryId, payload)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.toast('Follow-up logged.');
          this.followUpForm.reset({ followUpType: 'CALL', statusAfterFollowUp: 'CONTACTED', nextFollowUpDate: '', remarks: '' });
          this.load();
        },
        error: () => this.toast('Unable to log follow-up.', true)
      });
  }

  submitCounseling(): void {
    if (this.counselingForm.invalid) { this.counselingForm.markAllAsTouched(); return; }
    this.saving = true;
    this.api.addCounselingNote(this.inquiryId, this.counselingForm.getRawValue())
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.toast('Counseling note saved.');
          this.counselingForm.reset();
          this.load();
        },
        error: () => this.toast('Could not save note.', true)
      });
  }

  trackById(_: number, item: { id: number }): number { return item.id; }
  trackFollow(_: number, item: FollowUpRecord): number { return item.id; }
  trackNote(_: number, item: CounselingNote): number { return item.id; }
  trackTimeline(_: number, item: { performedAt: string }): string { return item.performedAt; }

  goBack(): void { this.router.navigate(['/app/admissions/inquiry-center']); }

  private toast(text: string, error = false): void {
    this.message = text;
    this.isError = error;
    setTimeout(() => { this.message = ''; this.cdr.markForCheck(); }, 3500);
    this.cdr.markForCheck();
  }
}
