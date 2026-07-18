import { Routes } from '@angular/router';
import { ACCESS_MGMT_ROOT, ACCESS_PAGES, TENANT_MGMT_ROOT, TENANT_PAGES } from '../core/config/page-route-meta';
import { EXAM_MANAGEMENT_ROUTES } from './exam-management/exam-management.routes';
import { COMMUNICATION_ROUTES } from './communication/communication.routes';
import { ENROLLMENT_MANAGEMENT_ROUTES } from './enrollment-management/enrollment-management.routes';
import { PROMOTION_MANAGEMENT_ROUTES } from './promotion-management/promotion-management.routes';
import { RESPONSIBILITY_MANAGEMENT_ROUTES } from './responsibility-management/responsibility-management.routes';
import { FEE_MANAGEMENT_ROUTES } from './fee-management/fee-management.routes';
import { roleGuard } from '../core/guard/role.guard';
import { featureFlagGuard } from '../core/guard/feature-flag.guard';

const TENANT_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'Super Admin', 'PLATFORM_ADMIN', 'Platform Admin', 'THINKERSCAVE_INTERNAL', 'ThinkerScave Internal Team', 'INTERNAL_TEAM', 'Internal Team'];
const ORGANIZATION_PROFILE_ROLES = ['ADMIN', 'Admin', 'COLLEGE_ADMIN', 'College Admin', 'INSTITUTION_ADMIN', 'Institution Admin', 'ORGANIZATION_ADMIN', 'Organization Admin', 'ORGANIZATION_OWNER', 'Organization Owner'];
const ACCESS_MANAGEMENT_ROLES = [...ORGANIZATION_PROFILE_ROLES];

