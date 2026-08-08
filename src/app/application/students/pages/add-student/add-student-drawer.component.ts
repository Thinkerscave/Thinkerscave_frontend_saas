import {
  CommonModule
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { catchError, finalize, of } from 'rxjs';

import { ParentInfo, StudentWizardRequest } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

type WizardStep = 1 | 2;

interface SelectOption<T = string | null> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-add-student-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './add-student-drawer.component.html'
})
export class AddStudentDrawerComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() saved  = new EventEmitter<void>();

  private readonly api = inject(StudentsWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentStep: WizardStep = 1;
  saving = false;
  errorMessage = '';
  lookupWarning = '';
  sameAddress = false;

  classOptions: Array<{ id: number | null; label: string }> = [
    { id: null, label: 'Select Class' }
  ];
  sectionOptions: Array<{ id: number | null; label: string }> = [
    { id: null, label: 'Select Section' }
  ];
  academicYearOptions: SelectOption[] = [
    { label: 'Select Year', value: null },
    { label: '2025-2026', value: '2025-2026' },
    { label: '2024-2025', value: '2024-2025' },
    { label: '2023-2024', value: '2023-2024' }
  ];

  readonly steps = [
    { num: 1 as WizardStep, label: 'Basic Details', icon: 'pi pi-user' },
    { num: 2 as WizardStep, label: 'Additional Details', icon: 'pi pi-list' }
  ];

  readonly genderOptions: SelectOption[] = [
    { label: 'Select Gender', value: null },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];
  readonly religionOptions: SelectOption[] = [
    { label: 'Select', value: null },
    { label: 'Hindu', value: 'Hindu' },
    { label: 'Muslim', value: 'Muslim' },
    { label: 'Christian', value: 'Christian' },
    { label: 'Sikh', value: 'Sikh' },
    { label: 'Jain', value: 'Jain' },
    { label: 'Buddhist', value: 'Buddhist' },
    { label: 'Other', value: 'Other' }
  ];
  readonly bloodGroupOptions: SelectOption[] = [
    { label: 'Select', value: null },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' }
  ];
  readonly relationshipOptions: SelectOption<string>[] = [
    { label: 'Father', value: 'Father' },
    { label: 'Mother', value: 'Mother' },
    { label: 'Guardian', value: 'Guardian' }
  ];
  readonly enrollmentStatusOptions: SelectOption<string>[] = [
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

  private loadAcademicYears(): void {
    this.api.listAcademicYears()
      .pipe(catchError(() => {
        this.lookupWarning = 'Academic year options could not be refreshed. Default years are still available.';
        return of([]);
      }))
      .subscribe(years => {
        if (years.length) {
          this.academicYearOptions = [
            { label: 'Select Year', value: null },
            ...years.map(y => ({ label: y.label, value: y.label }))
          ];
        }
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
        this.classOptions = [
          { id: null, label: 'Select Class' },
          ...classes.map(c => ({ id: c.id, label: c.label }))
        ];
        this.cdr.markForCheck();
      });
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

  onClassSelected(): void {
    this.form.sectionId = null;
    this.sectionOptions = [{ id: null, label: 'Select Section' }];
    if (this.form.classId) {
      this.api.listSectionsByClass(this.form.classId)
        .pipe(catchError(() => {
          this.lookupWarning = 'Sections could not be loaded for the selected class.';
          return of([]);
        }))
        .subscribe(sections => {
          this.sectionOptions = [
            { id: null, label: 'Select Section' },
            ...sections.map(s => ({ id: s.id, label: s.label }))
          ];
          this.cdr.markForCheck();
        });
    }
  }

  onSameAddressToggle(): void {
    if (this.sameAddress) {
      this.form.permanentAddressLine1 = this.form.currentAddressLine1;
      this.form.permanentCity = this.form.currentCity;
      this.form.permanentState = this.form.currentState;
      this.form.permanentPincode = this.form.currentPincode;
    }
  }

  get progressPercent(): number {
    return this.currentStep === 1 ? 50 : 100;
  }

  next(): void {
    this.errorMessage = '';
    if (this.currentStep === 1 && !this.canProceedStep1()) {
      this.errorMessage = 'First name, last name, and a primary parent mobile are required.';
      return;
    }
    if (this.currentStep < 2) {
      this.currentStep = 2;
      this.cdr.markForCheck();
    }
  }

  back(): void {
    if (this.currentStep > 1) {
      this.currentStep = 1;
      this.errorMessage = '';
      this.cdr.markForCheck();
    }
  }

  goToStep(step: number): void {
    if (step === 1 || (step === 2 && this.canProceedStep1())) {
      this.currentStep = step as WizardStep;
      this.cdr.markForCheck();
    }
  }

  isStepDone(step: number): boolean {
    return step < this.currentStep;
  }

  canProceedStep1(): boolean {
    const parent = this.form.parents?.[0];
    return !!(
      this.form.firstName?.trim() &&
      this.form.lastName?.trim() &&
      parent?.firstName?.trim() &&
      parent?.mobile?.trim()
    );
  }

  submit(): void {
    this.errorMessage = '';
    if (!this.canProceedStep1()) {
      this.errorMessage = 'First Name, Last Name, and primary parent details are required.';
      this.currentStep = 1;
      return;
    }
    this.saving = true;
    this.api.createStudentWizard(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => this.saved.emit(),
        error: err => { this.errorMessage = err?.error?.message || 'Failed to create student. Please retry.'; }
      });
  }

  parentLabel(index: number): string {
    return this.form.parents?.[index]?.relationship || `Parent ${index + 1}`;
  }

  get fullName(): string {
    return [this.form.firstName, this.form.middleName, this.form.lastName].filter(Boolean).join(' ');
  }
}