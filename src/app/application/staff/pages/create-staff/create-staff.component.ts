import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  EmploymentCategory,
  EmploymentStatus,
  SalaryStructureRequest,
  SalaryType,
  StaffCreateRequest,
  StaffDetail,
  StaffType
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';

type WizardStep = 'personal' | 'address' | 'employment' | 'salary' | 'emergency';

interface StepConfig {
  id: WizardStep;
  label: string;
  icon: string;
  num: number;
}

@Component({
  selector: 'app-create-staff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './create-staff.component.html'
})
export class CreateStaffComponent implements OnInit {
  private readonly api = inject(StaffService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  isEditMode = false;
  editStaffId: number | null = null;
  saving = false;
  loadingExisting = false;
  errorMessage = '';
  successMessage = '';

  activeStep: WizardStep = 'personal';

  readonly steps: StepConfig[] = [
    { id: 'personal',   label: 'Personal Information',   icon: 'pi-user',        num: 1 },
    { id: 'employment', label: 'Employment Information',  icon: 'pi-briefcase',   num: 2 },
    { id: 'salary',     label: 'Salary Information',      icon: 'pi-money-bill',  num: 3 },
    { id: 'emergency',  label: 'Emergency Contact',       icon: 'pi-heart',       num: 4 }
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

  // ── Salary ────────────────────────────────────────────────────────────────
  salaryType: SalaryType = 'MONTHLY';
  basicPay: number | null = null;
  hra: number | null = null;
  da: number | null = null;
  specialAllowance: number | null = null;
  transportAllowance: number | null = null;
  otherAllowance: number | null = null;
  bankName = '';
  accountHolderName = '';
  accountNumber = '';
  ifscCode = '';
  salaryEffectiveFrom = '';

  // ── Emergency ─────────────────────────────────────────────────────────────
  emergencyContactName = '';
  emergencyContactRelation = '';
  emergencyContactNumber = '';

  // ── Dropdown options ──────────────────────────────────────────────────────
  readonly genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  readonly bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  readonly religionOptions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
  readonly nationalityOptions = ['Indian', 'American', 'British', 'Canadian', 'Australian', 'Other'];

  readonly staffTypeOptions: { value: StaffType; label: string }[] = [
    { value: 'TEACHING', label: 'Teaching Staff' },
    { value: 'NON_TEACHING', label: 'Non-Teaching Staff' }
  ];

  readonly categoryOptions: { value: EmploymentCategory; label: string }[] = [
    { value: 'PERMANENT',       label: 'Permanent' },
    { value: 'CONTRACT',        label: 'Contract' },
    { value: 'TEMPORARY',       label: 'Temporary' },
    { value: 'PART_TIME',       label: 'Part Time' },
    { value: 'VISITING_FACULTY',label: 'Visiting Faculty' }
  ];

  readonly statusOptions: { value: EmploymentStatus; label: string }[] = [
    { value: 'ACTIVE',             label: 'Active' },
    { value: 'PROBATION',          label: 'Probation' },
    { value: 'NOTICE_PERIOD',      label: 'Notice Period' },
    { value: 'RESIGNED',           label: 'Resigned' },
    { value: 'RETIRED',            label: 'Retired' },
    { value: 'CONTRACT_COMPLETED', label: 'Contract Completed' }
  ];

  readonly salaryTypeOptions: { value: SalaryType; label: string }[] = [
    { value: 'MONTHLY',    label: 'Monthly' },
    { value: 'DAILY_WAGE', label: 'Daily Wage' }
  ];

  get grossSalary(): number {
    return (this.basicPay ?? 0) + (this.hra ?? 0) + (this.da ?? 0)
         + (this.specialAllowance ?? 0) + (this.transportAllowance ?? 0)
         + (this.otherAllowance ?? 0);
  }

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
      this.salaryEffectiveFrom = new Date().toISOString().substring(0, 10);
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

    if (s.salarySummary) {
      this.salaryType          = s.salarySummary.salaryType;
      this.salaryEffectiveFrom = s.salarySummary.effectiveFrom;
    }
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
    this.router.navigate(['/app/staff/directory']);
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
            // If create, also set salary structure if filled in
            const newId = res?.staffId ?? 0;
            if (this.salaryEffectiveFrom && newId > 0) {
              const salReq: SalaryStructureRequest = {
                staffId: newId,
                salaryType: this.salaryType,
                basicPay: this.basicPay ?? undefined,
                hra: this.hra ?? undefined,
                da: this.da ?? undefined,
                specialAllowance: this.specialAllowance ?? undefined,
                transportAllowance: this.transportAllowance ?? undefined,
                otherAllowance: this.otherAllowance ?? undefined,
                bankName: this.bankName || undefined,
                accountHolderName: this.accountHolderName || undefined,
                accountNumber: this.accountNumber || undefined,
                ifscCode: this.ifscCode || undefined,
                effectiveFrom: this.salaryEffectiveFrom
              };
              this.api.createSalaryStructure(salReq).subscribe();
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
