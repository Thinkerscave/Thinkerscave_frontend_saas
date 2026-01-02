import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AcademicContainer } from '../../../shared/models/academic-container.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicStructureService {
  private apiUrl = `${environment.apiUrl}/academic-containers`;

  constructor(private http: HttpClient) { }

  getAllContainers(): Observable<AcademicContainer[]> {
    return this.http.get<AcademicContainer[]>(this.apiUrl);
  }

  getContainerById(id: number): Observable<AcademicContainer> {
    return this.http.get<AcademicContainer>(`${this.apiUrl}/${id}`);
  }

  createContainer(container: AcademicContainer): Observable<AcademicContainer> {
    return this.http.post<AcademicContainer>(this.apiUrl, container);
  }

  updateContainer(id: number, container: AcademicContainer): Observable<AcademicContainer> {
    return this.http.put<AcademicContainer>(`${this.apiUrl}/${id}`, container);
  }

  deleteContainer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
