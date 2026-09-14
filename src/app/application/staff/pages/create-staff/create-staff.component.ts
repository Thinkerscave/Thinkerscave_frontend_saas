import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs';

import {
  EmploymentCategory,
  EmploymentStatus,
  StaffCreateRequest,
  StaffDetail,
  StaffType
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';
import { BackNavigationService } from '../../../../core/services/back-navigation.service';

type WizardStep = 'personal' | 'employment';

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

@Component({
  selector: 'app-create-staff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './create-staff.component.html'
})
export class CreateStaffComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly backNav = inject(BackNavigationService);

  /** When true, renders as a right-side drawer (directory Add Staff flow). */
  @Input() drawerMode = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<number | void>();

  isEditMode = false;
  editStaffId: number | null = null;
  saving = false;
  loadingExisting = false;
  errorMessage = '';
  successMessage = '';

  activeStep: WizardStep = 'personal';

  readonly steps: StepConfig[] = [
    { id: 'personal',   label: 'Basic Details',       icon: 'pi-user',      num: 1 },
    { id: 'employment', label: 'Employment & Pay',    icon: 'pi-briefcase', num: 2 }
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
  photoUrl = '';
  remarks = '';
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

  // ── Bank (optional on create; salary configured in Finance → Payroll) ─────
  bankName = '';
  accountHolderName = '';
  accountNumber = '';
  ifscCode = '';

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
  readonly religionOptions: SelectOption[] = [
    { label: 'Select religion', value: '' },
    { label: 'Hindu', value: 'Hindu' },
    { label: 'Muslim', value: 'Muslim' },
    { label: 'Christian', value: 'Christian' },
    { label: 'Sikh', value: 'Sikh' },
    { label: 'Buddhist', value: 'Buddhist' },
    { label: 'Jain', value: 'Jain' },
    { label: 'Other', value: 'Other' }
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

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.editStaffId = Number(idParam);
      this.loadExisting(this.editStaffId);
    } else {
      // Set today as default joining date
      this.joiningDate = new Date().toISOString().substring(0, 10);
    }
  }

  loadExisting(staffId: number): void {
    this.loadingExisting = true;
    this.api.getStaffDetail(staffId)
      .pipe(finalize(() => { this.loadingExisting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: staff => this.populateForm(staff),
        error: () => { this.errorMessage = 'Could not load staff details.'; }
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
    this.photoUrl             = s.photoUrl ?? '';
    this.remarks              = s.remarks ?? '';
    this.highestQualification = s.highestQualification ?? '';
    this.experienceYears      = s.experienceYears ?? null;

    this.staffType            = s.staffType;
    this.designation          = s.designation;
    this.employmentCategory   = s.employmentCategory;
    this.employmentStatus     = s.employmentStatus;
    this.joiningDate          = s.joiningDate;

    this.emergencyContactName     = s.emergencyContactName ?? '';
    this.emergencyContactRelation = s.emergencyContactRelation ?? '';
    this.emergencyContactNumber   = s.emergencyContactNumber ?? '';
  }

  setStep(step: WizardStep): void { this.activeStep = step; }

  nextStep(): void {
    const idx = this.activeStepIndex;
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
    if (this.drawerMode) {
      this.closed.emit();
      return;
    }
    this.backNav.back({ fallback: '/app/staff/directory' });
  }

  submit(): void {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.errorMessage = 'First name and last name are required.';
      this.activeStep = 'personal';
      this.cdr.markForCheck();
      return;
    }
    if (!this.mobileNumber.trim() || !this.email.trim()) {
      this.errorMessage = 'Mobile number and email are required.';
      this.activeStep = 'personal';
      this.cdr.markForCheck();
      return;
    }
    if (!this.designation.trim() || !this.joiningDate) {
      this.errorMessage = 'Designation and joining date are required.';
      this.activeStep = 'employment';
      this.cdr.markForCheck();
      return;
    }

    this.errorMessage = '';
    this.saving = true;

    const request: StaffCreateRequest = {
      firstName:             this.firstName.trim(),
      middleName:            this.middleName.trim() || undefined,
      lastName:              this.lastName.trim(),
      gender:                this.gender,
      dateOfBirth:           this.dateOfBirth,
      bloodGroup:            this.bloodGroup || undefined,
      religion:              this.religion || undefined,
      nationality:           this.nationality || undefined,
      mobileNumber:          this.mobileNumber.trim(),
      email:                 this.email.trim(),
      staffType:             this.staffType,
      designation:           this.designation.trim(),
      employmentCategory:    this.employmentCategory,
      employmentStatus:      this.employmentStatus,
      joiningDate:           this.joiningDate,
      highestQualification:  this.highestQualification || undefined,
      experienceYears:       this.experienceYears ?? undefined,
      emergencyContactName:  this.emergencyContactName || undefined,
      emergencyContactRelation: this.emergencyContactRelation || undefined,
      emergencyContactNumber:this.emergencyContactNumber || undefined,
      photoUrl:              this.photoUrl || undefined,
      remarks:               this.remarks || undefined
    };

    if (this.isEditMode && this.editStaffId) {
      this.api.updateStaff(this.editStaffId, request)
        .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
        .subscribe({
          next: () => {
            if (this.drawerMode) {
              this.saved.emit(this.editStaffId!);
              return;
            }
            this.router.navigate(['/app/staff/profile', this.editStaffId]);
          },
          error: (err: any) => {
            this.errorMessage = err?.error?.message ?? 'Update failed.';
          }
        });
    } else {
      this.api.createStaff(request)
        .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
        .subscribe({
          next: (res: any) => {
            const newId = res?.staffId ?? 0;
            if (this.drawerMode) {
              this.saved.emit(newId || undefined);
              return;
            }
            this.router.navigate(['/app/staff/profile', newId]);
          },
          error: (err: any) => {
            this.errorMessage = err?.error?.message ?? 'Creation failed.';
          }
        });
    }
  }
}
