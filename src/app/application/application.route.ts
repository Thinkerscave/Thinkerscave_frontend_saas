import { Routes } from '@angular/router';
import { LEAD_MANAGEMENT_ROUTES } from './lead-management/lead-management.routes';
import { EXAM_MANAGEMENT_ROUTES } from './exam-management/exam-management.routes';
import { COMMUNICATION_ROUTES } from './communication/communication.routes';
import { ENROLLMENT_MANAGEMENT_ROUTES } from './enrollment-management/enrollment-management.routes';
import { PROMOTION_MANAGEMENT_ROUTES } from './promotion-management/promotion-management.routes';
import { RESPONSIBILITY_MANAGEMENT_ROUTES } from './responsibility-management/responsibility-management.routes';
import { FEE_MANAGEMENT_ROUTES } from './fee-management/fee-management.routes';
import { STUDENT_MANAGEMENT_ROUTES } from './student-management/student-management.route';
import { roleGuard } from '../core/guard/role.guard';

const TENANT_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'Super Admin', 'PLATFORM_ADMIN', 'Platform Admin', 'THINKERSCAVE_INTERNAL', 'ThinkerScave Internal Team', 'INTERNAL_TEAM', 'Internal Team'];
const ORGANIZATION_PROFILE_ROLES = ['ADMIN', 'Admin', 'COLLEGE_ADMIN', 'College Admin', 'INSTITUTION_ADMIN', 'Institution Admin', 'ORGANIZATION_ADMIN', 'Organization Admin', 'ORGANIZATION_OWNER', 'Organization Owner'];

