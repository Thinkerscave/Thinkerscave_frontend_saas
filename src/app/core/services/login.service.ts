import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject, switchMap, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loginApi, passwordApi } from '../../shared/constants/api.endpoint';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, UserInfo, UserOrganization, PasswordResetPayload, ApiResponse } from '../../shared/models/auth.model';
import { TokenSessionService } from './token-session.service';
import { OrganizationContextService } from './organization-context.service';

/** Keys persisted across sessions (access token is memory-only via TokenSessionService). */
const STORAGE_KEYS = [
  'refreshToken', 'tenantId', 'loginContext', 'user', 'orgType', 'sideMenu', 'app-breadcrumb', 'organizations', 'currentOrgId', 'tenantConfig'
] as const;

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly tokenSession = inject(TokenSessionService);
  private readonly orgContext = inject(OrganizationContextService);

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

  /** Clears session state while preserving dev org selection for the login screen. */
  prepareLoginScreen(): void {
    const isPlatform = this.orgContext.isPlatformLogin();
    const pendingOrg = this.orgContext.getSelectedOrganization();
    this.logOut(false);
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

  /** Attempt silent refresh on app bootstrap when a refresh token exists. */
  restoreSessionFromRefreshToken(): Observable<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken && !environment.authUseHttpOnlyRefresh) {
      return of(null);
    }
    return this.refreshAccessToken(refreshToken ?? '').pipe(
      tap(() => this.loginStatusSubject.next(true)),
      catchError(() => {
        this.clearTokens();
        return of(null);
      })
    );
  }

  private proactiveRefresh(): void {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken && !environment.authUseHttpOnlyRefresh) {
      return;
    }
    this.refreshAccessToken(refreshToken ?? '').subscribe({
      error: () => {
        this.clearTokens();
        this.redirectToSessionExpired();
      }
    });
  }

  // ── Storage helpers (Issue 8: Remember Me aware) ──────────────────────
  /**
   * Returns the active storage backend.
   * If the user chose "Remember Me" at login the tokens live in localStorage
   * (persists across tabs & browser restarts); otherwise they are in
   * sessionStorage (cleared when the tab closes).
   */
  private get storage(): Storage {
    // If the flag exists in localStorage the user opted for persistence.
    if (localStorage.getItem('rememberMe') === 'true') {
      return localStorage;
    }
    // If tokens already exist in sessionStorage, keep using it.
    if (sessionStorage.getItem('refreshToken')) {
      return sessionStorage;
    }
    // Default fallback
    return localStorage;
  }

  /**
   * Read a value from whichever storage contains it.
   * Checks sessionStorage first, then localStorage.
   */
  private readItem(key: string): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }
  //generate token


  /**
   * Step 1: Requests the backend to generate and send an OTP to the user's email.
   * @param email The user's email address.
   * @returns An Observable for the API call.
   */
  requestPasswordOtp(email: string): Observable<ApiResponse<void>> {
    const params = new HttpParams().set('email', email);
    return this.http.post<ApiResponse<void>>(passwordApi.forgot, null, { params });
  }

  /**
   * Step 2: Sends the OTP to the backend for verification.
   * @param email The user's email address.
   * @param otp The 6-digit OTP entered by the user.
   * @returns An Observable for the API call.
   */
  verifyPasswordOtp(email: string, otp: string): Observable<ApiResponse<void>> {
    const params = new HttpParams()
      .set('email', email)
      .set('otp', otp.trim());
    return this.http.post<ApiResponse<void>>(passwordApi.verifyOtp, null, { params });
  }

  /**
   * Step 3: Sends the final request to reset the password.
   * @param payload An object containing the email, OTP, and newPassword.
   * @returns An Observable for the API call.
   */
  resetPasswordWithOtp(payload: PasswordResetPayload): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(passwordApi.reset, payload);
  }
  public generateToken(loginData: LoginRequest) {
    return this.http.post<LoginResponse>(loginApi.loginUrl, loginData);
  }

  /** Maps backend AuthResponse user summary into the frontend UserInfo shape. */
  public mapAuthUser(loginUser: any, firstTimeLogin?: boolean): UserInfo | null {
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
      orgId: loginUser.organizationId ?? loginUser.orgId ?? 0,
      organizationId: loginUser.organizationId ?? loginUser.orgId,
      orgCode: loginUser.orgCode ?? '',
      isActive: loginUser.status ? loginUser.status === 'ACTIVE' : true,
      firstTimeLogin: firstTimeLogin ?? loginUser.firstTimeLogin ?? false
    };
  }

  /**
   * Changes the authenticated user's password (first-time login flow).
   * Calls PATCH /api/v1/users/changePassword with the stored JWT in the Authorization header.
   */
  public changePassword(newPassword: string, confirmPassword: string): Observable<string> {
    return this.http.patch(`${environment.baseUrl}/users/changePassword`, {
      newPassword,
      confirmPassword
    }, { responseType: 'text' });
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
   * Store tokens after login.
   * @param rememberMe When true tokens persist in localStorage; otherwise sessionStorage.
   */
  public loginUser(
    accessToken: string,
    refreshToken: string,
    tenantId?: string,
    orgType?: string,
    organizations?: UserOrganization[],
    rememberMe: boolean = false,
    loginContext?: 'PLATFORM' | 'TENANT'
  ) {
    // Record the storage preference first
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    const store = this.storage;
    this.tokenSession.setAccessToken(accessToken);
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

    // Handle Organization Context
    if (organizations && organizations.length > 0) {
      store.setItem('organizations', JSON.stringify(organizations));
      // Auto-select first organization by default
      // Logic: If user has 1 org -> Select it. If multiple -> Select first.
      const defaultOrgId = organizations[0].orgId;
      store.setItem('currentOrgId', defaultOrgId.toString());
    } else {
      // No organizations assigned? OR Single-Tenant Simple Mode?
      // Clean up old context
      store.removeItem('organizations');
      store.removeItem('currentOrgId');
    }

    this.loginStatusSubject.next(true);
    return true;
  }

  public setTenant(tenantId: string) {
    this.storage.setItem('tenantId', tenantId);
  }

  public getTenant(): string {
    return this.readItem('tenantId') || 'public';
  }

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
    this.currentOrgId$.next(orgId); // notify all subscribers
  }

  public getOrganizations(): UserOrganization[] {
    const orgs = this.readItem('organizations');
    return orgs ? JSON.parse(orgs) : [];
  }

  /**
   * G2 Fix: Checks token existence AND validates the JWT exp claim.
   * A stored-but-expired token is treated as logged-out, triggering redirect to /auth/login.
   */
  public isLoggedIn(): boolean {
    const token = this.tokenSession.getAccessToken();
    if (!token) return false;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  public getAccessToken(): string | null {
    return this.tokenSession.getAccessToken();
  }

  public setAccessToken(accessToken: string) {
    this.tokenSession.setAccessToken(accessToken);
  }

  public getRefreshToken(): string | null {
    return this.readItem('refreshToken');
  }

  public setUser(user: UserInfo) {
    this.storage.setItem('user', JSON.stringify(user));
  }

  public getUser(): UserInfo | null {
    const userStr = this.readItem('user');
    if (userStr != null) {
      const parsed = JSON.parse(userStr);
      // Defensively unwrap ApiResponse<T> wrapper ({ success, message, data: {...} })
      // in case old sessions stored the full response object instead of just the user.
      const user = (parsed && parsed.data && parsed.firstName === undefined) ? parsed.data : parsed;
      return user;
    }
    this.logOut();
    return null;
  }

  public getUserRole() {
    let user = this.getUser();
    return user?.roles || [];
  }

  public getUserPrivileges(): string[] {
    let user = this.getUser();
    return user?.privileges || [];
  }

  // ── Shared cleanup (Issue 7: single source of truth) ──────────────────
  private clearAllStorage(): void {
    STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    this.tokenSession.clear();
    this.loginStatusSubject.next(false);
  }

  public logOut(clearOrgSelection = true) {
    const refreshToken = this.getRefreshToken();
    if (refreshToken || environment.authUseHttpOnlyRefresh) {
      const params = refreshToken ? new HttpParams().set('refreshToken', refreshToken) : undefined;
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

  public refreshAccessToken(refreshToken: string): Observable<string> {
    const options: { withCredentials: boolean; params?: HttpParams } = {
      withCredentials: environment.authUseHttpOnlyRefresh
    };
    if (!environment.authUseHttpOnlyRefresh && refreshToken) {
      options.params = new HttpParams().set('refreshToken', refreshToken);
    }

    return this.http.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
      loginApi.refreshTokenUrl,
      null,
      options
    ).pipe(
      switchMap((res) => {
        const payload = res?.data ?? (res as unknown as { accessToken: string; refreshToken?: string });
        this.tokenSession.setAccessToken(payload.accessToken);
        if (payload.refreshToken && !environment.authUseHttpOnlyRefresh) {
          this.storage.setItem('refreshToken', payload.refreshToken);
        }
        return of(payload.accessToken);
      })
    );
  }

  /** Issue 7: delegates to shared cleanup instead of duplicating removeItem calls. */
  public clearTokens(): void {
    this.clearAllStorage();
  }

  public redirectToSessionExpired(): void {
    this.router.navigate(['/session-expired']);
  }

}


