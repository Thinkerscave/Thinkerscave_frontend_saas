import { Routes } from '@angular/router';
import { ACADEMICS_PAGES, ACADEMICS_ROOT, ACCESS_MGMT_ROOT, ACCESS_PAGES, TENANT_MGMT_ROOT, TENANT_PAGES } from '../core/config/page-route-meta';
import { COMMUNICATION_ROUTES } from './communication/communication.routes';
import { PROMOTION_MANAGEMENT_ROUTES } from './promotion-management/promotion-management.routes';
import { RESPONSIBILITY_MANAGEMENT_ROUTES } from './responsibility-management/responsibility-management.routes';
import { roleGuard } from '../core/guard/role.guard';

const TENANT_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'Super Admin', 'PLATFORM_ADMIN', 'Platform Admin', 'THINKERSCAVE_INTERNAL', 'ThinkerScave Internal Team', 'INTERNAL_TEAM', 'Internal Team'];
const ORGANIZATION_PROFILE_ROLES = ['ADMIN', 'Admin', 'COLLEGE_ADMIN', 'College Admin', 'INSTITUTION_ADMIN', 'Institution Admin', 'ORGANIZATION_ADMIN', 'Organization Admin', 'ORGANIZATION_OWNER', 'Organization Owner'];
const ACCESS_MANAGEMENT_ROLES = [...ORGANIZATION_PROFILE_ROLES];
const ACADEMICS_ROLES = [...TENANT_MANAGEMENT_ROLES, ...ORGANIZATION_PROFILE_ROLES, 'PRINCIPAL', 'Principal', 'TEACHER', 'Teacher', 'STAFF', 'Staff', 'PARENT', 'Parent'];
const ONBOARDING_ROLES = [...ORGANIZATION_PROFILE_ROLES];

