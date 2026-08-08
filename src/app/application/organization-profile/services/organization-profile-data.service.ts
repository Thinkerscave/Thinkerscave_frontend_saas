import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';

export interface OrganizationProfile {
  id: number;
  organizationCode: string;
  organizationName: string;
  shortName: string | null;
  institutionType: string;
  boardName: string | null;
  email: string | null;
  mobileNumber: string | null;
  alternateMobileNumber: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  logoUrl: string | null;
}

export type OrganizationProfileUpdatePayload = Omit<OrganizationProfile, 'id' | 'organizationCode' | 'institutionType'>;

@Injectable({ providedIn: 'root' })
export class OrganizationProfileDataService {
  private readonly baseUrl = `${environment.baseUrl}/organization-profile`;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<OrganizationProfile> {
    return this.http.get<any>(this.baseUrl)
      .pipe(map(response => unwrapApiResponse<OrganizationProfile>(response, {} as OrganizationProfile)));
  }

  updateProfile(payload: OrganizationProfileUpdatePayload): Observable<OrganizationProfile> {
    return this.http.put<any>(this.baseUrl, payload)
      .pipe(map(response => unwrapApiResponse<OrganizationProfile>(response, {} as OrganizationProfile)));
  }
}
