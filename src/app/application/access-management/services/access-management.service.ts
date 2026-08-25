import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { accessApi, staffApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { LoginService } from '../../../core/services/login.service';
import {
  AccessDashboardSummary,
  AccessMenu,
  AccessResponsibility,
  AccessResponsibilityRequest,
  AccessRole,
  AccessUser,
  CreateMenuPayload,
  CreateRolePayload,
  EffectivePermission,
  LoginHistoryEntry,
  LoginStatus,
  PasswordResetResult,
  PermissionMatrix,
  PermissionUpdateRow,
  RoleType,
  SecurityPolicy,
  SpringPage,
  UpdateMenuPayload,
  UpdateRolePayload,
  UserPermissionOverride,
  UserStatus
} from '../models/access.model';

@Injectable({ providedIn: 'root' })
export class AccessManagementService {
  private readonly http = inject(HttpClient);
  private readonly loginService = inject(LoginService);

  organizationId(): number {
    const stored = this.loginService.getCurrentOrganizationId();
    if (stored && !Number.isNaN(Number(stored))) return Number(stored);
    return environment.defaultOrganizationId ?? 1;
  }

  getDashboardSummary(): Observable<AccessDashboardSummary> {
    const orgId = this.organizationId();
    return forkJoin({
      responsibilities: this.getResponsibilities({ page: 0, size: 50 }).pipe(
        catchError(() => of({ content: [] as AccessResponsibility[], totalElements: 0, totalPages: 0, number: 0, size: 50 }))
      ),
      users: this.searchUsers(orgId, {}, 0, 1),
      menus: this.getMenuTree().pipe(catchError(() => of([] as AccessMenu[])))
    }).pipe(
      map(({ responsibilities, users, menus }) => {
        const flatMenus = this.flattenMenus(menus);
        const list = responsibilities.content ?? [];
        const activeResponsibilities = list.filter(r => r.active !== false).length;
        const userList = users.content ?? [];
        const lockedUsers = userList.filter(u => u.accountLocked || u.status === 'LOCKED').length;
        return {
          totalRoles: 0,
          activeRoles: 0,
          totalUsers: users.totalElements ?? userList.length,
          activeUsers: userList.filter(u => u.status === 'ACTIVE').length,
          totalMenus: flatMenus.length,
          activeMenus: flatMenus.filter(m => m.active !== false).length,
          lockedUsers,
          totalResponsibilities: responsibilities.totalElements ?? list.length,
          activeResponsibilities,
          responsibilities: list
        };
      })
    );
  }

  getRoles(includeInactive = false): Observable<AccessRole[]> {
    const params = includeInactive ? new HttpParams().set('includeInactive', 'true') : undefined;
    return this.http.get<unknown>(accessApi.roles, { params }).pipe(
      map(r => unwrapApiResponse<AccessRole[]>(r, []))
    );
  }

  searchRoles(active?: boolean, search?: string, page = 0, size = 50): Observable<SpringPage<AccessRole>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (active != null) params = params.set('active', String(active));
    if (search) params = params.set('search', search);
    return this.http.get<unknown>(accessApi.roleSearch, { params }).pipe(
      map(r => this.mapPageResponse<AccessRole>(r))
    );
  }

  getRole(id: number): Observable<AccessRole> {
    return this.http.get<unknown>(accessApi.roleById(id)).pipe(
      map(r => unwrapApiResponse<AccessRole>(r, {} as AccessRole))
    );
  }

  getRoleUsers(roleId: number, organizationId?: number): Observable<AccessUser[]> {
    let params = new HttpParams();
    if (organizationId != null) params = params.set('organizationId', String(organizationId));
    return this.http.get<unknown>(accessApi.roleUsers(roleId), { params }).pipe(
      map(r => unwrapApiResponse<AccessUser[]>(r, []))
    );
  }

  createRole(payload: CreateRolePayload): Observable<AccessRole> {
    return this.http.post<unknown>(accessApi.roles, payload).pipe(
      map(r => unwrapApiResponse<AccessRole>(r, {} as AccessRole))
    );
  }

  updateRole(id: number, payload: UpdateRolePayload): Observable<AccessRole> {
    return this.http.put<unknown>(accessApi.roleById(id), payload).pipe(
      map(r => unwrapApiResponse<AccessRole>(r, {} as AccessRole))
    );
  }

  activateRole(id: number): Observable<void> {
    return this.http.patch<unknown>(accessApi.activateRole(id), {}).pipe(map(() => undefined));
  }

  deactivateRole(id: number): Observable<void> {
    return this.http.patch<unknown>(accessApi.deactivateRole(id), {}).pipe(map(() => undefined));
  }

  getPermissionMatrix(roleId: number, organizationId = this.organizationId()): Observable<PermissionMatrix> {
    return this.http.get<unknown>(accessApi.rolePermissions(roleId, organizationId)).pipe(
      map(r => unwrapApiResponse<PermissionMatrix>(r, { roleId, organizationId, roleCode: '', roleName: '', rows: [] }))
    );
  }

  updatePermissionMatrix(roleId: number, permissions: PermissionUpdateRow[], organizationId = this.organizationId()): Observable<void> {
    return this.http.put<unknown>(accessApi.rolePermissions(roleId, organizationId), { permissions }).pipe(map(() => undefined));
  }

  getMenuTree(includeInactive = false): Observable<AccessMenu[]> {
    const params = includeInactive ? new HttpParams().set('includeInactive', 'true') : undefined;
    return this.http.get<unknown>(accessApi.menuTree, { params }).pipe(
      map(r => this.normalizeMenuTree(unwrapApiResponse<unknown>(r, [])))
    );
  }

  createMenu(payload: CreateMenuPayload): Observable<AccessMenu> {
    return this.http.post<unknown>(accessApi.menus, payload).pipe(
      map(r => unwrapApiResponse<AccessMenu>(r, {} as AccessMenu))
    );
  }

  updateMenu(id: number, payload: UpdateMenuPayload): Observable<AccessMenu> {
    return this.http.put<unknown>(accessApi.menuById(id), payload).pipe(
      map(r => unwrapApiResponse<AccessMenu>(r, {} as AccessMenu))
    );
  }

  deleteMenu(id: number): Observable<void> {
    return this.http.delete<unknown>(accessApi.menuById(id)).pipe(map(() => undefined));
  }

  activateMenu(id: number): Observable<void> {
    return this.http.patch<unknown>(accessApi.activateMenu(id), {}).pipe(map(() => undefined));
  }

  deactivateMenu(id: number): Observable<void> {
    return this.http.patch<unknown>(accessApi.deactivateMenu(id), {}).pipe(map(() => undefined));
  }

  searchUsers(
    organizationId = this.organizationId(),
    query: { status?: UserStatus; roleType?: RoleType; search?: string; sort?: string } = {},
    page = 0,
    size = 20
  ): Observable<SpringPage<AccessUser>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', query.sort || 'createdOn,desc');
    if (query.status) params = params.set('status', query.status);
    if (query.roleType) params = params.set('roleType', query.roleType);
    if (query.search) params = params.set('search', query.search);
    return this.http.get<unknown>(accessApi.orgUsers(organizationId), { params }).pipe(
      map(r => this.mapPageResponse<AccessUser>(r))
    );
  }

  getUser(organizationId: number, userId: number): Observable<AccessUser> {
    return this.http.get<unknown>(accessApi.orgUserById(organizationId, userId)).pipe(
      map(r => unwrapApiResponse<AccessUser>(r, {} as AccessUser))
    );
  }

  activateUser(userId: number, organizationId = this.organizationId()): Observable<void> {
    return this.http.patch<unknown>(accessApi.activateUser(organizationId, userId), {}).pipe(map(() => undefined));
  }

  deactivateUser(userId: number, organizationId = this.organizationId()): Observable<void> {
    return this.http.patch<unknown>(accessApi.deactivateUser(organizationId, userId), {}).pipe(map(() => undefined));
  }

  lockUser(userId: number, organizationId = this.organizationId()): Observable<void> {
    return this.http.patch<unknown>(accessApi.lockUser(organizationId, userId), {}).pipe(map(() => undefined));
  }

  unlockUser(userId: number, organizationId = this.organizationId()): Observable<void> {
    return this.http.patch<unknown>(accessApi.unlockUser(organizationId, userId), {}).pipe(map(() => undefined));
  }

  assignRole(userId: number, roleId: number, organizationId = this.organizationId()): Observable<void> {
    return this.http.post<unknown>(accessApi.assignRole(organizationId, userId, roleId), {}).pipe(map(() => undefined));
  }

  removeRole(userId: number, roleId: number, organizationId = this.organizationId()): Observable<void> {
    return this.http.delete<unknown>(accessApi.removeRole(organizationId, userId, roleId)).pipe(map(() => undefined));
  }

  getUserEffectivePermissions(userId: number, organizationId = this.organizationId()): Observable<EffectivePermission[]> {
    return this.http.get<unknown>(accessApi.userEffectivePermissions(organizationId, userId)).pipe(
      map(r => unwrapApiResponse<EffectivePermission[]>(r, []))
    );
  }

  updateUserPermissions(userId: number, overrides: UserPermissionOverride[], organizationId = this.organizationId()): Observable<void> {
    return this.http.put<unknown>(accessApi.userPermissions(userId, organizationId), { overrides }).pipe(map(() => undefined));
  }

  getSecurityPolicy(organizationId = this.organizationId()): Observable<SecurityPolicy> {
    return this.http.get<unknown>(accessApi.securityPolicy(organizationId)).pipe(
      map(r => unwrapApiResponse<SecurityPolicy>(r, {} as SecurityPolicy))
    );
  }

  saveSecurityPolicy(payload: SecurityPolicy, organizationId = this.organizationId()): Observable<SecurityPolicy> {
    const body: SecurityPolicy = { ...payload, requireTwoFactor: false };
    return this.http.put<unknown>(accessApi.securityPolicy(organizationId), body).pipe(
      map(r => unwrapApiResponse<SecurityPolicy>(r, body))
    );
  }

  resetSecurityPolicy(organizationId = this.organizationId()): Observable<void> {
    return this.http.post<unknown>(accessApi.resetSecurityPolicy(organizationId), {}).pipe(map(() => undefined));
  }

  getOrgLoginHistory(
    organizationId = this.organizationId(),
    query: { status?: LoginStatus; from?: string; to?: string } = {},
    page = 0,
    size = 20
  ): Observable<SpringPage<LoginHistoryEntry>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'loginTime,desc');
    if (query.status) params = params.set('status', query.status);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    return this.http.get<unknown>(accessApi.orgLoginHistory(organizationId), { params }).pipe(
      map(r => this.mapPageResponse<LoginHistoryEntry>(r))
    );
  }

  resetUserPassword(userId: number, organizationId = this.organizationId()): Observable<PasswordResetResult> {
    return this.http.post<unknown>(accessApi.resetUserPassword(organizationId, userId), {}).pipe(
      map(r => unwrapApiResponse<PasswordResetResult>(r, {}))
    );
  }

  getResponsibilities(query: { search?: string; page?: number; size?: number; sort?: string } = {}): Observable<SpringPage<AccessResponsibility>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 0))
      .set('size', String(query.size ?? 20))
      .set('sort', query.sort || 'createdOn,desc');
    if (query.search) params = params.set('search', query.search);
    return this.http.get<unknown>(staffApi.responsibilities, { params }).pipe(
      map(r => {
        const page = this.tryMapPage<AccessResponsibility>(r);
        if (page) return page;
        const list = unwrapApiResponse<AccessResponsibility[]>(r, []);
        const start = (query.page ?? 0) * (query.size ?? 20);
        const size = query.size ?? 20;
        const filtered = (query.search
          ? list.filter(item =>
            (item.responsibilityName || '').toLowerCase().includes(query.search!.toLowerCase())
            || (item.responsibilityCode || '').toLowerCase().includes(query.search!.toLowerCase()))
          : [...list]
        ).sort((a, b) => {
          const byDate = Date.parse(b.createdOn || '') - Date.parse(a.createdOn || '');
          return Number.isNaN(byDate) ? (b.responsibilityId || 0) - (a.responsibilityId || 0) : byDate;
        });
        return {
          content: filtered.slice(start, start + size),
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / size) || 0,
          number: query.page ?? 0,
          size
        };
      })
    );
  }

  getResponsibility(id: number): Observable<AccessResponsibility> {
    return this.http.get<unknown>(staffApi.responsibilityById(id)).pipe(
      map(r => unwrapApiResponse<AccessResponsibility>(r, {} as AccessResponsibility))
    );
  }

  createResponsibility(payload: AccessResponsibilityRequest): Observable<AccessResponsibility> {
    return this.http.post<unknown>(staffApi.responsibilities, payload).pipe(
      map(r => unwrapApiResponse<AccessResponsibility>(r, {} as AccessResponsibility))
    );
  }

  updateResponsibility(id: number, payload: AccessResponsibilityRequest): Observable<void> {
    return this.http.put<unknown>(staffApi.responsibilityById(id), payload).pipe(map(() => undefined));
  }

  activateResponsibility(id: number): Observable<void> {
    return this.http.patch<unknown>(`${staffApi.responsibilityById(id)}/activate`, {}).pipe(map(() => undefined));
  }

  deactivateResponsibility(id: number): Observable<void> {
    return this.http.patch<unknown>(`${staffApi.responsibilityById(id)}/deactivate`, {}).pipe(map(() => undefined));
  }

  getResponsibilityPermissions(responsibilityId: number, organizationId = this.organizationId()): Observable<PermissionMatrix> {
    const empty: PermissionMatrix = {
      responsibilityId,
      organizationId,
      rows: []
    };
    return this.http.get<unknown>(accessApi.responsibilityPermissions(responsibilityId, organizationId)).pipe(
      map(r => unwrapApiResponse<PermissionMatrix>(r, empty)),
      catchError(() => this.http.get<unknown>(staffApi.responsibilityPermissions(responsibilityId)).pipe(
        map(r => unwrapApiResponse<PermissionMatrix>(r, empty))
      ))
    );
  }

  updateResponsibilityPermissions(
    responsibilityId: number,
    permissions: PermissionUpdateRow[],
    organizationId = this.organizationId()
  ): Observable<void> {
    const body = { permissions };
    return this.http.put<unknown>(accessApi.responsibilityPermissions(responsibilityId, organizationId), body).pipe(
      map(() => undefined),
      catchError(() => this.http.put<unknown>(staffApi.responsibilityPermissions(responsibilityId), body).pipe(
        map(() => undefined)
      ))
    );
  }

  private tryMapPage<T>(response: unknown): SpringPage<T> | null {
    const raw = unwrapApiResponse<unknown>(response, null);
    if (raw && typeof raw === 'object' && Array.isArray((raw as SpringPage<T>).content)) {
      return this.mapPageResponse<T>(response);
    }
    return null;
  }

  private mapPageResponse<T>(response: unknown): SpringPage<T> {
    const page = unwrapApiResponse<{
      content?: T[];
      totalElements?: number;
      totalPages?: number;
      page?: number;
      number?: number;
      size?: number;
    }>(response, { content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 });

    return {
      content: page.content ?? [],
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      number: page.number ?? page.page ?? 0,
      size: page.size ?? 10
    };
  }

  private normalizeMenuTree(raw: unknown): AccessMenu[] {
    return this.extractMenuList(raw).map(item => this.normalizeMenu(item));
  }

  private extractMenuList(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== 'object') return [];
    const record = raw as Record<string, unknown>;
    for (const key of ['children', 'menus', 'items', 'content', 'tree', 'nodes']) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
    const nested = Object.values(record).find(value =>
      Array.isArray(value)
      && value.some(item => item && typeof item === 'object' && ('menuName' in item || 'menuCode' in item || 'name' in item))
    );
    if (Array.isArray(nested)) return nested as unknown[];
    if (record['id'] != null || record['menuName'] || record['menuCode'] || record['name']) return [record];
    return [];
  }

  private normalizeMenu(raw: unknown, parentName?: string): AccessMenu {
    const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const nested = [record['children'], record['subMenus'], record['submenus'], record['items'], record['menus']]
      .find(value => Array.isArray(value)) as unknown[] | undefined;
    const menuName = String(record['menuName'] ?? record['menu_name'] ?? record['name'] ?? record['label'] ?? '');
    const menuCode = String(record['menuCode'] ?? record['menu_code'] ?? record['code'] ?? '');
    return {
      id: Number(record['id'] ?? record['menuId'] ?? record['menu_id'] ?? 0),
      menuCode,
      menuName,
      description: record['description'] != null ? String(record['description']) : undefined,
      route: record['route'] != null ? String(record['route']) : undefined,
      icon: record['icon'] != null ? String(record['icon']) : undefined,
      menuType: (record['menuType'] ?? record['menu_type'] ?? (nested?.length ? 'MODULE' : 'PAGE')) as AccessMenu['menuType'],
      parentMenuId: record['parentMenuId'] != null ? Number(record['parentMenuId']) : undefined,
      parentMenuName: record['parentMenuName'] != null ? String(record['parentMenuName']) : parentName,
      displayOrder: record['displayOrder'] != null ? Number(record['displayOrder']) : undefined,
      showInSidebar: record['showInSidebar'] !== false,
      active: record['active'] !== false,
      children: (nested ?? []).map(child => this.normalizeMenu(child, menuName))
    };
  }

  private flattenMenus(menus: AccessMenu[]): AccessMenu[] {
    const result: AccessMenu[] = [];
    const walk = (items: AccessMenu[]) => {
      for (const item of items ?? []) {
        result.push(item);
        if (item.children?.length) walk(item.children);
      }
    };
    walk(menus);
    return result;
  }
}
