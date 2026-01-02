import { Routes } from '@angular/router';
import { SyllabusTrackerComponent } from './components/syllabus-tracker/syllabus-tracker.component';

export const STUDENT_MANAGEMENT_ROUTES: Routes = [
    {
        path: 'syllabus-tracker',
        loadComponent: () => import('./components/syllabus-tracker/syllabus-tracker.component').then(m => m.SyllabusTrackerComponent)
    }
];
