import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { studentApi } from '../../shared/constants/api.endpoint';

export interface StudentResponseDTO {
    studentId: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    mobileNumber: number;
    gender: string;
    dateOfBirth: string;
    enrollmentDate: string;
    rollNumber: string;
    remarks?: string;
    isActive: boolean;
    classId: number;
    className: string;
    sectionId: number;
    sectionName: string;
    parentName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {

    constructor(private http: HttpClient) { }

    getStudents(): Observable<StudentResponseDTO[]> {
        return this.http.get<any>(studentApi.getAll).pipe(
            map((res: any) => Array.isArray(res) ? res : (res?.data ?? []))
        );
    }

    getStudentById(id: number): Observable<StudentResponseDTO> {
        return this.http.get<StudentResponseDTO>(studentApi.getById(id));
    }

    updateStudent(id: number, data: any): Observable<any> {
        return this.http.put(studentApi.update(id), data);
    }

    deleteStudent(id: number): Observable<any> {
        return this.http.delete(studentApi.delete(id));
    }

    getStudentDocuments(id: number): Observable<any[]> {
        return this.http.get<any[]>(studentApi.documents(id));
    }

    downloadDocument(docId: number): Observable<Blob> {
        return this.http.get(studentApi.downloadDoc(docId), {
            responseType: 'blob'
        });
    }
}
