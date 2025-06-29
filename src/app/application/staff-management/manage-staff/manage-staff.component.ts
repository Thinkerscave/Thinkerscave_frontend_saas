import { Component, NgModule } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
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
@Component({
  selector: 'app-manage-staff',
  imports: [ReactiveFormsModule, TabsModule,
    AccordionModule, ButtonModule, FormsModule, CommonModule, CalendarModule,
    DropdownModule, InputMaskModule, InputTextModule
  ],
  templateUrl: './manage-staff.component.html',
  styleUrl: './manage-staff.component.scss'
})
export class ManageStaffComponent {
  staffForm!: FormGroup;

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
  }

  // Helper method to easily access form controls in the template
  get f() {
    return this.staffForm.controls;
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      // Mark all fields as touched to display validation messages
      this.staffForm.markAllAsTouched();
      return;
    }

    // Form is valid, process the data
    console.log('Form Submitted!', this.staffForm.value);
    // Here you would typically send the data to a service
  }
}
