import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, OnInit, inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import {
  BillingCycle, Customer, InstitutionType, PlatformFeature,
  Promotion, ProvisionOrganizationPayload, ProvisioningResult, SubscriptionPlan
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatCurrency, institutionLabel } from '../../utils/platform-display.util';
import { SaasPillComponent } from '../../../../shared/ui/saas';

type CustomerMode = 'existing' | 'new';

interface WizardForm {
  // ── Customer ──────────────────────
  customerMode: CustomerMode;
  existingCustomerId: number | null;
  customerLegalName: string;
  customerDisplayName: string;
  customerEmail: string;
  customerMobile: string;
  // ── Organization ──────────────────
  organizationName: string;
  shortName: string;
  institutionType: InstitutionType;
  boardName: string;
  academicSession: string;
  website: string;
  tenantSubdomain: string;
  timeZone: string;
  currency: string;
  language: string;
  // ── Profile ───────────────────────
  orgEmail: string;
  orgMobile: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  logoUrl: string;
  // ── Admin User ────────────────────
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminMobile: string;
  adminUsername: string;
  adminDesignation: string;
  adminAutoPassword: boolean;
  adminSendWelcomeEmail: boolean;
  adminForcePasswordChange: boolean;
  // ── Subscription ──────────────────
  subscriptionPlanId: number | null;
  billingCycle: BillingCycle;
  trialEnabled: boolean;
  trialDays: number;
  // ── Commercials ───────────────────
  promotionId: number | null;
  studentLimitOverride: number | null;
  staffLimitOverride: number | null;
  branchLimitOverride: number | null;
  storageLimitOverride: number | null;
  remarks: string;
}

@Component({
  selector: 'app-provision-organization',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPillComponent],
  templateUrl: './provision-organization.component.html',
  styleUrl: './provision-organization.component.scss'
})
export class ProvisionOrganizationComponent implements OnInit {
  private readonly api  = inject(PlatformManagementService);
  private readonly cdr  = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  loading    = true;
  submitting = false;
  step       = 0;
  stepError  = '';
  errorMessage = '';
  successResult: ProvisioningResult | null = null;

  // ── Reference data ──────────────────────────────────────────────
  customers:  Customer[]        = [];
  plans:      SubscriptionPlan[] = [];
  features:   PlatformFeature[]  = [];
  promotions: Promotion[]        = [];
  featureEnabled = new Map<number, boolean>();

  // ── UI state ────────────────────────────────────────────────────
  customerSearch = '';
  featureSearch  = '';

  // ── Util references ─────────────────────────────────────────────
  readonly institutionLabel = institutionLabel;
  readonly formatCurrency   = formatCurrency;

  // ── Static config ────────────────────────────────────────────────
  readonly wizardSteps = [
    { key: 'customer',      label: 'Customer',          icon: 'pi pi-users',       desc: 'Link to an existing platform customer or create a new one.' },
    { key: 'organization',  label: 'Organization',      icon: 'pi pi-building',    desc: 'Core identity and regional settings for the new institution.' },
    { key: 'profile',       label: 'Profile',           icon: 'pi pi-id-card',     desc: 'Contact details and address for the organization.' },
    { key: 'admin',         label: 'Admin User',        icon: 'pi pi-user',        desc: 'The first administrator who will access the tenant workspace.' },
    { key: 'subscription',  label: 'Subscription',      icon: 'pi pi-credit-card', desc: 'Choose a plan, billing cycle, and trial settings.' },
    { key: 'features',      label: 'Features',          icon: 'pi pi-sliders-h',   desc: 'Override plan defaults by enabling or disabling features.' },
    { key: 'commercials',   label: 'Commercials',       icon: 'pi pi-percentage',  desc: 'Apply promotions and optional limit overrides.' },
    { key: 'review',        label: 'Review',            icon: 'pi pi-check-circle', desc: 'Verify all details before provisioning.' }
  ];

