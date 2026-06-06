import { AdminOrganization } from '../../administration/models/admin-control.model';

export type TenantStatus = 'active' | 'trial' | 'suspended' | 'expired';
export type TenantHealth = 'healthy' | 'at-risk' | 'critical' | 'unknown';
export type PlanTier = 'starter' | 'professional' | 'enterprise' | 'custom' | 'unknown';

export interface TenantOrgView {
  id: number;
  code: string;
  name: string;
  initials: string;
  brand: string;
  type: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  domain: string;
  plan: string;
  planTier: PlanTier;
  status: TenantStatus;
  statusLabel: string;
  users: number;
  branches: number;
  students: number;
  staff: number;
  storageUsedMb: number;
  storageLimitMb: number;
  storagePercent: number;
  storageLabel: string;
  apiUsageToday: number;
  healthScore: number;
  healthLabel: string;
  health: TenantHealth;
  createdDate: string;
  expiryDate: string;
  expiryStatus: 'ok' | 'soon' | 'expired' | 'unknown';
  lastActivity: string;
  source: AdminOrganization;
}

const NA = '—';

export function initialsOf(name: string): string {
  if (!name) return 'OR';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? '').join('') || 'OR';
}

export function resolvePlanTier(plan?: string | null): PlanTier {
  const v = (plan || '').toLowerCase();
  if (v.includes('start') || v.includes('trial') || v.includes('free')) return 'starter';
  if (v.includes('pro')) return 'professional';
  if (v.includes('enter') || v.includes('premium')) return 'enterprise';
  if (v.includes('custom')) return 'custom';
  if (!v) return 'unknown';
  return 'custom';
}

export function resolveStatus(org: AdminOrganization): { status: TenantStatus; label: string } {
  if (org.active === false) return { status: 'suspended', label: 'Suspended' };
  const sub = (org.subscriptionType || '').toLowerCase();
  if (sub.includes('trial')) return { status: 'trial', label: 'Trial' };
  return { status: 'active', label: 'Active' };
}

export function resolveHealth(score: number): { health: TenantHealth; label: string } {
  if (!score || score < 0) return { health: 'unknown', label: 'Not tracked' };
  if (score >= 85) return { health: 'healthy', label: 'Healthy' };
  if (score >= 60) return { health: 'at-risk', label: 'Needs attention' };
  return { health: 'critical', label: 'Critical' };
}

export function storagePercent(used: number, limit: number): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function formatStorage(mb: number): string {
  if (!mb || mb <= 0) return '0 MB';
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export function mapOrganization(src: AdminOrganization): TenantOrgView {
  const { status, label } = resolveStatus(src);
  const health = resolveHealth(src.healthScore);
  const used = src.storageUsedMb ?? 0;
  const limit = src.storageLimitMb ?? 0;
  const pct = storagePercent(used, limit);
  const location = [src.city, src.state].filter(Boolean).join(', ') || NA;
  return {
    id: src.orgId,
    code: src.orgCode || `ORG-${src.orgId}`,
    name: src.brandName || src.orgName,
    initials: initialsOf(src.brandName || src.orgName),
    brand: src.brandName || src.orgName,
    type: src.orgType || 'Organization',
    location,
    ownerName: src.ownerName || NA,
    ownerEmail: src.ownerEmail || NA,
    domain: src.tenantId ? `${src.tenantId}.thinkerscave.app` : NA,
    plan: src.subscriptionType || 'Starter',
    planTier: resolvePlanTier(src.subscriptionType),
    status,
    statusLabel: label,
    users: src.activeUsers ?? 0,
    branches: src.branches ?? 0,
    students: src.students ?? 0,
    staff: src.staff ?? 0,
    storageUsedMb: used,
    storageLimitMb: limit,
    storagePercent: pct,
    storageLabel: limit > 0 ? `${formatStorage(used)} / ${formatStorage(limit)}` : formatStorage(used),
    apiUsageToday: src.apiUsageToday ?? 0,
    healthScore: src.healthScore ?? 0,
    healthLabel: health.label,
    health: health.health,
    createdDate: src.establishDate || NA,
    expiryDate: NA,
    expiryStatus: 'unknown',
    lastActivity: NA,
    source: src
  };
}

export function tenantKpis(views: TenantOrgView[]) {
  return {
    total: views.length,
    active: views.filter(v => v.status === 'active').length,
    trial: views.filter(v => v.status === 'trial').length,
    suspended: views.filter(v => v.status === 'suspended').length,
    expiringSoon: views.filter(v => v.expiryStatus === 'soon').length
  };
}
