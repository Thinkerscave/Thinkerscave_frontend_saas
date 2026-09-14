import { Routes } from '@angular/router';

export const EXAM_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'exams',
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
