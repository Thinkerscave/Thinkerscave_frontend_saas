import { Routes } from '@angular/router';

export const ENROLLMENT_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'enrollments',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/enrollment-list/enrollment-list.component').then(m => m.EnrollmentListComponent),
        data: { breadcrumb: 'Enrollments' }
      }
    ]
  }
];
