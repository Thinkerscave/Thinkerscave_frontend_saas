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
  SalaryStructureRequest,
  SalaryType,
  StaffCreateRequest,
  StaffDetail,
  StaffType
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';
import { TeacherAllocationApiService } from '../../../academics/services/teacher-allocation-api.service';
import { AcademicYearApiService } from '../../../academics/services/academic-year-api.service';
import { ClassesSectionsApiService } from '../../../academics/services/classes-sections-api.service';
import { SubjectsMappingApiService } from '../../../academics/services/subjects-mapping-api.service';

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
  private readonly teacherAllocationApi = inject(TeacherAllocationApiService);
  private readonly academicYearApi = inject(AcademicYearApiService);
  private readonly classesApi = inject(ClassesSectionsApiService);
  private readonly subjectsMappingApi = inject(SubjectsMappingApiService);

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
  temporaryPassword = '';

  activeStep: WizardStep = 'personal';

  readonly steps: StepConfig[] = [
    { id: 'personal', label: 'Basic Details', icon: 'pi-user', num: 1 },
    { id: 'employment', label: 'Employment & Pay', icon: 'pi-briefcase', num: 2 }
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
  photoFile: File | null = null;
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
  // ── Teacher Subject Allocation ─────────────────────────────────────────
  academicYearOptions: SelectOption<number>[] = [];
  allocationClassOptions: SelectOption<number>[] = [];
  allocationSectionOptions: SelectOption<number>[] = [];
  allocationSubjectOptions: SelectOption<number>[] = [];

  allocationAcademicYearId: number | null = null;
  allocationClassId: number | null = null;
  allocationSectionId: number | null = null;
  allocationClassSubjectMappingId: number | null = null;
  editTeacherAllocationId: number | null = null;
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
    { value: 'PERMANENT', label: 'Permanent' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'TEMPORARY', label: 'Temporary' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'VISITING_FACULTY', label: 'Visiting Faculty' }
  ];

  readonly statusOptions: SelectOption<EmploymentStatus>[] = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PROBATION', label: 'Probation' },
    { value: 'NOTICE_PERIOD', label: 'Notice Period' },
    { value: 'RESIGNED', label: 'Resigned' },
    { value: 'RETIRED', label: 'Retired' },
    { value: 'CONTRACT_COMPLETED', label: 'Contract Completed' }
  ];

  readonly salaryTypeOptions: SelectOption<SalaryType>[] = [
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' },
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
    this.loadAllocationAcademicYears();
  }
  loadAllocationAcademicYears(): void {
    this.academicYearApi.search().subscribe({
      next: (years) => {
        this.academicYearOptions = years.map((year: any) => ({
          label: year.label ?? year.name,
          value: Number(year.academicYearId ?? year.id)
        }));

        this.cdr.markForCheck();
      },
      error: () => {
        this.academicYearOptions = [];
        this.cdr.markForCheck();
      }
    });
  }
  onAllocationYearChange(yearId: number | null): void {
    this.allocationAcademicYearId = yearId;

    this.allocationClassId = null;
    this.allocationSectionId = null;
    this.allocationClassSubjectMappingId = null;

    this.allocationClassOptions = [];
    this.allocationSectionOptions = [];
    this.allocationSubjectOptions = [];

    if (!yearId) {
      return;
    }

    this.classesApi.getDashboard(yearId, { active: true }).subscribe({
      next: (dash) => {
        const classes = dash.classes || [];

        this.allocationClassOptions = classes.map((c) => ({
          label: c.name,
          value: c.classId
        }));

        this.cdr.markForCheck();
      },
      error: () => {
        this.allocationClassOptions = [];
        this.cdr.markForCheck();
      }
    });
  }
  onAllocationClassChange(classId: number | null): void {
    this.allocationClassId = classId;

    this.allocationSectionId = null;
    this.allocationClassSubjectMappingId = null;

    this.allocationSectionOptions = [];
    this.allocationSubjectOptions = [];

    if (!classId) {
      return;
    }

    // Load sections
    this.classesApi
      .getSectionsByClass(classId)
      .subscribe({
        next: (sections) => {
          this.allocationSectionOptions = (sections || [])
            .filter((s) => s.active !== false)
            .map((s) => ({
              label: s.name,
              value: s.sectionId
            }));

          this.cdr.markForCheck();
        },
        error: () => {
          this.allocationSectionOptions = [];
          this.cdr.markForCheck();
        }
      });

    // Load subjects
    this.subjectsMappingApi
      .getClassMappingBoard(classId)
      .subscribe({
        next: (board: any) => {
          const mappings: any[] = board?.mappings ?? [];

          this.allocationSubjectOptions = mappings
            .filter((item: any) =>
              item.included !== false &&
              item.active !== false
            )
            .map((item: any) => ({
              label: item.subjectName,
              value: Number(item.classSubjectMappingId)
            }));

          this.cdr.markForCheck();
        },
        error: () => {
          this.allocationSubjectOptions = [];
          this.cdr.markForCheck();
        }
      });
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
    this.firstName = s.firstName;
    this.middleName = s.middleName ?? '';
    this.lastName = s.lastName;
    this.gender = s.gender;
    this.dateOfBirth = s.dateOfBirth;
    this.bloodGroup = s.bloodGroup ?? '';
    this.religion = s.religion ?? '';
    this.nationality = s.nationality ?? '';
    this.mobileNumber = s.mobileNumber;
    this.email = s.email;
    this.photoUrl = s.photoUrl ?? '';
    this.remarks = s.remarks ?? '';
    this.highestQualification = s.highestQualification ?? '';
    this.experienceYears = s.experienceYears ?? null;

    this.staffType = s.staffType;
    this.designation = s.designation;
    this.employmentCategory = s.employmentCategory;
    this.employmentStatus = s.employmentStatus;
    this.joiningDate = s.joiningDate;

    this.emergencyContactName = s.emergencyContactName ?? '';
    this.emergencyContactRelation = s.emergencyContactRelation ?? '';
    this.emergencyContactNumber = s.emergencyContactNumber ?? '';

    if (s.salarySummary) {
      this.salaryType = s.salarySummary.salaryType;
      this.salaryEffectiveFrom = s.salarySummary.effectiveFrom;
    }
    if (this.isEditMode && this.staffType === 'TEACHING' && this.editStaffId) {
      this.loadExistingTeacherAllocation(this.editStaffId);
    }
  }
  loadExistingTeacherAllocation(staffId: number): void {
    this.academicYearApi.search().subscribe({
      next: (years) => {
        if (!years || years.length === 0) {
          return;
        }

        let allocationFound = false;

        years.forEach((year: any) => {
          const yearId = Number(year.academicYearId ?? year.id);

          this.teacherAllocationApi.getDashboard(yearId).subscribe({
            next: (dashboard: any) => {
              if (allocationFound) {
                return;
              }

              const row = (dashboard?.rows ?? []).find(
                (item: any) => Number(item.primaryStaffId) === staffId
              );

              console.log('EDIT STAFF ID:', staffId);
              console.log('DASHBOARD YEAR:', yearId);
              console.log('MATCHED ALLOCATION ROW:', row);

              if (!row) {
                return;
              }

              allocationFound = true;

              this.editTeacherAllocationId =
                row.teacherAllocationId ?? null;

              const allocationYearId = Number(row.academicYearId);
              const classId = Number(row.classId);
              const sectionId = Number(row.sectionId);
              const subjectMappingId =
                Number(row.classSubjectMappingId);

              this.loadEditAllocationOptions(
                allocationYearId,
                classId,
                sectionId,
                subjectMappingId
              );

              this.cdr.markForCheck();
            },
            error: () => {
              // Ignore individual academic year errors.
            }
          });
        });
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }
  loadEditAllocationOptions(
    yearId: number,
    classId: number,
    sectionId: number,
    subjectMappingId: number
  ): void {
    this.classesApi.getDashboard(yearId, { active: true }).subscribe({
      next: (dash) => {
        const classes = dash.classes || [];

        this.allocationClassOptions = classes.map((c) => ({
          label: c.name,
          value: c.classId
        }));

        this.classesApi.getSectionsByClass(classId).subscribe({
          next: (sections) => {
            this.allocationSectionOptions = (sections || [])
              .filter((s) => s.active !== false)
              .map((s) => ({
                label: s.name,
                value: s.sectionId
              }));

            this.subjectsMappingApi
              .getClassMappingBoard(classId)
              .subscribe({
                next: (board: any) => {
                  const mappings: any[] = board?.mappings ?? [];

                  this.allocationSubjectOptions = mappings
                    .filter(
                      (item: any) =>
                        item.included !== false &&
                        item.active !== false
                    )
                    .map((item: any) => ({
                      label: item.subjectName,
                      value: Number(item.classSubjectMappingId)
                    }));

                  // Restore existing allocation
                  this.allocationAcademicYearId = yearId;
                  this.allocationClassId = classId;
                  this.allocationSectionId = sectionId;
                  this.allocationClassSubjectMappingId =
                    subjectMappingId;

                  this.cdr.markForCheck();
                },
                error: () => {
                  this.cdr.markForCheck();
                }
              });
          },
          error: () => {
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Only JPG and PNG images are allowed.');
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Profile photo must be 2MB or smaller.');
      input.value = '';
      return;
    }

    this.photoFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.photoUrl = reader.result as string;
      this.cdr.markForCheck();
    };

    reader.readAsDataURL(file);
  }

  onPhotoPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;

    if (!items) {
      return;
    }

    for (const item of Array.from(items)) {
      if (!item.type.startsWith('image/')) {
        continue;
      }

      const file = item.getAsFile();

      if (!file) {
        return;
      }

      event.preventDefault();

      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        alert('Only JPG and PNG images are allowed.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert('Profile photo must be 2MB or smaller.');
        return;
      }

      this.photoFile = file;

      const reader = new FileReader();

      reader.onload = () => {
        this.photoUrl = reader.result as string;
        this.cdr.markForCheck();
      };

      reader.readAsDataURL(file);

      return;
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
    if (this.drawerMode) {
      this.closed.emit();
      return;
    }
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
    if (!/^\d{10}$/.test(this.mobileNumber.trim())) {
      this.errorMessage = 'Mobile number must be exactly 10 digits.';
      this.activeStep = 'personal';
      this.cdr.markForCheck();
      return;
    }
    if (!this.gender || !this.dateOfBirth) {
      this.errorMessage = 'Gender and date of birth are required.';
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
    if (!this.salaryType || !this.salaryEffectiveFrom) {
      this.errorMessage = 'Salary type and effective from date are required.';
      this.activeStep = 'employment';
      this.cdr.markForCheck();
      return;
    }
    if (
      this.staffType === 'TEACHING' &&
      (!this.allocationAcademicYearId ||
        !this.allocationClassId ||
        !this.allocationSectionId ||
        !this.allocationClassSubjectMappingId)
    ) {
      this.errorMessage =
        'Academic year, class, section and subject are required for teaching staff.';
      this.activeStep = 'employment';
      this.cdr.markForCheck();
      return;
    }
    this.errorMessage = '';
    this.saving = true;

    const request: StaffCreateRequest = {
      firstName: this.firstName.trim(),
      middleName: this.middleName.trim() || undefined,
      lastName: this.lastName.trim(),
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      bloodGroup: this.bloodGroup || undefined,
      religion: this.religion || undefined,
      nationality: this.nationality || undefined,
      mobileNumber: this.mobileNumber.trim(),
      email: this.email.trim(),
      staffType: this.staffType,
      designation: this.designation.trim(),
      employmentCategory: this.employmentCategory,
      employmentStatus: this.employmentStatus,
      joiningDate: this.joiningDate,
      highestQualification: this.highestQualification || undefined,
      experienceYears: this.experienceYears ?? undefined,
      emergencyContactName: this.emergencyContactName || undefined,
      emergencyContactRelation: this.emergencyContactRelation || undefined,
      emergencyContactNumber: this.emergencyContactNumber || undefined,

      remarks: this.remarks || undefined
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
            this.successMessage = 'Staff created successfully';
            this.temporaryPassword = res?.temporaryPassword ?? '';
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
            if (this.staffType === 'TEACHING' && newId > 0) {
              this.teacherAllocationApi.assign({
                sectionId: this.allocationSectionId!,
                classSubjectMappingId: this.allocationClassSubjectMappingId!,
                staffId: newId,
                role: 'PRIMARY'
              }).subscribe({
                next: () => {
                  this.cdr.markForCheck();
                },
                error: (err: any) => {
                  this.errorMessage =
                    err?.error?.message ?? 'Staff created, but subject allocation failed.';
                  this.cdr.markForCheck();
                }
              });

              return;
            }

            this.cdr.markForCheck();
          },
          error: (err: any) => {
            this.errorMessage = err?.error?.message ?? 'Creation failed.';
          }
        });
    }
  }
}
