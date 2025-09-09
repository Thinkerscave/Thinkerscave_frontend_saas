import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { Organisation, OrganisationService, OrgRequest } from '../../../services/organisation.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-organization-registration',
  imports: [CommonModule, TabsModule, CalendarModule, DropdownModule, FormsModule, CardModule, RadioButtonModule,InputTextModule,ButtonModule,
    TableModule,ToastModule
  ],
  templateUrl: './organization-registration.component.html',
  styleUrl: './organization-registration.component.scss',
  providers:[MessageService]
})
export class OrganizationRegistrationComponent {
// --- Form State ---
  isEditing = false;
  editingOrgId: number | null = null;

  // --- Form Fields Bound with [(ngModel)] ---
  isGroup: boolean = false;
  selectedParentOrg: { id: number, name: string } | null = null;
  orgName: string = '';
  brandName: string = '';
  orgUrl: string = '';
  selectedOrgType: string | null = null;
  city: string = '';
  state: string = '';
  establishDate: string | null | Date= null;
  selectedSubscription: string | null = null;
  ownerName: string = '';
  ownerEmail: string = '';
  ownerMobile: string = '';
  // ownerGender: string | null = null;

  // --- Static Data for Dropdowns and Table ---
  parentOrganizations: any[] = [];
  organizationTypes = [
    { label: 'School', value: 'School' },
    { label: 'College', value: 'College' },
    { label: 'University', value: 'University' }
  ];
  subscriptionTypes = ['Free', 'Paid', 'Premium'];
  genderOptions = ['Male', 'Female', 'Other'];

  // Data for the view table
  organizations: Organisation[] = [
    {
      orgId: 1, orgName: 'ABC School', brandName: 'ABC Edu Group', orgUrl: 'www.abcschool.edu', orgType: 'School', city: 'Bhubaneswar', state: 'Odisha', establishDate: new Date(2010, 5, 15), ownerName: 'Mr. Mishra', ownerEmail: 'mishra@abc.edu', ownerMobile: '9876543210', isGroup: true, parentOrgId: null, subscriptionType: 'Premium',
      orgCode: '',
      type: '',
      isActive: false
    },
    {
      orgId: 2, orgName: 'XYZ College', brandName: 'XYZ Group', orgUrl: 'www.xyzcollege.edu', orgType: 'College', city: 'Cuttack', state: 'Odisha', establishDate: new Date(2012, 2, 20), ownerName: 'Ms. Das', ownerEmail: 'das@xyz.edu', ownerMobile: '9876500000', isGroup: false, parentOrgId: 1, subscriptionType: 'Paid',
      orgCode: '',
      type: '',
      isActive: false
    }
  ];

  constructor(
    private messageService: MessageService,
    private organizationService: OrganisationService // Inject the service
  ) {}

  ngOnInit() {
    this.updateParentOrgList();
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
    
    // Create a payload object that matches the OrgRequest interface for the backend.
    const payload: OrgRequest = {
      isAGroup: this.isGroup,
      parentOrgId: !this.isGroup ? this.selectedParentOrg?.id ?? null : null,
      orgName: this.orgName,
      brandName: this.brandName,
      orgUrl: this.orgUrl,
      orgType: this.selectedOrgType!,
      city: this.city,
      state: this.state,
      // FIX: Convert the Date object to a 'YYYY-MM-DD' string for the backend.
      establishDate: null,
      subscriptionType: this.selectedSubscription!,
      ownerName: this.ownerName,
      ownerEmail: this.ownerEmail,
      ownerMobile: this.ownerMobile,
    };

    // Determine whether to call the create or update service method
    const apiCall = this.isEditing
      ? this.organizationService.updateOrganization(this.editingOrgId!, payload)
      : this.organizationService.createOrganization(payload);

    apiCall.subscribe({
      next: () => {
        const message = this.isEditing ? 'Organization updated successfully!' : 'Organization created successfully!';
        this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
        this.resetForm();
        this.loadOrganizations(); // You would replace this with a real API call
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'API Error', detail: err.error?.message || 'An unexpected error occurred.' });
      }
    });
  }
  // This method would fetch data from the backend in a real application
  loadOrganizations() {
    // For now, it just re-calculates the parent list from static data
    this.updateParentOrgList();
  }

  editOrganization(org: Organisation) {
    // this.isEditing = true;
    // this.editingOrgId = org.orgId;

    // this.isGroup = org.isGroup;
    // this.selectedParentOrg = this.parentOrganizations.find(p => p.id === org.parentOrgId) || null;
    // this.orgName = org.orgName;
    // this.brandName = org.brandName;
    // this.orgUrl = org.orgUrl;
    // this.selectedOrgType = org.se;
    // this.city = org.city;
    // this.state = org.state;
    // this.establishDate = new Date(org.establishDate);
    // this.selectedSubscription = org.subscriptionTypes;
    // this.ownerName = org.ownerName;
    // this.ownerEmail = org.ownerEmail;
    // this.ownerMobile = org.ownerMobile;
    
    // this.messageService.add({ severity: 'info', summary: 'Editing', detail: `Now editing ${org.orgName}` });
  }

  deleteOrganization(orgToDelete: Organisation) {
    // In a real app, this would call this.organizationService.deleteOrganization(...)
    this.organizations = this.organizations.filter(org => org.orgId !== orgToDelete.orgId);
    this.updateParentOrgList();
    this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `${orgToDelete.orgName} has been removed.` });
  }
  
  resetForm() {
    this.isEditing = false;
    this.editingOrgId = null;
    
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
    // this.ownerGender = null;
  }
