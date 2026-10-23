import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { Observable, concatMap, finalize, from, map, of, tap, toArray } from 'rxjs';
import { SoftRefreshKeys, SoftRefreshService } from '../../../../shared/ui/loading';

import {
  EmploymentCategory,
  EmploymentStatus,
  STAFF_DOCUMENT_TYPES,
  StaffAddress,
  StaffBankDetailsRequest,
  StaffCreateRequest,
  StaffDetail,
  StaffType
} from '../../shared/models/staff.model';
import { StaffService } from '../../shared/services/staff.service';
import { BackNavigationService } from '../../../../core/services/back-navigation.service';

type WizardStep = 'personal' | 'address' | 'documents';

interface StepConfig {
  id: WizardStep;
  label: string;
  icon: string;
  num: number;
}

interface SelectOption<T = string> {
  label: string;
  value: T;
}

interface QueuedDocument {
  file: File;
  documentType: string;
  documentName: string;
}

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'xlsx', 'xls', 'csv'];
const DISCARD_DOCUMENT_MESSAGE = 'Discard this document? The entered details will be lost.';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+\- ]{7,15}$/;
const ACCOUNT_PATTERN = /^[0-9]{6,18}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const POSTAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/;

function isValidPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Component({
  selector: 'app-create-staff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, DialogModule],
  styleUrls: ['../../shared/styles/staff.shared.scss'],
  templateUrl: './create-staff.component.html'
})
export class CreateStaffComponent implements OnInit, OnDestroy {
  private readonly api = inject(StaffService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly softRefresh = inject(SoftRefreshService);
  private readonly backNav = inject(BackNavigationService);

  /** Set after the first submit or Continue attempt; enables per-field error messages. */
  submitted = false;

  // ── Photo ─────────────────────────────────────────────────────────────────
  photoPreviewUrl: string | null = null;
  pendingPhoto: File | null = null;
  removePhotoOnSave = false;
  photoError = '';
  maskedAccountNumber = '';
  private hadExistingPhoto = false;
  private ownPreviewUrl: string | null = null;

  isEditMode = false;
  editStaffId: number | null = null;
  saving = false;
  loadingExisting = false;
  errorMessage = '';
  successMessage = '';

  activeStep: WizardStep = 'personal';

  readonly steps: StepConfig[] = [
    { id: 'personal',  label: 'Basic & Employment', icon: 'pi-user',      num: 1 },
    { id: 'address',   label: 'Address & Bank',     icon: 'pi-map-marker', num: 2 },
    { id: 'documents', label: 'Documents',          icon: 'pi-file',      num: 3 }
  ];

  // ── Personal ──────────────────────────────────────────────────────────────
  firstName = '';
  middleName = '';
  lastName = '';
  gender = '';
  dateOfBirth = '';
  bloodGroup = '';
  religion = '';
  nationality = '';
  mobileNumber = '';
  email = '';
  highestQualification = '';
  experienceYears: number | null = null;

  // ── Employment ────────────────────────────────────────────────────────────
  staffType: StaffType = 'TEACHING';
  designation = '';
  employmentCategory: EmploymentCategory = 'PERMANENT';
  employmentStatus: EmploymentStatus = 'ACTIVE';
  joiningDate = '';
  contractStartDate = '';
  contractEndDate = '';

  // ── Address ───────────────────────────────────────────────────────────────
  presentAddress: StaffAddress = {};
  permanentAddress: StaffAddress = {};
  sameAsPresentAddress = true;

  // ── Bank (optional on create; salary configured in Finance → Payroll) ─────
  bankName = '';
  accountHolderName = '';
  accountNumber = '';
  ifscCode = '';

  // ── Documents (queued here, uploaded after the staff record is saved) ─────
  readonly documentTypeOptions = STAFF_DOCUMENT_TYPES;
  readonly allowedDocumentExtensions = '.pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv';
  docType: string | null = null;
  docName = '';
  docDialogOpen = false;
  docFile: File | null = null;
  docFileError = '';
  docNameTouched = false;
  queuedDocuments: QueuedDocument[] = [];
  /** Set once the staff record exists, so a failed upload can be retried without creating a duplicate. */
  createdStaffId: number | null = null;

  // ── Subject slots (teaching staff: primary required, secondary optional) ──
  primarySubjectId: number | null = null;
  secondarySubjectId: number | null = null;
  subjectOptionList: SelectOption<number>[] = [];
  primarySubjectOptions: SelectOption<number>[] = [];
  secondarySubjectOptions: SelectOption<number>[] = [];
  /** Subjects already on the staff record; kept selectable even outside the current academic year. */
  private savedSubjects: SelectOption<number>[] = [];
  subjectsLoading = false;
  subjectsLoadError = '';

  // ── Emergency ─────────────────────────────────────────────────────────────
  emergencyContactName = '';
  emergencyContactRelation = '';
  emergencyContactNumber = '';

  // ── Dropdown options ──────────────────────────────────────────────────────
  readonly genderOptions: SelectOption[] = [
    { label: 'Select gender', value: '' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
    { label: 'Prefer not to say', value: 'Prefer not to say' }
  ];
  readonly bloodGroupOptions: SelectOption[] = [
    { label: 'Select blood group', value: '' },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' }
  ];
  readonly nationalityOptions: SelectOption[] = [
    { label: 'Select nationality', value: '' },
    { label: 'Indian', value: 'Indian' },
    { label: 'American', value: 'American' },
    { label: 'British', value: 'British' },
    { label: 'Canadian', value: 'Canadian' },
    { label: 'Australian', value: 'Australian' },
    { label: 'Other', value: 'Other' }
  ];

  readonly staffTypeOptions: SelectOption<StaffType>[] = [
    { value: 'TEACHING', label: 'Teaching Staff' },
    { value: 'NON_TEACHING', label: 'Non-Teaching Staff' }
  ];

  readonly categoryOptions: SelectOption<EmploymentCategory>[] = [
    { value: 'PERMANENT',        label: 'Permanent' },
    { value: 'CONTRACT',         label: 'Contract' },
    { value: 'TEMPORARY',        label: 'Temporary' },
    { value: 'PART_TIME',        label: 'Part Time' },
    { value: 'VISITING_FACULTY', label: 'Visiting Faculty' }
  ];

  readonly statusOptions: SelectOption<EmploymentStatus>[] = [
    { value: 'ACTIVE',             label: 'Active' },
    { value: 'PROBATION',          label: 'Probation' },
    { value: 'NOTICE_PERIOD',      label: 'Notice Period' },
    { value: 'RESIGNED',           label: 'Resigned' },
    { value: 'RETIRED',            label: 'Retired' },
    { value: 'CONTRACT_COMPLETED', label: 'Contract Completed' }
  ];

  get activeStepIndex(): number {
    return this.steps.findIndex(s => s.id === this.activeStep);
  }

  get isLastStep(): boolean {
    return this.activeStepIndex === this.steps.length - 1;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.editStaffId = Number(idParam);
      this.loadExisting(this.editStaffId);
    } else {
      // Set today as default joining date
      this.joiningDate = todayIso();
    }
    this.loadSubjectOptions();
  }

  loadExisting(staffId: number): void {
    this.loadingExisting = true;
    this.api.getStaffDetail(staffId)
      .pipe(finalize(() => { this.loadingExisting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: staff => {
          this.populateForm(staff);
          if (staff.photoUrl) { this.loadExistingPhoto(staffId); }
        },
        error: () => { this.errorMessage = 'Could not load staff details.'; this.cdr.markForCheck(); }
      });
  }

  private loadExistingPhoto(staffId: number): void {
    this.api.getPhotoObjectUrl(staffId).subscribe({
      next: url => {
        this.hadExistingPhoto = !!url;
        this.photoPreviewUrl = url;
        this.cdr.markForCheck();
      },
      error: () => { /* photo is optional; keep placeholder */ }
    });
  }

  populateForm(s: StaffDetail): void {
    this.firstName            = s.firstName;
    this.middleName           = s.middleName ?? '';
    this.lastName             = s.lastName;
    this.gender               = s.gender;
    this.dateOfBirth          = s.dateOfBirth;
    this.bloodGroup           = s.bloodGroup ?? '';
    this.religion             = s.religion ?? '';
    this.nationality          = s.nationality ?? '';
    this.mobileNumber         = s.mobileNumber;
    this.email                = s.email;
    this.highestQualification = s.highestQualification ?? '';
    this.experienceYears      = s.experienceYears ?? null;
    this.primarySubjectId     = s.primarySubject?.subjectId ?? null;
    this.secondarySubjectId   = s.secondarySubject?.subjectId ?? null;
    this.savedSubjects = [s.primarySubject, s.secondarySubject].flatMap(r => r ? [{ label: r.name, value: r.subjectId }] : []);
    this.refreshSubjectOptions();

    this.staffType            = s.staffType;
    this.designation          = s.designation;
    this.employmentCategory   = s.employmentCategory;
    this.employmentStatus     = s.employmentStatus;
    this.joiningDate          = s.joiningDate;

    this.emergencyContactName     = s.emergencyContactName ?? '';
    this.emergencyContactRelation = s.emergencyContactRelation ?? '';
    this.emergencyContactNumber   = s.emergencyContactNumber ?? '';

    this.contractStartDate    = s.contractStartDate ?? '';
    this.contractEndDate      = s.contractEndDate ?? '';

    this.sameAsPresentAddress = s.sameAsPresentAddress ?? true;
    this.presentAddress       = { ...(s.presentAddress ?? {}) };
    this.permanentAddress     = { ...(s.permanentAddress ?? {}) };

    // Bank: only the masked account number is returned; the account number field stays empty.
    this.bankName             = s.bankDetails?.bankName ?? '';
    this.accountHolderName    = s.bankDetails?.accountHolderName ?? '';
    this.ifscCode             = s.bankDetails?.ifscCode ?? '';
    this.maskedAccountNumber  = s.bankDetails?.maskedAccountNumber ?? '';
    this.accountNumber        = '';
  }

  setStep(step: WizardStep): void { this.activeStep = step; }

  nextStep(): void {
    const idx = this.activeStepIndex;
    if (this.stepHasErrors(this.activeStep)) {
      this.submitted = true;
      this.errorMessage = 'Please fix the highlighted fields before continuing.';
      this.cdr.markForCheck();
      return;
    }
    this.errorMessage = '';
    if (idx < this.steps.length - 1) {
      this.activeStep = this.steps[idx + 1].id;
    }
  }

  prevStep(): void {
    const idx = this.activeStepIndex;
    if (idx > 0) {
      this.activeStep = this.steps[idx - 1].id;
    }
  }

  cancel(): void {
    this.backNav.back({ fallback: '/app/staff/directory' });
  }

  ngOnDestroy(): void {
    this.releaseOwnPreview();
  }

  submit(): void {
    this.submitted = true;
    const firstKey = Object.keys(this.errors)[0];
    if (firstKey) {
      this.activeStep = this.stepOf(firstKey);
      this.errorMessage = 'Please fix the highlighted fields.';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';
    this.saving = true;
    this.cdr.markForCheck();

    const isContract = this.employmentCategory === 'CONTRACT';
    const request: StaffCreateRequest = {
      firstName:             this.firstName.trim(),
      middleName:            this.middleName.trim() || undefined,
      lastName:              this.lastName.trim(),
      gender:                this.gender,
      dateOfBirth:           this.dateOfBirth,
      bloodGroup:            this.bloodGroup || undefined,
      nationality:           this.nationality || undefined,
      mobileNumber:          this.mobileNumber.trim(),
      email:                 this.email.trim(),
      staffType:             this.staffType,
      designation:           this.designation.trim(),
      employmentCategory:    this.employmentCategory,
      employmentStatus:      this.employmentStatus,
      joiningDate:           this.joiningDate,
      contractStartDate:     isContract ? (this.contractStartDate || undefined) : undefined,
      contractEndDate:       isContract ? (this.contractEndDate || undefined) : undefined,
      highestQualification:  this.highestQualification || undefined,
      experienceYears:       this.experienceYears ?? undefined,
      emergencyContactName:  this.emergencyContactName || undefined,
      emergencyContactRelation: this.emergencyContactRelation || undefined,
      emergencyContactNumber: this.emergencyContactNumber.trim() || undefined,
      presentAddress:        this.cleanAddress(this.presentAddress),
      sameAsPresentAddress:  this.sameAsPresentAddress,
      permanentAddress:      this.sameAsPresentAddress ? undefined : this.cleanAddress(this.permanentAddress)
    };

    let save$: Observable<number>;
    if (this.isEditMode && this.editStaffId) {
      const id = this.editStaffId;
      save$ = this.api.updateStaff(id, {
        ...request,
        religion: this.religion || undefined,
        ...this.subjectPayload()
      }).pipe(
        concatMap(() => this.saveBankIfEntered(id)),
        map(() => id)
      );
    } else if (this.createdStaffId) {
      // Staff already saved by an earlier attempt: retry only the remaining steps.
      save$ = of(this.createdStaffId);
    } else {
      const createRequest: StaffCreateRequest = {
        ...request,
        ...this.subjectPayload(),
        bankDetails: this.bankEntered() ? this.bankPayload() : undefined
      };
      save$ = this.api.createStaff(createRequest).pipe(
        tap(res => {
          this.createdStaffId = res.staffId;
          this.softRefresh.mark(SoftRefreshKeys.staffDirectory, 'created');
        }),
        map(res => res.staffId)
      );
    }

    save$.pipe(
      concatMap(id => this.applyPhotoChange(id).pipe(map(() => id))),
      concatMap(id => this.uploadQueuedDocuments(id).pipe(map(() => id))),
      finalize(() => { this.saving = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: id => this.finishSave(id),
      error: (err: any) => this.onSaveError(err, this.isEditMode ? 'Update failed.' : 'Creation failed.')
    });
  }

  // ── Photo ──

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!PHOTO_TYPES.includes(file.type)) {
      this.photoError = 'Photo must be a JPG, PNG or WEBP image.';
    } else if (file.size > MAX_PHOTO_BYTES) {
      this.photoError = 'Photo must be 2 MB or smaller.';
    } else {
      this.photoError = '';
      this.releaseOwnPreview();
      this.ownPreviewUrl = URL.createObjectURL(file);
      this.photoPreviewUrl = this.ownPreviewUrl;
      this.pendingPhoto = file;
      this.removePhotoOnSave = false;
    }
    this.cdr.markForCheck();
  }

  clearPhoto(): void {
    this.releaseOwnPreview();
    this.pendingPhoto = null;
    this.photoPreviewUrl = null;
    this.removePhotoOnSave = this.hadExistingPhoto;
    this.photoError = '';
    this.cdr.markForCheck();
  }

  private releaseOwnPreview(): void {
    if (this.ownPreviewUrl) {
      URL.revokeObjectURL(this.ownPreviewUrl);
      this.ownPreviewUrl = null;
    }
  }

  private applyPhotoChange(staffId: number): Observable<unknown> {
    if (this.pendingPhoto) {
      const file = this.pendingPhoto;
      return this.api.uploadStaffPhoto(staffId, file).pipe(
        tap(() => { this.pendingPhoto = null; this.hadExistingPhoto = true; })
      );
    }
    if (this.removePhotoOnSave) {
      return this.api.removeStaffPhoto(staffId).pipe(
        tap(() => { this.removePhotoOnSave = false; this.hadExistingPhoto = false; })
      );
    }
    return of(null);
  }

  // ── Validation ──

  /** Field key to message. Empty when the form is valid. */
  get errors(): Record<string, string> {
    const e: Record<string, string> = {};
    const today = todayIso();

    if (!this.firstName.trim()) e['firstName'] = 'First name is required.';
    if (!this.lastName.trim()) e['lastName'] = 'Last name is required.';
    if (!this.gender) e['gender'] = 'Gender is required.';
    if (!this.dateOfBirth) e['dateOfBirth'] = 'Date of birth is required.';
    else if (this.dateOfBirth >= today) e['dateOfBirth'] = 'Date of birth must be in the past.';

    if (!this.mobileNumber.trim()) e['mobileNumber'] = 'Mobile number is required.';
    else if (!isValidPhone(this.mobileNumber)) e['mobileNumber'] = 'Enter 7 to 15 characters: digits, spaces, dashes or a leading +.';
    if (!this.email.trim()) e['email'] = 'Email is required.';
    else if (!EMAIL_PATTERN.test(this.email.trim())) e['email'] = 'Enter a valid email address.';
    if (this.emergencyContactNumber.trim() && !isValidPhone(this.emergencyContactNumber)) {
      e['emergencyContactNumber'] = 'Enter 7 to 15 characters: digits, spaces, dashes or a leading +.';
    }

    if (this.experienceYears !== null && (this.experienceYears < 0 || !Number.isInteger(Number(this.experienceYears)))) {
      e['experienceYears'] = 'Enter a whole number of years (0 or more).';
    }
    if (!this.designation.trim()) e['designation'] = 'Designation is required.';
    if (!this.joiningDate) e['joiningDate'] = 'Joining date is required.';
    else if (this.dateOfBirth && this.joiningDate < this.dateOfBirth) e['joiningDate'] = 'Joining date cannot be before date of birth.';
    if (this.employmentCategory === 'CONTRACT' && this.contractStartDate && this.contractEndDate
      && this.contractEndDate < this.contractStartDate) {
      e['contractEndDate'] = 'Contract end date cannot be before start date.';
    }

    if (this.presentAddress.postalCode?.trim() && !POSTAL_PATTERN.test(this.presentAddress.postalCode.trim())) {
      e['presentPostalCode'] = 'Enter a valid postal code.';
    }
    if (!this.sameAsPresentAddress && this.permanentAddress.postalCode?.trim()
      && !POSTAL_PATTERN.test(this.permanentAddress.postalCode.trim())) {
      e['permanentPostalCode'] = 'Enter a valid postal code.';
    }

    if (this.staffType === 'TEACHING') {
      if (this.subjectsLoadError) {
        e['primarySubject'] = this.subjectsLoadError;
      } else if (this.subjectsLoading) {
        e['primarySubject'] = 'Subjects are still loading. Please wait a moment.';
      } else if (!this.primarySubjectId) {
        e['primarySubject'] = this.subjectOptionList.length === 0
          ? 'No subjects exist yet. Add subjects in Academics first.'
          : 'Select a primary subject for a teaching staff member.';
      }
    }

    if (this.bankEntered()) {
      if (!this.bankName.trim()) e['bankName'] = 'Bank name is required.';
      if (!this.accountHolderName.trim()) e['accountHolderName'] = 'Account holder name is required.';
      if (!ACCOUNT_PATTERN.test(this.accountNumber.trim())) e['accountNumber'] = 'Account number must be 6 to 18 digits.';
      if (!IFSC_PATTERN.test(this.ifscCode.trim().toUpperCase())) {
        e['ifscCode'] = 'IFSC must be 4 letters, a 0, then 6 letters or digits.';
      }
    }
    return e;
  }

  /** Message for a field; shown only after the user has tried to continue or save. */
  err(key: string): string {
    return this.submitted ? (this.errors[key] ?? '') : '';
  }

  private stepOf(key: string): WizardStep {
    return /^(present|permanent|bank|accountHolder|accountNumber|ifsc)/.test(key) ? 'address' : 'personal';
  }

  private stepHasErrors(step: WizardStep): boolean {
    return Object.keys(this.errors).some(key => this.stepOf(key) === step);
  }

  // ── Address & bank helpers ──

  onSameAddressToggle(checked: boolean): void {
    this.sameAsPresentAddress = checked;
    if (checked) {
      this.permanentAddress = {};
    }
  }

  /** Create: bank is validated when any bank field is filled. Edit: only when an account number is entered (it is never prefilled). */
  bankEntered(): boolean {
    return this.isEditMode
      ? this.accountNumber.trim().length > 0
      : [this.bankName, this.accountHolderName, this.accountNumber, this.ifscCode].some(v => v.trim().length > 0);
  }

  private bankPayload(): StaffBankDetailsRequest {
    return {
      bankName: this.bankName.trim(),
      accountHolderName: this.accountHolderName.trim(),
      accountNumber: this.accountNumber.trim(),
      ifscCode: this.ifscCode.trim().toUpperCase()
    };
  }

  private saveBankIfEntered(staffId: number): Observable<unknown> {
    return this.bankEntered() ? this.api.saveBankDetails(staffId, this.bankPayload()) : of(null);
  }

  private cleanAddress(address: StaffAddress): StaffAddress | undefined {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(address)) {
      const text = (value ?? '').toString().trim();
      if (text) {
        out[key] = text;
      }
    }
    return Object.keys(out).length ? (out as StaffAddress) : undefined;
  }

  // ── Subject specialization helpers ──

  private loadSubjectOptions(): void {
    this.subjectsLoading = true;
    this.api.getSubjectOptions()
      .pipe(finalize(() => { this.subjectsLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: subjects => {
          this.subjectOptionList = subjects.map(s => ({ label: s.name, value: s.id }));
          this.refreshSubjectOptions();
        },
        error: () => { this.subjectsLoadError = 'Subjects could not be loaded. Refresh the page to try again.'; }
      });
  }

  /** Non-teaching staff send no slots, which clears any earlier subjects on the server. */
  private subjectPayload(): Pick<StaffCreateRequest, 'primarySubjectId' | 'secondarySubjectId'> {
    if (this.staffType !== 'TEACHING') {
      return {};
    }
    return {
      primarySubjectId: this.primarySubjectId ?? undefined,
      secondarySubjectId: this.secondarySubjectId ?? undefined
    };
  }

  /** Keeps each slot from repeating the other slot's subject. */
  onSubjectSlotChange(): void {
    this.refreshSubjectOptions();
    this.cdr.markForCheck();
  }

  private refreshSubjectOptions(): void {
    const choices = [...this.subjectOptionList];
    for (const saved of this.savedSubjects) {
      if (!choices.some(o => o.value === saved.value)) choices.push(saved);
    }
    this.primarySubjectOptions   = choices.filter(o => o.value !== this.secondarySubjectId);
    this.secondarySubjectOptions = choices.filter(o => o.value !== this.primarySubjectId);
  }

  // ── Document helpers ──

  openDocDialog(): void {
    this.resetDocForm();
    this.docDialogOpen = true;
  }

  get docNameError(): string {
    return this.docNameTouched && !this.docName.trim() ? 'Document name is required.' : '';
  }

  get canAddDocument(): boolean {
    return !!this.docName.trim() && !!this.docType && !!this.docFile && !this.docFileError;
  }

  /** Lists the required document fields still missing, or null when complete. */
  get docMissing(): string | null {
    const missing: string[] = [];
    if (!this.docName.trim()) { missing.push('document name'); }
    if (!this.docType) { missing.push('document type'); }
    if (!this.docFile) { missing.push('file'); }
    return missing.length ? `Still needed: ${missing.join(', ')}.` : null;
  }

  onDocFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      this.docFileError = 'Choose a PDF, image, Excel or CSV file.';
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      this.docFileError = 'File must be 5 MB or smaller.';
      return;
    }
    this.docFile = file;
    this.docFileError = '';
  }

