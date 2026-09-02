import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AdmissionsSettings,
  ApplicationCreateRequest,
  ApplicationDocument,
  ApplicationProgress,
  ApplicationRecord,
  ApplicationSearchRequest,
  CompleteFollowUpRequest,
  CounselingNote,
  CounselingNoteRequest,
  CounselorOption,
  EnrollmentResult,
  EnrollApplicationRequest,
  FollowUpCreateRequest,
  FollowUpRecord,
  LeadCreateRequest,
  LeadFullDetail,
  LeadKpi,
  LeadQuickActions,
  LeadRecord,
  LeadSearchRequest,
  LeadTimelineItem,
  LookupOption,
  PageResponse,
  RecordFeeRequest
} from '../models/admissions-crm.model';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AdmissionsCrmService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/admissions`;
  private readonly workspace = `${this.base}/workspace`;
  private readonly leads = `${this.base}/leads`;
  private readonly applications = `${this.base}/applications`;
  private readonly followUps = `${this.base}/follow-ups`;
  private readonly reports = `${this.base}/reports`;
  private readonly legacyInquiries = `${environment.baseUrl}/admission/inquiries`;

  private mapPage<T>(data: PageResponse<T> | null | undefined): PageResponse<T> {
    return {
      content: data?.content ?? [],
      totalElements: data?.totalElements ?? 0,
      totalPages: data?.totalPages ?? 0,
      number: data?.number ?? 0,
      size: data?.size ?? 20
    };
  }

  // ─── Workspace / Overview ───────────────────────────────────────────────

  leadKpi(): Observable<LeadKpi> {
    return this.http.get<ApiEnvelope<LeadKpi>>(`${this.workspace}/inquiries/kpi`).pipe(map(r => r.data));
  }

  leadQuickActions(): Observable<LeadQuickActions> {
    return this.http.get<ApiEnvelope<LeadQuickActions>>(`${this.workspace}/inquiries/quick-actions`).pipe(map(r => r.data));
  }

  searchLeads(filter: LeadSearchRequest, page = 0, size = 20, sort = 'createdOn,desc'): Observable<PageResponse<LeadRecord>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size)).set('sort', sort);
    return this.http
      .post<ApiEnvelope<PageResponse<LeadRecord>>>(`${this.workspace}/inquiries/search`, filter, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  reportsOverview(): Observable<Record<string, unknown>> {
    return this.http.get<ApiEnvelope<Record<string, unknown>>>(`${this.reports}/overview`).pipe(map(r => r.data));
  }

  reportsFunnel(): Observable<Record<string, number>> {
    return this.http.get<ApiEnvelope<Record<string, number>>>(`${this.reports}/funnel`).pipe(map(r => r.data));
  }

  reportsSourceAnalysis(): Observable<Record<string, number>> {
    return this.http.get<ApiEnvelope<Record<string, number>>>(`${this.reports}/source-analysis`).pipe(map(r => r.data));
  }

  reportsCounselorPerformance(): Observable<Record<string, unknown>[]> {
    return this.http.get<ApiEnvelope<Record<string, unknown>[]>>(`${this.reports}/counselor-performance`).pipe(map(r => r.data ?? []));
  }

  settings(): Observable<AdmissionsSettings> {
    return this.http.get<ApiEnvelope<AdmissionsSettings>>(`${this.workspace}/settings`).pipe(map(r => r.data));
  }

  saveSettings(payload: AdmissionsSettings): Observable<AdmissionsSettings> {
    return this.http.put<ApiEnvelope<AdmissionsSettings>>(`${this.workspace}/settings`, payload).pipe(map(r => r.data));
  }

  searchCounselors(keyword = '', page = 0, size = 20): Observable<PageResponse<CounselorOption>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (keyword.trim()) params = params.set('keyword', keyword.trim());
    return this.http
      .get<ApiEnvelope<PageResponse<CounselorOption>>>(`${this.workspace}/counselors`, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  academicYears(): Observable<LookupOption[]> {
    return this.http
      .get<ApiEnvelope<LookupOption[]>>(`${environment.baseUrl}/academics/lookup/years`)
      .pipe(map(r => r.data ?? []));
  }

  academicClasses(yearId: number): Observable<LookupOption[]> {
    return this.http
      .get<ApiEnvelope<LookupOption[]>>(`${environment.baseUrl}/academics/lookup/years/${yearId}/classes`)
      .pipe(map(r => r.data ?? []));
  }

  academicSections(classId: number): Observable<LookupOption[]> {
    return this.http
      .get<ApiEnvelope<LookupOption[]>>(`${environment.baseUrl}/academics/lookup/classes/${classId}/sections`)
      .pipe(map(r => r.data ?? []));
  }

  // ─── Leads ──────────────────────────────────────────────────────────────

  createLead(payload: LeadCreateRequest): Observable<LeadRecord> {
    return this.http.post<ApiEnvelope<LeadRecord>>(this.leads, payload).pipe(map(r => r.data));
  }

  updateLead(id: number, payload: LeadCreateRequest): Observable<LeadRecord> {
    return this.http.put<ApiEnvelope<LeadRecord>>(`${this.leads}/${id}`, payload).pipe(map(r => r.data));
  }

  getLead(id: number): Observable<LeadRecord> {
    return this.http.get<ApiEnvelope<LeadRecord>>(`${this.leads}/${id}`).pipe(map(r => r.data));
  }

  archiveLead(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.leads}/${id}`).pipe(map(() => void 0));
  }

  assignCounselor(leadId: number, counselorId: number): Observable<LeadRecord> {
    return this.http
      .post<ApiEnvelope<LeadRecord>>(`${this.leads}/${leadId}/assign-counselor`, { counselorId })
      .pipe(map(r => r.data));
  }

  markLost(leadId: number, reason: string): Observable<LeadRecord> {
    return this.http
      .post<ApiEnvelope<LeadRecord>>(`${this.leads}/${leadId}/mark-lost`, { reason })
      .pipe(map(r => r.data));
  }

  markInterested(leadId: number): Observable<LeadRecord> {
    return this.http
      .post<ApiEnvelope<LeadRecord>>(`${this.workspace}/inquiries/${leadId}/mark-interested`, {})
      .pipe(map(r => r.data));
  }

  markClosed(leadId: number, reason?: string): Observable<LeadRecord> {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http
      .post<ApiEnvelope<LeadRecord>>(`${this.workspace}/inquiries/${leadId}/mark-closed`, {}, { params })
      .pipe(map(r => r.data));
  }

  convertToApplication(leadId: number): Observable<ApplicationRecord> {
    return this.http
      .post<ApiEnvelope<ApplicationRecord>>(`${this.leads}/${leadId}/convert-to-application`, {})
      .pipe(map(r => r.data));
  }

  leadFullDetail(leadId: number): Observable<LeadFullDetail> {
    return this.http.get<ApiEnvelope<LeadFullDetail>>(`${this.workspace}/inquiries/${leadId}/full`).pipe(
      map(r => {
        const d = r.data;
        return {
          inquiry: this.mapLead(d.inquiry ?? d as unknown as LeadRecord),
          followUps: d.followUps ?? [],
          counselingNotes: d.counselingNotes ?? [],
          timeline: (d.timeline ?? []).map(item => ({
            ...item,
            action: item.action ?? item.eventType ?? 'EVENT',
            performedAt: item.performedAt ?? item.performedOn ?? ''
          })),
          applicationId: d.applicationId,
          applicationNumber: d.applicationNumber,
          applicationStatus: d.applicationStatus,
          studentId: d.studentId,
          studentCode: d.studentCode,
          admissionNumber: d.admissionNumber
        };
      })
    );
  }

  leadTimeline(leadId: number): Observable<LeadTimelineItem[]> {
    return this.http
      .get<ApiEnvelope<LeadTimelineItem[]>>(`${this.workspace}/inquiries/${leadId}/timeline`)
      .pipe(map(r => r.data ?? []));
  }

  addFollowUp(leadId: number, payload: FollowUpCreateRequest): Observable<FollowUpRecord> {
    return this.http
      .post<ApiEnvelope<FollowUpRecord>>(`${this.legacyInquiries}/${leadId}/follow-ups`, payload)
      .pipe(map(r => r.data));
  }

  addCounselingNote(leadId: number, payload: CounselingNoteRequest): Observable<CounselingNote> {
    return this.http
      .post<ApiEnvelope<CounselingNote>>(`${this.workspace}/inquiries/${leadId}/counseling-notes`, payload)
      .pipe(map(r => r.data));
  }

  counselingNotes(leadId: number): Observable<CounselingNote[]> {
    return this.http
      .get<ApiEnvelope<CounselingNote[]>>(`${this.workspace}/inquiries/${leadId}/counseling-notes`)
      .pipe(map(r => r.data ?? []));
  }

  // ─── Follow-ups ───────────────────────────────────────────────────────────

  todayFollowUps(): Observable<FollowUpRecord[]> {
    return this.http.get<ApiEnvelope<FollowUpRecord[]>>(`${this.followUps}/today`).pipe(map(r => r.data ?? []));
  }

  overdueFollowUps(): Observable<FollowUpRecord[]> {
    return this.http.get<ApiEnvelope<FollowUpRecord[]>>(`${this.followUps}/overdue`).pipe(map(r => r.data ?? []));
  }

  upcomingFollowUps(): Observable<FollowUpRecord[]> {
    return this.http.get<ApiEnvelope<FollowUpRecord[]>>(`${this.followUps}/upcoming`).pipe(map(r => r.data ?? []));
  }

  completeFollowUp(followUpId: number, payload: CompleteFollowUpRequest = {}): Observable<FollowUpRecord> {
    return this.http
      .post<ApiEnvelope<FollowUpRecord>>(`${this.followUps}/${followUpId}/complete`, payload)
      .pipe(map(r => r.data));
  }

  cancelFollowUp(followUpId: number, remarks?: string): Observable<FollowUpRecord> {
    let params = new HttpParams();
    if (remarks) params = params.set('remarks', remarks);
    return this.http
      .post<ApiEnvelope<FollowUpRecord>>(`${this.followUps}/${followUpId}/cancel`, {}, { params })
      .pipe(map(r => r.data));
  }

  updateFollowUp(followUpId: number, payload: FollowUpCreateRequest): Observable<FollowUpRecord> {
    return this.http
      .put<ApiEnvelope<FollowUpRecord>>(`${this.followUps}/${followUpId}`, payload)
      .pipe(map(r => r.data));
  }

  // ─── Applications ─────────────────────────────────────────────────────────

  searchApplications(filter: ApplicationSearchRequest, page = 0, size = 20, sort = 'createdOn,desc'): Observable<PageResponse<ApplicationRecord>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size)).set('sort', sort);
    return this.http
      .post<ApiEnvelope<PageResponse<ApplicationRecord>>>(`${this.workspace}/admissions/search`, filter, { params })
      .pipe(map(r => this.mapPage(r.data)));
  }

  getApplication(id: number): Observable<ApplicationRecord> {
    return this.http.get<ApiEnvelope<ApplicationRecord>>(`${this.applications}/${id}`).pipe(map(r => r.data));
  }

  saveDraft(payload: ApplicationCreateRequest): Observable<ApplicationRecord> {
    return this.http.post<ApiEnvelope<ApplicationRecord>>(`${this.applications}/draft`, payload).pipe(map(r => r.data));
  }

  submitApplication(payload: ApplicationCreateRequest): Observable<ApplicationRecord> {
    return this.http.post<ApiEnvelope<ApplicationRecord>>(`${this.applications}/submit`, payload).pipe(map(r => r.data));
  }

  updateApplication(id: number, payload: ApplicationCreateRequest): Observable<ApplicationRecord> {
    return this.http.put<ApiEnvelope<ApplicationRecord>>(`${this.applications}/${id}`, payload).pipe(map(r => r.data));
  }

  approveApplication(id: number, remarks?: string): Observable<ApplicationRecord> {
    let params = new HttpParams();
    if (remarks) params = params.set('remarks', remarks);
    return this.http
      .post<ApiEnvelope<ApplicationRecord>>(`${this.applications}/${id}/approve`, {}, { params })
      .pipe(map(r => r.data));
  }

  rejectApplication(id: number, remarks?: string): Observable<ApplicationRecord> {
    let params = new HttpParams();
    if (remarks) params = params.set('remarks', remarks);
    return this.http
      .post<ApiEnvelope<ApplicationRecord>>(`${this.applications}/${id}/reject`, {}, { params })
      .pipe(map(r => r.data));
  }

  updateApplicationStatus(id: number, status: string, remarks?: string): Observable<ApplicationRecord> {
    let params = new HttpParams().set('status', status);
    if (remarks) params = params.set('remarks', remarks);
    return this.http
      .put<ApiEnvelope<ApplicationRecord>>(`${this.applications}/${id}/status`, {}, { params })
      .pipe(map(r => r.data));
  }

  submitExistingApplication(id: number, payload: ApplicationCreateRequest): Observable<ApplicationRecord> {
    return this.http
      .post<ApiEnvelope<ApplicationRecord>>(`${this.applications}/${id}/submit`, payload)
      .pipe(map(r => r.data));
  }

  recordFee(id: number, payload: RecordFeeRequest): Observable<ApplicationRecord> {
    return this.http.post<ApiEnvelope<ApplicationRecord>>(`${this.applications}/${id}/fee`, payload).pipe(map(r => r.data));
  }

  enrollApplication(id: number, payload: EnrollApplicationRequest): Observable<EnrollmentResult> {
    return this.http
      .post<ApiEnvelope<EnrollmentResult>>(`${this.applications}/${id}/enroll`, payload)
      .pipe(map(r => r.data));
  }

  listDocuments(applicationId: number): Observable<ApplicationDocument[]> {
    return this.http
      .get<ApiEnvelope<ApplicationDocument[]>>(`${this.applications}/${applicationId}/documents`)
      .pipe(map(r => r.data ?? []));
  }

  uploadDocument(applicationId: number, file: File, documentType: string): Observable<ApplicationDocument> {
    const body = new FormData();
    body.append('file', file);
    const params = new HttpParams().set('documentType', documentType);
    return this.http
      .post<ApiEnvelope<ApplicationDocument>>(`${this.applications}/${applicationId}/documents`, body, { params })
      .pipe(map(r => r.data));
  }

  verifyDocument(documentId: number, status: string, remarks?: string): Observable<ApplicationDocument> {
    let params = new HttpParams().set('status', status);
    if (remarks) params = params.set('remarks', remarks);
    return this.http
      .post<ApiEnvelope<ApplicationDocument>>(`${this.applications}/documents/${documentId}/verify`, {}, { params })
      .pipe(map(r => r.data));
  }

  deleteDocument(documentId: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.applications}/documents/${documentId}`)
      .pipe(map(() => void 0));
  }

  documentDownloadUrl(documentId: number): string {
    return `${this.applications}/documents/${documentId}/download`;
  }

  applicationProgress(id: number): Observable<ApplicationProgress> {
    return this.http
      .get<ApiEnvelope<ApplicationProgress>>(`${this.applications}/${id}/progress`)
      .pipe(map(r => r.data));
  }

  private mapLead(raw: LeadRecord & { classInterested?: string }): LeadRecord {
    return {
      ...raw,
      classInterestedIn: raw.classInterestedIn ?? raw.classInterested ?? ''
    };
  }
}
