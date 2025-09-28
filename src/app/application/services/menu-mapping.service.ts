import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { menuApi, menuMappingeApi } from '../../shared/constants/api_menu.endpoint';

@Injectable({
  providedIn: 'root'
})
export class MenuMappingService {
private menuCache: MenuItem[] = [];

  constructor(private http: HttpClient) {}

  loadMenu(): Observable<MenuItem[]> {
    // 1. Return in-memory cache if available
    if (this.menuCache.length) {
      return of(this.menuCache);
    }

    // 2. Check localStorage
    const storedMenu = localStorage.getItem('sideMenu');
    if (storedMenu) {
      this.menuCache = JSON.parse(storedMenu);
      return of(this.menuCache);
    }

    // 3. Fetch from API
    return this.http.get<MenuItem[]>(menuMappingeApi.getSideMenuUrl).pipe(
      tap(menu => {
        this.menuCache = menu;
        localStorage.setItem('sideMenu', JSON.stringify(menu));
      }),
      catchError(err => {
        console.error('Failed to load side menus:', err);
        return throwError(() => err);
      })
    );
  }

  clearMenuCache(): void {
    this.menuCache = [];
    localStorage.removeItem('sideMenu');
  }
}