export const APPLICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'tenant-management',
    canActivate: [roleGuard(TENANT_MANAGEMENT_ROLES)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'organizations' },
      { path: 'organizations', loadComponent: () => import('./tenant-management/pages/organizations-list/organizations-list.component').then(m => m.OrganizationsListComponent) },
      { path: 'organizations/create', loadComponent: () => import('./tenant-management/pages/create-organization/create-organization.component').then(m => m.CreateOrganizationComponent) },
      { path: 'organizations/:orgId', loadComponent: () => import('./tenant-management/pages/organization-workspace/organization-workspace.component').then(m => m.OrganizationWorkspaceComponent) },
      { path: 'subscription-plans', loadComponent: () => import('./tenant-management/pages/subscription-plans/subscription-plans.component').then(m => m.SubscriptionPlansComponent) },
      { path: 'subscription-plans/create', pathMatch: 'full', redirectTo: 'subscription-plans' },
      { path: 'subscription-plans/:planId', redirectTo: 'subscription-plans' },
      { path: 'audit-center', loadComponent: () => import('./tenant-management/pages/audit-center/audit-center.component').then(m => m.AuditCenterComponent) }
    ]
  },
  {
    path: 'platform',
    canActivate: [roleGuard(TENANT_MANAGEMENT_ROLES)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'organizations', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'organizations/:orgId', redirectTo: '/app/tenant-management/organizations/:orgId' },
      { path: 'subscriptions', pathMatch: 'full', redirectTo: '/app/tenant-management/subscription-plans' },
      { path: 'monitoring', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'audit', pathMatch: 'full', redirectTo: '/app/tenant-management/audit-center' }
    ]
  },
  {
    path: 'organization-profile',
    canActivate: [roleGuard(ORGANIZATION_PROFILE_ROLES)],
    loadComponent: () => import('./organization-profile/organization-profile.component').then(m => m.OrganizationProfileComponent)
  },
  {
    path: 'organization',
    canActivate: [roleGuard(ORGANIZATION_PROFILE_ROLES)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      { path: 'profile', loadComponent: () => import('./organization-profile/organization-profile.component').then(m => m.OrganizationProfileComponent) },
      { path: 'access-control', loadComponent: () => import('./organization-profile/pages/access-control/access-control.component').then(m => m.AccessControlComponent) },
      { path: 'activity-logs', loadComponent: () => import('./organization-profile/pages/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'organizations', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'subscriptions', pathMatch: 'full', redirectTo: '/app/tenant-management/subscription-plans' },
      { path: 'access', pathMatch: 'full', redirectTo: '/app/organization/access-control' },
      { path: 'monitoring', pathMatch: 'full', redirectTo: '/app/admin/platform-health' },
      { path: 'audit', pathMatch: 'full', redirectTo: '/app/tenant-management/audit-center' },
      { path: 'feature-catalog', loadComponent: () => import('./tenant-management/pages/feature-catalog/feature-catalog.component').then(m => m.FeatureCatalogComponent) },
      { path: 'platform-health', loadComponent: () => import('./tenant-management/pages/platform-health/platform-health.component').then(m => m.PlatformHealthComponent) }
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
    redirectTo: 'tenant-management/organizations/create'
  },
  {
    path: 'academy-demo',
    pathMatch: 'full',
    redirectTo: 'tenant-management/organizations'
  },
  {
    path: 'managestudent',
    pathMatch: 'full',
    redirectTo: 'students/directory'
  },
  {
    path: 'staff',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR_MANAGER', 'TEACHER', 'STAFF'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'directory' },
      { path: 'directory', loadComponent: () => import('./staff/pages/directory/staff-directory.component').then(m => m.StaffDirectoryComponent) },
      { path: 'profile/:id', loadComponent: () => import('./staff/pages/profile-360/staff-profile-360.component').then(m => m.StaffProfile360Component) },
      { path: 'responsibilities', loadComponent: () => import('./staff/pages/responsibilities/staff-responsibilities.component').then(m => m.StaffResponsibilitiesComponent) },
      { path: 'leave-availability', loadComponent: () => import('./staff/pages/leave-availability/staff-leave-availability.component').then(m => m.StaffLeaveAvailabilityComponent) },
      { path: 'documents', loadComponent: () => import('./staff/pages/documents/staff-documents.component').then(m => m.StaffDocumentsComponent) },
      { path: 'alumni', loadComponent: () => import('./staff/pages/alumni/staff-alumni.component').then(m => m.StaffAlumniComponent) },
      // Legacy redirects (kept for back-compat with old links and seed-menu fallbacks)
      { path: 'dashboard',  pathMatch: 'full', redirectTo: 'directory' },
      { path: 'operations', pathMatch: 'full', redirectTo: 'leave-availability' }
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
      { path: '', pathMatch: 'full', redirectTo: 'students' },
      { path: 'students', loadComponent: () => import('./attendance/pages/student/attendance-student.component').then(m => m.AttendanceStudentComponent) },
      { path: 'staff', loadComponent: () => import('./attendance/pages/staff/attendance-staff.component').then(m => m.AttendanceStaffComponent) },
      { path: 'reports', loadComponent: () => import('./attendance/pages/reports/attendance-reports.component').then(m => m.AttendanceReportsComponent) },
      { path: 'calendar', loadComponent: () => import('./attendance/pages/calendar/attendance-calendar.component').then(m => m.AttendanceCalendarComponent) },
      { path: 'settings', loadComponent: () => import('./attendance/pages/settings/attendance-settings.component').then(m => m.AttendanceSettingsComponent) },
      { path: 'dashboard', pathMatch: 'full', redirectTo: 'students' },
      { path: 'class', pathMatch: 'full', redirectTo: 'students' },
      { path: 'hostel', pathMatch: 'full', redirectTo: 'students' }
    ]
  },
  {
    path: 'role/manage',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'role/privilege-mapping',
    pathMatch: 'full',
    redirectTo: 'admin/access'
  },
  {
    path: 'public/admission',
    pathMatch: 'full',
    redirectTo: '/public/admission'
  },
  // ━━━ Admissions module (spec: Inquiry Center / Admission Center / Settings) ━━━
  {
    path: 'admissions',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inquiry-center' },
      { path: 'inquiry-center',   loadComponent: () => import('./admissions/pages/inquiry-center/inquiry-center.component').then(m => m.InquiryCenterComponent) },
      { path: 'admission-center', loadComponent: () => import('./admissions/pages/admission-center/admission-center.component').then(m => m.AdmissionCenterComponent) },
      { path: 'settings',         loadComponent: () => import('./admissions/pages/admissions-settings/admissions-settings.component').then(m => m.AdmissionsSettingsComponent) },
      { path: 'detail/:id',       loadComponent: () => import('./admissions/pages/inquiry-detail/inquiry-detail-workspace.component').then(m => m.InquiryDetailWorkspaceComponent) },
      { path: 'wizard/:id',       loadComponent: () => import('./admissions/pages/admission-wizard/admission-wizard.component').then(m => m.AdmissionWizardComponent) }
    ]
  },
  // ━━━ Legacy /app/inquiry/* routes ━━━ kept reachable but redirect to spec routes ━━━
  {
    path: 'inquiry',
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'pipeline', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'management', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'follow-ups', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'counseling', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'applications', pathMatch: 'full', redirectTo: '/app/admissions/admission-center' },
      { path: 'documents', pathMatch: 'full', redirectTo: '/app/admissions/admission-center' },
      { path: 'communication', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'analytics', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'manage', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'followup', pathMatch: 'full', redirectTo: '/app/admissions/inquiry-center' },
      { path: 'detail/:id', redirectTo: '/app/admissions/detail/:id' }
    ]
  },
  {
    path: 'students',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'RECEPTIONIST'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'directory' },
      // Spec taxonomy: Students | Academic Movement | Student Movement | Documents | Alumni
      { path: 'directory',          loadComponent: () => import('./students/pages/directory/students-directory.component').then(m => m.StudentsDirectoryComponent) },
      { path: 'profile/:id',        loadComponent: () => import('./students/pages/profile-360/student-profile-360.component').then(m => m.StudentProfile360Component) },
      { path: 'transfers',          loadComponent: () => import('./students/pages/student-movement/student-movement.component').then(m => m.StudentMovementComponent) },
      { path: 'alumni',             loadComponent: () => import('./students/pages/alumni/alumni-directory.component').then(m => m.AlumniDirectoryComponent) },
      // Legacy paths kept as redirects so deep links and bookmarks remain stable.
      { path: 'dashboard', pathMatch: 'full', redirectTo: 'directory' },
      { path: 'profiles', pathMatch: 'full', redirectTo: 'directory' },
      { path: 'add-student', pathMatch: 'full', redirectTo: 'directory' },
      { path: 'admissions', pathMatch: 'full', redirectTo: '/app/admissions/admission-center' },
      { path: 'classes', pathMatch: 'full', redirectTo: '/app/academics/academic-setup' },
      { path: 'sections', pathMatch: 'full', redirectTo: '/app/academics/academic-setup' },
      { path: 'promotion', pathMatch: 'full', redirectTo: 'academic-movement' },
      { path: 'student-movement', pathMatch: 'full', redirectTo: 'transfers' },
      { path: 'transfer', pathMatch: 'full', redirectTo: 'transfers' },
      { path: 'parents', pathMatch: 'full', redirectTo: 'directory' },
      { path: 'id-cards', pathMatch: 'full', redirectTo: 'directory' },
      ...STUDENT_MANAGEMENT_ROUTES
    ]
  },
  // ━━━ Academics module (spec: Academic Setup / Timetable / Teacher Arrangement / Academic Calendar / Syllabus Tracker / Settings) ━━━
  {
    path: 'academics',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'academic-setup', data: { workspacePage: 'dashboard' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'timetable', data: { workspacePage: 'timetable' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'teacher-arrangement', data: { workspacePage: 'teacher-allocation' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'academic-calendar', data: { workspacePage: 'calendar' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'syllabus-tracker', data: { workspacePage: 'syllabus' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'settings', data: { workspacePage: 'settings' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      // Legacy paths kept reachable as redirects.
      { path: 'dashboard', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'years', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'classes', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'structure', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'hierarchy', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'courses', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'subjects', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'curriculum', pathMatch: 'full', redirectTo: 'syllabus-tracker' },
      { path: 'syllabus', pathMatch: 'full', redirectTo: 'syllabus-tracker' },
      { path: 'syllabus/history/:id', data: { workspacePage: 'syllabus' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'tracker', pathMatch: 'full', redirectTo: 'syllabus-tracker' },
      { path: 'teacher-allocation', pathMatch: 'full', redirectTo: 'teacher-arrangement' },
      { path: 'class-teacher-allocation', pathMatch: 'full', redirectTo: 'teacher-arrangement' },
      { path: 'calendar', pathMatch: 'full', redirectTo: 'academic-calendar' }
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
  {
    path: 'fees',
    children: FEE_MANAGEMENT_ROUTES
  },
  {
    path: 'reports',
    pathMatch: 'full',
    redirectTo: 'fees/reports'
  },
  // ━━━ Master Data ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  // ━━━ User Profile ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    path: 'profile',
    data: { profilePage: 'profile' },
    loadComponent: () => import('./user-profile/user-profile.component').then(m => m.UserProfileComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./global-settings/global-settings.component').then(m => m.GlobalSettingsComponent)
  }
];