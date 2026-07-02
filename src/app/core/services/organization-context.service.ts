import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface DevOrganization {
  id: number;
  name: string;
  tenantId: string;
  logoUrl?: string;
}

const PENDING_ORG_KEY = 'pendingOrg';

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  readonly devOrganizations: DevOrganization[] = [
    { id: 1, name: 'Xavier University', tenantId: 'public', logoUrl: undefined },
    { id: 2, name: 'Delhi Public School', tenantId: 'dps', logoUrl: undefined },
    { id: 3, name: 'ABC College', tenantId: 'abc-college', logoUrl: undefined },
    { id: 4, name: 'ThinkerScave Demo School', tenantId: 'demo', logoUrl: undefined }
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
