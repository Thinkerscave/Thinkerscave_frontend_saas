import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { RippleModule } from 'primeng/ripple';
import { AdmissionService } from '../../../services/admission.service';

@Component({
  selector: 'app-student-admission-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    StepsModule,
    CardModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    FileUploadModule,
    ButtonModule,
    CheckboxModule,
    ToastModule,
    RippleModule
  ],
  templateUrl: './student-admission-form.component.html',
  styleUrl: './student-admission-form.component.scss',
  providers: [MessageService]
})
export class StudentAdmissionFormComponent {
  items: MenuItem[] = [];
  activeIndex: number = 0;
  admissionForm!: FormGroup;
  reviewConfirmed: boolean = false;
  reviewFormTouched: boolean = false;
  selectedPaymentMethod: string = 'card';

  // Options for dropdowns
  genderOptions = [
    { name: 'Male', icon: 'pi pi-mars' },
    { name: 'Female', icon: 'pi pi-venus' },
    { name: 'Other', icon: 'pi pi-user' }
  ];
  
  programOptions = [
    { name: 'Class I - Primary' },
    { name: 'Class II - Primary' },
    { name: 'Class III - Primary' },
    { name: 'Class IV - Primary' },
    { name: 'Class V - Primary' },
    { name: 'Class VI - Middle' },
    { name: 'Class VII - Middle' },
    { name: 'Class VIII - Middle' },
    { name: 'Class IX - Secondary' },
    { name: 'Class X - Secondary' },
    { name: 'Class XI - Senior Secondary (Science)' },
    { name: 'Class XI - Senior Secondary (Commerce)' },
    { name: 'Class XI - Senior Secondary (Arts)' },
    { name: 'Class XII - Senior Secondary (Science)' },
    { name: 'Class XII - Senior Secondary (Commerce)' },
    { name: 'Class XII - Senior Secondary (Arts)' }
  ];

  // For the review step
  reviewSections: any[] = [];

  // Maps the active step index to the corresponding form group name
  private stepFormGroupMap: string[] = [
    '', // Index 0 is Guidelines, no form group
    'basicInfo',
    'parentDetails',
    'address', // 'address' and 'emergencyContact' are validated together
    'documents',
    '', // Step 5 is review, no form group
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private admissionService: AdmissionService
  ) { }

