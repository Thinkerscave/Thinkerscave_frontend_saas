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
    description: 'Review submitted applications, approve, then enroll into class.',
    icon: 'pi pi-file-edit',
    route: '/app/admissions/applications'
  },
  {
    page: 'reports',
    label: 'Reports',
    title: 'Admissions Report',
    description: 'Management view of funnel health, conversion, and counselor performance.',
    icon: 'pi pi-chart-line',
    route: '/app/admissions/reports'
  },
  {
    page: 'settings',
    label: 'Settings',
    title: 'Settings',
    description: 'Documents, counselor assignment, and numbering for this school.',
    icon: 'pi pi-cog',
    route: '/app/admissions/settings'
  }
];

export function admissionsPageConfig(page: AdmissionsWorkspacePage): AdmissionsPageConfig {
  return ADMISSIONS_PAGES.find(p => p.page === page) ?? ADMISSIONS_PAGES[0];
}

export const LEAD_STATUS_OPTIONS = [
  'NEW', 'CONTACTED', 'INTERESTED', 'APPLICATION_STARTED',
  'APPLICATION_SUBMITTED', 'LOST'
] as const;

export const LEAD_SOURCE_OPTIONS = [
  'WEBSITE', 'PHONE', 'WALK_IN', 'REFERRAL', 'WHATSAPP',
  'SOCIAL_MEDIA', 'CAMPAIGN', 'AFFILIATE', 'IMPORT', 'OTHER'
];

export const APPLICATION_STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'ACTION_REQUIRED', label: 'Needs Correction' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ENROLLED', label: 'Enrolled' }
] as const;

export const APPLICATION_STATUS_GROUPS: Record<string, string[]> = {
  DRAFT: ['DRAFT'],
  /** Submitted applications waiting for document checks / decision */
  IN_REVIEW: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'FEE_PENDING'],
  ACTION_REQUIRED: ['ACTION_REQUIRED'],
  APPROVED: ['APPROVED'],
  ENROLLED: ['ENROLLED']
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

export const IDENTITY_TYPES = [
  { label: 'Aadhaar', value: 'AADHAAR' },
  { label: 'Passport', value: 'PASSPORT' },
  { label: 'Voter ID', value: 'VOTER_ID' },
  { label: 'Other', value: 'OTHER' }
] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
export const CATEGORY_OPTIONS = ['GEN', 'OBC', 'SC', 'ST', 'EWS', 'OTHER'];
export const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
export const BOARD_OPTIONS = ['CBSE', 'ICSE', 'BSE Odisha', 'CHSE Odisha', 'State board', 'Other'];
export const MEDIUM_OPTIONS = ['English', 'Odia', 'Hindi', 'Other'];
export const ASSIGNMENT_MODE_OPTIONS = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Auto', value: 'ROUND_ROBIN' }
];

export const DURATION_DAY_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 14].map(days => ({
  label: days === 1 ? '1 day' : `${days} days`,
  value: String(days)
}));

export type DocumentConfigMode = 'OFF' | 'OPTIONAL' | 'MANDATORY';

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
export const CONTACT_RELATIONSHIP_OPTIONS = ['Father', 'Mother', 'Guardian', 'Other'];
export const TRISTATE_OPTIONS = [
  { label: 'Yes', value: 'YES' },
  { label: 'No', value: 'NO' },
  { label: 'Not Sure', value: 'NOT_SURE' }
];
export const LOST_REASON_OPTIONS = [
  'Chose another school',
  'Budget / fee concerns',
  'Location / distance',
  'Timeline mismatch',
  'Non-responsive',
  'Other'
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

export function normalizeDocumentType(value: string | null | undefined): string {
  return (value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

/** Nursery / KG / Class 1 style entry — typically no marksheet or TC. */
export function isEarlyEntryClass(className: string | null | undefined): boolean {
  const n = (className || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!n) return false;
  if (/\b(nursery|pre kg|prekg|lkg|ukg|kg|prep|pre primary|play group|playgroup)\b/.test(n)) {
    return true;
  }
  return /\b(class|grade|std|standard)\s*(i|1)\b/.test(n) || /^(i|1)$/.test(n);
}

/**
 * Settings-driven required docs with conditional overrides:
 * - Early entry (Nursery–Class 1): drop MARKSHEET; drop TC unless previous schooling
 * - Previous schooling / TC number / previous school name: force TRANSFER_CERTIFICATE
 */
export function resolveRequiredDocuments(options: {
  configured: string[];
  className?: string | null;
  hasPreviousSchooling?: boolean | null;
  tcNumber?: string | null;
  previousSchoolName?: string | null;
}): string[] {
  const configured = (options.configured || [])
    .map(normalizeDocumentType)
    .filter(t => !!t && t !== 'OTHER');

  const early = isEarlyEntryClass(options.className);
  const hasPrev = !!options.hasPreviousSchooling
    || !!(options.tcNumber || '').trim()
    || !!(options.previousSchoolName || '').trim();

  let types = [...configured];
  if (early) {
    types = types.filter(t => t !== 'MARKSHEET');
    if (!hasPrev) {
      types = types.filter(t => t !== 'TRANSFER_CERTIFICATE');
    }
  }
  if (hasPrev && !types.includes('TRANSFER_CERTIFICATE')) {
    types.push('TRANSFER_CERTIFICATE');
  }

  return Array.from(new Set(types));
}

export function isAdditionalDocumentType(documentType: string | null | undefined): boolean {
  const key = normalizeDocumentType(documentType);
  return !key || key === 'OTHER' || key.startsWith('OTHER_') || key.startsWith('ADDITIONAL');
}
