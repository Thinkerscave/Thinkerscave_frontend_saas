import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { LoginService } from '../../../core/services/login.service';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { DashboardSearchResponse, DashboardWorkspace } from '../models/dashboard-workspace.model';
import { dashboardApi } from '../../../shared/constants/api.endpoint';

@Injectable({ providedIn: 'root' })
export class DashboardWorkspaceService {

  constructor(
    private http: HttpClient,
    private loginService: LoginService
  ) { }

  loadWorkspace(): Observable<DashboardWorkspace> {
    return this.http.get<any>(dashboardApi.workspace)
      .pipe(
        map(response => unwrapApiResponse<any>(response, {})),
        map(summary => this.toWorkspace(summary)),
        catchError(() => of(this.toWorkspace({})))
      );
  }

  search(query: string): Observable<DashboardSearchResponse> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      return of({ query, results: [], supportedCategories: [] });
    }

    const params = new HttpParams().set('query', normalizedQuery);
    return this.http.get<any>(dashboardApi.search, { params })
      .pipe(map(response => unwrapApiResponse<DashboardSearchResponse>(response, { query, results: [], supportedCategories: [] })));
  }

  private toWorkspace(summary: any): DashboardWorkspace {
    const user = this.loginService.getUser();
    const roleCode = this.normalizeRole(user?.roles?.[0] ?? 'ORGANIZATION_ADMIN');
    const roleName = this.toRoleLabel(roleCode);
    const displayName = user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.userName || 'User';

    const totalStudents = Number(summary?.totalStudents ?? 0);
    const activeStudents = Number(summary?.activeStudents ?? 0);
    const totalStaff = Number(summary?.totalStaff ?? 0);
    const activeStaff = Number(summary?.activeStaff ?? 0);
    const presentStudents = Number(summary?.todayStudentAttendancePresent ?? 0);
    const absentStudents = Number(summary?.todayStudentAttendanceAbsent ?? 0);
    const openInquiries = Number(summary?.openInquiries ?? 0);
    const pendingApplications = Number(summary?.pendingApplications ?? 0);
    const newInquiriesToday = Number(summary?.newInquiriesToday ?? 0);

    return {
      context: {
        userId: user?.id ? Number(user.id) : null,
        username: user?.userName ?? 'user',
        displayName,
        primaryRoleCode: roleCode,
        primaryRoleName: roleName,
        roleCodes: (user?.roles ?? []).map((r: string) => this.normalizeRole(r)),
        organizationId: user?.organizationId ?? null,
        organizationName: 'Current Organization',
        tenantId: this.loginService.getTenant(),
        welcomeTitle: 'Dashboard',
        focusMessage: 'Track key institution metrics for today.'
      },
      widgets: [],
      kpis: [
        { key: 'students-total', label: 'Total Students', value: String(totalStudents), helper: 'Enrolled', tone: 'info', icon: 'pi pi-users', route: '/app/students/directory' },
        { key: 'students-active', label: 'Active Students', value: String(activeStudents), helper: 'Currently active', tone: 'success', icon: 'pi pi-user-plus', route: '/app/students/directory' },
        { key: 'staff-total', label: 'Total Staff', value: String(totalStaff), helper: 'Institution staff', tone: 'info', icon: 'pi pi-id-card', route: '/app/staff/directory' },
        { key: 'staff-active', label: 'Active Staff', value: String(activeStaff), helper: 'Currently active', tone: 'success', icon: 'pi pi-briefcase', route: '/app/staff/directory' },
        { key: 'attendance-present', label: 'Students Present', value: String(presentStudents), helper: 'Today', tone: 'success', icon: 'pi pi-check-circle', route: '/app/attendance/students' },
        { key: 'attendance-absent', label: 'Students Absent', value: String(absentStudents), helper: 'Today', tone: 'warning', icon: 'pi pi-times-circle', route: '/app/attendance/students' },
        { key: 'inquiries-open', label: 'Open Inquiries', value: String(openInquiries), helper: 'Admissions pipeline', tone: 'info', icon: 'pi pi-inbox', route: '/app/admissions/leads' },
        { key: 'applications-pending', label: 'Pending Applications', value: String(pendingApplications), helper: 'Awaiting decision', tone: 'warning', icon: 'pi pi-file', route: '/app/admissions/applications' },
        { key: 'inquiries-new-today', label: 'New Inquiries', value: String(newInquiriesToday), helper: 'Today', tone: 'neutral', icon: 'pi pi-bell', route: '/app/admissions/overview' }
      ],
      quickActions: [
        { key: 'qa-students', label: 'Open Students', description: 'View student directory', icon: 'pi pi-users', route: '/app/students/directory', tone: 'info', enabled: true },
        { key: 'qa-attendance', label: 'Mark Attendance', description: 'Open attendance workspace', icon: 'pi pi-calendar-check', route: '/app/attendance/students', tone: 'success', enabled: true },
        { key: 'qa-admissions', label: 'Admissions Workspace', description: 'Manage inquiries and applications', icon: 'pi pi-inbox', route: '/app/admissions/overview', tone: 'warning', enabled: true }
      ],
      priorities: [],
      pendingApprovals: [],
      recentActivities: [],
      smartAlerts: [],
      moduleShortcuts: [
        { key: 'sc-students', label: 'Students', description: 'Student workspace', icon: 'pi pi-users', route: '/app/students/directory', count: totalStudents, tone: 'info' },
        { key: 'sc-staff', label: 'Staff', description: 'Staff workspace', icon: 'pi pi-id-card', route: '/app/staff/directory', count: totalStaff, tone: 'info' },
        { key: 'sc-attendance', label: 'Attendance', description: 'Attendance workspace', icon: 'pi pi-calendar-check', route: '/app/attendance/students', count: presentStudents, tone: 'success' },
        { key: 'sc-admissions', label: 'Admissions', description: 'Admissions workspace', icon: 'pi pi-inbox', route: '/app/admissions/overview', count: openInquiries, tone: 'warning' }
      ],
      search: {
        placeholder: 'Search students, staff, leads',
        categories: ['STUDENT', 'STAFF', 'INQUIRY']
      },
      charts: null,
      profileCard: null,
      financialSummary: null
    };
  }

  private normalizeRole(role: string): string {
    return String(role || '').trim().replace(/^ROLE_/i, '').replace(/[\s-]+/g, '_').toUpperCase();
  }

  private toRoleLabel(roleCode: string): string {
    const normalized = this.normalizeRole(roleCode);
    return normalized
      .split('_')
      .map(part => part.charAt(0) + part.slice(1).toLowerCase())
      .join(' ');
  }
}