import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AdminAuditEvent, AdminBranch, AdminControlCenter, AdminUserAccess } from '../../../administration/models/admin-control.model';
import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';
import { TenantOrgView, mapOrganization } from '../../data/tenant-view.model';

interface UsageMetric {
  label: string;
  caption: string;
  icon: string;
  value: string;
  hint: string;
  percent: number;
  hasMeter: boolean;
  variant: 'normal' | 'unlimited' | 'warn' | 'danger';
  meterClass: '' | 'is-warn' | 'is-danger';
}

interface RoleDistribution {
  role: string;
  count: number;
  percent: number;
}

interface AdminActionDef {
  key: string;
  label: string;
  description: string;
  icon: string;
  available: boolean;
}

@Component({
  selector: 'app-organization-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, ToastModule],
  providers: [MessageService],
  templateUrl: './organization-workspace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  roleDistribution: RoleDistribution[] = [];
  usage: UsageMetric[] = [];
  activeSection = 'overview';

  readonly sections = [
    { id: 'overview', label: 'Overview', icon: 'pi-id-card' },
    { id: 'subscription', label: 'Subscription', icon: 'pi-credit-card' },
    { id: 'users', label: 'Users', icon: 'pi-users' },
    { id: 'activity', label: 'Activity', icon: 'pi-history' },
    { id: 'administration', label: 'Administration', icon: 'pi-cog' }
  ];

  readonly adminActions: AdminActionDef[] = [
    { key: 'renew',       label: 'Renew subscription', description: 'Extend the billing cycle without service interruption.',     icon: 'pi-refresh',        available: false },
    { key: 'upgrade',     label: 'Change plan',        description: 'Compare tiers and switch this tenant to a different plan.', icon: 'pi-arrow-up-right', available: true  },
    { key: 'impersonate', label: 'Impersonate admin',  description: 'Sign in as the owner with a fully audited session.',        icon: 'pi-user-edit',      available: false }
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
            this.loading = false;
            this.cdr.markForCheck();
            return;
          }
          this.org = mapOrganization(source);
          this.branches = (ws?.branches || []).filter(b => b.organizationId === orgId);
          const scopedUsers = (ws?.users || []).filter(u => u.organizations?.some(o => o === source.orgName || o === source.brandName));
          this.recentUsers = scopedUsers.slice(0, 6);
          this.totalUsers = scopedUsers.length || this.org.users;
          this.roleDistribution = this.buildRoleDistribution(scopedUsers);
          this.activity = (ws?.auditLogs || [])
            .filter(a => !source.tenantId || a.entityId?.toString() === source.tenantId || a.summary?.includes(source.orgName))
            .slice(0, 10);
          this.usage = this.buildUsage(this.org);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load this tenant. Check your connection and retry.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private buildRoleDistribution(users: AdminUserAccess[]): RoleDistribution[] {
    const counts = new Map<string, number>();
    for (const u of users) {
      for (const r of (u.roles || ['Member'])) counts.set(r, (counts.get(r) || 0) + 1);
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(counts.entries())
      .map(([role, count]) => ({ role, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private buildUsage(org: TenantOrgView): UsageMetric[] {
    const storageVariant: UsageMetric['variant'] = org.storagePercent >= 95 ? 'danger' : org.storagePercent >= 80 ? 'warn' : 'normal';
    const storageMeter: UsageMetric['meterClass'] = org.storagePercent >= 95 ? 'is-danger' : org.storagePercent >= 80 ? 'is-warn' : '';
    return [
      {
        label: 'Active users',
        caption: 'Seats consumed across all roles',
        icon: 'pi-users',
        value: org.users.toLocaleString(),
        hint: 'No seat cap on this plan',
        percent: 0,
        hasMeter: false,
        variant: 'unlimited',
        meterClass: ''
      },
      {
        label: 'Storage',
        caption: 'Documents, media and exports',
        icon: 'pi-database',
        value: org.storageLabel.split(' / ')[0] || org.storageLabel,
        hint: org.storageLimitMb > 0 ? `of ${(org.storageLimitMb / 1024).toFixed(1)} GB · ${org.storagePercent}% used` : 'No quota configured',
        percent: org.storagePercent,
        hasMeter: org.storageLimitMb > 0,
        variant: storageVariant,
        meterClass: storageMeter
      },
      {
        label: 'API calls (24h)',
        caption: 'Requests across this tenant',
        icon: 'pi-bolt',
        value: org.apiUsageToday.toLocaleString(),
        hint: 'Observation only — no daily cap',
        percent: 0,
        hasMeter: false,
        variant: 'unlimited',
        meterClass: ''
      },
      {
        label: 'Branches',
        caption: 'Active campus or branch tenancies',
        icon: 'pi-sitemap',
        value: org.branches.toLocaleString(),
        hint: org.branches === 1 ? '1 branch active' : `${org.branches} branches active`,
        percent: 0,
        hasMeter: false,
        variant: 'unlimited',
        meterClass: ''
      }
    ];
  }

  scrollTo(sectionId: string): void {
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSection = sectionId;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const threshold = 140;
    let current = this.activeSection;
    for (const s of this.sections) {
      const el = document.getElementById(`section-${s.id}`);
      if (el && el.getBoundingClientRect().top - threshold <= 0) current = s.id;
    }
    if (current !== this.activeSection) {
      this.activeSection = current;
      this.cdr.markForCheck();
    }
  }

  back(): void {
    this.router.navigate(['/app/tenant-management/organizations']);
  }

  changePlan(): void {
    this.router.navigate(['/app/tenant-management/subscription-plans']);
  }

  runAdminAction(action: string): void {
    const def = this.adminActions.find(a => a.key === action);
    if (action === 'upgrade') {
      this.changePlan();
      return;
    }
    this.comingSoon(def?.label || this.actionLabel(action));
  }

  toggleSuspension(): void {
    if (!this.org) return;
    this.comingSoon(this.org.status === 'suspended' ? 'Lift suspension' : 'Suspend tenant');
  }

  deactivateTenant(): void {
    this.comingSoon('Deactivate tenant');
  }

  private actionLabel(action: string): string {
    const map: Record<string, string> = {
      renew: 'Renew subscription',
      impersonate: 'Impersonate admin',
      suspend: 'Suspend tenant',
      activate: 'Activate tenant',
      deactivate: 'Deactivate tenant'
    };
    return map[action] || action;
  }

  private comingSoon(action: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Coming soon',
      detail: `${action} will be available in an upcoming release.`,
      life: 3500
    });
  }
}
