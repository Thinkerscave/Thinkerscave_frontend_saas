import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import { accessApi } from '../../shared/constants/api.endpoint';
import { ApiResponse } from '../../shared/models/auth.model';
import { LoginService } from './login.service';

export interface EffectivePermission {
  menuId: number;
  menuCode: string;
  menuName: string;
  canView: boolean;
  canManage: boolean;
  canApprove: boolean;
  isOverride: boolean;
}

@Injectable({ providedIn: 'root' })
export class PermissionService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly loginService = inject(LoginService);

  private permissionCache = new Map<string, EffectivePermission>();
  private loaded = false;
  private readonly loginSub: Subscription;

  constructor() {
    this.loginSub = this.loginService.loginStatusSubject.subscribe((loggedIn) => {
      if (!loggedIn) {
        this.clearPermissions();
      }
    });
  }

  ngOnDestroy(): void {
    this.loginSub.unsubscribe();
  }

  /**
   * Fetches effective permissions from the backend and caches them by menuCode.
   * Call this once after a successful login (e.g., from the layout component).
   */
  loadPermissions(): Observable<void> {
    if (this.isPlatformSuperAdmin()) {
      this.loaded = true;
      return of(void 0);
    }

    const user = this.loginService.getUser();
    if (!user?.id || !user?.orgId) {
      return of(void 0);
    }

    const userId = Number(user.id);
    const orgId = user.orgId;

    return this.http
      .get<ApiResponse<EffectivePermission[] | Record<string, EffectivePermission>>>(
        accessApi.userEffectivePermissions(orgId, userId)
      )
      .pipe(
        tap((response) => {
          if (response?.success && response.data) {
            this.permissionCache.clear();
            const values = Array.isArray(response.data)
              ? response.data
              : Object.values(response.data);
            values.forEach((perm) => {
              if (perm.menuCode) {
                this.permissionCache.set(perm.menuCode, perm);
              }
            });
            this.loaded = true;
          }
        }),
        map(() => void 0),
        catchError(() => of(void 0))
      );
  }

  /**
   * Clears the permission cache. Called automatically on logout.
   */
  clearPermissions(): void {
    this.permissionCache.clear();
    this.loaded = false;
  }

  /**
   * Returns true if permissions have been loaded from the backend.
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Returns true if the user has view permission for the given menuCode.
   * SUPER_ADMIN always returns true.
   */
  canView(menuCode: string): boolean {
    if (this.isPlatformSuperAdmin()) {
      return true;
    }
    return this.permissionCache.get(menuCode)?.canView ?? false;
  }

  /**
   * Returns true if the user has manage (create/edit/delete) permission for the given menuCode.
   */
  canManage(menuCode: string): boolean {
    if (this.isPlatformSuperAdmin()) {
      return true;
    }
    return this.permissionCache.get(menuCode)?.canManage ?? false;
  }

  /**
   * Returns true if the user has approve permission for the given menuCode.
   */
  canApprove(menuCode: string): boolean {
    if (this.isPlatformSuperAdmin()) {
      return true;
    }
    return this.permissionCache.get(menuCode)?.canApprove ?? false;
  }

  /**
   * Returns the full permission entry for a given menuCode, or undefined if not found.
   */
  getPermission(menuCode: string): EffectivePermission | undefined {
    return this.permissionCache.get(menuCode);
  }

  private isPlatformSuperAdmin(): boolean {
    if (this.loginService.getLoginContext() === 'PLATFORM') {
      return true;
    }
    const roles = this.loginService.getUserRole() ?? [];
    return roles.some(role => {
      const token = String(role).toUpperCase().replace(/^ROLE_/, '');
      // Only true platform elevation bypasses menu checks. Org owner/admin must
      // use provisioned role_permissions so Academics nav stays role-accurate.
      return token === 'SUPER_ADMIN' || token === 'PLATFORM_ADMIN';
    });
  }
}
