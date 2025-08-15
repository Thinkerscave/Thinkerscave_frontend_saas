import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-student-admission-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepsModule,
    CardModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    FileUploadModule,
    ButtonModule,
    CheckboxModule,
    ToastModule
  ],
  templateUrl: './student-admission-form.component.html',
  styleUrl: './student-admission-form.component.scss',
  providers: [MessageService]
})
export class StudentAdmissionFormComponent {
  items: any[] = [];
  activeIndex: number = 0;
  admissionForm!: FormGroup;

  genderOptions = [{ name: 'Male' }, { name: 'Female' }, { name: 'Other' }];
  programOptions = [
    { name: 'Class I' }, { name: 'Class II' }, { name: 'Class III' },
    { name: 'Class X' }, { name: 'Class XII - Science' }
  ];
  reviewSections: any[] = [];

  constructor(private fb: FormBuilder, private messageService: MessageService) { }

  ngOnInit() {
    this.items = [
      { label: 'Guidelines' },
      { label: 'Basic Info' },
      { label: 'Parent Details' },
      { label: 'Address' },
      { label: 'Documents' },
      { label: 'Payment' },
      { label: 'Review & Submit' }
    ];

    this.admissionForm = this.fb.group({
      basicInfo: this.fb.group({
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        date_of_birth: ['', Validators.required],
        gender: [null, Validators.required],
        applying_for_school: [null, Validators.required]
      }),
      parentDetails: this.fb.group({
        parent_name: ['', Validators.required],
        guardian_name: [''],
        email: ['', [Validators.required, Validators.email]],
        contact_number: ['', Validators.required]
      }),
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        pincode: ['', Validators.required]
      }),
      emergencyContact: this.fb.group({
        name: ['', Validators.required],
        number: ['', Validators.required]
      }),
      documents: this.fb.array([this.createDocumentGroup()]), // UPDATED: Changed to FormArray
      payment: this.fb.group({
        application_fee_paid: [false, Validators.requiredTrue]
      }),
      finalDeclaration: this.fb.group({
        declaration: [false, Validators.requiredTrue]
      })
    });
  }

  // Helper to create a document form group
  createDocumentGroup(): FormGroup {
    return this.fb.group({
      fileName: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  // Getter for easy access to the documents FormArray
  get documents(): FormArray {
    return this.admissionForm.get('documents') as FormArray;
  }

  // Add a new document slot
  addDocument() {
    this.documents.push(this.createDocumentGroup());
  }

  // Remove a document slot at a specific index
  removeDocument(index: number) {
    if (this.documents.length > 1) {
      this.documents.removeAt(index);
    }
  }

  // Trigger the hidden file input
  triggerFileUpload(index: number) {
    document.getElementById('file-upload-' + index)?.click();
  }

  // Handle the file selection and update the form
  onFileSelect(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.documents.at(index).patchValue({
        fileName: file.name,
        file: file
      });
    }
  }

  // Action for the "Save & Continue" button
  nextStep() {
    if (this.activeIndex > 0 && this.activeIndex < 6) {
      const groupName = Object.keys(this.admissionForm.controls)[this.activeIndex - 1];
      const currentGroup = this.admissionForm.get(groupName) as FormGroup;

      Object.values(currentGroup.controls).forEach(control => {
        control.markAsTouched();
      });

      if (groupName === 'address') {
        const emergencyGroup = this.admissionForm.get('emergencyContact') as FormGroup;
        Object.values(emergencyGroup.controls).forEach(control => {
          control.markAsTouched();
        });
        if (emergencyGroup.invalid) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields in this step.' });
          return;
        }
      }

      if (currentGroup.invalid) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields in this step.' });
        return;
      }
    }

    if (this.activeIndex < this.items.length - 1) {
      this.activeIndex++;
      if (this.activeIndex === this.items.length - 1) {
        this.prepareReviewData();
      }
    }
  }

  // Action for the "Back" button
  prevStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  // Action for the "Save as Draft" button
  saveAsDraft() {
    console.log('Saving draft:', this.admissionForm.value);
    this.messageService.add({
      severity: 'info',
      summary: 'Draft Saved',
      detail: 'Your application progress has been saved.'
    });
  }

  prepareReviewData() {
    const formValue = this.admissionForm.value;
    this.reviewSections = [
      {
        title: 'Basic Information',
        fields: [
          { label: 'Full Name', value: `${formValue.basicInfo.first_name} ${formValue.basicInfo.last_name}` },
          { label: 'Date of Birth', value: new Date(formValue.basicInfo.date_of_birth).toLocaleDateString('en-GB') },
          { label: 'Gender', value: formValue.basicInfo.gender?.name },
          { label: 'Program', value: formValue.basicInfo.applying_for_school?.name }
        ]
      },
      {
        title: 'Parent/Guardian Details',
        fields: [
          { label: "Parent's Name", value: formValue.parentDetails.parent_name },
          { label: "Guardian's Name", value: formValue.parentDetails.guardian_name },
          { label: 'Email', value: formValue.parentDetails.email },
          { label: 'Phone', value: formValue.parentDetails.contact_number }
        ]
      },
      {
        title: 'Address & Emergency Contact',
        fields: [
          { label: 'Street', value: formValue.address.street },
          { label: 'City', value: formValue.address.city },
          { label: 'State', value: formValue.address.state },
          { label: 'Pincode', value: formValue.address.pincode },
          { label: 'Emergency Contact', value: `${formValue.emergencyContact.name} (${formValue.emergencyContact.number})` },
        ]
      },
      { // UPDATED: Review section for documents
        title: 'Uploaded Documents',
        fields: formValue.documents.map((doc: any) => ({ label: 'File', value: doc.fileName || 'No file uploaded' }))
      }
    ];
  }

  submitApplication() {
    if (this.admissionForm.get('finalDeclaration.declaration')?.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'You must agree to the declaration to submit.' });
      return;
    }

    if (this.admissionForm.valid) {
      console.log('Submitting Application:', this.admissionForm.value);
      const applicationId = 'APP' + Math.floor(1000 + Math.random() * 9000);

      this.messageService.add({
        severity: 'success',
        summary: 'Application Submitted!',
        detail: `Your Application ID is ${applicationId}. A confirmation has been sent to your email.`
      });

      this.admissionForm.reset();
      this.activeIndex = 0;
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Your form is invalid. Please review all steps.' });
    }
  }
}
