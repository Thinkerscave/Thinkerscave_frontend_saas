import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { menuSequenceApi } from '../../shared/constants/api_menu.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../shared/utils/api-response.util';


export interface SubMenuOrder {
  subMenuId: number;
  subMenuName: String;
  subMenuCode: String;
  subMenuOrder: number;
}

export interface MenuOrder {
  menuId: number;
  menuName: String;
  menuCode:String;
  menuOrder: number;
  subMenus: SubMenuOrder[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuSequenceService {

  constructor(private http: HttpClient) { }

  getMenuSequence(): Observable<MenuOrder[]> {
    return this.http.get<any>(menuSequenceApi.getMenuSequenceUrl).pipe(
      map(response => unwrapApiList<MenuOrder>(response)),
      catchError(error => {
        console.error('Failed to load menu sequence:', error);
        return throwError(() => error);
      })
    );
  }

  saveMenuSequence(menuOrders: MenuOrder[]): Observable<void> {
    return this.http.post<any>(`${menuSequenceApi.saveMenuSequenceUrl}`, menuOrders).pipe(
      map(response => unwrapApiResponse<void>(response, undefined))
    );
  }
}
