import { PermissionService } from '../../../core/services/permission.service';
import { LoginService } from '../../../core/services/login.service';

/** Menu codes used by PermissionService for Access Management pages. */
export const ACCESS_RESOURCES = {
  users: 'ACCESS_USERS',
  responsibilities: 'ACCESS_RESPONSIBILITIES',
  menus: 'ACCESS_MENU_CATALOG',
  loginHistory: 'ACCESS_LOGIN_HISTORY',
  securityPolicy: 'ACCESS_SECURITY_POLICY'
} as const;

const ALIASES: Record<string, string[]> = {
  ACCESS_USERS: ['ACCESS_USERS', 'USERS', 'USERS_ACCESS', 'ACCESS_MANAGEMENT_USERS'],
  ACCESS_RESPONSIBILITIES: ['ACCESS_RESPONSIBILITIES', 'RESPONSIBILITIES'],
  ACCESS_MENU_CATALOG: ['ACCESS_MENU_CATALOG', 'MENU_CATALOG', 'ACCESS_MENUS'],
  ACCESS_LOGIN_HISTORY: ['ACCESS_LOGIN_HISTORY', 'LOGIN_HISTORY'],
  ACCESS_SECURITY_POLICY: ['ACCESS_SECURITY_POLICY', 'SECURITY_POLICY']
};

function permissionFor(permissions: PermissionService, resource: string) {
  for (const code of ALIASES[resource] ?? [resource]) {
    const perm = permissions.getPermission(code);
    if (perm) return perm;
  }
  return undefined;
}

/** True when the current user may create/edit/lock/reset on this Access page. */
export function accessCanManage(
  permissions: PermissionService,
  _login: LoginService,
  resource: string
): boolean {
  if (permissions.canManage(resource)) return true;
  const perm = permissionFor(permissions, resource);
  return !!perm?.canManage;
}

/** True when the current user may open this Access page. */
export function accessCanView(
  permissions: PermissionService,
  _login: LoginService,
  resource: string
): boolean {
  if (permissions.canView(resource) || permissions.canManage(resource)) return true;
  const perm = permissionFor(permissions, resource);
  return !!perm && (!!perm.canView || !!perm.canManage);
}
