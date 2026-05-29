import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../services/login.service';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { AdminControlCenter, AdminOrganizationCreatePayload, AdminSystemEvent, AdminUserCreatePayload } from '../models/admin-control.model';

@Injectable({ providedIn: 'root' })
export class AdminControlDataService {
  private readonly adminUrl = `${environment.baseUrl}/admin-control`;
  private readonly onboardingUrl = `${environment.baseUrl}/tenant-onboarding`;
  private readonly usersUrl = `${environment.baseUrl}/users`;

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) { }

  loadWorkspace(): Observable<AdminControlCenter> {
    return this.http.get<any>(`${this.adminUrl}/workspace`, { headers: this.headers() })
      .pipe(map(response => unwrapApiResponse<AdminControlCenter>(response, {} as AdminControlCenter)));
  }

  runDiagnostics(): Observable<AdminSystemEvent> {
    return this.http.post<any>(`${this.adminUrl}/diagnostics`, {}, { headers: this.headers() })
      .pipe(map(response => unwrapApiResponse<AdminSystemEvent>(response, {} as AdminSystemEvent)));
  }

  createOrganization(payload: AdminOrganizationCreatePayload): Observable<any> {
    return this.http.post<any>(`${this.onboardingUrl}/provision`, payload, { headers: this.headers() })
      .pipe(map(response => unwrapApiResponse(response, response)));
  }

  createAdminUser(payload: AdminUserCreatePayload): Observable<any> {
    return this.http.post<any>(`${this.usersUrl}/register`, payload, { headers: this.headers() })
      .pipe(map(response => unwrapApiResponse(response, response)));
  }

  private headers(): HttpHeaders {
    const token = this.loginService.getAccessToken();
    const tenant = this.loginService.getTenant() ?? environment.defaultTenantId;
    const organizationId = this.loginService.getCurrentOrganizationId() ?? environment.defaultOrganizationId;
    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (tenant) {
      headers = headers.set('X-Tenant-ID', tenant);
    }
    if (organizationId) {
      headers = headers.set('X-Organization-ID', String(organizationId));
    }

    return headers;
  }
}