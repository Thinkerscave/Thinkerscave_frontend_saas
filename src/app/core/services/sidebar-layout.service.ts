import { Injectable, computed, signal } from '@angular/core';

/**
 * Coordinates sidebar hover / pin / mobile drawer state across layout shell components.
 */
@Injectable({ providedIn: 'root' })
export class SidebarLayoutService {
  private readonly hoverExpanded = signal(false);
  private readonly tabletPinned = signal(false);
  private readonly mobileDrawerOpen = signal(false);

  /** True when pointer hover should drive expand (desktop with fine pointer). */
  readonly hoverExpandEnabled = signal(this.detectHoverExpand());

  readonly displayExpanded = computed(() => {
    if (this.mobileDrawerOpen()) {
      return true;
    }
    if (this.tabletPinned()) {
      return true;
    }
    return this.hoverExpandEnabled() && this.hoverExpanded();
  });

  readonly isMobileDrawerOpen = computed(() => this.mobileDrawerOpen());

  readonly isTabletPinned = computed(() => this.tabletPinned());

  setHovered(value: boolean): void {
    if (!this.hoverExpandEnabled()) {
      return;
    }
    this.hoverExpanded.set(value);
  }

  toggleTabletPinned(): void {
    this.tabletPinned.update(v => !v);
  }

  openMobileDrawer(): void {
    this.mobileDrawerOpen.set(true);
  }

  closeMobileDrawer(): void {
    this.mobileDrawerOpen.set(false);
    this.tabletPinned.set(false);
  }

  toggleMobileDrawer(): void {
    this.mobileDrawerOpen.update(v => !v);
  }

  /** Tablet menu button (768–1023px) or optional desktop pin. */
  toggleShellNavigation(): void {
    if (this.isMobileViewport()) {
      this.toggleMobileDrawer();
      return;
    }
    this.toggleTabletPinned();
  }

  private isMobileViewport(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  }

  private detectHoverExpand(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return true;
    }
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const wideEnough = window.matchMedia('(min-width: 1024px)').matches;
    return finePointer && wideEnough;
  }
}
