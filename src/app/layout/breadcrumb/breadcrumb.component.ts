import { CommonModule } from '@angular/common';

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NavigationEnd, NavigationStart, Router } from '@angular/router';

import { filter } from 'rxjs';

import { MenuItem } from 'primeng/api';

import { BreadcrumbModule } from 'primeng/breadcrumb';

import { AppPageHeader, BreadCrumbService } from '../../core/services/bread-crumb.service';
import { LoginService } from '../../core/services/login.service';
import { workspaceHomeForUser } from '../../core/utils/workspace-home';



interface ResolvedCrumb {

  label: string;

  link: string[] | null;

}



@Component({

  selector: 'app-breadcrumb',

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [CommonModule, BreadcrumbModule],

  templateUrl: './breadcrumb.component.html',

  styleUrl: './breadcrumb.component.scss'

})

export class BreadcrumbComponent implements OnInit {

  items: MenuItem[] = [];

  home: MenuItem = { icon: 'pi pi-home', routerLink: ['/app'] };

  title = 'Dashboard';

  subtitle: string | null = null;



  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly pageHeaderService = inject(BreadCrumbService);
  private readonly loginService = inject(LoginService);



  private pageOverride: AppPageHeader | null = null;

  private routeSubtitle: string | null = null;

  private resolvedCrumbs: ResolvedCrumb[] = [];



  ngOnInit(): void {
    this.home = {
      icon: 'pi pi-home',
      routerLink: [workspaceHomeForUser(this.loginService.getUser(), this.loginService.getLoginContext() === 'PLATFORM')]
    };

    this.pageHeaderService.pageHeader$

      .pipe(takeUntilDestroyed(this.destroyRef))

      .subscribe(header => {

        this.pageOverride = header;

        this.applyHeader();

        this.cdr.markForCheck();

      });



    this.refreshBreadcrumb();



    this.router.events.pipe(

      filter(event => event instanceof NavigationStart),

      takeUntilDestroyed(this.destroyRef)

    ).subscribe(() => {

      this.pageOverride = null;

      this.pageHeaderService.clearPageHeader();

    });



    this.router.events.pipe(

      filter(event => event instanceof NavigationEnd),

      takeUntilDestroyed(this.destroyRef)

    ).subscribe(() => {

      this.refreshBreadcrumb();

    });

  }



  private refreshBreadcrumb(): void {

    const segments = this.urlSegments(this.router.url);

    this.resolvedCrumbs = this.collectRouteCrumbs();

    if (segments[0] === 'app' && segments[1] === 'tenant-management') {
      const labels = this.tenantManagementLabels(segments).filter(Boolean);
      if (labels.length) {
        this.resolvedCrumbs = labels.map((label, index) => ({
          label,
          link: index === labels.length - 1 ? null : this.tenantCrumbLink(label)
        }));
      }
    }

    if (!this.resolvedCrumbs.length) {

      const labels = this.routeLabels(segments);

      this.resolvedCrumbs = labels.map((label, index) => ({

        label,

        link: index < labels.length - 1 ? this.crumbLink(segments, index) : null

      }));

    }

    this.applyHeader();

    this.cdr.markForCheck();

  }



  private applyHeader(): void {

    const labels = this.resolvedCrumbs.map(crumb => crumb.label);

    this.title = this.pageOverride?.title ?? labels.at(-1) ?? 'Dashboard';

    this.subtitle = this.pageOverride?.subtitle ?? this.routeSubtitle ?? null;



    this.items = this.resolvedCrumbs.map((crumb, index) => {

      const isLast = index === this.resolvedCrumbs.length - 1;

      if (isLast || !crumb.link) {

        return { label: crumb.label };

      }

      return { label: crumb.label, routerLink: crumb.link };

    });

  }



  /** Walk the activated route tree — single source of truth from route `data`. */

  private collectRouteCrumbs(): ResolvedCrumb[] {

    const crumbs: ResolvedCrumb[] = [];

    const pathParts: string[] = [];

    this.routeSubtitle = null;



    let route = this.router.routerState.root;

    while (route.firstChild) {

      route = route.firstChild;

      const snap = route.snapshot;

      pathParts.push(...snap.url.map(segment => segment.path));



      const label = snap.data['breadcrumb'] as string | undefined;

      if (label) {

        const explicitLink = snap.data['breadcrumbLink'] as string[] | undefined;

        crumbs.push({

          label,

          link: explicitLink ?? this.pathLink(pathParts)

        });

      }



      const subtitle = snap.data['pageSubtitle'] as string | undefined;

      if (subtitle) {

        this.routeSubtitle = subtitle;

      }

    }



    if (crumbs.length) {

      crumbs[crumbs.length - 1].link = null;

    }



    return crumbs;

  }



