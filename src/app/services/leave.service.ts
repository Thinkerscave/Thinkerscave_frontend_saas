import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { leaveApi } from '../shared/constants/api.endpoint';

export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'COMPENSATORY' | 'CASUAL';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequestDTO {
    staffId?: number;
    staffName?: string;
    department?: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
}

export interface LeaveResponseDTO {
    id: number;
    organizationId?: number;
    staffId?: number;
    staffName: string;
    department?: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    reason?: string;
    status: LeaveStatus;
    appliedBy?: string;
    approvedBy?: string;
    rejectionReason?: string;
    createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
    constructor(private http: HttpClient) { }

    applyLeave(dto: LeaveRequestDTO): Observable<LeaveResponseDTO> {
        return this.http.post<LeaveResponseDTO>(leaveApi.apply, dto);
    }

    getAllLeaveRequests(): Observable<LeaveResponseDTO[]> {
        return this.http.get<LeaveResponseDTO[]>(leaveApi.all);
    }

    getMyLeaveRequests(): Observable<LeaveResponseDTO[]> {
        return this.http.get<LeaveResponseDTO[]>(leaveApi.my);
    }

    approveLeave(id: number): Observable<LeaveResponseDTO> {
        return this.http.patch<LeaveResponseDTO>(leaveApi.approve(id), {});
    }

    rejectLeave(id: number, reason: string = ''): Observable<LeaveResponseDTO> {
        return this.http.patch<LeaveResponseDTO>(leaveApi.reject(id), { reason });
    }

    cancelLeave(id: number): Observable<void> {
        return this.http.delete<void>(leaveApi.cancel(id));
    }
}
