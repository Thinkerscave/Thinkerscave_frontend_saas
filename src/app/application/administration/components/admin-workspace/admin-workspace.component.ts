import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject , ChangeDetectionStrategy} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AdminActivityTimelineComponent,
  AdminAuditTableComponent,
  AdminKpiCardComponent,
  AdminMonitoringWidgetComponent,
  AdminNavComponent,
  AdminOrganizationDrawerComponent,
  AdminPermissionMatrixComponent,
  AdminStatusBadgeComponent
} from '../shared/admin-primitives.component';
import { AdminControlDataService } from '../../services/admin-control-data.service';
import {
  AdminAuditEvent,
  AdminBranch,
  AdminControlCenter,
  AdminOrganization,
  AdminOrganizationCreatePayload,
  AdminRole,
  AdminSecurityEvent,
  AdminSystemEvent,
  AdminUserCreatePayload,
  AdminUserAccess,
  AdminWorkspacePage
} from '../../models/admin-control.model';

type AdminDrawerMode = 'create-organization' | 'create-user' | 'role-detail' | 'audit-detail' | 'security-detail' | 'system-event' | null;
type OrganizationTab = 'overview' | 'branches' | 'subscription' | 'branding';
type AccessTab = 'roles' | 'matrix' | 'users' | 'invitations';
type MonitoringTab = 'health' | 'jobs' | 'notifications' | 'integrity';

