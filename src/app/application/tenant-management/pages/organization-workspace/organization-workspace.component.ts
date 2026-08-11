import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef,
  HostListener, OnInit, inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { OrganizationDetail } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  formatCurrency,
  formatDate,
  healthScore,
  healthTone,
  institutionLabel,
  orgInitials,
  organizationStatusLabel,
  statusTone,
  subscriptionStatusLabel,
  subscriptionTone
} from '../../utils/platform-display.util';

import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { SaasPillComponent } from '../../../../shared/ui/saas';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-organization-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SaasPillComponent],
  templateUrl: './organization-workspace.component.html',
  styleUrl: './organization-workspace.component.scss'
})
export class OrganizationWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(PlatformManagementService);
  private readonly feedback = inject(UiFeedbackService);
  private readonly pageHeader = inject(BreadCrumbService);

  loading = true;
  actionLoading = false;
  errorMessage = '';
  org: OrganizationDetail | null = null;
  orgId = 0;
  activeTab = 'overview';
  actionsMenuOpen = false;

  readonly tabs = [
    { key: 'overview',      label: 'Overview',           icon: 'pi pi-id-card' },
    { key: 'subscription',  label: 'Subscription & Plan', icon: 'pi pi-credit-card' },
    { key: 'features',      label: 'Feature Overrides',   icon: 'pi pi-sliders-h' },
    { key: 'tenant',        label: 'Tenant Details',      icon: 'pi pi-server' },
    { key: 'timeline',      label: 'Timeline',            icon: 'pi pi-history' }
  ];

  // ── util references exposed to template ─────────────────────────
  readonly orgInitials            = orgInitials;
  readonly institutionLabel       = institutionLabel;
  readonly organizationStatusLabel = organizationStatusLabel;
  readonly subscriptionStatusLabel = subscriptionStatusLabel;
  readonly formatDate              = formatDate;
  readonly formatCurrency          = formatCurrency;
  readonly healthScore             = healthScore;
  readonly healthTone              = healthTone;

  // ── lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.orgId = Number(this.route.snapshot.paramMap.get('orgId'));
    this.load(this.orgId);
  }

  // ── click-outside closes the actions menu ────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.ow-actions-wrap')) {
      this.actionsMenuOpen = false;
    }
  }

  // ── data loading ─────────────────────────────────────────────────
  load(orgId: number): void {
    if (!orgId || Number.isNaN(orgId)) {
      this.errorMessage = 'Invalid organization identifier.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.api.getOrganization(orgId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: org => {
        if (!org?.id) {
          this.errorMessage = 'Organization not found. It may have been removed or your access was revoked.';
          this.org = null;
        } else {
          this.org = org;
          this.pageHeader.setPageHeader({ title: org.organizationName || 'Organization Details' });
          this.pageHeader.setPageSubtitle(this.subtitle);
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load this organization. Check your connection and retry.';
        this.org = null;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ── computed getters ─────────────────────────────────────────────
  get subtitle(): string {
    if (!this.org) return 'Loading...';
    return [this.org.organizationCode, institutionLabel(this.org.institutionType), this.locationLabel]
      .filter(Boolean).join(' · ');
  }

  get locationLabel(): string {
    if (!this.org) return '';
    return [this.org.city, this.org.state, this.org.country].filter(Boolean).join(', ');
  }

  get featureOverrides() { return this.org?.subscription?.featureOverrides ?? []; }

  get timelineEvents(): { title: string; detail: string; date?: string; icon: string; color: string }[] {
    if (!this.org) return [];
    const events: { title: string; detail: string; date?: string; icon: string; color: string }[] = [];

    if (this.org.createdOn) events.push({
      title: 'Organization Created', color: 'blue',
      detail: this.org.createdBy ? `Created by ${this.org.createdBy}` : 'Initial provisioning',
      date: this.org.createdOn, icon: 'pi pi-plus-circle'
    });
    if (this.org.tenant?.provisionStatus === 'COMPLETED') events.push({
      title: 'Schema Provisioned', color: 'green',
      detail: `Schema ${this.org.tenant.schemaName ?? '—'} provisioned successfully`,
      date: this.org.tenant.createdOn, icon: 'pi pi-server'
    });
    if (this.org.subscription) events.push({
      title: 'Subscription Activated', color: 'indigo',
      detail: `${this.org.subscription.planName ?? 'Plan'} activated`,
      date: this.org.subscription.startDate, icon: 'pi pi-credit-card'
    });
    if (this.org.updatedOn) events.push({
      title: 'Last Updated', color: 'orange',
      detail: 'Organization profile or configuration changed',
      date: this.org.updatedOn, icon: 'pi pi-pencil'
    });
    if (this.org.tenant?.lastMigrationAt) events.push({
      title: 'Last Migration', color: 'purple',
      detail: `Schema ${this.org.tenant.migrationVersion ?? '—'}`,
      date: this.org.tenant.lastMigrationAt, icon: 'pi pi-sync'
    });
    if (this.org.tenant?.lastBackupAt) events.push({
      title: 'Last Backup', color: 'teal',
      detail: 'Tenant database backup completed',
      date: this.org.tenant.lastBackupAt, icon: 'pi pi-cloud-upload'
    });
    if (this.org.remarks?.trim()) events.push({
      title: 'Remarks', color: 'gray',
      detail: this.org.remarks.trim(), icon: 'pi pi-comment'
    });
    return events;
  }

  // ── display helpers ──────────────────────────────────────────────
  orgColor(name: string): string {
    const palette = ['indigo', 'violet', 'emerald', 'teal', 'amber', 'rose', 'sky', 'orange'];
    return palette[(name?.charCodeAt(0) ?? 0) % palette.length];
  }

  storagePercent(org: OrganizationDetail): number {
    const used = org.tenant?.storageUsedMb ?? 0;
    const limit = (org.configuration?.storageLimitGb ?? 0) * 1024;
    if (!limit) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  daysRemaining(endDate?: string | null): number {
    if (!endDate) return 0;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return Math.max(0, diff);
  }

  healthLabel(score: number): string {
    if (score >= 80) return 'Healthy';
    if (score >= 50) return 'At Risk';
    return 'Critical';
  }

  orgStatusTone(): PillTone { return statusTone(this.org?.status) as PillTone; }
  subStatusTone(): PillTone { return subscriptionTone(this.org?.subscription?.status) as PillTone; }

  canActivate(): boolean {
    const s = this.org?.status;
    return s === 'SUSPENDED' || s === 'INACTIVE' || s === 'PENDING';
  }
  canSuspend(): boolean { return this.org?.status === 'ACTIVE'; }

  billingCycleLabel(cycle?: string | null): string {
    if (!cycle) return '—';
    return cycle.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  formatStorageMb(mb?: number | null): string {
    if (mb == null) return '—';
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  }

  provisionStatusLabel(status?: string | null): string {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  }

  provisionTone(status?: string | null): PillTone {
    switch (status) {
      case 'COMPLETED':   return 'success';
      case 'IN_PROGRESS':
      case 'PENDING':     return 'warning';
      case 'FAILED':      return 'danger';
      case 'MAINTENANCE': return 'info';
      default:            return 'neutral';
    }
  }

  // ── actions ──────────────────────────────────────────────────────
  back(): void { this.router.navigate(['/app/tenant-management/organizations']); }

  activate(): void {
    if (!this.org) return;
    this.runAction(() => this.api.activateOrganization(this.org!.id), 'Activated', 'Organization activated successfully.');
  }
  suspend(): void {
    if (!this.org) return;
    this.runAction(() => this.api.suspendOrganization(this.org!.id), 'Suspended', 'Organization suspended.');
  }
  setMaintenance(): void {
    const id = this.org?.tenant?.id;
    if (!id) { this.toast('warn', 'Unavailable', 'No tenant registry found.'); return; }
    this.runAction(() => this.api.setTenantMaintenance(id), 'Maintenance mode', 'Tenant placed in maintenance mode.');
  }
  resumeTenant(): void {
    const id = this.org?.tenant?.id;
    if (!id) { this.toast('warn', 'Unavailable', 'No tenant registry found.'); return; }
    this.runAction(() => this.api.resumeTenant(id), 'Tenant resumed', 'Tenant resumed from maintenance.');
  }
  triggerBackup(): void {
    const id = this.org?.tenant?.id;
    if (!id) { this.toast('warn', 'Unavailable', 'No tenant registry found.'); return; }
    this.runAction(() => this.api.triggerTenantBackup(id), 'Backup started', 'Tenant backup job triggered.');
  }
  triggerMigration(): void {
    const id = this.org?.tenant?.id;
    if (!id) { this.toast('warn', 'Unavailable', 'No tenant registry found.'); return; }
    this.runAction(() => this.api.triggerTenantMigration(id), 'Migration started', 'Tenant migration job triggered.');
  }

  private runAction<T>(fn: () => Observable<T>, summary: string, detail: string): void {
    this.actionLoading = true;
    this.cdr.markForCheck();
    fn().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.actionLoading = false; this.toast('success', summary, detail); this.load(this.orgId); this.cdr.markForCheck(); },
      error: () => { this.actionLoading = false; this.toast('error', 'Failed', `Could not complete: ${summary.toLowerCase()}.`); this.cdr.markForCheck(); }
    });
  }

  private toast(severity: 'success' | 'error' | 'warn' | 'info', summary: string, detail: string): void {
    this.feedback[severity](summary, detail, { life: 4000 });
  }
}

