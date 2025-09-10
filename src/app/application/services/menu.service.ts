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
  getMenuTree(): TreeNode[] {
    return [
      {
        label: 'Menu Management',
        key: 'menu_mgmt',
        children: [
          { label: 'Manage Menu', key: 'manage_menu' },
          { label: 'Manage Sub-menu', key: 'manage_submenu' },
          { label: 'Menu Sequence', key: 'menu_sequence' }
        ]
      },
      {
        label: 'Role Management',
        key: 'role_mgmt',
        children: [
          { label: 'Manage Role', key: 'manage_role' },
          { label: 'Role-Menu Mapping', key: 'menu_mapping' },
          { label: 'Role-Privilege Mapping', key: 'priv_mapping' }
        ]
      },
      {
        label: 'Organization Management',
        key: 'org_mgmt',
        children: [
          { label: 'Manage Organization', key: 'manage_org' }
        ]
      },
      {
        label: 'Student Management',
        key: 'student_mgmt',
        children: [
          { label: 'Manage Student', key: 'manage_student' }
        ]
      },
      {
        label: 'Staff Management',
        key: 'staff_mgmt',
        children: [
          { label: 'Manage Staff', key: 'manage_staff' },
          { label: 'Manage Salary', key: 'manage_salary' },
          { label: 'Leave Management', key: 'leave_mgmt' }
        ]
      },
      {
        label: 'Attendance Management',
        key: 'attendance_mgmt',
        children: [
          { label: 'Class Attendance', key: 'class_att' },
          { label: 'Hostel Attendance', key: 'hostel_att' },
          { label: 'Staff Attendance', key: 'staff_att' }
        ]
      }
    ];
  }

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
