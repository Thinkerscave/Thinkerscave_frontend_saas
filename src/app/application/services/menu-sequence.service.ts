import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { menuSequenceApi } from '../../shared/constants/api_menu.endpoint';


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
    return this.http.get<MenuOrder[]>(menuSequenceApi.getMenuSequenceUrl).pipe(
      catchError(error => {
        console.error('Failed to load menu sequence:', error);
        return throwError(() => error);
      })
    );
  }

  saveMenuSequence(menuOrders: MenuOrder[]): Observable<void> {
    return this.http.post<void>(`${menuSequenceApi.saveMenuSequenceUrl}`, menuOrders);
  }
}
