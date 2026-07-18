import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, ElementRef, OnInit, inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { forkJoin, finalize } from 'rxjs';

import {
  CustomerListItem, InstitutionType, Promotion,
  ProvisionOrganizationPayload, SubscriptionPlan
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatCurrency, institutionLabel } from '../../utils/platform-display.util';
import {
  AppButtonComponent,
  AppCardComponent,
  AppInputComponent,
  AppLoaderComponent,
  AppPhoneInputComponent,
  AppRadioCardComponent,
  AppSearchableSelectComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption
} from '../../../../shared/ui/app-form';

type PaymentOption = 'trial' | 'payment_received';

interface OrgFormModel {
  customerId: string | null;
  organizationName: string;
  shortName: string;
  institutionType: InstitutionType;
  domain: string;
  city: string;
  state: string;
  country: string;
  logoUrl: string;
  adminFullName: string;
  adminEmail: string;
  adminMobile: string;
  subscriptionPlanId: string | null;
  paymentOption: PaymentOption;
  couponCode: string;
  promotionId: number | null;
}

type ErrorKey =
  | 'customerId'
  | 'organizationName'
  | 'shortName'
  | 'institutionType'
  | 'domain'
  | 'city'
  | 'state'
  | 'country'
  | 'logoUrl'
  | 'adminFullName'
  | 'adminEmail'
  | 'adminMobile'
  | 'subscriptionPlanId'
  | 'paymentOption'
  | 'couponCode';

