import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AcademicHistoryRow,
  AchievementRequest,
  AchievementResponse,
  AlumniFilters,
  AlumniRequest,
  AlumniResponse,
  ClassOption,
  DocumentVaultEntry,
  DocumentVaultKpi,
  DocumentVaultRequest,
  MedicalSnapshot,
  PromotionBatch,
  PromotionRecord,
  SectionOption,
  StudentCreateRequest,
  StudentDirectoryCard,
  StudentDocumentEntry,
  StudentKpi,
  StudentPersonal,
  StudentProfile360,
  StudentSearchRequest,
  StudentStatus,
  StudentTimelineEntry,
  StudentWizardRequest,
  TransferRequest,
  TransferStatus
} from '../models/students-workspace.model';
import { resolveStudentPhotoUrl } from '../../../shared/utils/profile-assets';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface BackendStudentDto {
  studentId: number;
  studentCode?: string | null;
  admissionNumber?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  ageYears?: number | null;
  religion?: string | null;
  nationality?: string | null;
  motherTongue?: string | null;
  category?: string | null;
  placeOfBirth?: string | null;
  identityDocumentType?: string | null;
  identityDocumentNumber?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  status?: string | null;
  className?: string | null;
  sectionName?: string | null;
  parentName?: string | null;
  parentMobileNumber?: string | null;
  photoUrl?: string | null;
  rollNumber?: string | null;
  admissionDate?: string | null;
  remarks?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  currentAddressLine1?: string | null;
  currentAddressLine2?: string | null;
  currentCity?: string | null;
  currentState?: string | null;
  currentPostalCode?: string | null;
  permanentAddressLine1?: string | null;
  permanentAddressLine2?: string | null;
  permanentCity?: string | null;
  permanentState?: string | null;
  permanentPostalCode?: string | null;
}

interface BackendParentDto {
  parentId?: number;
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  occupation?: string;
  relationship?: string;
  primaryContact?: boolean;
}

interface BackendProfileDto {
  student: BackendStudentDto;
  parent?: BackendParentDto;
  parents?: BackendParentDto[];
  enrollment?: {
    enrollmentId?: number;
    academicYear?: string;
    className?: string;
    sectionName?: string;
    rollNumber?: string;
    status?: string;
    enrollmentDate?: string;
  };
  medical?: MedicalSnapshot;
  previousSchooling?: {
    hasPreviousSchooling?: boolean;
    schoolName?: string;
    board?: string;
    className?: string;
    academicYear?: string;
    percentage?: string;
    tcNumber?: string;
    tcDate?: string;
  };
  photoDocumentId?: number;
  timeline?: BackendTimelineDto[];
}

interface BackendTimelineDto {
  timelineId?: number;
  eventType?: string;
  title?: string;
  description?: string;
  createdDate?: string;
  createdBy?: string;
}

interface BackendLookupDto {
  id: number;
  name: string;
}

interface BackendTransferDto {
  id: number;
  requestNumber?: string;
  studentId?: number;
  enrollmentId?: number;
  reason?: string;
  destinationSchool?: string;
  status?: string;
  requestedOn?: string;
  certificateNumber?: string;
}

interface BulkUploadSummary {
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
  errors?: string[];
}

export interface StudentImportResult {
  jobId: string;
  total: number;
  success: number;
  failed: number;
  errors?: string[];
}

export interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class StudentsWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly studentsBase = `${environment.baseUrl}/students`;
  private readonly documentsBase = `${environment.baseUrl}/documents`;
  private readonly promotionsBase = `${environment.baseUrl}/promotions`;
  private readonly transfersBase = `${environment.baseUrl}/students/transfers`;

  private academicYearCache: ClassOption[] = [];

  // ---------- KPI ----------
  kpi(): Observable<StudentKpi> {
    const count = (status?: StudentStatus) => {
      let params = new HttpParams().set('page', '0').set('size', '1');
      if (status) params = params.set('status', status);
      return this.http
        .get<ApiEnvelope<SpringPage<BackendStudentDto>>>(this.studentsBase, { params })
        .pipe(map(r => r.data?.totalElements ?? 0));
    };

    return forkJoin({
      totalStudents: count(),
      activeStudents: count('ACTIVE'),
      inactiveStudents: count('INACTIVE'),
      alumniCount: this.http
        .get<ApiEnvelope<BackendStudentDto[]>>(`${this.studentsBase}/alumni`)
        .pipe(map(r => r.data?.length ?? 0)),
      newAdmissionsThisYear: count('ACTIVE')
    }).pipe(
      map(({ totalStudents, activeStudents, inactiveStudents, alumniCount, newAdmissionsThisYear }) => ({
        totalStudents,
        activeStudents,
        inactiveStudents,
        alumniCount,
        newAdmissionsThisYear
      }))
    );
  }

  // ---------- Directory ----------
  search(
    filter: StudentSearchRequest,
    page = 0,
    size = 20,
    sort = 'firstName,asc'
  ): Observable<PageEnvelope<StudentDirectoryCard>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);
    if (filter.keyword) params = params.set('keyword', filter.keyword);
    if (filter.classId) params = params.set('classId', filter.classId);
    if (filter.sectionId) params = params.set('sectionId', filter.sectionId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.parentName) params = params.set('parentName', filter.parentName);

    return this.http
      .get<ApiEnvelope<SpringPage<BackendStudentDto>>>(this.studentsBase, { params })
      .pipe(map(r => this.mapPage(r.data, dto => this.mapDirectoryCard(dto))));
  }

  // ---------- Class/Section options ----------
  listAcademicYears(): Observable<ClassOption[]> {
    return this.http
      .get<ApiEnvelope<BackendLookupDto[]>>(`${this.studentsBase}/academic-years`)
      .pipe(map(r => (r.data ?? []).map(y => ({ id: y.id, label: y.name }))));
  }

  listClasses(academicYearId?: number): Observable<ClassOption[]> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', String(academicYearId));
    return this.http
      .get<ApiEnvelope<BackendLookupDto[]>>(`${this.studentsBase}/classes`, { params })
      .pipe(map(r => (r.data ?? []).map(c => ({ id: c.id, label: c.name }))));
  }

  listSectionsByClass(classId: number): Observable<SectionOption[]> {
    return this.http
      .get<ApiEnvelope<BackendLookupDto[]>>(`${this.studentsBase}/sections`, {
        params: new HttpParams().set('classId', String(classId))
      })
      .pipe(map(r => (r.data ?? []).map(s => ({ id: s.id, label: s.name, classId }))));
  }

  listBloodGroups(): Observable<string[]> {
    return this.http
      .get<ApiEnvelope<string[]>>(`${this.studentsBase}/blood-groups`)
      .pipe(map(r => r.data ?? []));
  }

  // ---------- Student CRUD ----------
  createStudent(payload: StudentCreateRequest): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(this.studentsBase, payload)
      .pipe(map(() => void 0));
  }

  createStudentWizard(payload: StudentWizardRequest): Observable<void> {
    const primary = payload.parents?.[0];
    const secondary = payload.parents?.[1];
    const body: Record<string, unknown> = {
      admissionNumber: payload.admissionNumber?.trim() || null,
      rollNumber: payload.rollNumber ?? null,
      firstName: payload.firstName,
      middleName: payload.middleName ?? null,
      lastName: payload.lastName,
      gender: payload.gender || 'OTHER',
      dateOfBirth: payload.dateOfBirth || new Date().toISOString().substring(0, 10),
      religion: payload.religion ?? null,
      nationality: payload.nationality ?? null,
      motherTongue: payload.motherTongue ?? null,
      category: payload.category ?? null,
      placeOfBirth: payload.placeOfBirth ?? null,
      identityDocumentType: payload.identityDocumentType ?? null,
      identityDocumentNumber: payload.identityDocumentNumber ?? null,
      mobileNumber: payload.mobile ?? null,
      email: payload.email ?? null,
      parentRelationship: primary?.relationship ?? 'FATHER',
      parentFirstName: primary?.firstName ?? 'Guardian',
      parentMiddleName: null,
      parentLastName: primary?.lastName || 'NA',
      parentMobileNumber: primary?.mobile ?? '',
      parentEmail: primary?.email ?? null,
      parentOccupation: primary?.occupation ?? null,
      parentOrganizationName: primary?.organization ?? null,
      parentQualification: primary?.qualification ?? null,
      annualIncome: primary?.annualIncome ? Number(primary.annualIncome) : null,
      academicYearId: payload.academicYearId ?? null,
      classId: payload.classId ?? null,
      sectionId: payload.sectionId ?? null,
      enrollmentDate: payload.enrollmentDate ?? null,
      enrollmentStatus: payload.enrollmentStatus ?? 'ACTIVE',
      sameAddress: payload.sameAsCurrentAddress ?? false,
      currentAddressLine1: payload.currentAddressLine1 ?? null,
      currentAddressLine2: payload.currentAddressLine2 ?? null,
      currentCity: payload.currentCity ?? null,
      currentState: payload.currentState ?? null,
      currentPostalCode: payload.currentPincode ?? null,
      permanentAddressLine1: payload.permanentAddressLine1 ?? null,
      permanentAddressLine2: payload.permanentAddressLine2 ?? null,
      permanentCity: payload.permanentCity ?? null,
      permanentState: payload.permanentState ?? null,
      permanentPostalCode: payload.permanentPincode ?? null,
      bloodGroup: payload.bloodGroup ?? null,
      allergies: payload.allergies ?? null,
      medicalConditions: payload.medicalConditions ?? null,
      medications: payload.medications ?? null,
      doctorName: payload.doctorName ?? null,
      doctorContact: payload.doctorContact ?? null,
      emergencyNotes: payload.emergencyNotes ?? null
    };
    if (secondary?.firstName?.trim() && secondary?.mobile?.trim()) {
      body['secondaryParentRelationship'] = secondary.relationship || 'MOTHER';
      body['secondaryParentFirstName'] = secondary.firstName;
      body['secondaryParentLastName'] = secondary.lastName || 'NA';
      body['secondaryParentMobileNumber'] = secondary.mobile;
      body['secondaryParentEmail'] = secondary.email ?? null;
      body['secondaryParentOccupation'] = secondary.occupation ?? null;
    }
    return this.http.post<ApiEnvelope<unknown>>(this.studentsBase, body).pipe(map(() => void 0));
  }

  updateStudentStatus(studentId: number, status: StudentStatus): Observable<void> {
    return this.http
      .patch<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}/status`, { status })
      .pipe(map(() => void 0));
  }

  getActiveEnrollment(studentId: number): Observable<{ enrollmentId: number }> {
    return this.http
      .get<ApiEnvelope<{ enrollmentId: number }>>(`${this.studentsBase}/${studentId}/enrollment/active`)
      .pipe(map(r => r.data));
  }

  // ---------- Profile 360 ----------
  profile(studentId: number): Observable<StudentProfile360> {
    return this.http
      .get<ApiEnvelope<BackendProfileDto>>(`${this.studentsBase}/${studentId}/profile-360`)
      .pipe(map(r => this.mapProfile360(r.data)));
  }

  updatePersonal(studentId: number, payload: Partial<StudentPersonal>): Observable<StudentPersonal> {
    const parts = (payload.fullName ?? '').trim().split(/\s+/);
    const body = {
      firstName: payload.firstName ?? parts[0] ?? 'Student',
      middleName: payload.middleName ?? (parts.length > 2 ? parts.slice(1, -1).join(' ') : null),
      lastName: payload.lastName ?? parts[parts.length - 1] ?? 'NA',
      gender: payload.gender ?? 'Other',
      dateOfBirth: payload.dateOfBirth ?? new Date().toISOString().substring(0, 10),
      mobileNumber: payload.mobile ?? '0000000000',
      email: payload.email ?? null,
      admissionNumber: `ADM-${studentId}`,
      parentFirstName: 'Guardian',
      parentLastName: 'NA',
      parentMobileNumber: '0000000000',
      academicYearId: 1,
      classId: 1
    };
    return this.http
      .put<ApiEnvelope<BackendStudentDto>>(`${this.studentsBase}/${studentId}/personal`, body)
      .pipe(map(r => this.mapPersonalFromStudent(r.data, payload)));
  }

  updateMedical(studentId: number, payload: Partial<MedicalSnapshot>): Observable<void> {
    return this.http
      .put<ApiEnvelope<unknown>>(`${this.studentsBase}/${studentId}/medical`, payload)
      .pipe(map(() => void 0));
  }

  // ---------- Timeline ----------
  timeline(studentId: number): Observable<StudentTimelineEntry[]> {
    return this.http
      .get<ApiEnvelope<BackendTimelineDto[]>>(`${this.studentsBase}/${studentId}/timeline`)
      .pipe(map(r => (r.data ?? []).map(t => this.mapTimelineEntry(t))));
  }

  timelineMock(studentId: number): Observable<StudentTimelineEntry[]> {
    return this.timeline(studentId);
  }

  // ---------- Academic History ----------
  academicHistory(studentId: number): Observable<AcademicHistoryRow[]> {
    return forkJoin({
      enrollments: this.http.get<ApiEnvelope<Array<{
        academicYear?: string;
        className?: string;
        sectionName?: string;
        rollNumber?: string;
        status?: string;
        enrollmentDate?: string;
      }>>>(`${this.studentsBase}/${studentId}/enrollment`),
      profile: this.http.get<ApiEnvelope<BackendProfileDto>>(`${this.studentsBase}/${studentId}/profile-360`)
    }).pipe(
      map(({ enrollments, profile }) => {
        const rows: AcademicHistoryRow[] = (enrollments.data ?? []).map(row => ({
          academicYear: row.academicYear || '—',
          className: row.className || '—',
          sectionName: row.sectionName || '—',
          rollNumber: row.rollNumber ?? null,
          result: row.status === 'ACTIVE' ? 'Current' : (row.status ?? null),
          remarks: row.enrollmentDate ? `Enrolled ${row.enrollmentDate}` : null
        }));
        const prev = profile.data?.previousSchooling;
        if (prev && (prev.hasPreviousSchooling || prev.schoolName)) {
          rows.push({
            academicYear: prev.academicYear || 'Previous',
            className: prev.className || '—',
            sectionName: prev.board || '—',
            rollNumber: null,
            result: 'Previous school',
            remarks: [prev.schoolName, prev.percentage ? `${prev.percentage}%` : null, prev.tcNumber ? `TC ${prev.tcNumber}` : null]
              .filter(Boolean)
              .join(' · ') || null
          });
        }
        return rows;
      })
    );
  }

  // ---------- Student Documents ----------
  studentDocuments(studentId: number): Observable<StudentDocumentEntry[]> {
    return this.http
      .get<ApiEnvelope<Array<{
        documentId?: number;
        documentName?: string;
        documentType?: string;
        displayLabel?: string;
        remarks?: string;
        status?: string;
      }>>>(`${this.studentsBase}/${studentId}/documents`)
      .pipe(
        map(r => {
          let otherIndex = 0;
          return (r.data ?? []).map(doc => {
            const rawStatus = (doc.status ?? 'PENDING').toUpperCase();
            const status =
              rawStatus === 'VERIFIED' ? 'VERIFIED' as const
              : rawStatus === 'REJECTED' ? 'REJECTED' as const
              : rawStatus === 'PENDING' ? 'PENDING' as const
              : 'UPLOADED' as const;
            let label = (doc.displayLabel || doc.remarks || '').trim();
            const type = (doc.documentType ?? 'OTHER').toUpperCase();
            if (!label && type === 'OTHER') {
              otherIndex += 1;
              label = `Additional document ${otherIndex}`;
            }
            return {
              documentId: doc.documentId ?? null,
              studentId,
              documentName: doc.documentName ?? 'Document',
              documentType: doc.documentType ?? 'OTHER',
              displayLabel: label || this.formatDocumentType(doc.documentType),
              remarks: doc.remarks ?? null,
              status,
              uploadedDate: null,
              category: 'PERSONAL'
            };
          });
        })
      );
  }

  downloadDocument(docId: number): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/document/${docId}/download`, { responseType: 'blob' });
  }

  // ---------- Achievements (no backend yet) ----------
  achievements(_studentId: number): Observable<AchievementResponse[]> {
    return of([]);
  }

  addAchievement(_studentId: number, _req: AchievementRequest): Observable<AchievementResponse> {
    return of({ achievementId: 0, studentId: 0, category: '', title: '' });
  }

  // ---------- Alumni ----------
  alumni(filters?: AlumniFilters): Observable<AlumniResponse[]> {
    let params = new HttpParams();
    if (filters?.keyword) params = params.set('keyword', filters.keyword);
    return this.http
      .get<ApiEnvelope<BackendStudentDto[]>>(`${this.studentsBase}/alumni`, { params })
      .pipe(map(r => (r.data ?? []).map(dto => this.mapAlumni(dto))));
  }

  addAlumni(_req: AlumniRequest): Observable<AlumniResponse> {
    return of({ alumniId: 0, fullName: '' });
  }

  // ---------- Document Vault (aggregated from per-student docs) ----------
  documentKpi(): Observable<DocumentVaultKpi> {
    return this.documents().pipe(
      map(entries => ({
        totalDocuments: entries.length,
        verifiedDocuments: entries.filter(e => e.status === 'VERIFIED').length,
        pendingVerification: entries.filter(e => e.status === 'PENDING').length,
        missingDocuments: entries.filter(e => e.status === 'MISSING').length
      }))
    );
  }

  documents(category?: string): Observable<DocumentVaultEntry[]> {
    return this.search({ status: 'ACTIVE' }, 0, 50).pipe(
      switchMap(page => {
        const students = page.content;
        if (!students.length) return of([]);
        return forkJoin(
          students.map(s =>
            this.studentDocuments(s.studentId).pipe(
              map(docs =>
                docs.map(doc => ({
                  documentId: doc.documentId ?? 0,
                  studentId: s.studentId,
                  studentName: s.fullName,
                  documentType: doc.documentType,
                  fileName: doc.documentName,
                  fileUrl: null,
                  status: doc.status === 'UPLOADED' ? 'PENDING' as const : doc.status as DocumentVaultEntry['status'],
                  category: (doc.category ?? 'OTHER') as DocumentVaultEntry['category'],
                  uploadedOn: doc.uploadedDate ?? null,
                  expiresOn: null,
                  remarks: null
                }))
              )
            )
          )
        ).pipe(
          map(nested => {
            const flat = nested.flat();
            if (!category) return flat;
            return flat.filter(e => e.category === category);
          })
        );
      })
    );
  }

  addDocument(req: DocumentVaultRequest): Observable<DocumentVaultEntry> {
    const formData = new FormData();
    if (req.fileUrl) {
      formData.append('file', new Blob(['placeholder'], { type: 'application/octet-stream' }), req.fileName);
    }
    formData.append('documentType', req.documentType);
    return this.http
      .post<ApiEnvelope<{ documentId?: number; documentName?: string; documentType?: string }>>(
        this.documentsBase,
        formData,
        { params: new HttpParams().set('studentId', String(req.studentId)) }
      )
      .pipe(
        map(r => ({
          documentId: r.data?.documentId ?? 0,
          studentId: req.studentId,
          studentName: '',
          documentType: req.documentType,
          fileName: req.fileName,
          fileUrl: req.fileUrl ?? null,
          status: 'PENDING',
          category: req.category,
          uploadedOn: new Date().toISOString(),
          expiresOn: req.expiresOn ?? null,
          remarks: req.remarks ?? null
        }))
      );
  }

  verifyDocument(id: number): Observable<DocumentVaultEntry> {
    return this.documents().pipe(
      map(entries => {
        const entry = entries.find(e => e.documentId === id);
        if (!entry) throw new Error('Document not found');
        return { ...entry, status: 'VERIFIED' as const };
      })
    );
  }

  deleteDocument(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.documentsBase}/${id}`)
      .pipe(map(() => void 0));
  }

  // ---------- Import / Export ----------
  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/import/template`, { responseType: 'blob' });
  }

  importStudents(file: File): Observable<StudentImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiEnvelope<{ jobId: string; summary?: BulkUploadSummary }>>(`${this.studentsBase}/import`, formData)
      .pipe(
        map(r => ({
          jobId: r.data?.jobId ?? '',
          total: r.data?.summary?.totalRecords ?? 0,
          success: r.data?.summary?.successCount ?? 0,
          failed: r.data?.summary?.failureCount ?? 0,
          errors: r.data?.summary?.errors ?? []
        }))
      );
  }

  downloadImportErrors(jobId: string): Observable<Blob> {
    return this.http.get(`${this.studentsBase}/import/${jobId}/errors`, { responseType: 'blob' });
  }

  // ---------- Promotion ----------
  listPromotions(): Observable<PromotionBatch[]> {
    return this.http
      .get<ApiEnvelope<SpringPage<PromotionBatch>>>(`${this.promotionsBase}?page=0&size=50&sort=id,desc`)
      .pipe(map(r => r.data?.content ?? []));
  }

  createPromotion(payload: PromotionBatch): Observable<PromotionBatch> {
    return this.http
      .post<ApiEnvelope<PromotionBatch>>(this.promotionsBase, payload)
      .pipe(map(r => r.data));
  }

  previewPromotion(batchId: number): Observable<PromotionRecord[]> {
    return this.http
      .post<ApiEnvelope<PromotionRecord[]>>(`${this.promotionsBase}/${batchId}/preview`, {})
      .pipe(map(r => r.data ?? []));
  }

  promotionRecords(batchId: number): Observable<PromotionRecord[]> {
    return this.http
      .get<ApiEnvelope<PromotionRecord[]>>(`${this.promotionsBase}/${batchId}/records`)
      .pipe(map(r => r.data ?? []));
  }

  updatePromotionRecord(recordId: number, payload: PromotionRecord): Observable<PromotionRecord> {
    return this.http
      .put<ApiEnvelope<PromotionRecord>>(`${this.promotionsBase}/records/${recordId}`, payload)
      .pipe(map(r => r.data));
  }

  executePromotion(batchId: number): Observable<PromotionBatch> {
    return this.http
      .post<ApiEnvelope<PromotionBatch>>(`${this.promotionsBase}/${batchId}/execute`, {})
      .pipe(map(r => r.data));
  }

  // ---------- Transfer ----------
  listTransfers(): Observable<TransferRequest[]> {
    return this.http
      .get<ApiEnvelope<BackendTransferDto[]>>(this.transfersBase)
      .pipe(map(r => (r.data ?? []).map(t => this.mapTransfer(t))));
  }

  createTransfer(payload: TransferRequest): Observable<TransferRequest> {
    const body = {
      studentId: payload.studentId,
      enrollmentId: payload.enrollmentId,
      reason: payload.reason,
      destinationSchool: payload.destinationSchool
    };
    return this.http
      .post<ApiEnvelope<BackendTransferDto>>(this.transfersBase, body)
      .pipe(map(r => this.mapTransfer(r.data)));
  }

  transitionTransfer(id: number, target: TransferStatus, remarks?: string): Observable<TransferRequest> {
    return this.http
      .patch<ApiEnvelope<BackendTransferDto>>(`${this.transfersBase}/${id}/status`, { status: target, remarks })
      .pipe(map(r => this.mapTransfer(r.data)));
  }

  // ---------- Mappers ----------
  private mapPage<T, R>(page: SpringPage<T> | null | undefined, mapper: (item: T) => R): PageEnvelope<R> {
    return {
      content: (page?.content ?? []).map(mapper),
      totalElements: page?.totalElements ?? 0,
      totalPages: page?.totalPages ?? 0,
      pageNumber: page?.number ?? 0,
      pageSize: page?.size ?? 20
    };
  }

  private mapDirectoryCard(dto: BackendStudentDto): StudentDirectoryCard {
    return {
      studentId: dto.studentId,
      admissionNumber: dto.admissionNumber ?? '',
      studentCode: dto.studentCode,
      fullName: dto.fullName ?? 'Unknown',
      className: dto.className,
      sectionName: dto.sectionName,
      mobile: dto.mobileNumber,
      email: dto.email,
      status: (dto.status as StudentStatus) ?? 'ACTIVE',
      active: dto.status === 'ACTIVE',
      attendanceStatus: 'PENDING',
      guardianName: dto.parentName,
      guardianMobile: dto.parentMobileNumber?.toString() ?? null,
      photoUrl: resolveStudentPhotoUrl(dto.studentId, dto.photoUrl)
    };
  }

  private mapProfile360(raw: BackendProfileDto): StudentProfile360 {
    const s = raw.student;
    const en = raw.enrollment;
    const med = raw.medical ?? {};
    const parents = (raw.parents?.length ? raw.parents : (raw.parent ? [raw.parent] : []))
      .map(p => ({
        guardianId: p.parentId ?? null,
        name: p.fullName ?? '',
        mobile: p.mobileNumber,
        email: p.email,
        occupation: p.occupation,
        relation: this.formatRelation(p.relationship),
        isPrimaryContact: !!p.primaryContact
      }));
    const primary = parents.find(g => g.isPrimaryContact) ?? parents[0] ?? null;
    const rollNumber = en?.rollNumber || s.rollNumber || null;
    const ageYears = s.ageYears ?? this.ageFromDob(s.dateOfBirth);

    const personal = {
      fullName: s.fullName ?? '',
      firstName: s.firstName,
      middleName: s.middleName,
      lastName: s.lastName,
      gender: this.formatGender(s.gender),
      dateOfBirth: this.formatDateOnly(s.dateOfBirth),
      ageYears,
      nationality: s.nationality,
      religion: s.religion,
      motherTongue: s.motherTongue,
      category: s.category,
      placeOfBirth: s.placeOfBirth,
      identityDocumentType: s.identityDocumentType,
      identityDocumentNumber: s.identityDocumentNumber,
      mobile: s.mobileNumber,
      email: s.email,
      bloodGroup: med.bloodGroup,
      currentAddressLine1: s.currentAddressLine1,
      currentAddressLine2: s.currentAddressLine2,
      currentCity: s.currentCity,
      currentState: s.currentState,
      currentPincode: s.currentPostalCode,
      permanentAddressLine1: s.permanentAddressLine1,
      permanentAddressLine2: s.permanentAddressLine2,
      permanentCity: s.permanentCity,
      permanentState: s.permanentState,
      permanentPincode: s.permanentPostalCode,
      remarks: s.remarks,
      ...med
    };

    const prev = raw.previousSchooling;

    return {
      overview: {
        studentId: s.studentId,
        admissionNumber: s.admissionNumber ?? '',
        studentCode: s.studentCode,
        rollNumber,
        fullName: s.fullName ?? '',
        className: en?.className ?? s.className,
        sectionName: en?.sectionName ?? s.sectionName,
        gender: this.formatGender(s.gender),
        dateOfBirth: this.formatDateOnly(s.dateOfBirth),
        ageYears,
        mobile: s.mobileNumber,
        email: s.email,
        status: (s.status as StudentStatus) ?? 'ACTIVE',
        active: s.status === 'ACTIVE',
        academicYear: en?.academicYear,
        admissionDate: this.formatDateOnly(s.admissionDate),
        enrollmentDate: this.formatDateOnly(en?.enrollmentDate),
        enrollmentStatus: en?.status,
        bloodGroup: med.bloodGroup,
        motherTongue: s.motherTongue,
        nationality: s.nationality,
        religion: s.religion,
        photoUrl: null,
        photoDocumentId: raw.photoDocumentId ?? null,
        profileCompletion: this.computeProfileCompletion(personal, parents.length > 0, !!en)
      },
      personal,
      family: {
        primary,
        guardians: parents,
        siblings: []
      },
      academics: {
        currentClass: en?.className ?? s.className,
        currentSection: en?.sectionName ?? s.sectionName,
        rollNumber,
        academicYear: en?.academicYear,
        admissionDate: this.formatDateOnly(s.admissionDate),
        enrollmentDate: this.formatDateOnly(en?.enrollmentDate),
        enrollmentStatus: en?.status,
        courseCount: 0,
        subjectCount: 0,
        previousSchoolName: prev?.schoolName ?? null,
        previousBoard: prev?.board ?? null,
        previousClass: prev?.className ?? null,
        previousAcademicYear: prev?.academicYear ?? null,
        previousPercentage: prev?.percentage ?? null,
        previousTcNumber: prev?.tcNumber ?? null
      },
      attendance: { totalWorkingDays: 0, present: 0, absent: 0, late: 0, percent: 0 },
      medical: {
        ...med,
        emergencyContactName: s.emergencyContactName,
        emergencyContactPhone: s.emergencyContactPhone,
        emergencyContactRelation: s.emergencyContactRelation,
        emergencyContact: s.emergencyContactName
          ? [s.emergencyContactName, s.emergencyContactRelation, s.emergencyContactPhone]
              .filter(Boolean)
              .join(' · ')
          : null
      }
    };
  }

  private formatGender(gender?: string | null): string | null {
    if (!gender?.trim()) return null;
    return gender.trim()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private formatDateOnly(value?: string | null): string | null {
    if (!value?.trim()) return null;
    return value.trim().substring(0, 10);
  }

  private formatRelation(relationship?: string | null): string {
    if (!relationship) return 'Parent';
    return relationship
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private formatDocumentType(documentType?: string | null): string {
    if (!documentType) return 'Document';
    if (documentType.toUpperCase() === 'OTHER') return 'Additional document';
    return documentType
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private ageFromDob(dateOfBirth?: string | null): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  }

  private computeProfileCompletion(
    personal: StudentPersonal,
    hasFamily: boolean,
    hasEnrollment: boolean
  ): number {
    const checks = [
      !!personal.fullName,
      !!personal.gender,
      !!personal.dateOfBirth,
      !!personal.mobile,
      !!personal.email,
      !!personal.religion || !!personal.nationality || !!personal.motherTongue,
      !!personal.currentAddressLine1 || !!personal.currentCity,
      hasFamily,
      hasEnrollment
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }

  private mapPersonalFromStudent(dto: BackendStudentDto, payload: Partial<StudentPersonal>): StudentPersonal {
    return {
      fullName: dto.fullName ?? payload.fullName ?? '',
      mobile: dto.mobileNumber ?? payload.mobile,
      email: dto.email ?? payload.email,
      gender: payload.gender,
      dateOfBirth: payload.dateOfBirth,
      nationality: payload.nationality,
      religion: payload.religion,
      bloodGroup: payload.bloodGroup,
      motherTongue: payload.motherTongue,
      remarks: payload.remarks
    };
  }

  private mapTimelineEntry(dto: BackendTimelineDto): StudentTimelineEntry {
    const eventType = dto.eventType ?? '';
    return {
      action: dto.title ?? eventType.replace(/_/g, ' ') ?? 'Event',
      description: dto.description ?? '',
      performedBy: dto.createdBy ?? 'System',
      performedAt: dto.createdDate ?? new Date().toISOString(),
      icon: this.timelineIcon(eventType),
      tone: eventType.includes('CREATED') || eventType.includes('ENROLL') ? 'success' : 'info'
    };
  }

  private timelineIcon(eventType: string): string {
    if (eventType.includes('CREATED')) return 'pi pi-user-plus';
    if (eventType.includes('DOCUMENT')) return 'pi pi-file';
    if (eventType.includes('ENROLL') || eventType.includes('ACADEMIC')) return 'pi pi-book';
    if (eventType.includes('ALUMNI')) return 'pi pi-graduation-cap';
    return 'pi pi-pencil';
  }

  private mapAlumni(dto: BackendStudentDto): AlumniResponse {
    return {
      alumniId: dto.studentId,
      studentId: dto.studentId,
      fullName: dto.fullName ?? '',
      course: dto.className,
      contact: dto.mobileNumber,
      email: dto.email
    };
  }

  private mapTransfer(dto: BackendTransferDto): TransferRequest {
    return {
      id: dto.id,
      requestNumber: dto.requestNumber,
      transferNumber: dto.requestNumber,
      studentId: dto.studentId,
      enrollmentId: dto.enrollmentId,
      reason: dto.reason,
      destinationSchool: dto.destinationSchool,
      status: dto.status as TransferStatus,
      requestedOn: dto.requestedOn,
      certificateNumber: dto.certificateNumber
    };
  }

  private resolveAcademicYearId(academicYear?: string | null): Observable<number> {
    if (this.academicYearCache.length) {
      const match = this.academicYearCache.find(y => y.label === academicYear);
      if (match) return of(match.id);
      return of(this.academicYearCache[0].id);
    }
    return this.listAcademicYears().pipe(
      map(years => {
        this.academicYearCache = years;
        const match = years.find(y => y.label === academicYear);
        return match?.id ?? years[0]?.id ?? 1;
      })
    );
  }
}
