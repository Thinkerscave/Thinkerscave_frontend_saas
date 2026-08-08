import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { OrganizationProfile, OrganizationProfileDataService, OrganizationProfileUpdatePayload } from './services/organization-profile-data.service';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasTabsComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../shared/ui/saas';

@Component({
  selector: 'app-organization-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, SaasTabsComponent, SaasStatGridComponent],
  templateUrl: './organization-profile.component.html',
  styleUrl: './organization-profile.component.scss'
})
export class OrganizationProfileComponent implements OnInit {
  private readonly dataService = inject(OrganizationProfileDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: OrganizationProfile | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  dirty = false;
  activeTab = 'overview';

  readonly tabs = [
    { key: 'overview', label: 'Overview', icon: 'pi pi-id-card' },
    { key: 'contact', label: 'Contact & Address', icon: 'pi pi-map-marker' },
    { key: 'branding', label: 'Branding', icon: 'pi pi-palette' }
  ];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.dataService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          this.profile = profile;
          this.loading = false;
          this.dirty = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Organization profile could not be loaded. Please retry.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  get initials(): string {
    const name = this.profile?.organizationName || 'TC';
    return name.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'TC';
  }

  get stats(): SaasStat[] {
    const p = this.profile;
    if (!p) return [];
    return [
      { key: 'code', label: 'Organization Code', value: p.organizationCode, helper: 'Assigned at provisioning', icon: 'pi pi-hashtag', tone: 'primary' },
      { key: 'type', label: 'Institution Type', value: p.institutionType || '\u2014', helper: 'Set by platform, read-only', icon: 'pi pi-building', tone: 'info' },
      { key: 'board', label: 'Board / University', value: p.boardName || 'Not set', helper: 'Affiliation', icon: 'pi pi-graduation-cap', tone: 'success' },
      { key: 'location', label: 'Location', value: [p.city, p.state].filter(Boolean).join(', ') || 'Not set', helper: p.country || '', icon: 'pi pi-map-marker', tone: 'neutral' }
    ];
  }

  markDirty(): void { this.dirty = true; this.successMessage = ''; }

  save(): void {
    if (!this.profile || !this.dirty || this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    const payload: OrganizationProfileUpdatePayload = {
      organizationName: this.profile.organizationName,
      shortName: this.profile.shortName,
      boardName: this.profile.boardName,
      email: this.profile.email,
      mobileNumber: this.profile.mobileNumber,
      alternateMobileNumber: this.profile.alternateMobileNumber,
      website: this.profile.website,
      addressLine1: this.profile.addressLine1,
      addressLine2: this.profile.addressLine2,
      city: this.profile.city,
      state: this.profile.state,
      country: this.profile.country,
      postalCode: this.profile.postalCode,
      logoUrl: this.profile.logoUrl
    };
    this.dataService.updateProfile(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          this.profile = profile;
          this.saving = false;
          this.dirty = false;
          this.successMessage = 'Organization profile updated successfully.';
          this.cdr.markForCheck();
        },
        error: () => {
          this.saving = false;
          this.errorMessage = 'Organization profile could not be saved. Please retry.';
          this.cdr.markForCheck();
        }
      });
  }
}
