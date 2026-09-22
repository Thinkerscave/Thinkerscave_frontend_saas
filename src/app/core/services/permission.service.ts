import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
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

/**
 * Nested Finance workspace resources inherit from their sidebar parent page.
 * These must not require separate role-matrix submenu assignment.
 */
const FINANCE_PARENT_RESOURCE: Record<string, string> = {
  FEES_HEADS: 'FEES_MANAGEMENT',
  FEES_STRUCTURES: 'FEES_MANAGEMENT',
  FEES_RECEIPTS: 'FEES_MANAGEMENT',
  FEES_OUTSTANDING: 'FEES_MANAGEMENT',
  FEES_COLLECTION: 'FEES_MANAGEMENT',
  PAYROLL_COMPONENTS: 'PAYROLL',
  PAYROLL_STRUCTURES: 'PAYROLL',
  PAYROLL_EMPLOYEE_SALARY: 'PAYROLL',
  PAYROLL_RUN: 'PAYROLL',
  PAYROLL_PAYMENT: 'PAYROLL',
  PAYROLL_PAYSLIP: 'PAYROLL',
  PAYROLL_SETTINGS: 'PAYROLL',
  EXPENSE_HEADS: 'EXPENSES',
  EXPENSE_PAYMENT: 'EXPENSES',
  EXPENSE_APPROVAL: 'EXPENSES',
  EXPENSE_SETTINGS: 'EXPENSES'
};

@Injectable({ providedIn: 'root' })
export class PermissionService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly loginService = inject(LoginService);

  private permissionCache = new Map<string, EffectivePermission>();
  private loaded = false;
  private readonly loadedSubject = new BehaviorSubject<boolean>(false);
  /** Emits whenever effective permissions are (re)loaded or cleared. */
  readonly permissionsLoaded$ = this.loadedSubject.asObservable();
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
      this.loadedSubject.next(true);
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
            this.loadedSubject.next(true);
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
    this.loadedSubject.next(false);
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
    return this.resolveFlag(menuCode, 'canView');
  }

  /**
   * Returns true if the user has manage (create/edit/delete) permission for the given menuCode.
   */
  canManage(menuCode: string): boolean {
    if (this.isPlatformSuperAdmin()) {
      return true;
    }
    return this.resolveFlag(menuCode, 'canManage');
  }

  /**
   * Returns true if the user has approve permission for the given menuCode.
   */
  canApprove(menuCode: string): boolean {
    if (this.isPlatformSuperAdmin()) {
      return true;
    }
    return this.resolveFlag(menuCode, 'canApprove');
  }

  /**
   * Returns the full permission entry for a given menuCode, or undefined if not found.
   */
  getPermission(menuCode: string): EffectivePermission | undefined {
    return this.permissionCache.get(menuCode);
  }

  private resolveFlag(menuCode: string, flag: 'canView' | 'canManage' | 'canApprove'): boolean {
    const direct = this.permissionCache.get(menuCode);
    if (direct?.[flag]) {
      return true;
    }
    const parent = FINANCE_PARENT_RESOURCE[menuCode];
    if (!parent) {
      return false;
    }
    return this.permissionCache.get(parent)?.[flag] ?? false;
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
      return token === 'SUPER_ADMIN';
    });
  }
}
