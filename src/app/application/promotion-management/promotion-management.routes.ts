import { Routes } from '@angular/router';
import { PROMOTION_PAGES } from '../../core/config/page-route-meta';

export const PROMOTION_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'promotions',
    data: { breadcrumb: 'Promotions', breadcrumbLink: ['/app/promotions'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/promotion-batch-list/promotion-batch-list.component').then(m => m.PromotionBatchListComponent),
        data: { ...PROMOTION_PAGES.batches }
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./components/promotion-batch-create/promotion-batch-create.component').then(m => m.PromotionBatchCreateComponent),
        data: { ...PROMOTION_PAGES.batchNew }
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
        data: { ...PROMOTION_PAGES.transfers }
      }
    ]
  }
];
