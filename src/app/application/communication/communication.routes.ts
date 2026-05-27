import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

export const COMMUNICATION_ROUTES: Routes = [
  {
    path: 'communication',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STAFF'])],
    children: [
      { path: '', redirectTo: 'notices', pathMatch: 'full' },
      {
        path: 'notices',
        loadComponent: () =>
          import('./components/notice-list/notice-list.component').then(m => m.NoticeListComponent),
        data: { breadcrumb: 'Notices' }
      }
    ]
  }
];
