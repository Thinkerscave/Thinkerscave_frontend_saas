import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../core/services/login.service';
import {
  AcademicClass,
  AcademicCalendarEventModel,
  AcademicContainerModel,
  AcademicSection,
  AcademicSettingModel,
  AcademicYear,
  AcademicsWorkspaceData,
  ClassTeacherAssignmentModel,
  CourseModel,
  StaffModel,
  SubjectModel,
  SyllabusModel,
  TimetableSlotModel,
  TeacherAllocationModel
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
      courses: this.getCourses(organizationId),
      subjects: this.getSubjects(organizationId),
      staff: this.getStaff()
    }).pipe(
      switchMap(base => {
        const yearId = this.academicYearId(base.currentYear) ?? this.academicYearId(base.academicYears.find(year => year.isCurrent)) ?? this.academicYearId(base.academicYears[0]);
        const containers$ = yearId ? this.getContainers(organizationId, yearId) : of([]);
        const classTeacherAssignments$ = yearId ? this.getClassTeacherAssignments(organizationId, yearId) : of([]);
        const timetableSlots$ = yearId ? this.getTimetableSlots(organizationId, yearId) : of([]);
        const calendarEvents$ = yearId ? this.getCalendarEvents(organizationId, yearId) : of([]);
        const academicSettings$ = this.getAcademicSettings(organizationId);
        const teacherAllocations$ = yearId ? this.getTeacherAllocations(base.classes, yearId) : of([]);
        const syllabi$ = this.getSyllabi(base.subjects);
        const sections$ = this.getAllSections(base.classes);

        return forkJoin({ containers: containers$, sections: sections$, teacherAllocations: teacherAllocations$, classTeacherAssignments: classTeacherAssignments$, timetableSlots: timetableSlots$, calendarEvents: calendarEvents$, academicSettings: academicSettings$, syllabi: syllabi$ }).pipe(
          map(extra => ({
            academicYears: base.academicYears,
            currentYear: base.currentYear,
            classes: base.classes,
            sections: extra.sections,
            courses: base.courses,
            subjects: base.subjects,
            containers: extra.containers,
            staff: base.staff,
            teacherAllocations: extra.teacherAllocations,
            classTeacherAssignments: extra.classTeacherAssignments,
            timetableSlots: extra.timetableSlots,
            calendarEvents: extra.calendarEvents,
            academicSettings: extra.academicSettings,
            syllabi: extra.syllabi
          }))
        );
      }),
      catchError(() => of(this.emptyData()))
    );
  }

  createAcademicYear(payload: { yearCode: string; startDate: string; endDate: string }): Observable<AcademicYear> {
    const params = new HttpParams()
      .set('orgId', String(this.organizationId()))
      .set('yearCode', payload.yearCode)
      .set('startDate', payload.startDate)
      .set('endDate', payload.endDate);

    return this.http.post<unknown>(`${this.apiUrl}/academic-structure/years`, null, { params })
      .pipe(map(response => this.unwrapData<AcademicYear>(response, {} as AcademicYear)));
  }

  activateAcademicYear(yearId: number): Observable<void> {
    return this.http.post<unknown>(`${this.apiUrl}/academic-structure/years/${this.organizationId()}/current/${yearId}`, {})
      .pipe(map(() => void 0));
  }

  createClass(className: string): Observable<AcademicClass> {
    return this.http.post<unknown>(`${this.apiUrl}/classes/saveOrUpdate`, { className })
      .pipe(map(response => this.unwrapData<AcademicClass>(response, {} as AcademicClass)));
  }

  createSection(classId: number, sectionName: string): Observable<AcademicSection> {
    return this.http.post<unknown>(`${this.apiUrl}/sections/saveOrUpdate`, { classId, sectionName })
      .pipe(map(response => this.unwrapData<AcademicSection>(response, {} as AcademicSection)));
  }

  createSubject(payload: Partial<SubjectModel>): Observable<SubjectModel> {
    return this.http.post<SubjectModel>(`${this.apiUrl}/subjects`, {
      subjectCode: payload.subjectCode,
      subjectName: payload.subjectName,
      description: payload.description,
      category: (payload.category || 'CORE').toUpperCase(),
      credits: payload.credits ?? 0,
      theoryHours: payload.theoryHours ?? 0,
      labHours: payload.labHours ?? 0,
      practicalHours: payload.practicalHours ?? 0,
      organizationId: this.organizationId()
    });
  }

  allocateTeacher(payload: Partial<TeacherAllocationModel>): Observable<TeacherAllocationModel> {
    return this.http.post<TeacherAllocationModel>(`${this.apiUrl}/allocations`, payload);
  }

  assignClassTeacher(payload: Partial<ClassTeacherAssignmentModel>): Observable<ClassTeacherAssignmentModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/class-teachers`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<ClassTeacherAssignmentModel>(response, {} as ClassTeacherAssignmentModel)));
  }

  createTimetableSlot(payload: Partial<TimetableSlotModel>): Observable<TimetableSlotModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/timetable-slots`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<TimetableSlotModel>(response, {} as TimetableSlotModel)));
  }

  createCalendarEvent(payload: Partial<AcademicCalendarEventModel>): Observable<AcademicCalendarEventModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/calendar-events`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicCalendarEventModel>(response, {} as AcademicCalendarEventModel)));
  }

  saveAcademicSetting(payload: Partial<AcademicSettingModel>): Observable<AcademicSettingModel> {
    return this.http.post<unknown>(`${this.apiUrl}/academics/settings`, {
      ...payload,
      organizationId: this.organizationId()
    }).pipe(map(response => this.unwrapData<AcademicSettingModel>(response, {} as AcademicSettingModel)));
  }

  private getAcademicYears(organizationId: number): Observable<AcademicYear[]> {
    return this.http.get<unknown>(`${this.apiUrl}/academic-structure/years/${organizationId}`)
      .pipe(
        map(response => this.unwrapArray<AcademicYear>(response)),
        catchError(() => of([]))
      );
  }

  private getCurrentAcademicYear(organizationId: number): Observable<AcademicYear | null> {
    return this.http.get<unknown>(`${this.apiUrl}/academic-structure/years/${organizationId}/current`)
      .pipe(
        map(response => this.unwrapData<AcademicYear | null>(response, null)),
        catchError(() => of(null))
      );
  }

  private getClasses(): Observable<AcademicClass[]> {
    return this.http.get<unknown>(`${this.apiUrl}/classes/getListOfClass`)
      .pipe(
        map(response => this.unwrapArray<AcademicClass>(response)),
        catchError(() => of([]))
      );
  }

  private getCourses(organizationId: number): Observable<CourseModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/courses/org/${organizationId}`)
      .pipe(
        map(response => this.unwrapArray<CourseModel>(response)),
        catchError(() => of([]))
      );
  }

  private getSubjects(organizationId: number): Observable<SubjectModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/subjects/org/${organizationId}`)
      .pipe(
        map(response => this.unwrapArray<SubjectModel>(response)),
        catchError(() => of([]))
      );
  }

  private getStaff(): Observable<StaffModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/staff/getAllStaff`)
      .pipe(
        map(response => this.unwrapArray<StaffModel>(response)),
        catchError(() => of([]))
      );
  }

  private getContainers(organizationId: number, yearId: number): Observable<AcademicContainerModel[]> {
    return this.http.get<unknown>(`${this.apiUrl}/academic-structure/containers/org/${organizationId}/year/${yearId}`)
      .pipe(
        map(response => this.unwrapArray<AcademicContainerModel>(response)),
        switchMap(containers => this.expandContainers(containers)),
        catchError(() => of([]))
      );
  }

  private expandContainers(containers: AcademicContainerModel[]): Observable<AcademicContainerModel[]> {
    const childRequests = containers
      .map(container => Number(container.containerId))
      .filter(containerId => Number.isFinite(containerId) && containerId > 0)
      .map(containerId => this.http.get<unknown>(`${this.apiUrl}/academic-structure/containers/${containerId}/children`).pipe(
        map(response => this.unwrapArray<AcademicContainerModel>(response)),
        catchError(() => of([] as AcademicContainerModel[]))
      ));

    if (!childRequests.length) {
      return of(containers);
    }

    return forkJoin(childRequests).pipe(
      switchMap(childGroups => {
        const children = childGroups.flat();
        if (!children.length) {
          return of(containers);
        }

        return this.expandContainers(children).pipe(map(descendants => [...containers, ...descendants]));
      })
    );
  }

  private getClassTeacherAssignments(organizationId: number, yearId: number): Observable<ClassTeacherAssignmentModel[]> {
    const params = new HttpParams().set('organizationId', organizationId).set('academicYearId', yearId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/class-teachers`, { params })
      .pipe(
        map(response => this.unwrapArray<ClassTeacherAssignmentModel>(response)),
        catchError(() => of([]))
      );
  }

  private getTimetableSlots(organizationId: number, yearId: number): Observable<TimetableSlotModel[]> {
    const params = new HttpParams().set('organizationId', organizationId).set('academicYearId', yearId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/timetable-slots`, { params })
      .pipe(
        map(response => this.unwrapArray<TimetableSlotModel>(response)),
        catchError(() => of([]))
      );
  }

  private getCalendarEvents(organizationId: number, yearId: number): Observable<AcademicCalendarEventModel[]> {
    const params = new HttpParams().set('organizationId', organizationId).set('academicYearId', yearId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/calendar-events`, { params })
      .pipe(
        map(response => this.unwrapArray<AcademicCalendarEventModel>(response)),
        catchError(() => of([]))
      );
  }

  private getAcademicSettings(organizationId: number): Observable<AcademicSettingModel[]> {
    const params = new HttpParams().set('organizationId', organizationId);
    return this.http.get<unknown>(`${this.apiUrl}/academics/settings`, { params })
      .pipe(
        map(response => this.unwrapArray<AcademicSettingModel>(response)),
        catchError(() => of([]))
      );
  }

  private getTeacherAllocations(classes: AcademicClass[], academicYearId: number): Observable<TeacherAllocationModel[]> {
    const requests = classes
      .map(academicClass => Number(academicClass.classId))
      .filter(classId => Number.isFinite(classId) && classId > 0)
      .map(classId => this.http.get<unknown>(`${this.apiUrl}/allocations/class/${classId}`, {
        params: new HttpParams().set('academicYearId', academicYearId)
      }).pipe(
        map(response => this.unwrapArray<TeacherAllocationModel>(response)),
        catchError(() => of([] as TeacherAllocationModel[]))
      ));

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
    if (!classes.length) {
      return of([]);
    }

    const sectionRequests = classes.map(academicClass => {
      const classId = Number(academicClass.classId);
      if (!Number.isFinite(classId)) {
        return of([] as AcademicSection[]);
      }

      return this.http.get<unknown>(`${this.apiUrl}/sections/getListOfSectionsByClassId/${classId}`).pipe(
        map(response => this.unwrapArray<AcademicSection>(response).map(section => ({ ...section, classId, classEntity: academicClass }))),
        catchError(() => of([] as AcademicSection[]))
      );
    });

    return forkJoin(sectionRequests).pipe(map(sectionGroups => sectionGroups.flat()));
  }

  private unwrapArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    const data = this.extractData(response);
    if (Array.isArray(data)) {
      return data as T[];
    }

    return [];
  }

  private unwrapData<T>(response: unknown, fallback: T): T {
    const data = this.extractData(response);
    return data === undefined || data === null ? fallback : data as T;
  }

  private extractData(response: unknown): unknown {
    if (response && typeof response === 'object') {
      const objectResponse = response as Record<string, unknown>;
      if ('data' in objectResponse) {
        return objectResponse['data'];
      }
    }

    return response;
  }

  private academicYearId(year: AcademicYear | null | undefined): number | undefined {
    const value = year?.academicYearId ?? year?.id;
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }

  private organizationId(): number {
    const configured = Number(this.loginService.getCurrentOrganizationId() ?? environment.defaultOrganizationId ?? 1);
    return Number.isFinite(configured) && configured > 0 ? configured : 1;
  }

  private emptyData(): AcademicsWorkspaceData {
    return {
      academicYears: [],
      currentYear: null,
      classes: [],
      sections: [],
      courses: [],
      subjects: [],
      containers: [],
      staff: [],
      teacherAllocations: [],
      classTeacherAssignments: [],
      timetableSlots: [],
      calendarEvents: [],
      academicSettings: [],
      syllabi: []
    };
  }
}
