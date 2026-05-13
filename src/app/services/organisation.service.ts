import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';


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
  // Define the base URL for your organization API.
  private apiUrl = `${environment.baseUrl}/organizations`;
  private onboardingUrl = `${environment.baseUrl}/tenant-onboarding`;

  constructor(private http: HttpClient) { }

  /**
   * CREATE (Submit): Sends the new organization data to the backend.
   * @param payload The data for the new organization, matching the OrgRequest interface.
   * @returns An Observable with the backend's response.
   */
  createOrganization(payload: TenantOnboardingRequest): Observable<TenantOnboardingResponse> {
    return this.http.post<TenantOnboardingResponse>(`${this.onboardingUrl}/provision`, payload);
  }

  /**
   * READ (View List): Fetches the list of all organizations from the backend.
   * @returns An Observable containing an array of Organisation objects.
   */
  getOrganizations(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(`${this.apiUrl}/all`);
  }
  /**
   * 
   * 
   */
  getParentOrganizations(): Observable<ParentOrg[]> {
    return this.http.get<ParentOrg[]>(`${this.apiUrl}/groups`)
  }

  /**
   * UPDATE (Edit): Sends updated organization data to the backend.
   * @param orgId The ID of the organization to update.
   * @param payload The updated data for the organization.
   * @returns An Observable with the backend's response.
   */
  updateOrganization(orgId: number, payload: OrgUpdateRequest): Observable<any> {
    const updateUrl = `${this.apiUrl}/${orgId}`;
    return this.http.put<any>(updateUrl, payload);
  }

  /**
   * DELETE (Soft Delete): Sends a request to the backend to soft-delete an organization.
   * The backend should handle this by setting an 'isActive' flag to false.
   * @param orgCode The code of the organization to delete.
   * @returns An Observable with the backend's response.
   */
  deleteOrganization(orgCode: string): Observable<any> {
    return this.http.patch<Organisation>(`${this.apiUrl}/${orgCode}`, {});
  }

  /**
   * Gets the current status and health of a tenant schema.
   */
  getTenantStatus(tenantId: string): Observable<TenantStatusResponse> {
    return this.http.get<TenantStatusResponse>(`${this.onboardingUrl}/status/${tenantId}`);
  }

  /**
   * Activates a suspended tenant.
   */
  activateTenant(tenantId: string): Observable<void> {
    return this.http.post<void>(`${this.onboardingUrl}/${tenantId}/activate`, {});
  }

  /**
   * Deactivates/suspends an active tenant.
   */
  deactivateTenant(tenantId: string): Observable<void> {
    return this.http.post<void>(`${this.onboardingUrl}/${tenantId}/deactivate`, {});
  }

  updateOwnerDetails(dto: OwnerDTO): Observable<string> {
    return this.http.put(`${this.apiUrl}/owner/update`, dto, { responseType: 'text' });
  }
}
