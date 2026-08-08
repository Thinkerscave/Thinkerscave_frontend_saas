import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Injector, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, switchMap, tap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loginApi, passwordApi, profileApi } from '../../shared/constants/api.endpoint';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, UserInfo, UserOrganization, PasswordResetPayload, ApiResponse } from '../../shared/models/auth.model';
import { TokenSessionService } from './token-session.service';
import { OrganizationContextService } from './organization-context.service';
import { IdleTimeoutService } from './idle-timeout.service';

/** Keys persisted across sessions (access token is memory-only; refresh token is HttpOnly cookie). */
const STORAGE_KEYS = [
  'tenantId', 'loginContext', 'user', 'orgType', 'sideMenu', 'app-breadcrumb', 'organizations', 'currentOrgId', 'tenantConfig'
] as const;

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly tokenSession = inject(TokenSessionService);
  private readonly orgContext = inject(OrganizationContextService);
  private readonly injector = inject(Injector);

  public loginStatusSubject = new Subject<boolean>();

  /** Emits the current organization ID whenever it changes. Components subscribe to this. */
  public currentOrgId$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.currentOrgId$.next(this.readItem('currentOrgId'));
    this.tokenSession.onTokenRefreshed$.subscribe((signal) => {
      if (signal === 'proactive-refresh') {
        this.proactiveRefresh();
      }
    });
  }

  /** Clears stale session state while preserving org selection for the login screen. */
  prepareLoginScreen(): void {
    const isPlatform = this.orgContext.isPlatformLogin();
    const pendingOrg = this.orgContext.getSelectedOrganization();
    // Clear local session only — do not POST /auth/logout here. That call races with a
    // subsequent login and can wipe the new access token via the 401 refresh path.
    this.clearTokens();
    if (isPlatform) {
      this.setTenant(this.orgContext.resolveTenantId());
      this.setLoginContext('PLATFORM');
      this.storage.removeItem('currentOrgId');
      this.currentOrgId$.next(null);
    } else if (pendingOrg) {
      this.setTenant(pendingOrg.tenantId);
      this.setCurrentOrganization(String(pendingOrg.id));
      this.setLoginContext('TENANT');
    }
  }

  /** Attempt silent refresh on app bootstrap via HttpOnly refresh cookie. */
  restoreSessionFromRefreshToken(): Observable<string | null> {
    if (!environment.authUseHttpOnlyRefresh && !this.getRefreshTokenLegacy()) {
      return of(null);
    }
    return this.refreshAccessToken().pipe(
      tap(() => {
        this.loginStatusSubject.next(true);
        this.injector.get(IdleTimeoutService).start();
      }),
      catchError(() => {
        this.clearTokens();
        return of(null);
      })
    );
  }

  private proactiveRefresh(): void {
    if (!environment.authUseHttpOnlyRefresh && !this.getRefreshTokenLegacy()) {
      return;
    }
    this.refreshAccessToken().subscribe({
      error: () => {
        this.clearTokens();
        this.redirectToSessionExpired();
      }
    });
  }

  private get storage(): Storage {
    return localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
  }

  private preferredStore(rememberMe: boolean): Storage {
    return rememberMe ? localStorage : sessionStorage;
  }

  /** Move session keys to the intended store and clear the other. */
  private persistSessionKeys(target: Storage, sourceKeys: typeof STORAGE_KEYS = STORAGE_KEYS): void {
    const other = target === localStorage ? sessionStorage : localStorage;
    for (const key of sourceKeys) {
      const value = target.getItem(key) ?? other.getItem(key);
      if (value != null) {
        target.setItem(key, value);
      } else {
        target.removeItem(key);
      }
      other.removeItem(key);
    }
  }

  private readItem(key: string): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  requestPasswordOtp(email: string): Observable<ApiResponse<void>> {
    const params = new HttpParams().set('email', email);
    return this.http.post<ApiResponse<void>>(passwordApi.forgot, null, { params });
  }

  verifyPasswordOtp(email: string, otp: string): Observable<ApiResponse<void>> {
    const params = new HttpParams()
      .set('email', email)
      .set('otp', otp.trim());
    return this.http.post<ApiResponse<void>>(passwordApi.verifyOtp, null, { params });
  }

  resetPasswordWithOtp(payload: PasswordResetPayload): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(passwordApi.reset, payload);
  }

  public generateToken(loginData: LoginRequest) {
    const loginContext = this.readItem('loginContext');
    const tenantId = this.readItem('tenantId');
    
    const headers: any = {};
    if (loginContext === 'PLATFORM') {
      headers['X-Login-Context'] = 'PLATFORM';
    } else if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    
    return this.http.post<LoginResponse>(loginApi.loginUrl, loginData, {
      withCredentials: environment.authUseHttpOnlyRefresh,
      headers
    });
  }

  public mapAuthUser(loginUser: any, firstTimeLogin?: boolean, accessToken?: string | null): UserInfo | null {
    if (!loginUser) {
      return null;
    }

    const roles: string[] = Array.isArray(loginUser.roles)
      ? Array.from(new Set<string>(
        loginUser.roles.flatMap((role: any) => {
          if (typeof role === 'string') {
            return [this.normalizeRoleToken(role)];
          }
          return [role?.roleType, role?.roleCode, role?.roleName, role?.name]
            .filter(Boolean)
            .map((value: string) => this.normalizeRoleToken(String(value)));
        })
      ))
      : [];

    // JWT orgId is authoritative after login (user DTO does not include organizationId).
    // Treat 0 as missing — `??` does not skip 0, which previously wiped a valid JWT orgId.
    const resolvedOrgId =
      this.toPositiveOrgId(this.getOrgIdFromAccessToken(accessToken))
      ?? this.toPositiveOrgId(loginUser.organizationId)
      ?? this.toPositiveOrgId(loginUser.orgId)
      ?? this.toPositiveOrgId(environment.defaultOrganizationId)
      ?? null;

    return {
      id: loginUser.id != null ? String(loginUser.id) : undefined,
      userCode: loginUser.userCode ?? '',
      userName: loginUser.username ?? loginUser.userName ?? '',
      firstName: loginUser.firstName ?? '',
      lastName: loginUser.lastName ?? '',
      name: loginUser.displayName ?? `${loginUser.firstName ?? ''} ${loginUser.lastName ?? ''}`.trim(),
      email: loginUser.email ?? '',
      mobile: loginUser.mobileNumber ?? loginUser.mobile ?? '',
      roles,
      privileges: loginUser.privileges ?? [],
      orgId: resolvedOrgId ?? 0,
      organizationId: resolvedOrgId ?? undefined,
      orgCode: loginUser.orgCode ?? '',
      isActive: loginUser.status ? loginUser.status === 'ACTIVE' : true,
      firstTimeLogin: firstTimeLogin ?? loginUser.firstTimeLogin ?? false
    };
  }

  /** Reads orgId claim from the access token (platform users omit it in the user DTO). */
  public getOrgIdFromAccessToken(accessToken?: string | null): number | null {
    const token = accessToken || this.tokenSession.getAccessToken() || '';
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return null;
    }
    return this.toPositiveOrgId(payload['orgId'] ?? payload['organizationId']);
  }

  /** Returns a positive org id, or null when missing/invalid (including 0). */
  public toPositiveOrgId(value: unknown): number | null {
    const orgId = Number(value);
    return Number.isFinite(orgId) && orgId > 0 ? orgId : null;
  }

  public changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(profileApi.changePassword, {
      currentPassword,
      newPassword,
      confirmPassword
    }).pipe(map(() => undefined));
  }

  public getCurrentUser(): Observable<ApiResponse<UserInfo>> {
    const userStr = this.readItem('user');
    if (!userStr) {
      return of({ success: false, message: 'No user in session', data: null as unknown as UserInfo });
    }
    try {
      const parsed = JSON.parse(userStr);
      const user = parsed?.data && parsed.firstName === undefined ? parsed.data : parsed;
      return of({ success: true, message: 'ok', data: user as UserInfo });
    } catch {
      return of({ success: false, message: 'Invalid user session', data: null as unknown as UserInfo });
    }
  }

  private normalizeRoleToken(role: string): string {
    return role.trim().replace(/^ROLE_/i, '').replace(/[\s-]+/g, '_').toUpperCase();
  }

  /**
   * Store session after login. Refresh token is never written to web storage when
   * authUseHttpOnlyRefresh is enabled (cookie set by backend Set-Cookie).
   */
  public loginUser(
    accessToken: string,
    refreshToken: string | null | undefined,
    tenantId?: string,
    orgType?: string,
    organizations?: UserOrganization[],
    rememberMe: boolean = false,
    loginContext?: 'PLATFORM' | 'TENANT'
  ) {
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    const store = this.preferredStore(rememberMe);
    this.persistSessionKeys(store);

    this.tokenSession.setAccessToken(accessToken);
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    if (!environment.authUseHttpOnlyRefresh && refreshToken) {
      store.setItem('refreshToken', refreshToken);
    }
    if (tenantId) {
      store.setItem('tenantId', tenantId);
    }
    if (loginContext) {
      store.setItem('loginContext', loginContext);
    }
    if (orgType) {
      store.setItem('orgType', orgType);
    }

    if (organizations && organizations.length > 0) {
      store.setItem('organizations', JSON.stringify(organizations));
      const primaryOrg = organizations[0] as Partial<UserOrganization> & { organizationId?: number | string; id?: number | string };
      const currentOrgId = this.toPositiveOrgId(primaryOrg?.orgId ?? primaryOrg?.organizationId ?? primaryOrg?.id);
      if (currentOrgId != null) {
        store.setItem('currentOrgId', String(currentOrgId));
        this.currentOrgId$.next(String(currentOrgId));
      } else {
        store.removeItem('currentOrgId');
        this.currentOrgId$.next(null);
      }
    } else {
      store.removeItem('organizations');
      store.removeItem('currentOrgId');
      this.currentOrgId$.next(null);
    }

    this.loginStatusSubject.next(true);
    return true;
  }

  public setTenant(tenantId: string) {
    this.storage.setItem('tenantId', tenantId);
  }

  public getTenant(): string {
    const stored = this.readItem('tenantId');
    const jwtTenant = this.getTenantFromAccessToken();
    if (!jwtTenant) {
      return stored || 'public';
    }
    // Prefer stored tenant when it matches JWT or is an Owner switchable tenant;
    // otherwise JWT wins (avoids TENANT_MISMATCH 403 from stale storage).
    if (stored && this.tenantsEqual(stored, jwtTenant)) {
      return this.normalizeTenant(stored);
    }
    if (stored && this.isSwitchableTenant(stored)) {
      return this.normalizeTenant(stored);
    }
    return this.normalizeTenant(jwtTenant);
  }

  /** Reads {@code tenant} claim from the access token. */
  public getTenantFromAccessToken(accessToken?: string | null): string | null {
    const token = accessToken || this.tokenSession.getAccessToken() || '';
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return null;
    }
    const tenant = payload['tenant'] ?? payload['tenantId'];
    return typeof tenant === 'string' && tenant.trim() ? tenant.trim() : null;
  }

  private isSwitchableTenant(tenantId: string): boolean {
    const token = this.tokenSession.getAccessToken();
    if (!token) {
      return false;
    }
    const payload = this.decodeJwtPayload(token);
    const raw = payload?.['switchableTenants'];
    if (!Array.isArray(raw)) {
      return false;
    }
    const normalized = this.normalizeTenant(tenantId);
    return raw.some(value => typeof value === 'string' && this.tenantsEqual(value, normalized));
  }

  private normalizeTenant(tenantId: string): string {
    return tenantId.trim().toLowerCase().replace(/-/g, '_');
  }

  private tenantsEqual(a: string, b: string): boolean {
    return this.normalizeTenant(a) === this.normalizeTenant(b);
  }

  private readonly tenants = {
    equal: (a: string, b: string) => this.normalizeTenant(a) === this.normalizeTenant(b)
  };

  public getLoginContext(): 'PLATFORM' | 'TENANT' {
    const value = this.readItem('loginContext');
    return value === 'PLATFORM' ? 'PLATFORM' : 'TENANT';
  }

  public setLoginContext(context: 'PLATFORM' | 'TENANT'): void {
    this.storage.setItem('loginContext', context);
  }

  public getOrgType(): string {
    return this.readItem('orgType') || 'SCHOOL';
  }

  public getCurrentOrganizationId(): string | null {
    return this.readItem('currentOrgId');
  }

  public setCurrentOrganization(orgId: string) {
    this.storage.setItem('currentOrgId', orgId);
    this.currentOrgId$.next(orgId);
  }

  public getOrganizations(): UserOrganization[] {
    const orgs = this.readItem('organizations');
    return orgs ? JSON.parse(orgs) : [];
  }

  public isLoggedIn(): boolean {
    const token = this.tokenSession.getAccessToken();
    if (!token) return false;
    const payload = this.decodeJwtPayload(token);
    if (!payload) return false;
    const exp = Number(payload['exp']);
    return Number.isFinite(exp) && exp * 1000 > Date.now();
  }

  /** Decode JWT payload; pads URL-safe base64 so `atob` does not fail. */
  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  public getAccessToken(): string | null {
    return this.tokenSession.getAccessToken();
  }

  public setAccessToken(accessToken: string) {
    this.tokenSession.setAccessToken(accessToken);
  }

  /** @deprecated Prefer HttpOnly cookie mode; returns null when authUseHttpOnlyRefresh is true. */
  public getRefreshToken(): string | null {
    return this.getRefreshTokenLegacy();
  }

  private getRefreshTokenLegacy(): string | null {
    if (environment.authUseHttpOnlyRefresh) {
      return null;
    }
    return this.readItem('refreshToken');
  }

  public setUser(user: UserInfo) {
    this.storage.setItem('user', JSON.stringify(user));
  }

  public getUser(): UserInfo | null {
    const userStr = this.readItem('user');
    if (userStr == null) {
      return null;
    }
    try {
      const parsed = JSON.parse(userStr);
      const user = (parsed && parsed.data && parsed.firstName === undefined) ? parsed.data : parsed;
      return user;
    } catch {
      return null;
    }
  }

  public getUserRole() {
    const user = this.getUser();
    return user?.roles || [];
  }

  public getUserPrivileges(): string[] {
    const user = this.getUser();
    return user?.privileges || [];
  }

  private clearAllStorage(): void {
    STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    this.tokenSession.clear();
    this.injector.get(IdleTimeoutService).stop();
    this.loginStatusSubject.next(false);
  }

  public logOut(clearOrgSelection = true) {
    const legacyRefresh = this.getRefreshTokenLegacy();
    if (legacyRefresh || environment.authUseHttpOnlyRefresh) {
      const params = legacyRefresh ? new HttpParams().set('refreshToken', legacyRefresh) : undefined;
      this.http.post(loginApi.logOutUrl, null, {
        params,
        withCredentials: environment.authUseHttpOnlyRefresh
      }).subscribe({ next: () => { }, error: () => { } });
    }
    this.clearAllStorage();
    if (clearOrgSelection) {
      this.orgContext.clearSelectedOrganization();
    }
    return true;
  }

  logOutAndRedirect(): void {
    this.logOut();
    this.router.navigate(['/']);
  }

  /** Refresh access token using HttpOnly cookie (preferred) or legacy query param. */
  public refreshAccessToken(_unusedRefreshToken?: string): Observable<string> {
    const options: { withCredentials: boolean; params?: HttpParams } = {
      withCredentials: environment.authUseHttpOnlyRefresh
    };
    const legacy = this.getRefreshTokenLegacy();
    if (!environment.authUseHttpOnlyRefresh && legacy) {
      options.params = new HttpParams().set('refreshToken', legacy);
    }

    return this.http.post<ApiResponse<{
      accessToken: string;
      refreshToken?: string;
      tenantId?: string;
      loginContext?: string;
      user?: unknown;
      firstTimeLogin?: boolean;
    }>>(
      loginApi.refreshTokenUrl,
      null,
      options
    ).pipe(
      switchMap((res) => {
        const payload = res?.data ?? (res as unknown as {
          accessToken: string;
          refreshToken?: string;
          tenantId?: string;
          loginContext?: string;
          user?: unknown;
          firstTimeLogin?: boolean;
        });
        this.tokenSession.setAccessToken(payload.accessToken);
        if (payload.refreshToken && !environment.authUseHttpOnlyRefresh) {
          this.storage.setItem('refreshToken', payload.refreshToken);
        } else {
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
        }

        const refreshedTenant = payload.tenantId || this.getTenantFromAccessToken(payload.accessToken);
        if (refreshedTenant) {
          const currentStored = this.readItem('tenantId');
          // Keep an intentional Owner tenant switch; otherwise sync from refresh response.
          if (!currentStored || !this.isSwitchableTenant(currentStored) || this.tenantsEqual(currentStored, refreshedTenant)) {
            this.setTenant(refreshedTenant);
          }
        }

        const orgId = this.getOrgIdFromAccessToken(payload.accessToken);
        if (orgId) {
          this.setCurrentOrganization(String(orgId));
        }

        if (payload.loginContext === 'PLATFORM' || payload.loginContext === 'TENANT') {
          this.setLoginContext(payload.loginContext);
        }

        if (payload.user) {
          const mapped = this.mapAuthUser(payload.user, payload.firstTimeLogin, payload.accessToken);
          if (mapped) {
            this.setUser(mapped);
          }
        }

        return of(payload.accessToken);
      })
    );
  }

  public clearTokens(): void {
    this.clearAllStorage();
  }

  public redirectToSessionExpired(): void {
    this.router.navigate(['/session-expired']);
  }
}

