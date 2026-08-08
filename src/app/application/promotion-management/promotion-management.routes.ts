import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

const PROMOTION_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'ORGANIZATION_ADMIN',
  'ORGANIZATION_OWNER',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'STAFF'
];

export const PROMOTION_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'promotions',
    canActivate: [roleGuard(PROMOTION_ROLES)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/promotion-batch-list/promotion-batch-list.component').then(m => m.PromotionBatchListComponent),
        data: { breadcrumb: 'Promotion Batches' }
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/promotion-batch-create/promotion-batch-create.component').then(m => m.PromotionBatchCreateComponent),
        data: { breadcrumb: 'New Promotion Batch' }
      }
    ]
  },
  {
    path: 'transfers',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'STAFF'])],
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
