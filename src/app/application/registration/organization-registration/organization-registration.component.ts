import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
// --- Import all your PrimeNG Modules ---
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
// --- Import your Edit Component and Service ---
import { EditOrganizationComponent } from '../edit-organization/edit-organization.component';
import { Organisation, OrganisationService, OrgRequest } from '../../../services/organisation.service';

@Component({
  selector: 'app-organization-registration',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TabsModule, CalendarModule, DropdownModule, CardModule, RadioButtonModule,
    InputTextModule, ButtonModule, TableModule, ToastModule, TooltipModule, DialogModule, InputSwitchModule,
    EditOrganizationComponent
  ],
  templateUrl: './organization-registration.component.html',
  styleUrls: ['./organization-registration.component.scss'],
  providers: [MessageService]
})
export class OrganizationRegistrationComponent implements OnInit {
  // --- Form State for the "Add" Form ---
  isGroup: boolean = false;
  selectedParentOrg: { id: number, name: string } | null = null;
  orgName: string = '';
  brandName: string = '';
  orgUrl: string = '';
  selectedOrgType: string | null = null;
  city: string = '';
  state: string = '';
  establishDate: Date | null = null;
  selectedSubscription: string | null = null;
  ownerName: string = '';
  ownerEmail: string = '';
  ownerMobile: string = '';
  ownerGender: string | null = null;

  // --- State for Controlling the Edit Dialog ---
  displayEditDialog: boolean = false;
  selectedOrgForEdit: Organisation | null = null;

  // --- Data for Dropdowns and Table ---
  organizations: Organisation[] = [];
  parentOrganizations: any[] = [];
  organizationTypes = [
    { label: 'School', value: 'School' },
    { label: 'College', value: 'College' },
    { label: 'University', value: 'University' }
  ];
  subscriptionTypes = ['Free', 'Paid', 'Premium'];
  genderOptions = ['Male', 'Female', 'Other'];
isEditing: any;

  constructor(
    private messageService: MessageService,
    private organizationService: OrganisationService
  ) {}

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.organizationService.getOrganizations().subscribe(data => {
      this.organizations = data;
      this.updateParentOrgList();
    });
  }

  updateParentOrgList() {
    this.parentOrganizations = this.organizations
      .filter(org => org.isGroup)
      .map(org => ({ name: org.orgName, id: org.orgId }));
  }

  onSubmit() {
    if (!this.orgName || !this.ownerEmail) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Organization Name and Owner Email are required.' });
      return;
    }
    
    const payload: OrgRequest = {
      isAGroup: this.isGroup,
      parentOrgId: !this.isGroup ? this.selectedParentOrg?.id ?? null : null,
      orgName: this.orgName,
      brandName: this.brandName,
      orgUrl: this.orgUrl,
      orgType: this.selectedOrgType!,
      city: this.city,
      state: this.state,
      establishDate: this.formatDateForBackend(this.establishDate),
      subscriptionType: this.selectedSubscription!,
      ownerName: this.ownerName,
      ownerEmail: this.ownerEmail,
      ownerMobile: this.ownerMobile,
    };

    // For simplicity, we assume this is always a create call in the "Add" tab.
    this.organizationService.createOrganization(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Organization created successfully!' });
        this.resetForm();
        this.loadOrganizations();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'API Error', detail: err.error?.message || 'An unexpected error occurred.' });
      }
    });
  }

  /**
   * Sets the data for the selected organization and opens the edit dialog.
   */
  editOrganization(orgToEdit: Organisation) {
    
    this.selectedOrgForEdit = orgToEdit;
    this.displayEditDialog = true;
  }
  
  /**
   * Listens for the 'updateComplete' event from the child edit component.
   */
  handleUpdateComplete(wasSuccessful: boolean) {
    this.displayEditDialog = false; // Always close the dialog
    if (wasSuccessful) {
      this.loadOrganizations(); // If the update was successful, refresh the data
    }
  }

  /**
   * Toggles the active status of an organization.
   */
  toggleOrganizationStatus(orgToToggle: Organisation) {
    const action = orgToToggle.isActive ? 'disable' : 'enable';
    if (confirm(`Are you sure you want to ${action} ${orgToToggle.orgName}?`)) {
      // In a real app, you would call a dedicated service method here
      // For now, we simulate the change locally and show a message
      orgToToggle.isActive = !orgToToggle.isActive;
      this.messageService.add({ severity: 'info', summary: 'Status Updated', detail: `Organization has been ${action}d.` });
    }
  }

  deleteOrganization(orgToDelete: Organisation) {
    if (confirm(`Are you sure you want to delete ${orgToDelete.orgName}?`)) {
      this.organizationService.deleteOrganization(orgToDelete.orgId).subscribe({
        next: () => {
          this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `${orgToDelete.orgName} has been removed.` });
          this.loadOrganizations();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete organization.' });
        }
      });
    }
  }
  
  resetForm() {
    this.isGroup = false;
    this.selectedParentOrg = null;
    this.orgName = '';
    this.brandName = '';
    this.orgUrl = '';
    this.selectedOrgType = null;
    this.city = '';
    this.state = '';
    this.establishDate = null;
    this.selectedSubscription = null;
    this.ownerName = '';
    this.ownerEmail = '';
    this.ownerMobile = '';
    this.ownerGender = null;
  }

  private formatDateForBackend(date: Date | null): string | null {
    if (!date) return null;
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

