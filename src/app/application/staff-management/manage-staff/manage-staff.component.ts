import { Component, NgModule } from '@angular/core';
import { Tab, TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Table } from 'primeng/table';
import { ButtonModule as PrimeButton } from 'primeng/button';

interface Staff {
  id: number;
  fullName: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  email: string;
  mobileNumber: string;
}
@Component({
  selector: 'app-manage-staff',
  imports: [ReactiveFormsModule, TabsModule, Tab,
    AccordionModule, ButtonModule, FormsModule, CommonModule, CalendarModule,
    DropdownModule, InputMaskModule, InputTextModule, TableModule, PrimeButton
  ],
  templateUrl: './manage-staff.component.html',
  styleUrl: './manage-staff.component.scss'
})
export class ManageStaffComponent {
  staffForm!: FormGroup;
  staffList: Staff[] = [];
  selectedStaff: Staff | null = null;
  activeTab = '0';
  isEditing = false;
  editingStaffId: number | null = null;
  globalFilterValue = '';

  // Options for dropdowns
  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' }
  ];

  departmentOptions = [
    { label: 'Technology', value: 'Technology' },
    { label: 'Human Resources', value: 'Human Resources' },
    { label: 'Sales', value: 'Sales' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Finance', value: 'Finance' }
  ];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.staffForm = this.fb.group({
      // Personal Information
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      dob: ['', Validators.required],
      gender: [null, Validators.required],
      mobileNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      currentAddress: ['', Validators.required],

      // Employment Details
      employeeId: ['', Validators.required],
      dateOfJoining: ['', Validators.required],
      jobTitle: ['', Validators.required],
      department: [null, Validators.required],

      // Financial Details
      panNumber: ['', [Validators.required, Validators.pattern('[A-Z]{5}[0-9]{4}[A-Z]{1}')]],
      aadhaarNumber: ['', Validators.required]
    });

    this.seedStaff();
  }

  // Helper method to easily access form controls in the template
  get f() {
    return this.staffForm.controls;
  }

  seedStaff(): void {
    this.staffList = [
      {
        id: 1,
        fullName: 'Ananya Kumar',
        employeeId: 'EMP001',
        department: 'Technology',
        jobTitle: 'Software Engineer',
        email: 'ananya.kumar@example.com',
        mobileNumber: '(+91) 98765-43210',
      },
      {
        id: 2,
        fullName: 'Rohit Sharma',
        employeeId: 'EMP002',
        department: 'Human Resources',
        jobTitle: 'HR Manager',
        email: 'rohit.sharma@example.com',
        mobileNumber: '(+91) 91234-56789',
      },
      {
        id: 3,
        fullName: 'Sneha Patel',
        employeeId: 'EMP003',
        department: 'Finance',
        jobTitle: 'Finance Analyst',
        email: 'sneha.patel@example.com',
        mobileNumber: '(+91) 99887-66554',
      },
      {
        id: 4,
        fullName: 'Ananya Kumar',
        employeeId: 'EMP001',
        department: 'Technology',
        jobTitle: 'Software Engineer',
        email: 'ananya.kumar@example.com',
        mobileNumber: '(+91) 98765-43210',
      },
      {
        id: 5,
        fullName: 'Rohit Sharma',
        employeeId: 'EMP002',
        department: 'Human Resources',
        jobTitle: 'HR Manager',
        email: 'rohit.sharma@example.com',
        mobileNumber: '(+91) 91234-56789',
      },
      {
        id: 6,
        fullName: 'Sneha Patel',
        employeeId: 'EMP003',
        department: 'Finance',
        jobTitle: 'Finance Analyst',
        email: 'sneha.patel@example.com',
        mobileNumber: '(+91) 99887-66554',
      },
    ];
  }

  onEditStaff(staff: Staff): void {
    this.selectedStaff = staff;
    this.editingStaffId = staff.id;
    this.isEditing = true;
    this.activeTab = '0';
    this.staffForm.patchValue({
      fullName: staff.fullName,
      employeeId: staff.employeeId,
      department: staff.department,
      jobTitle: staff.jobTitle,
      email: staff.email,
      mobileNumber: staff.mobileNumber,
    });
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    const newStaff: Staff = {
      id: this.generateStaffId(),
      fullName: this.staffForm.value.fullName,
      employeeId: this.staffForm.value.employeeId,
      department: this.staffForm.value.department,
      jobTitle: this.staffForm.value.jobTitle,
      email: this.staffForm.value.email,
      mobileNumber: this.staffForm.value.mobileNumber,
    };

    this.staffList = [...this.staffList, newStaff];
    this.staffForm.reset();
    this.staffForm.markAsPristine();
    this.staffForm.markAsUntouched();
  }

  onUpdateStaff(): void {
    if (this.staffForm.invalid || this.editingStaffId === null) {
      this.staffForm.markAllAsTouched();
      return;
    }

    const updatedStaff: Staff = {
      id: this.editingStaffId,
      fullName: this.staffForm.value.fullName,
      employeeId: this.staffForm.value.employeeId,
      department: this.staffForm.value.department,
      jobTitle: this.staffForm.value.jobTitle,
      email: this.staffForm.value.email,
      mobileNumber: this.staffForm.value.mobileNumber,
    };

    this.staffList = this.staffList.map(staff =>
      staff.id === this.editingStaffId ? updatedStaff : staff
    );

    this.resetEdit();
  }

  resetEdit(): void {
    this.isEditing = false;
    this.editingStaffId = null;
    this.selectedStaff = null;
    this.staffForm.reset();
    this.staffForm.markAsPristine();
    this.staffForm.markAsUntouched();
  }

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;
    table.filterGlobal(value, 'contains');
  }

  onDeleteStaff(staff: Staff): void {
    const confirmed = confirm(`Delete ${staff.fullName}'s record?`);
    if (!confirmed) {
      return;
    }

    this.staffList = this.staffList.filter(item => item.id !== staff.id);

    if (this.editingStaffId === staff.id) {
      this.resetEdit();
    }
  }

  private generateStaffId(): number {
    return this.staffList.length
      ? Math.max(...this.staffList.map(staff => staff.id)) + 1
      : 1;
  }
}
