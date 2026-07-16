import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';
import { orgSelectionGuard, orgSelectPageGuard } from './core/guard/org-selection.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./marketing/landing/landing.component').then(m => m.LandingComponent),
        pathMatch: 'full'
    },
    {
        path: 'public',
        loadComponent: () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
        children: [
            {
                path: 'admission',
                loadComponent: () => import('./application/admission/student-admission-form/student-admission-form.component').then(m => m.StudentAdmissionFormComponent)
            },
            {
                path: 'admission/review',
                loadComponent: () => import('./application/admission/staff-application-review/staff-application-review.component').then(m => m.StaffApplicationReviewComponent)
            },
            {
                path: 'inquiry',
                loadComponent: () => import('./common/public-inquiry/public-inquiry.component').then(m => m.PublicInquiryComponent)
            }
        ]
    },
    {
        path: 'session-expired',
        loadComponent: () => import('./shared/pages/session-expired/session-expired.component').then(m => m.SessionExpiredComponent),
        pathMatch: 'full'
    },
    {
        path: 'maintenance',
        loadComponent: () => import('./shared/pages/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
        pathMatch: 'full'
    },
    {
        path: 'unauthorized',
        loadComponent: () => import('./shared/pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent),
        pathMatch: 'full'
    },
    {
        path: 'login',
        redirectTo: 'auth/login',
        pathMatch: 'full'
    },
    {
        path: 'logout',
        redirectTo: 'auth/login',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadComponent: () => import('./auth/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        children: [
            {
                path: 'select-organization',
                canActivate: [orgSelectPageGuard],
                loadComponent: () => import('./auth/org-select/org-select.component').then(m => m.OrgSelectComponent)
            },
            {
                path: 'login',
                canActivate: [orgSelectionGuard],
                loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'forgot-password',
                redirectTo: 'login',
                pathMatch: 'full'
            },
            {
                path: 'first-time-login',
                loadComponent: () => import('./auth/first-time-login/first-time-login.component').then(m => m.FirstTimeLoginComponent)
            }
        ]
    },
    {
        path: 'app',
        loadComponent: () => import('./layout/layout/layout.component').then(m => m.LayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('./application/application.route').then(m => m.APPLICATION_ROUTES)
            }
        ]
    },

    {
        path: '**',
        loadComponent: () => import('./shared/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
    }
];