type FormErrors = Partial<Record<ErrorKey, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-provision-organization',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ToastModule,
    AppCardComponent,
    AppSectionHeaderComponent,
    AppInputComponent,
    AppPhoneInputComponent,
    AppSelectComponent,
    AppSearchableSelectComponent,
    AppRadioCardComponent,
    AppButtonComponent,
    AppLoaderComponent
  ],
  providers: [MessageService],
  templateUrl: './provision-organization.component.html',
  styleUrl: './provision-organization.component.scss'
})
export class ProvisionOrganizationComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly host = inject(ElementRef<HTMLElement>);

  loading = true;
  submitting = false;
  errorMessage = '';
  couponModalOpen = false;
  couponSearch = '';

  customers: CustomerListItem[] = [];
  plans: SubscriptionPlan[] = [];
  promotions: Promotion[] = [];

  form: OrgFormModel = this.emptyForm();
  errors: FormErrors = {};

  private pendingCustomerId: number | null = null;
  private linkedCustomerId: number | null = null;

  readonly institutionLabel = institutionLabel;
  readonly formatCurrency = formatCurrency;

  readonly institutionOptions: AppSelectOption[] = [
    'SCHOOL', 'COLLEGE', 'UNIVERSITY', 'TRAINING_INSTITUTE', 'COACHING', 'OTHER'
  ].map(value => ({
    value,
    label: institutionLabel(value as InstitutionType)
  }));

  readonly countryOptions: AppSelectOption[] = [
    'India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Other'
  ].map(c => ({ value: c, label: c }));

  readonly paymentOptions = [
    {
      value: 'trial',
      title: 'Trial',
      description: 'Start with a free trial period. Payment is collected after trial ends.',
      icon: 'pi pi-clock'
    },
    {
      value: 'payment_received',
      title: 'Payment Received',
      description: 'Payment has been collected. Activate the subscription immediately.',
      icon: 'pi pi-check-circle'
    }
  ];

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const customerId = Number(params.get('customerId'));
      if (customerId && !Number.isNaN(customerId)) {
        this.pendingCustomerId = customerId;
        this.linkedCustomerId = customerId;
        this.applyPendingCustomer();
        this.cdr.markForCheck();
      }
    });
    this.loadReferenceData();
  }

  get customerOptions(): AppSelectOption[] {
    return this.customers.map(c => ({
      value: String(c.id),
      label: [c.customerName, c.customerCode].filter(Boolean).join(' · ')
    }));
  }

  get planOptions(): AppSelectOption[] {
    return this.plans.map(p => ({
      value: String(p.id),
      label: p.planName
    }));
  }

  get selectedPlan(): SubscriptionPlan | undefined {
    const id = this.form.subscriptionPlanId ? Number(this.form.subscriptionPlanId) : null;
    return this.plans.find(p => p.id === id);
  }

  get selectedPromotion(): Promotion | undefined {
    return this.promotions.find(p => p.id === (this.form.promotionId ?? undefined));
  }

  get filteredPromotions(): Promotion[] {
    const term = this.couponSearch.trim().toLowerCase();
    if (!term) return this.promotions;
    return this.promotions.filter(p =>
      p.promotionName.toLowerCase().includes(term) ||
      p.promotionCode.toLowerCase().includes(term) ||
      (p.description?.toLowerCase().includes(term) ?? false)
    );
  }

  get planPrice(): number {
    return this.selectedPlan?.yearlyPrice ?? 0;
  }

  get discountAmount(): number {
    const promo = this.selectedPromotion;
    if (!promo?.discountValue) return 0;
    const price = this.planPrice;
    if (promo.discountType === 'PERCENTAGE') {
      const disc = price * promo.discountValue / 100;
      return promo.maximumDiscount ? Math.min(disc, promo.maximumDiscount) : disc;
    }
    return promo.discountValue;
  }

  get finalAmount(): number {
    return Math.max(0, this.planPrice - this.discountAmount);
  }

  get dueNow(): number {
    return this.form.paymentOption === 'trial' ? 0 : this.finalAmount;
  }

  get trialDays(): number {
    return this.selectedPlan?.trialDays ?? 0;
  }

  get domainPreview(): string {
    return this.form.domain ? `${this.form.domain.toLowerCase()}.thinkerscave.app` : '';
  }

  get canSubmit(): boolean {
    return this.isMinimallyValid() && !this.submitting && !this.loading;
  }

  fieldError(key: ErrorKey): string {
    return this.errors[key] ?? '';
  }

  onFieldChange(key: ErrorKey): void {
    if (this.errors[key]) {
      const next = { ...this.errors };
      delete next[key];
      this.errors = next;
      this.cdr.markForCheck();
    }
  }

  normalizeDomain(value: string): void {
    this.form.domain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.onFieldChange('domain');
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > LOGO_MAX_BYTES) {
      this.errors = { ...this.errors, logoUrl: 'Logo must be 2 MB or smaller.' };
      input.value = '';
      this.cdr.markForCheck();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.logoUrl = String(reader.result ?? '');
      this.onFieldChange('logoUrl');
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  clearLogo(): void {
    this.form.logoUrl = '';
    this.onFieldChange('logoUrl');
    this.cdr.markForCheck();
  }

  openCouponModal(): void {
    this.couponSearch = '';
    this.couponModalOpen = true;
    this.cdr.markForCheck();
  }

  closeCouponModal(): void {
    this.couponModalOpen = false;
    this.cdr.markForCheck();
  }

  selectPromotion(promo: Promotion): void {
    this.form.promotionId = promo.id;
    this.form.couponCode = promo.promotionCode;
    this.onFieldChange('couponCode');
    this.closeCouponModal();
  }

  clearCoupon(): void {
    this.form.promotionId = null;
    this.form.couponCode = '';
    this.onFieldChange('couponCode');
    this.cdr.markForCheck();
  }

  cancel(): void {
    if (this.linkedCustomerId) {
      void this.router.navigate(['/app/tenant-management/customers', this.linkedCustomerId]);
      return;
    }
    void this.router.navigate(['/app/tenant-management/organizations']);
  }

  submit(): void {
    if (!this.validate() || this.submitting) return;

    this.submitting = true;
    this.errorMessage = '';

    this.api.provisionOrganization(this.buildPayload())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: result => {
          this.messages.add({
            severity: 'success',
            summary: 'Organization created',
            detail: `${result.organizationName} was provisioned successfully.`,
            life: 4000
          });
          void this.router.navigate(['/app/tenant-management/organizations', result.organizationId]);
        },
        error: err => {
          this.errorMessage = err?.error?.message ?? 'Could not create organization. Verify inputs and retry.';
        }
      });
  }

  private loadReferenceData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      customers: this.api.getCustomers({ size: 200, status: 'ACTIVE' }),
      plans: this.api.getSubscriptionPlans(),
      promotions: this.api.getPromotions()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: ({ customers, plans, promotions }) => {
        this.customers = customers.content ?? [];
        this.plans = (plans ?? []).filter(p => p.active !== false && p.visible !== false);
        this.promotions = (promotions ?? []).filter(p => p.active !== false && p.status === 'ACTIVE');

        if (!this.form.subscriptionPlanId && this.plans.length) {
          const recommended = this.plans.find(p => p.recommended) ?? this.plans[0];
          this.form.subscriptionPlanId = String(recommended.id);
        }

        this.applyPendingCustomer();
      },
      error: () => {
        this.errorMessage = 'Unable to load customers, plans, or promotions.';
      }
    });
  }

  private applyPendingCustomer(): void {
    if (!this.pendingCustomerId || !this.customers.length) return;
    const exists = this.customers.some(c => c.id === this.pendingCustomerId);
    if (exists) {
      this.form.customerId = String(this.pendingCustomerId);
      this.pendingCustomerId = null;
      this.cdr.markForCheck();
    }
  }

  private emptyForm(): OrgFormModel {
    return {
      customerId: null,
      organizationName: '',
      shortName: '',
      institutionType: 'COLLEGE',
      domain: '',
      city: '',
      state: '',
      country: 'India',
      logoUrl: '',
      adminFullName: '',
      adminEmail: '',
      adminMobile: '',
      subscriptionPlanId: null,
      paymentOption: 'trial',
      couponCode: '',
      promotionId: null
    };
  }

  private splitFullName(fullName: string): { first: string; last: string } {
    const trimmed = fullName.trim();
    const space = trimmed.indexOf(' ');
    if (space < 0) return { first: trimmed, last: trimmed };
    return {
      first: trimmed.slice(0, space),
      last: trimmed.slice(space + 1).trim() || trimmed.slice(0, space)
    };
  }

  private buildPayload(): ProvisionOrganizationPayload {
    const f = this.form;
    const { first, last } = this.splitFullName(f.adminFullName);

    return {
      existingCustomerId: Number(f.customerId),
      organizationName: f.organizationName.trim(),
      shortName: f.shortName.trim(),
      institutionType: f.institutionType,
      tenantSubdomain: f.domain.trim(),
      city: f.city.trim(),
      state: f.state.trim(),
      country: f.country,
      logoUrl: f.logoUrl.trim() || undefined,
      adminFirstName: first,
      adminLastName: last,
      adminEmail: f.adminEmail.trim().toLowerCase(),
      adminMobile: f.adminMobile.trim(),
      subscriptionPlanId: Number(f.subscriptionPlanId),
      billingCycle: 'YEARLY',
      trialEnabled: f.paymentOption === 'trial',
      promotionId: f.promotionId ?? undefined,
      promotionCode: f.promotionId ? undefined : (f.couponCode.trim() || undefined),
      timeZone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en'
    };
  }

  private isMinimallyValid(): boolean {
    const f = this.form;
    return (
      !!f.customerId &&
      f.organizationName.trim().length >= 2 &&
      !!f.shortName.trim() &&
      !!f.institutionType &&
      !!f.domain.trim() &&
      !!f.city.trim() &&
      !!f.state.trim() &&
      !!f.country &&
      f.adminFullName.trim().length >= 3 &&
      EMAIL_PATTERN.test(f.adminEmail.trim()) &&
      this.nationalDigits(f.adminMobile).length >= 7 &&
      !!f.subscriptionPlanId &&
      !!f.paymentOption
    );
  }

  private validate(): boolean {
    const f = this.form;
    const next: FormErrors = {};

    if (!f.customerId) next.customerId = 'Select a customer account.';

    const orgName = f.organizationName.trim();
    if (!orgName) next.organizationName = 'Organization name is required.';
    else if (orgName.length < 2) next.organizationName = 'Organization name must be at least 2 characters.';

    if (!f.shortName.trim()) next.shortName = 'Short name is required.';
    if (!f.institutionType) next.institutionType = 'Select an institution type.';

    const domain = f.domain.trim();
    if (!domain) next.domain = 'Domain is required.';
    else if (!/^[a-z0-9-]+$/.test(domain)) next.domain = 'Use lowercase letters, numbers, and hyphens only.';

    if (!f.city.trim()) next.city = 'City is required.';
    if (!f.state.trim()) next.state = 'State is required.';
    if (!f.country) next.country = 'Country is required.';

    const adminName = f.adminFullName.trim();
    if (!adminName) next.adminFullName = 'Full name is required.';
    else if (adminName.length < 3) next.adminFullName = 'Full name must be at least 3 characters.';

    const email = f.adminEmail.trim();
    if (!email) next.adminEmail = 'Email is required.';
    else if (!EMAIL_PATTERN.test(email)) next.adminEmail = 'Enter a valid email address.';

    if (!f.adminMobile.trim()) next.adminMobile = 'Mobile number is required.';
    else if (!this.isValidPhone(f.adminMobile)) next.adminMobile = 'Enter a valid mobile number.';

    if (!f.subscriptionPlanId) next.subscriptionPlanId = 'Select a subscription plan.';
    if (!f.paymentOption) next.paymentOption = 'Select a payment option.';

    if (f.couponCode.trim() && !f.promotionId) {
      const matched = this.promotions.find(p => p.promotionCode.toLowerCase() === f.couponCode.trim().toLowerCase());
      if (matched) {
        this.form.promotionId = matched.id;
      } else {
        next.couponCode = 'Coupon code was not found or is inactive.';
      }
    }

    this.errors = next;
    this.cdr.markForCheck();

    if (Object.keys(next).length > 0) {
      this.focusFirstInvalid();
      return false;
    }
    return true;
  }

  private focusFirstInvalid(): void {
    queueMicrotask(() => {
      const invalid = this.host.nativeElement.querySelector('.is-invalid, .app-field__control.is-invalid') as HTMLElement | null;
      invalid?.focus?.();
    });
  }

  private isValidPhone(value: string): boolean {
    const digits = this.nationalDigits(value);
    return digits.length >= 7 && digits.length <= 15;
  }

  private nationalDigits(value: string): string {
    return (value ?? '').replace(/\D/g, '');
  }
}
