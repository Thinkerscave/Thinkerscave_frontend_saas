import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../core/services/login.service';
import {
  AcademicClass,
  AcademicCalendarEventModel,
  AcademicSection,
  AcademicSettingModel,
  AcademicYear,
  AcademicsWorkspaceData,
  ClassTeacherAssignmentModel,
  ShiftModel,
  PeriodTemplateModel,
  StaffModel,
  SubjectModel,
  SyllabusModel,
  TimetableSlotModel,
  TeacherAllocationModel,
  TeacherAbsenceModel,
  TimetableConflictModel,
  SyllabusProgressModel
} from '../models/academics-workspace.model';

@Injectable({ providedIn: 'root' })
export class AcademicsWorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly loginService = inject(LoginService);
  private readonly apiUrl = environment.apiUrl;

  loadWorkspaceData(): Observable<AcademicsWorkspaceData> {
    const organizationId = this.organizationId();

    return forkJoin({
      academicYears: this.getAcademicYears(organizationId),
      currentYear: this.getCurrentAcademicYear(organizationId),
      classes: this.getClasses(),
      subjects: this.getSubjects(organizationId),
      staff: this.getStaff(),
      shifts: this.getShifts(organizationId)
    }).pipe(
      switchMap(base => {
        const yearId = this.academicYearId(base.currentYear) ?? this.academicYearId(base.academicYears.find(year => year.isCurrent)) ?? this.academicYearId(base.academicYears[0]);
        const sections$ = this.getAllSections(base.classes);
        const teacherAllocations$ = yearId ? this.getTeacherAllocations(base.classes, yearId) : of([]);
        const classTeacherAssignments$ = yearId ? this.getClassTeacherAssignments(organizationId, yearId) : of([]);
        const timetableSlots$ = yearId ? this.getTimetableSlots(organizationId, yearId) : of([]);
        const calendarEvents$ = yearId ? this.getCalendarEvents(organizationId, yearId) : of([]);
        const academicSettings$ = this.getAcademicSettings(organizationId);
        const syllabi$ = this.getSyllabi(base.subjects);
        const periodTemplates$ = this.getPeriodTemplates(organizationId);
        const teacherAbsences$ = this.getTeacherAbsences(organizationId);
        const timetableConflicts$ = yearId ? this.getTimetableConflicts(organizationId, yearId) : of([]);
        const syllabusProgress$ = this.getSyllabusProgress(organizationId);

        return forkJoin({
          sections: sections$,
          teacherAllocations: teacherAllocations$,
          classTeacherAssignments: classTeacherAssignments$,
          timetableSlots: timetableSlots$,
          calendarEvents: calendarEvents$,
          academicSettings: academicSettings$,
          syllabi: syllabi$,
          periodTemplates: periodTemplates$,
          teacherAbsences: teacherAbsences$,
          timetableConflicts: timetableConflicts$,
          syllabusProgress: syllabusProgress$
        }).pipe(
          map(extra => ({
            academicYears: base.academicYears,
            currentYear: base.currentYear,
            classes: base.classes,
            sections: extra.sections,
            subjects: base.subjects,
            staff: base.staff,
            teacherAllocations: extra.teacherAllocations,
            classTeacherAssignments: extra.classTeacherAssignments,
            timetableSlots: extra.timetableSlots,
            calendarEvents: extra.calendarEvents,
            academicSettings: extra.academicSettings,
            syllabi: extra.syllabi,
            shifts: base.shifts,
            periodTemplates: extra.periodTemplates,
            teacherAbsences: extra.teacherAbsences,
            timetableConflicts: extra.timetableConflicts,
            syllabusProgress: extra.syllabusProgress
          }))
        );
      }),
      catchError(() => of(this.emptyData()))
    );
  }

  // ─── Academic Years ────────────────────────────────────────────────
  createAcademicYear(payload: { yearCode: string; yearName?: string; startDate: string; endDate: string }): Observable<AcademicYear> {
    return this.http.post<unknown>(`${this.apiUrl}/academic-structure/years`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicYear>(response, {} as AcademicYear)));
  }

  activateAcademicYear(yearId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/academic-structure/years/${this.organizationId()}/current/${yearId}`, {});
  }

  cloneAcademicYear(sourceYearId: number, newYearCode: string): Observable<AcademicYear> {
    return this.http.post<unknown>(`${this.apiUrl}/academic-structure/years/clone`, {
      sourceYearId,
      newYearCode,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicYear>(response, {} as AcademicYear)));
  }

  // ─── Classes ───────────────────────────────────────────────────────
  createClass(payload: { className: string; academicStage?: string; displayOrder?: number }): Observable<AcademicClass> {
    return this.http.post<unknown>(`${this.apiUrl}/classes/saveOrUpdate`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicClass>(response, {} as AcademicClass)));
  }

  updateClass(classId: number, payload: Partial<AcademicClass>): Observable<AcademicClass> {
    return this.http.put<unknown>(`${this.apiUrl}/classes/${classId}`, payload)
      .pipe(map(response => this.unwrapData<AcademicClass>(response, {} as AcademicClass)));
  }

  deactivateClass(classId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/classes/${classId}`);
  }

  // ─── Sections ──────────────────────────────────────────────────────
  createSection(payload: { classId: number; sectionName: string; capacity?: number }): Observable<AcademicSection> {
    return this.http.post<unknown>(`${this.apiUrl}/sections/saveOrUpdate`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicSection>(response, {} as AcademicSection)));
  }

  updateSection(sectionId: number, payload: Partial<AcademicSection>): Observable<AcademicSection> {
    return this.http.put<unknown>(`${this.apiUrl}/sections/${sectionId}`, payload)
      .pipe(map(response => this.unwrapData<AcademicSection>(response, {} as AcademicSection)));
  }

  deactivateSection(sectionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sections/${sectionId}`);
  }

  // ─── Subjects ──────────────────────────────────────────────────────
  createSubject(payload: Partial<SubjectModel>): Observable<SubjectModel> {
    return this.http.post<SubjectModel>(`${this.apiUrl}/subjects`, {
      ...payload,
      organizationId: this.organizationId()
    });
  }

  updateSubject(subjectId: number, payload: Partial<SubjectModel>): Observable<SubjectModel> {
    return this.http.put<SubjectModel>(`${this.apiUrl}/subjects/${subjectId}`, payload);
  }

  deactivateSubject(subjectId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subjects/${subjectId}`);
  }

  // ─── Teacher Allocation ────────────────────────────────────────────
  allocateTeacher(payload: Partial<TeacherAllocationModel>): Observable<TeacherAllocationModel> {
    return this.http.post<TeacherAllocationModel>(`${this.apiUrl}/allocations`, {
      ...payload,
      organizationId: this.organizationId()
    });
  }

  updateAllocation(allocationId: number, payload: Partial<TeacherAllocationModel>): Observable<TeacherAllocationModel> {
    return this.http.put<TeacherAllocationModel>(`${this.apiUrl}/allocations/${allocationId}`, payload);
  }

  removeAllocation(allocationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/allocations/${allocationId}`);
  }

  // ─── Class Teacher Assignment ──────────────────────────────────────
  assignClassTeacher(payload: Partial<ClassTeacherAssignmentModel>): Observable<ClassTeacherAssignmentModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/class-teachers`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<ClassTeacherAssignmentModel>(response, {} as ClassTeacherAssignmentModel)));
  }

  // ─── Timetable ─────────────────────────────────────────────────────
  createTimetableSlot(payload: Partial<TimetableSlotModel>): Observable<TimetableSlotModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/timetable-slots`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<TimetableSlotModel>(response, {} as TimetableSlotModel)));
  }

  updateTimetableSlot(slotId: number, payload: Partial<TimetableSlotModel>): Observable<TimetableSlotModel> {
    return this.http.put<unknown>(`${this.apiUrl}/academics/timetable-slots/${slotId}`, payload)
      .pipe(map(response => this.unwrapData<TimetableSlotModel>(response, {} as TimetableSlotModel)));
  }

  deleteTimetableSlot(slotId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/academics/timetable-slots/${slotId}`);
  }

  autoGenerateTimetable(academicYearId: number, classId: number, sectionId: number): Observable<TimetableSlotModel[]> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/timetable/auto-generate`, {
      academicYearId,
      classId,
      sectionId,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapArray<TimetableSlotModel>(response)));
  }

  publishTimetable(academicYearId: number, classId: number, sectionId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/academics/timetable/publish`, {
      academicYearId,
      classId,
      sectionId,
      organizationId: this.organizationId()
    });
  }

  // ─── Calendar Events ───────────────────────────────────────────────
  createCalendarEvent(payload: Partial<AcademicCalendarEventModel>): Observable<AcademicCalendarEventModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/calendar-events`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicCalendarEventModel>(response, {} as AcademicCalendarEventModel)));
  }

  updateCalendarEvent(eventId: number, payload: Partial<AcademicCalendarEventModel>): Observable<AcademicCalendarEventModel> {
    return this.http.put<unknown>(`${this.apiUrl}/academics/calendar-events/${eventId}`, payload)
      .pipe(map(response => this.unwrapData<AcademicCalendarEventModel>(response, {} as AcademicCalendarEventModel)));
  }

  deleteCalendarEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/academics/calendar-events/${eventId}`);
  }

  // ─── Settings ──────────────────────────────────────────────────────
  saveAcademicSetting(payload: Partial<AcademicSettingModel>): Observable<AcademicSettingModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/settings`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicSettingModel>(response, {} as AcademicSettingModel)));
  }

  // ─── Shifts ────────────────────────────────────────────────────────
  createShift(payload: Partial<ShiftModel>): Observable<ShiftModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/shifts`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<ShiftModel>(response, {} as ShiftModel)));
  }

  // ─── Period Templates ──────────────────────────────────────────────
  createPeriodTemplate(payload: Partial<PeriodTemplateModel>): Observable<PeriodTemplateModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/period-templates`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<PeriodTemplateModel>(response, {} as PeriodTemplateModel)));
  }

  // ─── Teacher Absences ──────────────────────────────────────────────
  createTeacherAbsence(payload: Partial<TeacherAbsenceModel>): Observable<TeacherAbsenceModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/teacher-absences`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<TeacherAbsenceModel>(response, {} as TeacherAbsenceModel)));
  }

  approveAbsence(absenceId: number): Observable<TeacherAbsenceModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/teacher-absences/${absenceId}/approve`, {})
      .pipe(map(response => this.unwrapData<TeacherAbsenceModel>(response, {} as TeacherAbsenceModel)));
  }

  rejectAbsence(absenceId: number): Observable<TeacherAbsenceModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/teacher-absences/${absenceId}/reject`, {})
      .pipe(map(response => this.unwrapData<TeacherAbsenceModel>(response, {} as TeacherAbsenceModel)));
  }

  overrideAbsence(absenceId: number, replacementTeacherId: number): Observable<TeacherAbsenceModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/teacher-absences/${absenceId}/override`, {
      replacementTeacherId
    }).pipe(map(response => this.unwrapData<TeacherAbsenceModel>(response, {} as TeacherAbsenceModel)));
  }

  // ─── Syllabus Progress ─────────────────────────────────────────────
  updateTopicProgress(topicId: number, status: string, remarks?: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/syllabus/topics/${topicId}/progress`, { status, remarks });
  }

  // ─── Private GET methods ───────────────────────────────────────────
  private getAcademicYears(organizationId: number): Observable<AcademicYear[]> {
    return this.http.get<unknown>(`${this.apiUrl}/academic-structure/years/${organizationId}`)
      .pipe(map(response => this.unwrapArray<AcademicYear>(response)), catchError(() => of([])));
  }

  private getCurrentAcademicYear(organizationId: number): Observable<AcademicYear | null> {
    return this.http.get<unknown>(`${this.apiUrl}/academic-structure/years/${organizationId}/current`)
      .pipe(map(response => this.unwrapData<AcademicYear | null>(response, null)), catchError(() => of(null)));
  }

  private getClasses(): Observable<AcademicClass[]> {
    return this.http.get<unknown>(`${this.apiUrl}/classes/getListOfClass`)
      .pipe(map(response => this.unwrapArray<AcademicClass>(response)), catchError(() => of([])));
  }

  private getSubjects(organizationId: number): Observable<SubjectModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/subjects/org/${organizationId}`)
      .pipe(map(response => this.unwrapArray<SubjectModel>(response)), catchError(() => of([])));
  }

  private getStaff(): Observable<StaffModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/staff/getAllStaff`)
      .pipe(map(response => this.unwrapArray<StaffModel>(response)), catchError(() => of([])));
  }

  private getShifts(organizationId: number): Observable<ShiftModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/academics/shifts/org/${organizationId}`)
      .pipe(map(response => this.unwrapArray<ShiftModel>(response)), catchError(() => of([])));
  }

  private getPeriodTemplates(organizationId: number): Observable<PeriodTemplateModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/academics/period-templates/org/${organizationId}`)
      .pipe(map(response => this.unwrapArray<PeriodTemplateModel>(response)), catchError(() => of([])));
  }

  private getTeacherAbsences(organizationId: number): Observable<TeacherAbsenceModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/academics/teacher-absences/org/${organizationId}`)
      .pipe(map(response => this.unwrapArray<TeacherAbsenceModel>(response)), catchError(() => of([])));
  }

  private getTimetableConflicts(organizationId: number, yearId: number): Observable<TimetableConflictModel[]> {
    const params = new HttpParams().set('organizationId', organizationId).set('academicYearId', yearId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/timetable/conflicts`, { params })
      .pipe(map(response => this.unwrapArray<TimetableConflictModel>(response)), catchError(() => of([])));
  }

  private getSyllabusProgress(organizationId: number): Observable<SyllabusProgressModel | null> {
    return this.http.get<unknown>(`${this.apiUrl}/syllabus/progress/org/${organizationId}`)
      .pipe(map(response => this.unwrapData<SyllabusProgressModel | null>(response, null)), catchError(() => of(null)));
  }

  private getClassTeacherAssignments(organizationId: number, yearId: number): Observable<ClassTeacherAssignmentModel[]> {
    const params = new HttpParams().set('organizationId', organizationId).set('academicYearId', yearId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/class-teachers`, { params })
      .pipe(map(response => this.unwrapArray<ClassTeacherAssignmentModel>(response)), catchError(() => of([])));
  }

  private getTimetableSlots(organizationId: number, yearId: number): Observable<TimetableSlotModel[]> {
    const params = new HttpParams().set('organizationId', organizationId).set('academicYearId', yearId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/timetable-slots`, { params })
      .pipe(map(response => this.unwrapArray<TimetableSlotModel>(response)), catchError(() => of([])));
  }

  private getCalendarEvents(organizationId: number, yearId: number): Observable<AcademicCalendarEventModel[]> {
    const params = new HttpParams().set('organizationId', organizationId).set('academicYearId', yearId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/calendar-events`, { params })
      .pipe(map(response => this.unwrapArray<AcademicCalendarEventModel>(response)), catchError(() => of([])));
  }

  private getAcademicSettings(organizationId: number): Observable<AcademicSettingModel[]> {
    const params = new HttpParams().set('organizationId', organizationId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/settings`, { params })
      .pipe(map(response => this.unwrapArray<AcademicSettingModel>(response)), catchError(() => of([])));
  }

  private getTeacherAllocations(classes: AcademicClass[], academicYearId: number): Observable<TeacherAllocationModel[]> {
    const requests = classes
      .map(academicClass => Number(academicClass.classId))
      .filter(classId => Number.isFinite(classId) && classId > 0)
      .map(classId => this.http.get<unknown>(`${this.apiUrl}/allocations/class/${classId}`, {
        params: new HttpParams().set('academicYearId', academicYearId)
      }).pipe(map(response => this.unwrapArray<TeacherAllocationModel>(response)), catchError(() => of([] as TeacherAllocationModel[]))));

    return requests.length ? forkJoin(requests).pipe(map(groups => groups.flat())) : of([]);
  }

  private getSyllabi(subjects: SubjectModel[]): Observable<SyllabusModel[]> {
    const requests = subjects
      .map(subject => Number(subject.subjectId))
      .filter(subjectId => Number.isFinite(subjectId) && subjectId > 0)
      .map(subjectId => this.http.get<SyllabusModel>(`${this.apiUrl}/syllabus/subject/${subjectId}/latest`).pipe(
        catchError(() => of(null))
      ));

    return requests.length
      ? forkJoin(requests).pipe(map(results => results.filter((item): item is SyllabusModel => item !== null)))
      : of([]);
  }

  private getAllSections(classes: AcademicClass[]): Observable<AcademicSection[]> {
    if (!classes.length) return of([]);

    const sectionRequests = classes.map(academicClass => {
      const classId = Number(academicClass.classId);
      if (!Number.isFinite(classId)) return of([] as AcademicSection[]);

      return this.http.get<unknown>(`${this.apiUrl}/sections/getListOfSectionsByClassId/${classId}`)
        .pipe(
          map(response => this.unwrapArray<AcademicSection>(response).map(section => ({ ...section, classId, classEntity: academicClass }))),
          catchError(() => of([] as AcademicSection[]))
        );
    });

    return forkJoin(sectionRequests).pipe(map(sectionGroups => sectionGroups.flat()));
  }

  // ─── Utility methods ───────────────────────────────────────────────
  private unwrapArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) return response as T[];
    const data = this.extractData(response);
    if (Array.isArray(data)) return data as T[];
    return [];
  }

  private unwrapData<T>(response: unknown, fallback: T): T {
    const data = this.extractData(response);
    return data === undefined || data === null ? fallback : data as T;
  }

  private extractData(response: unknown): unknown {
    if (response && typeof response === 'object') {
      const objectResponse = response as Record<string, unknown>;
      if ('data' in objectResponse) return objectResponse['data'];
    }
    return response;
  }

  private academicYearId(year: AcademicYear | null | undefined): number | undefined {
    const value = year?.academicYearId ?? year?.id;
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }

  organizationId(): number {
    const configured = Number(this.loginService.getCurrentOrganizationId() ?? environment.defaultOrganizationId ?? 1);
    return Number.isFinite(configured) && configured > 0 ? configured : 1;
  }

  private emptyData(): AcademicsWorkspaceData {
    return {
      academicYears: [],
      currentYear: null,
      classes: [],
      sections: [],
      subjects: [],
      staff: [],
      teacherAllocations: [],
      classTeacherAssignments: [],
      timetableSlots: [],
      calendarEvents: [],
      academicSettings: [],
      syllabi: [],
      shifts: [],
      periodTemplates: [],
      teacherAbsences: [],
      timetableConflicts: [],
      syllabusProgress: null
    };
  }
}