import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';

import { Customer, CustomerCreatePayload } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  AppButtonComponent,
  AppCardComponent,
  AppInputComponent,
  AppLoaderComponent,
  AppPhoneInputComponent,
  AppSectionHeaderComponent,
  AppTextareaComponent
} from '../../../../shared/ui/app-form';

interface ContactFormModel {
  fullName: string;
  email: string;
  mobileNumber: string;
  designation: string;
}

interface CustomerFormModel {
  customerName: string;
  businessEmail: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  primary: ContactFormModel;
  secondary: ContactFormModel;
  notes: string;
}

type ErrorKey =
  | 'customerName'
  | 'businessEmail'
  | 'mobileNumber'
  | 'alternateMobileNumber'
  | 'primary.fullName'
  | 'primary.email'
  | 'primary.mobileNumber'
  | 'primary.designation'
  | 'secondary.fullName'
  | 'secondary.email'
  | 'secondary.mobileNumber'
  | 'secondary.designation'
  | 'notes';

type FormErrors = Partial<Record<ErrorKey, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOTES_MAX = 500;

@Component({
  selector: 'app-customer-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    AppCardComponent,
    AppSectionHeaderComponent,
    AppInputComponent,
    AppPhoneInputComponent,
    AppTextareaComponent,
    AppButtonComponent,
    AppLoaderComponent
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
  private readonly host = inject(ElementRef<HTMLElement>);

  loading = false;
  submitting = false;
  errorMessage = '';
  isEditMode = false;
  customerId: number | null = null;

  form: CustomerFormModel = this.emptyForm();
  errors: FormErrors = {};

  readonly notesMax = NOTES_MAX;

  ngOnInit(): void {
    this.isEditMode = this.router.url.includes('/edit');
    const idParam = this.route.snapshot.paramMap.get('id');
    if (this.isEditMode && idParam) {
      this.customerId = Number(idParam);
      this.loadCustomer();
    }
  }

  get canSubmit(): boolean {
    return this.isMinimallyValid() && !this.submitting;
  }

  fieldError(key: ErrorKey): string {
    return this.errors[key] ?? '';
  }

  clearFieldError(key: ErrorKey): void {
    if (!this.errors[key]) return;
    const next = { ...this.errors };
    delete next[key];
    this.errors = next;
  }

  onFieldChange(key: ErrorKey): void {
    this.clearFieldError(key);
    this.cdr.markForCheck();
  }

  loadCustomer(): void {
    if (!this.customerId) return;
    this.loading = true;
    this.errorMessage = '';
    this.api.getCustomer(this.customerId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: customer => {
          if (!customer?.id) {
            this.errorMessage = 'Customer not found.';
            return;
          }
          this.patchForm(customer);
        },
        error: () => {
          this.errorMessage = 'Unable to load customer for editing. Verify platform APIs and Super Admin access.';
        }
      });
  }

  submit(): void {
    if (!this.validate() || this.submitting) return;

    this.submitting = true;
    this.errorMessage = '';
    const payload = this.buildPayload();

    const request$ = this.isEditMode && this.customerId
      ? this.api.updateCustomer(this.customerId, payload)
      : this.api.createCustomer(payload);

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
          const credentialDetail = !this.isEditMode && customer?.ownerUsername && customer?.temporaryPassword
            ? ` Owner login: ${customer.ownerUsername} / ${customer.temporaryPassword}`
            : '';
          this.messages.add({
            severity: 'success',
            summary: this.isEditMode ? 'Customer updated' : 'Customer created',
            detail: `${customer.customerName || this.form.customerName} saved successfully.${credentialDetail}`,
            life: 12000
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

  private emptyContact(): ContactFormModel {
    return { fullName: '', email: '', mobileNumber: '', designation: '' };
  }

  private emptyForm(): CustomerFormModel {
    return {
      customerName: '',
      businessEmail: '',
      mobileNumber: '',
      alternateMobileNumber: '',
      primary: this.emptyContact(),
      secondary: this.emptyContact(),
      notes: ''
    };
  }

  private patchForm(customer: Customer): void {
    const primary = customer.primaryContact
      ?? customer.contacts?.find(c => c.contactType === 'PRIMARY');
    const secondary = customer.secondaryContact
      ?? customer.contacts?.find(c => c.contactType === 'SECONDARY');

    this.form = {
      customerName: customer.customerName ?? '',
      businessEmail: customer.businessEmail ?? '',
      mobileNumber: customer.mobileNumber ?? '',
      alternateMobileNumber: customer.alternateMobileNumber ?? '',
      primary: {
        fullName: primary?.fullName ?? '',
        email: primary?.email ?? '',
        mobileNumber: primary?.mobileNumber ?? '',
        designation: primary?.designation ?? ''
      },
      secondary: {
        fullName: secondary?.fullName ?? '',
        email: secondary?.email ?? '',
        mobileNumber: secondary?.mobileNumber ?? '',
        designation: secondary?.designation ?? ''
      },
      notes: customer.notes ?? ''
    };
  }

  private buildPayload(): CustomerCreatePayload {
    const f = this.form;
    const payload: CustomerCreatePayload = {
      customerName: f.customerName.trim(),
      businessEmail: f.businessEmail.trim().toLowerCase(),
      mobileNumber: f.mobileNumber.trim(),
      alternateMobileNumber: f.alternateMobileNumber.trim() || undefined,
      notes: f.notes.trim() || undefined,
      primaryContact: {
        fullName: f.primary.fullName.trim(),
        email: f.primary.email.trim().toLowerCase(),
        mobileNumber: f.primary.mobileNumber.trim(),
        designation: f.primary.designation.trim() || undefined
      }
    };

    if (this.hasSecondaryInput()) {
      payload.secondaryContact = {
        fullName: f.secondary.fullName.trim(),
        email: f.secondary.email.trim().toLowerCase(),
        mobileNumber: f.secondary.mobileNumber.trim(),
        designation: f.secondary.designation.trim() || undefined
      };
    }

    return payload;
  }

  private hasSecondaryInput(): boolean {
    const s = this.form.secondary;
    return !!(s.fullName.trim() || s.email.trim() || s.mobileNumber.trim() || s.designation.trim());
  }

  private isMinimallyValid(): boolean {
    const f = this.form;
    return (
      f.customerName.trim().length >= 3 &&
      EMAIL_PATTERN.test(f.businessEmail.trim()) &&
      this.nationalDigits(f.mobileNumber).length >= 7 &&
      f.primary.fullName.trim().length >= 3 &&
      EMAIL_PATTERN.test(f.primary.email.trim()) &&
      this.nationalDigits(f.primary.mobileNumber).length >= 7
    );
  }

  private validate(): boolean {
    const f = this.form;
    const next: FormErrors = {};

    const name = f.customerName.trim();
    if (!name) next.customerName = 'Customer name is required.';
    else if (name.length < 3) next.customerName = 'Customer name must be at least 3 characters.';
    else if (name.length > 150) next.customerName = 'Customer name must be at most 150 characters.';

    const email = f.businessEmail.trim();
    if (!email) next.businessEmail = 'Business email is required.';
    else if (!EMAIL_PATTERN.test(email)) next.businessEmail = 'Enter a valid business email.';

    if (!f.mobileNumber.trim()) next.mobileNumber = 'Mobile number is required.';
    else if (!this.isValidPhone(f.mobileNumber)) next.mobileNumber = 'Enter a valid mobile number.';

    if (f.alternateMobileNumber.trim()) {
      if (!this.isValidPhone(f.alternateMobileNumber)) {
        next.alternateMobileNumber = 'Enter a valid alternate mobile number.';
      } else if (this.normalizePhone(f.alternateMobileNumber) === this.normalizePhone(f.mobileNumber)) {
        next.alternateMobileNumber = 'Alternate mobile cannot match business mobile.';
      }
    }

    const pName = f.primary.fullName.trim();
    if (!pName) next['primary.fullName'] = 'Full name is required.';
    else if (pName.length < 3) next['primary.fullName'] = 'Full name must be at least 3 characters.';
    else if (pName.length > 100) next['primary.fullName'] = 'Full name must be at most 100 characters.';

    if (!f.primary.email.trim()) next['primary.email'] = 'Email address is required.';
    else if (!EMAIL_PATTERN.test(f.primary.email.trim())) next['primary.email'] = 'Enter a valid email address.';

    if (!f.primary.mobileNumber.trim()) next['primary.mobileNumber'] = 'Mobile number is required.';
    else if (!this.isValidPhone(f.primary.mobileNumber)) next['primary.mobileNumber'] = 'Enter a valid mobile number.';

    if (f.primary.designation.trim().length > 100) {
      next['primary.designation'] = 'Designation must be at most 100 characters.';
    }

    if (this.hasSecondaryInput()) {
      const sName = f.secondary.fullName.trim();
      if (!sName || sName.length < 3) {
        next['secondary.fullName'] = 'Full name is required for secondary contact.';
      }
      if (!f.secondary.email.trim() || !EMAIL_PATTERN.test(f.secondary.email.trim())) {
        next['secondary.email'] = 'Valid email is required for secondary contact.';
      }
      if (!f.secondary.mobileNumber.trim() || !this.isValidPhone(f.secondary.mobileNumber)) {
        next['secondary.mobileNumber'] = 'Valid mobile is required for secondary contact.';
      }
      if (f.secondary.designation.trim().length > 100) {
        next['secondary.designation'] = 'Designation must be at most 100 characters.';
      }
    }

    if (f.notes.length > NOTES_MAX) {
      next.notes = `Notes must be at most ${NOTES_MAX} characters.`;
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

  private normalizePhone(value: string): string {
    return (value ?? '').replace(/\s+/g, '').trim();
  }
}
