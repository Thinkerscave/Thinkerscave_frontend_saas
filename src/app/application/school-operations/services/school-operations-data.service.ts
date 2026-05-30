import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceTrendPoint,
  AttendanceType,
  AttendanceWorkspaceData,
  BranchRecord,
  ClassRecord,
  DepartmentRecord,
  LeaveRecord,
  PayrollRecord,
  PayrollRunResult,
  RosterAttendanceRow,
  SectionRecord,
  StaffCreatePayload,
  StaffRecord,
  StaffWorkspaceData,
  StudentRecord
} from '../models/school-operations.model';

@Injectable({ providedIn: 'root' })
export class SchoolOperationsDataService {
  private readonly apiBase = environment.baseUrl;

  constructor(private readonly http: HttpClient) { }

  loadStaffWorkspace(): Observable<StaffWorkspaceData> {
    const today = this.today();

    return forkJoin({
      staff: this.getStaff(),
      departments: this.getDepartments(),
      branches: this.getBranches(),
      todayStaffAttendance: this.getAttendance(today, 'STAFF'),
      todayClassAttendance: this.getAttendance(today, 'CLASS'),
      leaveRequests: this.getLeaveRequests(),
      payroll: this.getPayroll()
    }).pipe(map(data => ({ today, ...data })));
  }

  loadAttendanceWorkspace(): Observable<AttendanceWorkspaceData> {
    const today = this.today();

    return forkJoin({
      students: this.getStudents(),
      staff: this.getStaff(),
      classes: this.getClasses(),
      departments: this.getDepartments(),
      branches: this.getBranches(),
      todayClassAttendance: this.getAttendance(today, 'CLASS'),
      todayStaffAttendance: this.getAttendance(today, 'STAFF'),
      trends: this.getAttendanceTrends()
    }).pipe(
      switchMap(data => {
        const sectionCalls = data.classes.map(item => this.getSections(item.classId));
        const sections$ = sectionCalls.length ? forkJoin(sectionCalls).pipe(map(values => values.flat())) : of([] as SectionRecord[]);
        return sections$.pipe(map(sections => ({ today, ...data, sections })));
      })
    );
  }

  loadStudentRoster(filters: { date: string; classId: string; sectionName: string }): Observable<RosterAttendanceRow[]> {
    const date = filters.date || this.today();

    return forkJoin({
      students: this.getStudents(),
      existing: filters.classId !== 'all'
        ? this.getAttendanceByClass(Number(filters.classId), date)
        : this.getAttendance(date, 'CLASS')
    }).pipe(
      map(({ students, existing }) => students
        .filter(student => this.matchesStudentFilters(student, filters))
        .map(student => this.toStudentRosterRow(student, existing, date)))
    );
  }

  loadStaffRoster(filters: { date: string; department: string; branch: string; shift: string }): Observable<RosterAttendanceRow[]> {
    const date = filters.date || this.today();

    return forkJoin({
      staff: this.getStaff(),
      existing: this.getAttendance(date, 'STAFF')
    }).pipe(
      map(({ staff, existing }) => staff
        .filter(item => this.matchesStaffFilters(item, filters))
        .map(item => this.toStaffRosterRow(item, existing, date, filters.shift)))
    );
  }

  saveAttendanceBatch(rows: RosterAttendanceRow[], type: Exclude<AttendanceType, 'HOSTEL'>): Observable<AttendanceRecord[]> {
    const requests = rows.map(row => {
      const payload: AttendanceRecord = {
        attendanceType: type,
        referenceId: row.referenceId,
        referenceName: row.referenceName,
        attendanceDate: row.date,
        status: row.status,
        classId: row.classId,
        className: row.className,
        sectionName: row.sectionName,
        shift: row.shift,
        department: row.department,
        remarks: row.remarks
      };

      return row.attendanceId
        ? this.http.put<AttendanceRecord>(`${this.apiBase}/attendance/${row.attendanceId}`, payload)
        : this.http.post<AttendanceRecord>(`${this.apiBase}/attendance`, payload);
    });

    return requests.length ? forkJoin(requests) : of([]);
  }

