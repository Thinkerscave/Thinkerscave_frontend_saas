import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  DestroyRef, ElementRef, OnInit, inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, finalize, Subject, debounceTime, switchMap, of, catchError } from 'rxjs';

import {
  CustomerListItem, InstitutionType, OrganizationDetail, OrganizationUpdatePayload, Promotion,
  ProvisionOrganizationPayload, SubscriptionPlan
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatCurrency, institutionTypeOptions } from '../../utils/platform-display.util';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import {
  LOGO_MAX_DATA_URL_CHARS,
  estimateDataUrlBytes,
  fileToCompressedLogoDataUrl
} from '../../../../shared/utils/logo-data-url.util';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
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
  AppSelectOption,
  phoneErrorMessage
} from '../../../../shared/ui/app-form';

type PaymentOption = 'trial' | 'payment_received';



interface OrgFormModel {
  customerId: string | null;
  organizationName: string;
  shortName: string;
  institutionType: InstitutionType | null;
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

@Component({
  selector: 'app-provision-organization',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
  templateUrl: './provision-organization.component.html',
  styleUrl: './provision-organization.component.scss'
})
export class ProvisionOrganizationComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(UiFeedbackService);
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly host = inject(ElementRef<HTMLElement>);

  loading = true;
  submitting = false;
  logoProcessing = false;
  errorMessage = '';
  domainChecking = false;
  domainAvailable = false;
  couponModalOpen = false;
  couponSearch = '';
  isEditMode = false;
  editingOrgId: number | null = null;
  private editingOrg: OrganizationDetail | null = null;



  customers: CustomerListItem[] = [];
  plans: SubscriptionPlan[] = [];
  promotions: Promotion[] = [];



  form: OrgFormModel = this.emptyForm();
  errors: FormErrors = {};



  private pendingCustomerId: number | null = null;
  private linkedCustomerId: number | null = null;
  private readonly domainCheck$ = new Subject<string>();



