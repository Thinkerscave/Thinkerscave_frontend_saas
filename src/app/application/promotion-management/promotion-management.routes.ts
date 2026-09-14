import { Routes } from '@angular/router';

export const PROMOTION_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'promotions',
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
