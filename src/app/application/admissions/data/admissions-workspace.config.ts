import { AdmissionsPageConfig, AdmissionsWorkspacePage } from '../models/admissions-crm.model';

export const ADMISSIONS_PAGES: AdmissionsPageConfig[] = [
  {
    page: 'overview',
    label: 'Overview',
    title: 'Overview',
    description: 'Pipeline health, today\'s queue, sources, and counselor load.',
    icon: 'pi pi-chart-bar',
    route: '/app/admissions/overview'
  },
  {
    page: 'leads',
    label: 'Leads',
    title: 'Leads',
    description: 'Manage prospective families from first contact to application.',
    icon: 'pi pi-users',
    route: '/app/admissions/leads'
  },
  {
    page: 'follow-ups',
    label: 'Follow-ups',
    title: 'Follow-ups',
    description: 'Today, overdue, and upcoming counselor work.',
    icon: 'pi pi-calendar',
    route: '/app/admissions/follow-ups'
  },
  {
    page: 'applications',
    label: 'Applications',
    title: 'Applications',
    description: 'Review applications and enroll approved students.',
    icon: 'pi pi-file-edit',
    route: '/app/admissions/applications'
  },
  {
    page: 'reports',
    label: 'Reports',
    title: 'Reports',
    description: 'Admissions reporting and conversion visibility.',
    icon: 'pi pi-chart-line',
    route: '/app/admissions/reports'
  },
  {
    page: 'settings',
    label: 'Settings',
    title: 'Settings',
    description: 'Sources, required documents, and numbering for this school.',
    icon: 'pi pi-cog',
    route: '/app/admissions/settings'
  }
];

export function admissionsPageConfig(page: AdmissionsWorkspacePage): AdmissionsPageConfig {
  return ADMISSIONS_PAGES.find(p => p.page === page) ?? ADMISSIONS_PAGES[0];
}

export const LEAD_STATUS_OPTIONS = [
  'NEW', 'CONTACTED', 'INTERESTED', 'COUNSELING', 'DOCUMENTS_PENDING',
  'FOLLOW_UP_REQUIRED', 'READY_FOR_ADMISSION', 'APPLICATION_STARTED',
  'APPLICATION_SUBMITTED', 'CONVERTED', 'LOST', 'CLOSED'
] as const;

export const LEAD_SOURCE_OPTIONS = [
  'Website', 'Walk-in', 'Referral', 'Social Media', 'Campaign', 'Phone', 'Other'
];

export const APPLICATION_STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'READY', label: 'Ready to enroll' },
  { key: 'CLOSED', label: 'Closed' }
] as const;

export const APPLICATION_STATUS_GROUPS: Record<string, string[]> = {
  IN_PROGRESS: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'FEE_PENDING'],
  READY: ['APPROVED'],
  CLOSED: ['REJECTED', 'CANCELLED', 'ENROLLED']
};

export const FOLLOW_UP_TYPES = ['CALL', 'WHATSAPP', 'EMAIL', 'WALK_IN', 'SMS', 'OTHER'] as const;

export const DOCUMENT_TYPES = [
  'BIRTH_CERTIFICATE',
  'AADHAR',
  'TRANSFER_CERTIFICATE',
  'PHOTO',
  'MARKSHEET',
  'OTHER'
] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
export const CATEGORY_OPTIONS = ['GEN', 'OBC', 'SC', 'ST', 'EWS', 'OTHER'];
export const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
export const BOARD_OPTIONS = ['CBSE', 'ICSE', 'BSE Odisha', 'CHSE Odisha', 'State board', 'Other'];
export const MEDIUM_OPTIONS = ['English', 'Odia', 'Hindi', 'Other'];
export const ASSIGNMENT_MODE_OPTIONS = [
  { label: 'Manual assignment', value: 'MANUAL' },
  { label: 'Round robin', value: 'ROUND_ROBIN' }
];
export const REMINDER_MODE_OPTIONS = [
  { label: 'Automatic', value: 'AUTO' },
  { label: 'Manual', value: 'MANUAL' }
];
export const REMINDER_LEAD_OPTIONS = [
  { label: 'Same day', value: '0H' },
  { label: '24 hours', value: '24H' },
  { label: '48 hours', value: '48H' }
];

export const INDIAN_MOBILE_PATTERN = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
export const INDIAN_PIN_PATTERN = /^[1-9]\d{5}$/;
export const AADHAAR_PATTERN = /^\d{12}$/;

export function formatAdmissionsLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
