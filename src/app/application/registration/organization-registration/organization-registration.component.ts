import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-organization-registration',
  imports: [CommonModule, TabsModule, CalendarModule, DropdownModule, FormsModule, CardModule, RadioButtonModule,InputTextModule,ButtonModule,
    TableModule,
  ],
  templateUrl: './organization-registration.component.html',
  styleUrl: './organization-registration.component.scss'
})
export class OrganizationRegistrationComponent {
  isAGroup: boolean = true;

  parentOrganizations = [
    { name: 'Parent Org A', code: 'A' },
    { name: 'Parent Org B', code: 'B' },
    { name: 'Parent Org C', code: 'C' },
  ];

  organizationTypes = [
    { label: 'School', value: 'school' },
    { label: 'College', value: 'college' },
    { label: 'University', value: 'university' }
  ];

  subscriptionTypes = [
    { label: 'Free', value: 'free' },
    { label: 'Paid', value: 'paid' },
    { label: 'Premium', value: 'premium' }
  ];
  selectedParentOrg: any;

  orgName = '';
  establishDate: Date | undefined;
  selectedSubscription: string = '';
  selectedOrgType: string='';

  ownerName = '';
  ownerEmail = '';
  ownerMobile = '';
  brandName='';
  orgUrl='';
  city='';
  state='';

  

editOrganization(org: any) {
  // logic to populate form for editing
  console.log('Edit:', org);
}

deleteOrganization(org: any) {
  // logic to delete
  console.log('Delete:', org);
}
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

}