  readonly institutionOptions: AppSelectOption[] = institutionTypeOptions();
  readonly formatCurrency = formatCurrency;



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
    const orgId = Number(this.route.snapshot.queryParamMap.get('orgId'));
    if (orgId && !Number.isNaN(orgId)) {
      this.isEditMode = true;
      this.editingOrgId = orgId;
      this.pageHeader.setPageHeader({
        title: 'Edit Organization',
        subtitle: 'Update profile, location, logo, and organization admin contact.'
      });
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const customerId = Number(params.get('customerId'));
      if (customerId && !Number.isNaN(customerId)) {
        this.pendingCustomerId = customerId;
        this.linkedCustomerId = customerId;
        this.applyPendingCustomer();
      }
      this.cdr.markForCheck();
    });
    this.domainCheck$
      .pipe(
        debounceTime(400),
        switchMap(domain => {
          if (!domain || domain.length < 2 || !/^[a-z0-9-]+$/.test(domain)) {
            this.domainChecking = false;
            return of(null);
          }
          this.domainChecking = true;
          this.cdr.markForCheck();
          return this.api.checkDomainAvailability(domain).pipe(
            catchError(() => of({
              subdomain: domain,
              tenantIdentifier: '',
              previewDomain: `${domain}.thinkerscave.app`,
              available: false,
              message: 'Unable to verify domain availability right now.'
            })),
            finalize(() => {
              this.domainChecking = false;
              this.cdr.markForCheck();
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        if (!result) return;
        if (result.available) {
          this.domainAvailable = true;
          if (this.errors.domain) {
            const next = { ...this.errors };
            delete next.domain;
            this.errors = next;
          }
        } else if (result.message) {
          this.domainAvailable = false;
          this.errors = { ...this.errors, domain: result.message };
        }
        this.cdr.markForCheck();
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
    return this.isMinimallyValid()
      && !this.submitting
      && !this.loading
      && !this.logoProcessing
      && (this.isEditMode || (!this.domainChecking && !this.errors.domain));
  }



  fieldError(key: ErrorKey): string {
    return this.errors[key] ?? '';
  }



  onFieldChange(key: ErrorKey): void {
    if (key === 'adminMobile') {
      this.validateMobile(false);
      return;
    }
    if (this.errors[key]) {
      const next = { ...this.errors };
      delete next[key];
      this.errors = next;
      this.cdr.markForCheck();
    }
  }

  onMobileChange(): void {
    this.validateMobile(false);
  }

  onMobileBlur(): void {
    this.validateMobile(true);
  }



  normalizeDomain(value: string): void {
    this.form.domain = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.onFieldChange('domain');
    this.errorMessage = '';
    if (this.isEditMode) {
      this.domainAvailable = true;
      return;
    }
    this.domainAvailable = false;
    this.domainCheck$.next(this.form.domain.trim());
  }



  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.logoProcessing = true;
    this.onFieldChange('logoUrl');
    this.cdr.markForCheck();

    void fileToCompressedLogoDataUrl(file)
      .then(dataUrl => {
        this.form.logoUrl = dataUrl;
        this.onFieldChange('logoUrl');
        this.feedback.info(
          'Logo ready',
          `Compressed to ~${Math.max(1, Math.round(estimateDataUrlBytes(dataUrl) / 1024))} KB for upload.`
        );
      })
      .catch((err: unknown) => {
        this.form.logoUrl = '';
        const message = err instanceof Error ? err.message : 'Could not process the logo.';
        this.errors = { ...this.errors, logoUrl: message };
        this.feedback.formError(message, 'Logo upload issue');
      })
      .finally(() => {
        this.logoProcessing = false;
        input.value = '';
        this.cdr.markForCheck();
      });
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
    if (this.isEditMode && this.editingOrgId) {
      void this.router.navigate(['/app/tenant-management/organizations', this.editingOrgId]);
      return;
    }
    if (this.linkedCustomerId) {
      void this.router.navigate(['/app/tenant-management/customers', this.linkedCustomerId]);
      return;
    }
    void this.router.navigate(['/app/tenant-management/organizations']);
  }



  submit(): void {
    if (!this.validate() || this.submitting) return;

    if (this.form.logoUrl && this.form.logoUrl.length > LOGO_MAX_DATA_URL_CHARS) {
      const message = 'Logo is too large after encoding. Use a smaller image or remove the logo.';
      this.errors = { ...this.errors, logoUrl: message };
      this.feedback.formError(message, 'Logo upload issue');
      this.focusFirstInvalid();
      this.cdr.markForCheck();
      return;
    }

    if (this.isEditMode && this.editingOrgId) {
      this.submitUpdate();
      return;
    }

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
          const credentialDetail = result?.adminUsername && result?.temporaryPassword
            ? ` Admin login: ${result.adminUsername} / ${result.temporaryPassword}`
            : '';
          this.feedback.success(
            'Organization created',
            `${result.organizationName} was provisioned successfully.${credentialDetail}`,
            { life: 12000 }
          );
          void this.router.navigate(['/app/tenant-management/organizations', result.organizationId]);
        },
        error: err => {
          const parsed = extractApiError(err, 'Could not create organization. Verify inputs and retry.');
          this.errorMessage = parsed.message;
          this.feedback.formError(parsed.message, 'Could not create organization');
          if (Object.keys(parsed.fieldErrors).length) {
            const next: FormErrors = { ...this.errors };
            for (const [key, message] of Object.entries(parsed.fieldErrors)) {
              if ((key as ErrorKey) && message) {
                (next as Record<string, string>)[key] = message;
              }
            }
            this.errors = next;
            this.focusFirstInvalid();
          }
          this.cdr.markForCheck();
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
        if (!this.editingOrgId) {
          this.loading = false;
          this.cdr.markForCheck();
        }
      })
    ).subscribe({
      next: ({ customers, plans, promotions }) => {
        this.customers = customers.content ?? [];
        this.plans = (plans ?? []).filter(p => p.active !== false && p.visible !== false);
        this.promotions = (promotions ?? []).filter(p => p.active !== false && p.status === 'ACTIVE');



        if (!this.isEditMode && !this.form.subscriptionPlanId && this.plans.length) {
          const recommended = this.plans.find(p => p.recommended) ?? this.plans[0];
          this.form.subscriptionPlanId = String(recommended.id);
        }

        this.applyPendingCustomer();
        if (this.editingOrgId) {
          this.loadOrganization(this.editingOrgId);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Unable to load customers, plans, or promotions.';
        this.feedback.error('Load failed', this.errorMessage);
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

  private loadOrganization(orgId: number): void {
    this.loading = true;
    this.api.getOrganization(orgId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: org => {
          if (!org?.id) {
            this.errorMessage = 'Organization not found.';
            return;
          }
          this.editingOrg = org;
          this.ensureCustomerOption(org);
          this.patchFormFromOrg(org);
          this.pageHeader.setPageHeader({
            title: 'Edit Organization',
            subtitle: org.organizationName
          });
        },
        error: () => {
          this.errorMessage = 'Unable to load this organization for editing.';
          this.feedback.error('Load failed', this.errorMessage);
        }
      });
  }

  private ensureCustomerOption(org: OrganizationDetail): void {
    if (!org.customerId) return;
    const exists = this.customers.some(c => c.id === org.customerId);
    if (!exists) {
      this.customers = [
        {
          id: org.customerId,
          customerCode: org.customerCode || '',
          customerName: org.customerName || 'Customer'
        },
        ...this.customers
      ];
    }
  }

  private patchFormFromOrg(org: OrganizationDetail): void {
    this.form = {
      customerId: org.customerId ? String(org.customerId) : null,
      organizationName: org.organizationName ?? '',
      shortName: org.shortName ?? '',
      institutionType: org.institutionType ?? null,
      domain: this.subdomainOf(org),
      city: org.city ?? '',
      state: org.state ?? '',
      country: org.country || 'India',
      logoUrl: org.logoUrl ?? '',
      adminFullName: org.adminFullName ?? '',
      adminEmail: org.adminEmail || org.email || '',
      adminMobile: org.adminMobile || org.mobileNumber || '',
      subscriptionPlanId: org.subscription?.subscriptionPlanId
        ? String(org.subscription.subscriptionPlanId)
        : this.form.subscriptionPlanId,
      paymentOption: org.subscription?.status === 'TRIAL' ? 'trial' : 'payment_received',
      couponCode: org.subscription?.promotionCode ?? '',
      promotionId: org.subscription?.promotionId ?? null
    };
    this.domainAvailable = true;
    this.cdr.markForCheck();
  }

  private subdomainOf(org: OrganizationDetail): string {
    const sub = org.domain?.subDomain || org.domain?.subdomain;
    if (sub) return sub;
    const host = org.tenant?.tenantDomain || org.domain?.domain || '';
    const first = host.split('.')[0];
    return first && first !== host ? first : host.replace(/\.thinkerscave\.app$/i, '');
  }

  private submitUpdate(): void {
    if (!this.editingOrgId || !this.editingOrg) return;
    this.submitting = true;
    this.errorMessage = '';
    this.api.updateOrganization(this.editingOrgId, this.buildUpdatePayload())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.feedback.success('Organization updated', `${this.form.organizationName.trim()} was saved.`);
          void this.router.navigate(['/app/tenant-management/organizations', this.editingOrgId]);
        },
        error: err => {
          const parsed = extractApiError(err, 'Could not update organization. Verify inputs and retry.');
          this.errorMessage = parsed.message;
          this.feedback.formError(parsed.message, 'Could not update organization');
          this.cdr.markForCheck();
        }
      });
  }

  private buildUpdatePayload(): OrganizationUpdatePayload {
    const f = this.form;
    const org = this.editingOrg;
    return {
      customerId: Number(f.customerId),
      organizationName: f.organizationName.trim(),
      shortName: f.shortName.trim() || undefined,
      institutionType: f.institutionType!,
      boardName: org?.boardName,
      email: f.adminEmail.trim().toLowerCase(),
      mobileNumber: f.adminMobile.trim(),
      adminFullName: f.adminFullName.trim(),
      website: org?.website,
      addressLine1: [f.city.trim(), f.state.trim(), f.country].filter(Boolean).join(', ') || undefined,
      city: f.city.trim() || undefined,
      state: f.state.trim() || undefined,
      country: f.country,
      postalCode: org?.postalCode,
      timeZone: org?.timeZone || org?.configuration?.timeZone || 'Asia/Kolkata',
      currency: org?.currency || org?.configuration?.currency || 'INR',
      language: org?.language || org?.configuration?.language || 'en',
      logoUrl: f.logoUrl.trim() || undefined,
      remarks: org?.remarks
    };
  }



  private emptyForm(): OrgFormModel {
    return {
      customerId: null,
      organizationName: '',
      shortName: '',
      institutionType: null,
      domain: '',
      city: '',
      state: '',
      country: '',
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
      institutionType: f.institutionType!,
      tenantSubdomain: f.domain.trim(),
      city: f.city.trim(),
      state: f.state.trim(),
      country: f.country,
      logoUrl: f.logoUrl.trim() || undefined,
      adminFirstName: first,
      adminLastName: last,
      adminEmail: f.adminEmail.trim().toLowerCase(),
      adminMobile: f.adminMobile.trim(),
      orgEmail: f.adminEmail.trim().toLowerCase(),
      orgMobile: f.adminMobile.trim(),
      addressLine1: [f.city.trim(), f.state.trim(), f.country].filter(Boolean).join(', ') || undefined,
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
      phoneErrorMessage(f.adminMobile) === null &&
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
    if (!this.isEditMode) {
      if (!domain) next.domain = 'Domain is required.';
      else if (!/^[a-z0-9-]+$/.test(domain)) next.domain = 'Use lowercase letters, numbers, and hyphens only.';
      else if (domain.length < 2) next.domain = 'Domain must be at least 2 characters.';
      else if (['www', 'api', 'app', 'admin', 'platform', 'public', 'tenant', 'mail', 'test', 'staging'].includes(domain)) {
        next.domain = `Domain "${domain}" is reserved. Choose another.`;
      }
    }



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
    else {
      const mobileError = phoneErrorMessage(f.adminMobile);
      if (mobileError) next.adminMobile = mobileError;
    }



    if (!f.subscriptionPlanId) next.subscriptionPlanId = 'Select a subscription plan.';
    if (!f.paymentOption) next.paymentOption = 'Select a payment option.';



    if (!this.isEditMode && f.couponCode.trim() && !f.promotionId) {
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
      const first = Object.values(next)[0];
      this.feedback.formError(first, 'Please fix the highlighted fields');
      this.focusFirstInvalid();
      return false;
    }
    return true;
  }



  private validateMobile(requireValue: boolean): void {
    const value = this.form.adminMobile.trim();
    const next = { ...this.errors };
    if (!value) {
      if (requireValue) next.adminMobile = 'Mobile number is required.';
      else delete next.adminMobile;
    } else {
      const message = phoneErrorMessage(value);
      if (message) next.adminMobile = message;
      else delete next.adminMobile;
    }
    this.errors = next;
    this.cdr.markForCheck();
  }

  private focusFirstInvalid(): void {
    queueMicrotask(() => {
      const invalid = this.host.nativeElement.querySelector('.is-invalid, .app-field__control.is-invalid') as HTMLElement | null;
      invalid?.focus?.();
    });
  }
}


