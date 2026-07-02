import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { OrganizationContextService, DevOrganization } from '../../core/services/organization-context.service';

@Component({
  selector: 'app-org-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, InputTextModule, ButtonModule],
  templateUrl: './org-select.component.html',
  styleUrl: './org-select.component.scss'
})
export class OrgSelectComponent {
  private readonly orgContext = inject(OrganizationContextService);
  private readonly router = inject(Router);

  readonly organizations = this.orgContext.devOrganizations;
  readonly query = signal('');
  readonly selected = signal<DevOrganization | null>(null);
  readonly dropdownOpen = signal(false);

  filteredOrgs(): DevOrganization[] {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      return this.organizations;
    }
    return this.organizations.filter(o =>
      o.name.toLowerCase().includes(q) || o.tenantId.toLowerCase().includes(q)
    );
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.dropdownOpen.set(true);
  }

  selectOrg(org: DevOrganization): void {
    this.selected.set(org);
    this.query.set(org.name);
    this.dropdownOpen.set(false);
  }

  continue(): void {
    const org = this.selected();
    if (!org) {
      return;
    }
    this.orgContext.setSelectedOrganization(org);
    this.router.navigate(['/auth/login']);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
