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
import { finalize } from 'rxjs';

import { ParentInfo, StudentWizardRequest } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

type WizardStep = 1 | 2 | 3 | 4 | 5;

@Component({
  selector: 'app-add-student-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
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
  sameAddress = false;

  classOptions: Array<{ id: number; label: string }> = [];
  sectionOptions: Array<{ id: number; label: string }> = [];
  academicYears = ['2025-2026', '2024-2025', '2023-2024'];

  readonly steps = [
    { num: 1, label: 'Student Information', icon: 'pi pi-user' },
    { num: 2, label: 'Parent Information',  icon: 'pi pi-users' },
    { num: 3, label: 'Academic Information',icon: 'pi pi-book' },
    { num: 4, label: 'Medical Information', icon: 'pi pi-heart' },
    { num: 5, label: 'Review & Submit',     icon: 'pi pi-check-circle' }
  ];

  readonly genders = ['Male', 'Female', 'Other'];
  readonly religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'];
  readonly bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly relationships = ['Father', 'Mother', 'Guardian'];
  readonly enrollmentStatuses = ['Active', 'Inactive', 'Pending'];

  form: StudentWizardRequest = {
    firstName: '',
    lastName: '',
    parents: [this.emptyParent('Father')],
    enrollmentStatus: 'Active',
    sameAsCurrentAddress: false
  };

  ngOnInit(): void {
    this.api.listAcademicYears().subscribe(years => {
      this.academicYears = years.map(y => y.label);
      this.cdr.markForCheck();
    });
    this.api.listClasses().subscribe(classes => {
      this.classOptions = classes.map(c => ({ id: c.id, label: c.label }));
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
    this.sectionOptions = [];
    if (this.form.classId) {
      this.api.listSectionsByClass(this.form.classId).subscribe(sections => {
        this.sectionOptions = sections.map(s => ({ id: s.id, label: s.label }));
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
    return Math.round(((this.currentStep - 1) / (this.steps.length - 1)) * 100);
  }

  next(): void {
    if (this.currentStep < 5) {
      this.currentStep = (this.currentStep + 1) as WizardStep;
      this.cdr.markForCheck();
    }
  }

  back(): void {
    if (this.currentStep > 1) {
      this.currentStep = (this.currentStep - 1) as WizardStep;
      this.cdr.markForCheck();
    }
  }

  goToStep(step: number): void {
    this.currentStep = step as WizardStep;
    this.cdr.markForCheck();
  }

  isStepDone(step: number): boolean {
    return step < this.currentStep;
  }

  canProceedStep1(): boolean {
    return !!(this.form.firstName?.trim() && this.form.lastName?.trim());
  }

  canProceedStep2(): boolean {
    return !!(this.form.parents?.length && this.form.parents[0]?.firstName?.trim() && this.form.parents[0]?.mobile?.trim());
  }

  canProceedStep3(): boolean {
    return !!(this.form.classId);
  }

  submit(): void {
    this.errorMessage = '';
    if (!this.canProceedStep1()) {
      this.errorMessage = 'First Name and Last Name are required.';
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
}
