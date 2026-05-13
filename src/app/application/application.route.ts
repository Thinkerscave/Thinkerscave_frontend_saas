import { Routes } from '@angular/router';
import { LEAD_MANAGEMENT_ROUTES } from './lead-management/lead-management.routes';
import { roleGuard } from '../core/guard/role.guard';

export const APPLICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'manage-menu',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () =>
      import('./menu-management/menu/menu.component').then(m => m.MenuComponent),
  },
  {
    path: 'manage-sub-menu',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () =>
      import('./menu-management/sub-menu/sub-menu.component').then(m => m.SubmenuComponent),
  },
  {
    path: 'menu-sequence',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () =>
      import('./menu-management/menu-sequence/menu-sequence.component').then(m => m.MenuSequenceComponent),
  },
  {
    path: 'role-menu-mapping',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () =>
      import('./role-management/role-menu-mapping/role-menu-mapping.component').then(m => m.RoleMenuMappingComponent),
  },
  {
    path: 'organization-registration',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    loadComponent: () =>
      import('./registration/organization-registration/organization-registration.component').then(m => m.OrganizationRegistrationComponent),
  },
  {
    path: 'academy-demo',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () =>
      import('./academy-demo/academy-demo.component').then(m => m.AcademyDemoComponent),
  },
  {
    path: 'managestudent',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STAFF'])],
    loadComponent: () => import('./student-management/managestudent/managestudent.component').then(m => m.ManagestudentComponent)
  },
  {
    path: 'staff',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./staff-management/manage-staff/manage-staff.component').then(m => m.ManageStaffComponent)
  },
  {
    path: 'salary',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./staff-management/manage-salary/manage-salary.component').then(m => m.ManageSalaryComponent)
  },
  {
    path: 'leave',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./staff-management/leave-management/leave-management.component').then(m => m.LeaveManagementComponent)
  },
  {
    path: 'attendance/class',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'TEACHER'])],
    loadComponent: () => import('./attendance-management/class-attendance/class-attendance.component').then(m => m.ClassAttendanceComponent)
  }, {
    path: 'attendance/hostel',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./attendance-management/hostel-attendance/hostel-attendance.component').then(m => m.HostelAttendanceComponent)
  }, {
    path: 'attendance/staff',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./attendance-management/staff-attendance/staff-attendance.component').then(m => m.StaffAttendanceComponent)
  },
  {
    path: 'role/manage',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./role-management/manage-role/manage-role.component').then(m => m.ManageRoleComponent)
  },
  {
    path: 'inquiry/manage',
    loadComponent: () => import('./inquiry-management/components/manage-inquiry/manage-inquiry.component').then(m => m.ManageInquiryComponent),
    data: { breadcrumb: 'Manage Inquiries' }
  },
  {
    path: 'inquiry/followup',
    loadComponent: () => import('./inquiry-management/components/inquiry-followup/inquiry-followup.component').then(m => m.InquiryFollowupComponent),
    data: { breadcrumb: 'Inquiry Follow-Up' }
  },
  {
    path: 'inquiry/detail/:id',
    loadComponent: () => import('./inquiry-management/components/inquiry-detail/inquiry-detail.component').then(m => m.InquiryDetailComponent),
    data: { breadcrumb: 'Inquiry Details' }
  },
  {
    path: 'academics',
    children: [
      {
        path: 'structure',
        loadComponent: () => import('./academic-structure/components/structure-list/structure-list.component').then(m => m.StructureListComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./course-management/components/course-list/course-list.component').then(m => m.CourseListComponent)
      },
      {
        path: 'subjects',
        loadComponent: () => import('./course-management/components/subject-list/subject-list.component').then(m => m.SubjectListComponent)
      },
      {
        path: 'curriculum',
        loadComponent: () => import('./course-management/components/subject-mapping/subject-mapping.component').then(m => m.SubjectMappingComponent)
      },
      {
        path: 'years',
        loadComponent: () => import('./course-management/components/academic-year-config/academic-year-config.component').then(m => m.AcademicYearConfigComponent)
      },
      {
        path: 'syllabus',
        loadComponent: () => import('./syllabus-management/components/syllabus-list/syllabus-list.component').then(m => m.SyllabusListComponent)
      },
      {
        path: 'syllabus/history/:id',
        loadComponent: () => import('./syllabus-management/components/syllabus-version-history/syllabus-version-history.component').then(m => m.SyllabusVersionHistoryComponent)
      },
      {
        path: 'tracker',
        loadComponent: () => import('./student-management/components/syllabus-tracker/syllabus-tracker.component').then(m => m.SyllabusTrackerComponent)
      }
    ]
  },
  {
    path: '',
    children: LEAD_MANAGEMENT_ROUTES
  },
  // ─── Master Data ─────────────────────────────────────────────────────────
  {
    path: 'manage-branch',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./staff-management/manage-branch/manage-branch.component').then(m => m.ManageBranchComponent)
  },
  {
    path: 'manage-department',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./staff-management/manage-department/manage-department.component').then(m => m.ManageDepartmentComponent)
  },
  {
    path: 'manage-class',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./student-management/manage-class/manage-class.component').then(m => m.ManageClassComponent)
  },
  {
    path: 'manage-section',
    canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
    loadComponent: () => import('./student-management/manage-section/manage-section.component').then(m => m.ManageSectionComponent)
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
