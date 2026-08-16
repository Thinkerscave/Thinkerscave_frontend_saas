import { Injectable, OnDestroy, computed, signal } from '@angular/core';

export type SidebarViewport = 'desktop' | 'tablet' | 'mobile';

/**
 * Single source of truth for application-shell sidebar state.
 *
 * Desktop:
 *   - collapsed (default): icon rail in document flow
 *   - hover: temporary flyout over content (does not resize layout)
 *   - pinned: expanded rail in document flow (main content resizes)
 *
 * Tablet / mobile:
 *   - drawer overlay only (no permanent in-flow expand)
 */
@Injectable({ providedIn: 'root' })
export class SidebarLayoutService implements OnDestroy {
  private readonly hoverExpanded = signal(false);
  private readonly pinned = signal(false);
  private readonly mobileDrawerOpen = signal(false);
  private readonly viewport = signal<SidebarViewport>(this.detectViewport());
  private readonly canHoverExpand = signal(this.detectHoverCapability());

  private mediaCleanups: Array<() => void> = [];

  constructor() {
    this.bindMedia();
  }

  ngOnDestroy(): void {
    for (const cleanup of this.mediaCleanups) {
      cleanup();
    }
    this.mediaCleanups = [];
  }

  /** Labels / flyout should be visible. */
  readonly displayExpanded = computed(() => {
    const vp = this.viewport();
    if (vp !== 'desktop') {
      return this.mobileDrawerOpen();
    }
    return this.pinned() || (this.canHoverExpand() && this.hoverExpanded());
  });

  /** Desktop permanent expand — participates in layout width. */
  readonly isPinned = computed(() => this.viewport() === 'desktop' && this.pinned());

  /** Temporary hover flyout (desktop only, not when pinned). */
  readonly isHoverFlyout = computed(
    () =>
      this.viewport() === 'desktop'
      && !this.pinned()
      && this.canHoverExpand()
      && this.hoverExpanded()
  );

  readonly isMobileDrawerOpen = computed(
    () => this.viewport() !== 'desktop' && this.mobileDrawerOpen()
  );

  readonly currentViewport = computed(() => this.viewport());

  /** Layout column width the shell should reserve for the sidebar. */
  readonly layoutWidthMode = computed<'compact' | 'expanded' | 'hidden'>(() => {
    const vp = this.viewport();
    if (vp !== 'desktop') {
      return 'hidden';
    }
    return this.pinned() ? 'expanded' : 'compact';
  });

  /** @deprecated Use isPinned — kept for existing call sites during migration. */
  readonly isTabletPinned = computed(() => this.isPinned());

  setHovered(value: boolean): void {
    if (this.viewport() !== 'desktop' || this.pinned() || !this.canHoverExpand()) {
      return;
    }
    this.hoverExpanded.set(value);
  }

  togglePinned(): void {
    if (this.viewport() !== 'desktop') {
      this.toggleMobileDrawer();
      return;
    }
    this.pinned.update(v => !v);
    if (this.pinned()) {
      this.hoverExpanded.set(false);
    }
  }

  /** @deprecated Prefer togglePinned */
  toggleTabletPinned(): void {
    this.togglePinned();
  }

  openMobileDrawer(): void {
    if (this.viewport() === 'desktop') {
      return;
    }
    this.mobileDrawerOpen.set(true);
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
  }

  toggleMobileDrawer(): void {
    if (this.viewport() === 'desktop') {
      this.togglePinned();
      return;
    }
    this.mobileDrawerOpen.update(v => !v);
  }

  /** Top-bar / shell menu control. */
  toggleShellNavigation(): void {
    if (this.viewport() === 'desktop') {
      this.togglePinned();
      return;
    }
    this.toggleMobileDrawer();
  }

  /** Close overlay drawers after route changes — never clears desktop pin. */
  onNavigated(): void {
    if (this.viewport() !== 'desktop') {
      this.closeMobileDrawer();
    }
  }

  private bindMedia(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const tabletMq = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');

    const sync = (): void => {
      const next = this.detectViewport();
      const prev = this.viewport();
      this.viewport.set(next);
      this.canHoverExpand.set(hoverMq.matches && next === 'desktop');

      if (next !== 'desktop') {
        this.pinned.set(false);
        this.hoverExpanded.set(false);
      } else {
        this.mobileDrawerOpen.set(false);
      }

      if (prev !== next) {
        // Viewport class change is enough; consumers read signals.
      }
    };

    const listen = (mq: MediaQueryList, handler: () => void): void => {
      mq.addEventListener('change', handler);
      this.mediaCleanups.push(() => mq.removeEventListener('change', handler));
    };

    listen(desktopMq, sync);
    listen(tabletMq, sync);
    listen(hoverMq, sync);
    sync();
  }

  private detectViewport(): SidebarViewport {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'desktop';
    }
    if (window.matchMedia('(min-width: 1024px)').matches) {
      return 'desktop';
    }
    if (window.matchMedia('(min-width: 768px)').matches) {
      return 'tablet';
    }
    return 'mobile';
  }

  private detectHoverCapability(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return true;
    }
    return (
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
      && window.matchMedia('(min-width: 1024px)').matches
    );
  }
}
