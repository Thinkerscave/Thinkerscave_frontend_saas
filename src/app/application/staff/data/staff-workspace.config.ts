import { StaffPageConfig, StaffWorkspacePage } from '../models/staff-workspace.model';

export const STAFF_PAGES: StaffPageConfig[] = [
  {
    page: 'directory',
    label: 'Staff Directory',
    title: 'Staff',
    description: 'Manage teaching and non-teaching staff across the organization.',
    icon: 'pi pi-users',
    route: '/app/staff/directory'
  },
  {
    page: 'leave',
    label: 'Leave Management',
    title: 'Leave Management',
    description: 'Track leave requests, approvals, and staff availability.',
    icon: 'pi pi-calendar',
    route: '/app/staff/leave-availability'
  }
];

export function staffPageConfig(page: StaffWorkspacePage): StaffPageConfig {
  return STAFF_PAGES.find((p) => p.page === page) ?? STAFF_PAGES[0];
}
