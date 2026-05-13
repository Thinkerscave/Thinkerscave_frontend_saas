import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginService } from '../../services/login.service';
import { environment } from '../../../environments/environment';

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

    private baseUrl = `${environment.baseUrl}/students`;

    constructor(private http: HttpClient, private loginService: LoginService) { }

    private getHeaders(): HttpHeaders {
        const token = this.loginService.getAccessToken();
        const tenant = this.loginService.getTenant();
        const organizationId = this.loginService.getCurrentOrganizationId();

        let headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        if (tenant) headers = headers.set('X-Tenant-ID', tenant);
        if (organizationId) headers = headers.set('X-Organization-ID', organizationId);
        return headers;
    }

    getStudents(): Observable<StudentResponseDTO[]> {
        return this.http.get<any>(`${this.baseUrl}/getStudents`, { headers: this.getHeaders() }).pipe(
            map((res: any) => Array.isArray(res) ? res : (res?.data ?? []))
        );
    }

    getStudentById(id: number): Observable<StudentResponseDTO> {
        return this.http.get<StudentResponseDTO>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
    }

    updateStudent(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/${id}`, data, { headers: this.getHeaders() });
    }

    deleteStudent(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
    }

    getStudentDocuments(id: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/${id}/documents`, { headers: this.getHeaders() });
    }

    downloadDocument(docId: number): Observable<Blob> {
        const headers = this.getHeaders().set('Accept', 'application/octet-stream');
        return this.http.get(`${this.baseUrl}/document/${docId}/download`, {
            headers: headers,
            responseType: 'blob'
        });
    }
}
