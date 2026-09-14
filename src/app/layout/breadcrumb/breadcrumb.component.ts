import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AppPageHeader, BreadCrumbService } from '../../core/services/bread-crumb.service';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { PageMetaService } from '../../core/services/page-meta.service';
import { LoginService } from '../../core/services/login.service';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { workspaceHomeForUser } from '../../core/utils/workspace-home';

/** Shell page chrome: title + description + top-right breadcrumb. Back/actions live in tc-saas-page-header. */
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
  private readonly pageMeta = inject(PageMetaService);
  private readonly history = inject(NavigationHistoryService);
  private readonly loginService = inject(LoginService);
  private readonly menus = inject(MenuMappingService);

  private pageOverride: AppPageHeader | null = null;

  ngOnInit(): void {
    this.home = {
      icon: 'pi pi-home',
      routerLink: [workspaceHomeForUser(this.loginService.getUser(), this.loginService.getLoginContext() === 'PLATFORM')]
    };

    this.pageHeaderService.pageHeader$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(header => {
        this.pageOverride = header;
        this.refreshHeader();
      });

    this.menus.loadMenu()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshHeader());

    this.refreshHeader();

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
      this.refreshHeader();
    });
  }

  private refreshHeader(): void {
    const meta = this.pageMeta.resolve(this.pageOverride, this.history.hasPrevious());
    this.title = meta.title;
    this.subtitle = meta.subtitle;
    this.items = meta.crumbs.map(crumb =>
      crumb.link ? { label: crumb.label, routerLink: crumb.link } : { label: crumb.label }
    );
    this.cdr.markForCheck();
  }
}
