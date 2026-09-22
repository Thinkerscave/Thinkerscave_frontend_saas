import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  EmployeePayrollDetail,
  EmployeeSalary,
  EmployeeSalaryRequest,
  GeneratePayrollRequest,
  GeneratePayrollResult,
  MyPayrollHistoryItem,
  MyPayrollSummary,
  PageResponse,
  PayrollActivityItem,
  PayrollEmployeeListItem,
  PayrollOverviewKpis,
  PayrollRunDetail,
  PayrollSettings,
  RecordPaymentRequest,
  SalaryComponent,
  SalaryComponentRequest,
  SalaryStructure,
  SalaryStructureRequest
} from '../models/payroll.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class PayrollApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/payroll`;
  private readonly meBase = `${this.base}/me`;

  private mapPage<T>(data: PageResponse<T> | null | undefined): PageResponse<T> {
    return {
      content: data?.content ?? [],
      totalElements: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 0,
      number: data?.number ?? data?.page ?? 0,
      page: data?.page ?? data?.number ?? 0,
      size: data?.size ?? 10,
      first: data?.first,
      last: data?.last,
      sort: data?.sort
    };
  }

  private pageParams(page = 0, size = 10, sort?: string): HttpParams {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (sort) params = params.set('sort', sort);
    return params;
  }

  private idempotentHeaders(key: string): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': key });
  }

  // ─── Overview / employees ────────────────────────────────────────────────

  overview(year: number, month: number): Observable<PayrollOverviewKpis> {
    const params = new HttpParams().set('year', String(year)).set('month', String(month));
    return this.http.get<ApiEnvelope<PayrollOverviewKpis>>(`${this.base}/overview`, { params }).pipe(map(r => r.data));
  }

  listEmployees(
    filter: Record<string, string | number | undefined>,
    page = 0,
    size = 10,
    sort = 'employeeName,asc'
  ): Observable<PageResponse<PayrollEmployeeListItem>> {
    let params = this.pageParams(page, size, sort);
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http
      .get<ApiEnvelope<PageResponse<PayrollEmployeeListItem>>>(`${this.base}/employees`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  recentActivities(page = 0, size = 8): Observable<PayrollActivityItem[]> {
    const params = this.pageParams(page, size, 'occurredOn,desc');
    return this.http
      .get<ApiEnvelope<PageResponse<PayrollActivityItem> | PayrollActivityItem[]>>(`${this.base}/activities`, { params })
      .pipe(
        map(r => {
          const data = r.data;
          if (Array.isArray(data)) return data;
          return data?.content ?? [];
        })
      );
  }

  // ─── Components ──────────────────────────────────────────────────────────

  listComponents(
    filter: { q?: string; componentType?: string; status?: string },
    page = 0,
    size = 10,
    sort = 'sortOrder,asc'
  ): Observable<PageResponse<SalaryComponent>> {
    let params = this.pageParams(page, size, sort);
    if (filter.q) params = params.set('q', filter.q);
    if (filter.componentType) params = params.set('componentType', filter.componentType);
    if (filter.status) params = params.set('status', filter.status);
    return this.http
      .get<ApiEnvelope<PageResponse<SalaryComponent>>>(`${this.base}/components`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  componentLookups(status = 'ACTIVE'): Observable<SalaryComponent[]> {
    const params = new HttpParams().set('status', status).set('size', '200');
    return this.http
      .get<ApiEnvelope<SalaryComponent[] | PageResponse<SalaryComponent>>>(`${this.base}/components`, { params })
      .pipe(
        map(r => {
          const data = r.data;
          return Array.isArray(data) ? data : (data?.content ?? []);
        })
      );
  }

  getComponent(id: number): Observable<SalaryComponent> {
    return this.http.get<ApiEnvelope<SalaryComponent>>(`${this.base}/components/${id}`).pipe(map(r => r.data));
  }

  createComponent(body: SalaryComponentRequest): Observable<SalaryComponent> {
    return this.http.post<ApiEnvelope<SalaryComponent>>(`${this.base}/components`, body).pipe(map(r => r.data));
  }

  updateComponent(id: number, body: SalaryComponentRequest): Observable<SalaryComponent> {
    return this.http.put<ApiEnvelope<SalaryComponent>>(`${this.base}/components/${id}`, body).pipe(map(r => r.data));
  }

  patchComponentStatus(id: number, status: string): Observable<SalaryComponent> {
    return this.http
      .patch<ApiEnvelope<SalaryComponent>>(`${this.base}/components/${id}/status`, { status })
      .pipe(map(r => r.data));
  }

  deleteComponent(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.base}/components/${id}`).pipe(map(() => undefined));
  }

  // ─── Structures ──────────────────────────────────────────────────────────

  listStructures(
    filter: { q?: string; status?: string },
    page = 0,
    size = 10,
    sort = 'name,asc'
  ): Observable<PageResponse<SalaryStructure>> {
    let params = this.pageParams(page, size, sort);
    if (filter.q) params = params.set('q', filter.q);
    if (filter.status) params = params.set('status', filter.status);
    return this.http
      .get<ApiEnvelope<PageResponse<SalaryStructure>>>(`${this.base}/structures`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  structureLookups(status = 'ACTIVE'): Observable<SalaryStructure[]> {
    const params = new HttpParams().set('status', status).set('size', '200');
    return this.http
      .get<ApiEnvelope<SalaryStructure[] | PageResponse<SalaryStructure>>>(`${this.base}/structures`, { params })
      .pipe(
        map(r => {
          const data = r.data;
          return Array.isArray(data) ? data : (data?.content ?? []);
        })
      );
  }

  getStructure(id: number): Observable<SalaryStructure> {
    return this.http.get<ApiEnvelope<SalaryStructure>>(`${this.base}/structures/${id}`).pipe(map(r => r.data));
  }

  createStructure(body: SalaryStructureRequest): Observable<SalaryStructure> {
    return this.http.post<ApiEnvelope<SalaryStructure>>(`${this.base}/structures`, body).pipe(map(r => r.data));
  }

  updateStructure(id: number, body: SalaryStructureRequest): Observable<SalaryStructure> {
    return this.http.put<ApiEnvelope<SalaryStructure>>(`${this.base}/structures/${id}`, body).pipe(map(r => r.data));
  }

  patchStructureStatus(id: number, status: string): Observable<SalaryStructure> {
    return this.http
      .patch<ApiEnvelope<SalaryStructure>>(`${this.base}/structures/${id}/status`, { status })
      .pipe(map(r => r.data));
  }

  deleteStructure(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.base}/structures/${id}`).pipe(map(() => undefined));
  }

  // ─── Employee salary ─────────────────────────────────────────────────────

  getEmployeeSalary(staffId: number): Observable<EmployeeSalary | null> {
    return this.http.get<ApiEnvelope<EmployeeSalary | null>>(`${this.base}/employees/${staffId}/salary`).pipe(map(r => r.data));
  }

  saveEmployeeSalary(staffId: number, body: EmployeeSalaryRequest): Observable<EmployeeSalary> {
    return this.http
      .post<ApiEnvelope<EmployeeSalary>>(`${this.base}/employees/${staffId}/salary`, body)
      .pipe(map(r => r.data));
  }

  employeeSalaryHistory(staffId: number): Observable<EmployeeSalary[]> {
    return this.http
      .get<ApiEnvelope<EmployeeSalary[]>>(`${this.base}/employees/${staffId}/salary/history`)
      .pipe(map(r => r.data ?? []));
  }

  employeePayrollHistory(
    staffId: number,
    page = 0,
    size = 20
  ): Observable<PageResponse<EmployeePayrollDetail>> {
    const params = this.pageParams(page, size, 'payrollYear,desc');
    return this.http
      .get<ApiEnvelope<PageResponse<EmployeePayrollDetail>>>(`${this.base}/employees/${staffId}/payroll-history`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  // ─── Runs ────────────────────────────────────────────────────────────────

  generateRun(body: GeneratePayrollRequest, idempotencyKey: string): Observable<GeneratePayrollResult> {
    return this.http
      .post<ApiEnvelope<GeneratePayrollResult>>(`${this.base}/runs/generate`, body, {
        headers: this.idempotentHeaders(idempotencyKey)
      })
      .pipe(map(r => r.data));
  }

  getRun(runId: number): Observable<PayrollRunDetail> {
    return this.http.get<ApiEnvelope<PayrollRunDetail>>(`${this.base}/runs/${runId}`).pipe(map(r => r.data));
  }

  recalculateRun(runId: number, body?: { lopOverrides?: { staffId: number; lopDays: number }[] }): Observable<PayrollRunDetail> {
    return this.http
      .post<ApiEnvelope<PayrollRunDetail>>(`${this.base}/runs/${runId}/recalculate`, body ?? {})
      .pipe(map(r => r.data));
  }

  approveRun(runId: number, remarks?: string): Observable<PayrollRunDetail> {
    return this.http
      .post<ApiEnvelope<PayrollRunDetail>>(`${this.base}/runs/${runId}/approve`, { remarks: remarks ?? null })
      .pipe(map(r => r.data));
  }

  returnRun(runId: number, remarks?: string): Observable<PayrollRunDetail> {
    return this.http
      .post<ApiEnvelope<PayrollRunDetail>>(`${this.base}/runs/${runId}/return`, { remarks: remarks ?? null })
      .pipe(map(r => r.data));
  }

  // ─── Payments / payslips ─────────────────────────────────────────────────

  recordPayment(employeePayrollId: number, body: RecordPaymentRequest, idempotencyKey: string): Observable<EmployeePayrollDetail> {
    return this.http
      .post<ApiEnvelope<EmployeePayrollDetail>>(`${this.base}/employee-payrolls/${employeePayrollId}/payments`, body, {
        headers: this.idempotentHeaders(idempotencyKey)
      })
      .pipe(map(r => r.data));
  }

  downloadPayslip(employeePayrollId: number): Observable<Blob> {
    return this.http.get(`${this.base}/employee-payrolls/${employeePayrollId}/payslip`, { responseType: 'blob' });
  }

  getEmployeePayroll(employeePayrollId: number): Observable<EmployeePayrollDetail> {
    return this.http
      .get<ApiEnvelope<EmployeePayrollDetail>>(`${this.base}/employee-payrolls/${employeePayrollId}`)
      .pipe(map(r => r.data));
  }

  // ─── Settings ────────────────────────────────────────────────────────────

  getSettings(): Observable<PayrollSettings> {
    return this.http.get<ApiEnvelope<PayrollSettings>>(`${this.base}/settings`).pipe(map(r => r.data));
  }

  updateSettings(body: Partial<PayrollSettings>): Observable<PayrollSettings> {
    return this.http.put<ApiEnvelope<PayrollSettings>>(`${this.base}/settings`, body).pipe(map(r => r.data));
  }

  // ─── Staff My Payroll ────────────────────────────────────────────────────

  mySummary(): Observable<MyPayrollSummary> {
    return this.http.get<ApiEnvelope<MyPayrollSummary>>(`${this.meBase}/summary`).pipe(map(r => r.data));
  }

  myHistory(page = 0, size = 20): Observable<PageResponse<MyPayrollHistoryItem>> {
    const params = this.pageParams(page, size, 'year,desc');
    return this.http
      .get<ApiEnvelope<PageResponse<MyPayrollHistoryItem>>>(`${this.meBase}/history`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  myEmployeePayroll(id: number): Observable<EmployeePayrollDetail> {
    return this.http
      .get<ApiEnvelope<EmployeePayrollDetail>>(`${this.meBase}/employee-payrolls/${id}`)
      .pipe(map(r => r.data));
  }

  myDownloadPayslip(id: number): Observable<Blob> {
    return this.http.get(`${this.meBase}/employee-payrolls/${id}/payslip`, { responseType: 'blob' });
  }
}