  addQueuedDocument(): void {
    if (!this.canAddDocument || !this.docFile || !this.docType) {
      this.docNameTouched = true;
      return;
    }
    this.queuedDocuments = [
      ...this.queuedDocuments,
      { file: this.docFile, documentType: this.docType, documentName: this.docName.trim() }
    ];
    this.docDialogOpen = false;
    this.resetDocForm();
    this.cdr.markForCheck();
  }

  requestCloseDocDialog(): void {
    if (this.docDirty && !confirm(DISCARD_DOCUMENT_MESSAGE)) {
      return;
    }
    this.docDialogOpen = false;
    this.resetDocForm();
  }

  onDocDialogVisibleChange(visible: boolean): void {
    if (visible) {
      return;
    }
    if (this.docDirty && !confirm(DISCARD_DOCUMENT_MESSAGE)) {
      this.reopenDocDialog();
      return;
    }
    this.docDialogOpen = false;
    this.resetDocForm();
  }

  private get docDirty(): boolean {
    return !!this.docName.trim() || !!this.docType || !!this.docFile;
  }

  /** Re-opens the dialog after a rejected close; the timeout makes Angular see the flag change again. */
  private reopenDocDialog(): void {
    this.docDialogOpen = false;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.docDialogOpen = true;
      this.cdr.markForCheck();
    });
  }

  private resetDocForm(): void {
    this.docName = '';
    this.docType = null;
    this.docFile = null;
    this.docFileError = '';
    this.docNameTouched = false;
  }

  removeQueuedDocument(index: number): void {
    this.queuedDocuments = this.queuedDocuments.filter((_, i) => i !== index);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 * 1024) { return `${Math.round(bytes / 1024)} KB`; }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  documentTypeLabel(value: string): string {
    return STAFF_DOCUMENT_TYPES.find(t => t.value === value)?.label ?? value;
  }

  private uploadQueuedDocuments(staffId: number): Observable<unknown[]> {
    return from(this.queuedDocuments).pipe(
      concatMap(doc => this.api.uploadStaffDocument(staffId, doc.file, doc.documentType, doc.documentName).pipe(
        tap(() => { this.queuedDocuments = this.queuedDocuments.filter(q => q !== doc); })
      )),
      toArray()
    );
  }

  private finishSave(staffId: number): void {
    this.router.navigate(['/app/staff/profile', staffId]);
  }

  private onSaveError(err: any, fallback: string): void {
    const message = err?.error?.message ?? fallback;
    this.errorMessage = this.createdStaffId
      ? `Staff was saved, but a step failed: ${message}. Press Create Staff to retry the remaining steps.`
      : message;
    this.cdr.markForCheck();
  }
}
