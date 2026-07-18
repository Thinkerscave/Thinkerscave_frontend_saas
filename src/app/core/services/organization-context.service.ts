import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { publicOrganizationsApi } from '../../shared/constants/api.endpoint';
import { ApiResponse } from '../../shared/models/auth.model';

export interface LoginOrganization {
  id: number;
  name: string;
  tenantId: string;
  location: string;
  logoUrl?: string;
  institutionType?: string;
  isPlatform?: boolean;
}

/** @deprecated Use LoginOrganization */
export type DevOrganization = LoginOrganization;

export const THINKERS_DEPARTMENT: LoginOrganization = {
  id: 0,
  name: 'Thinkers Department',
  tenantId: environment.platformTenantId,
  location: 'Platform administration & tenant management',
  isPlatform: true
};

interface PublicOrgDto {
  id: number;
  name: string;
  tenantId: string;
  location?: string;
  logoUrl?: string;
  institutionType?: string;
}

const PENDING_ORG_KEY = 'pendingOrg';
const LOGIN_MODE_KEY = 'loginMode';
const RECENT_ORGS_KEY = 'recentOrganizations';

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private readonly http = inject(HttpClient);

  /** Live institution list loaded from the public API (never hardcoded). */
  readonly organizations = signal<LoginOrganization[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  get requiresSelection(): boolean {
    return environment.requireOrganizationSelection;
  }

  /**
   * Fetches active institutions for the org-select screen.
   * No auth required — hits GET /api/v1/public/organizations.
   */
  loadOrganizations(search?: string): Observable<LoginOrganization[]> {
    this.loading.set(true);
    this.loadError.set(null);

    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http
      .get<ApiResponse<PublicOrgDto[]> | PublicOrgDto[]>(publicOrganizationsApi.list, {
        params,
        headers: { 'X-Skip-Error-Toast': '1' }
      })
      .pipe(
        map((res) => {
          const payload = Array.isArray(res) ? res : (res?.data ?? []);
          return (payload ?? [])
            .filter((o) => o && o.id != null && o.tenantId)
            .map((o) => ({
              id: Number(o.id),
              name: o.name,
              tenantId: o.tenantId,
              location: o.location || 'Institution',
              logoUrl: o.logoUrl,
              institutionType: o.institutionType
            } satisfies LoginOrganization));
        }),
        tap((orgs) => {
          this.organizations.set(orgs);
          this.loading.set(false);
        }),
        catchError(() => {
          this.organizations.set([]);
          this.loading.set(false);
          this.loadError.set('Unable to load institutions. Please check your connection and try again.');
          return of([] as LoginOrganization[]);
        })
      );
  }

  isPlatformLogin(): boolean {
    return sessionStorage.getItem(LOGIN_MODE_KEY) === 'platform';
  }

  hasLoginTarget(): boolean {
    return this.isPlatformLogin() || !!this.getSelectedOrganization();
  }

  getSelectedOrganization(): LoginOrganization | null {
    const raw = sessionStorage.getItem(PENDING_ORG_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as LoginOrganization;
    } catch {
      return null;
    }
  }

  getLoginTarget(): LoginOrganization | null {
    if (this.isPlatformLogin()) {
      return THINKERS_DEPARTMENT;
    }
    return this.getSelectedOrganization();
  }

  setSelectedOrganization(org: LoginOrganization): void {
    sessionStorage.removeItem(LOGIN_MODE_KEY);
    sessionStorage.setItem(PENDING_ORG_KEY, JSON.stringify(org));
    this.trackRecentOrganization(org);
  }

  setPlatformLogin(): void {
    sessionStorage.removeItem(PENDING_ORG_KEY);
    sessionStorage.setItem(LOGIN_MODE_KEY, 'platform');
  }

  getRecentOrganizations(): LoginOrganization[] {
    const catalog = this.organizations();
    const raw = sessionStorage.getItem(RECENT_ORGS_KEY);
    if (!raw || catalog.length === 0) {
      return catalog;
    }
    try {
      const ids = JSON.parse(raw) as number[];
      const recent = ids
        .map((id) => catalog.find((o) => o.id === id))
        .filter((o): o is LoginOrganization => !!o);
      return recent.length ? recent : catalog;
    } catch {
      return catalog;
    }
  }

  private trackRecentOrganization(org: LoginOrganization): void {
    const existing = this.getRecentOrganizations().filter((o) => o.id !== org.id);
    const next = [org, ...existing].slice(0, 5);
    sessionStorage.setItem(RECENT_ORGS_KEY, JSON.stringify(next.map((o) => o.id)));
  }

  clearSelectedOrganization(): void {
    sessionStorage.removeItem(PENDING_ORG_KEY);
    sessionStorage.removeItem(LOGIN_MODE_KEY);
  }

  resolveLoginContext(): 'PLATFORM' | 'TENANT' {
    return this.isPlatformLogin() ? 'PLATFORM' : 'TENANT';
  }

  resolveTenantId(): string {
    if (this.isPlatformLogin()) {
      return environment.platformTenantId;
    }
    if (this.requiresSelection) {
      return this.getSelectedOrganization()?.tenantId ?? environment.defaultTenantId;
    }
    return this.resolveTenantFromHostname() ?? environment.defaultTenantId;
  }

  resolveOrganizationId(): string | null {
    if (this.isPlatformLogin()) {
      return null;
    }
    if (this.requiresSelection) {
      const org = this.getSelectedOrganization();
      return org ? String(org.id) : null;
    }
    return null;
  }

  private resolveTenantFromHostname(): string | null {
    const host = window.location.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return null;
    }
    const parts = host.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        return subdomain;
      }
    }
    return null;
  }
}
