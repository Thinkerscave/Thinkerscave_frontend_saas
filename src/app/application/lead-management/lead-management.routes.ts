import { Routes } from '@angular/router';

export const LEAD_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'counsellor-dashboard',
    loadComponent: () =>
      import('./components/counsellor-dashboard/counsellor-dashboard.component').then(m => m.CounsellorDashboardComponent),
    data: { breadcrumb: 'Counsellor Dashboard' }
  },
  {
    path: 'manage-leads',
    loadComponent: () =>
      import('./components/lead-list/lead-list.component').then(m => m.LeadListComponent),
    data: { breadcrumb: 'Manage Leads' }
  },
  {
    path: 'lead-detail/:id',
    loadComponent: () =>
      import('./components/lead-detail/lead-detail.component').then(m => m.LeadDetailComponent),
    data: { breadcrumb: 'Lead Details' }
  },
  {
    path: 'add-lead',
    loadComponent: () =>
      import('./components/add-lead/add-lead.component').then(m => m.AddLeadComponent),
    data: { breadcrumb: 'Add New Lead' }
  },
  {
    path: 'follow-up-tracker',
    loadComponent: () =>
      import('./components/follow-up-tracker/follow-up-tracker.component').then(m => m.FollowUpTrackerComponent),
    data: { breadcrumb: 'Follow-up Tracker' }
  }
];