  ngOnInit() {
    this.items = [
      { label: 'Guidelines' },
      { label: 'Basic Info' },
      { label: 'Parent Details' },
      { label: 'Address' },
      { label: 'Documents' },
      { label: 'Review' }
    ];

    // Initialize the reactive form with all its groups and validators
    this.admissionForm = this.fb.group({
      basicInfo: this.fb.group({
        first_name: ['', [Validators.required, Validators.minLength(2), Validators.pattern('^[a-zA-Z ]*$')]],
        last_name: ['', [Validators.required, Validators.minLength(2), Validators.pattern('^[a-zA-Z ]*$')]],
        date_of_birth: [null, Validators.required],
        gender: [null, Validators.required],
        applying_for_school: [null, Validators.required]
      }),
      parentDetails: this.fb.group({
        parent_name: ['', [Validators.required, Validators.minLength(3)]],
        guardian_name: [''],
        email: ['', [Validators.required, Validators.email]],
        contact_number: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]]
      }),
      address: this.fb.group({
        street: ['', [Validators.required, Validators.minLength(10)]],
        city: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
        state: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
        pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
      }),
      emergencyContact: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(3)]],
        number: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]]
      }),
      documents: this.fb.array([this.createDocumentGroup()]),
   
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

  // Generate a random application ID
  generateApplicationId(): string {
    const prefix = 'TC';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const year = new Date().getFullYear().toString().substr(-2);
    return `${prefix}${year}${randomNum}`;
  }

  // Get step class for custom stepper
  getStepClass(index: number): string {
    if (index < this.activeIndex) {
      return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg';
    } else if (index === this.activeIndex) {
      return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl ring-4 ring-blue-200';
    } else {
      return 'bg-gray-100 text-gray-400';
    }
  }

  // Navigate to specific step
  goToStep(index: number) {
    if (index < this.activeIndex) {
      this.activeIndex = index;
    }
  }

  // Get validation status for current step
  isCurrentStepValid(): boolean {
    if (this.activeIndex === 0 || this.activeIndex === 5) return true;
    
    const groupName = this.stepFormGroupMap[this.activeIndex];
    const group = this.admissionForm.get(groupName);
    
    if (groupName === 'address') {
      const emergencyGroup = this.admissionForm.get('emergencyContact');
      return group?.valid && emergencyGroup?.valid || false;
    }
    
    return group?.valid || false;
  }

  // Get step validation message
  getStepValidationMessage(): string {
    if (this.activeIndex === 0) return 'Ready to start your application';
    if (this.activeIndex === 5) return 'Please review and confirm before proceeding';
    
    if (this.isCurrentStepValid()) {
      return 'All required fields are completed correctly';
    } else {
      return 'Please complete all required fields before proceeding';
    }
  }

  // Get step validation icon
  getStepValidationIcon(): string {
    if (this.activeIndex === 0) return 'pi pi-info-circle';
    if (this.activeIndex === 5) return 'pi pi-eye';
    
    if (this.isCurrentStepValid()) {
      return 'pi pi-check-circle';
    } else {
      return 'pi pi-exclamation-circle';
    }
  }

  // Get next button label
  getNextButtonLabel(): string {
    switch (this.activeIndex) {
      case 0: return 'Start Application';
      case 4: return 'Review Application';
      case 5: return 'Proceed to Payment';
      default: return 'Save & Continue';
    }
  }

  // Get next button icon
  getNextButtonIcon(): string {
    switch (this.activeIndex) {
      case 0: return 'pi pi-arrow-right';
      case 4: return 'pi pi-eye';
      case 5: return 'pi pi-credit-card';
      default: return 'pi pi-arrow-right';
    }
  }

  addDocument() {
    this.documents.push(this.createDocumentGroup());
    this.messageService.add({
      severity: 'info',
      summary: 'Document Added',
      detail: 'New document field added. Please fill the details.'
    });
  }

  removeDocument(index: number) {
    if (this.documents.length > 1) {
      this.documents.removeAt(index);
      this.messageService.add({
        severity: 'warn',
        summary: 'Document Removed',
        detail: 'Document field has been removed.'
      });
    }
  }

  // Get count of uploaded documents
  getUploadedDocumentsCount(): number {
    return this.documents.controls.filter(doc => doc.get('file')?.value).length;
  }

  // Preview document (simulated)
  previewDocument(file: File) {
    this.messageService.add({
      severity: 'info',
      summary: 'Document Preview',
      detail: `Previewing: ${file.name}`
    });
  }

  // Trigger the hidden file input to open the file selection dialog
  triggerFileUpload(index: number) {
    const fileInput = document.getElementById(`file-upload-${index}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Handle file selection and patch the values into the form
  onFileSelect(event: any, index: number) {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'File Too Large',
          detail: 'File size must be less than 2MB'
        });
        return;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File Type',
          detail: 'Please upload PDF, JPG, or JPEG files only'
        });
        return;
      }

      this.documents.at(index).patchValue({
        fileName: file.name,
        file: file
      });
      
      // Mark as touched to satisfy validation
      this.documents.at(index).get('fileName')?.markAsTouched();
      this.documents.at(index).get('file')?.markAsTouched();

      this.messageService.add({
        severity: 'success',
        summary: 'File Uploaded',
        detail: `${file.name} uploaded successfully`
      });
    }
  }

  // Navigation to the next step with validation
  nextStep() {
    // Validate the current step's form group before proceeding
    if (this.activeIndex > 0 && this.activeIndex < 6) {
      const groupName = this.stepFormGroupMap[this.activeIndex];
      
      // Special handling for review step (step 5)
      if (this.activeIndex === 5) {
        this.reviewFormTouched = true;
        if (!this.reviewConfirmed) {
          this.showError('Please confirm your review before proceeding to payment.');
          return;
        }
        // If review is confirmed, proceed to payment
        if (this.activeIndex < this.items.length - 1) {
          this.activeIndex++;
        }
        return;
      }

      const currentGroup = this.admissionForm.get(groupName);

      if (currentGroup) {
        currentGroup.markAllAsTouched(); // Show errors if any fields are untouched

        // Special handling for step 3 (Address & Emergency Contact)
        if (groupName === 'address') {
          const emergencyGroup = this.admissionForm.get('emergencyContact');
          emergencyGroup?.markAllAsTouched();
          if (emergencyGroup?.invalid) {
            this.showError('Please fill all required fields in the emergency contact section.');
            return;
          }
        }
        
        if (currentGroup.invalid) {
          this.showError('Please fill all required fields correctly before proceeding.');
          return;
        }
      }
    }

    // If validation passes, move to the next step
    if (this.activeIndex < this.items.length - 1) {
      this.activeIndex++;
      // If we are now on the review step, prepare the data for display
      if (this.activeIndex === 5) {
        this.prepareReviewData();
      }
      
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Navigation to the previous step
  prevStep() {
    if (this.activeIndex === 6) { // If on payment step, clear review confirmation
      this.reviewConfirmed = false;
      this.reviewFormTouched = false;
    }
    if (this.activeIndex > 0) {
      this.activeIndex--;
      
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Select payment method
  selectPaymentMethod(method: string) {
    this.selectedPaymentMethod = method;
    this.messageService.add({
      severity: 'info',
      summary: 'Payment Method Selected',
      detail: `${method.charAt(0).toUpperCase() + method.slice(1)} selected`
    });
  }

  // Edit section from review
  editSection(sectionIndex: number, field: any) {
    // Navigate to the appropriate step
    switch (sectionIndex) {
      case 0: this.activeIndex = 1; break;
      case 1: this.activeIndex = 2; break;
      case 2: this.activeIndex = 3; break;
      case 3: this.activeIndex = 4; break;
    }
    
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode',
      detail: 'You can now edit the information'
    });
  }

  // Saves the current form state as a draft
  saveAsDraft() {
    const draftData = {
      ...this.admissionForm.value,
      lastSaved: new Date().toISOString(),
      progress: ((this.activeIndex + 1) / this.items.length * 100).toFixed(0)
    };

    this.admissionService.saveDraft(draftData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Draft Saved Successfully',
          detail: `Progress: ${draftData.progress}% • Application ID: ${this.generateApplicationId()}`
        });
      },
      error: (err) => this.showError('Could not save draft. Please try again.')
    });
  }

  // Final submission of the entire form
  submitApplication() {
    this.admissionForm.markAllAsTouched();
    
    // Validate all required confirmations
    if (!this.reviewConfirmed) {
      this.showError('Please confirm your review before submitting.');
      return;
    }
    
    if (this.admissionForm.get('finalDeclaration.declaration')?.invalid) {
      this.showError('You must agree to the declaration to submit.');
      return;
    }
    
    if (this.admissionForm.get('payment.application_fee_paid')?.invalid) {
      this.showError('Please confirm payment before submitting.');
      return;
    }

    if (this.admissionForm.valid && this.reviewConfirmed) {
      const applicationId = this.generateApplicationId();
      const formData = {
        ...this.admissionForm.value,
        applicationId: applicationId,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      this.admissionService.submitAdmission(formData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Application Submitted Successfully!',
            detail: `Application ID: ${applicationId}. Confirmation email has been sent.`,
            life: 10000
          });
          this.resetForm();
        },
        error: (err) => this.showError(err.error?.message || 'Submission failed. Please try again.')
      });
    } else {
      this.showError('Your form has errors. Please review all steps for validation errors.');
    }
  }

  // Reset form after submission
  resetForm() {
    this.admissionForm.reset();
    while (this.documents.length !== 1) {
      this.documents.removeAt(0);
    }
    this.reviewConfirmed = false;
    this.reviewFormTouched = false;
    this.activeIndex = 0;
    this.selectedPaymentMethod = 'card';
  }

  // Prepares data from the form to be displayed in the review section
  prepareReviewData() {
    const formValue = this.admissionForm.getRawValue();
    this.reviewSections = [
      {
        title: 'Basic Information',
        fields: [
          { label: 'Full Name', value: `${formValue.basicInfo.first_name} ${formValue.basicInfo.last_name}` },
          { label: 'Date of Birth', value: formValue.basicInfo.date_of_birth ? new Date(formValue.basicInfo.date_of_birth).toLocaleDateString('en-GB') : 'Not provided' },
          { label: 'Gender', value: formValue.basicInfo.gender?.name },
          { label: 'Program Applied', value: formValue.basicInfo.applying_for_school?.name }
        ]
      },
      {
        title: 'Parent/Guardian Details',
        fields: [
          { label: "Parent's Name", value: formValue.parentDetails.parent_name },
          { label: "Guardian's Name", value: formValue.parentDetails.guardian_name || 'Not provided' },
          { label: 'Email Address', value: formValue.parentDetails.email },
          { label: 'Contact Phone', value: formValue.parentDetails.contact_number }
        ]
      },
      {
        title: 'Address & Emergency Contact',
        fields: [
          { label: 'Street Address', value: formValue.address.street },
          { label: 'City', value: formValue.address.city },
          { label: 'State', value: formValue.address.state },
          { label: 'Pincode', value: formValue.address.pincode },
          { label: 'Emergency Contact Person', value: formValue.emergencyContact.name },
          { label: 'Emergency Contact Number', value: formValue.emergencyContact.number },
        ]
      },
      {
        title: 'Uploaded Documents',
        fields: formValue.documents.map((doc: any, index: number) => ({ 
          label: `Document ${index + 1}`, 
          value: doc.fileName || 'No file uploaded' 
        }))
      }
    ];
  }

  // Helper method for showing error toasts
  private showError(message: string) {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: message,
      life: 5000 
    });
  }

  // Form group getters for template
  get basicInfo() {
    return this.admissionForm.get('basicInfo') as FormGroup;
  }

  get parentDetails() {
    return this.admissionForm.get('parentDetails') as FormGroup;
  }

  get address() {
    return this.admissionForm.get('address') as FormGroup;
  }

  get emergencyContact() {
    return this.admissionForm.get('emergencyContact') as FormGroup;
  }

  get payment() {
    return this.admissionForm.get('payment') as FormGroup;
  }

  get finalDeclaration() {
    return this.admissionForm.get('finalDeclaration') as FormGroup;
  }
}