export const APPLICATION_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () => import('./dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'tenant-management',
    canActivate: [roleGuard(TENANT_MANAGEMENT_ROLES)],
    data: { ...TENANT_MGMT_ROOT },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { ...TENANT_PAGES.dashboard }, loadComponent: () => import('./tenant-management/pages/platform-dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent) },
      { path: 'customers', data: { ...TENANT_PAGES.customers }, loadComponent: () => import('./tenant-management/pages/customers-list/customers-list.component').then(m => m.CustomersListComponent) },
      { path: 'customers/new', data: { ...TENANT_PAGES.customersNew }, loadComponent: () => import('./tenant-management/pages/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
      { path: 'customers/archived', data: { ...TENANT_PAGES.customersArchived }, loadComponent: () => import('./tenant-management/pages/customers-archive/customers-archive.component').then(m => m.CustomersArchiveComponent) },
      { path: 'customers/:id/edit', data: { ...TENANT_PAGES.customersEdit }, loadComponent: () => import('./tenant-management/pages/customer-form/customer-form.component').then(m => m.CustomerFormComponent) },
      { path: 'customers/:id', data: { ...TENANT_PAGES.customerDetails }, loadComponent: () => import('./tenant-management/pages/customer-workspace/customer-workspace.component').then(m => m.CustomerWorkspaceComponent) },
      { path: 'organizations', data: { ...TENANT_PAGES.organizations }, loadComponent: () => import('./tenant-management/pages/organizations-list/organizations-list.component').then(m => m.OrganizationsListComponent) },
      { path: 'organizations/create', data: { ...TENANT_PAGES.organizationsCreate }, loadComponent: () => import('./tenant-management/pages/provision-organization/provision-organization.component').then(m => m.ProvisionOrganizationComponent) },
      { path: 'organizations/:orgId', data: { ...TENANT_PAGES.organizationDetails }, loadComponent: () => import('./tenant-management/pages/organization-workspace/organization-workspace.component').then(m => m.OrganizationWorkspaceComponent) },
      { path: 'subscription-plans', data: { ...TENANT_PAGES.subscriptionPlans }, loadComponent: () => import('./tenant-management/pages/subscription-plans/subscription-plans.component').then(m => m.SubscriptionPlansComponent) },
      { path: 'subscription-plans/create', pathMatch: 'full', redirectTo: 'subscription-plans' },
      { path: 'subscription-plans/:planId', pathMatch: 'full', redirectTo: 'subscription-plans' },
      { path: 'promotions', data: { ...TENANT_PAGES.promotions }, loadComponent: () => import('./tenant-management/pages/promotions/promotions.component').then(m => m.PromotionsComponent) },
      { path: 'feature-catalog', data: { ...TENANT_PAGES.featureCatalog }, loadComponent: () => import('./tenant-management/pages/feature-catalog/feature-catalog.component').then(m => m.FeatureCatalogComponent) },
      { path: 'tenant-health', data: { ...TENANT_PAGES.tenantHealth }, loadComponent: () => import('./tenant-management/pages/platform-health/platform-health.component').then(m => m.PlatformHealthComponent) },
      { path: 'platform-health', pathMatch: 'full', redirectTo: 'tenant-health' },
      { path: 'migration-center', data: { ...TENANT_PAGES.migrationCenter }, loadComponent: () => import('./tenant-management/pages/migration-center/migration-center.component').then(m => m.MigrationCenterComponent) },
      { path: 'audit-center', data: { ...TENANT_PAGES.auditCenter }, loadComponent: () => import('./tenant-management/pages/audit-center/audit-center.component').then(m => m.AuditCenterComponent) }
    ]
  },
  {
    path: 'platform',
    canActivate: [roleGuard(TENANT_MANAGEMENT_ROLES)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/app/tenant-management/dashboard' },
      { path: 'customers', pathMatch: 'full', redirectTo: '/app/tenant-management/customers' },
      { path: 'customers/new', pathMatch: 'full', redirectTo: '/app/tenant-management/customers/new' },
      { path: 'customers/:id', pathMatch: 'full', redirectTo: '/app/tenant-management/customers/:id' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app/tenant-management/dashboard' },
      { path: 'organizations', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'organizations/:orgId', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations/:orgId' },
      { path: 'subscriptions', pathMatch: 'full', redirectTo: '/app/tenant-management/subscription-plans' },
      { path: 'monitoring', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'audit', pathMatch: 'full', redirectTo: '/app/tenant-management/audit-center' }
    ]
  },
  {
    path: 'access-management',
    canActivate: [roleGuard(ACCESS_MANAGEMENT_ROLES)],
    data: { ...ACCESS_MGMT_ROOT },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { ...ACCESS_PAGES.dashboard }, loadComponent: () => import('./access-management/pages/access-dashboard/access-dashboard.component').then(m => m.AccessDashboardComponent) },
      { path: 'roles', data: { ...ACCESS_PAGES.roles }, loadComponent: () => import('./access-management/pages/roles-list/roles-list.component').then(m => m.RolesListComponent) },
      { path: 'roles/:roleId', data: { ...ACCESS_PAGES.roleWorkspace }, loadComponent: () => import('./access-management/pages/role-workspace/role-workspace.component').then(m => m.RoleWorkspaceComponent) },
      { path: 'menus', data: { ...ACCESS_PAGES.menus }, loadComponent: () => import('./access-management/pages/menu-catalog/menu-catalog.component').then(m => m.MenuCatalogComponent) },
      { path: 'users', data: { ...ACCESS_PAGES.users }, loadComponent: () => import('./access-management/pages/users-list/users-list.component').then(m => m.UsersListComponent) },
      { path: 'users/:userId/permissions', data: { ...ACCESS_PAGES.userPermissions }, loadComponent: () => import('./access-management/pages/user-permissions/user-permissions.component').then(m => m.UserPermissionsComponent) },
      { path: 'security-policy', data: { ...ACCESS_PAGES.securityPolicy }, loadComponent: () => import('./access-management/pages/security-policy/security-policy.component').then(m => m.SecurityPolicyComponent) },
      { path: 'login-history', data: { ...ACCESS_PAGES.loginHistory }, loadComponent: () => import('./access-management/pages/login-history/login-history.component').then(m => m.LoginHistoryComponent) }
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
      { path: 'access-control', pathMatch: 'full', redirectTo: '/app/access-management/dashboard' },
      { path: 'activity-logs', loadComponent: () => import('./organization-profile/pages/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app/tenant-management/dashboard' },
      { path: 'organizations', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'subscriptions', pathMatch: 'full', redirectTo: '/app/tenant-management/subscription-plans' },
      { path: 'access', pathMatch: 'full', redirectTo: '/app/access-management/dashboard' },
      { path: 'monitoring', pathMatch: 'full', redirectTo: '/app/tenant-management/tenant-health' },
      { path: 'audit', pathMatch: 'full', redirectTo: '/app/tenant-management/audit-center' },
      { path: 'feature-catalog', pathMatch: 'full', redirectTo: '/app/tenant-management/feature-catalog' },
      { path: 'platform-health', pathMatch: 'full', redirectTo: '/app/tenant-management/tenant-health' }
    ]
  },
  {
    path: 'navigation-access',
    pathMatch: 'full',
    redirectTo: 'access-management/dashboard'
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
    redirectTo: 'access-management/dashboard'
  },
  {
    path: 'manage-sub-menu',
    pathMatch: 'full',
    redirectTo: 'access-management/dashboard'
  },
  {
    path: 'menu-sequence',
    pathMatch: 'full',
    redirectTo: 'access-management/dashboard'
  },
  {
    path: 'role-menu-mapping',
    pathMatch: 'full',
    redirectTo: 'access-management/dashboard'
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
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL', 'HR_MANAGER', 'TEACHER', 'STAFF'])],
    children: [
      { path: 'create', loadComponent: () => import('./staff/pages/create-staff/create-staff.component').then(m => m.CreateStaffComponent) },
      { path: 'edit/:id', loadComponent: () => import('./staff/pages/create-staff/create-staff.component').then(m => m.CreateStaffComponent) },
      { path: 'profile/:id', loadComponent: () => import('./staff/pages/profile-360/staff-profile-360.component').then(m => m.StaffProfile360Component) },
      {
        path: '',
        loadComponent: () => import('./staff/components/staff-workspace/staff-workspace.component').then(m => m.StaffWorkspaceComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'directory', data: { workspacePage: 'directory' }, loadComponent: () => import('./staff/pages/directory/staff-directory.component').then(m => m.StaffDirectoryComponent) },
          { path: 'responsibilities', data: { workspacePage: 'responsibilities' }, loadComponent: () => import('./staff/pages/responsibilities/staff-responsibilities.component').then(m => m.StaffResponsibilitiesComponent) },
          { path: 'payroll', data: { workspacePage: 'payroll' }, loadComponent: () => import('./staff/pages/payroll/staff-payroll.component').then(m => m.StaffPayrollComponent) },
          { path: 'leave-availability', data: { workspacePage: 'leave' }, loadComponent: () => import('./staff/pages/leave-availability/staff-leave-availability.component').then(m => m.StaffLeaveAvailabilityComponent) },
          { path: 'documents', data: { workspacePage: 'documents' }, loadComponent: () => import('./staff/pages/documents/staff-documents.component').then(m => m.StaffDocumentsComponent) },
          { path: 'alumni', data: { workspacePage: 'alumni' }, loadComponent: () => import('./staff/pages/alumni/staff-alumni.component').then(m => m.StaffAlumniComponent) },
          { path: 'dashboard', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'operations', pathMatch: 'full', redirectTo: 'leave-availability' }
        ]
      }
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
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL', 'TEACHER', 'HR_MANAGER', 'STAFF', 'STUDENT'])],
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
    redirectTo: 'access-management/dashboard'
  },
  {
    path: 'role/privilege-mapping',
    pathMatch: 'full',
    redirectTo: 'access-management/dashboard'
  },
  {
    path: 'public/admission',
    pathMatch: 'full',
    redirectTo: '/public/admission'
  },
  // ━━━ Admissions CRM module (EduReach workspace) ━━━
  {
    path: 'admissions',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL', 'HR_MANAGER', 'STAFF', 'RECEPTIONIST'])],
    children: [
      { path: 'lead/:id', loadComponent: () => import('./admissions/pages/lead-detail/lead-detail.component').then(m => m.LeadDetailComponent) },
      { path: 'wizard/:id', loadComponent: () => import('./admissions/pages/application-wizard/application-wizard.component').then(m => m.ApplicationWizardComponent) },
      {
        path: '',
        loadComponent: () => import('./admissions/components/admissions-workspace/admissions-workspace.component').then(m => m.AdmissionsWorkspaceComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          { path: 'overview', data: { workspacePage: 'overview' }, loadComponent: () => import('./admissions/pages/overview/admissions-overview.component').then(m => m.AdmissionsOverviewComponent) },
          { path: 'leads', data: { workspacePage: 'leads' }, loadComponent: () => import('./admissions/pages/leads/leads-list.component').then(m => m.LeadsListComponent) },
          { path: 'follow-ups', data: { workspacePage: 'follow-ups' }, loadComponent: () => import('./admissions/pages/follow-ups/follow-ups-center.component').then(m => m.FollowUpsCenterComponent) },
          { path: 'applications', data: { workspacePage: 'applications' }, loadComponent: () => import('./admissions/pages/applications/applications-list.component').then(m => m.ApplicationsListComponent) },
          { path: 'enrollment', data: { workspacePage: 'enrollment' }, loadComponent: () => import('./admissions/pages/enrollment/enrollment-list.component').then(m => m.EnrollmentListComponent) },
          { path: 'reports', data: { workspacePage: 'reports' }, loadComponent: () => import('./admissions/pages/reports/admissions-reports.component').then(m => m.AdmissionsReportsComponent) },
          { path: 'settings', data: { workspacePage: 'settings' }, loadComponent: () => import('./admissions/pages/settings/admissions-settings.component').then(m => m.AdmissionsSettingsComponent) },
          // Legacy redirects
          { path: 'inquiry-center', pathMatch: 'full', redirectTo: 'leads' },
          { path: 'admission-center', pathMatch: 'full', redirectTo: 'applications' },
          { path: 'detail/:id', pathMatch: 'full', redirectTo: 'lead/:id' }
        ]
      }
    ]
  },
  // ━━━ Legacy /app/inquiry/* routes ━━━
  {
    path: 'inquiry',
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/app/admissions/overview' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app/admissions/overview' },
      { path: 'pipeline', pathMatch: 'full', redirectTo: '/app/admissions/leads' },
      { path: 'management', pathMatch: 'full', redirectTo: '/app/admissions/leads' },
      { path: 'follow-ups', pathMatch: 'full', redirectTo: '/app/admissions/follow-ups' },
      { path: 'counseling', pathMatch: 'full', redirectTo: '/app/admissions/leads' },
      { path: 'applications', pathMatch: 'full', redirectTo: '/app/admissions/applications' },
      { path: 'documents', pathMatch: 'full', redirectTo: '/app/admissions/applications' },
      { path: 'communication', pathMatch: 'full', redirectTo: '/app/admissions/leads' },
      { path: 'analytics', pathMatch: 'full', redirectTo: '/app/admissions/reports' },
      { path: 'manage', pathMatch: 'full', redirectTo: '/app/admissions/leads' },
      { path: 'followup', pathMatch: 'full', redirectTo: '/app/admissions/follow-ups' },
      { path: 'detail/:id', pathMatch: 'full', redirectTo: '/app/admissions/lead/:id' }
    ]
  },
  {
    path: 'students',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL', 'HR_MANAGER', 'TEACHER', 'STAFF', 'RECEPTIONIST'])],
    children: [
      { path: 'profile/:id', loadComponent: () => import('./students/pages/profile-360/student-profile-360.component').then(m => m.StudentProfile360Component) },
      {
        path: '',
        loadComponent: () => import('./students/components/students-workspace/students-workspace.component').then(m => m.StudentsWorkspaceComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'directory', data: { workspacePage: 'directory' }, loadComponent: () => import('./students/pages/directory/students-directory.component').then(m => m.StudentsDirectoryComponent) },
          { path: 'transfers', data: { workspacePage: 'transfers' }, loadComponent: () => import('./students/pages/student-movement/student-movement.component').then(m => m.StudentMovementComponent) },
          { path: 'documents', data: { workspacePage: 'documents' }, loadComponent: () => import('./students/pages/document-vault/document-vault.component').then(m => m.DocumentVaultComponent) },
          { path: 'alumni', data: { workspacePage: 'alumni' }, loadComponent: () => import('./students/pages/alumni/alumni-directory.component').then(m => m.AlumniDirectoryComponent) },
          // Legacy paths kept as redirects so deep links and bookmarks remain stable.
          { path: 'dashboard', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'profiles', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'add-student', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'admissions', pathMatch: 'full', redirectTo: '/app/admissions/applications' },
          { path: 'classes', pathMatch: 'full', redirectTo: '/app/academics/academic-setup' },
          { path: 'sections', pathMatch: 'full', redirectTo: '/app/academics/academic-setup' },
          { path: 'promotion', pathMatch: 'full', redirectTo: 'academic-movement' },
          { path: 'student-movement', pathMatch: 'full', redirectTo: 'transfers' },
          { path: 'transfer', pathMatch: 'full', redirectTo: 'transfers' },
          { path: 'parents', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'id-cards', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'syllabus-tracker', pathMatch: 'full', redirectTo: '/app/academics/syllabus-tracker' }
        ]
      }
    ]
  },
  // ━━━ Academics module (spec: Academic Setup / Timetable / Teacher Arrangement / Academic Calendar / Syllabus Tracker / Settings) ━━━
  {
    path: 'academics',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'academic-setup' },
      { path: 'academic-setup', data: { workspacePage: 'setup' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'timetable', data: { workspacePage: 'timetable' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'teacher-arrangement', data: { workspacePage: 'teacher-arrangement' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'academic-calendar', data: { workspacePage: 'calendar' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'syllabus-tracker', data: { workspacePage: 'syllabus' }, loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent) },
      { path: 'settings', pathMatch: 'full', redirectTo: 'academic-setup' },
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
    path: 'counsellor-dashboard',
    pathMatch: 'full',
    redirectTo: 'admissions/overview'
  },
  {
    path: 'manage-leads',
    pathMatch: 'full',
    redirectTo: 'admissions/leads'
  },
  {
    path: 'lead-detail/:id',
    pathMatch: 'full',
    redirectTo: 'admissions/lead/:id'
  },
  {
    path: 'add-lead',
    pathMatch: 'full',
    redirectTo: 'admissions/leads'
  },
  {
    path: 'follow-up-tracker',
    pathMatch: 'full',
    redirectTo: 'admissions/follow-ups'
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
    canActivate: [featureFlagGuard('feeManagementEnabled')],
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