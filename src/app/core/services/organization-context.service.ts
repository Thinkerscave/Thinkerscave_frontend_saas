import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface DevOrganization {
  id: number;
  name: string;
  tenantId: string;
  location: string;
  logoUrl?: string;
}

const PENDING_ORG_KEY = 'pendingOrg';
const RECENT_ORGS_KEY = 'recentOrganizations';

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  readonly devOrganizations: DevOrganization[] = [
    { id: 1, name: 'Javier School Bhubaneswar', tenantId: 'jsb-bhubaneswar', location: 'Patia, Bhubaneswar, Odisha' },
    { id: 2, name: 'Javier School Cuttack', tenantId: 'jsc-cuttack', location: 'Sector 5, Cuttack, Odisha' },
    { id: 3, name: 'ABC School Puri', tenantId: 'abc-puri', location: 'Marine Drive, Puri, Odisha' },
    { id: 4, name: 'Kalinga College Cuttack', tenantId: 'kcc-cuttack', location: 'Badambadi, Cuttack, Odisha' }
  ];

  get requiresSelection(): boolean {
    return environment.requireOrganizationSelection;
  }

  getSelectedOrganization(): DevOrganization | null {
    const raw = sessionStorage.getItem(PENDING_ORG_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as DevOrganization;
    } catch {
      return null;
    }
  }

  setSelectedOrganization(org: DevOrganization): void {
    sessionStorage.setItem(PENDING_ORG_KEY, JSON.stringify(org));
    this.trackRecentOrganization(org);
  }

  getRecentOrganizations(): DevOrganization[] {
    const raw = sessionStorage.getItem(RECENT_ORGS_KEY);
    if (!raw) {
      return this.devOrganizations.slice(0, 3);
    }
    try {
      const ids = JSON.parse(raw) as number[];
      return ids
        .map((id) => this.devOrganizations.find((o) => o.id === id))
        .filter((o): o is DevOrganization => !!o);
    } catch {
      return this.devOrganizations.slice(0, 3);
    }
  }

  private trackRecentOrganization(org: DevOrganization): void {
    const existing = this.getRecentOrganizations().filter((o) => o.id !== org.id);
    const next = [org, ...existing].slice(0, 5);
    sessionStorage.setItem(RECENT_ORGS_KEY, JSON.stringify(next.map((o) => o.id)));
  }

  clearSelectedOrganization(): void {
    sessionStorage.removeItem(PENDING_ORG_KEY);
  }

  /**
   * Resolves tenant from subdomain in production, or from dev org selection.
   */
  resolveTenantId(): string {
    if (this.requiresSelection) {
      return this.getSelectedOrganization()?.tenantId ?? environment.defaultTenantId;
    }
    return this.resolveTenantFromHostname() ?? environment.defaultTenantId;
  }

  resolveOrganizationId(): string | null {
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