  private pathLink(pathParts: string[]): string[] {

    return ['/' + pathParts.filter(Boolean).join('/')];

  }



  private urlSegments(url: string): string[] {

    const cleanUrl = url.split('?')[0].split('#')[0];

    return cleanUrl.split('/').filter(Boolean);

  }



  /** URL fallback when route `data` is not configured. */

  private routeLabels(segments: string[]): string[] {

    if (!segments.length || (segments[0] === 'app' && segments.length === 1)) {

      return ['Dashboard'];

    }



    if (segments[0] === 'public') {

      return ['Public', this.titleCase(segments[1] ?? 'admission')];

    }



    if (segments[0] !== 'app') {

      return [this.titleCase(segments[0] ?? 'Page')];

    }



    const workspace = segments[1] ?? '';



    if (!workspace || workspace === 'dashboard') {

      return ['Dashboard'];

    }



    if (workspace === 'tenant-management') {

      return this.tenantManagementLabels(segments);

    }



    if (workspace === 'access-management') {

      return this.accessManagementLabels(segments);

    }



    const workspaceLabels: Record<string, string> = {

      platform: 'Tenant Management',

      organization: 'Organization Profile',

      'organization-profile': 'Organization Profile',

      admin: 'Administration',

      students: 'Students',

      staff: 'Staff',

      attendance: 'Attendance',

      inquiry: 'Admissions',

      admissions: 'Admissions',

      academics: 'Academics',

      fees: 'Finance',

      reports: 'Finance',

      profile: 'Profile',

      settings: 'Settings',

      communication: 'Communication'

    };



    const rootLabel = workspaceLabels[workspace] ?? this.titleCase(workspace);

    const page = segments[2] ?? '';

    const pageLabel = this.routePageLabel(workspace, page);

    return pageLabel ? [rootLabel, pageLabel] : [rootLabel];

  }



  private tenantManagementLabels(segments: string[]): string[] {

    const page = segments[2] ?? '';

    const child = segments[3] ?? '';

    const grandchild = segments[4] ?? '';

    const catalogPages = new Set(['menus', 'roles', 'feature-catalog']);
    const subscriptionPages = new Set(['subscription-plans', 'promotions']);
    const tenantOpsPages = new Set(['tenant-health', 'platform-health', 'migration-center', 'audit-center']);
    const standalonePages = new Set(['dashboard', 'customers', 'organizations']);
    const root = catalogPages.has(page)
      ? 'Platform Catalog'
      : subscriptionPages.has(page)
        ? 'Subscriptions'
        : tenantOpsPages.has(page)
          ? 'Tenant Management'
          : standalonePages.has(page)
            ? ''
            : 'Tenant Management';



    const pageLabels: Record<string, string> = {

      dashboard: 'Dashboard',

      customers: 'Customers',

      organizations: 'Organizations',

      'subscription-plans': 'Subscription Plans',

      promotions: 'Promotions',

      menus: 'Menu Management',

      roles: 'Role Management',

      'feature-catalog': 'Feature Catalog',

      'tenant-health': 'Tenant Health',

      'platform-health': 'Tenant Health',

      'migration-center': 'Migration Center',

      'audit-center': 'Audit Center'

    };



    if (!page) {

      return [root];

    }



    const pageLabel = pageLabels[page] ?? this.titleCase(page.replace(/-/g, ' '));

    const labels = root ? [root, pageLabel] : [pageLabel];



    if (page === 'customers') {

      if (child === 'new') labels.push('Create Customer');

      else if (child === 'archived') labels.push('Archive');

      else if (grandchild === 'edit') labels.push('Edit Customer');

      else if (child) labels.push('Customer Details');

      return labels;

    }



    if (page === 'organizations') {

      if (child === 'create') labels.push(this.router.parseUrl(this.router.url).queryParams['orgId'] ? 'Edit Organization' : 'Add Organization');

      else if (child) labels.push('Organization Details');

      return labels;

    }



    if (page === 'subscription-plans' && child) {

      labels.push(child === 'create' ? 'Create Plan' : 'Plan Details');

      return labels;

    }



    if (grandchild) {

      labels.push(this.titleCase(grandchild));

    }



    return labels;

  }

