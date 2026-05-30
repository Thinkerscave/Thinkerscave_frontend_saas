import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, Subject, AcademicYear } from '../../../shared/models/course.model';
import { courseApi, academicYearApi } from '../../../shared/constants/api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor(private http: HttpClient) { }

  // --- Courses ---
  getAllCoursesByOrg(orgId: number): Observable<Course[]> {
    return this.http.get<Course[]>(courseApi.getByOrg(orgId));
  }

  getCourseById(id: number): Observable<Course> {
    return this.http.get<Course>(courseApi.getById(id));
  }

  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(courseApi.save, course);
  }

  updateCourse(id: number, course: Course): Observable<Course> {
    return this.http.put<Course>(courseApi.getById(id), course);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(courseApi.getById(id));
  }

  // --- Subjects ---
  getAllSubjectsByOrg(orgId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(courseApi.subjectsByOrg(orgId));
  }

  getSubjectById(id: number): Observable<Subject> {
    return this.http.get<Subject>(courseApi.subjectById(id));
  }

  createSubject(subject: Subject): Observable<Subject> {
    return this.http.post<Subject>(courseApi.saveSubject, subject);
  }

  updateSubject(id: number, subject: Subject): Observable<Subject> {
    return this.http.put<Subject>(courseApi.subjectById(id), subject);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(courseApi.subjectById(id));
  }

  // --- Academic Years (Aligned with AcademicStructureController) ---
  getAllAcademicYears(orgId: number): Observable<AcademicYear[]> {
    return this.http.get<AcademicYear[]>(academicYearApi.getByOrg(orgId));
  }

  createAcademicYear(orgId: number, year: AcademicYear): Observable<AcademicYear> {
    const params = new HttpParams()
      .set('orgId', orgId.toString())
      .set('yearCode', year.yearCode)
      .set('startDate', year.startDate)
      .set('endDate', year.endDate);
    return this.http.post<AcademicYear>(academicYearApi.save, null, { params });
  }

  setAcademicYearAsCurrent(orgId: number, yearId: number): Observable<void> {
    return this.http.post<void>(academicYearApi.setCurrent(orgId, yearId), {});
  }

  // --- Curriculum / Subject Mapping ---
  assignSubjectToCourse(courseId: number, subjectId: number, semester: number): Observable<any> {
    const payload = { courseId, subjectId, semester };
    return this.http.post<any>(courseApi.courseSubjects(courseId), payload);
  }

  getSubjectsByCourse(courseId: number): Observable<any[]> {
    return this.http.get<any[]>(courseApi.courseSubjects(courseId));
  }
}
