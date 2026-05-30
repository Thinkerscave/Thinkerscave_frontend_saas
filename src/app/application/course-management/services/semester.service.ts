import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Semester } from '../../../shared/models/semester.model';
import { semesterApi } from '../../../shared/constants/api.endpoint';

@Injectable({
    providedIn: 'root'
})
export class SemesterService {

    constructor(private http: HttpClient) { }

    getSemestersByYear(yearId: number): Observable<Semester[]> {
        return this.http.get<Semester[]>(semesterApi.byYear(yearId));
    }

    getSemesterById(id: number): Observable<Semester> {
        return this.http.get<Semester>(semesterApi.byId(id));
    }

    createSemester(semester: Semester): Observable<Semester> {
        return this.http.post<Semester>(semesterApi.base, semester);
    }

    updateSemester(id: number, semester: Semester): Observable<Semester> {
        return this.http.put<Semester>(semesterApi.byId(id), semester);
    }

    deleteSemester(id: number): Observable<void> {
        return this.http.delete<void>(semesterApi.byId(id));
    }

    setCurrentSemester(id: number): Observable<void> {
        return this.http.post<void>(semesterApi.setCurrent(id), {});
    }
}
