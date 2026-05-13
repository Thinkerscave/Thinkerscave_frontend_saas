import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { inquiryApi } from '../shared/constants/api.endpoint';

// ─── DTOs (mirror backend InquiryRequest / InquiryResponse) ──────────────────

export interface InquiryRequest {
    id?: number;
    studentName: string;
    mobileNumber: string;
    email?: string;
    classInterestedIn?: string;
    address?: string;
    counselorId?: number;
    followUpDate?: string; // ISO date string
    remarks?: string;
}

export interface InquiryResponse {
    id: number;
    studentName: string;
    mobileNumber: string;
    email?: string;
    classInterestedIn?: string;
    address?: string;
    status: string;
    counselorId?: number;
    followUpDate?: string;
    remarks?: string;
    createdAt?: string;
}

export interface InquirySummaryResponse {
    totalFollowUps: number;
    lastFollowUpDate?: string;
    nextFollowUpDate?: string;
    status: string;
}

export interface FollowUpRequest {
    notes: string;
    followUpDate?: string;
    outcome?: string;
}

export interface FollowUpResponse {
    id: number;
    inquiryId: number;
    notes: string;
    followUpDate?: string;
    outcome?: string;
    createdAt?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class InquiryService {

    constructor(private http: HttpClient) { }

    /** GET /api/v1/inquiries — list all inquiries */
    getAll(): Observable<InquiryResponse[]> {
        return this.http.get<InquiryResponse[]>(inquiryApi.getAll);
    }

    /** POST /api/v1/inquiries — create or update an inquiry */
    saveOrUpdate(payload: InquiryRequest): Observable<InquiryResponse> {
        return this.http.post<InquiryResponse>(inquiryApi.save, payload);
    }

    /** DELETE /api/v1/inquiries/{id} */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(inquiryApi.delete(id));
    }

    /**
     * GET /api/v1/inquiries/follow-ups — dashboard inquiries
     * @param tab  'UPCOMING' | 'OVERDUE' | 'COMPLETED'
     * @param counselorId  optional counselor filter
     * @param fromDate  ISO date string
     * @param toDate  ISO date string
     */
    getDashboardInquiries(
        tab: string = 'UPCOMING',
        counselorId?: number,
        fromDate?: string,
        toDate?: string
    ): Observable<InquiryResponse[]> {
        let params = new HttpParams().set('tab', tab);
        if (counselorId != null) params = params.set('counselorId', counselorId);
        if (fromDate) params = params.set('fromDate', fromDate);
        if (toDate) params = params.set('toDate', toDate);
        return this.http.get<InquiryResponse[]>(inquiryApi.followUps, { params });
    }

    /** GET /api/v1/inquiries/{id}/summary */
    getSummary(inquiryId: number): Observable<InquirySummaryResponse> {
        return this.http.get<InquirySummaryResponse>(inquiryApi.summary(inquiryId));
    }

    /** GET /api/v1/inquiries/{id}/follow-ups */
    getFollowUps(inquiryId: number): Observable<FollowUpResponse[]> {
        return this.http.get<FollowUpResponse[]>(inquiryApi.inquiryFollowUps(inquiryId));
    }

    /** POST /api/v1/inquiries/{id}/follow-ups */
    addFollowUp(inquiryId: number, payload: FollowUpRequest): Observable<FollowUpResponse> {
        return this.http.post<FollowUpResponse>(inquiryApi.addFollowUp(inquiryId), payload);
    }

    /** POST /api/v1/inquiries/{id}/proceed-admission */
    proceedToAdmission(inquiryId: number): Observable<void> {
        return this.http.post<void>(inquiryApi.proceedAdmission(inquiryId), {});
    }

    /** POST /api/v1/inquiries/{id}/mark-lost */
    markLost(inquiryId: number): Observable<void> {
        return this.http.post<void>(inquiryApi.markLost(inquiryId), {});
    }
}
