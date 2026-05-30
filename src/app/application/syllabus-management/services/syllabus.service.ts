import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Syllabus } from '../../../shared/models/syllabus.model';
import { syllabusApi } from '../../../shared/constants/api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class SyllabusService {

  constructor(private http: HttpClient) { }

  getAllSyllabi(): Observable<Syllabus[]> {
    return this.http.get<Syllabus[]>(syllabusApi.base);
  }

  getSyllabusById(id: number): Observable<Syllabus> {
    return this.http.get<Syllabus>(syllabusApi.byId(id));
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

  getStudentProgress(studentId: number, syllabusId: number): Observable<any[]> {
    return this.http.get<any[]>(syllabusApi.studentProgress(studentId, syllabusId));
  }

  updateProgress(progress: any): Observable<any> {
    return this.http.post<any>(syllabusApi.saveStudentProgress, progress);
  }
}
