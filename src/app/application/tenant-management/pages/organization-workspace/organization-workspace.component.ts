import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { AdminAuditEvent, AdminBranch, AdminControlCenter, AdminUserAccess } from '../../../administration/models/admin-control.model';
import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';
import { TenantOrgView, mapOrganization } from '../../data/tenant-view.model';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasTabsComponent,
  SaasPillComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-organization-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, ToastModule, SaasPageHeaderComponent, SaasPanelComponent, SaasTabsComponent, SaasPillComponent, SaasStatGridComponent],
  providers: [MessageService],
  templateUrl: './organization-workspace.component.html',
  styleUrl: './organization-workspace.component.scss'
})
export class OrganizationWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminData = inject(AdminControlDataService);
  private readonly messageService = inject(MessageService);

  loading = true;
  errorMessage = '';
  workspace: AdminControlCenter | null = null;
  org: TenantOrgView | null = null;
  branches: AdminBranch[] = [];
  recentUsers: AdminUserAccess[] = [];
  activity: AdminAuditEvent[] = [];
  totalUsers = 0;
  activeTab = 'overview';

  readonly tabs = [
    { key: 'overview',     label: 'Overview',          icon: 'pi pi-id-card' },
    { key: 'subscription', label: 'Subscription',      icon: 'pi pi-credit-card' },
    { key: 'users',        label: 'Users',             icon: 'pi pi-users' },
    { key: 'storage',      label: 'Storage',           icon: 'pi pi-database' },
    { key: 'activity',     label: 'Activity Timeline', icon: 'pi pi-history' },
    { key: 'settings',     label: 'Settings',          icon: 'pi pi-cog' }
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('orgId'));
    this.load(id);
  }

  load(orgId: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminData.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
          const source = (ws?.organizations || []).find(o => o.orgId === orgId);
          if (!source) {
            this.errorMessage = 'Tenant not found. It may have been removed or your access was revoked.';
            this.loading = false; this.cdr.markForCheck(); return;
          }
          this.org = mapOrganization(source);
          this.branches = (ws?.branches || []).filter(b => b.organizationId === orgId);
          const scoped = (ws?.users || []).filter(u => u.organizations?.some(o => o === source.orgName || o === source.brandName));
          this.recentUsers = scoped.slice(0, 8);
          this.totalUsers = scoped.length || this.org.users;
          this.activity = (ws?.auditLogs || [])
            .filter(a => !source.tenantId || a.entityId?.toString() === source.tenantId || a.summary?.includes(source.orgName))
            .slice(0, 10);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load this tenant. Check your connection and retry.';
          this.loading = false; this.cdr.markForCheck();
        }
      });
  }

  get stats(): SaasStat[] {
    if (!this.org) return [];
    const o = this.org;
    return [
      { key: 'users', label: 'Active Users', value: this.totalUsers.toLocaleString(), helper: 'Across all roles', icon: 'pi pi-users', tone: 'primary' },
      { key: 'students', label: 'Students', value: o.students.toLocaleString(), helper: 'Enrolled', icon: 'pi pi-graduation-cap', tone: 'success' },
      { key: 'storage', label: 'Storage Used', value: o.storageLabel.split(' / ')[0] || '0 MB', helper: o.storageLimitMb > 0 ? `${o.storagePercent}% of ${(o.storageLimitMb / 1024).toFixed(1)} GB` : 'Unlimited', icon: 'pi pi-database', tone: o.storagePercent >= 90 ? 'danger' : o.storagePercent >= 75 ? 'warning' : 'info' },
      { key: 'api', label: 'API Calls (24h)', value: o.apiUsageToday.toLocaleString(), helper: 'No daily cap', icon: 'pi pi-bolt', tone: 'warning' }
    ];
  }

  statusTone(): 'success' | 'warning' | 'danger' | 'neutral' {
    if (!this.org) return 'neutral';
    if (this.org.status === 'active') return 'success';
    if (this.org.status === 'trial') return 'warning';
    if (this.org.status === 'suspended') return 'danger';
    return 'neutral';
  }

  changePlan(): void { this.router.navigate(['/app/tenant-management/subscription-plans']); }
  back(): void { this.router.navigate(['/app/tenant-management/organizations']); }

  toggleSuspension(): void {
    if (!this.org) return;
    this.comingSoon(this.org.status === 'suspended' ? 'Lift suspension' : 'Suspend tenant');
  }
  deactivate(): void { this.comingSoon('Deactivate tenant'); }
  impersonate(): void { this.comingSoon('Impersonate admin'); }
  renew(): void { this.comingSoon('Renew subscription'); }

  private comingSoon(action: string): void {
    this.messageService.add({ severity: 'info', summary: 'Coming soon', detail: `${action} will be available in an upcoming release.`, life: 3500 });
  }
}
