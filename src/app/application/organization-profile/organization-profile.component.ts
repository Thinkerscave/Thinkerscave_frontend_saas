import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../../core/services/login.service';
import { AdminControlCenter, AdminMenuSection, AdminOrganization } from '../administration/models/admin-control.model';
import { AdminControlDataService } from '../administration/services/admin-control-data.service';

interface BrandingForm {
  primaryColor: string;
  accentColor: string;
  logoName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  description: string;
}

@Component({
  selector: 'app-organization-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organization-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationProfileComponent implements OnInit {
  private readonly dataService = inject(AdminControlDataService);
  private readonly loginService = inject(LoginService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  workspace: AdminControlCenter | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';
  dirty = false;

  branding: BrandingForm = {
    primaryColor: '#4f46e5',
    accentColor: '#f97316',
    logoName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    description: ''
  };

  ngOnInit(): void {
    this.dataService.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
          const org = this.organization;
          if (org) {
            this.branding.contactEmail = org.ownerEmail || '';
            this.branding.contactAddress = [org.city, org.state].filter(Boolean).join(', ');
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Organization profile could not be loaded. Please retry.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  get organization(): AdminOrganization | null {
    const orgs = this.workspace?.organizations ?? [];
    if (!orgs.length) return null;
    const user = this.loginService.getUser() as any;
    const tenantId = (localStorage.getItem('tenantId') ?? sessionStorage.getItem('tenantId') ?? '').toLowerCase();
    const names = [
      user?.orgName, user?.organization?.orgName, user?.organization?.displayName,
      ...(Array.isArray(user?.organizations) ? user.organizations.map((o: any) => typeof o === 'string' ? o : (o?.orgName ?? o?.displayName ?? o?.name)) : [])
    ].filter(Boolean).map((v: string) => v.toLowerCase());
    return orgs.find(o => {
      const search = [o.orgName, o.orgCode, o.tenantId].filter(Boolean).map(v => String(v).toLowerCase());
      return search.some(v => v === tenantId || names.some(n => v.includes(n) || n.includes(v)));
    }) ?? orgs[0];
  }

  get initials(): string {
    const name = this.organization?.brandName || this.organization?.orgName || 'TC';
    return name.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'TC';
  }

  get allowedFeatures(): AdminMenuSection[] {
    return (this.workspace?.menuSections ?? []).filter(s => s.active !== false).slice(0, 12);
  }

  get storageDisplay(): string {
    const used = this.organization?.storageUsedMb ?? 0;
    const limit = this.organization?.storageLimitMb ?? 0;
    if (limit > 0) return `${(used / 1024).toFixed(1)} / ${(limit / 1024).toFixed(1)} GB`;
    return `${(used / 1024).toFixed(1)} GB used`;
  }

  get storagePercent(): number {
    const used = this.organization?.storageUsedMb ?? 0;
    const limit = this.organization?.storageLimitMb ?? 0;
    return limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  }

  get statusLabel(): string {
    return this.organization?.active === false ? 'Suspended' : 'Active';
  }

  get statusClass(): string {
    return this.organization?.active === false ? 'suspended' : 'active';
  }

  onLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.branding.logoName = file.name;
      this.markDirty();
    }
  }

  markDirty(): void {
    this.dirty = true;
    this.successMessage = '';
  }

  save(): void {
    this.successMessage = 'Branding and contact preferences saved.';
    this.dirty = false;
    this.cdr.markForCheck();
  }
}
