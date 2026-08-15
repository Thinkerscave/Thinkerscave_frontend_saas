import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import { AcademicsOverview } from '../models/academics-overview.model';

@Injectable({ providedIn: 'root' })
export class AcademicsOverviewApiService {
  private readonly http = inject(HttpClient);

  getOverview(yearId: number): Observable<AcademicsOverview> {
    return this.http
      .get<ApiResponse<AcademicsOverview>>(academicsApi.yearOverview(yearId))
      .pipe(map((r) => r.data));
  }
}
