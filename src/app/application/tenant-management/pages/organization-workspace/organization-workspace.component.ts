import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef,
  HostListener, OnInit, inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import {
  FeatureOverride, OrganizationDetail, PlatformFeature
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  formatCurrency,
  formatDate,
  institutionLabel,
  organizationStatusLabel,
  statusTone,
  subscriptionStatusLabel,
  subscriptionTone
} from '../../utils/platform-display.util';

import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasTab,
  SaasTabsComponent
} from '../../../../shared/ui/saas';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';

type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

@Component({
  selector: 'app-organization-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, DropdownModule, ConfirmDialogModule, TooltipModule,
    SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent, SaasTabsComponent
  ],
  providers: [ConfirmationService],
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

  private readonly confirm = inject(ConfirmationService);

  loading = true;
  actionLoading = false;
  overrideSaving = false;
  invoiceDownloading = false;
  errorMessage = '';
  org: OrganizationDetail | null = null;
  orgId = 0;
  activeTab = 'overview';
  actionsMenuOpen = false;
  overrideEditorOpen = false;
  readonly tabs: SaasTab[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'billing', label: 'Subscription & Billing' },
    { key: 'tenant', label: 'Tenant & Activity' }
  ];
  features: PlatformFeature[] = [];
  overrideDraft: {
    id?: number;
    featureId: number | null;
    enabled: boolean;
    overrideReason: string;
    remarks: string;
  } = this.emptyOverrideDraft();

  readonly organizationStatusLabel = organizationStatusLabel;
  readonly subscriptionStatusLabel = subscriptionStatusLabel;
  readonly formatDate              = formatDate;
  readonly formatCurrency          = formatCurrency;

  // ── lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.orgId = Number(this.route.snapshot.paramMap.get('orgId'));
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab && this.tabs.some(item => item.key === tab)) {
      this.activeTab = tab;
    }
    this.load(this.orgId);
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.cdr.markForCheck();
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
    forkJoin({
      org: this.api.getOrganization(orgId),
      features: this.api.getFeatures().pipe(catchError(() => of([])))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ org, features }) => {
        if (!org?.id) {
          this.errorMessage = 'Organization not found. It may have been removed or your access was revoked.';
          this.org = null;
        } else {
          this.org = org;
          this.pageHeader.setPageHeader({ title: org.organizationName || 'Organization Details' });
          this.pageHeader.setPageSubtitle(this.subtitle);
        }
        this.features = (features ?? []).filter(f => f.active !== false);
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

  get institutionTypeText(): string {
    return this.org ? institutionLabel(this.org.institutionType) : '—';
  }

  get displayEmail(): string {
    return this.org?.adminEmail?.trim() || this.org?.email?.trim() || '—';
  }

  get displayMobile(): string {
    return this.org?.adminMobile?.trim() || this.org?.mobileNumber?.trim() || '—';
  }

  get entitledFeatures() {
    return this.org?.entitledFeatures ?? [];
  }

  get isTrial(): boolean {
    return this.org?.subscription?.status === 'TRIAL';
  }

  get amountPaid(): number {
    if (!this.org?.subscription || this.isTrial) return 0;
    return this.org.subscription.finalAmount ?? 0;
  }

  get displayDomain(): string {
    const sub = this.org?.domain?.subDomain || this.org?.domain?.subdomain;
    if (sub) return `${sub}.thinkerscave.app`;
    return this.org?.tenant?.tenantDomain?.trim() || '';
  }

  get displayAddress(): string {
    const lines = [this.org?.addressLine1, this.org?.addressLine2].filter(Boolean);
    if (lines.length) return lines.join(', ');
    return this.locationLabel || '—';
  }

  get featureOverrides() { return this.org?.subscription?.featureOverrides ?? []; }

  get planSummary(): string {
    if (!this.org?.subscription) return 'No subscription';
    const plan = this.org.subscription.planName || this.org.subscription.planCode || 'Plan';
    return `${plan} · ${this.billingCycleLabel(this.org.subscription.billingCycle)}`;
  }

  get orgInitials(): string {
    const source = this.org?.shortName || this.org?.organizationName || 'ORG';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }

  get paymentStatusLabel(): string {
    const status = this.org?.subscription?.status;
    if (!status) return '—';
    if (this.isTrial) return 'Unpaid';
    if (status === 'ACTIVE') return 'Paid';
    if (status === 'EXPIRED') return 'Overdue';
    return this.subscriptionStatusLabel(status);
  }

  get recentActivityPreview() {
    return this.timelineEvents.slice(0, 3);
  }

  get overrideFeatureOptions(): { label: string; value: number }[] {
    const taken = new Set(this.featureOverrides
      .filter(item => item.id !== this.overrideDraft.id)
      .map(item => item.featureId));
    return this.features
      .filter(feature => !taken.has(feature.id))
      .map(feature => ({
        label: `${feature.displayName || feature.featureName} (${feature.featureCode})`,
        value: feature.id
      }));
  }

  openAddOverride(): void {
    if (!this.org?.subscription?.id) {
      this.toast('warn', 'Unavailable', 'Assign a subscription before adding feature overrides.');
      return;
    }
    this.onTabChange('billing');
    this.overrideDraft = this.emptyOverrideDraft();
    this.overrideEditorOpen = true;
  }

  openEditOverride(override: FeatureOverride): void {
    this.overrideDraft = {
      id: override.id,
      featureId: override.featureId,
      enabled: override.enabled !== false,
      overrideReason: override.overrideReason ?? '',
      remarks: override.remarks ?? ''
    };
    this.overrideEditorOpen = true;
  }

  closeOverrideEditor(): void {
    this.overrideEditorOpen = false;
  }

  saveOverride(): void {
    const subscriptionId = this.org?.subscription?.id;
    if (!subscriptionId || !this.overrideDraft.featureId) {
      this.toast('warn', 'Missing fields', 'Choose a feature to grant or revoke.');
      return;
    }
    this.overrideSaving = true;
    const payload = {
      organizationSubscriptionId: subscriptionId,
      featureId: this.overrideDraft.featureId,
      enabled: this.overrideDraft.enabled,
      overrideReason: this.overrideDraft.overrideReason.trim() || undefined,
      remarks: this.overrideDraft.remarks.trim() || undefined
    };
    const request$ = this.overrideDraft.id
      ? this.api.updateFeatureOverride(this.overrideDraft.id, payload)
      : this.api.createFeatureOverride(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.overrideSaving = false;
        this.overrideEditorOpen = false;
        this.toast('success', 'Override saved', 'The organization is now entitled at feature level. Menus will follow for this tenant.');
        this.load(this.orgId);
      },
      error: () => {
        this.overrideSaving = false;
        this.toast('error', 'Failed', 'Could not save the feature override.');
        this.cdr.markForCheck();
      }
    });
  }

  confirmRemoveOverride(override: FeatureOverride): void {
    this.confirm.confirm({
      header: 'Remove override?',
      message: `Remove the extra feature "${override.featureName || override.featureCode}" from this organization?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.deleteFeatureOverride(override.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toast('success', 'Override removed', 'The organization now follows the subscription plan for this feature.');
          this.load(this.orgId);
        },
        error: () => this.toast('error', 'Failed', 'Could not remove this override.')
      })
    });
  }

  private emptyOverrideDraft() {
    return {
      featureId: null as number | null,
      enabled: true,
      overrideReason: '',
      remarks: ''
    };
  }

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
    return events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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

  back(): void { this.router.navigate(['/app/tenant-management/organizations']); }

  viewCustomer(): void {
    if (!this.org?.customerId) {
      this.toast('warn', 'Unavailable', 'No customer is linked to this organization.');
      return;
    }
    void this.router.navigate(['/app/tenant-management/customers', this.org.customerId]);
  }

  openEdit(): void {
    if (!this.orgId) return;
    void this.router.navigate(['/app/tenant-management/organizations/create'], {
      queryParams: { orgId: this.orgId }
    });
  }

  activate(): void {
    if (!this.org) return;
    this.runAction(() => this.api.activateOrganization(this.org!.id), 'Activated', 'Organization activated successfully.');
  }
  suspend(): void {
    if (!this.org) return;
    this.confirm.confirm({
      header: 'Suspend organization?',
      message: `Suspend ${this.org.organizationName}? Users of this tenant will not be able to sign in until it is activated again.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.runAction(() => this.api.suspendOrganization(this.org!.id), 'Suspended', 'Organization suspended.')
    });
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

  downloadInvoicePdf(): void {
    if (!this.orgId || !this.org?.subscription) {
      this.toast('warn', 'Unavailable', 'No subscription invoice is available yet.');
      return;
    }
    this.invoiceDownloading = true;
    this.cdr.markForCheck();
    this.api.downloadOrganizationInvoicePdf(this.orgId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          this.invoiceDownloading = false;
          const name = `${this.org?.subscription?.invoiceNumber || `onboarding-invoice-${this.orgId}`}.pdf`;
          this.saveBlob(blob, name);
          this.cdr.markForCheck();
        },
        error: () => {
          this.invoiceDownloading = false;
          this.toast('error', 'Download failed', 'Could not generate the invoice PDF.');
          this.cdr.markForCheck();
        }
      });
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

