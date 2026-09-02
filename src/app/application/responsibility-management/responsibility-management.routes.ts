import { Routes } from '@angular/router';

export const RESPONSIBILITY_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'responsibilities',
    pathMatch: 'full',
    redirectTo: 'access-management/responsibilities'
  }
];
