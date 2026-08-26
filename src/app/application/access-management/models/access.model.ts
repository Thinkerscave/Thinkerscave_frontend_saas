/** Access Management — types aligned with backend /api/access/* DTOs */

export type RoleType =
  | 'SUPER_ADMIN' | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'STAFF' | 'STUDENT' | 'PARENT';

export type MenuType = 'MODULE' | 'PAGE';
export type MenuScope = 'PLATFORM' | 'CORE' | 'SUBSCRIPTION';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED';
export type LoginStatus = 'SUCCESS' | 'FAILED' | 'LOCKED' | 'LOGGED_OUT';

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

export interface AccessRole {
  id: number;
  roleCode: string;
  roleName: string;
  description?: string;
  roleType?: RoleType;
  dashboardCode?: string;
  systemRole?: boolean;
  active?: boolean;
  displayOrder?: number;
  activeUserCount?: number;
  createdOn?: string;
  updatedOn?: string;
}

export interface AccessMenu {
  id: number;
  menuCode: string;
  menuName: string;
  description?: string;
  route?: string;
  icon?: string;
  menuType?: MenuType;
  parentMenuId?: number;
  parentMenuName?: string;
  displayOrder?: number;
  showInSidebar?: boolean;
  active?: boolean;
  defaultPage?: boolean;
  menuScope?: MenuScope;
  featureId?: number;
  featureCode?: string;
  featureName?: string;
  featureIcon?: string;
  children?: AccessMenu[];
}

export interface PermissionMatrixRow {
  menuId: number;
  menuCode: string;
  menuName: string;
  menuType?: string;
  parentMenuId?: number;
  parentMenuName?: string;
  displayOrder?: number;
  canView: boolean;
  canManage: boolean;
  canApprove: boolean;
}

export interface PermissionMatrix {
  roleId?: number;
  responsibilityId?: number;
  roleCode?: string;
  roleName?: string;
  responsibilityCode?: string;
  responsibilityName?: string;
  organizationId: number;
  rows: PermissionMatrixRow[];
}

export interface PasswordResetResult {
  temporaryPassword?: string;
  username?: string;
  message?: string;
}

export interface AccessResponsibility {
  responsibilityId: number;
  responsibilityCode: string;
  responsibilityName: string;
  description?: string;
  displayOrder?: number;
  systemDefined?: boolean;
  active: boolean;
  remarks?: string;
  createdOn?: string;
  updatedOn?: string;
}

export interface AccessResponsibilityRequest {
  responsibilityCode: string;
  responsibilityName: string;
  description?: string;
  remarks?: string;
}

export interface ResponsibilityStaffAssignment {
  assignmentId: number;
  staffId: number;
  staffName?: string;
  staffCode?: string;
  userId?: number | null;
  responsibilityId: number;
  effectiveFrom?: string;
  active?: boolean;
}

export interface EffectivePermission {
  menuId: number;
  menuCode: string;
  menuName: string;
  menuType?: string;
  parentMenuId?: number;
  parentMenuName?: string;
  canView: boolean;
  canManage: boolean;
  canApprove: boolean;
  isOverride?: boolean;
}

export interface AccessUser {
  id: number;
  userCode?: string;
  username: string;
  email: string;
  mobileNumber?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  status?: UserStatus;
  accountLocked?: boolean;
  firstTimeLogin?: boolean;
  lastLoginAt?: string;
  createdOn?: string;
  lockedAt?: string;
  roles?: AccessUserRole[];
}

export interface AccessUserRole {
  roleId: number;
  roleName: string;
  roleCode: string;
  roleType?: string;
  primaryRole?: boolean;
}

export interface SecurityPolicy {
  id?: number;
  organizationId?: number;
  minPasswordLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  passwordExpiryDays?: number;
  passwordHistoryCount?: number;
  maxFailedAttempts?: number;
  lockoutDurationMinutes?: number;
  sessionTimeoutMinutes?: number;
  maxConcurrentSessions?: number;
  allowRememberMe?: boolean;
  requireTwoFactor?: boolean;
  active?: boolean;
}

export interface LoginHistoryEntry {
  id: number;
  userId?: number;
  username?: string;
  displayName?: string;
  status?: LoginStatus;
  loginTime?: string;
  logoutTime?: string;
  ipAddress?: string;
  browser?: string;
  operatingSystem?: string;
  failureReason?: string;
}

export interface CreateMenuPayload {
  menuCode: string;
  menuName: string;
  description?: string;
  route?: string;
  icon?: string;
  menuType: MenuType;
  parentMenuId?: number | null;
  displayOrder?: number;
  showInSidebar?: boolean;
  defaultPage?: boolean;
  active?: boolean;
  menuScope?: MenuScope;
  featureId?: number | null;
}

export interface UpdateMenuPayload {
  menuName: string;
  description?: string;
  route?: string;
  icon?: string;
  parentMenuId?: number | null;
  displayOrder?: number;
  showInSidebar?: boolean;
  defaultPage?: boolean;
  active?: boolean;
  menuScope?: MenuScope;
  featureId?: number | null;
}

export interface CreateRolePayload {
  roleCode: string;
  roleName: string;
  description?: string;
  roleType: RoleType;
  dashboardCode?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface UpdateRolePayload {
  roleName?: string;
  description?: string;
  dashboardCode?: string;
  displayOrder?: number;
}

export interface PermissionUpdateRow {
  menuId: number;
  canView: boolean;
  canManage: boolean;
  canApprove: boolean;
}

export interface UserPermissionOverride {
  menuId: number;
  canView: boolean;
  canManage: boolean;
  canApprove: boolean;
  active?: boolean;
}

export interface AccessDashboardSummary {
  totalRoles: number;
  activeRoles: number;
  totalUsers: number;
  activeUsers: number;
  totalMenus: number;
  activeMenus: number;
  lockedUsers: number;
  totalResponsibilities?: number;
  activeResponsibilities?: number;
  roles?: AccessRole[];
  responsibilities?: AccessResponsibility[];
}
