import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Syllabus } from '../../../shared/models/syllabus.model';

@Injectable({
  providedIn: 'root'
})
export class SyllabusService {
  private apiUrl = `${environment.apiUrl}/syllabi`;

  constructor(private http: HttpClient) { }

  getAllSyllabi(): Observable<Syllabus[]> {
    return this.http.get<Syllabus[]>(this.apiUrl);
  }

  getSyllabusById(id: number): Observable<Syllabus> {
    return this.http.get<Syllabus>(`${this.apiUrl}/${id}`);
  }

  createSyllabus(syllabus: Syllabus): Observable<Syllabus> {
    return this.http.post<Syllabus>(this.apiUrl, syllabus);
  }

  updateSyllabus(id: number, syllabus: Syllabus): Observable<Syllabus> {
    return this.http.put<Syllabus>(`${this.apiUrl}/${id}`, syllabus);
  }

  publishSyllabus(id: number): Observable<Syllabus> {
    return this.http.post<Syllabus>(`${this.apiUrl}/${id}/publish`, {});
  }

  createNewVersion(id: number): Observable<Syllabus> {
    return this.http.post<Syllabus>(`${this.apiUrl}/${id}/new-version`, {});
  }

  getSyllabusHistory(id: number): Observable<Syllabus[]> {
    return this.http.get<Syllabus[]>(`${this.apiUrl}/${id}/history`);
  }

  // Progress Tracking
  getStudentProgress(studentId: number, syllabusId: number): Observable<any[]> { // Using any[] for now as SyllabusProgress might be per-topic
    // Ideally this returns list of completed topic IDs or SyllabusProgress objects
    return this.http.get<any[]>(`${environment.apiUrl}/student-progress/${studentId}/${syllabusId}`);
  }

  updateProgress(progress: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/student-progress`, progress);
  }
}
