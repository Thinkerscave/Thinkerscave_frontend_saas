import { Routes } from '@angular/router';
import { EXAM_PAGES } from '../../core/config/page-route-meta';

export const EXAM_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'exams',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/exam-list/exam-list.component').then(m => m.ExamListComponent),
        data: { ...EXAM_PAGES.list }
      }
    ]
  }
];
