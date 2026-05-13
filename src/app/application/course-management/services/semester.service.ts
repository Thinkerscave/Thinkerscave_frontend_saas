import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Semester } from '../../../shared/models/semester.model';

@Injectable({
    providedIn: 'root'
})
export class SemesterService {
    private apiUrl = `${environment.apiUrl}/semesters`;

    constructor(private http: HttpClient) { }

    getSemestersByYear(yearId: number): Observable<Semester[]> {
        return this.http.get<Semester[]>(`${this.apiUrl}/year/${yearId}`);
    }

    getSemesterById(id: number): Observable<Semester> {
        return this.http.get<Semester>(`${this.apiUrl}/${id}`);
    }

    createSemester(semester: Semester): Observable<Semester> {
        return this.http.post<Semester>(this.apiUrl, semester);
    }

    updateSemester(id: number, semester: Semester): Observable<Semester> {
        return this.http.put<Semester>(`${this.apiUrl}/${id}`, semester);
    }

    deleteSemester(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    setCurrentSemester(id: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/set-current`, {});
    }
}
