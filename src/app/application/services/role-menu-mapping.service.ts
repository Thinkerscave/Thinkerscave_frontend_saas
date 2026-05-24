import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { catchError, map, Observable, throwError } from 'rxjs';
import { menuMappingeApi } from '../../shared/constants/api_menu.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../shared/utils/api-response.util';

@Injectable({
  providedIn: 'root'
})
export class RoleMenuMappingService {

  constructor(private http: HttpClient) { }

  getActiveMenuTree(): Observable<TreeNode[]> {
    return this.http.get<any>(menuMappingeApi.getMenuTreeUrl).pipe(
      map(response => unwrapApiList<TreeNode>(response)),
      catchError(error => {
        console.error('Failed to load menu tree:', error);
        return throwError(() => error);
      })
    );
  }

  assignRoleMenuPrivileges(payload: {
    roleId: number,
    subMenuPrivileges: { subMenuId: number, privilegeIds: number[] }[]
  }): Observable<any> {
    return this.http.post<any>(menuMappingeApi.assignRoleMenuPrivilegeUrl, payload).pipe(
      map(response => unwrapApiResponse(response, response))
    );
  }

  getRoleMenuPrivileges(roleId: number): Observable<{ subMenuId: number; privilegeIds: number[] }[]> {
    return this.http.get<any>(`${menuMappingeApi.getRoleMenuPrivilegesUrl}/${roleId}`).pipe(
      map(response => unwrapApiResponse<{ roleId: number; subMenuPrivileges: { subMenuId: number; privilegeIds: number[] }[] }>(response, { roleId, subMenuPrivileges: [] })),
      map(payload => payload.subMenuPrivileges ?? [])
    );
  }

}
