import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { Organisation, OrganisationService } from '../../../services/organisation.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-edit-organization',
  imports: [CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    RadioButtonModule],
  templateUrl: './edit-organization.component.html',
  styleUrl: './edit-organization.component.scss',
  providers: [MessageService]
})
export class EditOrganizationComponent {
  @Input() organization!: Organisation;

  // 2. "@Output()" is the "MEGAPHONE" for sending signals back to the parent.
  @Output() updateComplete = new EventEmitter<boolean>();
  @ViewChild('editOrgForm') editOrgForm!: NgForm;
  // A local copy of the data to avoid changing the original object directly
  editData: any = {};
  organizationTypes = [
    { label: 'School', value: 'School' },
    { label: 'College', value: 'College' },
    { label: 'University', value: 'University' }
  ];

  // ... (properties for dropdown options like organizationTypes, etc.)

  constructor(
    private organizationService: OrganisationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // When the component initializes, it makes a copy of the incoming data.
    // This is important so that changes aren't saved if the user clicks "Cancel".
    this.editData = {
      ...this.organization,
      establishDate: new Date(this.organization.establishDate!)
    };
  }

  onUpdateSubmit() {
    // // ... (logic to create the payload from this.editData)
    // First, check if the form is valid (e.g., required fields are filled).
    if (this.editOrgForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields.'
      });
      return; // Stop the submission if the form is not valid.
    }

    // --- Here is how you get the id and orgData ---

    // 1. Destructure the editData object to cleanly separate the id from the rest of the data.
    const { orgId, ...orgData } = this.editData;

    // 'id' now holds the organization's ID.
    // 'orgData' now holds all other properties, which matches the payload your backend expects.

    console.log("Updating Organization with ID:", orgId);
    console.log("Payload (orgData):", orgData);

    // 2. Call the update method in your service, passing the id and the payload.
    this.organizationService.updateOrganization(orgId, orgData).subscribe({
      next: (response) => {
        // The success message will now be displayed by the parent component's toast.
        // We will signal the parent that the update was successful.

        // --- KEY CHANGE: Emit the event on success ---
        // This tells the parent component to close the dialog and refresh the data.
        this.updateComplete.emit(true);
      },
      error: (err) => {
        // Show the error message directly in this component's toast.
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err.error?.message || 'Failed to update organization. Please try again.'
        });
        console.error('Update failed:', err);
      }
    });


  }

  cancel() {
    // When "Cancel" is clicked, just send a signal to the parent to close the dialog.
    this.updateComplete.emit(false);
  }
  visible: boolean = false;

  showDialog() {
    this.visible = true;
  }
}
