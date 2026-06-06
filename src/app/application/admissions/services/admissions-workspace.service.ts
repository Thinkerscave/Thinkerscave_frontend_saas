import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AdmissionKpi,
  AdmissionProgress,
  AdmissionRecord,
  AdmissionSearchRequest,
  AdmissionWizardPayload,
  AdmissionsSettings,
  CounselingNote,
  CounselingNoteRequest,
  InquiryFullDetail,
  InquiryKpi,
  InquiryQuickActions,
  InquiryRecord,
  InquirySearchRequest,
  InquiryTimelineEntry
} from '../models/admissions-workspace.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdmissionsWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly workspaceBase = `${environment.baseUrl}/admissions/workspace`;
  private readonly admissionsBase = `${environment.baseUrl}/admissions`;
  private readonly inquiriesBase = `${environment.baseUrl}/inquiries`;

  // ---------- Inquiry Center ----------

  inquiryKpi(): Observable<InquiryKpi> {
    return this.http
      .get<ApiEnvelope<InquiryKpi>>(`${this.workspaceBase}/inquiries/kpi`)
      .pipe(map(res => res.data));
  }

  inquiryQuickActions(): Observable<InquiryQuickActions> {
    return this.http
      .get<ApiEnvelope<InquiryQuickActions>>(`${this.workspaceBase}/inquiries/quick-actions`)
      .pipe(map(res => res.data));
  }

  searchInquiries(filter: InquirySearchRequest): Observable<InquiryRecord[]> {
    return this.http
      .post<ApiEnvelope<InquiryRecord[]>>(`${this.workspaceBase}/inquiries/search`, filter)
      .pipe(map(res => res.data ?? []));
  }

  // ---------- Inquiry 360 ----------

  fullDetail(inquiryId: number): Observable<InquiryFullDetail> {
    return this.http
      .get<ApiEnvelope<InquiryFullDetail>>(`${this.workspaceBase}/inquiries/${inquiryId}/full`)
      .pipe(map(res => res.data));
  }

  timeline(inquiryId: number): Observable<InquiryTimelineEntry[]> {
    return this.http
      .get<ApiEnvelope<InquiryTimelineEntry[]>>(`${this.workspaceBase}/inquiries/${inquiryId}/timeline`)
      .pipe(map(res => res.data ?? []));
  }

  // ---------- Inquiry Actions ----------

  assignCounselor(inquiryId: number, counselorId: number): Observable<InquiryRecord> {
    return this.http
      .put<ApiEnvelope<InquiryRecord>>(`${this.workspaceBase}/inquiries/${inquiryId}/assign-counselor`, { counselorId })
      .pipe(map(res => res.data));
  }

  markInterested(inquiryId: number): Observable<InquiryRecord> {
    return this.http
      .post<ApiEnvelope<InquiryRecord>>(`${this.workspaceBase}/inquiries/${inquiryId}/mark-interested`, {})
      .pipe(map(res => res.data));
  }

  markClosed(inquiryId: number, reason?: string): Observable<InquiryRecord> {
    let params = new HttpParams();
    if (reason) { params = params.set('reason', reason); }
    return this.http
      .post<ApiEnvelope<InquiryRecord>>(`${this.workspaceBase}/inquiries/${inquiryId}/mark-closed`, {}, { params })
      .pipe(map(res => res.data));
  }

  proceedToAdmission(inquiryId: number): Observable<void> {
    return this.http
      .post<ApiEnvelope<void>>(`${this.inquiriesBase}/${inquiryId}/proceed-admission`, {})
      .pipe(map(() => undefined));
  }

  addFollowUp(inquiryId: number, payload: {
    followUpType: string;
    remarks: string;
    statusAfterFollowUp: string;
    nextFollowUpDate?: string | null;
  }): Observable<void> {
    return this.http
      .post<ApiEnvelope<void>>(`${this.inquiriesBase}/${inquiryId}/follow-ups`, payload)
      .pipe(map(() => undefined));
  }

  // ---------- Counseling Notes ----------

  counselingNotes(inquiryId: number): Observable<CounselingNote[]> {
    return this.http
      .get<ApiEnvelope<CounselingNote[]>>(`${this.workspaceBase}/inquiries/${inquiryId}/counseling-notes`)
      .pipe(map(res => res.data ?? []));
  }

  addCounselingNote(inquiryId: number, request: CounselingNoteRequest): Observable<CounselingNote> {
    return this.http
      .post<ApiEnvelope<CounselingNote>>(`${this.workspaceBase}/inquiries/${inquiryId}/counseling-notes`, request)
      .pipe(map(res => res.data));
  }

  // ---------- Admission Center ----------

  admissionKpi(): Observable<AdmissionKpi> {
    return this.http
      .get<ApiEnvelope<AdmissionKpi>>(`${this.workspaceBase}/admissions/kpi`)
      .pipe(map(res => res.data));
  }

  searchAdmissions(filter: AdmissionSearchRequest): Observable<AdmissionRecord[]> {
    return this.http
      .post<ApiEnvelope<AdmissionRecord[]>>(`${this.workspaceBase}/admissions/search`, filter)
      .pipe(map(res => res.data ?? []));
  }

  progress(applicationId: string): Observable<AdmissionProgress> {
    return this.http
      .get<ApiEnvelope<AdmissionProgress>>(`${this.workspaceBase}/admissions/${applicationId}/progress`)
      .pipe(map(res => res.data));
  }

  saveDraft(payload: AdmissionWizardPayload): Observable<AdmissionRecord> {
    return this.http
      .post<AdmissionRecord>(`${this.admissionsBase}/draft`, payload);
  }

  submitAdmission(payload: AdmissionWizardPayload): Observable<AdmissionRecord> {
    return this.http
      .post<AdmissionRecord>(`${this.admissionsBase}`, payload);
  }

  loadAdmission(applicationId: string): Observable<AdmissionRecord> {
    return this.http
      .get<AdmissionRecord>(`${this.admissionsBase}/${applicationId}`);
  }

  // ---------- Settings ----------

  settings(): Observable<AdmissionsSettings> {
    return this.http
      .get<ApiEnvelope<AdmissionsSettings>>(`${this.workspaceBase}/settings`)
      .pipe(map(res => res.data));
  }
}
