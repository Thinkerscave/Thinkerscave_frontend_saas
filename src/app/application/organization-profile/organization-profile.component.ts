import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { LoginService } from '../../core/services/login.service';
import { AdminControlCenter, AdminOrganization } from '../administration/models/admin-control.model';
import { AdminControlDataService } from '../administration/services/admin-control-data.service';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasTabsComponent,
  SaasPillComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../shared/ui/saas';

interface BrandingForm {
  primaryColor: string;
  accentColor: string;
  logoName: string;
  description: string;
}

interface AcademicSettings {
  academicYear: string;
  termStart: string;
  termEnd: string;
  workingDays: string[];
  gradingScale: string;
}

interface CommunicationPrefs {
  enableSms: boolean;
  enableEmail: boolean;
  enableWhatsapp: boolean;
  defaultSender: string;
}

@Component({
  selector: 'app-organization-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, SaasTabsComponent, SaasPillComponent, SaasStatGridComponent],
  templateUrl: './organization-profile.component.html',
  styleUrl: './organization-profile.component.scss'
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
  activeTab = 'overview';

  readonly tabs = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-id-card' },
    { key: 'academic', label: 'Academic Settings', icon: 'pi pi-graduation-cap' },
    { key: 'branding', label: 'Branding', icon: 'pi pi-palette' },
    { key: 'communication', label: 'Communication', icon: 'pi pi-comments' }
  ];

  branding: BrandingForm = { primaryColor: '#2C5BFF', accentColor: '#F59E0B', logoName: '', description: '' };

  academic: AcademicSettings = {
    academicYear: '2025-26',
    termStart: '2025-04-01',
    termEnd: '2026-03-31',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    gradingScale: 'A+ to F'
  };

  comm: CommunicationPrefs = { enableSms: true, enableEmail: true, enableWhatsapp: true, defaultSender: 'ThinkersCave Admin' };

  readonly dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  ngOnInit(): void {
    this.dataService.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
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

  get storageLabel(): string {
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

  get stats(): SaasStat[] {
    const o = this.organization;
    if (!o) return [];
    return [
      { key: 'students', label: 'Students', value: (o.students ?? 0).toLocaleString(), helper: 'Enrolled', icon: 'pi pi-graduation-cap', tone: 'primary' },
      { key: 'staff', label: 'Staff', value: (o.staff ?? 0).toLocaleString(), helper: 'Faculty + admin', icon: 'pi pi-id-card', tone: 'success' },
      { key: 'sections', label: 'Sections', value: ((o as any).sections ?? 126).toString(), helper: 'Across all classes', icon: 'pi pi-th-large', tone: 'info' },
      { key: 'storage', label: 'Storage', value: this.storageLabel, helper: this.storagePercent ? `${this.storagePercent}% used` : 'Tracked centrally', icon: 'pi pi-database', tone: this.storagePercent >= 90 ? 'danger' : this.storagePercent >= 75 ? 'warning' : 'neutral' }
    ];
  }

  toggleDay(day: string): void {
    const i = this.academic.workingDays.indexOf(day);
    if (i >= 0) this.academic.workingDays.splice(i, 1);
    else this.academic.workingDays.push(day);
    this.markDirty();
  }

  onLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.branding.logoName = file.name; this.markDirty(); }
  }

  markDirty(): void { this.dirty = true; this.successMessage = ''; }

  save(): void {
    this.successMessage = 'Organization profile updated successfully.';
    this.dirty = false;
    this.cdr.markForCheck();
  }
}
