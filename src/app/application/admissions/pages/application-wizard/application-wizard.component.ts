import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
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
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { Subject, finalize, forkJoin, takeUntil } from 'rxjs';
import { PermissionService } from '../../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

import {
  ApplicationCreateRequest,
  ApplicationDocument,
  ApplicationProgress,
  ApplicationRecord,
  FamilyMatchResult,
  LookupOption
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import { AdmissionsNavService } from '../../services/admissions-nav.service';
import {
  AADHAAR_PATTERN,
  BLOOD_GROUPS,
  BOARD_OPTIONS,
  CATEGORY_OPTIONS,
  CONTACT_RELATIONSHIP_OPTIONS,
  DOCUMENT_TYPES,
  IDENTITY_TYPES,
  INDIAN_MOBILE_PATTERN,
  INDIAN_PIN_PATTERN,
  MEDIUM_OPTIONS,
  RELIGION_OPTIONS,
  formatAdmissionsLabel
} from '../../data/admissions-workspace.config';
import {
  SaasPageHeaderComponent,
  SaasStep,
  SaasStepperComponent
} from '../../../../shared/ui/saas';

function notFutureDate(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) return null;
  const today = new Date().toISOString().slice(0, 10);
  return value > today ? { future: true } : null;
}

function optionalPattern(pattern: RegExp) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value == null || String(value).trim() === '') return null;
    return Validators.pattern(pattern)(control);
  };
}

