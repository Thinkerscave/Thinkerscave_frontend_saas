import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import {
  BillingCycle,
  Customer,
  InstitutionType,
  PlatformFeature,
  Promotion,
  ProvisionOrganizationPayload,
  ProvisioningResult,
  SubscriptionPlan
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  formatCurrency,
  institutionLabel
} from '../../utils/platform-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent,
  SaasStep,
  SaasStepperComponent
} from '../../../../shared/ui/saas';

type CustomerMode = 'existing' | 'new';

interface WizardForm {
  customerMode: CustomerMode;
  existingCustomerId: number | null;
  customerLegalName: string;
  customerDisplayName: string;
  customerEmail: string;
  customerMobile: string;
  organizationName: string;
  shortName: string;
  institutionType: InstitutionType;
  boardName: string;
  timeZone: string;
  currency: string;
  language: string;
  orgEmail: string;
  orgMobile: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  logoUrl: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminMobile: string;
  subscriptionPlanId: number | null;
  billingCycle: BillingCycle;
  trialEnabled: boolean;
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
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasStepperComponent,
    SaasPillComponent,
    SaasStatGridComponent
  ],
  templateUrl: './provision-organization.component.html',
  styleUrl: './provision-organization.component.scss'
})
export class ProvisionOrganizationComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = true;
  submitting = false;
  step = 0;
  stepError = '';
  errorMessage = '';
  successResult: ProvisioningResult | null = null;

  customers: Customer[] = [];
  plans: SubscriptionPlan[] = [];
  features: PlatformFeature[] = [];
  promotions: Promotion[] = [];
  featureEnabled = new Map<number, boolean>();

  readonly institutionLabel = institutionLabel;
  readonly formatCurrency = formatCurrency;

  readonly wizardSteps: SaasStep[] = [
    { key: 'customer', label: 'Customer' },
    { key: 'organization', label: 'Organization' },
    { key: 'profile', label: 'Profile' },
    { key: 'admin', label: 'Admin User' },
    { key: 'subscription', label: 'Subscription' },
    { key: 'features', label: 'Features' },
    { key: 'commercials', label: 'Commercials' },
    { key: 'review', label: 'Review' }
  ];

  readonly institutionTypes: InstitutionType[] = [
    'PRE_SCHOOL', 'PRIMARY_SCHOOL', 'HIGH_SCHOOL', 'HIGHER_SECONDARY', 'SCHOOL',
    'COLLEGE', 'UNIVERSITY', 'COACHING', 'TRAINING_INSTITUTE', 'OTHER'
  ];

  readonly billingCycles: { id: BillingCycle; label: string }[] = [
    { id: 'MONTHLY', label: 'Monthly' },
    { id: 'QUARTERLY', label: 'Quarterly' },
    { id: 'HALF_YEARLY', label: 'Half-yearly' },
    { id: 'YEARLY', label: 'Yearly' }
  ];

  readonly timeZones = [
    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'UTC'
  ];

  readonly currencies = ['INR', 'USD', 'GBP', 'AED', 'SGD', 'AUD'];
  readonly languages = ['en', 'hi', 'ar', 'fr', 'es'];
  readonly countries = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Other'];

  form: WizardForm = this.emptyForm();

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

  get selectedPlan(): SubscriptionPlan | undefined {
    return this.plans.find(p => p.id === this.form.subscriptionPlanId);
  }

  get selectedCustomer(): Customer | undefined {
    return this.customers.find(c => c.id === (this.form.existingCustomerId ?? undefined));
  }

  get selectedPromotion(): Promotion | undefined {
    return this.promotions.find(p => p.id === (this.form.promotionId ?? undefined));
  }

  get successStats(): SaasStat[] {
    const r = this.successResult;
    if (!r) return [];
    return [
      { key: 'admin', label: 'Admin Email', value: r.adminEmail ?? '—', icon: 'pi pi-envelope', tone: 'primary' },
      { key: 'tenant', label: 'Tenant Identifier', value: r.tenantIdentifier ?? '—', icon: 'pi pi-key', tone: 'info' },
      { key: 'domain', label: 'Default Domain', value: r.defaultDomain ?? '—', icon: 'pi pi-globe', tone: 'success' }
    ];
  }

  loadReferenceData(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      customers: this.api.getCustomers({ size: 200, status: 'ACTIVE' }),
      plans: this.api.getSubscriptionPlans(),
      features: this.api.getFeatures(),
      promotions: this.api.getPromotions()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ customers, plans, features, promotions }) => {
          this.customers = customers.content ?? [];
          this.plans = (plans ?? []).filter(p => p.active !== false && p.visible !== false);
          this.features = (features ?? []).filter(f => f.active !== false);
          this.promotions = (promotions ?? []).filter(p => p.active !== false && p.status === 'ACTIVE');
          if (!this.form.subscriptionPlanId && this.plans.length) {
            const recommended = this.plans.find(p => p.recommended) ?? this.plans[0];
            this.selectPlan(recommended.id);
          } else {
            this.syncFeatureStates();
          }
        },
        error: () => {
          this.errorMessage = 'Unable to load provisioning reference data. Verify platform APIs and Super Admin access.';
        }
      });
  }

  setCustomerMode(mode: CustomerMode): void {
    this.form.customerMode = mode;
    this.stepError = '';
    this.cdr.markForCheck();
  }

  onCustomerSelected(): void {
    const customer = this.selectedCustomer;
    if (!customer) return;
    this.form.customerLegalName = customer.legalName;
    this.form.customerDisplayName = customer.displayName;
    this.form.customerEmail = customer.email ?? '';
    this.form.customerMobile = customer.mobileNumber ?? '';
    this.cdr.markForCheck();
  }

  selectPlan(planId: number): void {
    this.form.subscriptionPlanId = planId;
    this.syncFeatureStates();
    this.cdr.markForCheck();
  }

  planPrice(plan: SubscriptionPlan): string {
    const cycle = this.form.billingCycle;
    const amount =
      cycle === 'MONTHLY' ? plan.monthlyPrice
        : cycle === 'QUARTERLY' ? plan.quarterlyPrice
          : cycle === 'HALF_YEARLY' ? plan.halfYearlyPrice
            : plan.yearlyPrice;
    return formatCurrency(amount, this.form.currency);
  }

  isFeatureEnabled(featureId: number): boolean {
    return this.featureEnabled.get(featureId) ?? false;
  }

  toggleFeature(featureId: number): void {
    const current = this.isFeatureEnabled(featureId);
    this.featureEnabled.set(featureId, !current);
    this.cdr.markForCheck();
  }

  featureIncludedInPlan(featureId: number): boolean {
    return !!this.selectedPlan?.features?.some(f => f.featureId === featureId && f.included);
  }

  prev(): void {
    if (this.step > 0) {
      this.step -= 1;
      this.stepError = '';
      this.cdr.markForCheck();
    }
  }

  next(): void {
    if (!this.validateStep(this.step)) return;
    if (this.step < this.wizardSteps.length - 1) {
      this.step += 1;
      this.stepError = '';
      this.cdr.markForCheck();
    }
  }

  provision(): void {
    if (!this.validateStep(this.step) || this.submitting) return;
    this.submitting = true;
    this.errorMessage = '';
    const payload = this.buildPayload();

    this.api.provisionOrganization(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: result => {
          this.successResult = result;
          this.stepError = '';
        },
        error: err => {
          this.errorMessage = err?.error?.message ?? 'Provisioning failed. Verify inputs and retry.';
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/app/tenant-management/organizations']);
  }

  goToWorkspace(): void {
    const id = this.successResult?.organizationId;
    if (id) {
      this.router.navigate(['/app/tenant-management/organizations', id]);
      return;
    }
    this.cancel();
  }

  goToList(): void {
    this.router.navigate(['/app/tenant-management/organizations']);
  }

  provisionAnother(): void {
    this.successResult = null;
    this.step = 0;
    this.form = this.emptyForm();
    this.errorMessage = '';
    this.stepError = '';
    if (this.plans.length) {
      const recommended = this.plans.find(p => p.recommended) ?? this.plans[0];
      this.selectPlan(recommended.id);
    }
    this.cdr.markForCheck();
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }

  private emptyForm(): WizardForm {
    return {
      customerMode: 'existing',
      existingCustomerId: null,
      customerLegalName: '',
      customerDisplayName: '',
      customerEmail: '',
      customerMobile: '',
      organizationName: '',
      shortName: '',
      institutionType: 'COLLEGE',
      boardName: '',
      timeZone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en',
      orgEmail: '',
      orgMobile: '',
      addressLine1: '',
      city: '',
      state: '',
      country: 'India',
      logoUrl: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminMobile: '',
      subscriptionPlanId: null,
      billingCycle: 'YEARLY',
      trialEnabled: true,
      promotionId: null,
      studentLimitOverride: null,
      staffLimitOverride: null,
      branchLimitOverride: null,
      storageLimitOverride: null,
      remarks: ''
    };
  }

  private syncFeatureStates(): void {
    const plan = this.selectedPlan;
    this.featureEnabled.clear();
    for (const feature of this.features) {
      const planFeature = plan?.features?.find(f => f.featureId === feature.id);
      const enabled = planFeature ? planFeature.included : (feature.defaultEnabled ?? false);
      this.featureEnabled.set(feature.id, enabled);
    }
  }

  private planDefaultEnabled(featureId: number): boolean {
    const planFeature = this.selectedPlan?.features?.find(f => f.featureId === featureId);
    if (planFeature) return planFeature.included;
    const feature = this.features.find(f => f.id === featureId);
    return feature?.defaultEnabled ?? false;
  }

  private buildPayload(): ProvisionOrganizationPayload {
    const f = this.form;
    const enabledFeatureIds: number[] = [];
    const disabledFeatureIds: number[] = [];

    for (const feature of this.features) {
      const current = this.isFeatureEnabled(feature.id);
      const baseline = this.planDefaultEnabled(feature.id);
      if (current && !baseline) enabledFeatureIds.push(feature.id);
      if (!current && baseline) disabledFeatureIds.push(feature.id);
    }

    const payload: ProvisionOrganizationPayload = {
      organizationName: f.organizationName.trim(),
      shortName: f.shortName.trim() || undefined,
      institutionType: f.institutionType,
      boardName: f.boardName.trim() || undefined,
      timeZone: f.timeZone,
      currency: f.currency,
      language: f.language,
      orgEmail: f.orgEmail.trim() || undefined,
      orgMobile: f.orgMobile.trim() || undefined,
      addressLine1: f.addressLine1.trim() || undefined,
      city: f.city.trim() || undefined,
      state: f.state.trim() || undefined,
      country: f.country || undefined,
      logoUrl: f.logoUrl.trim() || undefined,
      adminFirstName: f.adminFirstName.trim(),
      adminLastName: f.adminLastName.trim(),
      adminEmail: f.adminEmail.trim(),
      adminMobile: f.adminMobile.trim(),
      subscriptionPlanId: f.subscriptionPlanId!,
      billingCycle: f.billingCycle,
      trialEnabled: f.trialEnabled,
      enabledFeatureIds: enabledFeatureIds.length ? enabledFeatureIds : undefined,
      disabledFeatureIds: disabledFeatureIds.length ? disabledFeatureIds : undefined,
      promotionId: f.promotionId ?? undefined,
      studentLimitOverride: f.studentLimitOverride ?? undefined,
      staffLimitOverride: f.staffLimitOverride ?? undefined,
      branchLimitOverride: f.branchLimitOverride ?? undefined,
      storageLimitOverride: f.storageLimitOverride ?? undefined,
      remarks: f.remarks.trim() || undefined
    };

    if (f.customerMode === 'existing' && f.existingCustomerId) {
      payload.existingCustomerId = f.existingCustomerId;
    } else {
      payload.customerLegalName = f.customerLegalName.trim();
      payload.customerDisplayName = f.customerDisplayName.trim();
      payload.customerEmail = f.customerEmail.trim() || undefined;
      payload.customerMobile = f.customerMobile.trim() || undefined;
    }

    return payload;
  }

  private validateStep(index: number): boolean {
    const f = this.form;
    switch (index) {
      case 0:
        if (f.customerMode === 'existing') {
          if (!f.existingCustomerId) {
            this.stepError = 'Select an existing customer or switch to create a new one.';
            this.cdr.markForCheck();
            return false;
          }
        } else if (!f.customerLegalName.trim() || !f.customerDisplayName.trim()) {
          this.stepError = 'Legal name and display name are required for a new customer.';
          this.cdr.markForCheck();
          return false;
        }
        break;
      case 1:
        if (!f.organizationName.trim()) {
          this.stepError = 'Organization name is required.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.institutionType) {
          this.stepError = 'Select an institution type.';
          this.cdr.markForCheck();
          return false;
        }
        break;
      case 2:
        if (!f.orgEmail.includes('@')) {
          this.stepError = 'A valid institution email is required.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.orgMobile.trim()) {
          this.stepError = 'Institution mobile number is required.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.addressLine1.trim() || !f.city.trim() || !f.country) {
          this.stepError = 'Address, city, and country are required.';
          this.cdr.markForCheck();
          return false;
        }
        break;
      case 3:
        if (!f.adminFirstName.trim() || !f.adminLastName.trim()) {
          this.stepError = 'Admin first and last name are required.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.adminEmail.includes('@')) {
          this.stepError = 'A valid admin email is required.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.adminMobile.trim()) {
          this.stepError = 'Admin mobile number is required.';
          this.cdr.markForCheck();
          return false;
        }
        break;
      case 4:
        if (!f.subscriptionPlanId) {
          this.stepError = 'Select a subscription plan.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.billingCycle) {
          this.stepError = 'Select a billing cycle.';
          this.cdr.markForCheck();
          return false;
        }
        break;
      default:
        break;
    }
    this.stepError = '';
    this.cdr.markForCheck();
    return true;
  }
}
