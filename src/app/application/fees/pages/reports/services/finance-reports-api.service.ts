import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import {
  FinanceReportExport,
  FinanceReportOverview,
  FinanceReportQuery
} from '../models/finance-reports.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class FinanceReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/finance/reports`;

  overview(query: FinanceReportQuery): Observable<FinanceReportOverview> {
    return this.http
      .get<ApiEnvelope<FinanceReportOverview>>(`${this.base}/overview`, {
        params: this.params(query)
      })
      .pipe(map(response => response.data));
  }

  export(query: FinanceReportQuery, format: 'pdf' | 'csv'): Observable<FinanceReportExport> {
    const params = this.params(query).set('format', format);
    return this.http
      .get(`${this.base}/export`, {
        params,
        observe: 'response',
        responseType: 'blob'
      })
      .pipe(map(response => ({
        blob: response.body ?? new Blob(),
        fileName: this.fileName(response, `finance-report.${format}`)
      })));
  }

  private params(query: FinanceReportQuery): HttpParams {
    let params = new HttpParams()
      .set('period', query.period)
      .set('recentLimit', '15');
    if (query.academicYearId != null) {
      params = params.set('academicYearId', String(query.academicYearId));
    }
    if (query.period === 'CUSTOM' && query.from) {
      params = params.set('from', query.from);
    }
    if (query.period === 'CUSTOM' && query.to) {
      params = params.set('to', query.to);
    }
    return params;
  }

  private fileName(response: HttpResponse<Blob>, fallback: string): string {
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const value = utf8 ?? plain;
    return value ? decodeURIComponent(value) : fallback;
  }
}
