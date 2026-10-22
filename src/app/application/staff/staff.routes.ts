import { Routes } from '@angular/router';
import { STAFF_PAGES } from '../../core/config/page-route-meta';
import { staffWriteGuard } from './shared/guards/staff-write.guard';

/** Staff routes, mounted under /app/staff. */
export const STAFF_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'directory' },
  {
    path: 'directory',
    data: { workspacePage: 'directory', ...STAFF_PAGES.directory },
    loadComponent: () => import('./pages/directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
  },
  {
    path: 'leave-availability',
    data: { workspacePage: 'leave', ...STAFF_PAGES.leave },
    loadComponent: () => import('./pages/leave-availability/staff-leave-availability.component').then(m => m.StaffLeaveAvailabilityComponent)
  },
  {
    path: 'create',
    canActivate: [staffWriteGuard],
    data: { ...STAFF_PAGES.create },
    loadComponent: () => import('./pages/create-staff/create-staff.component').then(m => m.CreateStaffComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [staffWriteGuard],
    data: { ...STAFF_PAGES.edit },
    loadComponent: () => import('./pages/create-staff/create-staff.component').then(m => m.CreateStaffComponent)
  },
  {
    path: 'profile/:id',
    data: { ...STAFF_PAGES.profile },
    loadComponent: () => import('./pages/profile-360/staff-profile-360.component').then(m => m.StaffProfile360Component)
  }
];
