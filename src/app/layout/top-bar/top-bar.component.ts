import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { LoginService } from '../../core/services/login.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { SettingsUiService } from '../../core/services/settings-ui.service';
import { SidebarLayoutService } from '../../core/services/sidebar-layout.service';
import { WorkspaceOrganization, WorkspaceSwitcherService } from '../../core/services/workspace-switcher.service';
import { PermissionService } from '../../core/services/permission.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';
import { AvatarComponent } from '../../shared/ui/avatar/avatar.component';
import { ThemeService } from '../../shared/theme/theme.service';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';
import { TcTranslatePipe } from '../../shared/pipes/tc-translate.pipe';
import { roleTokensFromUser, resolveWorkspaceHome } from '../../core/utils/workspace-home';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, OverlayPanelModule, AvatarComponent, GlobalSearchComponent, NotificationCenterComponent, TcTranslatePipe],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  loginService = inject(LoginService);
  themeService = inject(ThemeService);
  router = inject(Router);
  sidebarLayout = inject(SidebarLayoutService);
  workspaceService = inject(WorkspaceSwitcherService);
  private readonly orgContext = inject(OrganizationContextService);
  private readonly settingsUi = inject(SettingsUiService);
  private readonly permissionService = inject(PermissionService);
  private readonly tenantConfig = inject(TenantConfigService);

  isDarkTheme = this.themeService.isDarkTheme;
  currentUser = this.loginService.getUser();

  /** Reactive role token list so dashboard/permissions computations stay synced. */
  private readonly user = signal<any>(this.currentUser);
  readonly roleTokens = computed(() => roleTokensFromUser(this.user()));
  readonly photoUrl = computed<string | null>(() => {
    const u: any = this.user();
    return u?.studentPhoto || u?.staffPhoto || u?.parentPhoto || u?.profilePhoto || u?.adminPhoto || null;
  });
  readonly dashboardRoute = computed(() =>
    resolveWorkspaceHome(this.roleTokens(), this.loginService.getLoginContext() === 'PLATFORM')
  );
  readonly organizations = signal<WorkspaceOrganization[]>([]);
  readonly switchingOrg = signal<number | null>(null);
  readonly organizationLogoUrl = signal<string | null>(null);

  constructor() {
    this.refreshOrganizationLogo();
    if (this.canSwitchOrganization()) {
      this.workspaceService.listOrganizations().subscribe({
        next: (orgs) => {
          this.organizations.set(orgs);
          this.refreshOrganizationLogo(orgs);
          const lastSelected = Number(localStorage.getItem('lastSelectedOrganizationId') || '0');
          const target = orgs.find((org) => org.organizationId === lastSelected);
          if (target && !target.current) {
            this.switchOrganization(target);
          }
        },
        error: () => this.organizations.set([])
      });
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  navigateHome(): void {
    this.router.navigate([this.dashboardRoute()]);
  }

  toggleNavigation(): void {
    this.sidebarLayout.toggleShellNavigation();
  }

  logout(): void {
    this.loginService.logOutAndRedirect();
  }

  openSettings(): void {
    this.settingsUi.open();
  }

  openOrganizationProfile(): void {
    this.router.navigate(['/app/organization/profile']);
  }

  canOpenOrganizationProfile(): boolean {
    return ['ADMIN', 'COLLEGE_ADMIN', 'INSTITUTION_ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER']
      .some(role => this.roleTokens().includes(role));
  }

  canSwitchTenant(): boolean {
    return ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'THINKERSCAVE_INTERNAL', 'INTERNAL_TEAM']
      .some(role => this.roleTokens().includes(role));
  }

  canSwitchOrganization(): boolean {
    return this.roleTokens().includes('ORGANIZATION_OWNER');
  }

  switchOrganization(org: WorkspaceOrganization, panel?: { hide: () => void }): void {
    if (!org || this.switchingOrg() === org.organizationId) {
      return;
    }
    this.switchingOrg.set(org.organizationId);
    this.workspaceService.switchOrganization(org.organizationId).subscribe({
      next: (selected) => {
        this.loginService.setTenant(selected.tenantId);
        this.loginService.setCurrentOrganization(String(selected.organizationId));
        localStorage.setItem('lastSelectedOrganizationId', String(selected.organizationId));
        const nextOrgs = this.organizations().map((item) => ({
          ...item,
          current: item.organizationId === selected.organizationId,
          logoUrl: item.organizationId === selected.organizationId ? (selected.logoUrl ?? item.logoUrl) : item.logoUrl
        }));
        this.organizations.set(nextOrgs);
        this.refreshOrganizationLogo(nextOrgs, selected.logoUrl);
        this.permissionService.clearPermissions();
        this.tenantConfig.fetchConfigFromServer().subscribe({ error: () => void 0 });
        panel?.hide();
        this.router.navigateByUrl('/app', { replaceUrl: true });
      },
      error: () => {
        this.switchingOrg.set(null);
      },
      complete: () => {
        this.switchingOrg.set(null);
      }
    });
  }

  private refreshOrganizationLogo(orgs?: WorkspaceOrganization[], preferredLogo?: string | null): void {
    if (preferredLogo) {
      this.organizationLogoUrl.set(preferredLogo);
      return;
    }
    const list = orgs ?? this.organizations();
    const current = list.find((o) => o.current)
      ?? list.find((o) => String(o.organizationId) === this.loginService.getCurrentOrganizationId());
    if (current?.logoUrl) {
      this.organizationLogoUrl.set(current.logoUrl);
      return;
    }
    const ctxOrg = this.orgContext.getSelectedOrganization() ?? this.orgContext.getLoginTarget();
    this.organizationLogoUrl.set(ctxOrg?.logoUrl ?? null);
  }

  currentOrganizationName(): string {
    const current = this.organizations().find((o) => o.current);
    return current?.organizationName ?? this.getOrganizationName();
  }

  getUserName(): string {
    if (!this.currentUser) return 'User';
    return (this.currentUser.firstName + ' ' + (this.currentUser.lastName || '')).trim();
  }

  getRoleName(): string {
    if (!this.currentUser || !this.currentUser.roles || this.currentUser.roles.length === 0) return 'Guest';
    const role = this.currentUser.roles[0] as any;
    return (role?.roleName ?? role?.roleCode ?? role ?? 'User').toString();
  }

  getOrganizationName(): string {
    const user = this.currentUser as any;
    const org = user?.organizations?.[0] ?? user?.organization ?? user?.orgName;
    if (typeof org === 'string') return org;
    return org?.orgName ?? org?.displayName ?? localStorage.getItem('tenantId') ?? 'ThinkersCave Academy';
  }
}
