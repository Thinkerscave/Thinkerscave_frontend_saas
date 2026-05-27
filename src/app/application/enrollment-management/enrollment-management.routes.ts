import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

export const ENROLLMENT_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'enrollments',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'STAFF'])],
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
