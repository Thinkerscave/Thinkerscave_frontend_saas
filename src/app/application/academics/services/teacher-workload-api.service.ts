import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { ApiResponse } from '../../../shared/models/auth.model';
import { TeacherWorkloadDashboard } from '../models/teacher-workload.model';

@Injectable({ providedIn: 'root' })
export class TeacherWorkloadApiService {
  private readonly http = inject(HttpClient);

  dashboard(yearId: number): Observable<TeacherWorkloadDashboard> {
    return this.http
      .get<ApiResponse<TeacherWorkloadDashboard>>(academicsApi.teacherWorkload(yearId))
      .pipe(map((res) => res.data));
  }
}
