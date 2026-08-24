import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, finalize, of } from 'rxjs';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { ParentInfo, StudentWizardRequest } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';
import {
  SaasPageHeaderComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import {
  AppCardComponent,
  AppInputComponent,
  AppPhoneInputComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption,
  AppTextareaComponent,
  AppValidationMessageComponent,
  phoneErrorMessage
} from '../../../../shared/ui/app-form';

type WizardStep = 1 | 2;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-add-student',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AppToastComponent,
    SaasPageHeaderComponent,
    SaasTabsComponent,
    AppCardComponent,
    AppInputComponent,
    AppPhoneInputComponent,
    AppSectionHeaderComponent,
    AppSelectComponent,
    AppTextareaComponent,
    AppValidationMessageComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './add-student.component.html'
})
export class AddStudentComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  currentStep: WizardStep = 1;
  attempted = false;
  saving = false;
  apiError = '';
  lookupWarning = '';
  sameAddress = false;
  classIdValue: string | null = null;
  sectionIdValue: string | null = null;

  readonly today = new Date().toISOString().slice(0, 10);

  readonly tabs: SaasTab[] = [
    { key: 'basic', label: 'Basic Details', icon: 'pi pi-user' },
    { key: 'additional', label: 'Additional Details', icon: 'pi pi-list' }
  ];

  classOptions: AppSelectOption[] = [];
  sectionOptions: AppSelectOption[] = [];
  academicYearOptions: AppSelectOption[] = [];

  readonly genderOptions: AppSelectOption[] = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];
  readonly religionOptions: AppSelectOption[] = [
    { label: 'Hindu', value: 'Hindu' },
    { label: 'Muslim', value: 'Muslim' },
    { label: 'Christian', value: 'Christian' },
    { label: 'Sikh', value: 'Sikh' },
    { label: 'Jain', value: 'Jain' },
    { label: 'Buddhist', value: 'Buddhist' },
    { label: 'Other', value: 'Other' }
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
    { label: 'Father', value: 'Father' },
    { label: 'Mother', value: 'Mother' },
    { label: 'Guardian', value: 'Guardian' }
  ];
  readonly enrollmentStatusOptions: AppSelectOption[] = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Pending', value: 'Pending' }
  ];

  form: StudentWizardRequest = {
    firstName: '',
    lastName: '',
    parents: [this.emptyParent('Father')],
    enrollmentStatus: 'Active',
    sameAsCurrentAddress: false
  };

  ngOnInit(): void {
    this.loadAcademicYears();
    this.loadClasses();
  }

  get activeTab(): string {
    return this.currentStep === 1 ? 'basic' : 'additional';
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
    this.router.navigate(['/app/students/directory']);
  }

  emptyParent(relationship = 'Father'): ParentInfo {
    return {
      relationship,
      firstName: '',
      lastName: '',
      mobile: '',
      isPrimaryContact: relationship === 'Father',
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
    if (key === 'additional') {
      this.next();
      return;
    }
    this.back();
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
      this.form.permanentCity = this.form.currentCity;
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
      case 'classId':
        return this.form.classId ? '' : 'Class is required.';
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
      default:
        return '';
    }
  }

  next(): void {
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
    this.currentStep = 2;
    this.cdr.markForCheck();
  }

  back(): void {
    this.currentStep = 1;
    this.apiError = '';
    this.cdr.markForCheck();
  }

  canProceedStep1(): boolean {
    const previous = this.attempted;
    this.attempted = true;
    const invalid = [
      'firstName', 'lastName', 'dateOfBirth', 'classId',
      'parentFirstName', 'parentMobile', 'mobile', 'email', 'parentEmail'
    ].some(key => !!this.fieldError(key));
    this.attempted = previous;
    return !invalid;
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
    this.api.createStudentWizard(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Student created',
            detail: `${this.fullName} has been added to the directory.`
          });
          this.router.navigate(['/app/students/directory']);
        },
        error: err => {
          this.apiError = err?.error?.message || 'Failed to create student. Please retry.';
        }
      });
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
        this.academicYearOptions = years.map(y => ({ label: y.label, value: y.label }));
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
