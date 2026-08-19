import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { isFeatureEnabled } from '../../core/config/feature-flags';

interface WorkspaceTab {
  label: string;
  icon: string;
  route: string;
}

interface WorkspaceTabConfig {
  key: string;
  label: string;
  eyebrow: string;
  icon: string;
  matcher: RegExp;
  tabs: WorkspaceTab[];
}

@Component({
  selector: 'app-workspace-tabs',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './workspace-tabs.component.html',
  styleUrl: './workspace-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceTabsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  currentUrl = '';

  readonly workspaces: WorkspaceTabConfig[] = [
    {
      key: 'students',
      label: 'Student Workspace',
      eyebrow: 'Lifecycle',
      icon: 'pi pi-users',
      matcher: /^\/app\/students(?:\/|$)/,
      tabs: [
        { label: 'Students', icon: 'pi pi-users', route: '/app/students/directory' },
        { label: 'Academic Movement', icon: 'pi pi-arrow-up-right', route: '/app/students/academic-movement' },
        { label: 'Student Movement', icon: 'pi pi-send', route: '/app/students/student-movement' },
        { label: 'Documents', icon: 'pi pi-folder', route: '/app/students/documents' },
        { label: 'Alumni', icon: 'pi pi-verified', route: '/app/students/alumni' }
      ]
    },
    {
      key: 'staff',
      label: 'Staff Workspace',
      eyebrow: 'Workforce',
      icon: 'pi pi-id-card',
      matcher: /^\/app\/staff(?:\/|$)/,
      tabs: [
        { label: 'Dashboard', icon: 'pi pi-chart-line', route: '/app/staff/dashboard' },
        { label: 'Directory', icon: 'pi pi-list', route: '/app/staff/directory' },
        { label: 'Operations', icon: 'pi pi-briefcase', route: '/app/staff/operations' }
      ]
    },
    {
      key: 'academics',
      label: 'Academics Workspace',
      eyebrow: 'Learning Ops',
      icon: 'pi pi-book',
      matcher: /^\/app\/academics(?:\/|$)/,
      tabs: [
        { label: 'Dashboard', icon: 'pi pi-chart-line', route: '/app/academics/dashboard' },
        { label: 'Years', icon: 'pi pi-calendar', route: '/app/academics/years' },
        { label: 'Classes', icon: 'pi pi-sitemap', route: '/app/academics/classes' },
        { label: 'Subjects', icon: 'pi pi-book', route: '/app/academics/subjects' },
        { label: 'Syllabus', icon: 'pi pi-file-edit', route: '/app/academics/syllabus' },
        { label: 'Timetable', icon: 'pi pi-clock', route: '/app/academics/timetable' },
        { label: 'Settings', icon: 'pi pi-cog', route: '/app/academics/settings' }
      ]
    },
    ...(isFeatureEnabled('feeManagementEnabled') ? [{
      key: 'finance',
      label: 'Finance Workspace',
      eyebrow: 'Fees',
      icon: 'pi pi-wallet',
      matcher: /^\/app\/(fees|reports)(?:\/|$)/,
      tabs: [
        { label: 'Dashboard', icon: 'pi pi-chart-line', route: '/app/fees/dashboard' },
        { label: 'Setup', icon: 'pi pi-cog', route: '/app/fees/setup' },
        { label: 'Contracts', icon: 'pi pi-file', route: '/app/fees/contracts' },
        { label: 'Ledger', icon: 'pi pi-book', route: '/app/fees/ledger' },
        { label: 'Payments', icon: 'pi pi-credit-card', route: '/app/fees/payments' },
        { label: 'Reports', icon: 'pi pi-chart-bar', route: '/app/fees/reports' },
        { label: 'Audit', icon: 'pi pi-history', route: '/app/fees/audit' }
      ]
    } satisfies WorkspaceTabConfig] : []),
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      eyebrow: 'Commercial',
      icon: 'pi pi-credit-card',
      matcher: /^\/app\/tenant-management\/(subscription-plans|promotions)(?:\/|$)/,
      tabs: [
        { label: 'Subscription Plans', icon: 'pi pi-credit-card', route: '/app/tenant-management/subscription-plans' },
        { label: 'Promotions', icon: 'pi pi-tag', route: '/app/tenant-management/promotions' }
      ]
    },
    {
      key: 'tenant-management',
      label: 'Tenant Management',
      eyebrow: 'Operations',
      icon: 'pi pi-server',
      matcher: /^\/app\/tenant-management\/(tenant-health|platform-health|migration-center|audit-center)(?:\/|$)/,
      tabs: [
        { label: 'Tenant Health', icon: 'pi pi-heart', route: '/app/tenant-management/tenant-health' },
        { label: 'Migration Center', icon: 'pi pi-sync', route: '/app/tenant-management/migration-center' },
        { label: 'Audit Center', icon: 'pi pi-history', route: '/app/tenant-management/audit-center' }
      ]
    },
    {
      key: 'platform-catalog',
      label: 'Platform Catalog',
      eyebrow: 'Catalogue',
      icon: 'pi pi-th-large',
      matcher: /^\/app\/tenant-management\/(menus|roles|feature-catalog)(?:\/|$)/,
      tabs: [
        { label: 'Menu Management', icon: 'pi pi-sitemap', route: '/app/tenant-management/menus' },
        { label: 'Role Management', icon: 'pi pi-user-edit', route: '/app/tenant-management/roles' },
        { label: 'Feature Catalog', icon: 'pi pi-box', route: '/app/tenant-management/feature-catalog' }
      ]
    },
    {
      key: 'admin',
      label: 'Administration Workspace',
      eyebrow: 'Control Center',
      icon: 'pi pi-shield',
      matcher: /^\/app\/admin(?:\/|$)/,
      tabs: [
        { label: 'Dashboard', icon: 'pi pi-chart-line', route: '/app/admin/dashboard' },
        { label: 'Access', icon: 'pi pi-lock', route: '/app/admin/access' },
        { label: 'Monitoring', icon: 'pi pi-server', route: '/app/admin/monitoring' },
        { label: 'Audit', icon: 'pi pi-history', route: '/app/admin/audit' }
      ]
    }
  ];

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(event => {
      this.currentUrl = (event as NavigationEnd).urlAfterRedirects;
      this.cdr.markForCheck();
    });
  }

  get activeWorkspace(): WorkspaceTabConfig | null {
    const url = this.currentUrl.split('?')[0].split('#')[0];
    return this.workspaces.find(workspace => workspace.matcher.test(url)) ?? null;
  }
}
