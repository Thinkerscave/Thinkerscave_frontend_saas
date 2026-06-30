import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { debounceTime, Subject } from 'rxjs';

import { AccessUser, UserStatus } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { roleTypeLabel, userDisplayName, userInitials, userStatusLabel, userStatusTone } from '../../utils/access-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-users-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, ToastModule,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly search$ = new Subject<string>();

  loading = true;
  errorMessage = '';
  search = '';
  statusFilter: 'all' | UserStatus = 'all';
  users: AccessUser[] = [];
  totalRecords = 0;
  page = 0;
  pageSize = 20;

  readonly userDisplayName = userDisplayName;
  readonly userInitials = userInitials;
  readonly userStatusLabel = userStatusLabel;
  readonly userStatusTone = userStatusTone;
  readonly roleTypeLabel = roleTypeLabel;

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.load();
  }

  get stats(): SaasStat[] {
    const active = this.users.filter(u => u.status === 'ACTIVE').length;
    const locked = this.users.filter(u => u.accountLocked || u.status === 'LOCKED').length;
    return [
      { key: 'total', label: 'Users', value: this.totalRecords, icon: 'pi pi-users', tone: 'primary' },
      { key: 'active', label: 'Active (page)', value: active, icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'locked', label: 'Locked (page)', value: locked, icon: 'pi pi-lock', tone: 'warning' }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.searchUsers(this.api.organizationId(), {
      search: this.search.trim() || undefined,
      status: this.statusFilter === 'all' ? undefined : this.statusFilter
    }, this.page, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.users = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.users = [];
        this.errorMessage = 'Could not load users.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(): void { this.search$.next(this.search); }
  onFilterChange(): void { this.page = 0; this.load(); }

  openPermissions(user: AccessUser): void {
    this.router.navigate(['/app/access-management/users', user.id, 'permissions']);
  }

  toggleLock(user: AccessUser): void {
    const locked = user.accountLocked || user.status === 'LOCKED';
    const action = locked ? this.api.unlockUser(user.id) : this.api.lockUser(user.id);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.messages.add({ severity: 'success', summary: 'Updated', detail: 'User lock status changed.' }); this.load(); },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update user.' })
    });
  }

  trackById(_: number, u: AccessUser): number { return u.id; }

  formatRoles(user: AccessUser): string {
    const names = (user.roles ?? []).map(r => r.roleName).filter(Boolean);
    return names.length ? names.join(', ') : '—';
  }
}
