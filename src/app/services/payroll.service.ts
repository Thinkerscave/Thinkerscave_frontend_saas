import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { payrollApi } from '../shared/constants/api.endpoint';

export interface PayrollDTO {
    id?: number;
    staffId?: number;
    staffName: string;
    department?: string;
    designation?: string;
    // Earnings
    basic?: number;
    hra?: number;
    specialAllowance?: number;
    academicAllowance?: number;
    medicalAllowance?: number;
    travelAllowance?: number;
    dearnessAllowance?: number;
    otherAllowance?: number;
    // Deductions
    professionalTax?: number;
    incomeTax?: number;
    providentFund?: number;
    // Computed
    grossSalary?: number;
    totalDeductions?: number;
    netSalary?: number;
    ctcAnnual?: number;
    effectiveFrom?: string;
}

export interface PayrollRunResult {
    month: string;
    totalStaff: number;
    totalGross: number;
    totalNet: number;
    runBy: string;
    status: string;
    processedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
    constructor(private http: HttpClient) { }

    getAllPayroll(): Observable<PayrollDTO[]> {
        return this.http.get<PayrollDTO[]>(payrollApi.all);
    }

    getByStaffId(staffId: number): Observable<PayrollDTO> {
        return this.http.get<PayrollDTO>(payrollApi.byStaff(staffId));
    }

    saveOrUpdate(dto: PayrollDTO): Observable<PayrollDTO> {
        return this.http.put<PayrollDTO>(payrollApi.saveOrUpdate, dto);
    }

    runPayroll(): Observable<PayrollRunResult> {
        return this.http.post<PayrollRunResult>(payrollApi.run, {});
    }
}
