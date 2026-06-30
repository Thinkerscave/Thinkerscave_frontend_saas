import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { AccessDashboardSummary } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-access-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent],
  templateUrl: './access-dashboard.component.html',
  styleUrl: './access-dashboard.component.scss'
})
export class AccessDashboardComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  loading = true;
  errorMessage = '';
  summary: AccessDashboardSummary | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getDashboardSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: summary => {
        this.summary = summary;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load access dashboard. Verify organization context and admin permissions.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get stats(): SaasStat[] {
    const s = this.summary;
    if (!s) return [];
    return [
      { key: 'roles', label: 'Roles', value: s.totalRoles, helper: `${s.activeRoles} active`, icon: 'pi pi-user-edit', tone: 'primary' },
      { key: 'users', label: 'Users', value: s.totalUsers, helper: `${s.activeUsers} active`, icon: 'pi pi-users', tone: 'success' },
      { key: 'menus', label: 'Menu Pages', value: s.totalMenus, helper: `${s.activeMenus} active`, icon: 'pi pi-th-large', tone: 'info' },
      { key: 'locked', label: 'Locked Accounts', value: s.lockedUsers, helper: 'Needs review', icon: 'pi pi-lock', tone: s.lockedUsers ? 'warning' : 'neutral' }
    ];
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
