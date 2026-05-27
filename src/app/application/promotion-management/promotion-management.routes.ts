import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

export const PROMOTION_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'promotions',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/promotion-batch-list/promotion-batch-list.component').then(m => m.PromotionBatchListComponent),
        data: { breadcrumb: 'Promotion Batches' }
      }
    ]
  },
  {
    path: 'transfers',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'STAFF'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/transfer-request-list/transfer-request-list.component').then(m => m.TransferRequestListComponent),
        data: { breadcrumb: 'Transfer Requests' }
      }
    ]
  }
];
