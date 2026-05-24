import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { menuApi } from '../../shared/constants/api_menu.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../shared/utils/api-response.util';

export interface MenuItem {
  menuId?: number;
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
    return this.http.get<any>(menuApi.getAllMenusUrl).pipe(
      map(response => unwrapApiList<MenuItem>(response)),
      catchError(error => {
        console.error('Failed to load menus:', error);
        return throwError(() => error);
      })
    );
  }

  getAllActiveMenus(): Observable<any[]> {
    return this.http.get<any>(menuApi.getActiveMenusUrl).pipe(
      map(response => unwrapApiList<any>(response)),
      catchError(error => {
        console.error('Failed to load menus:', error);
        return throwError(() => error);
      })
    );
  }

  saveMenu(menu: MenuItem): Observable<any> {
    return this.http.post(`${menuApi.saveMenuUrl}`, menu).pipe(
      map(response => unwrapApiResponse(response, response)),
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
      map(response => unwrapApiResponse(response, response)),
      catchError(error => {
        console.error('Failed to update status:', error);
        return throwError(() => error);
      })
    );
  }

  deleteMenu(menuCode: string): Observable<any> {
    return this.http.delete(`${menuApi.deleteMenuUrl}/${encodeURIComponent(menuCode)}`).pipe(
      map(response => unwrapApiResponse(response, response)),
      catchError(error => {
        console.error('Failed to delete menu:', error);
        return throwError(() => error);
      })
    );
  }
}
