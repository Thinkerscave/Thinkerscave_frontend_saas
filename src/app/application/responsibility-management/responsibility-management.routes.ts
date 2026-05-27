import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

export const RESPONSIBILITY_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'responsibilities',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/responsibility-list/responsibility-list.component').then(m => m.ResponsibilityListComponent),
        data: { breadcrumb: 'Responsibilities' }
      }
    ]
  }
];
