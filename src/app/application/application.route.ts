import { Routes } from '@angular/router';

export const APPLICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'manage-menu',
    loadComponent: () =>
      import('./menu-management/menu/menu.component').then(m => m.MenuComponent),
  },
  {
    path: 'manage-sub-menu',
    loadComponent: () =>
      import('./menu-management/sub-menu/sub-menu.component').then(m => m.SubMenuComponent),
  },
  {
    path: 'menu-sequence',
    loadComponent: () =>
      import('./menu-management/menu-sequence/menu-sequence.component').then(m => m.MenuSequenceComponent),
  },
  {
    path: 'organization-registration',
    loadComponent: () =>
      import('./registration/organization-registration/organization-registration.component').then(m => m.OrganizationRegistrationComponent),
  },
  {
    // CORRECTED: The path is changed from 'student-registration' to 'manage-student'
    // to correctly reflect that this component is in the 'student-management' folder.
    path: 'managestudent',
    loadComponent: () => import('./student-management/managestudent/managestudent.component').then(m => m.ManagestudentComponent)
  },
];