  readonly institutionTypeCards = [
    { value: 'SCHOOL'            as InstitutionType, label: 'School',   icon: 'pi pi-home' },
    { value: 'COLLEGE'           as InstitutionType, label: 'College',  icon: 'pi pi-building' },
    { value: 'UNIVERSITY'        as InstitutionType, label: 'University', icon: 'pi pi-th-large' },
    { value: 'TRAINING_INSTITUTE' as InstitutionType, label: 'Training', icon: 'pi pi-briefcase' },
    { value: 'COACHING'          as InstitutionType, label: 'Coaching', icon: 'pi pi-book' },
    { value: 'OTHER'             as InstitutionType, label: 'Other',    icon: 'pi pi-ellipsis-h' },
  ];

  readonly billingCycles: { id: BillingCycle; label: string; months: number }[] = [
    { id: 'MONTHLY',    label: 'Monthly',    months: 1  },
    { id: 'QUARTERLY',  label: 'Quarterly',  months: 3  },
    { id: 'HALF_YEARLY', label: 'Half-yearly', months: 6 },
    { id: 'YEARLY',     label: 'Yearly',     months: 12 }
  ];

  readonly timeZones  = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'UTC'];
  readonly currencies = ['INR', 'USD', 'GBP', 'AED', 'SGD', 'AUD'];
  readonly languages  = ['en', 'hi', 'ar', 'fr', 'es'];
  readonly countries  = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Other'];
  readonly academicSessions = ['2023-24', '2024-25', '2025-26', '2026-27'];

  form: WizardForm = this.emptyForm();

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadReferenceData();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const customerId = Number(params.get('customerId'));
      if (customerId && !Number.isNaN(customerId)) {
        this.form.customerMode = 'existing';
        this.form.existingCustomerId = customerId;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Computed getters ─────────────────────────────────────────────
  get selectedPlan():      SubscriptionPlan | undefined { return this.plans.find(p => p.id === this.form.subscriptionPlanId); }
  get selectedCustomer():  Customer | undefined         { return this.customers.find(c => c.id === (this.form.existingCustomerId ?? undefined)); }
  get selectedPromotion(): Promotion | undefined        { return this.promotions.find(p => p.id === (this.form.promotionId ?? undefined)); }

  get filteredCustomers(): Customer[] {
    const s = this.customerSearch.toLowerCase().trim();
    if (!s) return this.customers;
    return this.customers.filter(c =>
      c.displayName.toLowerCase().includes(s) ||
      (c.customerCode?.toLowerCase().includes(s)) ||
      (c.email?.toLowerCase().includes(s)) ||
      (c.city?.toLowerCase().includes(s))
    );
  }

  get featuresByModule(): { module: string; features: PlatformFeature[]; enabledCount: number }[] {
    const s = this.featureSearch.toLowerCase().trim();
    const feats = s
      ? this.features.filter(f => (f.displayName || f.featureName).toLowerCase().includes(s) || f.featureCode.toLowerCase().includes(s))
      : this.features;
    const groups = new Map<string, PlatformFeature[]>();
    for (const f of feats) {
      const key = f.module || f.category || 'General';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    return Array.from(groups.entries()).map(([module, features]) => ({
      module,
      features,
      enabledCount: features.filter(f => this.isFeatureEnabled(f.id)).length
    }));
  }

  get computedPlanPrice(): number {
    const plan = this.selectedPlan;
    if (!plan) return 0;
    switch (this.form.billingCycle) {
      case 'MONTHLY':     return plan.monthlyPrice    ?? 0;
      case 'QUARTERLY':   return plan.quarterlyPrice  ?? 0;
      case 'HALF_YEARLY': return plan.halfYearlyPrice ?? 0;
      case 'YEARLY':      return plan.yearlyPrice     ?? 0;
      default: return 0;
    }
  }

  get computedDiscount(): number {
    const promo = this.selectedPromotion;
    if (!promo?.discountValue) return 0;
    const price = this.computedPlanPrice;
    if (promo.discountType === 'PERCENTAGE') {
      const disc = price * promo.discountValue / 100;
      return promo.maximumDiscount ? Math.min(disc, promo.maximumDiscount) : disc;
    }
    return promo.discountValue;
  }

  get computedFinal(): number { return Math.max(0, this.computedPlanPrice - this.computedDiscount); }
  get computedSavings(): number { return this.computedDiscount; }

  get selectedFeaturesCount(): number {
    let n = 0;
    for (const f of this.features) if (this.isFeatureEnabled(f.id)) n++;
    return n;
  }

  get subdomainPreview(): string {
    return this.form.tenantSubdomain ? `${this.form.tenantSubdomain.toLowerCase()}.thinkerscave.app` : '';
  }

  get autoUsername(): string {
    return (this.form.adminEmail || '').split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
  }

  // ── Data loading ─────────────────────────────────────────────────
  loadReferenceData(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      customers:  this.api.getCustomers({ size: 200, status: 'ACTIVE' }),
      plans:      this.api.getSubscriptionPlans(),
      features:   this.api.getFeatures(),
      promotions: this.api.getPromotions()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.loading = false; this.cdr.markForCheck(); })
    ).subscribe({
      next: ({ customers, plans, features, promotions }) => {
        this.customers  = customers.content ?? [];
        this.plans      = (plans ?? []).filter(p => p.active !== false && p.visible !== false);
        this.features   = (features ?? []).filter(f => f.active !== false);
        this.promotions = (promotions ?? []).filter(p => p.active !== false && p.status === 'ACTIVE');
        if (!this.form.subscriptionPlanId && this.plans.length) {
          const rec = this.plans.find(p => p.recommended) ?? this.plans[0];
          this.selectPlan(rec.id);
        } else {
          this.syncFeatureStates();
        }
      },
      error: () => {
        this.errorMessage = 'Unable to load provisioning reference data.';
      }
    });
  }

  // ── Customer ─────────────────────────────────────────────────────
  setCustomerMode(mode: CustomerMode): void {
    this.form.customerMode = mode;
    this.stepError = '';
    this.cdr.markForCheck();
  }

  selectCustomer(c: Customer): void {
    this.form.existingCustomerId = c.id;
    this.onCustomerSelected();
  }

  onCustomerSelected(): void {
    const c = this.selectedCustomer;
    if (!c) return;
    this.form.customerLegalName   = c.legalName;
    this.form.customerDisplayName = c.displayName;
    this.form.customerEmail       = c.email ?? '';
    this.form.customerMobile      = c.mobileNumber ?? '';
    this.cdr.markForCheck();
  }

  // ── Subscription ─────────────────────────────────────────────────
  selectPlan(planId: number): void {
    this.form.subscriptionPlanId = planId;
    this.syncFeatureStates();
    this.cdr.markForCheck();
  }

  planPrice(plan: SubscriptionPlan): number {
    switch (this.form.billingCycle) {
      case 'MONTHLY':     return plan.monthlyPrice    ?? 0;
      case 'QUARTERLY':   return plan.quarterlyPrice  ?? 0;
      case 'HALF_YEARLY': return plan.halfYearlyPrice ?? 0;
      case 'YEARLY':      return plan.yearlyPrice     ?? 0;
      default: return 0;
    }
  }

  // ── Features ─────────────────────────────────────────────────────
  isFeatureEnabled(featureId: number): boolean { return this.featureEnabled.get(featureId) ?? false; }

  toggleFeature(featureId: number): void {
    this.featureEnabled.set(featureId, !this.isFeatureEnabled(featureId));
    this.cdr.markForCheck();
  }

  featureIncludedInPlan(featureId: number): boolean {
    return !!this.selectedPlan?.features?.some(f => f.featureId === featureId && f.included);
  }

  toggleAllInModule(module: string, enable: boolean): void {
    const group = this.featuresByModule.find(g => g.module === module);
    if (!group) return;
    for (const f of group.features) this.featureEnabled.set(f.id, enable);
    this.cdr.markForCheck();
  }

  // ── Navigation ───────────────────────────────────────────────────
  goToStep(index: number): void {
    if (index < this.step) { this.step = index; this.stepError = ''; this.cdr.markForCheck(); }
  }

  prev(): void {
    if (this.step > 0) { this.step--; this.stepError = ''; this.cdr.markForCheck(); }
  }

  next(): void {
    if (!this.validateStep(this.step)) return;
    if (this.step < this.wizardSteps.length - 1) { this.step++; this.stepError = ''; this.cdr.markForCheck(); }
  }

  cancel(): void { this.router.navigate(['/app/tenant-management/organizations']); }
  goToWorkspace(): void {
    const id = this.successResult?.organizationId;
    id ? this.router.navigate(['/app/tenant-management/organizations', id]) : this.cancel();
  }
  goToList(): void { this.router.navigate(['/app/tenant-management/organizations']); }

  provisionAnother(): void {
    this.successResult = null;
    this.step = 0;
    this.form = this.emptyForm();
    this.errorMessage = '';
    this.stepError = '';
    if (this.plans.length) { const r = this.plans.find(p => p.recommended) ?? this.plans[0]; this.selectPlan(r.id); }
    this.cdr.markForCheck();
  }

  // ── Provision ────────────────────────────────────────────────────
  provision(): void {
    if (!this.validateStep(this.step) || this.submitting) return;
    this.submitting = true;
    this.errorMessage = '';
    this.api.provisionOrganization(this.buildPayload())
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => { this.submitting = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: result => { this.successResult = result; this.stepError = ''; },
        error: err   => { this.errorMessage = err?.error?.message ?? 'Provisioning failed. Verify inputs and retry.'; }
      });
  }

  // ── Clipboard ────────────────────────────────────────────────────
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  // ── Misc helpers ─────────────────────────────────────────────────
  trackById(_: number, item: { id: number }): number { return item.id; }

  /** Strips characters that are not lowercase letters, digits, or hyphens. */
  normalizeSubdomain(value: string): void {
    this.form.tenantSubdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.cdr.markForCheck();
  }

  customerStatusTone(status?: string): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'ACTIVE':   return 'success';
      case 'TRIAL':    return 'warning';
      case 'SUSPENDED':return 'danger';
      default:         return 'neutral';
    }
  }

  // ── Private helpers ──────────────────────────────────────────────
  private emptyForm(): WizardForm {
    return {
      customerMode: 'existing', existingCustomerId: null,
      customerLegalName: '', customerDisplayName: '', customerEmail: '', customerMobile: '',
      organizationName: '', shortName: '', institutionType: 'COLLEGE', boardName: '',
      academicSession: '2025-26', website: '', tenantSubdomain: '',
      timeZone: 'Asia/Kolkata', currency: 'INR', language: 'en',
      orgEmail: '', orgMobile: '', addressLine1: '', addressLine2: '',
      city: '', state: '', country: 'India', postalCode: '', logoUrl: '',
      adminFirstName: '', adminLastName: '', adminEmail: '', adminMobile: '',
      adminUsername: '', adminDesignation: '', adminAutoPassword: true,
      adminSendWelcomeEmail: true, adminForcePasswordChange: true,
      subscriptionPlanId: null, billingCycle: 'YEARLY', trialEnabled: true, trialDays: 30,
      promotionId: null, studentLimitOverride: null, staffLimitOverride: null,
      branchLimitOverride: null, storageLimitOverride: null, remarks: ''
    };
  }

  private syncFeatureStates(): void {
    const plan = this.selectedPlan;
    this.featureEnabled.clear();
    for (const f of this.features) {
      const pf = plan?.features?.find(x => x.featureId === f.id);
      this.featureEnabled.set(f.id, pf ? pf.included : (f.defaultEnabled ?? false));
    }
  }

  private planDefaultEnabled(featureId: number): boolean {
    const pf = this.selectedPlan?.features?.find(f => f.featureId === featureId);
    return pf ? pf.included : (this.features.find(f => f.id === featureId)?.defaultEnabled ?? false);
  }

  private buildPayload(): ProvisionOrganizationPayload {
    const f = this.form;
    const enabledFeatureIds:  number[] = [];
    const disabledFeatureIds: number[] = [];
    for (const feat of this.features) {
      const curr = this.isFeatureEnabled(feat.id);
      const base = this.planDefaultEnabled(feat.id);
      if (curr && !base) enabledFeatureIds.push(feat.id);
      if (!curr && base)  disabledFeatureIds.push(feat.id);
    }

    const payload: ProvisionOrganizationPayload = {
      organizationName: f.organizationName.trim(),
      shortName:        f.shortName.trim() || undefined,
      institutionType:  f.institutionType,
      boardName:        f.boardName.trim() || undefined,
      timeZone:         f.timeZone, currency: f.currency, language: f.language,
      orgEmail:         f.orgEmail.trim()    || undefined,
      orgMobile:        f.orgMobile.trim()   || undefined,
      addressLine1:     f.addressLine1.trim() || undefined,
      city:             f.city.trim()        || undefined,
      state:            f.state.trim()       || undefined,
      country:          f.country            || undefined,
      logoUrl:          f.logoUrl.trim()     || undefined,
      adminFirstName:   f.adminFirstName.trim(),
      adminLastName:    f.adminLastName.trim(),
      adminEmail:       f.adminEmail.trim(),
      adminMobile:      f.adminMobile.trim(),
      subscriptionPlanId: f.subscriptionPlanId!,
      billingCycle:     f.billingCycle,
      trialEnabled:     f.trialEnabled,
      enabledFeatureIds:  enabledFeatureIds.length  ? enabledFeatureIds  : undefined,
      disabledFeatureIds: disabledFeatureIds.length ? disabledFeatureIds : undefined,
      promotionId:         f.promotionId         ?? undefined,
      studentLimitOverride: f.studentLimitOverride ?? undefined,
      staffLimitOverride:   f.staffLimitOverride   ?? undefined,
      branchLimitOverride:  f.branchLimitOverride  ?? undefined,
      storageLimitOverride: f.storageLimitOverride ?? undefined,
      remarks: f.remarks.trim() || undefined
    };

    if (f.customerMode === 'existing' && f.existingCustomerId) {
      payload.existingCustomerId = f.existingCustomerId;
    } else {
      payload.customerLegalName   = f.customerLegalName.trim();
      payload.customerDisplayName = f.customerDisplayName.trim();
      payload.customerEmail       = f.customerEmail.trim()  || undefined;
      payload.customerMobile      = f.customerMobile.trim() || undefined;
    }

    return payload;
  }

  private validateStep(index: number): boolean {
    const f = this.form;
    const fail = (msg: string) => { this.stepError = msg; this.cdr.markForCheck(); return false; };

    switch (index) {
      case 0:
        if (f.customerMode === 'existing') {
          if (!f.existingCustomerId) return fail('Select an existing customer or switch to create a new one.');
        } else if (!f.customerLegalName.trim() || !f.customerDisplayName.trim()) {
          return fail('Legal name and display name are required for a new customer.');
        }
        break;
      case 1:
        if (!f.organizationName.trim()) return fail('Organization name is required.');
        if (!f.institutionType)         return fail('Select an institution type.');
        break;
      case 2:
        if (!f.orgEmail.includes('@'))        return fail('A valid institution email is required.');
        if (!f.orgMobile.trim())              return fail('Institution mobile number is required.');
        if (!f.addressLine1.trim() || !f.city.trim() || !f.country)
          return fail('Address, city, and country are required.');
        break;
      case 3:
        if (!f.adminFirstName.trim() || !f.adminLastName.trim()) return fail('Admin first and last name are required.');
        if (!f.adminEmail.includes('@'))   return fail('A valid admin email is required.');
        if (!f.adminMobile.trim())         return fail('Admin mobile number is required.');
        break;
      case 4:
        if (!f.subscriptionPlanId) return fail('Select a subscription plan.');
        if (!f.billingCycle)       return fail('Select a billing cycle.');
        break;
      default: break;
    }
    this.stepError = '';
    this.cdr.markForCheck();
    return true;
  }
}