@Component({
  selector: 'app-admin-workspace',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AdminNavComponent,
    AdminKpiCardComponent,
    AdminStatusBadgeComponent,
    AdminMonitoringWidgetComponent,
    AdminActivityTimelineComponent,
    AdminPermissionMatrixComponent,
    AdminAuditTableComponent,
    AdminOrganizationDrawerComponent
  ],
  templateUrl: './admin-workspace.component.html'
})
export class AdminWorkspaceComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  page: AdminWorkspacePage = 'dashboard';
  workspace: AdminControlCenter | null = null;
  loading = true;
  actionLoading = false;
  errorMessage = '';
  successMessage = '';

  organizationTab: OrganizationTab = 'overview';
  accessTab: AccessTab = 'roles';
  monitoringTab: MonitoringTab = 'health';
  auditSearch = '';
  accessSearch = '';

  selectedOrganization: AdminOrganization | null = null;
  selectedRole: AdminRole | null = null;
  selectedAuditEvent: AdminAuditEvent | null = null;
  selectedSecurityEvent: AdminSecurityEvent | null = null;
  selectedSystemEvent: AdminSystemEvent | null = null;
  drawerMode: AdminDrawerMode = null;

  organizationForm: AdminOrganizationCreatePayload = this.emptyOrganizationForm();
  adminUserForm: AdminUserCreatePayload = this.emptyAdminUserForm();
  adminUserRole = 'Admin';
  adminUserOrgId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminDataService: AdminControlDataService
  ) { }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.page = (data['adminPage'] as AdminWorkspacePage) || 'dashboard';
      this.clearMessages();
    });
    this.loadWorkspace();
  }

  loadWorkspace(): void {
    this.loading = true;
    this.adminDataService.loadWorkspace().subscribe({
      next: workspace => {
        this.workspace = workspace;
        this.loading = false;
        this.adminUserOrgId = workspace.organizations[0]?.orgId ?? null;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Administration workspace data could not be loaded.';
      }
    });
  }

  runDiagnostics(): void {
    this.actionLoading = true;
    this.clearMessages();
    this.adminDataService.runDiagnostics().subscribe({
      next: () => {
        this.successMessage = 'System diagnostics completed.';
        this.actionLoading = false;
        this.loadWorkspace();
      },
      error: () => {
        this.errorMessage = 'System diagnostics could not be completed.';
        this.actionLoading = false;
      }
    });
  }

  openAction(mode: Exclude<AdminDrawerMode, null>): void {
    this.drawerMode = mode;
    this.clearMessages();
    if (mode === 'create-organization') {
      this.organizationForm = this.emptyOrganizationForm();
    }
    if (mode === 'create-user') {
      this.adminUserForm = this.emptyAdminUserForm();
      this.adminUserOrgId = this.workspace?.organizations[0]?.orgId ?? null;
      this.adminUserRole = 'Admin';
    }
  }

  createOrganization(): void {
    this.clearMessages();
    if (!this.organizationForm.displayName || !this.organizationForm.adminEmail || !this.organizationForm.adminPassword) {
      this.errorMessage = 'Organization name, admin email and password are required.';
      return;
    }
    const payload: AdminOrganizationCreatePayload = {
      ...this.organizationForm,
      tenantName: this.organizationForm.tenantName || this.toTenantName(this.organizationForm.displayName),
      adminFirstName: this.organizationForm.adminFirstName || 'Admin',
      adminLastName: this.organizationForm.adminLastName || 'User'
    };
    this.actionLoading = true;
    this.adminDataService.createOrganization(payload).subscribe({
      next: () => {
        this.errorMessage = '';
        this.successMessage = 'Organization created successfully.';
        this.actionLoading = false;
        this.closeDrawer();
        this.loadWorkspace();
      },
      error: () => {
        this.errorMessage = 'Organization could not be created.';
        this.actionLoading = false;
      }
    });
  }

  createAdminUser(): void {
    this.clearMessages();
    if (!this.adminUserForm.userName || !this.adminUserForm.email || !this.adminUserForm.password || !this.adminUserForm.mobileNumber) {
      this.errorMessage = 'Username, email, password and mobile number are required.';
      return;
    }
    const payload: AdminUserCreatePayload = {
      ...this.adminUserForm,
      roles: [this.adminUserRole],
      organizationIds: this.adminUserOrgId ? [Number(this.adminUserOrgId)] : []
    };
    this.actionLoading = true;
    this.adminDataService.createAdminUser(payload).subscribe({
      next: () => {
        this.errorMessage = '';
        this.successMessage = 'Admin user created successfully.';
        this.actionLoading = false;
        this.closeDrawer();
        this.loadWorkspace();
      },
      error: () => {
        this.errorMessage = 'Admin user could not be created.';
        this.actionLoading = false;
      }
    });
  }

  openOrganization(organization: AdminOrganization): void {
    this.selectedOrganization = organization;
  }

  openRole(role: AdminRole): void {
    this.selectedRole = role;
    this.drawerMode = 'role-detail';
  }

  openAuditEvent(event: AdminAuditEvent): void {
    this.selectedAuditEvent = event;
    this.drawerMode = 'audit-detail';
  }

  openSecurityEvent(event: AdminSecurityEvent): void {
    this.selectedSecurityEvent = event;
    this.drawerMode = 'security-detail';
  }

  openSystemEvent(event: AdminSystemEvent): void {
    this.selectedSystemEvent = event;
    this.drawerMode = 'system-event';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.selectedRole = null;
    this.selectedAuditEvent = null;
    this.selectedSecurityEvent = null;
    this.selectedSystemEvent = null;
  }

  closeOrganizationDrawer(): void {
    this.selectedOrganization = null;
  }

  navigateToAccess(): void {
    this.router.navigate(['/app/admin/access']);
  }

  get visibleOrganizations(): AdminOrganization[] {
    return this.workspace?.organizations ?? [];
  }

  get visibleBranches(): AdminBranch[] {
    const organizationId = this.selectedOrganization?.orgId;
    const branches = this.workspace?.branches ?? [];
    return organizationId ? branches.filter(branch => branch.organizationId === organizationId) : branches;
  }

  get filteredUsers(): AdminUserAccess[] {
    const query = this.accessSearch.trim().toLowerCase();
    const users = this.workspace?.users ?? [];
    if (!query) {
      return users;
    }
    return users.filter(user => [user.fullName, user.email, user.userName, user.roles.join(' ')].join(' ').toLowerCase().includes(query));
  }

  get filteredRoles(): AdminRole[] {
    const query = this.accessSearch.trim().toLowerCase();
    const roles = this.workspace?.roles ?? [];
    if (!query) {
      return roles;
    }
    return roles.filter(role => [role.roleName, role.roleCode, role.description].join(' ').toLowerCase().includes(query));
  }

  get pendingInvitations(): AdminUserAccess[] {
    return (this.workspace?.users ?? []).filter(user => user.invitationStatus === 'PENDING');
  }

  get filteredAuditLogs(): AdminAuditEvent[] {
    const query = this.auditSearch.trim().toLowerCase();
    const logs = this.workspace?.auditLogs ?? [];
    if (!query) {
      return logs;
    }
    return logs.filter(item => [item.action, item.eventType, item.entityType, item.entityId, item.actorUsername, item.summary].join(' ').toLowerCase().includes(query));
  }

  get securityAlerts(): AdminSecurityEvent[] {
    return (this.workspace?.securityEvents ?? []).filter(event => !event.success || ['HIGH', 'CRITICAL', 'MEDIUM'].includes(event.severity));
  }

  get highPrioritySystemEvents(): AdminSystemEvent[] {
    return (this.workspace?.systemEvents ?? []).filter(event => !event.resolved || ['HIGH', 'CRITICAL', 'MEDIUM'].includes(event.severity));
  }

  get pageTitle(): string {
    switch (this.page) {
      case 'organizations': return 'Organization Management';
      case 'access': return 'Access & Permissions';
      case 'monitoring': return 'System Monitoring';
      case 'audit': return 'Audit Center';
      default: return 'Administration Center';
    }
  }

  get pageSubtitle(): string {
    switch (this.page) {
      case 'organizations': return 'Manage schools, branches, subscriptions, academic configuration and brand identity.';
      case 'access': return 'Govern roles, user access, invitations and permission coverage across the ERP.';
      case 'monitoring': return 'Track tenant health, jobs, notification delivery, diagnostics and data integrity.';
      case 'audit': return 'Explore administrative changes, security events, login audit and critical activity.';
      default: return 'Manage organizations, users, permissions, system activity and platform operations.';
    }
  }

  drawerTitle(): string {
    switch (this.drawerMode) {
      case 'create-organization': return 'Create Organization';
      case 'create-user': return 'Create Admin User';
      case 'role-detail': return this.selectedRole?.roleName || 'Role Detail';
      case 'audit-detail': return this.selectedAuditEvent?.action || 'Audit Detail';
      case 'security-detail': return this.selectedSecurityEvent?.eventCode || 'Security Event';
      case 'system-event': return this.selectedSystemEvent?.title || 'System Event';
      default: return '';
    }
  }

  statusTone(value?: string | boolean): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (value === true || value === 'ACTIVE' || value === 'HEALTHY' || value === 'COMPLETED' || value === 'ACCEPTED') {
      return 'success';
    }
    if (value === false || value === 'SUSPENDED' || value === 'CRITICAL' || value === 'HIGH') {
      return 'danger';
    }
    if (value === 'PENDING' || value === 'OPEN' || value === 'WATCH' || value === 'MEDIUM') {
      return 'warning';
    }
    return 'info';
  }

  healthTone(score?: number): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if ((score ?? 0) >= 90) {
      return 'success';
    }
    if ((score ?? 0) >= 75) {
      return 'warning';
    }
    return 'danger';
  }

  formatMetric(value?: number, unit?: string): string {
    if (value === undefined || value === null) {
      return 'N/A';
    }
    return unit ? `${value} ${unit}` : String(value);
  }

  private emptyOrganizationForm(): AdminOrganizationCreatePayload {
    return {
      tenantName: '',
      displayName: '',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: '',
      adminMobile: '',
      organizationType: 'SCHOOL',
      subscriptionType: 'PREMIUM',
      maxUsers: 500,
      storageLimitMb: 10240,
      city: '',
      state: '',
      establishDate: null
    };
  }

  private emptyAdminUserForm(): AdminUserCreatePayload {
    return {
      userName: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      mobileNumber: null,
      roles: [],
      organizationIds: []
    };
  }

  private toTenantName(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}