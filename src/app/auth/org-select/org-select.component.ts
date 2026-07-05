import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import {
  DevOrganization,
  OrganizationContextService,
  THINKERS_DEPARTMENT
} from '../../core/services/organization-context.service';

@Component({
  selector: 'app-org-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, ButtonModule],
  templateUrl: './org-select.component.html',
  styleUrl: './org-select.component.scss'
})
export class OrgSelectComponent {
  private readonly orgContext = inject(OrganizationContextService);
  private readonly router = inject(Router);

  readonly thinkersDepartment = THINKERS_DEPARTMENT;
  readonly query = signal('');
  readonly selected = signal<DevOrganization | null>(null);
  readonly platformSelected = signal(false);

  readonly displayOrgs = computed(() => {
    const rawQuery = this.query();
    const q = (rawQuery ?? '').toString().trim().toLowerCase();
    const pool = q
      ? this.orgContext.devOrganizations.filter(
          (o) =>
            (o.name ?? '').toLowerCase().includes(q) ||
            (o.location ?? '').toLowerCase().includes(q) ||
            (o.tenantId ?? '').toLowerCase().includes(q)
        )
      : this.orgContext.getRecentOrganizations();

    return pool.length ? pool : this.orgContext.devOrganizations;
  });

  onSearch(value: string): void {
    this.query.set(value);
    this.selected.set(null);
    this.platformSelected.set(false);
  }

  selectPlatform(): void {
    this.platformSelected.set(true);
    this.selected.set(null);
    this.query.set('');
  }

  selectOrg(org: DevOrganization): void {
    this.platformSelected.set(false);
    this.selected.set(org);
    this.query.set(org.name);
  }

  continue(): void {
    if (this.platformSelected()) {
      this.orgContext.setPlatformLogin();
      this.router.navigate(['/auth/login']);
      return;
    }

    const org = this.selected();
    if (!org) {
      return;
    }
    this.orgContext.setSelectedOrganization(org);
    this.router.navigate(['/auth/login']);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  isSelected(org: DevOrganization): boolean {
    return this.selected()?.id === org.id;
  }
}
