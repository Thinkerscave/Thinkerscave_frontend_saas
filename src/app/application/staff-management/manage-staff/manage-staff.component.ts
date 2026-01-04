import { Component } from '@angular/core';
import { Tab, TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputMaskModule } from 'primeng/inputmask';
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
  dob?: Date;
  gender?: string;
  currentAddress?: string;
  dateOfJoining?: Date;
  panNumber?: string;
  aadhaarNumber?: string;
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
        dob: new Date('1995-06-15'),
        gender: 'Female',
        currentAddress: '123 Tech Street, Bangalore',
        dateOfJoining: new Date('2020-03-01'),
        panNumber: 'ABCDE1234F',
        aadhaarNumber: '1234-5678-9012'
      },
      {
        id: 2,
        fullName: 'Rohit Sharma',
        employeeId: 'EMP002',
        department: 'Human Resources',
        jobTitle: 'HR Manager',
        email: 'rohit.sharma@example.com',
        mobileNumber: '(+91) 91234-56789',
        dob: new Date('1990-08-22'),
        gender: 'Male',
        currentAddress: '456 HR Avenue, Mumbai',
        dateOfJoining: new Date('2018-07-15'),
        panNumber: 'FGHIJ5678K',
        aadhaarNumber: '2345-6789-0123'
      },
      {
        id: 3,
        fullName: 'Sneha Patel',
        employeeId: 'EMP003',
        department: 'Finance',
        jobTitle: 'Finance Analyst',
        email: 'sneha.patel@example.com',
        mobileNumber: '(+91) 99887-66554',
        dob: new Date('1992-11-10'),
        gender: 'Female',
        currentAddress: '789 Finance Road, Delhi',
        dateOfJoining: new Date('2019-05-20'),
        panNumber: 'KLMNO9012P',
        aadhaarNumber: '3456-7890-1234'
      }
    ];
  }

  onEditStaff(staff: Staff): void {
    this.selectedStaff = staff;
    this.editingStaffId = staff.id;
    this.isEditing = true;
    this.activeTab = '0';
    
    // Patch all form values including dates
    this.staffForm.patchValue({
      fullName: staff.fullName,
      employeeId: staff.employeeId,
      department: staff.department,
      jobTitle: staff.jobTitle,
      email: staff.email,
      mobileNumber: staff.mobileNumber,
      dob: staff.dob ? new Date(staff.dob) : null,
      gender: staff.gender,
      currentAddress: staff.currentAddress,
      dateOfJoining: staff.dateOfJoining ? new Date(staff.dateOfJoining) : null,
      panNumber: staff.panNumber,
      aadhaarNumber: staff.aadhaarNumber
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
      dob: this.staffForm.value.dob,
      gender: this.staffForm.value.gender,
      currentAddress: this.staffForm.value.currentAddress,
      dateOfJoining: this.staffForm.value.dateOfJoining,
      panNumber: this.staffForm.value.panNumber,
      aadhaarNumber: this.staffForm.value.aadhaarNumber
    };

    this.staffList = [...this.staffList, newStaff];
    this.resetForm();
    this.activeTab = '1'; // Switch to view tab after adding
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
      dob: this.staffForm.value.dob,
      gender: this.staffForm.value.gender,
      currentAddress: this.staffForm.value.currentAddress,
      dateOfJoining: this.staffForm.value.dateOfJoining,
      panNumber: this.staffForm.value.panNumber,
      aadhaarNumber: this.staffForm.value.aadhaarNumber
    };

    this.staffList = this.staffList.map(staff =>
      staff.id === this.editingStaffId ? updatedStaff : staff
    );

    this.resetEdit();
    this.activeTab = '1'; // Switch to view tab after updating
  }

  resetEdit(): void {
    this.isEditing = false;
    this.editingStaffId = null;
    this.selectedStaff = null;
    this.resetForm();
  }

  resetForm(): void {
    this.staffForm.reset();
    this.staffForm.markAsPristine();
    this.staffForm.markAsUntouched();
    
    // Reset dropdowns to null
    this.staffForm.patchValue({
      gender: null,
      department: null
    });
  }

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;
    table.filterGlobal(value, 'contains');
  }

  onDeleteStaff(staff: Staff): void {
    const confirmed = confirm(`Are you sure you want to delete ${staff.fullName}'s record?`);
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