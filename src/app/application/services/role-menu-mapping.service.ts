import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { catchError, Observable, throwError } from 'rxjs';
import { menuMappingeApi } from '../../shared/constants/api_menu.endpoint';

@Injectable({
  providedIn: 'root'
})
export class RoleMenuMappingService {

  constructor(private http: HttpClient) { }

  getActiveMenuTree(): Observable<TreeNode[]> {
    return this.http.get<TreeNode[]>(menuMappingeApi.getMenuTreeUrl).pipe(
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
    return this.http.post<any>(menuMappingeApi.assignRoleMenuPrivilegeUrl, payload);
  }

}