/*
organizations = [
  {
    orgName: 'ABC School',
    brandName: 'ABC Edu Group',
    orgUrl: 'www.abcschool.edu',
    orgType: 'School',
    city: 'Bhubaneswar',
    state: 'Odisha',
    establishDate: new Date(2010, 5, 15),
    ownerName: 'Mr. Mishra',
    ownerEmail: 'mishra@abc.edu',
    ownerMobile: '9876543210'
  },
  {
    orgName: 'XYZ College',
    brandName: 'XYZ Group',
    orgUrl: 'www.xyzcollege.edu',
    orgType: 'College',
    city: 'Cuttack',
    state: 'Odisha',
    establishDate: new Date(2012, 2, 20),
    ownerName: 'Ms. Das',
    ownerEmail: 'das@xyz.edu',
    ownerMobile: '9876500000'
  },
  {
    orgName: 'Sunrise University',
    brandName: 'Sunrise Group',
    orgUrl: 'www.sunriseuniv.edu',
    orgType: 'University',
    city: 'Delhi',
    state: 'Delhi',
    establishDate: new Date(2005, 8, 10),
    ownerName: 'Dr. Sharma',
    ownerEmail: 'sharma@sunrise.edu',
    ownerMobile: '9876501111'
  },
  {
    orgName: 'Elite High School',
    brandName: 'Elite Education',
    orgUrl: 'www.elitehigh.edu',
    orgType: 'School',
    city: 'Pune',
    state: 'Maharashtra',
    establishDate: new Date(2011, 10, 5),
    ownerName: 'Mr. Kulkarni',
    ownerEmail: 'kulkarni@elite.edu',
    ownerMobile: '9876502222'
  },
  {
    orgName: 'Nova College',
    brandName: 'Nova Group',
    orgUrl: 'www.novacollege.edu',
    orgType: 'College',
    city: 'Chennai',
    state: 'Tamil Nadu',
    establishDate: new Date(2013, 6, 18),
    ownerName: 'Mrs. Iyer',
    ownerEmail: 'iyer@nova.edu',
    ownerMobile: '9876503333'
  },
  {
    orgName: 'Future Tech University',
    brandName: 'FutureTech Group',
    orgUrl: 'www.futuretech.edu',
    orgType: 'University',
    city: 'Hyderabad',
    state: 'Telangana',
    establishDate: new Date(2008, 3, 25),
    ownerName: 'Dr. Rao',
    ownerEmail: 'rao@futuretech.edu',
    ownerMobile: '9876504444'
  },
  {
    orgName: 'Green Valley School',
    brandName: 'Green Valley Group',
    orgUrl: 'www.greenvalleyschool.edu',
    orgType: 'School',
    city: 'Kolkata',
    state: 'West Bengal',
    establishDate: new Date(2015, 1, 12),
    ownerName: 'Mrs. Banerjee',
    ownerEmail: 'banerjee@greenvalley.edu',
    ownerMobile: '9876505555'
  },
  {
    orgName: 'Pinnacle College',
    brandName: 'Pinnacle Group',
    orgUrl: 'www.pinnaclecollege.edu',
    orgType: 'College',
    city: 'Ahmedabad',
    state: 'Gujarat',
    establishDate: new Date(2009, 4, 8),
    ownerName: 'Mr. Patel',
    ownerEmail: 'patel@pinnacle.edu',
    ownerMobile: '9876506666'
  },
  {
    orgName: 'Bright Future University',
    brandName: 'Bright Future Group',
    orgUrl: 'www.brightfuture.edu',
    orgType: 'University',
    city: 'Bangalore',
    state: 'Karnataka',
    establishDate: new Date(2016, 7, 3),
    ownerName: 'Dr. Nair',
    ownerEmail: 'nair@brightfuture.edu',
    ownerMobile: '9876507777'
  },
  {
    orgName: 'Harmony School',
    brandName: 'Harmony Edu Group',
    orgUrl: 'www.harmonyschool.edu',
    orgType: 'School',
    city: 'Jaipur',
    state: 'Rajasthan',
    establishDate: new Date(2014, 9, 22),
    ownerName: 'Mr. Singh',
    ownerEmail: 'singh@harmony.edu',
    ownerMobile: '9876508888'
  }
];
*/

}
