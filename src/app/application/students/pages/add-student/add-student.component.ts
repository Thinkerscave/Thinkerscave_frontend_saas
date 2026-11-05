import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { Observable, catchError, concatMap, finalize, from, map, of, tap, toArray } from 'rxjs';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { BackNavigationService } from '../../../../core/services/back-navigation.service';
import { StudentReferenceDataService } from '../../../../shared/services/student-reference-data.service';
import { ParentInfo, StudentWizardRequest } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';
import {
  SoftRefreshKeys,
  SoftRefreshService
} from '../../../../shared/ui/loading';
import {
  SaasTab,
  SaasTabsComponent,
  SaasPageHeaderComponent
} from '../../../../shared/ui/saas';
import {
  AppCardComponent,
  AppInputComponent,
  AppPhoneInputComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption,
  AppValidationMessageComponent,
  phoneErrorMessage
} from '../../../../shared/ui/app-form';

type WizardStep = 1 | 2 | 3;

interface QueuedStudentDocument {
  file: File;
  documentType: string;
  documentName: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'xlsx', 'xls', 'csv'];

@Component({
  selector: 'app-add-student',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    AppToastComponent,
    SaasTabsComponent,
    SaasPageHeaderComponent,
    AppCardComponent,
    AppInputComponent,
    AppPhoneInputComponent,
    AppSectionHeaderComponent,
    AppSelectComponent,
    AppValidationMessageComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './add-student.component.html'
})
export class AddStudentComponent implements OnInit, OnDestroy {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);
  private readonly backNav = inject(BackNavigationService);
  private readonly softRefresh = inject(SoftRefreshService);
  private readonly referenceData = inject(StudentReferenceDataService);

  currentStep: WizardStep = 1;
  isEditMode = false;
  editStudentId: number | null = null;
  loadingExisting = false;
  attempted = false;
  saving = false;
  apiError = '';
  lookupWarning = '';
  photoFile: File | null = null;
  photoPreviewUrl: string | null = null;
  photoError = '';
  @ViewChild('photoInput') private photoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('docFileInput') private docFileInput?: ElementRef<HTMLInputElement>;
  sameAddress = false;
  classIdValue: string | null = null;
  sectionIdValue: string | null = null;
  createdStudentId: number | null = null;

  docDialogOpen = false;
  docName = '';
  docNameTouched = false;
  docType: string | null = null;
  docFile: File | null = null;
  docFileError = '';
  queuedDocuments: QueuedStudentDocument[] = [];
  readonly documentAccept = '.pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv';
  readonly documentTypeOptions: AppSelectOption[] = [
    { label: 'Birth Certificate', value: 'BIRTH_CERTIFICATE' },
    { label: 'Identity Proof', value: 'AADHAR' },
    { label: 'Previous School Certificate', value: 'PREVIOUS_SCHOOL_CERTIFICATE' },
    { label: 'Transfer Certificate', value: 'TRANSFER_CERTIFICATE' },
    { label: 'Marksheet', value: 'MARKSHEET' },
    { label: 'Other', value: 'OTHER' }
  ];

  readonly today = new Date().toISOString().slice(0, 10);

  asString(value: number | null | undefined): string | null {
    return value != null ? String(value) : null;
  }

  get tabs(): SaasTab[] {
    return [
      { key: 'basic', label: this.isEditMode ? 'Student Details' : 'Student & Family', icon: 'pi pi-user' },
      { key: 'additional', label: 'Additional Details', icon: 'pi pi-list' },
      { key: 'documents', label: 'Documents', icon: 'pi pi-file' }
    ];
  }

  classOptions: AppSelectOption[] = [];
  sectionOptions: AppSelectOption[] = [];
  academicYearOptions: AppSelectOption[] = [];

  readonly genderOptions: AppSelectOption[] = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
    { label: 'Prefer not to say', value: 'OTHER' }
  ];
  readonly bloodGroupOptions: AppSelectOption[] = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ];
  readonly relationshipOptions: AppSelectOption[] = [
    { label: 'Father', value: 'FATHER' },
    { label: 'Mother', value: 'MOTHER' },
    { label: 'Guardian', value: 'GUARDIAN' },
    { label: 'Other', value: 'OTHER' }
  ];
  categoryOptions: AppSelectOption[] = [];
  readonly identityTypeOptions: AppSelectOption[] = [
    { label: 'Aadhaar', value: 'AADHAAR' },
    { label: 'Passport', value: 'PASSPORT' },
    { label: 'Birth Certificate', value: 'BIRTH_CERTIFICATE' },
    { label: 'Other', value: 'OTHER' }
  ];
  form: StudentWizardRequest = {
    firstName: '',
    lastName: '',
    gender: '',
    nationality: 'Indian',
    parents: [this.emptyParent('FATHER')],
    enrollmentStatus: 'ACTIVE',
    sameAsCurrentAddress: false,
    enrollmentDate: this.today
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.isEditMode = true;
      this.editStudentId = id;
      this.createdStudentId = id;
      this.loadingExisting = true;
      this.loadExistingStudent(id);
    }
    this.loadAcademicYears();
    this.loadClasses();
    this.referenceData.socialCategories().subscribe(options => {
      this.categoryOptions = options;
      this.cdr.markForCheck();
    });
  }

  private loadExistingStudent(studentId: number): void {
    this.api.profile(studentId).subscribe({
      next: profile => {
        const personal = profile.personal;
        const academics = profile.academics;
        const medical = profile.medical;
        this.form = {
          admissionNumber: profile.overview.admissionNumber,
          firstName: personal.firstName ?? '',
          middleName: personal.middleName ?? '',
          lastName: personal.lastName ?? '',
          gender: personal.gender?.toUpperCase() ?? '',
          dateOfBirth: personal.dateOfBirth ?? '',
          religion: personal.religion ?? '',
          nationality: personal.nationality ?? '',
          socialCategory: personal.socialCategory ?? '',
          motherTongue: personal.motherTongue ?? '',
          placeOfBirth: personal.placeOfBirth ?? '',
          identityDocumentType: personal.identityDocumentType ?? '',
          identityDocumentNumber: personal.identityDocumentNumber ?? '',
          mobile: personal.mobile ?? '',
          email: personal.email ?? '',
          remarks: personal.remarks ?? '',
          emergencyContactName: personal.emergencyContactName ?? '',
          emergencyContactPhone: personal.emergencyContactPhone ?? '',
          emergencyContactRelation: personal.emergencyContactRelation ?? '',
          currentAddressLine1: personal.currentAddressLine1 ?? '',
          currentAddressLine2: personal.currentAddressLine2 ?? '',
          currentLandmark: personal.currentLandmark ?? '',
          currentCity: personal.currentCity ?? '',
          currentDistrict: personal.currentDistrict ?? '',
          currentState: personal.currentState ?? '',
          currentCountry: personal.currentCountry ?? '',
          currentPincode: personal.currentPincode ?? '',
          permanentAddressLine1: personal.permanentAddressLine1 ?? '',
          permanentAddressLine2: personal.permanentAddressLine2 ?? '',
          permanentLandmark: personal.permanentLandmark ?? '',
          permanentCity: personal.permanentCity ?? '',
          permanentDistrict: personal.permanentDistrict ?? '',
          permanentState: personal.permanentState ?? '',
          permanentCountry: personal.permanentCountry ?? '',
          permanentPincode: personal.permanentPincode ?? '',
          sameAsCurrentAddress: personal.sameAddress ?? false,
          rollNumber: academics.rollNumber ?? '',
          enrollmentDate: academics.enrollmentDate ?? this.today,
          enrollmentStatus: academics.enrollmentStatus ?? 'ACTIVE',
          bloodGroup: medical.bloodGroup ?? personal.bloodGroup ?? '',
          allergies: medical.allergies ?? '',
          medicalConditions: medical.medicalConditions ?? '',
          medications: medical.medications ?? '',
          doctorName: medical.doctorName ?? '',
          doctorContact: medical.doctorContact ?? '',
          emergencyNotes: medical.emergencyNotes ?? '',
          parents: []
        };
        this.sameAddress = this.form.sameAsCurrentAddress ?? false;
        this.loadingExisting = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.apiError = 'Unable to load this Student. Please retry.';
        this.loadingExisting = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearPhotoPreview();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.photoError = 'Choose a JPG or PNG image.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError = 'The profile photo must be 2 MB or smaller.';
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    this.clearPhotoPreview();
    this.photoFile = file;
    this.photoPreviewUrl = URL.createObjectURL(file);
    this.photoError = '';
    this.cdr.markForCheck();
  }

  removePhoto(): void {
    this.clearPhotoPreview();
    this.photoFile = null;
    this.photoError = '';
    if (this.photoInput) this.photoInput.nativeElement.value = '';
    this.cdr.markForCheck();
  }

  private clearPhotoPreview(): void {
    if (this.photoPreviewUrl) URL.revokeObjectURL(this.photoPreviewUrl);
    this.photoPreviewUrl = null;
  }

  get activeTab(): string {
    return this.currentStep === 1 ? 'basic' : this.currentStep === 2 ? 'additional' : 'documents';
  }

  get fullName(): string {
    return [this.form.firstName, this.form.middleName, this.form.lastName].filter(Boolean).join(' ');
  }

  get primaryParent(): ParentInfo {
    if (!this.form.parents?.length) {
      this.form.parents = [this.emptyParent('Father')];
    }
    return this.form.parents[0];
  }

  goBack(): void {
    this.backNav.back({
      fallback: this.editStudentId ? `/app/students/profile/${this.editStudentId}` : '/app/students/directory'
    });
  }

  emptyParent(relationship = 'FATHER'): ParentInfo {
    return {
      relationship,
      firstName: '',
      lastName: '',
      mobile: '',
      isPrimaryContact: relationship === 'FATHER',
      receiveSms: true,
      receiveEmail: true,
      isPickupAuthorized: false
    };
  }

  addParent(): void {
    if (!this.form.parents) this.form.parents = [];
    this.form.parents.push(this.emptyParent('Guardian'));
  }

  removeParent(index: number): void {
    this.form.parents?.splice(index, 1);
  }

  onTabChange(key: string): void {
    const target: Record<string, WizardStep> = { basic: 1, additional: 2, documents: 3 };
    const nextStep = target[key];
    if (!nextStep) return;
    if (nextStep > 1 && this.currentStep === 1) {
      this.attempted = true;
      if (!this.canProceedStep1()) {
        this.messages.add({
          severity: 'error',
          summary: 'Missing required fields',
          detail: 'Please fill the highlighted fields before continuing.'
        });
        this.cdr.markForCheck();
        return;
      }
    }
    this.currentStep = nextStep;
    this.apiError = '';
    this.cdr.markForCheck();
  }

  onClassChange(value: string | null): void {
    this.classIdValue = value;
    this.form.classId = value ? Number(value) : null;
    this.sectionIdValue = null;
    this.form.sectionId = null;
    this.sectionOptions = [];
    this.clearField('classId');
    if (this.form.classId) {
      this.api.listSectionsByClass(this.form.classId)
        .pipe(catchError(() => {
          this.lookupWarning = 'Sections could not be loaded for the selected class.';
          return of([]);
        }))
        .subscribe(sections => {
          this.sectionOptions = sections.map(s => ({ label: s.label, value: String(s.id) }));
          this.cdr.markForCheck();
        });
    }
  }

  onSectionChange(value: string | null): void {
    this.sectionIdValue = value;
    this.form.sectionId = value ? Number(value) : null;
  }

  onSameAddressToggle(): void {
    this.form.sameAsCurrentAddress = this.sameAddress;
    if (this.sameAddress) {
      this.form.permanentAddressLine1 = this.form.currentAddressLine1;
      this.form.permanentAddressLine2 = this.form.currentAddressLine2;
      this.form.permanentLandmark = this.form.currentLandmark;
      this.form.permanentCity = this.form.currentCity;
      this.form.permanentDistrict = this.form.currentDistrict;
      this.form.permanentState = this.form.currentState;
      this.form.permanentPincode = this.form.currentPincode;
    }
  }

  clearField(_key: string): void {
    this.cdr.markForCheck();
  }

  fieldError(key: string): string {
    if (!this.attempted) return '';
    const parent = this.form.parents?.[0];
    switch (key) {
      case 'firstName':
        return this.form.firstName?.trim() ? '' : 'First name is required.';
      case 'lastName':
        return this.form.lastName?.trim() ? '' : 'Last name is required.';
      case 'dateOfBirth':
        if (!this.form.dateOfBirth) return 'Date of birth is required.';
        if (this.form.dateOfBirth > this.today) return 'Date of birth cannot be in the future.';
        return '';
      case 'gender':
        return this.form.gender?.trim() ? '' : 'Gender is required.';
      case 'classId':
        // Enrollment is optional for onboarding; if year is chosen, class becomes required.
        if (this.form.academicYearId && !this.form.classId) return 'Class is required when academic year is selected.';
        return '';
      case 'enrollmentDate':
        return this.form.academicYearId && !this.form.enrollmentDate ? 'Enrollment date is required when enrolling.' : '';
      case 'parentFirstName':
        return parent?.firstName?.trim() ? '' : 'Parent first name is required.';
      case 'parentMobile':
        return phoneErrorMessage(parent?.mobile ?? '') ?? '';
      case 'mobile':
        return this.form.mobile?.trim() ? (phoneErrorMessage(this.form.mobile) ?? '') : '';
      case 'email':
        return this.optionalEmailError(this.form.email);
      case 'parentEmail':
        return this.optionalEmailError(parent?.email);
      case 'currentPincode':
        return this.optionalPinError(this.form.currentPincode);
      case 'permanentPincode':
        return this.form.sameAsCurrentAddress ? '' : this.optionalPinError(this.form.permanentPincode);
      default:
        return '';
    }
  }

  private optionalPinError(value: string | null | undefined): string {
    if (!value?.trim()) return '';
    return /^[1-9]\d{5}$/.test(value.trim()) ? '' : 'Enter a valid 6-digit PIN code.';
  }

  next(): void {
    if (this.currentStep === 1) {
      this.attempted = true;
      this.apiError = '';
      if (!this.canProceedStep1()) {
        this.messages.add({
          severity: 'error',
          summary: 'Missing required fields',
          detail: 'Please fill the highlighted fields before continuing.'
        });
        this.cdr.markForCheck();
        return;
      }
    }
    this.currentStep = Math.min(3, this.currentStep + 1) as WizardStep;
    this.cdr.markForCheck();
  }

  back(): void {
    this.currentStep = Math.max(1, this.currentStep - 1) as WizardStep;
    this.apiError = '';
    this.cdr.markForCheck();
  }

  canProceedStep1(): boolean {
    const previous = this.attempted;
    this.attempted = true;
    const requiredFields = this.isEditMode
      ? ['firstName', 'lastName', 'dateOfBirth', 'gender', 'mobile', 'email']
      : ['firstName', 'lastName', 'dateOfBirth', 'gender', 'classId', 'enrollmentDate',
        'parentFirstName', 'parentMobile', 'mobile', 'email', 'parentEmail'];
    const invalidFields = requiredFields.some(key => !!this.fieldError(key));
    const invalidGuardians = !this.isEditMode && (!this.form.parents?.length || this.form.parents.some(parent =>
      !parent.existingParentId && (!parent.firstName.trim() || !!phoneErrorMessage(parent.mobile)
        || !!this.optionalEmailError(parent.email))));
    this.attempted = previous;
    return !invalidFields && !invalidGuardians;
  }

  submit(): void {
    this.attempted = true;
    this.apiError = '';
    if (!this.canProceedStep1()) {
      this.currentStep = 1;
      this.messages.add({
        severity: 'error',
        summary: 'Missing required fields',
        detail: 'Please fill the highlighted fields on Basic Details before submitting.'
      });
      this.cdr.markForCheck();
      return;
    }
    this.saving = true;
    let studentSaved = false;
    let save$: Observable<number>;
    if (this.isEditMode && this.editStudentId) {
      const studentId = this.editStudentId;
      save$ = this.api.updateStudentWizard(studentId, this.form).pipe(
        tap(() => {
          studentSaved = true;
          this.softRefresh.mark(SoftRefreshKeys.studentsDirectory, 'updated');
        }),
        concatMap(() => this.api.updateMedical(studentId, this.form).pipe(map(() => studentId)))
      );
    } else if (this.createdStudentId) {
      save$ = of(this.createdStudentId);
    } else {
      save$ = this.api.createStudentWizard(this.form, this.photoFile).pipe(tap(studentId => {
        this.createdStudentId = studentId;
        studentSaved = true;
        this.softRefresh.mark(SoftRefreshKeys.studentsDirectory, 'created');
      }));
    }
    save$.pipe(
      concatMap(studentId => this.uploadQueuedDocuments(studentId).pipe(map(() => studentId))),
      finalize(() => { this.saving = false; this.cdr.markForCheck(); })
    ).subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.isEditMode ? 'Student updated' : 'Student created',
            detail: this.isEditMode ? `${this.fullName} has been updated.` : `${this.fullName} has been added to the directory.`
          });
          void this.router.navigate(this.editStudentId
            ? ['/app/students/profile', this.editStudentId]
            : ['/app/students/directory']);
        },
        error: err => {
          this.apiError = this.isEditMode && studentSaved
            ? `Student details were updated, but a follow-up save failed: ${err?.error?.message || 'Please retry.'}`
            : !this.isEditMode && this.createdStudentId
              ? `Student was saved, but a document upload failed: ${err?.error?.message || 'Please retry the remaining documents.'}`
              : err?.error?.message || `Failed to ${this.isEditMode ? 'update' : 'create'} Student. Please retry.`;
        }
      });
  }

  get docNameError(): string {
    return this.docNameTouched && !this.docName.trim() ? 'Document name is required.' : '';
  }

  get canAddDocument(): boolean {
    return !!this.docName.trim() && !!this.docType && !!this.docFile && !this.docFileError;
  }

  openDocumentDialog(): void {
    this.resetDocumentForm();
    this.docDialogOpen = true;
  }

  onDocumentFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
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
    this.queuedDocuments = [...this.queuedDocuments, {
      file: this.docFile,
      documentType: this.docType,
      documentName: this.docName.trim()
    }];
    this.closeDocumentDialog();
    this.cdr.markForCheck();
  }

  closeDocumentDialog(): void {
    this.docDialogOpen = false;
    this.resetDocumentForm();
  }

  removeQueuedDocument(index: number): void {
    this.queuedDocuments = this.queuedDocuments.filter((_, itemIndex) => itemIndex !== index);
  }

  formatDocumentSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  documentTypeLabel(value: string): string {
    return this.documentTypeOptions.find(option => option.value === value)?.label ?? value;
  }

  private resetDocumentForm(): void {
    this.docName = '';
    this.docType = null;
    this.docFile = null;
    this.docFileError = '';
    this.docNameTouched = false;
  }

  private uploadQueuedDocuments(studentId: number): Observable<unknown[]> {
    return from(this.queuedDocuments).pipe(
      concatMap(document => this.api.uploadStudentDocument(
        studentId, document.file, document.documentType, document.documentName
      ).pipe(tap(() => {
        this.queuedDocuments = this.queuedDocuments.filter(item => item !== document);
        this.cdr.markForCheck();
      }))),
      toArray()
    );
  }

  parentLabel(index: number): string {
    return this.form.parents?.[index]?.relationship || `Parent ${index + 1}`;
  }

  private optionalEmailError(value?: string | null): string {
    const email = value?.trim() ?? '';
    if (!email) return '';
    return EMAIL_PATTERN.test(email) ? '' : 'Enter a valid email address.';
  }

  private loadAcademicYears(): void {
    this.api.listAcademicYears()
      .pipe(catchError(() => {
        this.lookupWarning = 'Academic year options could not be refreshed.';
        return of([]);
      }))
      .subscribe(years => {
        this.academicYearOptions = years.map(y => ({ label: y.label, value: String(y.id) }));
        this.cdr.markForCheck();
      });
  }

  onAcademicYearChange(value: string | null): void {
    this.form.academicYearId = value ? Number(value) : null;
    this.form.academicYear = null;
    this.classIdValue = null;
    this.form.classId = null;
    this.sectionIdValue = null;
    this.form.sectionId = null;
    this.sectionOptions = [];
    this.classOptions = [];
    if (!this.form.academicYearId) {
      this.loadClasses();
      return;
    }
    this.api.listClasses(this.form.academicYearId)
      .pipe(catchError(() => {
        this.lookupWarning = 'Class options could not be loaded for the selected year.';
        return of([]);
      }))
      .subscribe(classes => {
        this.classOptions = classes.map(c => ({ label: c.label, value: String(c.id) }));
        this.cdr.markForCheck();
      });
  }

  private loadClasses(): void {
    this.api.listClasses()
      .pipe(catchError(() => {
        this.lookupWarning = 'Class options could not be loaded. Please retry after checking academic setup.';
        return of([]);
      }))
      .subscribe(classes => {
        this.classOptions = classes.map(c => ({ label: c.label, value: String(c.id) }));
        this.cdr.markForCheck();
      });
  }
}
