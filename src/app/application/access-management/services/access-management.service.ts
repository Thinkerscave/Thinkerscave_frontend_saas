import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { accessApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { LoginService } from '../../../core/services/login.service';
import {
  AccessDashboardSummary,
  AccessMenu,
  AccessRole,
  AccessUser,
  CreateRolePayload,
  EffectivePermission,
  LoginHistoryEntry,
  LoginStatus,
  PermissionMatrix,
  PermissionUpdateRow,
  RoleType,
  SecurityPolicy,
  SpringPage,
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
      roles: this.getRoles(),
      users: this.searchUsers(orgId, {}, 0, 1),
      menus: this.getMenuTree()
    }).pipe(
      map(({ roles, users, menus }) => {
        const flatMenus = this.flattenMenus(menus);
        const activeRoles = roles.filter(r => r.active !== false).length;
        const activeMenus = flatMenus.filter(m => m.active !== false).length;
        const userList = users.content ?? [];
        const lockedUsers = userList.filter(u => u.accountLocked || u.status === 'LOCKED').length;
        return {
          totalRoles: roles.length,
          activeRoles,
          totalUsers: users.totalElements ?? userList.length,
          activeUsers: userList.filter(u => u.status === 'ACTIVE').length,
          totalMenus: flatMenus.length,
          activeMenus,
          lockedUsers
        };
      })
    );
  }

  getRoles(): Observable<AccessRole[]> {
    return this.http.get<unknown>(accessApi.roles).pipe(
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

  getMenuTree(): Observable<AccessMenu[]> {
    return this.http.get<unknown>(accessApi.menuTree).pipe(
      map(r => unwrapApiResponse<AccessMenu[]>(r, []))
    );
  }

  activateMenu(id: number): Observable<void> {
    return this.http.patch<unknown>(accessApi.activateMenu(id), {}).pipe(map(() => undefined));
  }

  deactivateMenu(id: number): Observable<void> {
    return this.http.patch<unknown>(accessApi.deactivateMenu(id), {}).pipe(map(() => undefined));
  }

  searchUsers(
    organizationId = this.organizationId(),
    query: { status?: UserStatus; roleType?: RoleType; search?: string } = {},
    page = 0,
    size = 20
  ): Observable<SpringPage<AccessUser>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
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
    return this.http.put<unknown>(accessApi.securityPolicy(organizationId), payload).pipe(
      map(r => unwrapApiResponse<SecurityPolicy>(r, payload))
    );
  }

  resetSecurityPolicy(organizationId = this.organizationId()): Observable<void> {
    return this.http.post<unknown>(accessApi.resetSecurityPolicy(organizationId), {}).pipe(map(() => undefined));
  }

  getOrgLoginHistory(organizationId = this.organizationId(), status?: LoginStatus, page = 0, size = 50): Observable<SpringPage<LoginHistoryEntry>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (status) params = params.set('status', status);
    return this.http.get<unknown>(accessApi.orgLoginHistory(organizationId), { params }).pipe(
      map(r => this.mapPageResponse<LoginHistoryEntry>(r))
    );
  }

  private mapPageResponse<T>(response: unknown): SpringPage<T> {
    const page = unwrapApiResponse<{
      content?: T[];
      totalElements?: number;
      totalPages?: number;
      page?: number;
      number?: number;
      size?: number;
    }>(response, { content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });

    return {
      content: page.content ?? [],
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      number: page.number ?? page.page ?? 0,
      size: page.size ?? 20
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
