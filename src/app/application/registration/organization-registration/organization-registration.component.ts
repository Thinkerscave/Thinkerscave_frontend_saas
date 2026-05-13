import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
// --- Import your Edit Component and Service ---
import { OrganizationRegistrationComponent as EditOrganizationComponentLegacy } from './organization-registration.component'; // Keep just in case, but really importing EditOrganizationComponent
import { EditOrganizationComponent } from '../edit-organization/edit-organization.component';
import { Organisation, OrganisationService, OwnerDTO, ParentOrg, TenantOnboardingRequest, TenantStatusResponse } from '../../../services/organisation.service';
import { StandardListViewComponent } from '../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../shared/components/standard-list-view/list-view-models';
import { StandardFormComponent } from '../../../shared/components/standard-form/standard-form.component';
import { FormConfig } from '../../../shared/components/standard-form/form-models';

@Component({
  selector: 'app-organization-registration',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TabsModule, CalendarModule, DropdownModule, CardModule, RadioButtonModule,
    InputTextModule, ButtonModule, TableModule, ToastModule, TooltipModule, DialogModule, InputSwitchModule,
    TagModule, BadgeModule,
    EditOrganizationComponent, StandardListViewComponent, StandardFormComponent
  ],
  templateUrl: './organization-registration.component.html',
  styleUrls: ['./organization-registration.component.scss'],
  providers: [MessageService]
})
export class OrganizationRegistrationComponent implements OnInit {
  // --- Form State for the "Add" Form ---
  isGroup: boolean = false;
  selectedParentOrg: number | null = null;
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
  adminPassword: string = '';
  tenantId: string = '';
  ownerGender: string | null = null;
  activeTabIndex: string = '0';

  // --- State for Controlling the Edit Dialog ---
  displayEditDialog: boolean = false;
  selectedOrgForEdit: Organisation | null = null;
  dropdowmParentOrgs: ParentOrg[] = [];

  // --- Status Dialog State ---
  displayStatusDialog = false;
  tenantStatus: TenantStatusResponse | null = null;
  loadingStatus = false;

  // --- Owner Update Dialog State ---
  displayOwnerDialog = false;
  ownerEditData: OwnerDTO = {
    ownerCode: '',
    ownerName: '',
    mailId: ''
  };

  // --- Data for Dropdowns and Table ---
  organizations: Organisation[] = [];
  parentOrganizations: any[] = [];
  organizationTypes = [
    { label: 'School', value: 'SCHOOL' },
    { label: 'College', value: 'COLLEGE' },
    { label: 'University', value: 'UNIVERSITY' }
  ];
  subscriptionTypes = ['Free', 'Paid', 'Premium'];
  genderOptions = ['Male', 'Female', 'Other'];
  isEditing: any;

  // --- Form Model for Standard Form ---
  addFormModel: any = {
    isGroup: false,
    selectedParentOrg: null,
    orgName: '',
    brandName: '',
    orgUrl: '',
    orgType: null,
    city: '',
    state: '',
    establishDate: null,
    subscription: null,
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    adminPassword: '',
    tenantId: ''
  };

  get formConfig(): FormConfig {
    return {
      sections: [
        {
          title: 'Organization Information',
          description: 'Basic details about the organization and its type.',
          fields: [
            {
              field: 'isGroup',
              label: 'Is a Group?',
              type: 'radio',
              options: [{ label: 'Yes', value: true }, { label: 'No', value: false }],
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'selectedParentOrg',
              label: 'Parent Organization',
              type: 'dropdown',
              options: this.dropdowmParentOrgs,
              optionLabel: 'name',
              optionValue: 'id',
              placeholder: 'Select Parent Organization',
              visibleFn: (m) => !m.isGroup,
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'orgName',
              label: 'Organization Name',
              type: 'text',
              required: true,
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'tenantId',
              label: 'Tenant ID (Unique Code)',
              type: 'text',
              placeholder: 'e.g. blossom_academy',
              helperText: 'Lowercase, numbers, underscores only.',
              required: true,
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'adminPassword',
              label: 'Admin Password',
              type: 'password',
              required: true,
              helperText: 'Min 8 characters.',
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'brandName',
              label: 'Brand Name',
              type: 'text',
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'orgUrl',
              label: 'Organization URL',
              type: 'text',
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'orgType',
              label: 'Organization Type',
              type: 'dropdown',
              options: this.organizationTypes,
              optionLabel: 'label',
              optionValue: 'value',
              required: true,
              colSpan: 'col-12 md:col-4'
            },
            {
              field: 'subscription',
              label: 'Subscription Type',
              type: 'dropdown',
              options: this.subscriptionTypes.map(s => ({ label: s, value: s })),
              colSpan: 'col-12 md:col-4'
            }
          ]
        },
        {
          title: 'Location & Timeline',
          fields: [
            { field: 'city', label: 'City', type: 'text', colSpan: 'col-12 md:col-4' },
            { field: 'state', label: 'State', type: 'text', colSpan: 'col-12 md:col-4' },
            { field: 'establishDate', label: 'Establishment Date', type: 'calendar', colSpan: 'col-12 md:col-4' }
          ]
        },
        {
          title: 'Owner Details',
          fields: [
            { field: 'ownerName', label: 'Owner Name', type: 'text', colSpan: 'col-12 md:col-4' },
            { field: 'ownerEmail', label: 'Owner Email', type: 'email', required: true, colSpan: 'col-12 md:col-4' },
            { field: 'ownerMobile', label: 'Owner Mobile', type: 'text', colSpan: 'col-12 md:col-4' }
          ]
        }
      ],
      submitLabel: 'Create Organization',
      resetLabel: 'Clear Form'
    };
  }

