import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { DashboardSearchResponse, DashboardWorkspace } from '../models/dashboard-workspace.model';
import { dashboardApi } from '../../../shared/constants/api.endpoint';

@Injectable({ providedIn: 'root' })
export class DashboardWorkspaceService {

  constructor(
    private http: HttpClient
  ) { }

  loadWorkspace(): Observable<DashboardWorkspace> {
    return this.http.get<any>(dashboardApi.workspace)
      .pipe(map(response => unwrapApiResponse<DashboardWorkspace>(response, {} as DashboardWorkspace)));
  }

  search(query: string): Observable<DashboardSearchResponse> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return of({ query, results: [], supportedCategories: [] });
    }

    const params = new HttpParams().set('query', normalizedQuery);
    return this.http.get<any>(dashboardApi.search, { params })
      .pipe(map(response => unwrapApiResponse<DashboardSearchResponse>(response, { query, results: [], supportedCategories: [] })));
  }
}