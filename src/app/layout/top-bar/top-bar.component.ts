import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { LoginService } from '../../core/services/login.service';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';
import { ThemeService } from '../../shared/theme/theme.service';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, OverlayPanelModule, GlobalSearchComponent, NotificationCenterComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  loginService = inject(LoginService);
  themeService = inject(ThemeService);
  router = inject(Router);

  isDarkTheme = this.themeService.isDarkTheme;
  currentUser = this.loginService.getUser();

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  navigateHome() {
    this.router.navigate(['/app']);
  }

  logout() {
    this.loginService.logOutAndRedirect();
  }
  
  openSettings() {
    this.router.navigate(['/app/settings']);
  }

  openOrganizationProfile() {
    this.router.navigate(['/app/organization-profile']);
  }

  canOpenOrganizationProfile(): boolean {
    const roles = this.currentRoleTokens();
    return ['ADMIN', 'COLLEGE_ADMIN', 'INSTITUTION_ADMIN', 'ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER']
      .some(role => roles.includes(role));
  }
  
  getInitials(name: string | undefined | null): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
    return org?.orgName ?? org?.displayName ?? localStorage.getItem('tenantId') ?? 'ThinkerScave Academy';
  }

  private currentRoleTokens(): string[] {
    const user = this.currentUser as any;
    const roles = [user?.role, user?.roleCode, user?.roleName, ...(Array.isArray(user?.roles) ? user.roles : [])];
    return roles
      .flatMap((role: any) => [role?.roleCode, role?.roleName, role?.name, role])
      .filter(Boolean)
      .map((role: any) => String(role).trim().replace(/^ROLE_/i, '').replace(/[\s-]+/g, '_').toUpperCase());
  }
}
