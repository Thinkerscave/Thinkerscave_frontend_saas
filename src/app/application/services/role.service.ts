import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { roleApi } from '../../shared/constants/api_menu.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../shared/utils/api-response.util';

export interface Role {
  roleId?: number;      // db id
  roleCode?: string;     // unique code
  roleName: string;
  description?: string;
  isActive?: boolean;
  roleType?: string;    // SCHOOL / COLLEGE if you’re using enum
}

export interface RoleLookup {
  roleId: number;
  roleCode: string;
  roleName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(private http: HttpClient) { }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<any>(roleApi.getAllRolesUrl).pipe(
      map(response => unwrapApiList<Role>(response)),
      catchError(error => {
        console.error('Failed to load roles:', error);
        return throwError(() => error);
      })
    );
  }

  getActiveRoles(): Observable<RoleLookup[]> {
    return this.http.get<any>(roleApi.getActiveRolesUrl).pipe(
      map(response => unwrapApiList<RoleLookup>(response)),
      catchError(error => {
        console.error('Failed to load active roles:', error);
        return throwError(() => error);
      })
    );
  }

  getRoleByCode(roleCode: string): Observable<Role> {
    return this.http.get<any>(`${roleApi.getRoleByCodeUrl}${roleCode}`).pipe(
      map(response => unwrapApiResponse<Role>(response, {} as Role)),
      catchError(error => {
        console.error(`Failed to load role with code ${roleCode}:`, error);
        return throwError(() => error);
      })
    );
  }

  saveOrUpdateRole(role: Role): Observable<Role> {
    return this.http.post<any>(roleApi.saveOrUpdateRoleUrl, role).pipe(
      map(response => unwrapApiResponse<Role>(response, {} as Role)),
      catchError(error => {
        console.error('Save/Update Role failed:', error);
        return throwError(() => error);
      })
    );
  }

  updateStatus(roleId: number, status: boolean): Observable<any> {
    const query = `?roleId=${roleId}&status=${status}`;

    return this.http.patch(`${roleApi.updateStatusUrl}${query}`, {}).pipe(
      map(response => unwrapApiResponse(response, response)),
      catchError(error => {
        console.error(`Failed to update role status for roleId=${roleId}:`, error);
        return throwError(() => error);
      })
    );
  }
}
