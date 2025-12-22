import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { FirstTimeLoginComponent } from './auth/first-time-login/first-time-login.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { AuthLayoutComponent } from './auth/auth-layout/auth-layout.component';
import { SessionExpiredComponent } from './shared/pages/session-expired/session-expired.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full'
    },
    {
        path: 'session-expired',
        component : SessionExpiredComponent,
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
        component: AuthLayoutComponent,
        children: [
            { path: 'login', component: LoginComponent },
            { path: 'forgot-password', component: ForgotPasswordComponent },
            { path: 'first-time-login', component: FirstTimeLoginComponent }
        ]
    },
    {
        path: 'app',
        component: LayoutComponent,
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('./application/application.route').then(m => m.APPLICATION_ROUTES)
            }
        ]
    },
    {
        path: 'public/admission',
        loadComponent: () => import('./application/admission/student-admission-form/student-admission-form.component').then(m => m.StudentAdmissionFormComponent)
    },
    {
        path: 'public/admission/review',
        loadComponent: () => import('./application/admission/staff-application-review/staff-application-review.component').then(m => m.StaffApplicationReviewComponent)
    },

    // Wildcard (optional)
    { path: '**', redirectTo: 'login' }
];
