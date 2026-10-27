import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { BreadCrumbService } from '../../../core/services/bread-crumb.service';
import { BackNavigationService } from '../../../core/services/back-navigation.service';
import { NavigationHistoryService } from '../../../core/services/navigation-history.service';
import { PageMetaService } from '../../../core/services/page-meta.service';

export interface SaasBreadcrumb { label: string; route?: string; }

/**
 * Compact body toolbar: Back (detail pages) + actions, right-aligned.
 * Title / description / breadcrumb stay in the layout shell.
 */
@Component({
  selector: 'tc-saas-page-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #actionsTemplate>
      <div class="saas-page-header saas-page-header--toolbar">
        <div class="saas-page-header__actions">
          <button
            *ngIf="showBack"
            type="button"
            class="tc-btn tc-btn--outline tc-btn--sm tc-btn--back"
            (click)="goBack()">
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            Back
          </button>
          <ng-content></ng-content>
        </div>
      </div>
    </ng-template>
    <ng-container *ngIf="!shellActions">
      <ng-container *ngTemplateOutlet="actionsTemplate"></ng-container>
    </ng-container>
  `
})
export class SaasPageHeaderComponent implements OnInit, OnChanges, OnDestroy {
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly backNav = inject(BackNavigationService);
  private readonly pageMeta = inject(PageMetaService);
  private readonly history = inject(NavigationHistoryService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly actions = inject(BreadCrumbService);

  @ViewChild('actionsTemplate', { static: true })
  private actionsTemplate!: TemplateRef<unknown>;

  /** Render the page toolbar in the shared shell header instead of the page body. */
  @Input() shellActions = false;
  /** @deprecated Title belongs in the layout shell via route pageTitle. */
  @Input() showTitle = false;
  /** @deprecated Do not set entity names as the global page title. */
  @Input() title = '';
  /** Dynamic subtitle override for the shell header. */
  @Input() subtitle?: string;
  /** @deprecated Breadcrumbs are rendered once in the layout shell. */
  @Input() breadcrumbs: SaasBreadcrumb[] = [];

  showBack = false;
  private backFallback: string | string[] | null = null;

  ngOnInit(): void {
    this.syncShellActions();
    this.refreshBack();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.refreshBack());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('shellActions' in changes && this.actionsTemplate) {
      this.syncShellActions();
    }
    if ('subtitle' in changes && this.subtitle) {
      this.pageHeader.setPageHeader({ subtitle: this.subtitle });
    }
  }

  ngOnDestroy(): void {
    this.actions.clearActions(this.actionsTemplate);
  }

  goBack(): void {
    this.backNav.back({ fallback: this.backFallback ?? undefined });
  }

  private refreshBack(): void {
    const meta = this.pageMeta.resolve(null, this.history.hasPrevious());
    this.showBack = meta.showBack;
    this.backFallback = meta.backFallback;
    this.cdr.markForCheck();
  }

  private syncShellActions(): void {
    if (this.shellActions) {
      this.actions.setActions(this.actionsTemplate);
    } else {
      this.actions.clearActions(this.actionsTemplate);
    }
  }
}
