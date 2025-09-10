import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { catchError, Observable, throwError } from 'rxjs';
import { menuApi, menuMappingeApi } from '../../shared/constants/api_menu.endpoint';

@Injectable({
  providedIn: 'root'
})
export class MenuMappingService {

  constructor(private http: HttpClient) { }

  loadMenu(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(menuMappingeApi.getSideMenuUrl).pipe(
      catchError(error => {
        console.error('Failed to load side-menus:', error);
        return throwError(() => error);
      })
    );
  }
}
