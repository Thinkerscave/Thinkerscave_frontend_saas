import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { catchError, Observable, throwError } from 'rxjs';
import { menuApi } from '../../shared/constants/api_menu.endpoint';

export interface MenuItem {
  slNo?: number;   // db id
  menuCode?: string;  // ✅ add this
  name: string;
  description: string;
  url?: string;
  icon?: string;
  order?: number;
  isActive?: boolean; // maps to isActive
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private http: HttpClient) { }

  getAllMenus(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(menuApi.getAllMenusUrl).pipe(
      catchError(error => {
        console.error('Failed to load menus:', error);
        return throwError(() => error);
      })
    );
  }

  getAllActiveMenus(): Observable<any[]> {
    return this.http.get<any[]>(menuApi.getActiveMenusUrl).pipe(
      catchError(error => {
        console.error('Failed to load menus:', error);
        return throwError(() => error);
      })
    );
  }

  saveMenu(menu: MenuItem): Observable<any> {
    return this.http.post(`${menuApi.saveMenuUrl}`, menu).pipe(
      catchError(error => {
        console.error('Create Menu failed:', error);
        return throwError(() => error);
      })
    );
  }

  updateStatus(menuCode: string, status: boolean): Observable<any> {
    return this.http.put(
      `${menuApi.updateStatus}/${menuCode}?status=${status}`,
      {}
    ).pipe(
      catchError(error => {
        console.error('Failed to update status:', error);
        return throwError(() => error);
      })
    );
  }
}
