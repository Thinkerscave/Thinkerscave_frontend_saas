import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../services/login.service';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { DashboardSearchResponse, DashboardWorkspace } from '../models/dashboard-workspace.model';

@Injectable({ providedIn: 'root' })
export class DashboardWorkspaceService {
  private readonly dashboardUrl = `${environment.baseUrl}/dashboard`;

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) { }

  loadWorkspace(): Observable<DashboardWorkspace> {
    return this.http.get<any>(`${this.dashboardUrl}/workspace`, { headers: this.headers() })
      .pipe(map(response => unwrapApiResponse<DashboardWorkspace>(response, {} as DashboardWorkspace)));
  }

  search(query: string): Observable<DashboardSearchResponse> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return of({ query, results: [], supportedCategories: [] });
    }

    const params = new HttpParams().set('query', normalizedQuery);
    return this.http.get<any>(`${this.dashboardUrl}/search`, { headers: this.headers(), params })
      .pipe(map(response => unwrapApiResponse<DashboardSearchResponse>(response, { query, results: [], supportedCategories: [] })));
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