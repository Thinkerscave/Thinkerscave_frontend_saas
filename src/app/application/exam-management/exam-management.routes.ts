import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guard/role.guard';

export const EXAM_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'exams',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'TEACHER'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/exam-list/exam-list.component').then(m => m.ExamListComponent),
        data: { breadcrumb: 'Exams' }
      }
    ]
  }
];