interface DocChecklistItem {
  documentType: string;
  label: string;
  required: boolean;
  document: ApplicationDocument | null;
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
    DialogModule,
    DropdownModule,
    HasPermissionDirective,
    SaasPageHeaderComponent,
    SaasStepperComponent
  ],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './application-wizard.component.html'
})
export class ApplicationWizardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AdmissionsCrmService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly nav = inject(AdmissionsNavService);
  private readonly permissions = inject(PermissionService);
  private readonly destroy$ = new Subject<void>();
  readonly applicationsResource = 'ADMISSIONS_APPLICATIONS';
  previewUrls = new Map<number, string>();

  readonly genderOptions = [
    { label: 'Select gender', value: '' },
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' }
  ];
  readonly bloodGroups = BLOOD_GROUPS.map(v => ({ label: v, value: v }));
  readonly categoryOptions = CATEGORY_OPTIONS.map(v => ({ label: v, value: v }));
  readonly religionOptions = RELIGION_OPTIONS.map(v => ({ label: v, value: v }));
  readonly boardOptions = BOARD_OPTIONS.map(v => ({ label: v, value: v }));
  readonly mediumOptions = MEDIUM_OPTIONS.map(v => ({ label: v, value: v }));
  readonly identityTypes = IDENTITY_TYPES.map(t => ({ label: t.label, value: t.value }));
  readonly relationshipOptions = CONTACT_RELATIONSHIP_OPTIONS.map(v => ({ label: v, value: v }));
  readonly documentTypeOptions = DOCUMENT_TYPES.map(t => ({
    label: formatAdmissionsLabel(t),
    value: t
  }));
  readonly today = new Date().toISOString().slice(0, 10);

  applicationId: number | null = null;
  inquiryId: number | null = null;
  currentStatus: string | null = null;
  existingApplicantName = '';
  loading = false;
  saving = false;
  submitting = false;
  errorMessage = '';
  years: LookupOption[] = [];
  classes: LookupOption[] = [];
  sections: LookupOption[] = [];
  documents: ApplicationDocument[] = [];
  requiredDocumentTypes: string[] = [...DOCUMENT_TYPES.filter(t => t !== 'OTHER')];
  checklist: DocChecklistItem[] = [];
  progress: ApplicationProgress | null = null;
  activeStep = 0;
  showSecondaryGuardian = false;
  showEmergencyContact = false;
  confirmAccurate = false;
  docsMissingHighlight = false;
  correctionReason: string | null = null;
  familyMatch: FamilyMatchResult | null = null;
  familyMatchChecked = false;
  linkedParentId: number | null = null;
  familyMatchLoading = false;

  additionalDocVisible = false;
  additionalDocType = 'OTHER';
  additionalDocName = '';
  additionalUploading = false;

  readonly steps: SaasStep[] = [
    { key: 'family', label: 'Student & Family' },
    { key: 'academic', label: 'Academic & Admission' },
    { key: 'docs', label: 'Documents' },
    { key: 'fee', label: 'Fee Summary' },
    { key: 'review', label: 'Review & Submit' }
  ];

  readonly form: FormGroup = this.fb.group({
    student: this.fb.group({
      applicantName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', [Validators.required, notFutureDate]],
      gender: ['', Validators.required],
      bloodGroup: [''],
      nationality: ['Indian', Validators.required],
      identityDocumentType: [''],
      identityDocumentNumber: [''],
      religion: [''],
      category: [''],
      motherTongue: [''],
      placeOfBirth: [''],
      email: ['', [Validators.email]],
      contactNumber: ['', [Validators.required, Validators.pattern(INDIAN_MOBILE_PATTERN)]]
    }),
    parents: this.fb.group({
      parentName: ['', [Validators.required, Validators.minLength(2)]],
      parentRelationship: ['Father', Validators.required],
      parentContact: ['', [Validators.required, Validators.pattern(INDIAN_MOBILE_PATTERN)]],
      parentEmail: ['', [Validators.email]],
      fatherOccupation: [''],
      parentIdentityDocumentType: [''],
      parentIdentityDocumentNumber: [''],
      secondaryGuardianName: [''],
      secondaryGuardianRelationship: [''],
      secondaryGuardianMobile: ['', [optionalPattern(INDIAN_MOBILE_PATTERN)]],
      secondaryGuardianEmail: ['', [Validators.email]],
      secondaryGuardianOccupation: ['']
    }),
    address: this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: [''],
      country: ['India'],
      pinCode: ['', [Validators.required, Validators.pattern(INDIAN_PIN_PATTERN)]],
      sameAsPresentAddress: [true],
      permanentAddressLine1: [''],
      permanentAddressLine2: [''],
      permanentCity: [''],
      permanentState: [''],
      permanentCountry: ['India'],
      permanentPinCode: ['']
    }),
    emergency: this.fb.group({
      emergencyContactName: [''],
      emergencyContactRelationship: [''],
      emergencyContactMobile: ['', [optionalPattern(INDIAN_MOBILE_PATTERN)]],
      emergencyContactAlternateMobile: ['', [optionalPattern(INDIAN_MOBILE_PATTERN)]]
    }),
    academic: this.fb.group({
      academicYearId: [null as number | null, Validators.required],
      classId: [null as number | null, Validators.required],
      sectionId: [null as number | null],
      applyingForClass: [''],
      hasPreviousSchooling: [false],
      previousSchoolName: [''],
      previousBoard: [''],
      previousClass: [''],
      previousAcademicYear: [''],
      lastPercentage: [''],
      tcNumber: [''],
      tcDate: [''],
      mediumOfInstruction: ['English'],
      firstLanguage: [''],
      secondLanguage: [''],
      siblingName: [''],
      academicNotes: ['']
    }),
    confirmation: this.fb.group({
      confirmAccurate: [false, Validators.requiredTrue]
    })
  });

  ngOnInit(): void {
    this.api.academicYears().subscribe({
      next: years => {
        this.years = years;
        this.cdr.markForCheck();
      }
    });
    this.api.settings().subscribe({
      next: s => {
        if (s?.requiredDocuments?.length) {
          this.requiredDocumentTypes = s.requiredDocuments;
        }
        this.rebuildChecklist();
        this.cdr.markForCheck();
      },
      error: () => this.rebuildChecklist()
    });

    this.form.get('academic.academicYearId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(yearId => this.onYearChange(yearId));
    this.form.get('academic.classId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(classId => this.onClassChange(classId));
    this.form.get('address.sameAsPresentAddress')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(same => this.applyPermanentValidators(!!same));
    this.form.get('academic.hasPreviousSchooling')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(has => this.applyPreviousSchoolValidators(!!has));
    this.form.get('student.identityDocumentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => this.applyIdentityValidators(type));

    this.form.get('parents.parentContact')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.scheduleFamilyMatch());
    this.form.get('parents.parentEmail')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.scheduleFamilyMatch());

    this.applyPermanentValidators(true);
    this.applyPreviousSchoolValidators(false);

    const inquiryParam = this.route.snapshot.queryParamMap.get('inquiryId');
    if (inquiryParam) {
      const id = Number(inquiryParam);
      if (!Number.isNaN(id)) this.inquiryId = id;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.applicationId = id;
        this.loadExisting(id);
        return;
      }
    }

    if (this.inquiryId) {
      this.prefillFromLead(this.inquiryId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewUrls.clear();
  }

  get canApproveDocuments(): boolean {
    return this.permissions.canApprove(this.applicationsResource);
  }

  get canManageApplication(): boolean {
    return this.permissions.canManage(this.applicationsResource);
  }

  get isReviewMode(): boolean {
    return ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'FEE_PENDING', 'APPROVED', 'ENROLLED'].includes(
      this.currentStatus || ''
    );
  }

  get stepTitle(): string {
    return this.steps[this.activeStep]?.label ?? '';
  }

  get stepSubtitle(): string {
    const copy = [
      'Capture student, parent/guardian, and address details.',
      'Select the class and share previous schooling if applicable.',
      'Upload required documents for verification.',
      'Review applicable fees configured by Finance.',
      'Confirm everything looks correct before submitting.'
    ];
    return copy[this.activeStep] ?? '';
  }

  get fromLead(): boolean {
    return this.route.snapshot.queryParamMap.get('from') === 'lead' || !!this.inquiryId;
  }

  get uploadedRequiredCount(): number {
    return this.checklist.filter(c => c.required && !!c.document).length;
  }

  get requiredDocCount(): number {
    return this.checklist.filter(c => c.required).length;
  }

  get missingRequiredDocs(): DocChecklistItem[] {
    return this.checklist.filter(c => c.required && !c.document);
  }

  get selectedClassName(): string {
    const classId = this.form.get('academic.classId')?.value;
    return this.classes.find(c => c.id === classId)?.name ?? '';
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

  private prefillFromLead(inquiryId: number): void {
    this.api.getLead(inquiryId).subscribe({
      next: lead => {
        this.form.patchValue({
          student: {
            applicantName: lead.studentName || lead.name || '',
            dateOfBirth: lead.dateOfBirth || '',
            gender: lead.gender || '',
            email: lead.email || '',
            contactNumber: lead.mobileNumber || ''
          },
          parents: {
            parentName: lead.parentContactName || lead.name || '',
            parentContact: lead.mobileNumber || '',
            parentEmail: lead.email || '',
            parentRelationship: lead.contactRelationship || 'Father'
          },
          academic: {
            academicYearId: lead.academicYearId ?? null,
            classId: lead.classId ?? null,
            applyingForClass: lead.classInterestedIn || '',
            previousSchoolName: lead.previousSchool || ''
          }
        });
        if (lead.academicYearId) {
          this.onYearChange(lead.academicYearId, lead.classId ?? null);
        }
        this.scheduleFamilyMatch();
        this.cdr.markForCheck();
      }
    });
  }

  private hydrate(record: ApplicationRecord): void {
    this.inquiryId = record.inquiryId ?? this.inquiryId;
    this.currentStatus = record.status;
    this.existingApplicantName = record.applicantName || '';
    this.correctionReason = record.status === 'ACTION_REQUIRED' ? (record.internalComments || null) : null;
    const p = record.profile ?? {};
    this.linkedParentId = p.linkedParentId ?? null;
    const addressParts = this.parseAddress(record.address ?? '');
    const sameAsPresent = p.sameAsPresentAddress !== false;
    const hasPrev = p.hasPreviousSchooling === true
      || !!(p.previousSchoolName && p.previousSchoolName.trim());

    this.showSecondaryGuardian = !!(p.secondaryGuardianName || p.secondaryGuardianMobile);
    this.showEmergencyContact = !!(p.emergencyContactName || p.emergencyContactMobile);

    this.form.patchValue({
      student: {
        applicantName: record.applicantName,
        dateOfBirth: record.dateOfBirth,
        gender: record.gender,
        bloodGroup: p.bloodGroup ?? '',
        nationality: p.nationality ?? 'Indian',
        identityDocumentType: p.identityDocumentType ?? (p.aadhaarNumber ? 'AADHAAR' : ''),
        identityDocumentNumber: p.identityDocumentNumber ?? p.aadhaarNumber ?? '',
        religion: p.religion ?? '',
        category: p.category ?? '',
        motherTongue: p.motherTongue ?? '',
        placeOfBirth: p.placeOfBirth ?? '',
        email: record.email,
        contactNumber: record.contactNumber
      },
      parents: {
        parentName: record.parentName,
        parentRelationship: p.parentRelationship ?? 'Father',
        parentContact: record.parentContact,
        parentEmail: record.parentEmail,
        fatherOccupation: p.fatherOccupation ?? '',
        secondaryGuardianName: p.secondaryGuardianName ?? '',
        secondaryGuardianRelationship: p.secondaryGuardianRelationship ?? '',
        secondaryGuardianMobile: p.secondaryGuardianMobile ?? '',
        secondaryGuardianEmail: p.secondaryGuardianEmail ?? '',
        secondaryGuardianOccupation: p.secondaryGuardianOccupation ?? ''
      },
      address: {
        addressLine1: p.addressLine1 || addressParts.line1,
        addressLine2: p.addressLine2 ?? '',
        city: p.city || addressParts.city,
        state: p.state || addressParts.state,
        country: p.country || 'India',
        pinCode: p.pinCode || addressParts.pinCode,
        sameAsPresentAddress: sameAsPresent,
        permanentAddressLine1: p.permanentAddressLine1 ?? '',
        permanentAddressLine2: p.permanentAddressLine2 ?? '',
        permanentCity: p.permanentCity ?? '',
        permanentState: p.permanentState ?? '',
        permanentCountry: p.permanentCountry || 'India',
        permanentPinCode: p.permanentPinCode ?? ''
      },
      emergency: {
        emergencyContactName: p.emergencyContactName ?? '',
        emergencyContactRelationship: p.emergencyContactRelationship ?? '',
        emergencyContactMobile: p.emergencyContactMobile ?? '',
        emergencyContactAlternateMobile: p.emergencyContactAlternateMobile ?? ''
      },
      academic: {
        academicYearId: record.academicYearId ?? null,
        classId: record.classId ?? null,
        sectionId: record.sectionId ?? null,
        applyingForClass: record.applyingForClass ?? '',
        hasPreviousSchooling: hasPrev,
        previousSchoolName: p.previousSchoolName ?? '',
        previousBoard: p.previousBoard ?? '',
        previousClass: p.previousClass ?? '',
        previousAcademicYear: p.previousAcademicYear ?? '',
        lastPercentage: p.lastPercentage ?? '',
        tcNumber: p.tcNumber ?? '',
        tcDate: p.tcDate ?? '',
        mediumOfInstruction: p.mediumOfInstruction ?? 'English',
        firstLanguage: p.firstLanguage ?? '',
        secondLanguage: p.secondLanguage ?? '',
        siblingName: p.siblingName ?? '',
        academicNotes: record.status === 'ACTION_REQUIRED' ? '' : (record.internalComments ?? '')
      }
    });

    this.applyPermanentValidators(sameAsPresent);
    this.applyPreviousSchoolValidators(hasPrev);
    this.applyIdentityValidators(this.form.get('student.identityDocumentType')?.value);

    if (record.academicYearId) {
      this.onYearChange(record.academicYearId, record.classId ?? null, record.sectionId ?? null);
    }
    this.scheduleFamilyMatch();
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

  private applyPermanentValidators(same: boolean): void {
    const fields = [
      'permanentAddressLine1',
      'permanentCity',
      'permanentPinCode'
    ];
    for (const key of fields) {
      const ctrl = this.form.get(`address.${key}`);
      if (!ctrl) continue;
      if (same) {
        ctrl.clearValidators();
        ctrl.updateValueAndValidity({ emitEvent: false });
      } else {
        const validators = key === 'permanentPinCode'
          ? [Validators.required, Validators.pattern(INDIAN_PIN_PATTERN)]
          : [Validators.required];
        ctrl.setValidators(validators);
        ctrl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  private applyPreviousSchoolValidators(hasPrev: boolean): void {
    const name = this.form.get('academic.previousSchoolName');
    const lastClass = this.form.get('academic.previousClass');
    if (!name || !lastClass) return;
    if (hasPrev) {
      name.setValidators([Validators.required, Validators.minLength(2)]);
      lastClass.setValidators([Validators.required]);
    } else {
      name.clearValidators();
      lastClass.clearValidators();
    }
    name.updateValueAndValidity({ emitEvent: false });
    lastClass.updateValueAndValidity({ emitEvent: false });
  }

  private applyIdentityValidators(type: string | null | undefined): void {
    const numberCtrl = this.form.get('student.identityDocumentNumber');
    if (!numberCtrl) return;
    if (type === 'AADHAAR') {
      numberCtrl.setValidators([Validators.required, Validators.pattern(AADHAAR_PATTERN)]);
    } else {
      numberCtrl.clearValidators();
    }
    numberCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private buildPayload(): ApplicationCreateRequest {
    const v = this.form.getRawValue();
    const same = !!v.address.sameAsPresentAddress;
    const presentParts = [
      v.address.addressLine1,
      v.address.addressLine2,
      v.address.city,
      v.address.state,
      v.address.pinCode
    ].filter(Boolean);
    const address = presentParts.join(', ');
    const className = this.classes.find(c => c.id === v.academic.classId)?.name
      ?? v.academic.applyingForClass
      ?? '';
    const identityType = v.student.identityDocumentType || null;
    const identityNumber = v.student.identityDocumentNumber || null;

    return {
      applicantName: v.student.applicantName,
      dateOfBirth: v.student.dateOfBirth,
      gender: v.student.gender,
      applyingForClass: className,
      academicYearId: v.academic.academicYearId,
      classId: v.academic.classId,
      sectionId: v.academic.sectionId,
      email: v.student.email || null,
      contactNumber: v.student.contactNumber,
      address: address || null,
      parentName: v.parents.parentName,
      parentContact: v.parents.parentContact,
      parentEmail: v.parents.parentEmail || null,
      internalComments: this.currentStatus === 'ACTION_REQUIRED'
        ? (this.correctionReason || null)
        : (v.academic.academicNotes || null),
      inquiryId: this.inquiryId,
      profile: {
        bloodGroup: v.student.bloodGroup || null,
        category: v.student.category || null,
        nationality: v.student.nationality || null,
        identityDocumentType: identityType,
        identityDocumentNumber: identityNumber,
        aadhaarNumber: identityType === 'AADHAAR' ? identityNumber : null,
        motherTongue: v.student.motherTongue || null,
        religion: v.student.religion || null,
        placeOfBirth: v.student.placeOfBirth || null,
        parentRelationship: v.parents.parentRelationship || null,
        fatherOccupation: v.parents.fatherOccupation || null,
        secondaryGuardianName: this.showSecondaryGuardian ? (v.parents.secondaryGuardianName || null) : null,
        secondaryGuardianRelationship: this.showSecondaryGuardian ? (v.parents.secondaryGuardianRelationship || null) : null,
        secondaryGuardianMobile: this.showSecondaryGuardian ? (v.parents.secondaryGuardianMobile || null) : null,
        secondaryGuardianEmail: this.showSecondaryGuardian ? (v.parents.secondaryGuardianEmail || null) : null,
        secondaryGuardianOccupation: this.showSecondaryGuardian ? (v.parents.secondaryGuardianOccupation || null) : null,
        addressLine1: v.address.addressLine1 || null,
        addressLine2: v.address.addressLine2 || null,
        city: v.address.city || null,
        state: v.address.state || null,
        country: v.address.country || null,
        pinCode: v.address.pinCode || null,
        sameAsPresentAddress: same,
        permanentAddressLine1: same ? (v.address.addressLine1 || null) : (v.address.permanentAddressLine1 || null),
        permanentAddressLine2: same ? (v.address.addressLine2 || null) : (v.address.permanentAddressLine2 || null),
        permanentCity: same ? (v.address.city || null) : (v.address.permanentCity || null),
        permanentState: same ? (v.address.state || null) : (v.address.permanentState || null),
        permanentCountry: same ? (v.address.country || null) : (v.address.permanentCountry || null),
        permanentPinCode: same ? (v.address.pinCode || null) : (v.address.permanentPinCode || null),
        emergencyContactName: this.showEmergencyContact ? (v.emergency.emergencyContactName || null) : null,
        emergencyContactRelationship: this.showEmergencyContact ? (v.emergency.emergencyContactRelationship || null) : null,
        emergencyContactMobile: this.showEmergencyContact ? (v.emergency.emergencyContactMobile || null) : null,
        emergencyContactAlternateMobile: this.showEmergencyContact ? (v.emergency.emergencyContactAlternateMobile || null) : null,
        hasPreviousSchooling: !!v.academic.hasPreviousSchooling,
        previousSchoolName: v.academic.hasPreviousSchooling ? (v.academic.previousSchoolName || null) : null,
        previousBoard: v.academic.hasPreviousSchooling ? (v.academic.previousBoard || null) : null,
        previousClass: v.academic.hasPreviousSchooling ? (v.academic.previousClass || null) : null,
        previousAcademicYear: v.academic.hasPreviousSchooling ? (v.academic.previousAcademicYear || null) : null,
        lastPercentage: v.academic.hasPreviousSchooling ? (v.academic.lastPercentage || null) : null,
        tcNumber: v.academic.hasPreviousSchooling ? (v.academic.tcNumber || null) : null,
        tcDate: v.academic.hasPreviousSchooling ? (v.academic.tcDate || null) : null,
        mediumOfInstruction: v.academic.mediumOfInstruction || null,
        firstLanguage: v.academic.firstLanguage || null,
        secondLanguage: v.academic.secondLanguage || null,
        siblingName: v.academic.siblingName || null,
        linkedParentId: this.linkedParentId
      }
    };
  }

  private familyMatchTimer: ReturnType<typeof setTimeout> | null = null;

  private scheduleFamilyMatch(): void {
    if (this.familyMatchTimer) clearTimeout(this.familyMatchTimer);
    this.familyMatchTimer = setTimeout(() => this.checkFamilyMatch(), 450);
  }

  checkFamilyMatch(): void {
    const mobile = String(this.form.get('parents.parentContact')?.value || '').trim();
    const email = String(this.form.get('parents.parentEmail')?.value || '').trim();
    if (!mobile && !email) {
      this.familyMatch = null;
      this.familyMatchChecked = false;
      this.cdr.markForCheck();
      return;
    }
    this.familyMatchLoading = true;
    this.api.findFamilyMatch(mobile || null, email || null)
      .pipe(finalize(() => {
        this.familyMatchLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: result => {
          this.familyMatch = result;
          this.familyMatchChecked = true;
          if (this.linkedParentId && result?.matched && result.parentId === this.linkedParentId) {
            // keep link
          } else if (this.linkedParentId && (!result?.matched || result.parentId !== this.linkedParentId)) {
            // stale link cleared only if user has changed contact away from linked parent
          }
        },
        error: () => {
          this.familyMatch = null;
          this.familyMatchChecked = true;
        }
      });
  }

  linkExistingFamily(): void {
    if (!this.familyMatch?.matched || !this.familyMatch.parentId) return;
    this.linkedParentId = this.familyMatch.parentId;
    this.form.patchValue({
      parents: {
        parentName: this.familyMatch.parentName || this.form.get('parents.parentName')?.value,
        parentContact: this.familyMatch.mobileNumber || this.form.get('parents.parentContact')?.value,
        parentEmail: this.familyMatch.email || this.form.get('parents.parentEmail')?.value
      }
    });
    this.messages.add({
      severity: 'success',
      summary: 'Family linked',
      detail: 'Existing parent record will be reused on enrollment.'
    });
    this.cdr.markForCheck();
  }

  unlinkFamily(): void {
    this.linkedParentId = null;
    this.cdr.markForCheck();
  }

  isStepValid(index: number): boolean {
    if (index === 0) {
      return this.form.get('student')!.valid
        && this.form.get('parents.parentName')!.valid
        && this.form.get('parents.parentRelationship')!.valid
        && this.form.get('parents.parentContact')!.valid
        && this.form.get('parents.parentEmail')!.valid
        && this.form.get('address')!.valid
        && (!this.showEmergencyContact || this.form.get('emergency')!.valid)
        && (!this.showSecondaryGuardian
          || (this.form.get('parents.secondaryGuardianMobile')!.valid
            && this.form.get('parents.secondaryGuardianEmail')!.valid));
    }
    if (index === 1) {
      return !!this.form.get('academic.academicYearId')?.valid
        && !!this.form.get('academic.classId')?.valid
        && !!this.form.get('academic.previousSchoolName')?.valid
        && !!this.form.get('academic.previousClass')?.valid;
    }
    if (index === 2) {
      return this.missingRequiredDocs.length === 0;
    }
    if (index === 3) {
      return true;
    }
    if (index === 4) {
      return this.isStepValid(0) && this.isStepValid(1) && this.isStepValid(2)
        && !!this.form.get('confirmation.confirmAccurate')?.valid;
    }
    return true;
  }

  private markStepTouched(index: number): void {
    if (index === 0) {
      this.form.get('student')?.markAllAsTouched();
      this.form.get('parents')?.markAllAsTouched();
      this.form.get('address')?.markAllAsTouched();
      if (this.showEmergencyContact) this.form.get('emergency')?.markAllAsTouched();
    }
    if (index === 1) {
      this.form.get('academic.academicYearId')?.markAsTouched();
      this.form.get('academic.classId')?.markAsTouched();
      this.form.get('academic.previousSchoolName')?.markAsTouched();
      this.form.get('academic.previousClass')?.markAsTouched();
    }
    if (index === 2) {
      this.docsMissingHighlight = true;
    }
    if (index === 4) {
      this.form.get('confirmation.confirmAccurate')?.markAsTouched();
      this.confirmAccurate = !!this.form.get('confirmation.confirmAccurate')?.value;
    }
  }

  private scrollToFirstInvalid(): void {
    setTimeout(() => {
      const root = document.querySelector('.adm-app-form');
      const invalid = root?.querySelector(
        '.ng-invalid.ng-touched, .adm-doc-card--missing, .adm-field-error'
      ) as HTMLElement | null;
      if (invalid) {
        invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = invalid.matches('input, select, textarea, button')
          ? invalid
          : invalid.querySelector('input, select, textarea, button') as HTMLElement | null;
        focusable?.focus?.();
      }
    }, 50);
  }

  continue(): void {
    if (!this.isStepValid(this.activeStep)) {
      this.markStepTouched(this.activeStep);
      this.messages.add({
        severity: 'warn',
        summary: 'Validation',
        detail: this.activeStep === 2 && this.missingRequiredDocs.length
          ? `${this.missingRequiredDocs.length} required document${this.missingRequiredDocs.length === 1 ? ' is' : 's are'} missing.`
          : 'Please complete the required fields before continuing.'
      });
      this.cdr.markForCheck();
      this.scrollToFirstInvalid();
      return;
    }
    this.docsMissingHighlight = false;
    this.persist(
      this.applicationId
        ? this.api.updateApplication(this.applicationId, this.buildPayload())
        : this.api.saveDraft(this.buildPayload()),
      'Draft saved',
      () => {
        this.activeStep = Math.min(this.steps.length - 1, this.activeStep + 1);
        this.cdr.markForCheck();
      }
    );
  }

  back(): void {
    this.activeStep = Math.max(0, this.activeStep - 1);
    this.cdr.markForCheck();
  }

  goToStep(index: number): void {
    this.activeStep = index;
    this.cdr.markForCheck();
  }

  private persist(
    call: ReturnType<AdmissionsCrmService['saveDraft']>,
    ok: string,
    after?: () => void
  ): void {
    this.saving = true;
    call.pipe(finalize(() => {
      this.saving = false;
      this.submitting = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: saved => {
        if (!this.applicationId) {
          this.applicationId = saved.applicationId;
          void this.router.navigate(['/app/admissions/form', saved.applicationId], {
            replaceUrl: true,
            queryParamsHandling: 'preserve'
          });
        }
        this.currentStatus = saved.status;
        this.refreshProgress(saved.applicationId);
        this.messages.add({
          severity: 'success',
          summary: ok,
          detail: ok.includes('Draft')
            ? 'Application draft saved successfully.'
            : (saved.applicationNumber || 'Application submitted successfully.')
        });
        after?.();
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Failed',
        detail: 'Could not save application.'
      })
    });
  }

  saveDraft(): void {
    const payload = this.buildPayload();
    if (!payload.applicantName?.trim()) {
      payload.applicantName = this.existingApplicantName || 'Draft applicant';
    }
    this.persist(
      this.applicationId ? this.api.updateApplication(this.applicationId, payload) : this.api.saveDraft(payload),
      'Draft saved'
    );
  }

  submit(): void {
    if (this.submitting || this.saving) return;
    this.form.get('confirmation.confirmAccurate')?.setValue(this.confirmAccurate);
    for (let i = 0; i <= 3; i++) {
      if (!this.isStepValid(i)) {
        this.activeStep = i;
        this.markStepTouched(i);
        this.messages.add({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Please complete the required fields before continuing.'
        });
        this.cdr.markForCheck();
        this.scrollToFirstInvalid();
        return;
      }
    }
    if (!this.confirmAccurate) {
      this.form.get('confirmation.confirmAccurate')?.markAsTouched();
      this.messages.add({
        severity: 'warn',
        summary: 'Confirmation required',
        detail: 'Please confirm that the information provided is accurate and complete.'
      });
      this.cdr.markForCheck();
      return;
    }
    this.submitting = true;
    const payload = this.buildPayload();
    this.persist(
      this.applicationId
        ? this.api.submitExistingApplication(this.applicationId, payload)
        : this.api.submitApplication(payload),
      'Submitted'
    );
  }

  onFileSelected(event: Event, documentType: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.applicationId) {
      this.messages.add({
        severity: 'warn',
        summary: 'Save draft first',
        detail: 'Save the application before uploading documents.'
      });
      input.value = '';
      return;
    }
    this.saving = true;
    this.api.uploadDocument(this.applicationId, file, documentType)
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
        error: () => this.messages.add({
          severity: 'error',
          summary: 'Upload failed',
          detail: 'Could not upload document.'
        })
      });
  }

  openAdditionalDoc(): void {
    this.additionalDocType = 'OTHER';
    this.additionalDocName = '';
    this.additionalDocVisible = true;
    this.cdr.markForCheck();
  }

  closeAdditionalDoc(): void {
    this.additionalDocVisible = false;
    this.cdr.markForCheck();
  }

  onAdditionalFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.applicationId) {
      this.messages.add({
        severity: 'warn',
        summary: 'Save draft first',
        detail: 'Save the application before uploading documents.'
      });
      return;
    }
    this.additionalUploading = true;
    this.api.uploadDocument(this.applicationId, file, this.additionalDocType || 'OTHER')
      .pipe(finalize(() => {
        this.additionalUploading = false;
        this.cdr.markForCheck();
        input.value = '';
      }))
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Uploaded', detail: 'Additional document uploaded.' });
          this.additionalDocVisible = false;
          this.loadDocuments(this.applicationId!);
        },
        error: () => this.messages.add({
          severity: 'error',
          summary: 'Upload failed',
          detail: 'Could not upload document.'
        })
      });
  }

  previewDocument(doc: ApplicationDocument): void {
    const url = this.api.documentDownloadUrl(doc.documentId);
    window.open(url, '_blank', 'noopener');
  }

  isImageDocument(doc: ApplicationDocument | null | undefined): boolean {
    const name = (doc?.originalName || '').toLowerCase();
    return /\.(png|jpe?g|gif|webp)$/.test(name);
  }

  previewUrl(doc: ApplicationDocument): string | null {
    return this.previewUrls.get(doc.documentId) ?? null;
  }

  verifyUploaded(doc: ApplicationDocument, status: 'VERIFIED' | 'REJECTED'): void {
    let remarks: string | undefined;
    if (status === 'REJECTED') {
      remarks = window.prompt('Reason for rejection') || '';
      if (!remarks.trim()) {
        this.messages.add({
          severity: 'warn',
          summary: 'Reason required',
          detail: 'Enter a rejection reason.'
        });
        return;
      }
    }
    this.api.verifyDocument(doc.documentId, status, remarks).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: status === 'VERIFIED' ? 'Verified' : 'Rejected',
          detail: status === 'VERIFIED' ? 'Document verified.' : 'Document rejected.'
        });
        this.loadDocuments(this.applicationId!);
      },
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Update failed',
        detail: 'Could not update document status.'
      })
    });
  }

  removeUploaded(doc: ApplicationDocument): void {
    this.api.deleteDocument(doc.documentId).subscribe({
      next: () => this.loadDocuments(this.applicationId!),
      error: () => this.messages.add({
        severity: 'error',
        summary: 'Delete failed',
        detail: 'Could not delete document.'
      })
    });
  }

  loadDocuments(applicationId: number): void {
    this.api.listDocuments(applicationId).subscribe({
      next: docs => {
        this.documents = docs;
        this.rebuildChecklist();
        this.warmPreviewUrls(docs);
        this.cdr.markForCheck();
      }
    });
  }

  private warmPreviewUrls(docs: ApplicationDocument[]): void {
    for (const doc of docs) {
      if (!this.isImageDocument(doc) || this.previewUrls.has(doc.documentId)) continue;
      this.api.downloadDocumentBlob(doc.documentId).subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          this.previewUrls.set(doc.documentId, url);
          this.cdr.markForCheck();
        }
      });
    }
  }

  private rebuildChecklist(): void {
    const byType = new Map<string, ApplicationDocument>();
    for (const doc of this.documents) {
      if (!byType.has(doc.documentType)) byType.set(doc.documentType, doc);
    }
    const requiredSet = new Set(this.requiredDocumentTypes.map(t => t.toUpperCase().replace(/\s+/g, '_')));
    const types = new Set<string>([
      ...this.requiredDocumentTypes,
      ...DOCUMENT_TYPES,
      ...this.documents.map(d => d.documentType)
    ]);
    this.checklist = Array.from(types).map(documentType => {
      const key = documentType.toUpperCase().replace(/\s+/g, '_');
      return {
        documentType,
        label: formatAdmissionsLabel(documentType),
        required: requiredSet.has(key) || requiredSet.has(documentType),
        document: byType.get(documentType) ?? byType.get(key) ?? null
      };
    }).filter((item, idx, arr) =>
      arr.findIndex(x => x.documentType.toUpperCase() === item.documentType.toUpperCase()) === idx
    );
  }

  docStatusTone(status: string | null | undefined): string {
    const s = (status || '').toUpperCase();
    if (s === 'VERIFIED') return 'success';
    if (s === 'REJECTED') return 'danger';
    if (s === 'PENDING') return 'warning';
    return 'neutral';
  }

  onYearChange(yearId: number | null, keepClassId: number | null = null, keepSectionId: number | null = null): void {
    this.classes = [];
    this.sections = [];
    if (!yearId) return;
    this.api.academicClasses(yearId).subscribe({
      next: classes => {
        this.classes = classes;
        if (keepClassId) this.form.get('academic.classId')?.setValue(keepClassId, { emitEvent: false });
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
        if (keepSectionId) this.form.get('academic.sectionId')?.setValue(keepSectionId, { emitEvent: false });
        this.cdr.markForCheck();
      }
    });
  }

  cancel(): void {
    if (this.inquiryId && this.fromLead) {
      this.nav.toLead(this.inquiryId, 'applications');
      return;
    }
    this.nav.back(this.route, '/app/admissions/applications');
  }

  showError(path: string): boolean {
    const control = this.form.get(path);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  fieldError(path: string, label: string): string {
    const control = this.form.get(path);
    if (!control || !control.errors || !(control.touched || control.dirty)) return '';
    if (control.errors['required'] || control.errors['requiredTrue']) {
      if (path.includes('gender')) return 'Please select a gender.';
      if (path.includes('academicYearId')) return 'Please select an academic year.';
      if (path.includes('classId')) return 'Please select a class.';
      if (path.includes('dateOfBirth')) return 'Date of birth is required.';
      if (path.includes('confirmAccurate')) return 'Confirmation is required before submit.';
      return `${label} is required.`;
    }
    if (control.errors['email']) return 'Please enter a valid email address.';
    if (control.errors['pattern']) {
      if (path.toLowerCase().includes('pin')) return 'Please enter a valid PIN code.';
      if (path.toLowerCase().includes('mobile') || path.toLowerCase().includes('contact')) {
        return 'Please enter a valid mobile number.';
      }
      if (path.toLowerCase().includes('identity') || path.toLowerCase().includes('aadhaar')) {
        return 'Please enter a valid 12-digit Aadhaar number.';
      }
      return `Please enter a valid ${label.toLowerCase()}.`;
    }
    if (control.errors['minlength']) return `${label} must be at least ${control.errors['minlength'].requiredLength} characters.`;
    if (control.errors['future']) return 'Please select a valid date of birth.';
    return `${label} is invalid.`;
  }

  private refreshProgress(id: number): void {
    this.api.applicationProgress(id).subscribe({
      next: p => {
        this.progress = p;
        this.cdr.markForCheck();
      }
    });
  }

  readinessItems(): { label: string; ok: boolean }[] {
    return [
      { label: 'Student & family details', ok: this.isStepValid(0) },
      { label: 'Academic & admission details', ok: this.isStepValid(1) },
      { label: 'Required documents uploaded', ok: this.isStepValid(2) },
      { label: 'Fee summary reviewed', ok: true },
      { label: 'Accuracy confirmation', ok: this.confirmAccurate }
    ];
  }

  get allReady(): boolean {
    return this.readinessItems().every(item => item.ok);
  }

  summaryStudent(): { label: string; value: string }[] {
    const v = this.form.getRawValue().student;
    return [
      { label: 'Full name', value: v.applicantName || '—' },
      { label: 'Date of birth', value: v.dateOfBirth || '—' },
      { label: 'Gender', value: v.gender || '—' },
      { label: 'Mobile', value: v.contactNumber || '—' },
      { label: 'Nationality', value: v.nationality || '—' },
      { label: 'Email', value: v.email || '—' }
    ];
  }

  summaryAcademic(): { label: string; value: string }[] {
    const v = this.form.getRawValue().academic;
    const year = this.years.find(y => y.id === v.academicYearId)?.name ?? '—';
    const cls = this.classes.find(c => c.id === v.classId)?.name ?? (v.applyingForClass || '—');
    return [
      { label: 'Academic year', value: year },
      { label: 'Class', value: cls },
      { label: 'Previous school', value: v.hasPreviousSchooling ? (v.previousSchoolName || '—') : 'None' },
      { label: 'First language', value: v.firstLanguage || '—' }
    ];
  }

  summaryFamily(): { label: string; value: string }[] {
    const p = this.form.getRawValue().parents;
    const a = this.form.getRawValue().address;
    return [
      { label: 'Guardian', value: p.parentName || '—' },
      { label: 'Relationship', value: p.parentRelationship || '—' },
      { label: 'Mobile', value: p.parentContact || '—' },
      { label: 'Address', value: [a.addressLine1, a.city, a.pinCode].filter(Boolean).join(', ') || '—' }
    ];
  }
}
