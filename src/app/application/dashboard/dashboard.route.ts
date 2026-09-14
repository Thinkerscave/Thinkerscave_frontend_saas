import { Routes } from '@angular/router';
import { DASHBOARD_PAGE } from '../../core/config/page-route-meta';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    data: { ...DASHBOARD_PAGE },
    loadComponent: () =>
      import('./pages/dashboard-shell/dashboard-shell.component').then(m => m.DashboardShellComponent)
  }
];
