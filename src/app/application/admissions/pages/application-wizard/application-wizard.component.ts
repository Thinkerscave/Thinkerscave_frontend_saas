import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize, forkJoin } from 'rxjs';

import {
  ApplicationCreateRequest,
  ApplicationProgress,
  ApplicationRecord
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { LoginService } from '../../../../core/services/login.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStep,
  SaasStepperComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-application-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent,
    SaasStepperComponent
  ],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './application-wizard.component.html'
})
export class ApplicationWizardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdmissionsCrmService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly login = inject(LoginService);

  applicationId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';

  progress: ApplicationProgress | null = null;
  uploadedDocuments: string[] = [];
  newDocumentName = '';

  activeStep = 0;

  readonly steps: SaasStep[] = [
    { key: 'student', label: 'Student Info' },
    { key: 'parents', label: 'Parents' },
    { key: 'address', label: 'Address' },
    { key: 'academic', label: 'Academic' },
    { key: 'documents', label: 'Documents' },
    { key: 'review', label: 'Review' }
  ];

  readonly form: FormGroup = this.fb.group({
    student: this.fb.group({
      applicantName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      applyingForClass: ['', Validators.required],
      email: ['', Validators.email],
      contactNumber: ['', Validators.required]
    }),
    parents: this.fb.group({
      parentName: ['', Validators.required],
      parentContact: ['', Validators.required],
      parentEmail: ['', Validators.email]
    }),
    address: this.fb.group({
      line1: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pinCode: ['', Validators.required]
    }),
    academic: this.fb.group({
      academicNotes: ['']
    })
  });

  ngOnInit(): void {
    const idParam =
      this.route.snapshot.paramMap.get('applicationId') ??
      this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.applicationId = id;
        this.loadExisting(id);
      }
    }
  }

  loadExisting(id: number): void {
    this.loading = true;
    forkJoin({
      app: this.api.getApplication(id),
      progress: this.api.applicationProgress(id)
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: ({ app, progress }) => {
          this.hydrate(app);
          this.progress = progress;
          this.activeStep = Math.min(
            this.steps.length - 1,
            Math.max(0, (progress.completedSteps ?? 1) - 1)
          );
        },
        error: () => {
          this.errorMessage = 'Unable to load application.';
          this.messages.add({
            severity: 'error',
            summary: 'Load failed',
            detail: this.errorMessage
          });
        }
      });
  }

  private hydrate(record: ApplicationRecord): void {
    const addressParts = this.parseAddress(record.address ?? '');
    this.form.patchValue({
      student: {
        applicantName: record.applicantName,
        dateOfBirth: record.dateOfBirth,
        gender: record.gender,
        applyingForClass: record.applyingForClass,
        email: record.email,
        contactNumber: record.contactNumber
      },
      parents: {
        parentName: record.parentName,
        parentContact: record.parentContact,
        parentEmail: record.parentEmail
      },
      address: addressParts,
      academic: {
        academicNotes: record.internalComments ?? ''
      }
    });
    this.uploadedDocuments = [...(record.uploadedDocuments ?? [])];
  }

  private parseAddress(address: string): {
    line1: string;
    city: string;
    state: string;
    pinCode: string;
  } {
    if (!address) {
      return { line1: '', city: '', state: '', pinCode: '' };
    }
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 4) {
      return {
        line1: parts.slice(0, -3).join(', ') || parts[0],
        city: parts[parts.length - 3] ?? '',
        state: parts[parts.length - 2] ?? '',
        pinCode: parts[parts.length - 1] ?? ''
      };
    }
    return { line1: address, city: '', state: '', pinCode: '' };
  }

  private buildPayload(): ApplicationCreateRequest {
    const v = this.form.getRawValue();
    const address = [
      v.address.line1,
      v.address.city,
      v.address.state,
      v.address.pinCode
    ]
      .filter(Boolean)
      .join(', ');

    return {
      applicantName: v.student.applicantName,
      dateOfBirth: v.student.dateOfBirth,
      gender: v.student.gender,
      applyingForClass: v.student.applyingForClass,
      email: v.student.email || null,
      contactNumber: v.student.contactNumber,
      address: address || null,
      parentName: v.parents.parentName,
      parentContact: v.parents.parentContact,
      parentEmail: v.parents.parentEmail || null,
      internalComments: v.academic.academicNotes || null
    };
  }

  stepGroup(key: 'student' | 'parents' | 'address' | 'academic'): FormGroup {
    return this.form.get(key) as FormGroup;
  }

  isStepValid(index: number): boolean {
    switch (index) {
      case 0:
        return this.stepGroup('student').valid;
      case 1:
        return this.stepGroup('parents').valid;
      case 2:
        return this.stepGroup('address').valid;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return this.form.valid;
    }
  }

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length) return;
    this.activeStep = index;
    this.cdr.markForCheck();
  }

  next(): void {
    if (!this.isStepValid(this.activeStep)) {
      this.markStepTouched(this.activeStep);
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please complete required fields before continuing.'
      });
      return;
    }
    this.goToStep(this.activeStep + 1);
  }

  back(): void {
    this.goToStep(this.activeStep - 1);
  }

  private markStepTouched(index: number): void {
    const keys = ['student', 'parents', 'address', 'academic'] as const;
    const key = keys[index];
    if (key) this.stepGroup(key).markAllAsTouched();
  }

  saveDraft(): void {
    const payload = this.buildPayload();
    this.saving = true;
    const call = this.applicationId
      ? this.api.updateApplication(this.applicationId, payload)
      : this.api.saveDraft(payload);

    call
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: saved => {
          if (!this.applicationId) {
            this.applicationId = saved.applicationId;
            this.router.navigate(['/app/admissions/wizard', saved.applicationId], {
              replaceUrl: true
            });
          }
          this.refreshProgress(saved.applicationId);
          this.messages.add({
            severity: 'success',
            summary: 'Draft saved',
            detail: 'Application draft saved successfully.'
          });
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Save failed',
            detail: 'Could not save draft. Check required fields.'
          })
      });
  }

  submit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Complete all required fields before submitting.'
      });
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;

    if (this.applicationId) {
      this.api
        .updateApplication(this.applicationId, payload)
        .pipe(finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }))
        .subscribe({
          next: () => {
            this.messages.add({
              severity: 'success',
              summary: 'Updated',
              detail: 'Application updated successfully.'
            });
            this.refreshProgress(this.applicationId!);
          },
          error: () =>
            this.messages.add({
              severity: 'error',
              summary: 'Update failed',
              detail: 'Could not update application.'
            })
        });
      return;
    }

    this.api
      .submitApplication(payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: saved => {
          this.applicationId = saved.applicationId;
          this.router.navigate(['/app/admissions/wizard', saved.applicationId], {
            replaceUrl: true
          });
          this.refreshProgress(saved.applicationId);
          this.messages.add({
            severity: 'success',
            summary: 'Submitted',
            detail: 'Application submitted for review.'
          });
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Submit failed',
            detail: 'Could not submit application.'
          })
      });
  }

  update(): void {
    if (!this.applicationId) {
      this.saveDraft();
      return;
    }

    const payload = this.buildPayload();
    this.saving = true;
    this.api
      .updateApplication(this.applicationId, payload)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.refreshProgress(this.applicationId!);
          this.messages.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Application updated successfully.'
          });
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Update failed',
            detail: 'Could not update application.'
          })
      });
  }

  approve(): void {
    if (!this.applicationId || !this.canApprove()) return;

    this.saving = true;
    this.api
      .approveApplication(this.applicationId)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Approved',
            detail: 'Application has been approved.'
          });
          this.loadExisting(this.applicationId!);
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'Approval failed',
            detail: 'Could not approve application.'
          })
      });
  }

  addDocument(): void {
    const name = this.newDocumentName.trim();
    if (!name) return;
    if (!this.uploadedDocuments.includes(name)) {
      this.uploadedDocuments = [...this.uploadedDocuments, name];
    }
    this.newDocumentName = '';
    this.cdr.markForCheck();
  }

  removeDocument(name: string): void {
    this.uploadedDocuments = this.uploadedDocuments.filter(d => d !== name);
    this.cdr.markForCheck();
  }

  cancel(): void {
    this.router.navigate(['/app/admissions/applications']);
  }

  canApprove(): boolean {
    const roles = this.login.getUserRole().map(r => String(r).toUpperCase());
    const allowed = ['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL'];
    return allowed.some(r => roles.includes(r));
  }

  completionPercent(): number {
    return this.progress?.completionPercent ?? Math.round(((this.activeStep + 1) / this.steps.length) * 100);
  }

  private refreshProgress(id: number): void {
    this.api.applicationProgress(id).subscribe({
      next: p => {
        this.progress = p;
        this.cdr.markForCheck();
      }
    });
  }

  reviewSummary(): Record<string, string> {
    const v = this.form.getRawValue();
    const address = [
      v.address.line1,
      v.address.city,
      v.address.state,
      v.address.pinCode
    ]
      .filter(Boolean)
      .join(', ');

    return {
      'Applicant': v.student.applicantName,
      'Date of birth': v.student.dateOfBirth,
      'Gender': v.student.gender,
      'Class': v.student.applyingForClass,
      'Contact': v.student.contactNumber,
      'Email': v.student.email || '—',
      'Parent': v.parents.parentName,
      'Parent contact': v.parents.parentContact,
      'Address': address || '—',
      'Academic notes': v.academic.academicNotes || '—',
      'Documents': this.uploadedDocuments.length
        ? this.uploadedDocuments.join(', ')
        : 'None listed'
    };
  }
}