export const APPLICATION_ROUTES: Routes = [
  {
    path: 'onboarding',
    canActivate: [roleGuard(ONBOARDING_ROLES)],
    loadComponent: () => import('./onboarding/onboarding-checklist.component').then(m => m.OnboardingChecklistComponent)
  },
  {
    path: '',
    loadChildren: () => import('./dashboard/dashboard.route').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'tenant-management',
    canActivate: [roleGuard(TENANT_MANAGEMENT_ROLES)],
    data: { ...TENANT_MGMT_ROOT },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'organizations' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app' },
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
      { path: 'menus', data: { ...TENANT_PAGES.menuManagement }, loadComponent: () => import('./tenant-management/pages/menu-management/menu-management.component').then(m => m.MenuManagementComponent) },
      { path: 'roles', data: { ...TENANT_PAGES.roleManagement }, loadComponent: () => import('./tenant-management/pages/platform-roles/platform-roles.component').then(m => m.PlatformRolesComponent) },
      { path: 'feature-catalog', data: { ...TENANT_PAGES.featureCatalog, catalogMode: 'platform' }, loadComponent: () => import('./tenant-management/pages/feature-catalog/feature-catalog.component').then(m => m.FeatureCatalogComponent) },
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
      { path: '', pathMatch: 'full', redirectTo: '/app' },
      { path: 'customers', pathMatch: 'full', redirectTo: '/app/tenant-management/customers' },
      { path: 'customers/new', pathMatch: 'full', redirectTo: '/app/tenant-management/customers/new' },
      { path: 'customers/:id', pathMatch: 'full', redirectTo: '/app/tenant-management/customers/:id' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app' },
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
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: 'users' },
      { path: 'roles', pathMatch: 'full', redirectTo: 'users' },
      { path: 'roles/:roleId', pathMatch: 'full', redirectTo: 'users' },
      { path: 'feature-catalog', data: { ...ACCESS_PAGES.featureCatalog, catalogMode: 'organization' }, loadComponent: () => import('./tenant-management/pages/feature-catalog/feature-catalog.component').then(m => m.FeatureCatalogComponent) },
      { path: 'menus', pathMatch: 'full', redirectTo: 'feature-catalog' },
      { path: 'responsibilities', data: { ...ACCESS_PAGES.responsibilities }, loadComponent: () => import('./access-management/pages/responsibilities-list/responsibilities-list.component').then(m => m.ResponsibilitiesListComponent) },
      { path: 'responsibilities/:responsibilityId', data: { ...ACCESS_PAGES.responsibilityWorkspace }, loadComponent: () => import('./access-management/pages/responsibility-workspace/responsibility-workspace.component').then(m => m.ResponsibilityWorkspaceComponent) },
      { path: 'users', data: { ...ACCESS_PAGES.users }, loadComponent: () => import('./access-management/pages/users-list/users-list.component').then(m => m.UsersListComponent) },
      { path: 'users/:userId', data: { ...ACCESS_PAGES.userPermissions }, loadComponent: () => import('./access-management/pages/user-permissions/user-permissions.component').then(m => m.UserPermissionsComponent) },
      { path: 'users/:userId/permissions', pathMatch: 'full', redirectTo: '/app/access-management/users/:userId' },
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
      { path: 'access-control', pathMatch: 'full', redirectTo: '/app/access-management/users' },
      { path: 'activity-logs', loadComponent: () => import('./organization-profile/pages/activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: '/app' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: '/app' },
      { path: 'organizations', pathMatch: 'full', redirectTo: '/app/tenant-management/organizations' },
      { path: 'subscriptions', pathMatch: 'full', redirectTo: '/app/tenant-management/subscription-plans' },
      { path: 'access', pathMatch: 'full', redirectTo: '/app/access-management/users' },
      { path: 'monitoring', pathMatch: 'full', redirectTo: '/app/tenant-management/tenant-health' },
      { path: 'audit', pathMatch: 'full', redirectTo: '/app/tenant-management/audit-center' },
      { path: 'feature-catalog', pathMatch: 'full', redirectTo: '/app/tenant-management/feature-catalog' },
      { path: 'platform-health', pathMatch: 'full', redirectTo: '/app/tenant-management/tenant-health' }
    ]
  },
  {
    path: 'navigation-access',
    pathMatch: 'full',
    redirectTo: 'access-management/users'
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
    redirectTo: 'access-management/users'
  },
  {
    path: 'manage-sub-menu',
    pathMatch: 'full',
    redirectTo: 'access-management/users'
  },
  {
    path: 'menu-sequence',
    pathMatch: 'full',
    redirectTo: 'access-management/users'
  },
  {
    path: 'role-menu-mapping',
    pathMatch: 'full',
    redirectTo: 'access-management/users'
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
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL', 'HR_MANAGER', 'TEACHER', 'STAFF', 'PARENT'])],
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
          { path: 'responsibilities', pathMatch: 'full', redirectTo: '/app/access-management/responsibilities' },
          { path: 'payroll', data: { workspacePage: 'payroll' }, loadComponent: () => import('./staff/pages/payroll/staff-payroll.component').then(m => m.StaffPayrollComponent) },
          { path: 'leave-availability', data: { workspacePage: 'leave' }, loadComponent: () => import('./staff/pages/leave-availability/staff-leave-availability.component').then(m => m.StaffLeaveAvailabilityComponent) },
          { path: 'documents', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'alumni', pathMatch: 'full', redirectTo: 'directory' },
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
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL', 'TEACHER', 'HR_MANAGER', 'STAFF', 'STUDENT', 'PARENT'])],
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
    redirectTo: 'access-management/users'
  },
  {
    path: 'role/privilege-mapping',
    pathMatch: 'full',
    redirectTo: 'access-management/users'
  },
  {
    path: 'public/admission',
    pathMatch: 'full',
    redirectTo: '/public/inquiry'
  },
  // ━━━ Admissions CRM module (EduReach workspace) ━━━
  {
    path: 'admissions',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'STAFF'])],
    children: [
      { path: 'lead/:id', loadComponent: () => import('./admissions/pages/lead-detail/lead-detail.component').then(m => m.LeadDetailComponent) },
      { path: 'form/:id', loadComponent: () => import('./admissions/pages/application-wizard/application-wizard.component').then(m => m.ApplicationWizardComponent) },
      { path: 'wizard/:id', pathMatch: 'full', redirectTo: 'form/:id' },
      {
        path: '',
        loadComponent: () => import('./admissions/components/admissions-workspace/admissions-workspace.component').then(m => m.AdmissionsWorkspaceComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          { path: 'overview', data: { workspacePage: 'overview' }, loadComponent: () => import('./admissions/pages/overview/admissions-overview.component').then(m => m.AdmissionsOverviewComponent) },
          { path: 'leads', data: { workspacePage: 'leads' }, loadComponent: () => import('./admissions/pages/leads/leads-list.component').then(m => m.LeadsListComponent) },
          { path: 'follow-ups', data: { workspacePage: 'follow-ups' }, loadComponent: () => import('./admissions/pages/follow-ups/follow-ups-center.component').then(m => m.FollowUpsCenterComponent) },
          { path: 'applications', data: { workspacePage: 'applications' }, loadComponent: () => import('./admissions/pages/applications/applications-list.component').then(m => m.ApplicationsListComponent) },
          { path: 'settings', data: { workspacePage: 'settings' }, loadComponent: () => import('./admissions/pages/settings/admissions-settings.component').then(m => m.AdmissionsSettingsComponent) },
          { path: 'enrollment', pathMatch: 'full', redirectTo: 'applications' },
          { path: 'reports', pathMatch: 'full', redirectTo: 'overview' },
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
      { path: 'analytics', pathMatch: 'full', redirectTo: '/app/admissions/overview' },
      { path: 'manage', pathMatch: 'full', redirectTo: '/app/admissions/leads' },
      { path: 'followup', pathMatch: 'full', redirectTo: '/app/admissions/follow-ups' },
      { path: 'detail/:id', pathMatch: 'full', redirectTo: '/app/admissions/lead/:id' }
    ]
  },
  {
    path: 'students',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER', 'PRINCIPAL', 'HR_MANAGER', 'TEACHER', 'STAFF', 'RECEPTIONIST', 'PARENT'])],
    children: [
      { path: 'profile/:id', loadComponent: () => import('./students/pages/profile-360/student-profile-360.component').then(m => m.StudentProfile360Component) },
      {
        path: '',
        loadComponent: () => import('./students/components/students-workspace/students-workspace.component').then(m => m.StudentsWorkspaceComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'directory', data: { workspacePage: 'directory' }, loadComponent: () => import('./students/pages/directory/students-directory.component').then(m => m.StudentsDirectoryComponent) },
          { path: 'transfers', pathMatch: 'full', redirectTo: '/app/transfers' },
          { path: 'documents', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'alumni', data: { workspacePage: 'alumni' }, loadComponent: () => import('./students/pages/alumni/alumni-directory.component').then(m => m.AlumniDirectoryComponent) },
          // Legacy paths kept as redirects so deep links and bookmarks remain stable.
          { path: 'dashboard', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'profiles', pathMatch: 'full', redirectTo: 'directory' },
          { path: 'add-student', data: { workspacePage: 'directory' }, loadComponent: () => import('./students/pages/add-student/add-student.component').then(m => m.AddStudentComponent) },
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
  // ━━━ Academics module (Overview / Academic Year / Classes & Sections / Subjects / Teacher Allocation / Timetable + role pages) ━━━
  {
    path: 'academics',
    canActivate: [roleGuard(ACADEMICS_ROLES)],
    data: { ...ACADEMICS_ROOT },
    loadComponent: () => import('./academics/components/academics-workspace/academics-workspace.component').then(m => m.AcademicsWorkspaceComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', data: { workspacePage: 'overview', ...ACADEMICS_PAGES.overview }, loadComponent: () => import('./academics/components/pages/overview/overview.component').then(m => m.AcademicsOverviewPageComponent) },
      { path: 'academic-year', data: { workspacePage: 'academic-year', ...ACADEMICS_PAGES.academicYear }, loadComponent: () => import('./academics/components/pages/academic-year/academic-year.component').then(m => m.AcademicYearPageComponent) },
      { path: 'classes-sections', data: { workspacePage: 'classes-sections', ...ACADEMICS_PAGES.classesSections }, loadComponent: () => import('./academics/components/pages/classes-sections/classes-sections.component').then(m => m.ClassesSectionsPageComponent) },
      { path: 'classes-sections/:classId/subjects', data: { workspacePage: 'classes-sections', ...ACADEMICS_PAGES.classSubjects }, loadComponent: () => import('./academics/components/pages/class-subjects/class-subjects.component').then(m => m.ClassSubjectsPageComponent) },
      { path: 'classes-sections/:classId', data: { workspacePage: 'classes-sections', ...ACADEMICS_PAGES.classDetail }, loadComponent: () => import('./academics/components/pages/class-detail/class-detail.component').then(m => m.ClassDetailPageComponent) },
      { path: 'subjects-mapping', data: { workspacePage: 'subjects-mapping', ...ACADEMICS_PAGES.subjectsMapping }, loadComponent: () => import('./academics/components/pages/subjects-mapping/subjects-mapping.component').then(m => m.SubjectsMappingPageComponent) },
      { path: 'subjects-mapping/:subjectId', data: { workspacePage: 'subjects-mapping', ...ACADEMICS_PAGES.subjectDetail }, loadComponent: () => import('./academics/components/pages/subject-detail/subject-detail.component').then(m => m.SubjectDetailPageComponent) },
      { path: 'teacher-allocation', data: { workspacePage: 'teacher-allocation', ...ACADEMICS_PAGES.teacherAllocation }, loadComponent: () => import('./academics/components/pages/teacher-allocation/teacher-allocation.component').then(m => m.TeacherAllocationPageComponent) },
      { path: 'timetable', data: { workspacePage: 'timetable', ...ACADEMICS_PAGES.timetable }, loadComponent: () => import('./academics/components/pages/timetable/timetable.component').then(m => m.TimetablePageComponent) },
      { path: 'academic-calendar', data: { workspacePage: 'academic-calendar', ...ACADEMICS_PAGES.academicCalendar }, loadComponent: () => import('./academics/components/pages/academic-calendar/academic-calendar.component').then(m => m.AcademicCalendarPageComponent) },
      { path: 'academic-calendar/:eventId', data: { workspacePage: 'academic-calendar', ...ACADEMICS_PAGES.calendarEventDetail }, loadComponent: () => import('./academics/components/pages/calendar-event-detail/calendar-event-detail.component').then(m => m.CalendarEventDetailPageComponent) },
      { path: 'my-classes', data: { workspacePage: 'my-classes', ...ACADEMICS_PAGES.myClasses }, loadComponent: () => import('./academics/components/pages/my-classes/my-classes.component').then(m => m.MyClassesPageComponent) },
      { path: 'my-timetable', data: { workspacePage: 'my-timetable', ...ACADEMICS_PAGES.myTimetable }, loadComponent: () => import('./academics/components/pages/my-timetable/my-timetable.component').then(m => m.MyTimetablePageComponent) },
      { path: 'academic-structure', data: { workspacePage: 'academic-structure', ...ACADEMICS_PAGES.academicStructure }, loadComponent: () => import('./academics/components/pages/academic-structure/academic-structure.component').then(m => m.AcademicStructurePageComponent) },
      { path: 'my-academics', data: { workspacePage: 'my-academics', ...ACADEMICS_PAGES.myAcademics }, loadComponent: () => import('./academics/components/pages/my-academics/my-academics.component').then(m => m.MyAcademicsPageComponent) },
      { path: 'academic-setup', pathMatch: 'full', redirectTo: 'classes-sections' },
      { path: 'settings', pathMatch: 'full', redirectTo: 'classes-sections' },
      { path: 'teacher-arrangement', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'syllabus-tracker', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'dashboard', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'years', pathMatch: 'full', redirectTo: 'academic-year' },
      { path: 'classes', pathMatch: 'full', redirectTo: 'classes-sections' },
      { path: 'structure', pathMatch: 'full', redirectTo: 'academic-structure' },
      { path: 'hierarchy', pathMatch: 'full', redirectTo: 'classes-sections' },
      { path: 'courses', pathMatch: 'full', redirectTo: 'classes-sections' },
      { path: 'subjects', pathMatch: 'full', redirectTo: 'subjects-mapping' },
      { path: 'curriculum', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'syllabus', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'syllabus/history/:id', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'tracker', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'class-teacher-allocation', pathMatch: 'full', redirectTo: 'classes-sections' },
      { path: 'calendar', pathMatch: 'full', redirectTo: 'academic-calendar' }
    ]
  },
  {
    path: 'counsellor-dashboard',
    pathMatch: 'full',
    redirectTo: 'admissions/leads'
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
    children: COMMUNICATION_ROUTES
  },
  {
    path: '',
    children: PROMOTION_MANAGEMENT_ROUTES
  },
  {
    path: '',
    children: RESPONSIBILITY_MANAGEMENT_ROUTES
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
    loadComponent: () => import('./global-settings/settings-opener.component').then(m => m.SettingsOpenerComponent)
  }
];