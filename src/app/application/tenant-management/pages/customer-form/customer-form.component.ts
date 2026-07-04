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
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { forkJoin, of, switchMap, finalize } from 'rxjs';

import {
  CustomerCreatePayload,
  CustomerMetadata,
  CustomerStatus,
  CustomerType,
  EnumOption,
  PreferredCommunication
} from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  customerStatusLabel,
  customerTypeLabel,
  formatDate
} from '../../utils/platform-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStep,
  SaasStepperComponent
} from '../../../../shared/ui/saas';

interface CustomerFormModel {
  legalName: string;
  displayName: string;
  customerType: CustomerType;
  status: CustomerStatus;
  email: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  website: string;
  logoUrl: string;
  taxNumber: string;
  registrationNumber: string;
  contactFullName: string;
  contactDesignation: string;
  contactEmail: string;
  contactMobile: string;
  contactAlternateMobile: string;
  contactPrimary: boolean;
  contactBilling: boolean;
  contactTechnical: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  preferredCommunication: PreferredCommunication;
  remarks: string;
}

@Component({
  selector: 'app-customer-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasStepperComponent,
    SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);

  loading = true;
  submitting = false;
  step = 0;
  stepError = '';
  errorMessage = '';
  isEditMode = false;
  customerId: number | null = null;
  metadata: CustomerMetadata | null = null;

  form: CustomerFormModel = this.emptyForm();

  readonly customerStatusLabel = customerStatusLabel;
  readonly customerTypeLabel = customerTypeLabel;
  readonly formatDate = formatDate;

  readonly wizardSteps: SaasStep[] = [
    { key: 'business', label: 'Business' },
    { key: 'contact', label: 'Primary Contact' },
    { key: 'address', label: 'Address' },
    { key: 'commercial', label: 'Commercial' },
    { key: 'review', label: 'Review' }
  ];

  readonly countries = [
    'India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Other'
  ];

  ngOnInit(): void {
    this.isEditMode = this.router.url.includes('/edit');
    const idParam = this.route.snapshot.paramMap.get('id');
    if (this.isEditMode && idParam) {
      this.customerId = Number(idParam);
    }
    this.loadInitialData();
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Customer' : 'New Customer';
  }

  get statusOptions(): EnumOption[] {
    return this.metadata?.statuses?.length
      ? this.metadata!.statuses
      : [
          { code: 'LEAD', label: 'Lead' },
          { code: 'TRIAL', label: 'Trial' },
          { code: 'ACTIVE', label: 'Active' },
          { code: 'SUSPENDED', label: 'Suspended' }
        ];
  }

  get typeOptions(): EnumOption[] {
    return this.metadata?.customerTypes?.length
      ? this.metadata!.customerTypes
      : [
          { code: 'EDUCATION_GROUP', label: 'Education Group' },
          { code: 'SCHOOL', label: 'School' },
          { code: 'COLLEGE', label: 'College' },
          { code: 'UNIVERSITY', label: 'University' },
          { code: 'TRUST', label: 'Trust' },
          { code: 'COMPANY', label: 'Company' }
        ];
  }

  get communicationOptions(): EnumOption[] {
    return this.metadata?.preferredCommunications?.length
      ? this.metadata!.preferredCommunications
      : [
          { code: 'EMAIL', label: 'Email' },
          { code: 'PHONE', label: 'Phone' },
          { code: 'WHATSAPP', label: 'WhatsApp' },
          { code: 'SMS', label: 'SMS' }
        ];
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = '';

    const metadata$ = this.api.getCustomerMetadata();
    const customer$ = this.isEditMode && this.customerId
      ? this.api.getCustomer(this.customerId)
      : of(null);

    forkJoin({ metadata: metadata$, customer: customer$ })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ metadata, customer }) => {
          this.metadata = metadata;
          if (customer?.id) {
            this.patchFormFromCustomer(customer);
          }
        },
        error: () => {
          this.errorMessage = this.isEditMode
            ? 'Unable to load customer for editing. Verify platform APIs and Super Admin access.'
            : 'Unable to load customer metadata. Verify platform APIs and Super Admin access.';
        }
      });
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

  submit(): void {
    if (!this.validateStep(this.step) || this.submitting) return;
    this.submitting = true;
    this.errorMessage = '';
    const payload = this.buildPayload();

    const request$ = this.isEditMode && this.customerId
      ? this.api.updateCustomer(this.customerId, payload)
      : this.api.createCustomer(payload).pipe(
          switchMap(customer => {
            const contactName = this.form.contactFullName.trim();
            if (contactName && customer?.id) {
              return this.api.addCustomerContact(customer.id, {
                fullName: contactName,
                designation: this.form.contactDesignation.trim() || undefined,
                email: this.form.contactEmail.trim() || undefined,
                mobileNumber: this.form.contactMobile.trim() || undefined,
                alternateMobileNumber: this.form.contactAlternateMobile.trim() || undefined,
                primaryContact: this.form.contactPrimary,
                billingContact: this.form.contactBilling,
                technicalContact: this.form.contactTechnical
              }).pipe(switchMap(() => of(customer)));
            }
            return of(customer);
          })
        );

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: customer => {
          const id = customer?.id ?? this.customerId;
          this.messages.add({
            severity: 'success',
            summary: this.isEditMode ? 'Customer updated' : 'Customer created',
            detail: `${customer.displayName || this.form.displayName} saved successfully.`,
            life: 4000
          });
          if (id) {
            void this.router.navigate(['/app/tenant-management/customers', id]);
          }
        },
        error: err => {
          this.errorMessage = err?.error?.message ?? 'Could not save customer. Verify inputs and retry.';
        }
      });
  }

  cancel(): void {
    if (this.isEditMode && this.customerId) {
      void this.router.navigate(['/app/tenant-management/customers', this.customerId]);
      return;
    }
    void this.router.navigate(['/app/tenant-management/customers']);
  }

  private emptyForm(): CustomerFormModel {
    return {
      legalName: '',
      displayName: '',
      customerType: 'EDUCATION_GROUP',
      status: 'LEAD',
      email: '',
      mobileNumber: '',
      alternateMobileNumber: '',
      website: '',
      logoUrl: '',
      taxNumber: '',
      registrationNumber: '',
      contactFullName: '',
      contactDesignation: '',
      contactEmail: '',
      contactMobile: '',
      contactAlternateMobile: '',
      contactPrimary: true,
      contactBilling: true,
      contactTechnical: false,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      preferredCommunication: 'EMAIL',
      remarks: ''
    };
  }

  private patchFormFromCustomer(customer: {
    legalName: string;
    displayName: string;
    customerType?: CustomerType;
    status?: CustomerStatus;
    email?: string;
    mobileNumber?: string;
    alternateMobileNumber?: string;
    website?: string;
    logoUrl?: string;
    taxNumber?: string;
    registrationNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    preferredCommunication?: PreferredCommunication;
    remarks?: string;
    contacts?: { fullName: string; designation?: string; email?: string; mobileNumber?: string; alternateMobileNumber?: string; primaryContact?: boolean; billingContact?: boolean; technicalContact?: boolean }[];
  }): void {
    const primary = customer.contacts?.find(c => c.primaryContact) ?? customer.contacts?.[0];
    this.form = {
      ...this.emptyForm(),
      legalName: customer.legalName ?? '',
      displayName: customer.displayName ?? '',
      customerType: customer.customerType ?? 'EDUCATION_GROUP',
      status: customer.status ?? 'LEAD',
      email: customer.email ?? '',
      mobileNumber: customer.mobileNumber ?? '',
      alternateMobileNumber: customer.alternateMobileNumber ?? '',
      website: customer.website ?? '',
      logoUrl: customer.logoUrl ?? '',
      taxNumber: customer.taxNumber ?? '',
      registrationNumber: customer.registrationNumber ?? '',
      contactFullName: primary?.fullName ?? '',
      contactDesignation: primary?.designation ?? '',
      contactEmail: primary?.email ?? '',
      contactMobile: primary?.mobileNumber ?? '',
      contactAlternateMobile: primary?.alternateMobileNumber ?? '',
      contactPrimary: primary?.primaryContact ?? true,
      contactBilling: primary?.billingContact ?? true,
      contactTechnical: primary?.technicalContact ?? false,
      addressLine1: customer.addressLine1 ?? '',
      addressLine2: customer.addressLine2 ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      country: customer.country ?? 'India',
      postalCode: customer.postalCode ?? '',
      preferredCommunication: customer.preferredCommunication ?? 'EMAIL',
      remarks: customer.remarks ?? ''
    };
  }

  private buildPayload(): CustomerCreatePayload {
    const f = this.form;
    return {
      legalName: f.legalName.trim(),
      displayName: f.displayName.trim(),
      customerType: f.customerType,
      status: f.status,
      email: f.email.trim(),
      mobileNumber: f.mobileNumber.trim(),
      alternateMobileNumber: f.alternateMobileNumber.trim() || undefined,
      website: f.website.trim() || undefined,
      taxNumber: f.taxNumber.trim() || undefined,
      registrationNumber: f.registrationNumber.trim() || undefined,
      addressLine1: f.addressLine1.trim() || undefined,
      addressLine2: f.addressLine2.trim() || undefined,
      city: f.city.trim() || undefined,
      state: f.state.trim() || undefined,
      country: f.country || undefined,
      postalCode: f.postalCode.trim() || undefined,
      logoUrl: f.logoUrl.trim() || undefined,
      preferredCommunication: f.preferredCommunication,
      remarks: f.remarks.trim() || undefined
    };
  }

  private validateStep(index: number): boolean {
    const f = this.form;
    switch (index) {
      case 0:
        if (!f.legalName.trim() || !f.displayName.trim()) {
          this.stepError = 'Legal name and display name are required.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.customerType) {
          this.stepError = 'Select a customer type.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.email.includes('@')) {
          this.stepError = 'A valid business email is required.';
          this.cdr.markForCheck();
          return false;
        }
        if (!f.mobileNumber.trim()) {
          this.stepError = 'Business mobile number is required.';
          this.cdr.markForCheck();
          return false;
        }
        break;
      case 1:
        if (f.contactFullName.trim() && !f.contactEmail.includes('@') && !f.contactMobile.trim()) {
          this.stepError = 'Provide an email or mobile number for the primary contact.';
          this.cdr.markForCheck();
          return false;
        }
        break;
      case 2:
        if (!f.addressLine1.trim() || !f.city.trim() || !f.country) {
          this.stepError = 'Address line, city, and country are required.';
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
