import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { resolveStaffPhotoUrl } from '../../../shared/utils/profile-assets';
import {
  ApiResponse,
  BulkMarkPaidRequest,
  PageResponse,
  Payroll,
  PayrollDashboard,
  PayrollFilterParams,
  PayrollGenerateRequest,
  PayrollGenerateResult,
  Responsibility,
  ResponsibilityAssignment,
  ResponsibilityAssignmentRequest,
  ResponsibilityRequest,
  SalaryStructure,
  SalaryStructureRequest,
  StaffCreateRequest,
  StaffCreateResponse,
  StaffDashboard,
  StaffDetail,
  StaffFilterParams,
  StaffSummary,
  StaffUpdateRequest
} from '../models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}`;

  // ──────────────────────────────────────────────────────────────────────────
  // Staff
  // ──────────────────────────────────────────────────────────────────────────

  getDashboard(): Observable<StaffDashboard> {
    return this.http
      .get<ApiResponse<StaffDashboard>>(`${this.base}/staff/dashboard`)
      .pipe(map(r => r.data));
  }

  getStaffList(filters: StaffFilterParams = {}): Observable<PageResponse<StaffSummary>> {
    let params = new HttpParams();
    if (filters.keyword)            { params = params.set('keyword',            filters.keyword); }
    if (filters.staffType)          { params = params.set('staffType',          filters.staffType); }
    if (filters.employmentCategory) { params = params.set('employmentCategory', filters.employmentCategory); }
    if (filters.employmentStatus)   { params = params.set('employmentStatus',   filters.employmentStatus); }
    if (filters.designation)        { params = params.set('designation',        filters.designation); }
    if (filters.page !== undefined)  { params = params.set('page',              String(filters.page)); }
    if (filters.size !== undefined)  { params = params.set('size',              String(filters.size)); }
    if (filters.sort)               { params = params.set('sort',               filters.sort); }
    return this.http
      .get<ApiResponse<PageResponse<StaffSummary>>>(`${this.base}/staff`, { params })
      .pipe(map(r => ({
        ...r.data,
        content: (r.data?.content ?? []).map(s => ({
          ...s,
          photoUrl: resolveStaffPhotoUrl(s.staffId, s.photoUrl) ?? undefined
        }))
      })));
  }

  getStaffDetail(staffId: number): Observable<StaffDetail> {
    return this.http
      .get<ApiResponse<StaffDetail>>(`${this.base}/staff/${staffId}`)
      .pipe(map(r => ({
        ...r.data,
        photoUrl: resolveStaffPhotoUrl(r.data.staffId, r.data.photoUrl) ?? undefined
      })));
  }

  createStaff(request: StaffCreateRequest): Observable<StaffCreateResponse> {
    return this.http
      .post<ApiResponse<StaffCreateResponse>>(`${this.base}/staff`, request)
      .pipe(map(r => r.data));
  }

  updateStaff(staffId: number, request: StaffUpdateRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.base}/staff/${staffId}`, request)
      .pipe(map(() => void 0));
  }

  activateStaff(staffId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/${staffId}/activate`, {})
      .pipe(map(() => void 0));
  }

  deactivateStaff(staffId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/${staffId}/deactivate`, {})
      .pipe(map(() => void 0));
  }

  deleteStaff(staffId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/staff/${staffId}`)
      .pipe(map(() => void 0));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Responsibilities
  // ──────────────────────────────────────────────────────────────────────────

  getResponsibilities(): Observable<Responsibility[]> {
    return this.http
      .get<ApiResponse<Responsibility[]>>(`${this.base}/staff/responsibilities`)
      .pipe(map(r => r.data ?? []));
  }

  getResponsibilityById(id: number): Observable<Responsibility> {
    return this.http
      .get<ApiResponse<Responsibility>>(`${this.base}/staff/responsibilities/${id}`)
      .pipe(map(r => r.data));
  }

  createResponsibility(request: ResponsibilityRequest): Observable<{ responsibilityId: number }> {
    return this.http
      .post<ApiResponse<{ responsibilityId: number }>>(`${this.base}/staff/responsibilities`, request)
      .pipe(map(r => r.data));
  }

  updateResponsibility(id: number, request: ResponsibilityRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.base}/staff/responsibilities/${id}`, request)
      .pipe(map(() => void 0));
  }

  activateResponsibility(id: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/responsibilities/${id}/activate`, {})
      .pipe(map(() => void 0));
  }

  deactivateResponsibility(id: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/responsibilities/${id}/deactivate`, {})
      .pipe(map(() => void 0));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Responsibility Assignments
  // ──────────────────────────────────────────────────────────────────────────

  getStaffResponsibilities(staffId: number): Observable<ResponsibilityAssignment[]> {
    return this.http
      .get<ApiResponse<ResponsibilityAssignment[]>>(`${this.base}/staff/${staffId}/responsibilities`)
      .pipe(map(r => r.data ?? []));
  }

  assignResponsibility(request: ResponsibilityAssignmentRequest): Observable<{ assignmentId: number }> {
    return this.http
      .post<ApiResponse<{ assignmentId: number }>>(`${this.base}/staff/responsibility-assignments`, request)
      .pipe(map(r => r.data));
  }

  removeAssignment(assignmentId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/staff/responsibility-assignments/${assignmentId}/deactivate`, {})
      .pipe(map(() => void 0));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Salary Structure
  // ──────────────────────────────────────────────────────────────────────────

  getSalaryStructure(staffId: number): Observable<SalaryStructure> {
    return this.http
      .get<ApiResponse<SalaryStructure>>(`${this.base}/staff/${staffId}/salary-structure`)
      .pipe(map(r => r.data));
  }

  getSalaryHistory(staffId: number): Observable<SalaryStructure[]> {
    return this.http
      .get<ApiResponse<SalaryStructure[]>>(`${this.base}/staff/${staffId}/salary-history`)
      .pipe(map(r => r.data ?? []));
  }

  createSalaryStructure(request: SalaryStructureRequest): Observable<{ salaryStructureId: number; grossSalary: number }> {
    return this.http
      .post<ApiResponse<{ salaryStructureId: number; grossSalary: number }>>(`${this.base}/staff/salary-structures`, request)
      .pipe(map(r => r.data));
  }

  updateSalaryStructure(id: number, request: SalaryStructureRequest): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.base}/staff/salary-structures/${id}`, request)
      .pipe(map(() => void 0));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Payroll
  // ──────────────────────────────────────────────────────────────────────────

  getPayrollDashboard(): Observable<PayrollDashboard> {
    return this.http
      .get<ApiResponse<PayrollDashboard>>(`${this.base}/payroll/dashboard`)
      .pipe(map(r => r.data));
  }

  generatePayroll(request: PayrollGenerateRequest): Observable<PayrollGenerateResult> {
    return this.http
      .post<ApiResponse<PayrollGenerateResult>>(`${this.base}/payroll/generate`, request)
      .pipe(map(r => r.data));
  }

  getPayrollList(filters: PayrollFilterParams = {}): Observable<PageResponse<Payroll>> {
    let params = new HttpParams();
    if (filters.year !== undefined)  { params = params.set('year',    String(filters.year)); }
    if (filters.month !== undefined) { params = params.set('month',   String(filters.month)); }
    if (filters.status)              { params = params.set('status',  filters.status); }
    if (filters.staffId !== undefined){ params = params.set('staffId', String(filters.staffId)); }
    if (filters.page !== undefined)  { params = params.set('page',    String(filters.page)); }
    if (filters.size !== undefined)  { params = params.set('size',    String(filters.size)); }
    return this.http
      .get<ApiResponse<PageResponse<Payroll>>>(`${this.base}/payroll`, { params })
      .pipe(map(r => r.data));
  }

  getPayrollDetail(payrollId: number): Observable<Payroll> {
    return this.http
      .get<ApiResponse<Payroll>>(`${this.base}/payroll/${payrollId}`)
      .pipe(map(r => r.data));
  }

  markPaid(payrollId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/payroll/${payrollId}/mark-paid`, {})
      .pipe(map(() => void 0));
  }

  bulkMarkPaid(request: BulkMarkPaidRequest): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/payroll/mark-paid`, request)
      .pipe(map(() => void 0));
  }

  downloadPayslip(payrollId: number): Observable<Blob> {
    return this.http.get(`${this.base}/payroll/${payrollId}/payslip`, {
      responseType: 'blob'
    });
  }

  exportPayrollReport(year: number, month: number): Observable<Blob> {
    const params = new HttpParams()
      .set('year', String(year))
      .set('month', String(month));
    return this.http.get(`${this.base}/payroll/report/export`, {
      params,
      responseType: 'blob'
    });
  }
}
