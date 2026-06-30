import { LoginStatus, RoleType, UserStatus } from '../models/access.model';

const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: 'Super Admin',
  ORGANIZATION_OWNER: 'Organization Owner',
  ORGANIZATION_ADMIN: 'Organization Admin',
  STAFF: 'Staff',
  STUDENT: 'Student',
  PARENT: 'Parent'
};

const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  LOCKED: 'Locked',
  SUSPENDED: 'Suspended'
};

const LOGIN_STATUS_LABELS: Record<LoginStatus, string> = {
  SUCCESS: 'Success',
  FAILED: 'Failed',
  LOCKED: 'Locked',
  LOGGED_OUT: 'Logged out'
};

export function roleTypeLabel(type?: RoleType | string | null): string {
  if (!type) return '—';
  return ROLE_TYPE_LABELS[type as RoleType] ?? String(type).replace(/_/g, ' ');
}

export function userStatusLabel(status?: UserStatus | string | null): string {
  if (!status) return '—';
  return USER_STATUS_LABELS[status as UserStatus] ?? String(status);
}

export function loginStatusLabel(status?: LoginStatus | string | null): string {
  if (!status) return '—';
  return LOGIN_STATUS_LABELS[status as LoginStatus] ?? String(status);
}

export function userStatusTone(status?: UserStatus | string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'LOCKED':
    case 'SUSPENDED': return 'danger';
    case 'INACTIVE': return 'warning';
    default: return 'neutral';
  }
}

export function loginStatusTone(status?: LoginStatus | string | null): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'SUCCESS': return 'success';
    case 'FAILED': return 'danger';
    case 'LOCKED': return 'warning';
    default: return 'neutral';
  }
}

export function userDisplayName(user: { displayName?: string; firstName?: string; lastName?: string; username?: string }): string {
  return user.displayName?.trim()
    || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
    || user.username
    || '—';
}

export function userInitials(user: { displayName?: string; firstName?: string; lastName?: string; username?: string }): string {
  const name = userDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