  private tenantCrumbLink(label: string): string[] {
    const links: Record<string, string[]> = {
      'Platform Catalog': ['/app/tenant-management/menus'],
      Subscriptions: ['/app/tenant-management/subscription-plans'],
      'Tenant Management': ['/app/tenant-management/tenant-health'],
      Dashboard: ['/app'],
      Customers: ['/app/tenant-management/customers'],
      Organizations: ['/app/tenant-management/organizations'],
      'Subscription Plans': ['/app/tenant-management/subscription-plans'],
      Promotions: ['/app/tenant-management/promotions'],
      'Menu Management': ['/app/tenant-management/menus'],
      'Role Management': ['/app/tenant-management/roles'],
      'Feature Catalog': ['/app/tenant-management/feature-catalog'],
      'Tenant Health': ['/app/tenant-management/tenant-health'],
      'Migration Center': ['/app/tenant-management/migration-center'],
      'Audit Center': ['/app/tenant-management/audit-center']
    };
    return links[label] ?? ['/app'];
  }

  private accessManagementLabels(segments: string[]): string[] {

    const page = segments[2] ?? '';

    const child = segments[3] ?? '';

    const root = 'Access Management';



    const pageLabels: Record<string, string> = {
      menus: 'Feature Catalog',
      'feature-catalog': 'Feature Catalog',
      responsibilities: 'Responsibilities',
      users: 'Users',
      'security-policy': 'Security Policy',
      'login-history': 'Login History'
    };



    if (!page) {

      return [root];

    }



    const labels = [root, pageLabels[page] ?? this.titleCase(page)];

    if (child) {

      labels.push(page === 'responsibilities' ? 'Menu Assignment' : page === 'users' ? 'User Access' : this.titleCase(child));

    }

    return labels;

  }



  private routePageLabel(workspace: string, page: string): string {

    if (!page) {

      return workspace === 'fees' ? 'Dashboard' : '';

    }



    const labels: Record<string, Record<string, string>> = {

      organization: { '': 'Organization Profile' },

      'organization-profile': { '': 'Organization Profile' },

      admin: { dashboard: 'Dashboard', access: 'Access Control', monitoring: 'Monitoring', audit: 'Audit Center' },

      students: { dashboard: 'Dashboard', directory: 'Directory', 'add-student': 'Add Student' },

      admissions: {
        overview: 'Overview',
        leads: 'Leads',
        'follow-ups': 'Follow-ups',
        applications: 'Applications',
        settings: 'Settings',
        lead: 'Lead',
        form: 'Application form',
        wizard: 'Application form'
      },

      staff: { dashboard: 'Dashboard', directory: 'Directory' },

      attendance: { dashboard: 'Dashboard', students: 'Student Attendance', staff: 'Staff Attendance' },

      fees: { dashboard: 'Dashboard' },

      communication: { announcements: 'Announcements', templates: 'Templates', conversations: 'Conversations', notices: 'Notices' }

    };



    return labels[workspace]?.[page] ?? this.titleCase(page);

  }



  private crumbLink(segments: string[], index: number): string[] | null {

    if (segments[0] !== 'app') {

      return null;

    }



    const workspace = segments[1];

    const page = segments[2];

    const child = segments[3];



    if (workspace === 'tenant-management') {

      if (index === 0) {

        return ['/app'];

      }

      if (index === 1 && page === 'customers') {

        return ['/app/tenant-management/customers'];

      }

      if (index === 1 && page === 'organizations') {

        return ['/app/tenant-management/organizations'];

      }

      if (index === 1 && page) {

        return [`/app/tenant-management/${page}`];

      }

      if (index === 2 && page === 'customers' && child && child !== 'new' && child !== 'archived' && child !== 'edit') {

        return ['/app/tenant-management/customers', child];

      }

    }



    if (workspace === 'access-management') {

      if (index === 0) {

        return ['/app/access-management/users'];

      }

      if (index === 1 && page) {

        return [`/app/access-management/${page}`];

      }

    }



    if (workspace === 'students' && page === 'add-student' && index === 0) {
      return ['/app/students/directory'];
    }

    if (index === 0) {

      return ['/app'];

    }



    return null;

  }



  private titleCase(value: string): string {

    return value

      .replace(/[-_]+/g, ' ')

      .replace(/\b\w/g, char => char.toUpperCase());

  }

}


