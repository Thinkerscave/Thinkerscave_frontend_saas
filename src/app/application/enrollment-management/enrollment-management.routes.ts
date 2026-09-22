import { Routes } from '@angular/router';
import { ENROLLMENT_PAGES } from '../../core/config/page-route-meta';

export const ENROLLMENT_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'enrollments',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/enrollment-list/enrollment-list.component').then(m => m.EnrollmentListComponent),
        data: { ...ENROLLMENT_PAGES.list }
      }
    ]
  }
];
