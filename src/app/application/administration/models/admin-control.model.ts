export type AdminWorkspacePage = 'dashboard' | 'organizations' | 'access' | 'monitoring' | 'audit';
export type AdminTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface AdminSection {
  id: number;
  code: string;
  label: string;
  description: string;
  route: string;
  icon: string;
  order: number;
}

export interface AdminKpi {
  key: string;
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: AdminTone;
}

export interface AdminOrganizationSummary {
  schools: number;
  colleges: number;
  branches: number;
  departments: number;
  students: number;
  staff: number;
  parents: number;
  activeMemberships: number;
}

export interface AdminOrganization {
  orgId: number;
  orgCode: string;
  orgName: string;
  brandName?: string;
  orgType?: string;
  city?: string;
  state?: string;
  tenantId?: string;
  subscriptionType?: string;
  active?: boolean;
  ownerName?: string;
  ownerEmail?: string;
  establishDate?: string;
  branches: number;
  students: number;
  staff: number;
  activeUsers: number;
  storageUsedMb: number;
  storageLimitMb: number;
  apiUsageToday: number;
  healthScore: number;
}

export interface AdminBranch {
  id: number;
  branchCode: string;
  branchName: string;
  location?: string;
  active?: boolean;
  organizationId?: number;
  staff: number;
  students: number;
}

export interface AdminRole {
  roleId: number;
  roleCode: string;
  roleName: string;
  description?: string;
  active?: boolean;
  roleType?: string;
  users: number;
  permissionAssignments: number;
}

export interface AdminUserAccess {
  id: number;
  userCode: string;
  fullName: string;
  userName: string;
  email: string;
  blocked?: boolean;
  firstTimeLogin?: boolean;
  emailVerified?: boolean;
  lastLoginDate?: string;
  roles: string[];
  organizations: string[];
  invitationStatus: 'PENDING' | 'ACCEPTED' | string;
}

export interface AdminMenuSection {
  menuId: number;
  menuCode: string;
  name: string;
  icon: string;
  active?: boolean;
  activePages: number;
  totalPages: number;
  pages: AdminSection[];
}

export interface AdminPermissionCell {
  privilegeId: number;
  privilegeName: string;
  assignedPages: number;
  totalPages: number;
  assigned: boolean;
}

export interface AdminPermissionMatrixRow {
  roleId: number;
  roleCode: string;
  roleName: string;
  permissions: AdminPermissionCell[];
}

export interface AdminMonitoringWidget {
  key: string;
  label: string;
  value: string;
  helper: string;
  status: string;
  icon: string;
  tone: AdminTone;
}

export interface AdminSystemEvent {
  id: number;
  organizationId?: number;
  tenantCode?: string;
  category: string;
  component: string;
  eventCode: string;
  title: string;
  message?: string;
  severity: string;
  status: string;
  metricName?: string;
  metricValue?: number;
  metricUnit?: string;
  resolved?: boolean;
  occurredAt: string;
}

export interface AdminMonitoring {
  healthScore: number;
  databaseStatus: string;
  openEvents: number;
  criticalEvents: number;
  failedSecurityEvents: number;
  widgets: AdminMonitoringWidget[];
  jobs: AdminSystemEvent[];
  notifications: AdminSystemEvent[];
  dataIntegrity: AdminSystemEvent[];
}

export interface AdminActivity {
  title: string;
  description: string;
  actor: string;
  icon: string;
  tone: AdminTone;
  occurredAt: string;
}

export interface AdminAuditEvent {
  id: number;
  eventType: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorUsername?: string;
  sourceIp?: string;
  summary?: string;
  changes?: string;
  occurredAt: string;
}

export interface AdminSecurityEvent {
  id: number;
  eventCode: string;
  username?: string;
  sourceIp?: string;
  success: boolean;
  severity: string;
  message?: string;
  occurredAt: string;
}

export interface AdminControlCenter {
  generatedAt: string;
  adminSections: AdminSection[];
  kpis: AdminKpi[];
  organizationSummary: AdminOrganizationSummary;
  organizations: AdminOrganization[];
  branches: AdminBranch[];
  roles: AdminRole[];
  users: AdminUserAccess[];
  menuSections: AdminMenuSection[];
  permissionMatrix: AdminPermissionMatrixRow[];
  monitoring: AdminMonitoring;
  activities: AdminActivity[];
  auditLogs: AdminAuditEvent[];
  securityEvents: AdminSecurityEvent[];
  systemEvents: AdminSystemEvent[];
}

export interface AdminOrganizationCreatePayload {
  tenantName: string;
  displayName: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName?: string;
  adminLastName?: string;
  adminMobile?: string;
  organizationType?: string;
  subscriptionType?: string;
  maxUsers?: number;
  storageLimitMb?: number;
  city?: string;
  state?: string;
  establishDate?: string | null;
}

export interface AdminUserCreatePayload {
  userName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobileNumber: number | null;
  roles: string[];
  organizationIds: number[];
}