  constructor(
    private messageService: MessageService,
    private organizationService: OrganisationService
  ) { }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Registered Organizations',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search organizations...',
      columns: [
        { field: 'orgName', header: 'Organization Name', type: 'text', sortable: true },
        { field: 'brandName', header: 'Brand Name', type: 'text', sortable: true },
        { field: 'orgType', header: 'Type', type: 'text', sortable: true },
        { field: 'city', header: 'City', type: 'text', sortable: true },
        { field: 'ownerName', header: 'Owner Name', type: 'text', sortable: true },
        { field: 'ownerEmail', header: 'Owner Email', type: 'text', sortable: true },
        {
          field: 'isActive',
          header: 'Status',
          type: 'badge',
          sortable: true,
          valueGetter: (org) => org.isActive ? 'Active' : 'Inactive'
        }
      ],
      rowActions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          isPrimary: true,
          actionFn: (org) => this.editOrganization(org)
        },
        {
          label: 'Health Profile',
          icon: 'pi pi-heart',
          color: 'info',
          visibleFn: (org) => org.isActive,
          actionFn: (org) => this.viewTenantStatus(org)
        },
        {
          label: 'Update Owner',
          icon: 'pi pi-user-edit',
          color: 'warning',
          actionFn: (org) => this.openOwnerEditDialog(org)
        },
        {
          label: 'Suspend Sys Access',
          icon: 'pi pi-pause',
          visibleFn: (org) => org.isActive,
          actionFn: (org) => this.toggleOrganizationStatus(org)
        },
        {
          label: 'Unsuspend Access',
          icon: 'pi pi-play',
          visibleFn: (org) => !org.isActive,
          actionFn: (org) => this.toggleOrganizationStatus(org)
        },
        {
          label: 'Deactivate DB Tenant',
          icon: 'pi pi-power-off',
          color: 'danger',
          visibleFn: (org) => org.isActive,
          actionFn: (org) => this.deactivateTenant(org)
        },
        {
          label: 'Activate DB Tenant',
          icon: 'pi pi-bolt',
          color: 'success',
          visibleFn: (org) => !org.isActive,
          actionFn: (org) => this.activateTenant(org)
        }
      ]
    };
  }

  ngOnInit() {
    this.loadOrganizations();
    this.loadParentOrganizations();
  }
  // --- NEW: This method efficiently loads data for the dropdown ---
  loadParentOrganizations() {
    this.organizationService.getParentOrganizations().subscribe(data => {
      this.dropdowmParentOrgs = data;
    });
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
    const data = this.addFormModel;
    // Comprehensive validation
    if (!data.orgName || !data.ownerEmail) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Organization Name and Owner Email are required.' });
      return;
    }

    if (!data.adminPassword || data.adminPassword.length < 8) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Admin Password must be at least 8 characters.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.ownerEmail)) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please enter a valid email address.' });
      return;
    }

    if (data.ownerMobile && !/^\d{10}$/.test(data.ownerMobile)) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Mobile number must be exactly 10 digits.' });
      return;
    }

    const payload: TenantOnboardingRequest = {
      tenantName: (data.tenantId || data.orgName).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      displayName: data.orgName,
      adminEmail: data.ownerEmail,
      adminPassword: data.adminPassword,
      adminFirstName: data.ownerName.split(' ')[0] || 'Admin',
      adminLastName: data.ownerName.split(' ')[1] || 'User',
      adminMobile: data.ownerMobile,
      organizationType: data.orgType || 'SCHOOL',
      subscriptionType: data.subscription || 'Free',
      enableSubdomain: true,
      subdomainPrefix: (data.tenantId || data.orgName).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      maxUsers: 100,
      storageLimitMb: 10240,
      customSettings: {},
      city: data.city,
      state: data.state,
      establishDate: this.formatDateForBackend(data.establishDate)
    };


    // For simplicity, we assume this is always a create call in the "Add" tab.
    this.organizationService.createOrganization(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Organization created successfully!' });
        this.resetForm();
        this.loadOrganizations();
        this.loadParentOrganizations();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'API Error', detail: err.error?.message || 'An unexpected error occurred.' });
      }
    });
  }
  /**
  * This method is called by the (onChange) event from the p-dropdown.
  * It manually captures the selected ID and stores it.
  * @param event The change event object from PrimeNG, which contains the selected value.
  */
  onParentOrgChange(event: any): void {
    // The selected ID is in the 'value' property of the event object
    this.selectedParentOrg = event.value;
    console.log('Parent Organization ID selected:', this.selectedParentOrg);
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
    const action = orgToToggle.isActive ? 'enable' : 'disable';
    const originalStatus = !orgToToggle.isActive; // The status *before* the user clicked the toggle

    this.organizationService.deleteOrganization(orgToToggle.orgCode).subscribe({
      next: (updatedOrg) => {
        // Success: The backend has confirmed the change.
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `${orgToToggle.orgName} has been ${action}d.`
        });
        // Refresh the parent org dropdown in case a group's status changed.
        this.loadParentOrganizations();
      },
      error: (err) => {
        // Error: The API call failed. Revert the toggle switch on the UI to its original state.
        orgToToggle.isActive = originalStatus;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: `Could not change status for ${orgToToggle.orgName}.`
        });
      }
    });
  }

  /**
   * Evaluates the tenant database health status by talking to TenantOnboardingController.
   */
  viewTenantStatus(org: Organisation) {
    if (!org.tenantId) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'No tenant schema ID found for this organisation.' });
      return;
    }
    this.displayStatusDialog = true;
    this.loadingStatus = true;
    this.tenantStatus = null;

    this.organizationService.getTenantStatus(org.tenantId).subscribe({
      next: (status) => {
        this.tenantStatus = status;
        this.loadingStatus = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Status Error', detail: 'Could not fetch tenant health status.' });
        this.loadingStatus = false;
        this.displayStatusDialog = false;
      }
    });
  }

  /**
   * Activates a tenant via TenantOnboardingService.
   */
  activateTenant(org: Organisation) {
    const id = org.tenantId || org.orgCode; // fallback if tenantId not populated
    this.organizationService.activateTenant(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Activated', detail: `Tenant DB schema for ${org.orgName} activated.` });
        this.loadOrganizations();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Could not activate tenant DB.' });
      }
    });
  }

  /**
   * Deactivates a tenant via TenantOnboardingService.
   */
  deactivateTenant(org: Organisation) {
    const id = org.tenantId || org.orgCode;
    this.organizationService.deactivateTenant(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deactivated', detail: `Tenant DB schema for ${org.orgName} deactivated.` });
        this.loadOrganizations();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Could not deactivate tenant DB.' });
      }
    });
  }

  /**
   * Opens the Owner Edit Dialog and prepopulates it.
   */
  openOwnerEditDialog(org: Organisation) {
    if (!org.ownerCode) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'No owner code found for this organisation.' });
      return;
    }
    this.ownerEditData = {
      ownerCode: org.ownerCode,
      ownerName: org.ownerName,
      mailId: org.ownerEmail,
      phoneNumber: org.ownerMobile ? parseInt(org.ownerMobile) : undefined,
      city: org.city,
      state: org.state
    };
    this.displayOwnerDialog = true;
  }

  /**
   * Submits the owner details update.
   */
  submitOwnerUpdate() {
    this.organizationService.updateOwnerDetails(this.ownerEditData).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Owner details updated successfully.' });
        this.displayOwnerDialog = false;
        this.loadOrganizations();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not update owner details.' });
      }
    });
  }

  resetForm() {
    this.addFormModel = {
      isGroup: false,
      selectedParentOrg: null,
      orgName: '',
      brandName: '',
      orgUrl: '',
      orgType: null,
      city: '',
      state: '',
      establishDate: null,
      subscription: null,
      ownerName: '',
      ownerEmail: '',
      ownerMobile: '',
      adminPassword: '',
      tenantId: ''
    };
  }

  private formatDateForBackend(date: Date | null): string | null {
    if (!date) return null;
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // This is the event handler for our new event
  handleUpdateSuccess(): void {
    this.displayEditDialog = false; // Close the dialog
    this.loadOrganizations(); // Re-fetch the data to get the latest changes
  }

}
