import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { forkJoin } from 'rxjs';

import { PlatformDashboard, SubscriptionPlan } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ChartModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent
  ],
  templateUrl: './platform-dashboard.component.html',
  styleUrl: './platform-dashboard.component.scss'
})
export class PlatformDashboardComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  loading = true;
  errorMessage = '';
  dashboard: PlatformDashboard | null = null;
  plans: SubscriptionPlan[] = [];
  activities: ActivityItem[] = [];

  orgTrendData: Record<string, unknown> = {};
  orgTrendOptions: Record<string, unknown> = {};
  planDistData: Record<string, unknown> = {};
  planDistOptions: Record<string, unknown> = {};

  ngOnInit(): void {
    this.initChartOptions();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      dashboard: this.api.getDashboard(),
      plans: this.api.getSubscriptionPlans()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ dashboard, plans }) => {
        this.dashboard = dashboard;
        this.plans = plans.filter(p => p.active !== false);
        this.buildActivities();
        this.buildCharts();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load platform dashboard. Verify backend is running and you have Super Admin access.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get stats(): SaasStat[] {
    const d = this.dashboard;
    if (!d) return [];
    return [
      { key: 'customers', label: 'Total Customers', value: d.totalCustomers, helper: 'Platform accounts', icon: 'pi pi-users', tone: 'primary', delta: '+12% this month', deltaTone: 'success' },
      { key: 'orgs', label: 'Total Organizations', value: d.totalOrganizations, helper: 'All tenants', icon: 'pi pi-building', tone: 'info', delta: '+8% this month', deltaTone: 'success' },
      { key: 'active', label: 'Active Organizations', value: d.activeOrganizations, helper: 'Live subscriptions', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'trial', label: 'Trial Organizations', value: d.trialOrganizations, helper: 'Evaluating platform', icon: 'pi pi-clock', tone: 'warning' },
      { key: 'renewal', label: 'Renewal Due (30d)', value: d.renewalDue30Days, helper: 'Needs attention', icon: 'pi pi-calendar', tone: 'warning' },
      { key: 'suspended', label: 'Suspended', value: d.suspendedOrganizations, helper: 'Paused tenants', icon: 'pi pi-ban', tone: 'danger' }
    ];
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  private buildActivities(): void {
    const d = this.dashboard!;
    this.activities = [
      { title: 'Platform snapshot refreshed', detail: `${d.totalOrganizations} organizations across ${d.totalCustomers} customers`, time: 'Just now', icon: 'pi pi-sync' },
      { title: 'Provisioning queue', detail: `${d.provisioningInProgress} jobs in progress`, time: 'Live', icon: 'pi pi-cog' },
      { title: 'Subscription catalog', detail: `${d.totalSubscriptionPlans} active plans available`, time: 'Today', icon: 'pi pi-tags' },
      { title: 'Promotions running', detail: `${d.activePromotions} active promotional offers`, time: 'Today', icon: 'pi pi-percentage' }
    ];
  }

  private buildCharts(): void {
    const d = this.dashboard!;
    this.orgTrendData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        { label: 'Active', data: [d.activeOrganizations * 0.7, d.activeOrganizations * 0.75, d.activeOrganizations * 0.8, d.activeOrganizations * 0.85, d.activeOrganizations * 0.92, d.activeOrganizations], borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.1)', tension: 0.4, fill: true },
        { label: 'Trial', data: [d.trialOrganizations * 1.2, d.trialOrganizations, d.trialOrganizations * 0.9, d.trialOrganizations * 0.95, d.trialOrganizations, d.trialOrganizations], borderColor: '#2C5BFF', backgroundColor: 'rgba(44,91,255,0.08)', tension: 0.4, fill: true },
        { label: 'Suspended', data: [d.suspendedOrganizations * 1.5, d.suspendedOrganizations * 1.2, d.suspendedOrganizations, d.suspendedOrganizations, d.suspendedOrganizations * 0.9, d.suspendedOrganizations], borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)', tension: 0.4, fill: true }
      ]
    };

    const planLabels = this.plans.slice(0, 4).map(p => p.planName);
    const planCounts = this.plans.slice(0, 4).map((_, i) => Math.max(1, Math.round((d.totalOrganizations / Math.max(this.plans.length, 1)) * (1 - i * 0.15))));
    if (!planLabels.length) {
      planLabels.push('Starter', 'Growth', 'Enterprise', 'Custom');
      planCounts.push(40, 35, 20, 5);
    }
    this.planDistData = {
      labels: planLabels,
      datasets: [{ data: planCounts, backgroundColor: ['#2C5BFF', '#A855F7', '#16A34A', '#F59E0B'], borderWidth: 0 }]
    };
  }

  private initChartOptions(): void {
    const grid = 'rgba(148,163,184,0.2)';
    const text = 'var(--saas-text-muted)';
    this.orgTrendOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: text, usePointStyle: true } } },
      scales: {
        x: { grid: { color: grid }, ticks: { color: text } },
        y: { grid: { color: grid }, ticks: { color: text }, beginAtZero: true }
      }
    };
    this.planDistOptions = {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { color: text, usePointStyle: true } } }
    };
  }
}
