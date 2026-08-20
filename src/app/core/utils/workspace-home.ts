/** Normalize a role token the same way roleGuard / top-bar do. */
export function normalizeRoleToken(role: unknown): string {
  return String(role ?? '')
    .trim()
    .replace(/^ROLE_/i, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

export function roleTokensFromUser(user: unknown): string[] {
  const u = user as {
    role?: unknown;
    roleCode?: unknown;
    roleName?: unknown;
    roles?: unknown[];
  } | null;
  const roles = [u?.role, u?.roleCode, u?.roleName, ...(Array.isArray(u?.roles) ? u.roles : [])];
  return roles
    .flatMap((role: unknown) => {
      if (role && typeof role === 'object') {
        const r = role as { roleType?: unknown; roleCode?: unknown; roleName?: unknown; name?: unknown };
        return [r.roleType, r.roleCode, r.roleName, r.name];
      }
      return [role];
    })
    .filter(Boolean)
    .map((role) => normalizeRoleToken(role));
}

function hasAny(tokens: string[], candidates: string[]): boolean {
  return candidates.some((c) => tokens.includes(c));
}

/**
 * Post-login / logo / unauthorized home.
 * Students and teaching staff skip `/app` when that dashboard 403s for their role.
 */
export function resolveWorkspaceHome(tokens: string[], isPlatform = false): string {
  if (isPlatform || hasAny(tokens, ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'THINKERSCAVE_INTERNAL', 'INTERNAL_TEAM'])) {
    return '/app/tenant-management/dashboard';
  }
  if (hasAny(tokens, ['STUDENT', 'PARENT'])) {
    return '/app/academics/my-academics';
  }
  if (hasAny(tokens, ['TEACHER', 'STAFF']) && !isOrgSetupRole(tokens)) {
    return '/app/academics/my-classes';
  }
  return '/app';
}

export function workspaceHomeForUser(user: unknown, isPlatform = false): string {
  return resolveWorkspaceHome(roleTokensFromUser(user), isPlatform);
}

/** First Academics page for `/app/academics`. */
export function resolveAcademicsEntry(tokens: string[]): string {
  if (hasAny(tokens, ['STUDENT', 'PARENT'])) {
    return '/app/academics/my-academics';
  }
  if (hasAny(tokens, ['TEACHER', 'STAFF']) && !hasAny(tokens, [
    'ORGANIZATION_ADMIN',
    'ORGANIZATION_OWNER',
    'INSTITUTION_ADMIN',
    'COLLEGE_ADMIN',
    'ADMIN',
    'PRINCIPAL'
  ])) {
    return '/app/academics/my-classes';
  }
  return '/app/academics/academic-year';
}

export function isOrgSetupRole(tokens: string[]): boolean {
  return hasAny(tokens, [
    'SUPER_ADMIN',
    'PLATFORM_ADMIN',
    'ORGANIZATION_ADMIN',
    'ORGANIZATION_OWNER',
    'INSTITUTION_ADMIN',
    'COLLEGE_ADMIN',
    'ADMIN',
    'PRINCIPAL'
  ]);
}

export type GlobalSearchScope = 'hidden' | 'platform' | 'organization' | 'teacher';

export function resolveGlobalSearchScope(tokens: string[], isPlatform = false): GlobalSearchScope {
  if (hasAny(tokens, ['STUDENT', 'PARENT'])) {
    return 'hidden';
  }
  if (isPlatform || hasAny(tokens, ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'THINKERSCAVE_INTERNAL', 'INTERNAL_TEAM'])) {
    return 'platform';
  }
  if (isOrgSetupRole(tokens) || hasAny(tokens, ['HR_MANAGER', 'ACADEMIC_COORDINATOR', 'RECEPTIONIST'])) {
    return 'organization';
  }
  if (hasAny(tokens, ['TEACHER', 'STAFF'])) {
    return 'teacher';
  }
  return 'organization';
}

export function globalSearchPlaceholder(scope: GlobalSearchScope): string {
  if (scope === 'platform') return 'Search customers, organizations or menus';
  if (scope === 'organization') return 'Search students, staff, classes or pages';
  if (scope === 'teacher') return 'Search students';
  return 'Search';
}
