import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject , ChangeDetectionStrategy} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AdminActivityTimelineComponent,
  AdminAuditTableComponent,
  AdminKpiCardComponent,
  AdminMonitoringWidgetComponent,
  AdminNavComponent,
  AdminPermissionMatrixComponent,
  AdminStatusBadgeComponent
} from '../shared/admin-primitives.component';
import { AdminControlDataService } from '../../services/admin-control-data.service';
import {
  AdminAuditEvent,
  AdminControlCenter,
  AdminKpi,
  AdminRole,
  AdminSection,
  AdminSecurityEvent,
  AdminSystemEvent,
  AdminUserCreatePayload,
  AdminUserAccess,
  AdminWorkspacePage,
  SubscriptionPlanDTO
} from '../../models/admin-control.model';

type AdminDrawerMode = 'create-user' | 'role-detail' | 'audit-detail' | 'security-detail' | 'system-event' | null;
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
    AdminAuditTableComponent
  ],
  templateUrl: './admin-workspace.component.html'
})
export class AdminWorkspaceComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  page: AdminWorkspacePage = 'dashboard';
  workspace: AdminControlCenter | null = null;
  loading = true;
  actionLoading = false;
  errorMessage = '';
  successMessage = '';

  accessTab: AccessTab = 'roles';
  monitoringTab: MonitoringTab = 'health';
  auditSearch = '';
  accessSearch = '';

  selectedRole: AdminRole | null = null;
  selectedAuditEvent: AdminAuditEvent | null = null;
  selectedSecurityEvent: AdminSecurityEvent | null = null;
  selectedSystemEvent: AdminSystemEvent | null = null;
  drawerMode: AdminDrawerMode = null;

  adminUserForm: AdminUserCreatePayload = this.emptyAdminUserForm();
  adminUserRole = 'Admin';
  adminUserOrgId: number | null = null;

  subscriptionPlans: SubscriptionPlanDTO[] = [];
  subscriptionPlansLoading = false;
  planEditing: SubscriptionPlanDTO | null = null;
  planFormOpen = false;
  planForm: SubscriptionPlanDTO = this.emptyPlanForm();
  planFormStep = 1;
  planSaving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminDataService: AdminControlDataService
  ) { }

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.page = (data['adminPage'] as AdminWorkspacePage) || 'dashboard';
      this.clearMessages();
      if (this.page === 'subscriptions') {
        this.loadSubscriptionPlans();
      }
      this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Administration workspace data could not be loaded.';
        this.cdr.markForCheck();
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
    if (mode === 'create-user') {
      this.adminUserForm = this.emptyAdminUserForm();
      this.adminUserOrgId = this.workspace?.organizations[0]?.orgId ?? null;
      this.adminUserRole = 'Admin';
    }
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

  navigateToAccess(): void {
    this.router.navigate(['/app/admin/access']);
  }

  get administrationSections(): AdminSection[] {
    return (this.workspace?.adminSections ?? []).filter(section => {
      const route = (section.route ?? '').toLowerCase();
      const label = (section.label ?? '').toLowerCase();
      return !route.includes('/admin/organizations') && !label.includes('organization');
    });
  }

  get administrationKpis(): AdminKpi[] {
    const users = this.workspace?.users ?? [];
    const roles = this.workspace?.roles ?? [];
    const pendingInvitations = this.pendingInvitations.length;
    const healthScore = this.workspace?.monitoring?.healthScore ?? 0;

    return [
      {
        key: 'users',
        label: 'Admin Users',
        value: String(users.length),
        helper: `${users.filter(user => !user.blocked).length} active accounts`,
        icon: 'pi pi-users',
        tone: 'info'
      },
      {
        key: 'roles',
        label: 'Roles Governed',
        value: String(roles.length),
        helper: `${roles.reduce((total, role) => total + role.permissionAssignments, 0)} permission links`,
        icon: 'pi pi-shield',
        tone: 'success'
      },
      {
        key: 'pending-invitations',
        label: 'Pending Invitations',
        value: String(pendingInvitations),
        helper: 'First login or email verification pending',
        icon: 'pi pi-send',
        tone: pendingInvitations ? 'warning' : 'success'
      },
      {
        key: 'system-health',
        label: 'System Health Score',
        value: `${healthScore}%`,
        helper: `${this.highPrioritySystemEvents.length} open signals`,
        icon: 'pi pi-heart',
        tone: this.highPrioritySystemEvents.length ? 'warning' : 'success'
      }
    ];
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
      case 'access': return 'Access & Permissions';
      case 'monitoring': return 'System Monitoring';
      case 'audit': return 'Audit Center';
      case 'subscriptions': return 'Subscription Plans';
      default: return 'Administration Center';
    }
  }

  get pageSubtitle(): string {
    switch (this.page) {
      case 'access': return 'Govern roles, user access, invitations and permission coverage across the ERP.';
      case 'monitoring': return 'Track tenant health, jobs, notification delivery, diagnostics and data integrity.';
      case 'audit': return 'Explore administrative changes, security events, login audit and critical activity.';
      case 'subscriptions': return 'Manage plan catalog, pricing, capacity limits and module entitlement for tenants.';
      default: return 'Manage users, permissions, system activity and internal administrative controls.';
    }
  }

  drawerTitle(): string {
    switch (this.drawerMode) {
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

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ============ Subscription Plans ============

  loadSubscriptionPlans(): void {
    if (this.subscriptionPlansLoading || this.subscriptionPlans.length) {
      return;
    }
    this.subscriptionPlansLoading = true;
    this.adminDataService.listSubscriptionPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: plans => {
          this.subscriptionPlans = plans ?? [];
          this.subscriptionPlansLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.subscriptionPlansLoading = false;
          this.errorMessage = 'Unable to load subscription plans.';
          this.cdr.markForCheck();
        }
      });
  }

  refreshSubscriptionPlans(): void {
    this.subscriptionPlans = [];
    this.loadSubscriptionPlans();
  }

  openPlanForm(plan?: SubscriptionPlanDTO): void {
    this.planEditing = plan ?? null;
    this.planForm = plan ? { ...plan } : this.emptyPlanForm();
    this.planFormStep = 1;
    this.planFormOpen = true;
  }

  closePlanForm(): void {
    this.planFormOpen = false;
    this.planEditing = null;
    this.planFormStep = 1;
  }

  nextPlanStep(): void {
    if (this.planFormStep < 4) {
      this.planFormStep++;
    }
  }

  prevPlanStep(): void {
    if (this.planFormStep > 1) {
      this.planFormStep--;
    }
  }

  savePlan(): void {
    if (!this.planForm.planCode || !this.planForm.planName) {
      this.errorMessage = 'Plan code and name are required.';
      return;
    }
    this.planSaving = true;
    const request$ = this.planEditing && this.planForm.planId
      ? this.adminDataService.updateSubscriptionPlan(this.planForm)
      : this.adminDataService.createSubscriptionPlan(this.planForm);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: saved => {
        const idx = this.subscriptionPlans.findIndex(p => p.planId === saved.planId);
        if (idx >= 0) {
          this.subscriptionPlans[idx] = saved;
        } else {
          this.subscriptionPlans = [...this.subscriptionPlans, saved];
        }
        this.successMessage = `Plan "${saved.planName}" saved.`;
        this.planSaving = false;
        this.closePlanForm();
        this.cdr.markForCheck();
      },
      error: () => {
        this.planSaving = false;
        this.errorMessage = 'Unable to save subscription plan.';
        this.cdr.markForCheck();
      }
    });
  }

  deletePlan(plan: SubscriptionPlanDTO): void {
    if (!plan.planId) { return; }
    if (!confirm(`Delete plan "${plan.planName}"? Organizations using this plan will keep their current subscription type.`)) {
      return;
    }
    this.adminDataService.deleteSubscriptionPlan(plan.planId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.subscriptionPlans = this.subscriptionPlans.filter(p => p.planId !== plan.planId);
          this.successMessage = `Plan "${plan.planName}" deleted.`;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to delete plan.';
          this.cdr.markForCheck();
        }
      });
  }

  planModules(plan: SubscriptionPlanDTO): string[] {
    return (plan.modulesIncluded ?? '').split(',').map(m => m.trim()).filter(Boolean);
  }

  planFeaturedCount(): number {
    return this.subscriptionPlans.filter(p => p.featured).length;
  }

  planActiveCount(): number {
    return this.subscriptionPlans.filter(p => p.active !== false).length;
  }

  private emptyPlanForm(): SubscriptionPlanDTO {
    return {
      planCode: '',
      planName: '',
      description: '',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'INR',
      maxStudents: 100,
      maxStaff: 20,
      maxUsers: 50,
      storageGb: 10,
      modulesIncluded: 'Dashboard,Students,Staff,Attendance',
      supportTier: 'Email',
      highlightColor: '#3B82F6',
      featured: false,
      active: true
    };
  }
}