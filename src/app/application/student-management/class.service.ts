import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginService } from '../../services/login.service';
import { environment } from '../../../environments/environment';

export interface Class {
  classId: string;
  className: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassService {

  private baseUrl = `${environment.baseUrl}/classes`;

  constructor(private http: HttpClient, private loginService: LoginService) { }

  private getHeaders(): HttpHeaders {
    const token = this.loginService.getAccessToken();
    const tenant = this.loginService.getTenant();
    const orgId = this.loginService.getCurrentOrganizationId();
    let headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    if (tenant) headers = headers.set('X-Tenant-ID', tenant);
    if (orgId) headers = headers.set('X-Organization-ID', orgId);
    return headers;
  }

  getClasses(): Observable<Class[]> {
    return this.http.get<any>(`${this.baseUrl}/getListOfClass`, { headers: this.getHeaders() }).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data ?? []))
    );
  }
}
