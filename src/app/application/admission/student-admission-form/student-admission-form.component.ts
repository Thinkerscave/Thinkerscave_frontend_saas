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
import { AdmissionService } from '../../../services/admission.service';

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
 items: MenuItem[] = [];
  activeIndex: number = 0;
  admissionForm!: FormGroup;

  // Options for dropdowns
  genderOptions = [{ name: 'Male' }, { name: 'Female' }, { name: 'Other' }];
  programOptions = [
    { name: 'Class I' }, { name: 'Class II' }, { name: 'Class III' },
    { name: 'Class X' }, { name: 'Class XII - Science' }
  ];

  // For the final review step
  reviewSections: any[] = [];

  // Maps the active step index to the corresponding form group name
  private stepFormGroupMap: string[] = [
    '', // Index 0 is Guidelines, no form group
    'basicInfo',
    'parentDetails',
    'address', // 'address' and 'emergencyContact' are validated together
    'documents',
    'payment'
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private admissionService: AdmissionService // Inject the service
  ) { }

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

    // Initialize the reactive form with all its groups and validators
    this.admissionForm = this.fb.group({
      basicInfo: this.fb.group({
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        date_of_birth: [null, Validators.required],
        gender: [null, Validators.required],
        applying_for_school: [null, Validators.required]
      }),
      parentDetails: this.fb.group({
        parent_name: ['', Validators.required],
        guardian_name: [''],
        email: ['', [Validators.required, Validators.email]],
        contact_number: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]]
      }),
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
      }),
      emergencyContact: this.fb.group({
        name: ['', Validators.required],
        number: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]]
      }),
      documents: this.fb.array([this.createDocumentGroup()]),
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

  addDocument() {
    this.documents.push(this.createDocumentGroup());
  }

  removeDocument(index: number) {
    if (this.documents.length > 1) {
      this.documents.removeAt(index);
    }
  }

  // Trigger the hidden file input to open the file selection dialog
  triggerFileUpload(index: number) {
    document.getElementById(`file-upload-${index}`)?.click();
  }

  // Handle file selection and patch the values into the form
  onFileSelect(event: any, index: number) {
    const file = event.target.files?.[0];
    if (file) {
      this.documents.at(index).patchValue({
        fileName: file.name,
        file: file
      });
      // Mark as touched to satisfy validation
      this.documents.at(index).get('fileName')?.markAsTouched();
      this.documents.at(index).get('file')?.markAsTouched();
    }
  }

  // Navigation to the next step with validation
  nextStep() {
    // Validate the current step's form group before proceeding
    if (this.activeIndex > 0 && this.activeIndex < 6) {
      const groupName = this.stepFormGroupMap[this.activeIndex];
      const currentGroup = this.admissionForm.get(groupName);

      if (currentGroup) {
        currentGroup.markAllAsTouched(); // Show errors if any fields are untouched

        // Special handling for step 3 (Address & Emergency Contact)
        if (groupName === 'address') {
          const emergencyGroup = this.admissionForm.get('emergencyContact');
          emergencyGroup?.markAllAsTouched();
          if (emergencyGroup?.invalid) {
            this.showError('Please fill all required fields in this step.');
            return;
          }
        }
        
        if (currentGroup.invalid) {
          this.showError('Please fill all required fields in this step.');
          return;
        }
      }
    }

    // If validation passes, move to the next step
    if (this.activeIndex < this.items.length - 1) {
      this.activeIndex++;
      // If we are now on the review step, prepare the data for display
      if (this.activeIndex === this.items.length - 1) {
        this.prepareReviewData();
      }
    }
  }

  // Navigation to the previous step
  prevStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  // Saves the current form state as a draft
  saveAsDraft() {
    // In a real app, this would call a service method to save partial data
    this.admissionService.saveDraft(this.admissionForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Draft Saved',
          detail: 'Your application progress has been saved successfully.'
        });
      },
      error: (err) => this.showError('Could not save draft.')
    });
  }

  // Final submission of the entire form
  submitApplication() {
    this.admissionForm.markAllAsTouched();
    if (this.admissionForm.get('finalDeclaration.declaration')?.invalid) {
      this.showError('You must agree to the declaration to submit.');
      return;
    }
    
    if (this.admissionForm.valid) {
      this.admissionService.submitAdmission(this.admissionForm.value).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Application Submitted!',
            detail: `Your Application ID is ${response.applicationId}. A confirmation has been sent.`
          });
          this.admissionForm.reset();
          while (this.documents.length !== 1) {
            this.documents.removeAt(0);
          }
          this.activeIndex = 0;
        },
        error: (err) => this.showError(err.error?.message || 'Submission failed. Please try again.')
      });
    } else {
      this.showError('Your form is invalid. Please review all steps for errors.');
    }
  }

  // Prepares data from the form to be displayed in the review section
  prepareReviewData() {
    const formValue = this.admissionForm.getRawValue(); // Use getRawValue to include disabled fields if any
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
          { label: "Guardian's Name", value: formValue.parentDetails.guardian_name || 'N/A' },
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
      {
        title: 'Uploaded Documents',
        fields: formValue.documents.map((doc: any) => ({ label: 'File Name', value: doc.fileName || 'No file selected' }))
      }
    ];
  }

  // Helper method for showing error toasts
  private showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }
}