  registerStaff(payload: StaffCreatePayload): Observable<StaffRecord> {
    const formData = new FormData();
    formData.append('staffData', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    return this.http.post<any>(`${this.apiBase}/staff/saveOrUpdateStaff`, formData)
      .pipe(map(response => this.unwrap<StaffRecord>(response)));
  }

  saveDepartment(payload: Partial<DepartmentRecord>): Observable<DepartmentRecord> {
    return this.http.post<any>(`${this.apiBase}/departments/saveOrUpdate`, payload)
      .pipe(map(response => this.unwrap<DepartmentRecord>(response)));
  }

  saveBranch(payload: Partial<BranchRecord>): Observable<BranchRecord> {
    return this.http.post<any>(`${this.apiBase}/branches/saveOrUpdate`, payload)
      .pipe(map(response => this.unwrap<BranchRecord>(response)));
  }

  approveLeave(id: number): Observable<LeaveRecord> {
    return this.http.patch<LeaveRecord>(`${this.apiBase}/leave/${id}/approve`, {});
  }

  rejectLeave(id: number, reason: string): Observable<LeaveRecord> {
    return this.http.patch<LeaveRecord>(`${this.apiBase}/leave/${id}/reject`, { reason });
  }

  runPayroll(): Observable<PayrollRunResult> {
    return this.http.post<PayrollRunResult>(`${this.apiBase}/payroll/run`, {});
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getStaff(): Observable<StaffRecord[]> {
    return this.http.get<any>(`${this.apiBase}/staff/getAllStaff`).pipe(
      map(response => this.unwrapArray<StaffRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getDepartments(): Observable<DepartmentRecord[]> {
    return this.http.get<any>(`${this.apiBase}/departments/getAllDepartment`).pipe(
      map(response => this.unwrapArray<DepartmentRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getBranches(): Observable<BranchRecord[]> {
    return this.http.get<any>(`${this.apiBase}/branches/getAllBranch`).pipe(
      map(response => this.unwrapArray<BranchRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getLeaveRequests(): Observable<LeaveRecord[]> {
    return this.http.get<any>(`${this.apiBase}/leave/all`).pipe(
      map(response => this.unwrapArray<LeaveRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getPayroll(): Observable<PayrollRecord[]> {
    return this.http.get<any>(`${this.apiBase}/payroll`).pipe(
      map(response => this.unwrapArray<PayrollRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getStudents(): Observable<StudentRecord[]> {
    return this.http.get<any>(`${this.apiBase}/students/getStudents`).pipe(
      map(response => this.unwrapArray<StudentRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getClasses(): Observable<ClassRecord[]> {
    return this.http.get<any>(`${this.apiBase}/classes/getListOfClass`).pipe(
      map(response => this.unwrapArray<ClassRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getSections(classId: string | number): Observable<SectionRecord[]> {
    return this.http.get<any>(`${this.apiBase}/sections/getListOfSectionsByClassId/${classId}`).pipe(
      map(response => this.unwrapArray<SectionRecord>(response)),
      catchError(() => of([]))
    );
  }

  private getAttendance(date: string, type: AttendanceType): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiBase}/attendance?date=${date}&type=${type}`).pipe(
      catchError(() => of([]))
    );
  }

  private getAttendanceByClass(classId: number, date: string): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiBase}/attendance/class/${classId}?date=${date}`).pipe(
      catchError(() => of([]))
    );
  }

  private getAttendanceTrends(): Observable<AttendanceTrendPoint[]> {
    const dates = this.lastSevenDates();
    const requests = dates.map(date => forkJoin({
      classRecords: this.getAttendance(date, 'CLASS'),
      staffRecords: this.getAttendance(date, 'STAFF')
    }).pipe(map(({ classRecords, staffRecords }) => this.toTrendPoint(date, classRecords, staffRecords))));

    return requests.length ? forkJoin(requests) : of([]);
  }

  private toTrendPoint(date: string, classRecords: AttendanceRecord[], staffRecords: AttendanceRecord[]): AttendanceTrendPoint {
    const studentRate = this.attendanceRate(classRecords);
    const staffRate = this.attendanceRate(staffRecords);
    const label = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return {
      date,
      label,
      studentRate,
      staffRate,
      studentAbsent: classRecords.filter(item => item.status === 'ABSENT').length,
      staffAbsent: staffRecords.filter(item => item.status === 'ABSENT').length,
      lateEntries: [...classRecords, ...staffRecords].filter(item => item.status === 'LATE' || item.status === 'HALF_DAY').length
    };
  }

  private attendanceRate(records: AttendanceRecord[]): number {
    if (!records.length) {
      return 0;
    }

    const present = records.filter(item => this.isPresentLike(item.status)).length;
    return Math.round((present / records.length) * 100);
  }

  private isPresentLike(status: AttendanceStatus): boolean {
    return status === 'PRESENT' || status === 'LATE' || status === 'WFH' || status === 'HALF_DAY';
  }

  private matchesStudentFilters(student: StudentRecord, filters: { classId: string; sectionName: string }): boolean {
    const classMatches = filters.classId === 'all' || String(student.classId ?? '') === filters.classId;
    const sectionMatches = filters.sectionName === 'all' || (student.sectionName ?? '') === filters.sectionName;
    return classMatches && sectionMatches;
  }

  private matchesStaffFilters(staff: StaffRecord, filters: { department: string; branch: string }): boolean {
    const departmentMatches = filters.department === 'all' || (staff.departmentName ?? '') === filters.department;
    const branchMatches = filters.branch === 'all' || (staff.branchName ?? '') === filters.branch;
    return departmentMatches && branchMatches;
  }

  private toStudentRosterRow(student: StudentRecord, existing: AttendanceRecord[], date: string): RosterAttendanceRow {
    const record = existing.find(item => item.referenceId === student.studentId) ?? existing.find(item => item.referenceName === this.studentName(student));

    return {
      selected: false,
      attendanceId: record?.id,
      referenceId: student.studentId,
      referenceName: this.studentName(student),
      classId: student.classId,
      className: student.className,
      sectionName: student.sectionName,
      date,
      status: record?.status ?? 'PRESENT',
      remarks: record?.remarks ?? ''
    };
  }

  private toStaffRosterRow(staff: StaffRecord, existing: AttendanceRecord[], date: string, shift: string): RosterAttendanceRow {
    const staffId = staff.staffId ?? staff.id ?? 0;
    const record = existing.find(item => item.referenceId === staffId) ?? existing.find(item => item.referenceName === this.staffName(staff));

    return {
      selected: false,
      attendanceId: record?.id,
      referenceId: staffId,
      referenceName: this.staffName(staff),
      department: staff.departmentName,
      branchName: staff.branchName,
      shift: record?.shift ?? shift,
      date,
      status: record?.status ?? 'PRESENT',
      remarks: record?.remarks ?? ''
    };
  }

  private staffName(staff: StaffRecord): string {
    return [staff.firstName, staff.middleName, staff.lastName].filter(Boolean).join(' ').trim() || staff.email || 'Staff member';
  }

  private studentName(student: StudentRecord): string {
    return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ').trim() || student.email || 'Student';
  }

  private lastSevenDates(): string[] {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toISOString().slice(0, 10);
    });
  }

  private unwrapArray<T>(response: any): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    if (Array.isArray(response?.content)) {
      return response.content;
    }
    return [];
  }

  private unwrap<T>(response: any): T {
    return (response?.data ?? response) as T;
  }
}
