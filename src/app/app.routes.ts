import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { FirstTimeLoginComponent } from './auth/first-time-login/first-time-login.component';
import { LayoutComponent } from './layout/layout/layout.component';
import { AuthLayoutComponent } from './auth/auth-layout/auth-layout.component';
import { SessionExpiredComponent } from './shared/pages/session-expired/session-expired.component';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { authGuard } from './core/guard/auth.guard';
import { UnauthorizedComponent } from './shared/pages/unauthorized/unauthorized.component';

export const routes: Routes = [
    {
        path: 'public',
        component: PublicLayoutComponent,
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
        component: SessionExpiredComponent,
        pathMatch: 'full'
    },
    {
        path: 'unauthorized',
        component: UnauthorizedComponent,
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
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('./application/application.route').then(m => m.APPLICATION_ROUTES)
            }
        ]
    },

    // Wildcard (optional)
    { path: '**', redirectTo: 'login' }
];
