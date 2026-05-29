import { Routes } from '@angular/router';
import { LEAD_MANAGEMENT_ROUTES } from './lead-management/lead-management.routes';
import { EXAM_MANAGEMENT_ROUTES } from './exam-management/exam-management.routes';
import { COMMUNICATION_ROUTES } from './communication/communication.routes';
import { ENROLLMENT_MANAGEMENT_ROUTES } from './enrollment-management/enrollment-management.routes';
import { PROMOTION_MANAGEMENT_ROUTES } from './promotion-management/promotion-management.routes';
import { RESPONSIBILITY_MANAGEMENT_ROUTES } from './responsibility-management/responsibility-management.routes';
import { roleGuard } from '../core/guard/role.guard';

export const APPLICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { adminPage: 'dashboard' }, loadComponent: () => import('./administration/components/admin-workspace/admin-workspace.component').then(m => m.AdminWorkspaceComponent) },
      { path: 'organizations', data: { adminPage: 'organizations' }, loadComponent: () => import('./administration/components/admin-workspace/admin-workspace.component').then(m => m.AdminWorkspaceComponent) },
      { path: 'access', data: { adminPage: 'access' }, loadComponent: () => import('./administration/components/admin-workspace/admin-workspace.component').then(m => m.AdminWorkspaceComponent) },
      { path: 'monitoring', data: { adminPage: 'monitoring' }, loadComponent: () => import('./administration/components/admin-workspace/admin-workspace.component').then(m => m.AdminWorkspaceComponent) },
      { path: 'audit', data: { adminPage: 'audit' }, loadComponent: () => import('./administration/components/admin-workspace/admin-workspace.component').then(m => m.AdminWorkspaceComponent) }
    ]
  },
  {
    path: 'navigation-access',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'system-settings',
    pathMatch: 'full',
    redirectTo: 'admin/monitoring'
  },
  {
    path: 'audit-activity',
    pathMatch: 'full',
    redirectTo: 'admin/audit'
  },
  {
    path: 'manage-menu',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'manage-sub-menu',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'menu-sequence',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'role-menu-mapping',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'organization-registration',
    pathMatch: 'full',
    redirectTo: 'admin/organizations'
  },
  {
    path: 'academy-demo',
    pathMatch: 'full',
    redirectTo: 'admin/dashboard'
  },
  {
    path: 'managestudent',
    pathMatch: 'full',
    redirectTo: 'students/directory'
  },
  {
    path: 'staff',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR_MANAGER', 'ACCOUNTANT'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { workspacePage: 'dashboard' }, loadComponent: () => import('./school-operations/components/staff-workspace/staff-workspace.component').then(m => m.StaffWorkspaceComponent) },
      { path: 'directory', data: { workspacePage: 'directory' }, loadComponent: () => import('./school-operations/components/staff-workspace/staff-workspace.component').then(m => m.StaffWorkspaceComponent) },
      { path: 'operations', data: { workspacePage: 'operations' }, loadComponent: () => import('./school-operations/components/staff-workspace/staff-workspace.component').then(m => m.StaffWorkspaceComponent) }
    ]
  },
  {
    path: 'salary',
    pathMatch: 'full',
    redirectTo: 'staff/operations'
  },
  {
    path: 'leave',
    pathMatch: 'full',
    redirectTo: 'staff/operations'
  },
  {
    path: 'attendance',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'HR_MANAGER'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { workspacePage: 'dashboard' }, loadComponent: () => import('./school-operations/components/attendance-workspace/attendance-workspace.component').then(m => m.AttendanceWorkspaceComponent) },
      { path: 'students', data: { workspacePage: 'students' }, loadComponent: () => import('./school-operations/components/attendance-workspace/attendance-workspace.component').then(m => m.AttendanceWorkspaceComponent) },
      { path: 'staff', data: { workspacePage: 'staff' }, loadComponent: () => import('./school-operations/components/attendance-workspace/attendance-workspace.component').then(m => m.AttendanceWorkspaceComponent) },
      { path: 'class', pathMatch: 'full', redirectTo: 'students' },
      { path: 'hostel', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  {
    path: 'role/manage',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'inquiry',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { workspacePage: 'dashboard' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'pipeline', data: { workspacePage: 'pipeline' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'management', data: { workspacePage: 'management' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'follow-ups', data: { workspacePage: 'follow-ups' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'counseling', data: { workspacePage: 'counseling' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'applications', data: { workspacePage: 'applications' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'documents', data: { workspacePage: 'documents' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'communication', data: { workspacePage: 'communication' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'analytics', data: { workspacePage: 'analytics' }, loadComponent: () => import('./inquiry-management/workspace/inquiry-admissions-workspace.component').then(m => m.InquiryAdmissionsWorkspaceComponent) },
      { path: 'manage', pathMatch: 'full', redirectTo: 'management' },
      { path: 'followup', pathMatch: 'full', redirectTo: 'follow-ups' },
      { path: 'detail/:id', pathMatch: 'full', redirectTo: 'pipeline' }
    ]
  },
  {
    path: 'students',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'RECEPTIONIST'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { workspacePage: 'dashboard' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'directory', data: { workspacePage: 'directory' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'profiles', data: { workspacePage: 'profiles' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'admissions', data: { workspacePage: 'admissions' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'classes', data: { workspacePage: 'classes' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'sections', data: { workspacePage: 'sections' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'promotion', data: { workspacePage: 'promotion' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'transfer', data: { workspacePage: 'transfer' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'documents', data: { workspacePage: 'documents' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'parents', data: { workspacePage: 'parents' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'id-cards', data: { workspacePage: 'id-cards' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) },
      { path: 'alumni', data: { workspacePage: 'alumni' }, loadComponent: () => import('./student-management/workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent) }
    ]
  },
  {
    path: 'academics',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        data: { workspacePage: 'dashboard' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'years',
        data: { workspacePage: 'years' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'classes',
        data: { workspacePage: 'classes' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'structure',
        pathMatch: 'full',
        redirectTo: 'hierarchy'
      },
      {
        path: 'courses',
        pathMatch: 'full',
        redirectTo: 'classes'
      },
      {
        path: 'subjects',
        data: { workspacePage: 'subjects' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'curriculum',
        data: { workspacePage: 'curriculum' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'syllabus',
        data: { workspacePage: 'syllabus' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'syllabus/history/:id',
        pathMatch: 'full',
        redirectTo: 'syllabus'
      },
      {
        path: 'tracker',
        pathMatch: 'full',
        redirectTo: 'syllabus'
      },
      {
        path: 'teacher-allocation',
        data: { workspacePage: 'teacher-allocation' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'class-teacher-allocation',
        data: { workspacePage: 'class-teacher-allocation' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'timetable',
        data: { workspacePage: 'timetable' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'calendar',
        data: { workspacePage: 'calendar' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'hierarchy',
        data: { workspacePage: 'hierarchy' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      },
      {
        path: 'settings',
        data: { workspacePage: 'settings' },
        loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent)
      }
    ]
  },
  {
    path: '',
    children: LEAD_MANAGEMENT_ROUTES
  },
  {
    path: '',
    children: EXAM_MANAGEMENT_ROUTES
  },
  {
    path: '',
    children: COMMUNICATION_ROUTES
  },
  {
    path: '',
    children: ENROLLMENT_MANAGEMENT_ROUTES
  },
  {
    path: '',
    children: PROMOTION_MANAGEMENT_ROUTES
  },
  {
    path: '',
    children: RESPONSIBILITY_MANAGEMENT_ROUTES
  },
  // ─── Master Data ─────────────────────────────────────────────────────────
  {
    path: 'manage-branch',
    redirectTo: 'staff/operations',
    pathMatch: 'full'
  },
  {
    path: 'manage-department',
    redirectTo: 'staff/operations',
    pathMatch: 'full'
  },
  {
    path: 'manage-class',
    redirectTo: 'students/classes',
    pathMatch: 'full'
  },
  {
    path: 'manage-section',
    redirectTo: 'students/sections',
    pathMatch: 'full'
  },
  // ─── User Profile ────────────────────────────────────────────────────────
  {
    path: 'profile',
    loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent)
  }
];
