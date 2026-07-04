import { AdmissionsPageConfig, AdmissionsWorkspacePage } from '../models/admissions-crm.model';

export const ADMISSIONS_PAGES: AdmissionsPageConfig[] = [
  {
    page: 'overview',
    label: 'Overview',
    title: 'Admissions CRM',
    description: 'Pipeline summary, funnel analytics, and today\'s follow-ups.',
    icon: 'pi pi-chart-bar',
    route: '/app/admissions/overview'
  },
  {
    page: 'leads',
    label: 'Leads',
    title: 'Leads',
    description: 'Manage prospective families from first contact to application readiness.',
    icon: 'pi pi-users',
    route: '/app/admissions/leads'
  },
  {
    page: 'follow-ups',
    label: 'Follow-ups',
    title: 'Follow-up Center',
    description: 'Today\'s schedule, overdue items, and completion workflow.',
    icon: 'pi pi-calendar',
    route: '/app/admissions/follow-ups'
  },
  {
    page: 'applications',
    label: 'Applications',
    title: 'Applications',
    description: 'Track admission applications through review and approval.',
    icon: 'pi pi-file-edit',
    route: '/app/admissions/applications'
  },
  {
    page: 'enrollment',
    label: 'Enrollment',
    title: 'Enrollment',
    description: 'Finalize approved applications and create student records.',
    icon: 'pi pi-check-circle',
    route: '/app/admissions/enrollment'
  },
  {
    page: 'reports',
    label: 'Reports',
    title: 'Reports',
    description: 'Funnel analytics, source analysis, and counselor performance.',
    icon: 'pi pi-chart-line',
    route: '/app/admissions/reports'
  },
  {
    page: 'settings',
    label: 'Settings',
    title: 'Settings',
    description: 'Sources, statuses, document checklist, and assignment rules.',
    icon: 'pi pi-cog',
    route: '/app/admissions/settings'
  }
];

export function admissionsPageConfig(page: AdmissionsWorkspacePage): AdmissionsPageConfig {
  return ADMISSIONS_PAGES.find(p => p.page === page) ?? ADMISSIONS_PAGES[0];
}

export const LEAD_STATUS_OPTIONS = [
  'NEW', 'CONTACTED', 'INTERESTED', 'COUNSELING', 'DOCUMENTS_PENDING',
  'FOLLOW_UP_REQUIRED', 'READY_FOR_ADMISSION', 'CONVERTED', 'LOST', 'CLOSED'
] as const;

export const LEAD_SOURCE_OPTIONS = [
  'Website', 'Walk-in', 'Referral', 'Social Media', 'Campaign', 'Phone', 'Other'
];

export const APPLICATION_STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'DOCUMENTS_PENDING', label: 'Documents Pending' },
  { key: 'FEE_PENDING', label: 'Fee Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'ENROLLED', label: 'Enrolled' }
] as const;

export const FOLLOW_UP_TYPES = ['CALL', 'WHATSAPP', 'EMAIL', 'WALK_IN', 'SMS', 'OTHER'] as const;
