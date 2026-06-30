import {
  DiscountType,
  InstitutionType,
  OrganizationStatus,
  PromotionStatus,
  ProvisionJobStatus,
  ProvisionStatus,
  SubscriptionStatus
} from '../models/platform.model';

const INSTITUTION_LABELS: Record<InstitutionType, string> = {
  PRE_SCHOOL: 'Pre School',
  PRIMARY_SCHOOL: 'Primary School',
  HIGH_SCHOOL: 'High School',
  HIGHER_SECONDARY: 'Higher Secondary',
  SCHOOL: 'School',
  COLLEGE: 'College',
  UNIVERSITY: 'University',
  COACHING: 'Coaching',
  TRAINING_INSTITUTE: 'Training Institute',
  OTHER: 'Other'
};

const STATUS_LABELS: Record<OrganizationStatus, string> = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived'
};

const SUB_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  SUSPENDED: 'Suspended'
};

export function institutionLabel(type?: InstitutionType | string | null): string {
  if (!type) return '—';
  return INSTITUTION_LABELS[type as InstitutionType] ?? String(type).replace(/_/g, ' ');
}

export function organizationStatusLabel(status?: OrganizationStatus | string | null): string {
  if (!status) return '—';
  return STATUS_LABELS[status as OrganizationStatus] ?? String(status);
}

export function subscriptionStatusLabel(status?: SubscriptionStatus | string | null): string {
  if (!status) return '—';
  return SUB_STATUS_LABELS[status as SubscriptionStatus] ?? String(status);
}

export function orgInitials(name?: string | null): string {
  if (!name?.trim()) return 'OR';
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'OR';
}

export function statusTone(status?: OrganizationStatus | string | null): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'PENDING': return 'warning';
    case 'SUSPENDED':
    case 'ARCHIVED': return 'danger';
    case 'INACTIVE': return 'neutral';
    default: return 'neutral';
  }
}

export function subscriptionTone(status?: SubscriptionStatus | string | null): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'TRIAL': return 'info';
    case 'EXPIRED':
    case 'CANCELLED':
    case 'SUSPENDED': return 'danger';
    default: return 'neutral';
  }
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Percentage',
  FLAT: 'Flat amount',
  FREE_MONTHS: 'Free months'
};

const PROMOTION_STATUS_LABELS: Record<PromotionStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived'
};

const PROVISION_JOB_STATUS_LABELS: Record<ProvisionJobStatus, string> = {
  QUEUED: 'Queued',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled'
};

const PROVISION_STATUS_LABELS: Record<ProvisionStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  MAINTENANCE: 'Maintenance'
};

export function discountTypeLabel(type?: DiscountType | string | null): string {
  if (!type) return '—';
  return DISCOUNT_TYPE_LABELS[type as DiscountType] ?? String(type).replace(/_/g, ' ');
}

export function promotionStatusLabel(status?: PromotionStatus | string | null): string {
  if (!status) return '—';
  return PROMOTION_STATUS_LABELS[status as PromotionStatus] ?? String(status);
}

export function promotionTone(status?: PromotionStatus | string | null): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'DRAFT': return 'info';
    case 'EXPIRED': return 'warning';
    case 'ARCHIVED': return 'neutral';
    default: return 'neutral';
  }
}

export function provisionJobStatusLabel(status?: ProvisionJobStatus | string | null): string {
  if (!status) return '—';
  return PROVISION_JOB_STATUS_LABELS[status as ProvisionJobStatus] ?? String(status).replace(/_/g, ' ');
}

export function provisionJobTone(status?: ProvisionJobStatus | string | null): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS':
    case 'QUEUED': return 'info';
    case 'FAILED':
    case 'CANCELLED': return 'danger';
    default: return 'neutral';
  }
}

export function provisionStatusLabel(status?: ProvisionStatus | string | null): string {
  if (!status) return '—';
  return PROVISION_STATUS_LABELS[status as ProvisionStatus] ?? String(status).replace(/_/g, ' ');
}

export function provisionStatusTone(status?: ProvisionStatus | string | null): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'IN_PROGRESS':
    case 'PENDING': return 'info';
    case 'MAINTENANCE': return 'warning';
    case 'FAILED': return 'danger';
    default: return 'neutral';
  }
}

export function formatDiscountValue(type?: DiscountType | string | null, value?: number | null): string {
  if (value == null) return '—';
  switch (type) {
    case 'PERCENTAGE': return `${value}%`;
    case 'FLAT': return formatCurrency(value);
    case 'FREE_MONTHS': return value === 1 ? '1 month' : `${value} months`;
    default: return String(value);
  }
}

export function formatStorageMb(mb?: number | null): string {
  if (mb == null) return '—';
  if (mb < 1024) return `${mb.toLocaleString()} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function formatCurrency(amount?: number | null, currency = 'INR'): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function healthScore(tenant?: { provisionStatus?: string; maintenanceMode?: boolean } | null): number {
  if (!tenant) return 0;
  if (tenant.maintenanceMode) return 45;
  if (tenant.provisionStatus === 'FAILED') return 20;
  if (tenant.provisionStatus === 'IN_PROGRESS' || tenant.provisionStatus === 'PENDING') return 60;
  if (tenant.provisionStatus === 'MAINTENANCE') return 50;
  return 92;
}

export function healthTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 85) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}
