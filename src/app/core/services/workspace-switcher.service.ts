import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { workspaceApi } from '../../shared/constants/api.endpoint';
import { ApiResponse } from '../../shared/models/auth.model';

export interface WorkspaceOrganization {
  organizationId: number;
  organizationCode: string;
  organizationName: string;
  tenantId: string;
  domain?: string;
  logoUrl?: string;
  current: boolean;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceSwitcherService {
  private readonly http = inject(HttpClient);

  listOrganizations(): Observable<WorkspaceOrganization[]> {
    return this.http.get<ApiResponse<WorkspaceOrganization[]>>(workspaceApi.organizations)
      .pipe(map((res) => res?.data ?? []));
  }

  switchOrganization(organizationId: number): Observable<WorkspaceOrganization> {
    return this.http.post<ApiResponse<WorkspaceOrganization>>(workspaceApi.switch, { organizationId })
      .pipe(map((res) => res?.data));
  }
}
