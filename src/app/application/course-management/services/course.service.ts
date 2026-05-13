import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Course, Subject, AcademicYear } from '../../../shared/models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // --- Courses ---
  getAllCoursesByOrg(orgId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses/org/${orgId}`);
  }

  getCourseById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/courses/${id}`);
  }

  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/courses`, course);
  }

  updateCourse(id: number, course: Course): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/courses/${id}`, course);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/courses/${id}`);
  }

  // --- Subjects ---
  getAllSubjectsByOrg(orgId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects/org/${orgId}`);
  }

  getSubjectById(id: number): Observable<Subject> {
    return this.http.get<Subject>(`${this.apiUrl}/subjects/${id}`);
  }

  createSubject(subject: Subject): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/subjects`, subject);
  }

  updateSubject(id: number, subject: Subject): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/subjects/${id}`, subject);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subjects/${id}`);
  }

  // --- Academic Years (Aligned with AcademicStructureController) ---
  getAllAcademicYears(orgId: number): Observable<AcademicYear[]> {
    return this.http.get<AcademicYear[]>(`${this.apiUrl}/academic-structure/years/${orgId}`);
  }

  createAcademicYear(orgId: number, year: AcademicYear): Observable<AcademicYear> {
    // Backend takes RequestParams for this specific method based on controller
    const params = new HttpParams()
      .set('orgId', orgId.toString())
      .set('yearCode', year.yearCode)
      .set('startDate', year.startDate)
      .set('endDate', year.endDate);
    return this.http.post<AcademicYear>(`${this.apiUrl}/academic-structure/years`, null, { params });
  }

  setAcademicYearAsCurrent(orgId: number, yearId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/academic-structure/years/${orgId}/current/${yearId}`, {});
  }

  // --- Curriculum / Subject Mapping ---
  assignSubjectToCourse(courseId: number, subjectId: number, semester: number): Observable<any> {
    const payload = { courseId, subjectId, semester };
    return this.http.post<any>(`${this.apiUrl}/courses/${courseId}/subjects`, payload);
  }

  getSubjectsByCourse(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses/${courseId}/subjects`);
  }
}
