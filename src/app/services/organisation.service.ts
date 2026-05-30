import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { organizationApi, tenantApi } from '../shared/constants/api.endpoint';


export interface TenantOnboardingRequest {
  tenantName: string;
  displayName: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName?: string;
  adminLastName?: string;
  adminMobile?: string;
  enableSubdomain?: boolean;
  subdomainPrefix?: string;
  organizationType?: string;
  subscriptionType?: string;
  maxUsers?: number;
  storageLimitMb?: number;
  customSettings?: any;
  city?: string;
  state?: string;
  establishDate?: string | null;
}

export interface TenantOnboardingResponse {
  tenantId: string;
  tenantName: string;
  displayName: string;
  adminUsername: string;
  adminEmail: string;
  subdomainUrl?: string;
  status: string;
  message: string;
}

export interface TenantStatusResponse {
  tenantId: string;
  tenantName: string;
  isActive: boolean;
  subdomain?: string;
  currentUserCount: number;
  maxUsers: number;
  storageUsedMb: number;
  storageLimitMb: number;
  createdAt: string;
  lastAccessedAt?: string;
  features?: any;
  healthStatus: string; // HEALTHY, WARNING, CRITICAL
}

/**
 * Defines the structure of an Organisation object received from the backend.
 * This should match the response DTO from your backend.
 */
export interface Organisation {

  orgId: number;
  orgCode: string;
  orgName: string;
  orgType: string;
  brandName: string;
  orgUrl: string;
  // type: string; // Redundant, replaced by orgType
  city: string;
  state: string;
  establishDate: string | Date | null; // Dates often come back as strings
  subscriptionType: string;

  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  ownerCode?: string; // NEW: Added to support owner updates
  isActive: boolean;
  isGroup: any;
  parentOrgId: any;
  tenantId?: string; // Schema name
}
export interface ParentOrg {
  id: number;
  name: string;
}

export interface OwnerDTO {
  ownerCode: string;
  ownerName: string;
  gender?: string;
  mailId: string;
  userName?: string;
  address?: string;
  phoneNumber?: number;
  city?: string;
  state?: string;
}

/**
 * Matches the backend OrgUpdateDTO record.
 * Used when editing an existing organisation's details.
 */
export interface OrgUpdateRequest {
  isGroup: boolean;
  orgName: string;
  brandName?: string;
  orgUrl?: string;
  city?: string;
  state?: string;
  orgType?: string;
  establishmentDate?: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerMobile?: string;
}
@Injectable({
  providedIn: 'root'
})
export class OrganisationService {

  constructor(private http: HttpClient) { }

  createOrganization(payload: TenantOnboardingRequest): Observable<TenantOnboardingResponse> {
    return this.http.post<TenantOnboardingResponse>(organizationApi.provision, payload);
  }

  getOrganizations(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(organizationApi.all);
  }

  getParentOrganizations(): Observable<ParentOrg[]> {
    return this.http.get<ParentOrg[]>(organizationApi.groups);
  }

  updateOrganization(orgId: number, payload: OrgUpdateRequest): Observable<any> {
    return this.http.put<any>(organizationApi.byId(orgId), payload);
  }

  deleteOrganization(orgCode: string): Observable<any> {
    return this.http.patch<Organisation>(organizationApi.byCode(orgCode), {});
  }

  getTenantStatus(tenantId: string): Observable<TenantStatusResponse> {
    return this.http.get<TenantStatusResponse>(tenantApi.status(tenantId));
  }

  activateTenant(tenantId: string): Observable<void> {
    return this.http.post<void>(tenantApi.activate(tenantId), {});
  }

  deactivateTenant(tenantId: string): Observable<void> {
    return this.http.post<void>(tenantApi.deactivate(tenantId), {});
  }

  updateOwnerDetails(dto: OwnerDTO): Observable<string> {
    return this.http.put(organizationApi.updateOwner, dto, { responseType: 'text' });
  }
}
