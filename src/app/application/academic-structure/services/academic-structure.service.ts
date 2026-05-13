import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AcademicContainer, StructureTemplate } from '../../../shared/models/academic-container.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicStructureService {
  private apiUrl = `${environment.apiUrl}/academic-structure`;

  constructor(private http: HttpClient) { }

  getTopLevelContainers(orgId: number, yearId: number): Observable<AcademicContainer[]> {
    return this.http.get<AcademicContainer[]>(`${this.apiUrl}/containers/org/${orgId}/year/${yearId}`);
  }

  getChildContainers(parentId: number): Observable<AcademicContainer[]> {
    return this.http.get<AcademicContainer[]>(`${this.apiUrl}/containers/${parentId}/children`);
  }

  getContainerById(id: number): Observable<AcademicContainer> {
    return this.http.get<AcademicContainer>(`${this.apiUrl}/containers/${id}`);
  }

  createContainer(container: AcademicContainer): Observable<AcademicContainer> {
    return this.http.post<AcademicContainer>(`${this.apiUrl}/containers`, container);
  }

  updateContainer(id: number, container: AcademicContainer): Observable<AcademicContainer> {
    return this.http.put<AcademicContainer>(`${this.apiUrl}/containers/${id}`, container);
  }

  deleteContainer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/containers/${id}`);
  }

  generateSchoolStructure(orgId: number, yearId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-school`, null, {
      params: { orgId: orgId.toString(), yearId: yearId.toString() }
    });
  }

  generateDynamicStructure(orgId: number, yearId: number, template: StructureTemplate): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-dynamic`, template, {
      params: { orgId: orgId.toString(), yearId: yearId.toString() }
    });
  }
}
