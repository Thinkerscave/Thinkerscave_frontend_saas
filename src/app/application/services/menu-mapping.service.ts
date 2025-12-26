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

  constructor(private http: HttpClient) { }

  loadMenu(): Observable<MenuItem[]> {
    // 1. Check for specific roles (e.g., Counsellor) using localStorage to avoid circular dependency
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'COUNSELLOR' || (user.roles && user.roles.includes('COUNSELLOR'))) {
        const counsellorMenu: MenuItem[] = [
          {
            label: 'Overview',
            icon: 'pi pi-home',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'overview' }
          },
          {
            label: 'All Leads',
            icon: 'pi pi-list',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'all-leads' }
          },
          {
            label: 'Today\'s Follow-ups',
            icon: 'pi pi-calendar',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'today-followups' }
          },
          {
            label: 'Overdue Follow-ups',
            icon: 'pi pi-exclamation-circle',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'overdue-followups' }
          },
          {
            label: 'Interested Leads',
            icon: 'pi pi-heart-fill',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'interested-leads' }
          },
          {
            label: 'New Leads',
            icon: 'pi pi-star-fill',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'new-leads' }
          },
          {
            label: 'Statistics',
            icon: 'pi pi-chart-bar',
            routerLink: ['/app/counsellor-dashboard'],
            queryParams: { tab: 'lead-statistics' }
          }
        ];
        return of(counsellorMenu);
      }
    }

    // 2. Return in-memory cache if available
    if (this.menuCache.length) {
      return of(this.menuCache);
    }

    // 3. Check localStorage
    const storedMenu = localStorage.getItem('sideMenu');
    if (storedMenu) {
      this.menuCache = JSON.parse(storedMenu);
      return of(this.menuCache);
    }

    // 4. Fetch from API
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
