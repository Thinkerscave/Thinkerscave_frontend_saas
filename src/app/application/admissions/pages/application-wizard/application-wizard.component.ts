import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize, forkJoin } from 'rxjs';

import {
  ApplicationCreateRequest,
  ApplicationDocument,
  ApplicationProgress,
  ApplicationRecord,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';
import {
  AADHAAR_PATTERN,
  BLOOD_GROUPS,
  BOARD_OPTIONS,
  CATEGORY_OPTIONS,
  DOCUMENT_TYPES,
  INDIAN_MOBILE_PATTERN,
  INDIAN_PIN_PATTERN,
  MEDIUM_OPTIONS,
  RELIGION_OPTIONS
} from '../../data/admissions-workspace.config';
import { LoginService } from '../../../../core/services/login.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStep,
  SaasStepperComponent
} from '../../../../shared/ui/saas';

function notFutureDate(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) return null;
  const today = new Date().toISOString().slice(0, 10);
  return value > today ? { future: true } : null;
}

@Component({
  selector: 'app-application-wizard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToastComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
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
  private readonly nav = inject(AdmissionsNavService);

  readonly genderOptions = [
    { label: 'Select', value: '' },
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' }
  ];
  readonly bloodGroups = BLOOD_GROUPS.map(v => ({ label: v, value: v }));
  readonly categoryOptions = CATEGORY_OPTIONS.map(v => ({ label: v, value: v }));
  readonly religionOptions = RELIGION_OPTIONS.map(v => ({ label: v, value: v }));
  readonly boardOptions = BOARD_OPTIONS.map(v => ({ label: v, value: v }));
  readonly mediumOptions = MEDIUM_OPTIONS.map(v => ({ label: v, value: v }));
  readonly today = new Date().toISOString().slice(0, 10);

  applicationId: number | null = null;
  inquiryId: number | null = null;
  currentStatus: string | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  years: LookupOption[] = [];
  classes: LookupOption[] = [];
  sections: LookupOption[] = [];
  documents: ApplicationDocument[] = [];
  selectedDocumentType = 'BIRTH_CERTIFICATE';
  readonly documentTypes = DOCUMENT_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }));
  readonly paymentModes = [
    { label: 'Cash', value: 'CASH' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Bank transfer', value: 'BANK_TRANSFER' },
    { label: 'Cheque', value: 'CHEQUE' }
  ];
  progress: ApplicationProgress | null = null;
  activeStep = 0;

  readonly steps: SaasStep[] = [
    { key: 'family', label: 'Student & family' },
    { key: 'academic', label: 'Academics' },
    { key: 'docs', label: 'Documents & fee' },
    { key: 'review', label: 'Review' }
  ];

  readonly form: FormGroup = this.fb.group({
    student: this.fb.group({
      applicantName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required, notFutureDate]],
      gender: ['', Validators.required],
      applyingForClass: [''],
      academicYearId: [null as number | null, Validators.required],
      classId: [null as number | null, Validators.required],
      sectionId: [null as number | null],
      email: ['', [Validators.email]],
      contactNumber: ['', [Validators.required, Validators.pattern(INDIAN_MOBILE_PATTERN)]],
      bloodGroup: [''],
      category: [''],
      aadhaarNumber: ['', [Validators.pattern(AADHAAR_PATTERN)]],
      nationality: ['Indian'],
      motherTongue: [''],
      religion: [''],
      placeOfBirth: ['']
    }),
    parents: this.fb.group({
      parentName: ['', [Validators.required, Validators.minLength(2)]],
      parentContact: ['', [Validators.required, Validators.pattern(INDIAN_MOBILE_PATTERN)]],
      parentEmail: ['', [Validators.email]],
      fatherOccupation: [''],
      motherName: [''],
      motherOccupation: ['']
    }),
    address: this.fb.group({
      line1: ['', Validators.required],
      city: ['', Validators.required],
      state: [''],
      pinCode: ['', [Validators.required, Validators.pattern(INDIAN_PIN_PATTERN)]]
    }),
    academic: this.fb.group({
      academicNotes: [''],
      previousSchoolName: [''],
      previousBoard: [''],
      previousClass: [''],
      lastPercentage: [''],
      tcNumber: [''],
      mediumOfInstruction: ['English'],
      firstLanguage: [''],
      siblingName: ['']
    }),
    fee: this.fb.group({
      amount: [null as number | null],
      receiptNumber: [''],
      paymentMode: ['CASH'],
      paidOn: [''],
      receivedBy: [''],
      remarks: ['']
    })
  });

  ngOnInit(): void {
    this.api.academicYears().subscribe({
      next: years => {
        this.years = years;
        this.cdr.markForCheck();
      }
    });
    this.form.get('student.academicYearId')?.valueChanges.subscribe(yearId => this.onYearChange(yearId));
    this.form.get('student.classId')?.valueChanges.subscribe(classId => this.onClassChange(classId));
    const idParam = this.route.snapshot.paramMap.get('id');
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
    forkJoin({ app: this.api.getApplication(id), progress: this.api.applicationProgress(id) })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: ({ app, progress }) => {
          this.hydrate(app);
          this.progress = progress;
          this.loadDocuments(id);
        },
        error: () => {
          this.errorMessage = 'Unable to load application.';
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: this.errorMessage });
        }
      });
  }

  private hydrate(record: ApplicationRecord): void {
    this.inquiryId = record.inquiryId ?? null;
    this.currentStatus = record.status;
    const addressParts = this.parseAddress(record.address ?? '');
    const p = record.profile ?? {};
    this.form.patchValue({
      student: {
        applicantName: record.applicantName,
        dateOfBirth: record.dateOfBirth,
        gender: record.gender,
        applyingForClass: record.applyingForClass,
        academicYearId: record.academicYearId ?? null,
        classId: record.classId ?? null,
        sectionId: record.sectionId ?? null,
        email: record.email,
        contactNumber: record.contactNumber,
        bloodGroup: p.bloodGroup ?? '',
        category: p.category ?? '',
        aadhaarNumber: p.aadhaarNumber ?? '',
        nationality: p.nationality ?? 'Indian',
        motherTongue: p.motherTongue ?? '',
        religion: p.religion ?? '',
        placeOfBirth: p.placeOfBirth ?? ''
      },
      parents: {
        parentName: record.parentName,
        parentContact: record.parentContact,
        parentEmail: record.parentEmail,
        fatherOccupation: p.fatherOccupation ?? '',
        motherName: p.motherName ?? '',
        motherOccupation: p.motherOccupation ?? ''
      },
      address: {
        line1: addressParts.line1,
        city: p.city || addressParts.city,
        state: p.state || addressParts.state,
        pinCode: p.pinCode || addressParts.pinCode
      },
      academic: {
        academicNotes: record.internalComments ?? '',
        previousSchoolName: p.previousSchoolName ?? '',
        previousBoard: p.previousBoard ?? '',
        previousClass: p.previousClass ?? '',
        lastPercentage: p.lastPercentage ?? '',
        tcNumber: p.tcNumber ?? '',
        mediumOfInstruction: p.mediumOfInstruction ?? 'English',
        firstLanguage: p.firstLanguage ?? '',
        siblingName: p.siblingName ?? ''
      },
      fee: {
        amount: record.feeAmount ?? null,
        receiptNumber: record.feeReceiptNumber ?? '',
        paymentMode: record.feePaymentMode ?? 'CASH',
        paidOn: record.feePaidOn ?? '',
        receivedBy: record.feeReceivedBy ?? '',
        remarks: record.feeRemarks ?? ''
      }
    });
    if (record.academicYearId) this.onYearChange(record.academicYearId, record.classId ?? null, record.sectionId ?? null);
  }

  private parseAddress(address: string): { line1: string; city: string; state: string; pinCode: string } {
    if (!address) return { line1: '', city: '', state: '', pinCode: '' };
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
    const address = [v.address.line1, v.address.city, v.address.state, v.address.pinCode].filter(Boolean).join(', ');
    const className = this.classes.find(c => c.id === v.student.classId)?.name ?? v.student.applyingForClass ?? '';
    return {
      applicantName: v.student.applicantName,
      dateOfBirth: v.student.dateOfBirth,
      gender: v.student.gender,
      applyingForClass: className,
      academicYearId: v.student.academicYearId,
      classId: v.student.classId,
      sectionId: v.student.sectionId,
      email: v.student.email || null,
      contactNumber: v.student.contactNumber,
      address: address || null,
      parentName: v.parents.parentName,
      parentContact: v.parents.parentContact,
      parentEmail: v.parents.parentEmail || null,
      internalComments: v.academic.academicNotes || null,
      inquiryId: this.inquiryId,
      profile: {
        bloodGroup: v.student.bloodGroup || null,
        category: v.student.category || null,
        aadhaarNumber: v.student.aadhaarNumber || null,
        nationality: v.student.nationality || null,
        motherTongue: v.student.motherTongue || null,
        religion: v.student.religion || null,
        placeOfBirth: v.student.placeOfBirth || null,
        fatherOccupation: v.parents.fatherOccupation || null,
        motherName: v.parents.motherName || null,
        motherOccupation: v.parents.motherOccupation || null,
        city: v.address.city || null,
        state: v.address.state || null,
        pinCode: v.address.pinCode || null,
        previousSchoolName: v.academic.previousSchoolName || null,
        previousBoard: v.academic.previousBoard || null,
        previousClass: v.academic.previousClass || null,
        lastPercentage: v.academic.lastPercentage || null,
        tcNumber: v.academic.tcNumber || null,
        mediumOfInstruction: v.academic.mediumOfInstruction || null,
        firstLanguage: v.academic.firstLanguage || null,
        siblingName: v.academic.siblingName || null
      }
    };
  }

  stepGroup(key: 'student' | 'parents' | 'address' | 'academic'): FormGroup {
    return this.form.get(key) as FormGroup;
  }

  isStepValid(index: number): boolean {
    if (index === 0) {
      return this.stepGroup('student').get('applicantName')!.valid
        && this.stepGroup('student').get('dateOfBirth')!.valid
        && this.stepGroup('student').get('gender')!.valid
        && this.stepGroup('student').get('contactNumber')!.valid
        && this.stepGroup('parents').valid
        && this.stepGroup('address').valid;
    }
    if (index === 1) {
      return !!this.form.get('student.academicYearId')?.valid && !!this.form.get('student.classId')?.valid;
    }
    return true;
  }

  next(): void {
    if (!this.isStepValid(this.activeStep)) {
      this.markStepTouched(this.activeStep);
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Complete required fields before continuing.' });
      return;
    }
    this.activeStep = Math.min(this.steps.length - 1, this.activeStep + 1);
    this.cdr.markForCheck();
  }

  back(): void {
    this.activeStep = Math.max(0, this.activeStep - 1);
    this.cdr.markForCheck();
  }

  private markStepTouched(index: number): void {
    if (index === 0) {
      this.stepGroup('student').markAllAsTouched();
      this.stepGroup('parents').markAllAsTouched();
      this.stepGroup('address').markAllAsTouched();
    }
    if (index === 1) {
      this.form.get('student.academicYearId')?.markAsTouched();
      this.form.get('student.classId')?.markAsTouched();
    }
  }

  private persist(call: ReturnType<AdmissionsCrmService['saveDraft']>, ok: string): void {
    this.saving = true;
    call.pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: saved => {
        if (!this.applicationId) {
          this.applicationId = saved.applicationId;
          this.router.navigate(['/app/admissions/form', saved.applicationId], { replaceUrl: true });
        }
        this.currentStatus = saved.status;
        this.refreshProgress(saved.applicationId);
        this.messages.add({ severity: 'success', summary: ok, detail: saved.applicationNumber || ok });
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not save application.' })
    });
  }

  saveDraft(): void {
    const payload = this.buildPayload();
    this.persist(
      this.applicationId ? this.api.updateApplication(this.applicationId, payload) : this.api.saveDraft(payload),
      'Draft saved'
    );
  }

  submit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.messages.add({ severity: 'warn', summary: 'Validation', detail: 'Complete required fields before submitting.' });
      return;
    }
    const payload = this.buildPayload();
    this.persist(
      this.applicationId
        ? this.api.submitExistingApplication(this.applicationId, payload)
        : this.api.submitApplication(payload),
      'Submitted'
    );
  }

  approve(): void {
    if (!this.applicationId || !this.canApprove()) return;
    this.saving = true;
    this.api.approveApplication(this.applicationId).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Approved', detail: 'Application approved.' });
        this.loadExisting(this.applicationId!);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Approval failed', detail: 'Could not approve.' })
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.applicationId) {
      this.messages.add({ severity: 'warn', summary: 'Save draft first', detail: 'Save the application before uploading documents.' });
      return;
    }
    this.saving = true;
    this.api.uploadDocument(this.applicationId, file, this.selectedDocumentType)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
        input.value = '';
      }))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Uploaded', detail: 'Document uploaded.' });
          this.loadDocuments(this.applicationId!);
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Upload failed', detail: 'Could not upload document.' })
      });
  }

  loadDocuments(applicationId: number): void {
    this.api.listDocuments(applicationId).subscribe({
      next: docs => {
        this.documents = docs;
        this.cdr.markForCheck();
      }
    });
  }

  verifyDoc(doc: ApplicationDocument, status: 'VERIFIED' | 'REJECTED'): void {
    this.api.verifyDocument(doc.documentId, status).subscribe({
      next: () => this.loadDocuments(this.applicationId!),
      error: () => this.messages.add({ severity: 'error', summary: 'Update failed', detail: 'Could not update document.' })
    });
  }

  removeUploaded(doc: ApplicationDocument): void {
    this.api.deleteDocument(doc.documentId).subscribe({
      next: () => this.loadDocuments(this.applicationId!),
      error: () => this.messages.add({ severity: 'error', summary: 'Delete failed', detail: 'Could not delete document.' })
    });
  }

  saveFee(): void {
    if (!this.applicationId) {
      this.messages.add({ severity: 'warn', summary: 'Save draft first', detail: 'Save the application before recording a fee.' });
      return;
    }
    const fee = this.form.get('fee')?.getRawValue();
    if (!fee?.amount || !fee.receiptNumber) {
      this.messages.add({ severity: 'warn', summary: 'Required', detail: 'Enter amount and receipt number.' });
      return;
    }
    this.saving = true;
    this.api.recordFee(this.applicationId, {
      amount: Number(fee.amount),
      receiptNumber: fee.receiptNumber,
      paymentMode: fee.paymentMode,
      paidOn: fee.paidOn || null,
      receivedBy: fee.receivedBy || null,
      remarks: fee.remarks || null,
      paymentStatus: 'PAID'
    }).pipe(finalize(() => {
      this.saving = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => this.messages.add({ severity: 'success', summary: 'Fee recorded', detail: 'Counter collection saved.' }),
      error: () => this.messages.add({ severity: 'error', summary: 'Fee failed', detail: 'Could not record fee.' })
    });
  }

  onYearChange(yearId: number | null, keepClassId: number | null = null, keepSectionId: number | null = null): void {
    this.classes = [];
    this.sections = [];
    if (!yearId) return;
    this.api.academicClasses(yearId).subscribe({
      next: classes => {
        this.classes = classes;
        if (keepClassId) this.form.get('student.classId')?.setValue(keepClassId, { emitEvent: false });
        if (keepClassId) this.onClassChange(keepClassId, keepSectionId);
        this.cdr.markForCheck();
      }
    });
  }

  onClassChange(classId: number | null, keepSectionId: number | null = null): void {
    this.sections = [];
    if (!classId) return;
    this.api.academicSections(classId).subscribe({
      next: sections => {
        this.sections = sections;
        if (keepSectionId) this.form.get('student.sectionId')?.setValue(keepSectionId, { emitEvent: false });
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    this.nav.back(this.route, '/app/admissions/applications');
  }

  canApprove(): boolean {
    const roles = this.login.getUserRole().map(r => String(r).toUpperCase());
    const allowed = ['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'STAFF'];
    const reviewable = ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'FEE_PENDING'];
    return allowed.some(r => roles.includes(r)) && !!this.applicationId && reviewable.includes(this.currentStatus || '');
  }

  showError(path: string): boolean {
    const control = this.form.get(path);
    return !!control && control.invalid && (control.touched || control.dirty);
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
    const address = [v.address.line1, v.address.city, v.address.state, v.address.pinCode].filter(Boolean).join(', ');
    return {
      Applicant: v.student.applicantName,
      'Date of birth': v.student.dateOfBirth,
      Gender: v.student.gender,
      Religion: v.student.religion || '—',
      'Place of birth': v.student.placeOfBirth || '—',
      'Blood group': v.student.bloodGroup || '—',
      Category: v.student.category || '—',
      Aadhaar: v.student.aadhaarNumber || '—',
      Contact: v.student.contactNumber,
      'Father / guardian': v.parents.parentName,
      Mother: v.parents.motherName || '—',
      Address: address || '—',
      'Previous school': v.academic.previousSchoolName || '—',
      Board: v.academic.previousBoard || '—',
      Medium: v.academic.mediumOfInstruction || '—',
      Documents: this.documents.length ? this.documents.map(d => `${d.documentType} (${d.status})`).join(', ') : 'None',
      Fee: v.fee.amount ? `${v.fee.amount} · ${v.fee.paymentMode} · ${v.fee.receiptNumber || 'no receipt'}` : 'Not recorded'
    };
  }
}
