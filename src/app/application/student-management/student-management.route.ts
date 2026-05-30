import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

export const STUDENT_MANAGEMENT_ROUTES: Routes = [
    {
        path: 'syllabus-tracker',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'RECEPTIONIST', 'STUDENT'])],
        loadComponent: () => import('./components/syllabus-tracker/syllabus-tracker.component').then(m => m.SyllabusTrackerComponent)
    }
];
