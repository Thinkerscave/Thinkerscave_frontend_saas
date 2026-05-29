import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  ActivityItem,
  AttendanceStatus,
  BranchRecord,
  DepartmentRecord,
  KpiMetric,
  LeaveRecord,
  PayrollRecord,
  StaffCreatePayload,
  StaffOperationTab,
  StaffProfile,
  StaffProfileTab,
  StaffRecord,
  StaffViewMode,
  StaffWorkspaceData,
  StaffWorkspacePage
} from '../../models/school-operations.model';
import { SchoolOperationsDataService } from '../../services/school-operations-data.service';
import {
  OpsDrawerComponent,
  OpsFilterPanelComponent,
  OpsHeaderComponent,
  OpsKpiCardComponent,
  OpsNavComponent,
  OpsNavItem,
  OpsTimelineComponent
} from '../shared/operations-primitives.component';

type StaffDrawerMode = 'none' | 'register' | 'profile' | 'department' | 'branch';

@Component({
  selector: 'app-staff-workspace',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    OpsNavComponent,
    OpsHeaderComponent,
    OpsKpiCardComponent,
    OpsFilterPanelComponent,
    OpsDrawerComponent,
    OpsTimelineComponent
  ],
  templateUrl: './staff-workspace.component.html'
})
export class StaffWorkspaceComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(SchoolOperationsDataService);
  private readonly messageService = inject(MessageService);
  private readonly destroy$ = new Subject<void>();

  readonly navItems: OpsNavItem[] = [
    { label: 'Dashboard', description: 'Workforce command view', route: '/app/staff/dashboard', icon: 'pi pi-chart-line' },
    { label: 'Staff Directory', description: 'Search, preview and act', route: '/app/staff/directory', icon: 'pi pi-id-card' },
    { label: 'Workforce Operations', description: 'Departments, leave, payroll', route: '/app/staff/operations', icon: 'pi pi-briefcase' }
  ];

  readonly profileTabs: { label: string; value: StaffProfileTab; icon: string }[] = [
    { label: 'Overview', value: 'overview', icon: 'pi pi-user' },
    { label: 'Attendance', value: 'attendance', icon: 'pi pi-check-square' },
    { label: 'Leave', value: 'leave', icon: 'pi pi-calendar-minus' },
    { label: 'Payroll', value: 'payroll', icon: 'pi pi-money-bill' },
    { label: 'Documents', value: 'documents', icon: 'pi pi-folder' },
    { label: 'Activity Timeline', value: 'activity', icon: 'pi pi-history' }
  ];

  data: StaffWorkspaceData = this.emptyData();
  activePage: StaffWorkspacePage = 'dashboard';
  loading = true;
  saving = false;
  drawerMode: StaffDrawerMode = 'none';
  selectedStaff: StaffProfile | null = null;
  selectedDepartment: DepartmentRecord | null = null;
  selectedBranch: BranchRecord | null = null;
  profileTab: StaffProfileTab = 'overview';
  operationTab: StaffOperationTab = 'departments';
  viewMode: StaffViewMode = this.readViewMode();

  filters = {
    search: '',
    department: 'all',
    branch: 'all',
    role: 'all',
    staffType: 'all',
    status: 'all',
    experience: 'all'
  };

  registerForm: StaffCreatePayload = this.emptyRegisterForm();
  departmentForm: Partial<DepartmentRecord> = this.emptyDepartmentForm();
  branchForm: Partial<BranchRecord> = this.emptyBranchForm();

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.activePage = (data['workspacePage'] as StaffWorkspacePage | undefined) ?? 'dashboard';
    });
    this.refresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get profiles(): StaffProfile[] {
    return this.data.staff.map(staff => this.toProfile(staff));
  }

  get filteredProfiles(): StaffProfile[] {
    const query = this.filters.search.trim().toLowerCase();

    return this.profiles.filter(profile => {
      const content = [profile.fullName, profile.staffCode, profile.departmentName, profile.branchName, profile.designation, profile.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || content.includes(query);
      const matchesDepartment = this.filters.department === 'all' || profile.departmentName === this.filters.department;
      const matchesBranch = this.filters.branch === 'all' || profile.branchName === this.filters.branch;
      const matchesRole = this.filters.role === 'all' || profile.designation === this.filters.role;
      const matchesType = this.filters.staffType === 'all' || profile.staffType === this.filters.staffType;
      const matchesStatus = this.filters.status === 'all' || profile.attendanceStatus === this.filters.status;
      const matchesExperience = this.matchesExperience(profile.experienceYears, this.filters.experience);
      return matchesQuery && matchesDepartment && matchesBranch && matchesRole && matchesType && matchesStatus && matchesExperience;
    });
  }

  get metrics(): KpiMetric[] {
    const profiles = this.profiles;
    const activeProfiles = profiles.filter(item => item.isActive !== false);
    const teaching = activeProfiles.filter(item => item.staffType === 'Teaching').length;
    const present = activeProfiles.filter(item => this.isPresentLike(item.attendanceStatus)).length;
    const absent = activeProfiles.filter(item => item.attendanceStatus === 'ABSENT').length;
    const pendingLeaves = this.data.leaveRequests.filter(item => item.status === 'PENDING').length;

    return [
      { label: 'Active Staff', value: activeProfiles.length, helper: `${this.data.branches.length} active branches`, icon: 'pi pi-users', tone: 'info' },
      { label: 'Teaching Staff', value: teaching, helper: `${activeProfiles.length - teaching} non teaching`, icon: 'pi pi-book', tone: 'success' },
      { label: 'Non Teaching Staff', value: activeProfiles.length - teaching, helper: 'Operations and support teams', icon: 'pi pi-briefcase', tone: 'neutral' },
      { label: 'Present Today', value: present, helper: `${this.attendanceCoverage()}% attendance coverage`, icon: 'pi pi-check-circle', tone: 'success' },
      { label: 'Absent Today', value: absent, helper: 'Includes only marked absences', icon: 'pi pi-exclamation-circle', tone: absent ? 'danger' : 'neutral' },
      { label: 'Pending Leaves', value: pendingLeaves, helper: 'Awaiting approval decision', icon: 'pi pi-calendar-minus', tone: pendingLeaves ? 'warning' : 'success' }
    ];
  }

  get departmentDistribution(): { name: string; count: number; percentage: number; color: string }[] {
    const colors = ['#7c5cff', '#00c48c', '#ffb547', '#ff5d73', '#5cc8ff', '#b08cff'];
    const total = Math.max(this.profiles.length, 1);

    return this.data.departments.map((department, index) => {
      const count = this.profiles.filter(profile => profile.departmentName === department.departmentName).length;
      return {
        name: department.departmentName,
        count,
        percentage: Math.round((count / total) * 100),
        color: colors[index % colors.length]
      };
    }).filter(item => item.count > 0);
  }

  get recentActivities(): ActivityItem[] {
    return this.profiles.flatMap(profile => profile.activities).slice(0, 8);
  }

  get pendingLeaves(): LeaveRecord[] {
    return this.data.leaveRequests.filter(item => item.status === 'PENDING');
  }

  get payrollTotal(): number {
    return this.data.payroll.reduce((total, item) => total + Number(item.netSalary ?? 0), 0);
  }

  get drawerOpen(): boolean {
    return this.drawerMode !== 'none';
  }

  get drawerTitle(): string {
    switch (this.drawerMode) {
      case 'register': return 'Register Staff';
      case 'profile': return this.selectedStaff?.fullName ?? 'Staff Profile';
      case 'department': return this.selectedDepartment ? 'Department Details' : 'Create Department';
      case 'branch': return this.selectedBranch ? 'Branch Details' : 'Create Branch';
      default: return '';
    }
  }

  get drawerEyebrow(): string {
    switch (this.drawerMode) {
      case 'register': return 'Workforce onboarding';
      case 'profile': return 'Staff 360';
      case 'department': return 'Academic structure';
      case 'branch': return 'Campus operations';
      default: return 'Workspace action';
    }
  }

  get roleOptions(): string[] {
    return Array.from(new Set(this.profiles.map(item => item.designation).filter(Boolean))).sort();
  }

  get attendanceStatusOptions(): (AttendanceStatus | 'NOT_MARKED')[] {
    return Array.from(new Set(this.profiles.map(item => item.attendanceStatus))).sort();
  }

  refresh(): void {
    this.loading = true;
    this.dataService.loadStaffWorkspace()
      .pipe(finalize(() => this.loading = false), takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.data = data;
          this.selectedStaff = this.selectedStaff ? this.profiles.find(item => item.staffId === this.selectedStaff?.staffId) ?? null : this.profiles[0] ?? null;
        },
        error: () => {
          this.data = this.emptyData();
          this.messageService.add({ severity: 'error', summary: 'Staff workspace unavailable', detail: 'Unable to load workforce records.' });
        }
      });
  }

  openRegister(): void {
    this.registerForm = this.emptyRegisterForm();
    this.drawerMode = 'register';
  }

  openProfile(profile: StaffProfile): void {
    this.selectedStaff = profile;
    this.profileTab = 'overview';
    this.drawerMode = 'profile';
  }

  previewProfile(profile: StaffProfile): void {
    this.selectedStaff = profile;
  }

  setViewMode(mode: StaffViewMode): void {
    this.viewMode = mode;
    localStorage.setItem('tc-staff-view-mode', mode);
  }

  openDepartment(department?: DepartmentRecord): void {
    this.selectedDepartment = department ?? null;
    this.departmentForm = department ? { ...department } : this.emptyDepartmentForm();
    this.drawerMode = 'department';
  }

  openBranch(branch?: BranchRecord): void {
    this.selectedBranch = branch ?? null;
    this.branchForm = branch ? { ...branch } : this.emptyBranchForm();
    this.drawerMode = 'branch';
  }

  closeDrawer(): void {
    this.drawerMode = 'none';
  }

  submitRegister(): void {
    if (!this.registerForm.firstName.trim() || !this.registerForm.lastName.trim() || !this.registerForm.email.trim()
      || !this.registerForm.mobileNumber || !this.registerForm.branchCode || !this.registerForm.departmentCode) {
      this.messageService.add({ severity: 'warn', summary: 'Missing staff details', detail: 'Complete name, contact, branch and department before registering.' });
      return;
    }

    this.saving = true;
    this.dataService.registerStaff(this.registerForm)
      .pipe(finalize(() => this.saving = false), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Staff registered', detail: 'The staff profile is now available in the directory.' });
          this.closeDrawer();
          this.refresh();
        },
        error: error => this.messageService.add({ severity: 'error', summary: 'Registration failed', detail: this.errorMessage(error) })
      });
  }

  submitDepartment(): void {
    if (!this.departmentForm.departmentName?.trim() || !this.departmentForm.departmentCode?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Missing department details', detail: 'Department name and code are required.' });
      return;
    }

    this.saving = true;
    this.dataService.saveDepartment(this.departmentForm)
      .pipe(finalize(() => this.saving = false), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Department saved', detail: 'Workforce structure has been updated.' });
          this.closeDrawer();
          this.refresh();
        },
        error: error => this.messageService.add({ severity: 'error', summary: 'Department save failed', detail: this.errorMessage(error) })
      });
  }

  submitBranch(): void {
    if (!this.branchForm.branchName?.trim() || !this.branchForm.branchCode?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Missing branch details', detail: 'Branch name and code are required.' });
      return;
    }

    this.saving = true;
    this.dataService.saveBranch(this.branchForm)
      .pipe(finalize(() => this.saving = false), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Branch saved', detail: 'Campus structure has been updated.' });
          this.closeDrawer();
          this.refresh();
        },
        error: error => this.messageService.add({ severity: 'error', summary: 'Branch save failed', detail: this.errorMessage(error) })
      });
  }

  approveLeave(request: LeaveRecord): void {
    this.saving = true;
    this.dataService.approveLeave(request.id)
      .pipe(finalize(() => this.saving = false), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Leave approved', detail: `${request.staffName} leave request approved.` });
          this.refresh();
        },
        error: error => this.messageService.add({ severity: 'error', summary: 'Approval failed', detail: this.errorMessage(error) })
      });
  }

  rejectLeave(request: LeaveRecord): void {
    const reason = window.prompt('Rejection reason', 'Operational coverage required');
    if (reason === null) {
      return;
    }

    this.saving = true;
    this.dataService.rejectLeave(request.id, reason)
      .pipe(finalize(() => this.saving = false), takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'info', summary: 'Leave rejected', detail: `${request.staffName} leave request rejected.` });
          this.refresh();
        },
        error: error => this.messageService.add({ severity: 'error', summary: 'Rejection failed', detail: this.errorMessage(error) })
      });
  }

  runPayroll(): void {
    this.saving = true;
    this.dataService.runPayroll()
      .pipe(finalize(() => this.saving = false), takeUntil(this.destroy$))
      .subscribe({
        next: result => this.messageService.add({ severity: 'success', summary: 'Payroll processed', detail: `${result.month}: ${result.totalStaff} staff processed.` }),
        error: error => this.messageService.add({ severity: 'error', summary: 'Payroll failed', detail: this.errorMessage(error) })
      });
  }

  goToAttendance(): void {
    void this.router.navigateByUrl('/app/attendance/staff');
  }

  focusLeaveQueue(): void {
    this.operationTab = 'leave';
    void this.router.navigateByUrl('/app/staff/operations');
  }

  exportStaffReport(): void {
    const rows = this.profiles.map(profile => [
      profile.staffCode ?? '',
      profile.fullName,
      profile.departmentName ?? '',
      profile.branchName ?? '',
      profile.designation,
      profile.staffType,
      profile.attendanceStatus,
      profile.email ?? '',
      profile.mobileNumber ?? ''
    ]);
    const csv = [['Staff Code', 'Name', 'Department', 'Branch', 'Designation', 'Type', 'Attendance', 'Email', 'Mobile'], ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `staff-report-${this.data.today}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  departmentDonutStyle(): string {
    const distribution = this.departmentDistribution;
    if (!distribution.length) {
      return 'conic-gradient(rgba(255,255,255,0.12) 0 100%)';
    }

    let start = 0;
    const parts = distribution.map(item => {
      const end = start + item.percentage;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  profileDocuments(profile: StaffProfile): { label: string; status: string; meta: string; tone: string }[] {
    return [
      { label: 'Employment profile', status: profile.staffCode ? 'Available' : 'Pending', meta: profile.hireDate ? `Joined ${this.formatDate(profile.hireDate)}` : 'Joining date pending', tone: profile.staffCode ? 'success' : 'warning' },
      { label: 'Payroll record', status: profile.payroll ? 'Configured' : 'Not configured', meta: profile.payroll?.effectiveFrom ? `Effective ${this.formatDate(profile.payroll.effectiveFrom)}` : 'Payroll setup pending', tone: profile.payroll ? 'success' : 'warning' },
      { label: 'Leave ledger', status: `${profile.leaveRequests.length} requests`, meta: `${profile.leaveRequests.filter(item => item.status === 'PENDING').length} pending approval`, tone: profile.leaveRequests.some(item => item.status === 'PENDING') ? 'warning' : 'info' },
      { label: 'Attendance register', status: this.statusLabel(profile.attendanceStatus), meta: `For ${this.formatDate(this.data.today)}`, tone: this.statusTone(profile.attendanceStatus) }
    ];
  }

  staffCountForDepartment(department: DepartmentRecord): number {
    return this.profiles.filter(profile => profile.departmentName === department.departmentName).length;
  }

  staffCountForBranch(branch: BranchRecord): number {
    return this.profiles.filter(profile => profile.branchName === branch.branchName).length;
  }

  payrollForStaff(staffId?: number): PayrollRecord | undefined {
    return this.data.payroll.find(item => item.staffId === staffId);
  }

  formatCurrency(value?: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value ?? 0));
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'Not available';
    }
    return new Date(`${value}`.includes('T') ? value : `${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  statusLabel(status: AttendanceStatus | 'NOT_MARKED'): string {
    const labels: Record<AttendanceStatus | 'NOT_MARKED', string> = {
      PRESENT: 'Present',
      ABSENT: 'Absent',
      LATE: 'Late',
      EXCUSED: 'Leave',
      WFH: 'WFH',
      ON_LEAVE: 'On Leave',
      NIGHT_OUT: 'Night Out',
      HALF_DAY: 'Half Day',
      NOT_MARKED: 'Not Marked'
    };
    return labels[status];
  }

  statusTone(status: AttendanceStatus | 'NOT_MARKED'): string {
    if (this.isPresentLike(status)) {
      return 'success';
    }
    if (status === 'ABSENT') {
      return 'danger';
    }
    if (status === 'NOT_MARKED') {
      return 'warning';
    }
    return 'info';
  }

  leaveTone(status: string): string {
    if (status === 'APPROVED') {
      return 'success';
    }
    if (status === 'REJECTED' || status === 'CANCELLED') {
      return 'danger';
    }
    return 'warning';
  }

  trackByStaff(_: number, item: StaffProfile): number | string {
    return item.staffId ?? item.staffCode ?? item.fullName;
  }

  trackByDepartment(_: number, item: DepartmentRecord): number | string {
    return item.id ?? item.departmentCode;
  }

  trackByBranch(_: number, item: BranchRecord): number | string {
    return item.id ?? item.branchCode;
  }

  trackByLeave(_: number, item: LeaveRecord): number {
    return item.id;
  }

  private toProfile(staff: StaffRecord): StaffProfile {
    const staffId = staff.staffId ?? staff.id;
    const payroll = this.data.payroll.find(item => item.staffId === staffId);
    const attendanceRecord = this.data.todayStaffAttendance.find(item => item.referenceId === staffId) ??
      this.data.todayStaffAttendance.find(item => item.referenceName === this.staffName(staff));
    const leaveRequests = this.data.leaveRequests.filter(item => item.staffId === staffId || item.staffName === this.staffName(staff));
    const designation = payroll?.designation || staff.remarks || (staff.departmentName ? `${staff.departmentName} Staff` : 'Staff Member');
    const staffType = this.inferStaffType(designation, staff.departmentName);

    return {
      ...staff,
      fullName: this.staffName(staff),
      initials: this.initials(staff),
      designation,
      staffType,
      experienceYears: this.experienceYears(staff.hireDate),
      attendanceStatus: attendanceRecord?.status ?? 'NOT_MARKED',
      attendanceRecord,
      payroll,
      leaveRequests,
      activities: this.activitiesForStaff(staff, attendanceRecord, leaveRequests, payroll)
    };
  }

  private activitiesForStaff(staff: StaffRecord, attendance?: { status: AttendanceStatus; attendanceDate: string }, leaves: LeaveRecord[] = [], payroll?: PayrollRecord): ActivityItem[] {
    const name = this.staffName(staff);
    const items: ActivityItem[] = [];

    if (attendance) {
      items.push({ title: `${this.statusLabel(attendance.status)} attendance`, description: `${name} marked ${this.statusLabel(attendance.status).toLowerCase()} today.`, meta: this.formatDate(attendance.attendanceDate), icon: 'pi pi-check-square', tone: this.statusTone(attendance.status) as ActivityItem['tone'] });
    }
    leaves.slice(0, 2).forEach(leave => {
      items.push({ title: `${leave.status} leave request`, description: `${name} requested ${leave.days} day(s) of ${leave.leaveType.toLowerCase()} leave.`, meta: `${this.formatDate(leave.startDate)} - ${this.formatDate(leave.endDate)}`, icon: 'pi pi-calendar-minus', tone: this.leaveTone(leave.status) as ActivityItem['tone'] });
    });
    if (payroll) {
      items.push({ title: 'Payroll profile active', description: `${name} has ${this.formatCurrency(payroll.netSalary)} net monthly payroll configured.`, meta: payroll.effectiveFrom ? this.formatDate(payroll.effectiveFrom) : 'Payroll', icon: 'pi pi-money-bill', tone: 'success' });
    }

    return items;
  }

  private inferStaffType(designation?: string, department?: string): 'Teaching' | 'Non Teaching' {
    const text = `${designation ?? ''} ${department ?? ''}`.toLowerCase();
    return /(teacher|faculty|academic|mathematics|science|english|computer|humanities|stem)/.test(text) ? 'Teaching' : 'Non Teaching';
  }

  private experienceYears(hireDate?: string): number {
    if (!hireDate) {
      return 0;
    }
    const start = new Date(`${hireDate}T00:00:00`);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const beforeAnniversary = now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
    return Math.max(0, beforeAnniversary ? years - 1 : years);
  }

  private initials(staff: StaffRecord): string {
    const first = staff.firstName?.charAt(0) ?? '';
    const last = staff.lastName?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || 'ST';
  }

  private staffName(staff: StaffRecord): string {
    return [staff.firstName, staff.middleName, staff.lastName].filter(Boolean).join(' ').trim() || staff.email || 'Staff member';
  }

  private isPresentLike(status: AttendanceStatus | 'NOT_MARKED'): boolean {
    return status === 'PRESENT' || status === 'LATE' || status === 'WFH' || status === 'HALF_DAY';
  }

  private attendanceCoverage(): number {
    if (!this.profiles.length) {
      return 0;
    }
    const marked = this.profiles.filter(item => item.attendanceStatus !== 'NOT_MARKED').length;
    return Math.round((marked / this.profiles.length) * 100);
  }

  private matchesExperience(years: number, filter: string): boolean {
    switch (filter) {
      case '0-2': return years <= 2;
      case '3-5': return years >= 3 && years <= 5;
      case '6+': return years >= 6;
      default: return true;
    }
  }

  private readViewMode(): StaffViewMode {
    const saved = localStorage.getItem('tc-staff-view-mode');
    return saved === 'table' || saved === 'compact' || saved === 'card' ? saved : 'card';
  }

  private emptyData(): StaffWorkspaceData {
    return {
      today: this.dataService.today(),
      staff: [],
      departments: [],
      branches: [],
      todayStaffAttendance: [],
      todayClassAttendance: [],
      leaveRequests: [],
      payroll: []
    };
  }

  private emptyRegisterForm(): StaffCreatePayload {
    return {
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: null,
      gender: '',
      dateOfBirth: '',
      hireDate: this.dataService.today(),
      address: '',
      city: '',
      state: '',
      remarks: '',
      branchCode: '',
      departmentCode: ''
    };
  }

  private emptyDepartmentForm(): Partial<DepartmentRecord> {
    return { departmentName: '', departmentCode: '', description: '', isActive: true };
  }

  private emptyBranchForm(): Partial<BranchRecord> {
    return { branchName: '', branchCode: '', location: '', isActive: true };
  }

  private errorMessage(error: unknown): string {
    const candidate = error as { error?: { message?: string }; message?: string };
    return candidate.error?.message ?? candidate.message ?? 'Please try again.';
  }
}
