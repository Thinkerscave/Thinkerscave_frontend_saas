import { Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
/**
 * Defines the structure of the data sent to the backend when creating or updating an organization.
 * This should exactly match your OrgRequestDTO on the backend.
 */
export interface OrgRequest {
  isAGroup: boolean;
  parentOrgId: number | null | undefined;
  orgName: string;
  brandName: string;
  orgUrl: string;
  orgType: string;
  city: string;
  state: string;
  establishDate: Date | String | null;
  subscriptionType: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
}

/**
 * Defines the structure of an Organisation object received from the backend.
 * This should match the response DTO from your backend.
 */
export interface Organisation {
 
  orgId: number;
  orgCode: string;
  orgName: string;
  orgType:string;
  brandName: string;
  orgUrl: string;
  type: string;
  city: string;
  state: string;
  establishDate: string | Date | null; // Dates often come back as strings
  subscriptionType:string;

  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  isActive: boolean;
   isGroup: any;
  parentOrgId: any;
}
export interface ParentOrg{
  id:number;
  name:string;
}
@Injectable({
  providedIn: 'root'
})
export class OrganisationService {
 // Define the base URL for your organization API.
  private apiUrl = `${environment.baseUrl}/organizations`;

  constructor(private http: HttpClient) { }

  /**
   * CREATE (Submit): Sends the new organization data to the backend.
   * @param payload The data for the new organization, matching the OrgRequest interface.
   * @returns An Observable with the backend's response.
   */
  createOrganization(payload: OrgRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, payload);
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
  getParentOrganizations():Observable<ParentOrg[]>{
    return this.http.get<ParentOrg[]>(`${this.apiUrl}/groups`)
  }

  /**
   * UPDATE (Edit): Sends updated organization data to the backend.
   * @param orgId The ID of the organization to update.
   * @param payload The updated data for the organization.
   * @returns An Observable with the backend's response.
   */
  updateOrganization(orgId: number, payload: OrgRequest): Observable<any> {
    const updateUrl = `${this.apiUrl}/${orgId}`;
    return this.http.put<any>(updateUrl, payload);
  }

  /**
   * DELETE (Soft Delete): Sends a request to the backend to soft-delete an organization.
   * The backend should handle this by setting an 'isActive' flag to false.
   * @param orgId The ID of the organization to delete.
   * @returns An Observable with the backend's response.
   */
  deleteOrganization(orgId: number): Observable<any> {
    const deleteUrl = `${this.apiUrl}/${orgId}`;
    return this.http.delete<any>(deleteUrl);
  }

}
