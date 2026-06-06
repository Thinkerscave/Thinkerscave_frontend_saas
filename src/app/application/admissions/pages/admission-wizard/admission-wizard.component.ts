import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AdmissionProgress, AdmissionRecord, AdmissionWizardPayload } from '../../models/admissions-workspace.model';
import { AdmissionsWorkspaceService } from '../../services/admissions-workspace.service';

interface WizardStep {
  index: number;
  label: string;
  description: string;
  formKey: 'basic' | 'parent' | 'address' | 'academic' | 'documents' | 'fee' | 'review';
}

@Component({
  selector: 'app-admission-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './admission-wizard.component.html'
})
export class AdmissionWizardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdmissionsWorkspaceService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  applicationId: string | null = null;
  loading = false;
  saving = false;
  message = '';
  isError = false;

  progress: AdmissionProgress = {
    applicationId: '',
    currentStep: 1,
    totalSteps: 7,
    progressPercentage: 0,
    completedSteps: [],
    pendingFields: [],
    status: 'DRAFT'
  };

  activeStep = 1;

  readonly steps: WizardStep[] = [
    { index: 1, label: 'Basic',     description: 'Student info',     formKey: 'basic' },
    { index: 2, label: 'Parent',    description: 'Guardian info',    formKey: 'parent' },
    { index: 3, label: 'Address',   description: 'Residential',      formKey: 'address' },
    { index: 4, label: 'Academic',  description: 'Prior education',  formKey: 'academic' },
    { index: 5, label: 'Documents', description: 'Upload checklist', formKey: 'documents' },
    { index: 6, label: 'Fee',       description: 'Plan & charges',   formKey: 'fee' },
    { index: 7, label: 'Review',    description: 'Submit',           formKey: 'review' }
  ];

  readonly wizardForm: FormGroup = this.fb.group({
    basic: this.fb.group({
      applicantName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      applyingForSchoolOrCollege: ['', Validators.required]
    }),
    parent: this.fb.group({
      parentName: ['', Validators.required],
      guardianName: [''],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email: ['', [Validators.required, Validators.email]],
      emergencyName: [''],
      emergencyNumber: ['']
    }),
    address: this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pinCode: ['', Validators.required]
    }),
    academic: this.fb.group({
      previousSchool: [''],
      previousClass: [''],
      previousMarks: [''],
      academicNotes: ['']
    }),
    documents: this.fb.group({
      uploadedDocuments: this.fb.control<string[]>([])
    }),
    fee: this.fb.group({
      feePlan: [''],
      discount: [0],
      paymentMode: ['ONLINE']
    }),
    review: this.fb.group({
      internalComments: ['']
    })
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.applicationId = id;
      this.loadExisting(id);
      this.refreshProgress(id);
    }
  }

  loadExisting(id: string): void {
    this.loading = true;
    this.api.loadAdmission(id)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: r => this.hydrate(r),
        error: () => this.toast('Unable to load admission.', true)
      });
  }

  refreshProgress(id: string): void {
    this.api.progress(id).subscribe({
      next: p => { this.progress = p; this.activeStep = Math.min(7, p.currentStep || 1); this.cdr.markForCheck(); }
    });
  }

  private hydrate(r: AdmissionRecord): void {
    this.wizardForm.patchValue({
      basic: {
        applicantName: r.applicantName,
        dateOfBirth: r.dateOfBirth,
        gender: r.gender,
        applyingForSchoolOrCollege: r.applyingForSchoolOrCollege
      },
      parent: {
        parentName: r.parentName,
        guardianName: r.guardianName,
        contactNumber: r.contactNumber,
        email: r.email,
        emergencyName: r.emergencyContact?.name,
        emergencyNumber: r.emergencyContact?.number
      },
      address: r.address,
      review: { internalComments: r.internalComments },
      documents: { uploadedDocuments: r.uploadedDocuments ?? [] }
    });
    this.cdr.markForCheck();
  }

  goTo(step: number): void {
    if (step < 1 || step > 7) return;
    this.activeStep = step;
  }
  next(): void { this.goTo(this.activeStep + 1); }
  back(): void { this.goTo(this.activeStep - 1); }

  isComplete(step: number): boolean { return this.progress.completedSteps?.includes(step) ?? false; }

  saveDraft(): void {
    this.persist('DRAFT', 'Draft saved.');
  }
  submit(): void {
    this.persist('PENDING', 'Admission submitted for review.');
  }
  approve(): void {
    this.persist('APPROVED', 'Admission approved.');
  }

  private persist(status: 'DRAFT' | 'PENDING' | 'APPROVED', successMsg: string): void {
    const v = this.wizardForm.getRawValue();
    const payload: AdmissionWizardPayload = {
      applicationId: this.applicationId ?? undefined,
      applicantName: v.basic.applicantName,
      dateOfBirth: v.basic.dateOfBirth,
      gender: v.basic.gender,
      applyingForSchoolOrCollege: v.basic.applyingForSchoolOrCollege,
      parentName: v.parent.parentName,
      guardianName: v.parent.guardianName,
      contactNumber: v.parent.contactNumber,
      email: v.parent.email,
      address: v.address,
      emergencyContact: { name: v.parent.emergencyName, number: v.parent.emergencyNumber },
      uploadedDocuments: v.documents.uploadedDocuments,
      internalComments: v.review.internalComments,
      status
    };

    this.saving = true;
    const call = status === 'DRAFT' ? this.api.saveDraft(payload) : this.api.submitAdmission(payload);
    call.pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: saved => {
          if (saved?.applicationId) {
            this.applicationId = saved.applicationId;
            this.refreshProgress(saved.applicationId);
          }
          this.toast(successMsg);
        },
        error: () => this.toast('Save failed. Verify required fields.', true)
      });
  }

  cancel(): void {
    this.router.navigate(['/app/admissions/admission-center']);
  }

  private toast(text: string, error = false): void {
    this.message = text;
    this.isError = error;
    setTimeout(() => { this.message = ''; this.cdr.markForCheck(); }, 3500);
    this.cdr.markForCheck();
  }
}
