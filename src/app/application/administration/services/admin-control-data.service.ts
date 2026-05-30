import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { AdminControlCenter, AdminOrganizationCreatePayload, AdminSystemEvent, AdminUserCreatePayload } from '../models/admin-control.model';

@Injectable({ providedIn: 'root' })
export class AdminControlDataService {
  private readonly adminUrl = `${environment.baseUrl}/admin-control`;
  private readonly onboardingUrl = `${environment.baseUrl}/tenant-onboarding`;
  private readonly usersUrl = `${environment.baseUrl}/users`;

  constructor(
    private http: HttpClient
  ) { }

  loadWorkspace(): Observable<AdminControlCenter> {
    return this.http.get<any>(`${this.adminUrl}/workspace`)
      .pipe(map(response => unwrapApiResponse<AdminControlCenter>(response, {} as AdminControlCenter)));
  }

  runDiagnostics(): Observable<AdminSystemEvent> {
    return this.http.post<any>(`${this.adminUrl}/diagnostics`, {})
      .pipe(map(response => unwrapApiResponse<AdminSystemEvent>(response, {} as AdminSystemEvent)));
  }

  createOrganization(payload: AdminOrganizationCreatePayload): Observable<any> {
    return this.http.post<any>(`${this.onboardingUrl}/provision`, payload)
      .pipe(map(response => unwrapApiResponse(response, response)));
  }

  createAdminUser(payload: AdminUserCreatePayload): Observable<any> {
    return this.http.post<any>(`${this.usersUrl}/register`, payload)
      .pipe(map(response => unwrapApiResponse(response, response)));
  }
}