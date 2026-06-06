import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { AdminControlCenter, AdminPermissionMatrixRow, AdminUserAccess } from '../../../administration/models/admin-control.model';
import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasTabsComponent,
  SaasPillComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../../../shared/ui/saas';

interface PermRow { module: string; capabilities: ('view' | 'manage' | 'approve')[]; }
interface RolePermRow { role: string; rows: PermRow[]; }

@Component({
  selector: 'app-access-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent, SaasTabsComponent, SaasPillComponent, SaasStatGridComponent],
  templateUrl: './access-control.component.html',
  styleUrl: './access-control.component.scss'
})
export class AccessControlComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly adminData = inject(AdminControlDataService);

  loading = true;
  workspace: AdminControlCenter | null = null;
  matrix: AdminPermissionMatrixRow[] = [];
  users: AdminUserAccess[] = [];

  activeTab = 'responsibilities';
  readonly tabs = [
    { key: 'responsibilities', label: 'Responsibilities', icon: 'pi pi-user-edit' },
    { key: 'assignment', label: 'Permission Assignment', icon: 'pi pi-key' },
    { key: 'overrides', label: 'User Overrides', icon: 'pi pi-shield' }
  ];

  readonly modules = ['Academics', 'Attendance', 'Examinations', 'Fee Management', 'Communication', 'Reports', 'Administration'];
  readonly capabilities = ['view', 'manage', 'approve'] as const;

  defaultRoles = ['Teacher', 'Senior Teacher', 'Principal', 'Coordinator', 'Accountant'];
  selectedUser: AdminUserAccess | null = null;

  ngOnInit(): void {
    this.adminData.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
          this.matrix = ws?.permissionMatrix || [];
          this.users = ws?.users || [];
          this.selectedUser = this.users[0] || null;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  get stats(): SaasStat[] {
    return [
      { key: 'roles', label: 'Total Roles', value: (this.workspace?.roles?.length ?? 0).toString(), helper: 'Configured', icon: 'pi pi-user-edit', tone: 'primary' },
      { key: 'users', label: 'Total Users', value: this.users.length.toString(), helper: 'Active accounts', icon: 'pi pi-users', tone: 'success' },
      { key: 'pages', label: 'Pages', value: (this.workspace?.menuSections?.reduce((sum, s) => sum + (s.totalPages || 0), 0) ?? 0).toString(), helper: 'Total navigable pages', icon: 'pi pi-th-large', tone: 'info' },
      { key: 'overrides', label: 'User Overrides', value: '12', helper: 'Custom permissions', icon: 'pi pi-shield', tone: 'warning' }
    ];
  }

  hasCapability(roleName: string, module: string, capability: 'view' | 'manage' | 'approve'): boolean {
    // Seed-only sample logic: senior/principal get more
    if (capability === 'approve') return roleName.toLowerCase().includes('principal') || roleName.toLowerCase().includes('senior');
    if (capability === 'manage') return !roleName.toLowerCase().includes('teacher') || roleName.toLowerCase().includes('senior');
    return true; // view default for all
  }

  selectUser(u: AdminUserAccess): void { this.selectedUser = u; }

  trackByRole(_: number, r: { role: string }): string { return r.role; }
}
