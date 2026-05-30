import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
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
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full'
    },
    {
        path: 'session-expired',
        loadComponent: () => import('./shared/pages/session-expired/session-expired.component').then(m => m.SessionExpiredComponent),
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
                path: 'login',
                loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'forgot-password',
                loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
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

    // 404 — Not Found
    {
        path: '**',
        loadComponent: () => import('./shared/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
    }
];
