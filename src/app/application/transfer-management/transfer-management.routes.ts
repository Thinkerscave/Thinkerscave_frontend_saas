import { Routes } from '@angular/router';
import { TRANSFER_PAGES } from '../../core/config/page-route-meta';

export const TRANSFER_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'transfers',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/transfer-request-list/transfer-request-list.component').then(m => m.TransferRequestListComponent),
        data: { ...TRANSFER_PAGES.transfers }
      }
    ]
  }
];
