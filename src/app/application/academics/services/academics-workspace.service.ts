import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { academicsApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../../shared/utils/api-response.util';
import {
  AcademicCalendarEventModel,
  AcademicClass,
  AcademicSection,
  AcademicYear,
  AcademicsWorkspaceData,
  ClassTeacherAssignmentModel,
  PeriodTemplateModel,
  ShiftModel,
  StaffModel,
  SubjectModel,
  SyllabusModel,
  SyllabusProgressModel,
  TeacherAbsenceModel,
  TeacherAllocationModel,
  TimetableConflictModel,
  TimetableSlotModel
} from '../models/academics-workspace.model';

type BackendYear = {
  academicYearId: number;
  yearCode: string;
  yearName?: string;
  startDate: string;
  endDate: string;
  currentYear?: boolean;
  active?: boolean;
};

type BackendSchedule = {
  scheduleId: number;
  scheduleName: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
};

type BackendTimetableTemplate = {
  templateId: number;
  scheduleId: number;
  templateName: string;
};

type BackendPeriod = {
  periodTemplateId: number;
  templateId?: number;
  periodNumber: number;
  periodName: string;
  startTime: string;
  endTime: string;
  periodType?: string;
};

type BackendSubjectAssignment = {
  subjectAssignmentId: number;
  academicYearId: number;
  classId: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  subjectId: number;
  subjectName?: string;
  teacherId: number;
  periodsPerWeek?: number;
  active?: boolean;
};

type BackendTimetableResponse = {
  classId: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  schedule?: Record<string, BackendTimetableSlot[]>;
};

type BackendTimetableSlot = {
  slotId: number;
  dayOfWeek: string;
  periodNumber?: number;
  periodName?: string;
  startTime?: string;
  endTime?: string;
  subjectName?: string;
  teacherId?: number;
  active?: boolean;
};

type BackendArrangement = {
  arrangementId: number;
  slotId?: number;
  absentTeacherId?: number;
  substituteTeacherId?: number;
  arrangementDate?: string;
  status?: string;
  reason?: string;
};

@Injectable({ providedIn: 'root' })
export class AcademicsWorkspaceService {
  private readonly http = inject(HttpClient);

  loadWorkspaceData(yearId?: number): Observable<AcademicsWorkspaceData> {
    return this.getAcademicYears().pipe(
      switchMap(years => {
        const current = years.find(y => y.isCurrent) ?? years[0] ?? null;
        const resolvedYearId = yearId ?? current?.academicYearId ?? current?.id;
        if (!resolvedYearId) {
          return of(this.emptyData(years, null));
        }

        return forkJoin({
          classes: this.getClassesByYear(resolvedYearId),
          subjects: this.getSubjects(),
          staff: this.getStaff(),
          schedules: this.getSchedules(resolvedYearId),
          teacherAllocations: this.getSubjectAssignments(resolvedYearId),
          classTeacherAssignments: this.getClassTeacherAssignments(resolvedYearId),
          calendarEvents: this.getCalendarEvents(resolvedYearId),
          teacherAbsences: this.getArrangementsByDate(new Date().toISOString().slice(0, 10)),
          syllabi: this.getSyllabi(resolvedYearId),
          periodTemplates: this.getPeriodTemplatesForYear(resolvedYearId),
          timetableSlots: of([] as TimetableSlotModel[])
        }).pipe(
          switchMap(bundle => {
            const classIds = bundle.classes.map(c => Number(c.classId)).filter(id => id > 0);
            const sections$ = classIds.length ? this.getAllSections(classIds, bundle.classes) : of([] as AcademicSection[]);
            return sections$.pipe(
              map(sections => {
                const firstClass = bundle.classes[0];
                const firstSection = sections.find(s => Number(s.classId) === Number(firstClass?.classId));
                return { ...bundle, sections, firstClass, firstSection };
              })
            );
          }),
          switchMap(bundle => {
            const classId = Number(bundle.firstClass?.classId);
            const sectionId = Number(bundle.firstSection?.sectionId);
            if (!classId) {
              return of(this.composeData(years, current, bundle.classes, bundle.sections, bundle));
            }
            return this.getTimetableSlots(classId, sectionId > 0 ? sectionId : undefined).pipe(
              map(timetableSlots => this.composeData(years, current, bundle.classes, bundle.sections, { ...bundle, timetableSlots }))
            );
          }),
          catchError(() => of(this.emptyData(years, current)))
        );
      }),
      catchError(() => of(this.emptyData([], null)))
    );
  }

  loadTimetable(classId: number, sectionId?: number): Observable<TimetableSlotModel[]> {
    return this.getTimetableSlots(classId, sectionId);
  }

  createAcademicYear(payload: { yearCode: string; yearName?: string; startDate: string; endDate: string }): Observable<AcademicYear> {
    return this.http.post<unknown>(academicsApi.years, {
      yearCode: payload.yearCode,
      yearName: payload.yearName ?? payload.yearCode,
      startDate: payload.startDate,
      endDate: payload.endDate
    }).pipe(map(r => this.mapYear(unwrapApiResponse<BackendYear>(r, {} as BackendYear))));
  }

  activateAcademicYear(yearId: number): Observable<void> {
    return this.http.patch<void>(academicsApi.setCurrentYear(yearId), {});
  }

  cloneAcademicYear(sourceYearId: number, newYearCode: string, newYearName?: string): Observable<AcademicYear> {
    return this.http.post<unknown>(academicsApi.cloneYear(sourceYearId), {
      newYearCode,
      newYearName: newYearName ?? newYearCode,
      copyClasses: true,
      copySections: true,
      copySubjects: true,
      copySchedules: true,
      copyTemplates: true
    }).pipe(map(r => this.mapYear(unwrapApiResponse<BackendYear>(r, {} as BackendYear))));
  }

  createClass(payload: { className: string; classCode?: string; academicStage?: string; displayOrder?: number; academicYearId?: number }, yearId?: number): Observable<AcademicClass> {
    const academicYearId = payload.academicYearId ?? yearId;
    if (!academicYearId) throw new Error('Academic year is required');
    const classCode = (payload.classCode || payload.className).replace(/\s+/g, '_').toUpperCase().slice(0, 30);
    return this.http.post<unknown>(academicsApi.classes, {
      academicYearId,
      classCode,
      className: payload.className,
      academicStage: payload.academicStage || 'PRIMARY',
      displayOrder: payload.displayOrder
    }).pipe(map(r => this.mapClass(unwrapApiResponse(r, {}))));
  }

  updateClass(classId: number, payload: Partial<AcademicClass> & { academicYearId?: number }): Observable<AcademicClass> {
    return this.http.put<unknown>(academicsApi.classById(classId), payload)
      .pipe(map(r => this.mapClass(unwrapApiResponse(r, {}))));
  }

  deactivateClass(classId: number): Observable<void> {
    return this.http.patch<void>(academicsApi.deactivateClass(classId), {});
  }

  createSection(payload: { classId: number; sectionName: string; capacity?: number }): Observable<AcademicSection> {
    return this.http.post<unknown>(academicsApi.sectionsByClass(payload.classId), {
      classId: payload.classId,
      sectionName: payload.sectionName,
      capacity: payload.capacity
    }).pipe(map(r => this.mapSection(unwrapApiResponse(r, {}))));
  }

  updateSection(sectionId: number, payload: Partial<AcademicSection>): Observable<AcademicSection> {
    return this.http.put<unknown>(academicsApi.sectionById(sectionId), payload)
      .pipe(map(r => this.mapSection(unwrapApiResponse(r, {}))));
  }

  deactivateSection(sectionId: number): Observable<void> {
    return this.http.patch<void>(academicsApi.deactivateSection(sectionId), {});
  }

  createSubject(payload: Partial<SubjectModel>): Observable<SubjectModel> {
    return this.http.post<unknown>(academicsApi.subjects, {
      subjectCode: payload.subjectCode,
      subjectName: payload.subjectName,
      subjectType: payload.subjectType || 'CORE',
      active: payload.isActive ?? true
    }).pipe(map(r => this.mapSubject(unwrapApiResponse(r, {}))));
  }

  updateSubject(subjectId: number, payload: Partial<SubjectModel>): Observable<SubjectModel> {
    return this.http.put<unknown>(academicsApi.subjectById(subjectId), {
      subjectCode: payload.subjectCode,
      subjectName: payload.subjectName,
      subjectType: payload.subjectType,
      active: payload.isActive
    }).pipe(map(r => this.mapSubject(unwrapApiResponse(r, {}))));
  }

  deactivateSubject(subjectId: number): Observable<void> {
    return this.http.patch<void>(academicsApi.deactivateSubject(subjectId), {});
  }

  allocateTeacher(payload: Partial<TeacherAllocationModel> & { academicYearId?: number }): Observable<TeacherAllocationModel> {
    return this.http.post<unknown>(academicsApi.subjectAssignments, {
      academicYearId: payload.academicYearId,
      classId: payload.classId,
      sectionId: payload.sectionId,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId ?? payload.primaryTeacherId,
      periodsPerWeek: payload.periodsPerWeek ?? payload.weeklyLoad ?? 5
    }).pipe(map(r => this.mapSubjectAssignment(unwrapApiResponse<BackendSubjectAssignment>(r, {} as BackendSubjectAssignment))));
  }

  updateAllocation(allocationId: number, payload: Partial<TeacherAllocationModel>): Observable<TeacherAllocationModel> {
    return this.http.put<unknown>(academicsApi.subjectAssignmentById(allocationId), {
      academicYearId: payload.academicYearId,
      classId: payload.classId,
      sectionId: payload.sectionId,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId ?? payload.primaryTeacherId,
      periodsPerWeek: payload.periodsPerWeek ?? payload.weeklyLoad ?? 5
    }).pipe(map(r => this.mapSubjectAssignment(unwrapApiResponse<BackendSubjectAssignment>(r, {} as BackendSubjectAssignment))));
  }

  removeAllocation(allocationId: number): Observable<void> {
    return this.http.delete<void>(academicsApi.subjectAssignmentById(allocationId));
  }

  assignClassTeacher(payload: Partial<ClassTeacherAssignmentModel>): Observable<ClassTeacherAssignmentModel> {
    return this.http.post<unknown>(academicsApi.classTeachers, payload)
      .pipe(map(r => this.mapClassTeacher(unwrapApiResponse(r, {}))));
  }

  createTimetableSlot(payload: {
    classId: number;
    sectionId?: number;
    dayOfWeek: string;
    periodTemplateId: number;
    subjectAssignmentId: number;
  }): Observable<TimetableSlotModel> {
    return this.http.post<unknown>(academicsApi.timetableSlots, payload)
      .pipe(map(r => this.mapTimetableSlot(unwrapApiResponse(r, {}), payload.classId, payload.sectionId)));
  }

  updateTimetableSlot(slotId: number, payload: {
    classId: number;
    sectionId?: number;
    dayOfWeek: string;
    periodTemplateId: number;
    subjectAssignmentId: number;
  }): Observable<TimetableSlotModel> {
    return this.http.put<unknown>(academicsApi.timetableSlotById(slotId), payload)
      .pipe(map(r => this.mapTimetableSlot(unwrapApiResponse(r, {}), payload.classId, payload.sectionId)));
  }

  deleteTimetableSlot(slotId: number): Observable<void> {
    return this.http.delete<void>(academicsApi.timetableSlotById(slotId));
  }

  autoGenerateTimetable(_academicYearId: number, _classId: number, _sectionId: number): Observable<TimetableSlotModel[]> {
    return of([]);
  }

  publishTimetable(_academicYearId: number, _classId: number, _sectionId: number): Observable<void> {
    return of(void 0);
  }

  createCalendarEvent(yearId: number, payload: Partial<AcademicCalendarEventModel>): Observable<AcademicCalendarEventModel> {
    return this.http.post<unknown>(academicsApi.calendarEventsByYear(yearId), {
      title: payload.title,
      eventType: payload.eventType,
      startDate: payload.startDate,
      endDate: payload.endDate ?? payload.startDate,
      description: payload.description,
      allDay: payload.allDay ?? true,
      academicYearId: yearId
    }).pipe(map(r => this.mapCalendarEvent(unwrapApiResponse(r, {}))));
  }

  updateCalendarEvent(eventId: number, payload: Partial<AcademicCalendarEventModel>): Observable<AcademicCalendarEventModel> {
    return this.http.put<unknown>(academicsApi.calendarEventById(eventId), payload)
      .pipe(map(r => this.mapCalendarEvent(unwrapApiResponse(r, {}))));
  }

  deleteCalendarEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(academicsApi.calendarEventById(eventId));
  }

  createShift(yearId: number, payload: Partial<ShiftModel>): Observable<ShiftModel> {
    return this.http.post<unknown>(academicsApi.schedules, {
      academicYearId: yearId,
      scheduleName: payload.shiftName,
      startDate: payload.startTime?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      endDate: payload.endTime?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
    }).pipe(map(r => this.mapScheduleToShift(unwrapApiResponse<BackendSchedule>(r, {} as BackendSchedule))));
  }

  createPeriodTemplate(scheduleId: number, payload: Partial<PeriodTemplateModel>): Observable<PeriodTemplateModel> {
    return this.http.post<unknown>(academicsApi.scheduleTemplates(scheduleId), {
      scheduleId,
      templateName: payload.templateName ?? `Template ${scheduleId}`
    }).pipe(
      switchMap(template => {
        const templateId = (template as BackendTimetableTemplate).templateId;
        return this.http.post<unknown>(academicsApi.templatePeriods(templateId), {
          periodNumber: payload.periodNumber,
          periodName: payload.templateName ?? `Period ${payload.periodNumber}`,
          startTime: payload.startTime,
          endTime: payload.endTime,
          periodType: payload.isBreak ? 'BREAK' : 'CLASS',
          displayOrder: payload.periodNumber
        }).pipe(map(r => this.mapPeriod(unwrapApiResponse<BackendPeriod>(r, {} as BackendPeriod), scheduleId, templateId)));
      })
    );
  }

  createTeacherAbsence(payload: {
    slotId: number;
    absentTeacherId: number;
    substituteTeacherId: number;
    arrangementDate: string;
    reason?: string;
  }): Observable<TeacherAbsenceModel> {
    return this.http.post<unknown>(academicsApi.arrangements, payload)
      .pipe(map(r => this.mapArrangement(unwrapApiResponse<BackendArrangement>(r, {} as BackendArrangement))));
  }

  approveAbsence(arrangementId: number, approvedBy: number): Observable<TeacherAbsenceModel> {
    const params = new HttpParams().set('approvedBy', approvedBy);
    return this.http.patch<unknown>(academicsApi.approveArrangement(arrangementId), null, { params })
      .pipe(map(r => this.mapArrangement(unwrapApiResponse<BackendArrangement>(r, {} as BackendArrangement))));
  }

  rejectAbsence(arrangementId: number): Observable<TeacherAbsenceModel> {
    return this.http.patch<unknown>(academicsApi.rejectArrangement(arrangementId), null)
      .pipe(map(r => this.mapArrangement(unwrapApiResponse<BackendArrangement>(r, {} as BackendArrangement))));
  }

  assignSubstitute(arrangementId: number, substituteTeacherId: number, slotId: number, absentTeacherId: number, arrangementDate: string): Observable<TeacherAbsenceModel> {
    return this.createTeacherAbsence({
      slotId,
      absentTeacherId,
      substituteTeacherId,
      arrangementDate,
      reason: 'Manual substitute override'
    });
  }

  updateTopicProgress(topicId: number, status: string, remarks?: string): Observable<void> {
    return this.http.patch<void>(academicsApi.topicProgress(topicId), { status, remarks });
  }

  getSyllabusProgress(syllabusId: number): Observable<SyllabusProgressModel | null> {
    return this.http.get<unknown>(academicsApi.syllabusProgress(syllabusId)).pipe(
      map(r => {
        const data = unwrapApiResponse<SyllabusProgressModel | null>(r, null);
        return data;
      }),
      catchError(() => of(null))
    );
  }

  private composeData(
    years: AcademicYear[],
    current: AcademicYear | null,
    classes: AcademicClass[],
    sections: AcademicSection[],
    bundle: {
      subjects: SubjectModel[];
      staff: StaffModel[];
      schedules: ShiftModel[];
      teacherAllocations: TeacherAllocationModel[];
      classTeacherAssignments: ClassTeacherAssignmentModel[];
      timetableSlots: TimetableSlotModel[];
      calendarEvents: AcademicCalendarEventModel[];
      teacherAbsences: TeacherAbsenceModel[];
      syllabi: SyllabusModel[];
      periodTemplates: PeriodTemplateModel[];
    }
  ): AcademicsWorkspaceData {
    return {
      academicYears: years,
      currentYear: current,
      classes,
      sections,
      subjects: bundle.subjects,
      staff: bundle.staff,
      teacherAllocations: bundle.teacherAllocations,
      classTeacherAssignments: bundle.classTeacherAssignments,
      timetableSlots: bundle.timetableSlots,
      calendarEvents: bundle.calendarEvents,
      academicSettings: [],
      syllabi: bundle.syllabi,
      shifts: bundle.schedules,
      periodTemplates: bundle.periodTemplates,
      teacherAbsences: bundle.teacherAbsences,
      timetableConflicts: [],
      syllabusProgress: null
    };
  }

  private getAcademicYears(): Observable<AcademicYear[]> {
    return this.http.get<unknown>(academicsApi.years).pipe(
      map(r => unwrapApiList<BackendYear>(r).map(y => this.mapYear(y))),
      catchError(() => of([]))
    );
  }

  private getClassesByYear(yearId: number): Observable<AcademicClass[]> {
    return this.http.get<unknown>(academicsApi.classesByYear(yearId)).pipe(
      map(r => unwrapApiList(r).map((c: unknown) => this.mapClass(c))),
      catchError(() => of([]))
    );
  }

  private getAllSections(classIds: number[], classes: AcademicClass[]): Observable<AcademicSection[]> {
    const requests = classIds.map(classId =>
      this.http.get<unknown>(academicsApi.sectionsByClass(classId)).pipe(
        map(r => unwrapApiList(r).map((s: unknown) => {
          const section = this.mapSection(s);
          section.classId = classId;
          section.classEntity = classes.find(c => Number(c.classId) === classId);
          return section;
        })),
        catchError(() => of([] as AcademicSection[]))
      )
    );
    return forkJoin(requests).pipe(map(groups => groups.flat()));
  }

  private getSubjects(): Observable<SubjectModel[]> {
    return this.http.get<unknown>(academicsApi.subjects).pipe(
      map(r => unwrapApiList(r).map((s: unknown) => this.mapSubject(s))),
      catchError(() => of([]))
    );
  }

  private getStaff(): Observable<StaffModel[]> {
    return this.http.get<unknown>(academicsApi.staffAll).pipe(
      map(r => unwrapApiList<StaffModel>(r)),
      catchError(() => of([]))
    );
  }

  private getSchedules(yearId: number): Observable<ShiftModel[]> {
    return this.http.get<unknown>(academicsApi.schedulesByYear(yearId)).pipe(
      map(r => unwrapApiList<BackendSchedule>(r).map(s => this.mapScheduleToShift(s))),
      catchError(() => of([]))
    );
  }

  private getPeriodTemplatesForYear(yearId: number): Observable<PeriodTemplateModel[]> {
    return this.getSchedules(yearId).pipe(
      switchMap(schedules => {
        if (!schedules.length) return of([] as PeriodTemplateModel[]);
        const templateRequests = schedules.flatMap(shift =>
          this.http.get<unknown>(academicsApi.scheduleTemplates(Number(shift.shiftId))).pipe(
            switchMap(r => {
              const templates = unwrapApiList<BackendTimetableTemplate>(r);
              if (!templates.length) return of([] as PeriodTemplateModel[]);
              const periodRequests = templates.map(t =>
                this.http.get<unknown>(academicsApi.templatePeriods(t.templateId)).pipe(
                  map(pr => unwrapApiList<BackendPeriod>(pr).map(p => this.mapPeriod(p, Number(shift.shiftId), t.templateId))),
                  catchError(() => of([] as PeriodTemplateModel[]))
                )
              );
              return forkJoin(periodRequests).pipe(map(groups => groups.flat()));
            }),
            catchError(() => of([] as PeriodTemplateModel[]))
          )
        );
        return templateRequests.length ? forkJoin(templateRequests).pipe(map(groups => groups.flat())) : of([]);
      })
    );
  }

  private getSubjectAssignments(yearId: number): Observable<TeacherAllocationModel[]> {
    return this.getClassesByYear(yearId).pipe(
      switchMap(classes => {
        if (!classes.length) return of([] as TeacherAllocationModel[]);
        const requests = classes.map(c => {
          const classId = Number(c.classId);
          const params = new HttpParams().set('yearId', yearId).set('classId', classId);
          return this.http.get<unknown>(academicsApi.subjectAssignments, { params }).pipe(
            map(r => unwrapApiList<BackendSubjectAssignment>(r).map(a => this.mapSubjectAssignment(a))),
            catchError(() => of([] as TeacherAllocationModel[]))
          );
        });
        return forkJoin(requests).pipe(map(groups => groups.flat()));
      })
    );
  }

  private getClassTeacherAssignments(yearId: number): Observable<ClassTeacherAssignmentModel[]> {
    return this.getClassesByYear(yearId).pipe(
      switchMap(classes => {
        if (!classes.length) return of([] as ClassTeacherAssignmentModel[]);
        const requests = classes.map(c => {
          const classId = Number(c.classId);
          const params = new HttpParams().set('yearId', yearId).set('classId', classId);
          return this.http.get<unknown>(academicsApi.classTeachers, { params }).pipe(
            map(r => unwrapApiList(r).map((a: unknown) => this.mapClassTeacher(a))),
            catchError(() => of([] as ClassTeacherAssignmentModel[]))
          );
        });
        return forkJoin(requests).pipe(map(groups => groups.flat()));
      })
    );
  }

  private getTimetableSlots(classId: number, sectionId?: number): Observable<TimetableSlotModel[]> {
    let params = new HttpParams();
    if (sectionId) params = params.set('sectionId', sectionId);
    return this.http.get<unknown>(academicsApi.timetableByClass(classId), { params }).pipe(
      map(r => {
        const data = unwrapApiResponse<BackendTimetableResponse>(r, {} as BackendTimetableResponse);
        return this.flattenTimetable(data);
      }),
      catchError(() => of([]))
    );
  }

  private getCalendarEvents(yearId: number): Observable<AcademicCalendarEventModel[]> {
    return this.http.get<unknown>(academicsApi.calendarEventsByYear(yearId)).pipe(
      map(r => unwrapApiList(r).map((e: unknown) => this.mapCalendarEvent(e))),
      catchError(() => of([]))
    );
  }

  private getArrangementsByDate(date: string): Observable<TeacherAbsenceModel[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<unknown>(academicsApi.arrangementsByDate, { params }).pipe(
      map(r => unwrapApiList<BackendArrangement>(r).map(a => this.mapArrangement(a))),
      catchError(() => of([]))
    );
  }

  private getSyllabi(yearId: number): Observable<SyllabusModel[]> {
    return this.getClassesByYear(yearId).pipe(
      switchMap(classes => {
        if (!classes.length) return of([] as SyllabusModel[]);
        const requests = classes.map(c =>
          this.http.get<unknown>(academicsApi.syllabus, {
            params: new HttpParams().set('classId', Number(c.classId)).set('yearId', yearId)
          }).pipe(
            map(r => unwrapApiList<SyllabusModel>(r)),
            catchError(() => of([] as SyllabusModel[]))
          )
        );
        return forkJoin(requests).pipe(map(groups => groups.flat()));
      })
    );
  }

  private mapYear(y: BackendYear): AcademicYear {
    return {
      academicYearId: y.academicYearId,
      id: y.academicYearId,
      yearCode: y.yearCode,
      yearName: y.yearName,
      startDate: y.startDate,
      endDate: y.endDate,
      isCurrent: y.currentYear,
      isActive: y.active
    };
  }

  private mapClass(raw: unknown): AcademicClass {
    const c = raw as Record<string, unknown>;
    return {
      classId: c['classId'] as number,
      className: String(c['className'] ?? ''),
      academicStage: c['academicStage'] as string,
      displayOrder: c['displayOrder'] as number,
      isActive: c['active'] as boolean
    };
  }

  private mapSection(raw: unknown): AcademicSection {
    const s = raw as Record<string, unknown>;
    return {
      sectionId: s['sectionId'] as number,
      sectionName: String(s['sectionName'] ?? ''),
      classId: s['classId'] as number,
      capacity: s['capacity'] as number,
      isActive: s['active'] as boolean
    };
  }

  private mapSubject(raw: unknown): SubjectModel {
    const s = raw as Record<string, unknown>;
    return {
      subjectId: s['subjectId'] as number,
      subjectCode: String(s['subjectCode'] ?? ''),
      subjectName: String(s['subjectName'] ?? ''),
      subjectType: s['subjectType'] as string,
      isActive: s['active'] as boolean
    };
  }

  private mapSubjectAssignment(a: BackendSubjectAssignment): TeacherAllocationModel {
    return {
      allocationId: a.subjectAssignmentId,
      academicYearId: a.academicYearId,
      classId: a.classId,
      className: a.className,
      sectionId: a.sectionId,
      sectionName: a.sectionName,
      subjectId: a.subjectId,
      subjectName: a.subjectName,
      teacherId: a.teacherId,
      primaryTeacherId: a.teacherId,
      periodsPerWeek: a.periodsPerWeek,
      weeklyLoad: a.periodsPerWeek,
      isActive: a.active
    };
  }

  private mapClassTeacher(raw: unknown): ClassTeacherAssignmentModel {
    const a = raw as Record<string, unknown>;
    return {
      assignmentId: a['assignmentId'] as number,
      academicYearId: a['academicYearId'] as number,
      classId: a['classId'] as number,
      className: a['className'] as string,
      sectionId: a['sectionId'] as number,
      sectionName: a['sectionName'] as string,
      teacherId: a['teacherId'] as number,
      isActive: a['active'] as boolean
    };
  }

  private mapScheduleToShift(s: BackendSchedule): ShiftModel {
    return {
      shiftId: s.scheduleId,
      shiftName: s.scheduleName,
      startTime: s.startDate ?? '',
      endTime: s.endDate ?? '',
      totalPeriods: 0,
      isActive: s.active
    };
  }

  private mapPeriod(p: BackendPeriod, scheduleId: number, templateId: number): PeriodTemplateModel {
    return {
      templateId: p.periodTemplateId,
      templateName: p.periodName,
      shiftId: scheduleId,
      periodNumber: p.periodNumber,
      startTime: String(p.startTime ?? '').slice(0, 5),
      endTime: String(p.endTime ?? '').slice(0, 5),
      durationMinutes: 0,
      isBreak: p.periodType === 'BREAK' || p.periodType === 'LUNCH',
      isActive: true
    };
  }

  private mapTimetableSlot(raw: unknown, classId?: number, sectionId?: number): TimetableSlotModel {
    const s = raw as BackendTimetableSlot;
    return {
      slotId: s.slotId,
      classId,
      sectionId,
      dayOfWeek: s.dayOfWeek,
      periodNumber: s.periodNumber,
      startTime: s.startTime ? String(s.startTime).slice(0, 5) : undefined,
      endTime: s.endTime ? String(s.endTime).slice(0, 5) : undefined,
      subjectName: s.subjectName,
      teacherId: s.teacherId,
      isActive: s.active
    };
  }

  private flattenTimetable(data: BackendTimetableResponse): TimetableSlotModel[] {
    if (!data.schedule) return [];
    const slots: TimetableSlotModel[] = [];
    for (const [day, daySlots] of Object.entries(data.schedule)) {
      for (const slot of daySlots ?? []) {
        slots.push({
          slotId: slot.slotId,
          classId: data.classId,
          className: data.className,
          sectionId: data.sectionId,
          sectionName: data.sectionName,
          dayOfWeek: day,
          periodNumber: slot.periodNumber,
          startTime: slot.startTime ? String(slot.startTime).slice(0, 5) : undefined,
          endTime: slot.endTime ? String(slot.endTime).slice(0, 5) : undefined,
          subjectName: slot.subjectName,
          teacherId: slot.teacherId,
          isActive: slot.active
        });
      }
    }
    return slots;
  }

  private mapCalendarEvent(raw: unknown): AcademicCalendarEventModel {
    const e = raw as Record<string, unknown>;
    return {
      eventId: e['eventId'] as number,
      academicYearId: e['academicYearId'] as number,
      title: e['title'] as string,
      eventType: e['eventType'] as AcademicCalendarEventModel['eventType'],
      startDate: String(e['startDate'] ?? ''),
      endDate: e['endDate'] ? String(e['endDate']) : undefined,
      allDay: e['allDay'] as boolean,
      description: e['description'] as string,
      isActive: e['active'] as boolean
    };
  }

  private mapArrangement(a: BackendArrangement): TeacherAbsenceModel {
    return {
      absenceId: a.arrangementId,
      teacherId: a.absentTeacherId,
      date: String(a.arrangementDate ?? ''),
      reason: a.reason ?? '',
      affectedClasses: [],
      affectedPeriods: a.slotId ? [a.slotId] : [],
      suggestedReplacementId: a.substituteTeacherId,
      status: (a.status as TeacherAbsenceModel['status']) ?? 'PENDING'
    };
  }

  private emptyData(years: AcademicYear[], current: AcademicYear | null): AcademicsWorkspaceData {
    return {
      academicYears: years,
      currentYear: current,
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
