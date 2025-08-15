import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
interface Application {
  application_id: string;
  applicant_name: string;
  applying_for_school: string;
  submission_date: string;
  status: 'SUBMITTED' | 'UNDER REVIEW' | 'ACCEPTED' | 'REJECTED' | 'DOCUMENTS PENDING';
  details?: any; // To hold full application data
}

@Component({
  selector: 'app-staff-application-review',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TabViewModule,
    TagModule,
    ToastModule,
    InputTextModule,
  ],
  providers: [MessageService],
  templateUrl: './staff-application-review.component.html',
  styleUrl: './staff-application-review.component.scss'
})
export class StaffApplicationReviewComponent {
  applications: Application[] = [];
  selectedApplication: Application | null = null;
  displayDialog: boolean = false;
  reviewForm: FormGroup;

  // Filter options
  programFilters = [{ name: 'Class X', code: 'C10' }, { name: 'Class XI - Science', code: 'C11S' }];
  statusFilters = [{ name: 'Submitted', code: 'SUBMITTED' }, { name: 'Accepted', code: 'ACCEPTED' }, { name: 'Rejected', code: 'REJECTED' }];

  statusOptions = [
    { label: 'Under Review', value: 'UNDER REVIEW' },
    { label: 'Documents Pending', value: 'DOCUMENTS PENDING' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' }
  ];

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.reviewForm = this.fb.group({
      status: [null],
      internal_comments: ['']
    });
  }

  ngOnInit() {
    // Mock data representing applications from the database
    this.applications = [
      {
        application_id: 'ADM-2025-001', applicant_name: 'John Doe', applying_for_school: 'Class XI - Science', submission_date: new Date().toISOString(), status: 'SUBMITTED',
        details: { applicant_name: 'John Doe', date_of_birth: new Date().toISOString(), gender: 'Male', applying_for_school: 'Class XI - Science', parent_name: 'Michael Doe', email: 'john.doe@email.com', contact_number: '9876543210' }
      },
      {
        application_id: 'ADM-2025-002', applicant_name: 'Jane Smith', applying_for_school: 'Class X', submission_date: new Date().toISOString(), status: 'ACCEPTED',
        details: { applicant_name: 'Jane Smith', date_of_birth: new Date().toISOString(), gender: 'Female', applying_for_school: 'Class X', parent_name: 'Robert Smith', email: 'jane.smith@email.com', contact_number: '9876543211' }
      },
    ];
  }

  reviewApplication(app: Application) {
    this.selectedApplication = app;
    this.reviewForm.patchValue({ status: { label: app.status, value: app.status } });
    this.displayDialog = true;
  }

  updateApplication() {
    if (this.selectedApplication && this.reviewForm.valid) {
      // Find the application in the main list and update its status
      const appIndex = this.applications.findIndex(a => a.application_id === this.selectedApplication!.application_id);
      if (appIndex > -1) {
        this.applications[appIndex].status = this.reviewForm.value.status.value;
      }

      console.log('Updating application:', this.selectedApplication.application_id, 'with data:', this.reviewForm.value);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Application updated successfully' });

      this.displayDialog = false;
      this.selectedApplication = null;
      this.reviewForm.reset();
    }
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'SUBMITTED': return 'info';
      case 'UNDER REVIEW': return 'warning';
      case 'DOCUMENTS PENDING': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'primary';
    }
  }
}
