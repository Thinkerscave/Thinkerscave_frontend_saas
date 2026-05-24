import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { subMenuApi } from '../../shared/constants/api_menu.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../shared/utils/api-response.util';

export interface SubmenuItem {
  subMenuId?: number;         // database id
  subMenuCode?: string;       // unique code (used for update)
  subMenuName: string;
  subMenuDescription?: string;
  subMenuUrl?: string;               // frontend route like /admissions/registration
  subMenuIcon?: string | null;
  subMenuOrder?: number | null;
  subMenuIsActive?: boolean;

  privilegeIds?: number[];

  // related parent menu (for display / dropdown)
  menuId?: number | null;
  menuCode?: string | null;
  menuName?: string | null;

  // auditing
  createdBy?: string | null;
  lastUpdatedOn?: string | null;
}
@Injectable({
  providedIn: 'root'
})
export class SubMenuService {

  constructor(private http: HttpClient) {}

  getAllSubmenus(): Observable<SubmenuItem[]> {
    return this.http.get<any>(subMenuApi.getAllSubMenusUrl)
      .pipe(map(response => unwrapApiList<SubmenuItem>(response)))
      .pipe(catchError(err => { console.error('Failed to load submenus', err); return throwError(() => err); }));
  }

  saveSubmenu(payload: SubmenuItem): Observable<any> {
    // backend handles create/update
    return this.http.post(subMenuApi.savesubMenuUrl, payload)
      .pipe(map(response => unwrapApiResponse(response, response)))
      .pipe(catchError(err => { console.error('Save submenu failed', err); return throwError(() => err); }));
  }

  updateStatus(submenuCode: string, status: boolean): Observable<any> {
    return this.http.put(`${subMenuApi.updateStatus}/${encodeURIComponent(submenuCode)}?status=${status}`, {})
      .pipe(map(response => unwrapApiResponse(response, response)))
      .pipe(catchError(err => { console.error('Toggle submenu status failed', err); return throwError(() => err); }));
  }

  deleteSubmenu(submenuCode: string): Observable<any> {
    return this.http.delete(`${subMenuApi.deleteSubMenuUrl}/${encodeURIComponent(submenuCode)}`)
      .pipe(map(response => unwrapApiResponse(response, response)))
      .pipe(catchError(err => { console.error('Delete submenu failed', err); return throwError(() => err); }));
  }

  getAllPrivileges(): Observable<any[]> {
    return this.http.get<any>(subMenuApi.getPrivilegesUrl)
      .pipe(map(response => unwrapApiList<any>(response)));
  }
}
