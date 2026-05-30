import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Syllabus } from '../../../shared/models/syllabus.model';
import { syllabusApi } from '../../../shared/constants/api.endpoint';
import { environment } from '../../../../environments/environment';
import { LoginService } from '../../../core/services/login.service';

@Injectable({
  providedIn: 'root'
})
export class SyllabusService {

  constructor(private http: HttpClient, private loginService: LoginService) { }

  getAllSyllabi(): Observable<Syllabus[]> {
    const organizationId = Number(this.loginService.getCurrentOrganizationId() ?? environment.defaultOrganizationId ?? 1);

    return this.http.get<unknown>(`${environment.baseUrl}/subjects/org/${organizationId}`).pipe(
      map(response => this.unwrapArray<any>(response)),
      switchMap(subjects => {
        const requests = subjects
          .map(subject => Number(subject.subjectId ?? subject.id))
          .filter(subjectId => Number.isFinite(subjectId) && subjectId > 0)
          .map(subjectId => this.http.get<unknown>(syllabusApi.latestBySubject(subjectId)).pipe(
            map(response => this.normalizeSyllabus(this.unwrap<any | null>(response, null))),
            catchError(() => of(null))
          ));

        return requests.length
          ? forkJoin(requests).pipe(map(results => results.filter((item): item is Syllabus => item !== null)))
          : of([] as Syllabus[]);
      }),
      catchError(() => of([] as Syllabus[]))
    );
  }

  getSyllabusById(id: number): Observable<Syllabus> {
    return this.http.get<unknown>(syllabusApi.byId(id)).pipe(
      map(response => this.normalizeSyllabus(this.unwrap<any>(response, {})) as Syllabus)
    );
  }

  createSyllabus(syllabus: Syllabus): Observable<Syllabus> {
    return this.http.post<Syllabus>(syllabusApi.base, syllabus);
  }

  updateSyllabus(id: number, syllabus: Syllabus): Observable<Syllabus> {
    return this.http.put<Syllabus>(syllabusApi.byId(id), syllabus);
  }

  publishSyllabus(id: number): Observable<Syllabus> {
    return this.http.post<Syllabus>(syllabusApi.publish(id), {});
  }

  createNewVersion(id: number): Observable<Syllabus> {
    return this.http.post<Syllabus>(syllabusApi.newVersion(id), {});
  }

  getSyllabusHistory(id: number): Observable<Syllabus[]> {
    return this.http.get<Syllabus[]>(syllabusApi.history(id));
  }

  getStudentProgress(studentId: number, syllabusId: number): Observable<any> {
    return this.http.get<any>(syllabusApi.studentProgress(studentId, syllabusId));
  }

  updateProgress(progress: any): Observable<any> {
    let params = new HttpParams()
      .set('studentId', String(progress.studentId))
      .set('status', progress.status);

    if (progress.timeSpent !== undefined) {
      params = params.set('timeSpent', String(progress.timeSpent));
    }

    if (progress.remarks) {
      params = params.set('remarks', progress.remarks);
    }

    return this.http.post<any>(syllabusApi.saveStudentProgress(progress.topicId), null, { params });
  }

  private unwrapArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    const data = this.extractData(response);
    return Array.isArray(data) ? data as T[] : [];
  }

  private unwrap<T>(response: unknown, fallback: T): T {
    const data = this.extractData(response);
    return data === undefined || data === null ? fallback : data as T;
  }

  private extractData(response: unknown): unknown {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as Record<string, unknown>)['data'];
    }

    return response;
  }

  private normalizeSyllabus(raw: any | null): Syllabus | null {
    if (!raw) {
      return null;
    }

    return {
      ...raw,
      id: raw.id ?? raw.syllabusId,
      syllabusId: raw.syllabusId ?? raw.id,
      syllabusCode: raw.syllabusCode ?? raw.title ?? 'Syllabus',
      subjectId: raw.subjectId ?? 0,
      courseId: raw.courseId ?? 0,
      academicYearId: raw.academicYearId ?? 0,
      status: raw.status,
      chapters: (raw.chapters ?? []).map((chapter: any) => ({
        ...chapter,
        id: chapter.id ?? chapter.chapterId,
        chapterId: chapter.chapterId ?? chapter.id,
        name: chapter.name ?? chapter.chapterName ?? `Chapter ${chapter.chapterNumber ?? ''}`.trim(),
        sequenceOrder: chapter.sequenceOrder ?? chapter.chapterNumber ?? 0,
        topics: (chapter.topics ?? []).map((topic: any) => ({
          ...topic,
          id: topic.id ?? topic.topicId,
          topicId: topic.topicId ?? topic.id,
          name: topic.name ?? topic.topicName ?? `Topic ${topic.topicNumber ?? ''}`.trim(),
          estimatedMinutes: topic.estimatedMinutes ?? (topic.estimatedHours !== undefined ? Number(topic.estimatedHours) * 60 : undefined),
          sequenceOrder: topic.sequenceOrder ?? topic.topicNumber ?? 0
        }))
      }))
    } as Syllabus;
  }
}
