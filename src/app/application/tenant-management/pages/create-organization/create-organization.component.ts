import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminControlCenter, AdminOrganizationCreatePayload } from '../../../administration/models/admin-control.model';
import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';
import { PLAN_DEFS, PlanDefinition } from '../../data/feature-catalog';
import { MatrixTier } from '../../data/feature-catalog';

interface OnboardingForm {
  organizationType: string;
  organizationName: string;
  country: string;
  city: string;
  state: string;
  website: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  planId: MatrixTier;
  featureKeys: string[];
}

interface DerivedIdentity {
  tenantCode: string;
  subdomain: string;
  tenantIdentifier: string;
  slug: string;
  username: string;
  tempPassword: string;
  defaultRole: string;
}

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-organization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrganizationComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminData = inject(AdminControlDataService);

  workspace: AdminControlCenter | null = null;
  loading = true;
  submitting = false;
  successPayload: { credentials: DerivedIdentity; form: OnboardingForm } | null = null;
  errorMessage = '';

  readonly institutionTypes = ['University', 'College', 'School', 'Coaching Institute', 'Training Academy', 'Other'];
  readonly countries = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'Other'];
  readonly plans: PlanDefinition[] = PLAN_DEFS;

  form: OnboardingForm = {
    organizationType: 'College',
    organizationName: '',
    country: 'India',
    city: '',
    state: '',
    website: '',
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    planId: 'professional',
    featureKeys: []
  };

  ngOnInit(): void {
    this.adminData.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  get featureCatalog(): { key: string; label: string }[] {
    return (this.workspace?.menuSections || []).map(m => ({ key: m.menuCode, label: m.name }));
  }

  get identity(): DerivedIdentity {
    const name = this.form.organizationName.trim();
    const slug = this.slugify(name) || 'new-tenant';
    const code = (name ? name.replace(/[^A-Za-z0-9]+/g, '').slice(0, 4).toUpperCase() : 'TENT') + '-' + this.randomDigits(4);
    return {
      tenantCode: code,
      subdomain: `${slug}.thinkerscave.app`,
      tenantIdentifier: `tnt_${slug.replace(/-/g, '_')}`,
      slug,
      username: this.form.ownerEmail ? this.form.ownerEmail.split('@')[0].toLowerCase() : `${slug}.admin`,
      tempPassword: this.generatePassword(),
      defaultRole: 'COLLEGE_ADMIN'
    };
  }

  private cachedIdentity: DerivedIdentity | null = null;
  derived(): DerivedIdentity {
    if (!this.cachedIdentity || this.cachedIdentity.slug !== this.slugify(this.form.organizationName.trim())) {
      this.cachedIdentity = this.identity;
    }
    if (this.form.ownerEmail && this.cachedIdentity.username !== this.form.ownerEmail.split('@')[0].toLowerCase()) {
      this.cachedIdentity = { ...this.cachedIdentity, username: this.form.ownerEmail.split('@')[0].toLowerCase() };
    }
    return this.cachedIdentity;
  }

  regeneratePassword(): void {
    if (this.cachedIdentity) this.cachedIdentity = { ...this.cachedIdentity, tempPassword: this.generatePassword() };
    this.cdr.markForCheck();
  }

  selectPlan(planId: MatrixTier): void {
    this.form.planId = planId;
    if (planId !== 'custom') this.form.featureKeys = [];
    this.cdr.markForCheck();
  }

  toggleFeature(key: string): void {
    const i = this.form.featureKeys.indexOf(key);
    if (i >= 0) this.form.featureKeys.splice(i, 1);
    else this.form.featureKeys.push(key);
  }

  get canSubmit(): boolean {
    return !!(
      this.form.organizationName.trim() &&
      this.form.organizationType &&
      this.form.country &&
      this.form.city.trim() &&
      this.form.ownerName.trim() &&
      this.form.ownerEmail.includes('@') &&
      this.form.planId
    );
  }

  submit(): void {
    if (!this.canSubmit || this.submitting) return;
    this.submitting = true;
    this.errorMessage = '';
    const identity = this.derived();
    const [firstName, ...rest] = this.form.ownerName.trim().split(/\s+/);
    const payload: AdminOrganizationCreatePayload = {
      tenantName: identity.slug,
      displayName: this.form.organizationName.trim(),
      adminEmail: this.form.ownerEmail.trim(),
      adminPassword: identity.tempPassword,
      adminFirstName: firstName,
      adminLastName: rest.join(' ') || firstName,
      adminMobile: this.form.ownerMobile.trim() || undefined,
      organizationType: this.form.organizationType,
      subscriptionType: this.planLabel(this.form.planId),
      city: this.form.city.trim(),
      state: this.form.state.trim()
    };
    this.adminData.createOrganization(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successPayload = { credentials: identity, form: { ...this.form } };
          this.submitting = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.submitting = false;
          this.errorMessage = err?.error?.message || 'Provisioning failed. Verify owner email is unique and retry.';
          this.cdr.markForCheck();
        }
      });
  }

  planLabel(id: MatrixTier): string {
    return this.plans.find(p => p.id === id)?.name ?? 'Custom';
  }

  cancel(): void {
    this.router.navigate(['/app/tenant-management/organizations']);
  }

  goToWorkspace(): void {
    this.router.navigate(['/app/tenant-management/organizations']);
  }

  private slugify(value: string): string {
    return value.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private randomDigits(len: number): string {
    let out = '';
    for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10);
    return out;
  }

  private generatePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digit = '23456789';
    const special = '!@#$%&*';
    const all = upper + lower + digit + special;
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
    let pwd = pick(upper) + pick(lower) + pick(digit) + pick(special);
    for (let i = 0; i < 8; i++) pwd += pick(all);
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  }
}
